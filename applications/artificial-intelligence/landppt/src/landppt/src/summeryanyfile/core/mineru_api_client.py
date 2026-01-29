"""
MinerU API 客户端 - 使用 MinerU 在线 API 进行 PDF 转换
基于 https://mineru.net/apiManage/docs

API 端点: https://mineru.net/api/v4/extract/task
认证方式: Bearer Token
"""

import asyncio
import base64
import logging
import os
import time
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

import httpx

logger = logging.getLogger(__name__)


class MineruAPIClient:
    """
    MinerU 在线 API 客户端
    
    使用 MinerU 云端服务进行 PDF 解析，支持：
    - 高质量 PDF 文本提取
    - OCR 识别（支持 109 种语言）
    - 表格识别
    - 公式识别（LaTeX 格式）
    
    使用前需要配置环境变量:
        MINERU_API_KEY: API 密钥（从 https://mineru.net/apiManage 获取）
        MINERU_BASE_URL: API 基础地址（可选，默认为官方地址）
    """
    
    DEFAULT_BASE_URL = "https://mineru.net/api/v4"
    TASK_ENDPOINT = "/extract/task"
    RESULT_ENDPOINT = "/extract/task/{task_id}"
    FILE_URLS_BATCH_ENDPOINT = "/file-urls/batch"
    BATCH_RESULTS_ENDPOINT = "/extract-results/batch/{batch_id}"
    
    # 轮询配置
    DEFAULT_POLL_INTERVAL = 3  # 秒
    DEFAULT_MAX_WAIT_TIME = 300  # 秒（5分钟）
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 60.0
    ):
        """
        初始化 API 客户端
        
        Args:
            api_key: API 密钥，如果为 None 则从环境变量 MINERU_API_KEY 读取
            base_url: API 基础地址，如果为 None 则从环境变量 MINERU_BASE_URL 读取
            timeout: HTTP 请求超时时间（秒）
        """
        raw_key = api_key or os.getenv("MINERU_API_KEY", "")
        raw_key = (raw_key or "").strip().strip("\"'").strip()
        # Users sometimes paste a full header value like "Bearer xxx". The API expects the token only.
        if raw_key.lower().startswith("bearer "):
            raw_key = raw_key[7:].strip()
        if raw_key.lower().startswith("authorization:"):
            raw_key = raw_key.split(":", 1)[1].strip()
            if raw_key.lower().startswith("bearer "):
                raw_key = raw_key[7:].strip()

        self.api_key = raw_key
        self.base_url = base_url or os.getenv("MINERU_BASE_URL", "") or self.DEFAULT_BASE_URL
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
        
        if self.api_key:
            logger.info(f"MinerU API 客户端初始化成功，Base URL: {self.base_url}")
        else:
            logger.warning("未配置 MINERU_API_KEY，MinerU API 功能将不可用")
    
    @property
    def is_available(self) -> bool:
        """检查 API 是否可用（API Key 是否已配置）"""
        return bool(self.api_key)
    
    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def _get_client(self) -> httpx.AsyncClient:
        """获取或创建 HTTP 客户端"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=self._get_headers(),
                timeout=self.timeout
            )
        return self._client
    
    async def close(self):
        """关闭 HTTP 客户端"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
    
    async def create_task_from_file(
        self,
        file_path: str,
        enable_ocr: bool = True,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "ch"
    ) -> str:
        """
        从本地文件创建解析任务
        
        Args:
            file_path: 本地 PDF 文件路径
            enable_ocr: 是否启用 OCR
            enable_formula: 是否启用公式识别
            enable_table: 是否启用表格识别
            language: 语言设置（ch=中文, en=英文）
        
        Returns:
            任务 ID
        
        Raises:
            FileNotFoundError: 文件不存在
            ValueError: API 调用失败
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        file_name = path.name

        # Per MinerU docs, /extract/task does not support direct file upload.
        # The correct flow for local files is:
        # 1) POST /file-urls/batch to get a presigned upload URL
        # 2) PUT the file bytes to that URL (no Content-Type header)
        # 3) Poll /extract-results/batch/{batch_id} until done, then download result
        batch_id = await self._apply_upload_url_for_file(
            file_name=file_name,
            enable_ocr=enable_ocr,
            enable_formula=enable_formula,
            enable_table=enable_table,
            language=language,
        )
        await self._upload_file_to_batch(batch_id=batch_id, file_path=file_path, file_name=file_name)
        return batch_id

    async def _apply_upload_url_for_file(
        self,
        *,
        file_name: str,
        enable_ocr: bool,
        enable_formula: bool,
        enable_table: bool,
        language: str,
        model_version: str = "pipeline",
    ) -> str:
        """Request a presigned upload URL for a single file and return batch_id."""
        if not self.is_available:
            raise ValueError("MinerU API Key 未配置，请设置环境变量 MINERU_API_KEY")

        client = await self._get_client()
        payload: Dict[str, Any] = {
            "files": [{"name": file_name, "is_ocr": bool(enable_ocr)}],
            "model_version": model_version,
            "enable_formula": bool(enable_formula),
            "enable_table": bool(enable_table),
            "language": language,
        }

        try:
            response = await client.post(self.FILE_URLS_BATCH_ENDPOINT, json=payload)
            response.raise_for_status()
            result = response.json()
        except httpx.HTTPStatusError as e:
            body = None
            try:
                body = e.response.text
            except Exception:
                body = None
            logger.error(f"MinerU API HTTP 错误: {e.response.status_code}, body={body}")
            raise ValueError(f"MinerU API 请求失败: HTTP {e.response.status_code}")

        if result.get("code") != 0:
            raise ValueError(f"MinerU API 错误: {result.get('msg', '未知错误')}")

        data = result.get("data") or {}
        batch_id = data.get("batch_id")
        if not batch_id:
            raise ValueError("MinerU API 返回无效的 batch_id")

        file_urls = data.get("file_urls") or []
        if not file_urls or not isinstance(file_urls, list):
            raise ValueError("MinerU API 未返回上传地址 file_urls")

        # Save for later lookup in _upload_file_to_batch
        self._pending_file_urls = getattr(self, "_pending_file_urls", {})
        self._pending_file_urls[batch_id] = {file_name: file_urls[0]}

        return batch_id

    async def _upload_file_to_batch(self, *, batch_id: str, file_path: str, file_name: str) -> None:
        """Upload file bytes to the presigned URL obtained from /file-urls/batch."""
        pending = getattr(self, "_pending_file_urls", {}).get(batch_id) or {}
        upload_url = pending.get(file_name)
        if not upload_url:
            raise ValueError("未找到上传地址，请先调用 /file-urls/batch 获取 file_urls")

        # IMPORTANT: upload_url is a presigned URL; do not include MinerU auth headers or Content-Type.
        # httpx.AsyncClient cannot send a sync file object as the request body; stream bytes asynchronously.
        async def _iter_file_bytes(path: str, chunk_size: int = 1024 * 1024):
            import anyio

            async with await anyio.open_file(path, "rb") as f:
                while True:
                    chunk = await f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk

        timeout = httpx.Timeout(self.timeout)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as upload_client:
            resp = await upload_client.put(upload_url, content=_iter_file_bytes(file_path))
            try:
                resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                body = None
                try:
                    body = e.response.text
                except Exception:
                    body = None
                logger.error(f"MinerU 上传失败: HTTP {e.response.status_code}, body={body}")
                raise ValueError(f"MinerU 上传失败: HTTP {e.response.status_code}")

    async def get_batch_results(self, batch_id: str) -> Dict[str, Any]:
        """Get batch extraction results."""
        client = await self._get_client()
        endpoint = self.BATCH_RESULTS_ENDPOINT.format(batch_id=batch_id)
        try:
            response = await client.get(endpoint)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            body = None
            try:
                body = e.response.text
            except Exception:
                body = None
            logger.error(f"MinerU API HTTP 错误: {e.response.status_code}, body={body}")
            raise ValueError(f"MinerU API 请求失败: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"获取批量结果失败: {e}")
            raise ValueError(f"获取批量结果失败: {e}")

    async def wait_for_batch_result(
        self,
        batch_id: str,
        *,
        file_name: str,
        poll_interval: float = DEFAULT_POLL_INTERVAL,
        max_wait_time: float = DEFAULT_MAX_WAIT_TIME,
    ) -> Dict[str, Any]:
        """Wait for a single file in a batch to finish and return its result entry."""
        start_time = time.time()
        while True:
            elapsed = time.time() - start_time
            if elapsed > max_wait_time:
                raise TimeoutError(f"等待批量任务完成超时 ({max_wait_time}秒)")

            result = await self.get_batch_results(batch_id)
            if result.get("code") != 0:
                raise ValueError(f"MinerU API 错误: {result.get('msg', '未知错误')}")

            data = result.get("data") or {}
            extract_results = data.get("extract_result") or []
            entry = None
            for item in extract_results:
                if isinstance(item, dict) and item.get("file_name") == file_name:
                    entry = item
                    break

            if not entry:
                await asyncio.sleep(poll_interval)
                continue

            state = entry.get("state")
            if state == "done":
                return entry
            if state == "failed":
                raise ValueError(f"MinerU 解析失败: {entry.get('err_msg', '任务执行失败')}")

            await asyncio.sleep(poll_interval)
    
    async def create_task_from_url(
        self,
        pdf_url: str,
        enable_ocr: bool = True,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "ch"
    ) -> str:
        """
        从 URL 创建解析任务
        
        Args:
            pdf_url: PDF 文件的 URL
            enable_ocr: 是否启用 OCR
            enable_formula: 是否启用公式识别
            enable_table: 是否启用表格识别
            language: 语言设置
        
        Returns:
            任务 ID
        """
        logger.info(f"创建 MinerU 解析任务 (URL): {pdf_url}")
        
        payload = {
            "url": pdf_url,
            "is_ocr": enable_ocr,
            "enable_formula": enable_formula,
            "enable_table": enable_table,
            "language": language,
            "model_version": "pipeline",
        }
        
        return await self._create_task(payload)
    
    async def _create_task(self, payload: Dict[str, Any]) -> str:
        """
        创建解析任务
        
        Args:
            payload: 请求体
        
        Returns:
            任务 ID
        """
        if not self.is_available:
            raise ValueError("MinerU API Key 未配置，请设置环境变量 MINERU_API_KEY")
        
        client = await self._get_client()
        
        try:
            response = await client.post(self.TASK_ENDPOINT, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("code") != 0:
                error_msg = result.get("msg", "未知错误")
                raise ValueError(f"MinerU API 错误: {error_msg}")
            
            task_id = result.get("data", {}).get("task_id")
            if not task_id:
                raise ValueError("MinerU API 返回无效的任务 ID")
            
            logger.info(f"任务创建成功: {task_id}")
            return task_id
            
        except httpx.HTTPStatusError as e:
            body = None
            try:
                body = e.response.text
            except Exception:
                body = None
            logger.error(f"MinerU API HTTP 错误: {e.response.status_code}, body={body}")
            raise ValueError(f"MinerU API 请求失败: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"MinerU API 调用失败: {e}")
            raise ValueError(f"MinerU API 调用失败: {e}")
    
    async def get_task_result(self, task_id: str) -> Dict[str, Any]:
        """
        获取任务结果
        
        Args:
            task_id: 任务 ID
        
        Returns:
            任务状态和结果
        """
        client = await self._get_client()
        
        try:
            endpoint = self.RESULT_ENDPOINT.format(task_id=task_id)
            response = await client.get(endpoint)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"获取任务结果失败: {e}")
            raise ValueError(f"获取任务结果失败: {e}")
    
    async def wait_for_result(
        self,
        task_id: str,
        poll_interval: float = DEFAULT_POLL_INTERVAL,
        max_wait_time: float = DEFAULT_MAX_WAIT_TIME
    ) -> Dict[str, Any]:
        """
        等待任务完成并获取结果
        
        Args:
            task_id: 任务 ID
            poll_interval: 轮询间隔（秒）
            max_wait_time: 最大等待时间（秒）
        
        Returns:
            任务结果
        
        Raises:
            TimeoutError: 超时
            ValueError: 任务失败
        """
        start_time = time.time()
        
        while True:
            elapsed = time.time() - start_time
            if elapsed > max_wait_time:
                raise TimeoutError(f"等待任务完成超时 ({max_wait_time}秒)")
            
            result = await self.get_task_result(task_id)
            
            if result.get("code") != 0:
                error_msg = result.get("msg", "未知错误")
                raise ValueError(f"MinerU API 错误: {error_msg}")
            
            data = result.get("data", {})
            status = data.get("state")
            
            if status == "done":
                logger.info(f"任务完成: {task_id} (耗时 {elapsed:.1f}秒)")
                return data
            elif status == "failed":
                error_msg = data.get("err_msg", "任务执行失败")
                raise ValueError(f"MinerU 解析失败: {error_msg}")
            else:
                logger.debug(f"任务进行中: {task_id}, 状态: {status}, 已等待: {elapsed:.1f}秒")
                await asyncio.sleep(poll_interval)
    
    async def extract_markdown(
        self,
        file_path: Optional[str] = None,
        pdf_url: Optional[str] = None,
        enable_ocr: bool = True,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "ch"
    ) -> Tuple[str, Dict[str, Any]]:
        """
        提取 PDF 内容并转换为 Markdown
        
        Args:
            file_path: 本地文件路径（与 pdf_url 二选一）
            pdf_url: PDF URL（与 file_path 二选一）
            enable_ocr: 是否启用 OCR
            enable_formula: 是否启用公式识别
            enable_table: 是否启用表格识别
            language: 语言设置
        
        Returns:
            (Markdown 内容, 额外信息)
        """
        if not file_path and not pdf_url:
            raise ValueError("必须提供 file_path 或 pdf_url")
        
        if file_path:
            batch_id = await self.create_task_from_file(
                file_path, enable_ocr, enable_formula, enable_table, language
            )
            file_name = Path(file_path).name
            entry = await self.wait_for_batch_result(batch_id, file_name=file_name)
            md_url = entry.get("full_zip_url") or entry.get("md_url")
            markdown_content = await self._download_markdown(md_url) if md_url else ""
            extra_info = {
                "batch_id": batch_id,
                "file_name": file_name,
                "state": entry.get("state"),
            }
            return markdown_content, extra_info

        task_id = await self.create_task_from_url(
            pdf_url, enable_ocr, enable_formula, enable_table, language
        )
        result = await self.wait_for_result(task_id)
        md_url = result.get("full_zip_url") or result.get("md_url")
        markdown_content = await self._download_markdown(md_url) if md_url else result.get("markdown", "")
        extra_info = {
            "task_id": task_id,
            "pages": result.get("pages", 0),
            "processing_time": result.get("processing_time"),
        }
        return markdown_content, extra_info
    
    async def _download_markdown(self, url: str) -> str:
        """
        从 URL 下载 Markdown 内容
        
        Args:
            url: Markdown 文件 URL
        
        Returns:
            Markdown 内容
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Detect zip payload (MinerU often returns a zip containing md + images)
                content_type = (response.headers.get("content-type") or "").lower()
                is_zip = url.endswith(".zip") or "zip" in content_type or response.content[:2] == b"PK"

                if not is_zip:
                    return response.text

                import io
                import zipfile

                zip_buffer = io.BytesIO(response.content)
                with zipfile.ZipFile(zip_buffer, "r") as zip_file:
                    names = [n for n in zip_file.namelist() if n and not n.endswith("/")]

                    md_candidates = [n for n in names if n.lower().endswith(".md")]
                    if not md_candidates:
                        return ""

                    # Prefer the "main" md by shortest path (usually at root), then lexicographically.
                    md_name = sorted(md_candidates, key=lambda n: (len(n.split("/")), len(n), n))[0]
                    markdown_content = zip_file.read(md_name).decode("utf-8", errors="replace")

                    # Collect image assets
                    image_exts = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg")
                    images: Dict[str, bytes] = {}
                    for name in names:
                        lower = name.lower()
                        if lower.endswith(image_exts):
                            try:
                                images[name.replace("\\", "/")] = zip_file.read(name)
                            except Exception:
                                continue

                if images:
                    markdown_content = await self._upload_zip_images_to_local_gallery_and_replace_links(
                        markdown_content, images
                    )

                return markdown_content
                     
        except Exception as e:
            logger.error(f"下载 Markdown 内容失败: {e}")
            return ""

    async def _upload_zip_images_to_local_gallery_and_replace_links(
        self,
        markdown_content: str,
        images: Dict[str, bytes],
    ) -> str:
        """
        Upload images extracted from MinerU zip into LandPPT local image gallery and
        replace markdown image links with the gallery URLs.

        If LandPPT image service is unavailable, returns markdown content unchanged.
        """
        try:
            from landppt.services.image.image_service import get_image_service
            from landppt.services.image.models import ImageUploadRequest
            from landppt.services.url_service import build_image_url
        except Exception:
            return markdown_content

        import hashlib
        import mimetypes
        from pathlib import Path

        image_service = get_image_service()

        def _candidate_refs(zip_path: str) -> set[str]:
            p = (zip_path or "").replace("\\", "/").lstrip("/")
            candidates = {p}
            if p.startswith("./"):
                candidates.add(p[2:])
            else:
                candidates.add("./" + p)

            # Common MinerU md uses "images/<name>" even if the zip stores deeper paths.
            base = Path(p).name
            if base:
                candidates.add("images/" + base)
                candidates.add("./images/" + base)
                candidates.add(base)
            return {c for c in candidates if c}

        def _replace_ref(text: str, old: str, new: str) -> str:
            if old not in text:
                return text
            # Markdown image/link
            text = text.replace(f"]({old})", f"]({new})")
            text = text.replace(f"]({old} ", f"]({new} ")
            # HTML img src
            text = text.replace(f'src="{old}"', f'src="{new}"')
            text = text.replace(f"src='{old}'", f"src='{new}'")
            # Fallback
            return text.replace(old, new)

        # Upload referenced images and replace links
        for zip_path, data in images.items():
            if not data:
                continue

            candidates = _candidate_refs(zip_path)
            if not any(c in markdown_content for c in candidates):
                continue

            content_hash = hashlib.sha256(data).hexdigest()[:16]
            ext = Path(zip_path).suffix.lower() or ".png"
            filename = f"mineru_{content_hash}{ext}"
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            if not content_type.startswith("image/"):
                # Best-effort default
                content_type = "image/" + (ext.lstrip(".") or "png")

            upload_request = ImageUploadRequest(
                filename=filename,
                content_type=content_type,
                file_size=len(data),
                title=Path(filename).stem,
                description="Imported from MinerU zip",
                tags=["mineru"],
                category="local_storage",
            )

            try:
                result = await image_service.upload_image(upload_request, data)
            except Exception as e:
                logger.warning(f"Failed to upload MinerU image {zip_path}: {e}")
                continue

            if not result or not result.success or not result.image_info:
                logger.warning(f"Failed to upload MinerU image {zip_path}: {getattr(result, 'message', '')}")
                continue

            new_url = build_image_url(result.image_info.image_id)
            for old in candidates:
                markdown_content = _replace_ref(markdown_content, old, new_url)

        return markdown_content
    
    def extract_markdown_sync(
        self,
        file_path: Optional[str] = None,
        pdf_url: Optional[str] = None,
        enable_ocr: bool = True,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "ch"
    ) -> Tuple[str, Dict[str, Any]]:
        """
        同步版本的 extract_markdown
        
        适用于非异步环境
        """
        # NOTE: This sync wrapper may be called from within an already-running event loop
        # (e.g. FastAPI / async pipelines). In that case, asyncio.run() would raise:
        # "asyncio.run() cannot be called from a running event loop".
        # We run the coroutine in a dedicated thread with its own event loop to keep
        # the API sync-friendly while remaining safe in async contexts.
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(self.extract_markdown(
                file_path=file_path,
                pdf_url=pdf_url,
                enable_ocr=enable_ocr,
                enable_formula=enable_formula,
                enable_table=enable_table,
                language=language
            ))

        import threading

        result_container: Dict[str, Any] = {}
        error_container: Dict[str, BaseException] = {}

        def _runner():
            try:
                result_container["result"] = asyncio.run(self.extract_markdown(
                    file_path=file_path,
                    pdf_url=pdf_url,
                    enable_ocr=enable_ocr,
                    enable_formula=enable_formula,
                    enable_table=enable_table,
                    language=language
                ))
            except BaseException as e:
                error_container["error"] = e

        t = threading.Thread(target=_runner, daemon=True)
        t.start()
        t.join()

        if "error" in error_container:
            raise error_container["error"]

        return result_container["result"]


# 便捷函数
def get_mineru_client() -> MineruAPIClient:
    """获取 MinerU API 客户端实例"""
    return MineruAPIClient()


def is_mineru_available() -> bool:
    """检查 MinerU API 是否可用"""
    return MineruAPIClient().is_available
