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
        self.api_key = api_key or os.getenv("MINERU_API_KEY", "")
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
        
        # 读取文件并转换为 base64
        with open(path, "rb") as f:
            file_content = f.read()
        
        file_base64 = base64.b64encode(file_content).decode("utf-8")
        file_name = path.name
        
        logger.info(f"创建 MinerU 解析任务: {file_name} ({len(file_content)} bytes)")
        
        payload = {
            "file": file_base64,
            "file_name": file_name,
            "is_ocr": enable_ocr,
            "enable_formula": enable_formula,
            "enable_table": enable_table,
            "language": language
        }
        
        return await self._create_task(payload)
    
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
            "language": language
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
            logger.error(f"MinerU API HTTP 错误: {e.response.status_code}")
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
        
        # 创建任务
        if file_path:
            task_id = await self.create_task_from_file(
                file_path, enable_ocr, enable_formula, enable_table, language
            )
        else:
            task_id = await self.create_task_from_url(
                pdf_url, enable_ocr, enable_formula, enable_table, language
            )
        
        # 等待结果
        result = await self.wait_for_result(task_id)
        
        # 提取 Markdown 内容
        md_url = result.get("full_zip_url") or result.get("md_url")
        
        if md_url:
            # 如果返回的是 URL，需要下载内容
            markdown_content = await self._download_markdown(md_url)
        else:
            # 直接从结果中获取
            markdown_content = result.get("markdown", "")
        
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
                
                # 检查是否是 zip 文件
                if url.endswith(".zip"):
                    # 解压并提取 .md 文件
                    import io
                    import zipfile
                    
                    zip_buffer = io.BytesIO(response.content)
                    with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
                        for name in zip_file.namelist():
                            if name.endswith('.md'):
                                return zip_file.read(name).decode('utf-8')
                    
                    return ""
                else:
                    return response.text
                    
        except Exception as e:
            logger.error(f"下载 Markdown 内容失败: {e}")
            return ""
    
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
        return asyncio.run(self.extract_markdown(
            file_path=file_path,
            pdf_url=pdf_url,
            enable_ocr=enable_ocr,
            enable_formula=enable_formula,
            enable_table=enable_table,
            language=language
        ))


# 便捷函数
def get_mineru_client() -> MineruAPIClient:
    """获取 MinerU API 客户端实例"""
    return MineruAPIClient()


def is_mineru_available() -> bool:
    """检查 MinerU API 是否可用"""
    return MineruAPIClient().is_available
