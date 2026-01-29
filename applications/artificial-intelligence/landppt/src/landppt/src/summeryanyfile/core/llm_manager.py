"""
LLM管理器 - 处理不同LLM提供商的配置和初始化
"""

import os
from typing import Optional, Dict, Any
import logging
from pydantic import Field
from langchain_core.language_models.chat_models import BaseChatModel

logger = logging.getLogger(__name__)


class CustomChatAnthropic(BaseChatModel):
    """自定义Anthropic聊天模型，支持第三方API和双认证方式"""

    model: str = Field(default="claude-3-5-sonnet-20241022")
    temperature: float = Field(default=0.7)
    max_tokens: int = Field(default=1024)
    api_key: Optional[str] = Field(default=None)
    base_url: Optional[str] = Field(default=None)

    @property
    def _llm_type(self) -> str:
        return "custom_anthropic"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        return {
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "base_url": self.base_url
        }

    async def _agenerate(
        self,
        messages: list,
        stop: Optional[list] = None,
        run_manager: Optional[Any] = None,
        **kwargs
    ) -> Any:
        """异步生成响应"""
        import aiohttp
        import json

        logger.info(f"CustomChatAnthropic: model={self.model}, base_url={self.base_url}, api_key={self.api_key[:10] if self.api_key else None}...")

        # 检测是否是第三方API（如MiniMax）
        is_third_party = self.base_url and not self.base_url.startswith("https://api.anthropic.com")
        logger.info(f"CustomChatAnthropic: is_third_party={is_third_party}")

        # 角色映射: LangChain使用"human"/"ai"，Anthropic API使用"user"/"assistant"
        role_mapping = {
            "human": "user",
            "ai": "assistant",
            "system": "user",  # Anthropic没有system角色，转为user
            "HumanMessage": "user",
            "AIMessage": "assistant",
            "SystemMessage": "user",
        }
        
        # 转换消息格式
        claude_messages = []
        for msg in messages:
            raw_role = msg.role if hasattr(msg, 'role') else msg.type
            # 映射角色名称
            role = role_mapping.get(raw_role, raw_role)
            content = msg.content if hasattr(msg, 'content') else str(msg)

            if is_third_party:
                # MiniMax格式: content是数组
                if isinstance(content, list):
                    claude_messages.append({"role": role, "content": content})
                else:
                    claude_messages.append({"role": role, "content": [{"type": "text", "text": content}]})
            else:
                # Anthropic官方格式: content是字符串
                claude_messages.append({"role": role, "content": content})

        # 构建URL
        base_url = self.base_url or "https://api.anthropic.com"
        base_url = base_url.rstrip('/')
        if not base_url.endswith('/v1'):
            base_url = base_url + '/v1'
        url = f"{base_url}/messages"
        logger.info(f"CustomChatAnthropic: request URL={url}")

        # 构建请求体
        body = {
            "model": self.model,
            "messages": claude_messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature
        }

        # 第三方API使用流式响应
        if is_third_party:
            body["stream"] = True

        # 尝试两种认证方式
        auth_methods = [
            ("x-api-key", {"x-api-key": self.api_key}),
            ("Authorization", {"Authorization": f"Bearer {self.api_key}"})
        ]

        for auth_name, auth_header in auth_methods:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                }
                headers.update(auth_header)

                # 第三方API可能需要额外的header
                if is_third_party:
                    headers["x-title"] = "LandPPT"

                logger.info(f"CustomChatAnthropic: trying auth method={auth_name}")

                async with aiohttp.ClientSession() as session:
                    async with session.post(url, headers=headers, json=body) as response:
                        logger.info(f"CustomChatAnthropic: response status={response.status}")

                        # 401 或 400 都说明当前认证方式可能不对，尝试下一种
                        if auth_name == "x-api-key" and response.status in (401, 400):
                            logger.debug(f"x-api-key auth failed ({response.status}), trying Authorization header")
                            error_text = await response.text()
                            logger.debug(f"x-api-key error: {error_text[:100]}")
                            continue  # 继续下一次循环，尝试 Authorization

                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(f"CustomChatAnthropic: API error {response.status}: {error_text[:200]}")
                            raise Exception(f"API error {response.status}: {error_text}")

                        # 检查是否为流式响应
                        content_type = response.headers.get("Content-Type", "")
                        if "text/event-stream" in content_type:
                            # 解析SSE流式响应
                            text_content = ""
                            input_tokens = 0
                            output_tokens = 0
                            
                            async for line in response.content:
                                line = line.decode('utf-8').strip()
                                
                                # SSE格式: 以"data: "开头
                                if line.startswith("data: "):
                                    data_str = line[6:]  # 移除 "data: " 前缀
                                    
                                    # 跳过特殊事件标记
                                    if data_str == "[DONE]":
                                        continue
                                    
                                    try:
                                        data = json.loads(data_str)
                                        event_type = data.get("type", "")
                                        
                                        # 处理内容块增量
                                        if event_type == "content_block_delta":
                                            delta = data.get("delta", {})
                                            if delta.get("type") == "text_delta":
                                                text_content += delta.get("text", "")
                                        
                                        # 获取使用统计
                                        elif event_type == "message_delta":
                                            usage = data.get("usage", {})
                                            output_tokens = usage.get("output_tokens", output_tokens)
                                        
                                        # 从message_start获取input_tokens
                                        elif event_type == "message_start":
                                            message = data.get("message", {})
                                            usage = message.get("usage", {})
                                            input_tokens = usage.get("input_tokens", input_tokens)
                                            
                                    except json.JSONDecodeError:
                                        # 某些行可能不是有效JSON，跳过
                                        continue
                            
                            logger.info(f"CustomChatAnthropic: stream completed, text length={len(text_content)}")
                            
                            from langchain_core.messages import AIMessage
                            return self._generate_response(
                                AIMessage(content=text_content),
                                input_tokens,
                                output_tokens
                            )
                        else:
                            # 标准JSON响应
                            data = await response.json()

                            # 返回LangChain格式的响应
                            content = data.get('content', [])
                            text = content[0].get('text', '') if content else ''
                            usage = data.get('usage', {})

                            from langchain_core.messages import AIMessage
                            return self._generate_response(
                                AIMessage(content=text),
                                usage.get('input_tokens', 0),
                                usage.get('output_tokens', 0)
                            )

            except Exception as auth_error:
                logger.debug(f"Auth method {auth_name} failed: {auth_error}")
                logger.error(f"CustomChatAnthropic: auth_error={type(auth_error).__name__}: {auth_error}")
                continue

        raise Exception("All authentication methods failed")

    def _generate_response(self, ai_message, prompt_tokens, completion_tokens):
        """生成LangChain格式的响应"""
        from langchain_core.outputs import ChatGeneration, ChatResult
        from langchain_core.messages import AIMessage

        return ChatResult(
            generations=[ChatGeneration(message=ai_message)],
            llm_output={
                "token_usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens
                },
                "model": self.model
            }
        )

    def _generate(
        self,
        messages: list,
        stop: Optional[list] = None,
        run_manager: Optional[Any] = None,
        **kwargs
    ) -> Any:
        """同步生成响应"""
        import asyncio

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        return loop.run_until_complete(self._agenerate(messages, stop, run_manager, **kwargs))


class LLMManager:
    """LLM管理器，支持多种LLM提供商"""
    
    SUPPORTED_PROVIDERS = {
        "openai": "langchain_openai",
        "anthropic": "langchain_anthropic",
        "azure": "langchain_openai",
        "ollama": "langchain_ollama",
        "gemini": "langchain_google_genai",
        "google": "langchain_google_genai",  # Alias for gemini
    }
    
    SUPPORTED_MODELS = {
        "openai": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
        ],
        "anthropic": [
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
        ],
        "azure": [
            "gpt-4o",
            "gpt-4",
            "gpt-35-turbo",
        ],
        "ollama": [
            "llama3.2",
            "llama3.1",
            "llama3",
            "llama2",
            "mistral",
            "codellama",
            "qwen2.5",
            "qwen2",
            "gemma2",
            "phi3",
        ],
        "gemini": [
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-1.0-pro",
            "gemini-pro-vision",
        ],
        "google": [  # Alias for gemini
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-1.0-pro",
            "gemini-pro-vision",
        ],
    }
    
    def __init__(self):
        self._llm_cache: Dict[str, BaseChatModel] = {}
    
    def get_llm(
        self,
        model: str = "gpt-4o-mini",
        provider: str = "openai",
        temperature: float = 0.7,
        max_tokens: int = 8192,
        **kwargs
    ) -> BaseChatModel:
        """
        获取LLM实例
        
        Args:
            model: 模型名称
            provider: 提供商名称
            temperature: 温度参数
            max_tokens: 最大token数
            **kwargs: 其他参数
            
        Returns:
            LLM实例
            
        Raises:
            ValueError: 不支持的提供商或模型
            ImportError: 缺少必要的依赖
        """
        cache_key = f"{provider}:{model}:{temperature}:{max_tokens}"
        
        if cache_key in self._llm_cache:
            return self._llm_cache[cache_key]
        
        if provider not in self.SUPPORTED_PROVIDERS:
            raise ValueError(f"不支持的提供商: {provider}. 支持的提供商: {list(self.SUPPORTED_PROVIDERS.keys())}")
        
        if model not in self.SUPPORTED_MODELS.get(provider, []):
            logger.info(f"提供商: {provider} 模型: {model}")
        
        llm = self._create_llm(provider, model, temperature, max_tokens, **kwargs)
        self._llm_cache[cache_key] = llm
        
        return llm
    
    def _create_llm(
        self,
        provider: str,
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> BaseChatModel:
        """创建LLM实例"""
        
        if provider == "openai":
            return self._create_openai_llm(model, temperature, max_tokens, **kwargs)
        elif provider == "anthropic":
            return self._create_anthropic_llm(model, temperature, max_tokens, **kwargs)
        elif provider == "azure_openai":
            return self._create_azure_llm(model, temperature, max_tokens, **kwargs)
        elif provider == "ollama":
            return self._create_ollama_llm(model, temperature, max_tokens, **kwargs)
        elif provider == "google":
            return self._create_gemini_llm(model, temperature, max_tokens, **kwargs)
        elif provider == "gemini":
            return self._create_gemini_llm(model, temperature, max_tokens, **kwargs)
        else:
            raise ValueError(f"不支持的提供商: {provider}")
    
    def _create_openai_llm(
        self,
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> BaseChatModel:
        """创建OpenAI LLM"""
        try:
            from langchain_openai import ChatOpenAI
        except ImportError:
            raise ImportError("请安装 langchain-openai: pip install langchain-openai")

        api_key = kwargs.get("api_key") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("未找到OpenAI API密钥。请设置OPENAI_API_KEY环境变量或传递api_key参数")

        # 处理自定义base_url
        base_url = kwargs.get("base_url") or os.getenv("OPENAI_BASE_URL")

        # 构建参数
        openai_kwargs = {
            "model": model,
            "temperature": temperature,
            # "max_tokens": max_tokens,
            "api_key": api_key,
        }

        # 添加base_url（如果提供）
        if base_url:
            openai_kwargs["base_url"] = base_url
            logger.info(f"使用自定义OpenAI端点: {base_url}")

        # 添加其他参数（排除已处理的）
        excluded_keys = {"api_key", "base_url"}
        openai_kwargs.update({k: v for k, v in kwargs.items() if k not in excluded_keys})

        return ChatOpenAI(**openai_kwargs)

    def _create_anthropic_llm(
        self,
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> BaseChatModel:
        """创建Anthropic LLM（使用自定义实现支持双认证）"""
        api_key = kwargs.get("api_key") or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("未找到Anthropic API密钥。请设置ANTHROPIC_API_KEY环境变量或传递api_key参数")

        # 获取base_url
        base_url = kwargs.get("base_url") or os.getenv("ANTHROPIC_BASE_URL")

        # 使用自定义Anthropic实现，支持第三方API和双认证
        return CustomChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            base_url=base_url
        )
    
    def _create_azure_llm(
        self,
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> BaseChatModel:
        """创建Azure OpenAI LLM"""
        try:
            from langchain_openai import AzureChatOpenAI
        except ImportError:
            raise ImportError("请安装 langchain-openai: pip install langchain-openai")
        
        api_key = kwargs.get("api_key") or os.getenv("AZURE_OPENAI_API_KEY")
        azure_endpoint = kwargs.get("azure_endpoint") or os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = kwargs.get("api_version") or os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        
        if not api_key:
            raise ValueError("未找到Azure OpenAI API密钥。请设置AZURE_OPENAI_API_KEY环境变量")
        if not azure_endpoint:
            raise ValueError("未找到Azure OpenAI端点。请设置AZURE_OPENAI_ENDPOINT环境变量")
        
        azure_kwargs = {
            "deployment_name": model,
            "api_key": api_key,
            "azure_endpoint": azure_endpoint,
            "api_version": api_version,
        }
        return AzureChatOpenAI(**azure_kwargs)

    def _create_ollama_llm(
        self,
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> BaseChatModel:
        """创建Ollama LLM"""
        try:
            from langchain_ollama import ChatOllama
        except ImportError:
            raise ImportError("请安装 langchain-ollama: pip install langchain-ollama")

        # Ollama默认运行在本地，可以通过base_url自定义
        base_url = kwargs.get("base_url") or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

        # Support "auto" to pick an installed local model (avoid hardcoding a specific model like "llama2").
        def _extract_model_names(payload: Any) -> list[str]:
            if not isinstance(payload, dict):
                return []
            models = payload.get("models") or []
            if not isinstance(models, list):
                return []
            names: list[str] = []
            for item in models:
                if isinstance(item, dict):
                    name = item.get("name")
                    if isinstance(name, str) and name.strip():
                        names.append(name.strip())
            return names

        def _choose_preferred(installed: list[str]) -> str:
            if not installed:
                return ""
            preferred_bases = [
                "llama3.2",
                "llama3.1",
                "llama3",
                "qwen2.5",
                "qwen2",
                "mistral",
                "gemma2",
                "phi3",
                "llama2",
            ]
            normalized = [(name, name.split(":", 1)[0]) for name in installed]
            for base in preferred_bases:
                for full_name, base_name in normalized:
                    if base_name == base:
                        return full_name
            return installed[0]

        model_str = (str(model).strip() if model is not None else "")
        if not model_str or model_str.lower() == "auto":
            try:
                import ollama
                client = ollama.Client(host=base_url)
                installed_models = _extract_model_names(client.list())
            except Exception as e:
                raise RuntimeError(f"Ollama model=auto but failed to list local models: {e}") from e

            if not installed_models:
                raise RuntimeError(
                    "Ollama model=auto but no local models found. Run `ollama pull <model>` first, "
                    "or set OLLAMA_MODEL to an installed model name."
                )

            model_str = _choose_preferred(installed_models)
            logger.info(f"Auto-selected Ollama model: {model_str}")
        else:
            # Allow shorthand like "llama3.2" to match "llama3.2:latest"
            try:
                import ollama
                client = ollama.Client(host=base_url)
                installed_models = _extract_model_names(client.list())
                if installed_models and model_str not in installed_models:
                    prefix_matches = [name for name in installed_models if name.startswith(f"{model_str}:")]
                    if prefix_matches:
                        model_str = prefix_matches[0]
            except Exception:
                pass

        # 构建参数
        ollama_kwargs = {
            "model": model,
            "temperature": temperature,
            # "num_predict": max_tokens,  # Ollama使用num_predict而不是max_tokens
            "base_url": base_url,
        }

        # 添加其他参数（排除已处理的）
        excluded_keys = {"base_url", "max_tokens"}
        ollama_kwargs.update({k: v for k, v in kwargs.items() if k not in excluded_keys})

        logger.info(f"使用Ollama端点: {base_url}")
        return ChatOllama(**ollama_kwargs)

    def _create_gemini_llm(
        self,
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> BaseChatModel:
        """创建Google Gemini LLM"""
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ImportError:
            raise ImportError("请安装 langchain-google-genai: pip install langchain-google-genai")

        api_key = kwargs.get("api_key") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("未找到Google API密钥。请设置GOOGLE_API_KEY环境变量或传递api_key参数")

        # 构建参数
        gemini_kwargs = {
            "model": model,
            "temperature": temperature,
            # "max_output_tokens": max_tokens,  # Gemini使用max_output_tokens
            "google_api_key": api_key,
        }

        # 添加其他参数（排除已处理的）
        excluded_keys = {"api_key", "max_tokens"}
        gemini_kwargs.update({k: v for k, v in kwargs.items() if k not in excluded_keys})

        return ChatGoogleGenerativeAI(**gemini_kwargs)
    
    def validate_configuration(self, provider: str, **kwargs) -> bool:
        """
        验证LLM配置是否正确
        
        Args:
            provider: 提供商名称
            **kwargs: 配置参数
            
        Returns:
            配置是否有效
        """
        try:
            if provider == "openai":
                api_key = kwargs.get("api_key") or os.getenv("OPENAI_API_KEY")
                return bool(api_key)
            elif provider == "anthropic":
                api_key = kwargs.get("api_key") or os.getenv("ANTHROPIC_API_KEY")
                return bool(api_key)
            elif provider == "azure_openai":
                api_key = kwargs.get("api_key") or os.getenv("AZURE_OPENAI_API_KEY")
                endpoint = kwargs.get("azure_endpoint") or os.getenv("AZURE_OPENAI_ENDPOINT")
                return bool(api_key and endpoint)
            elif provider == "ollama":
                # Ollama通常不需要API密钥，只需要确保服务可访问
                base_url = kwargs.get("base_url") or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
                return bool(base_url)
            elif provider == "google" or provider == "gemini":
                api_key = kwargs.get("api_key") or os.getenv("GOOGLE_API_KEY")
                return bool(api_key)
            else:
                return False
        except Exception:
            return False
    
    def list_available_models(self, provider: str) -> list:
        """
        列出指定提供商的可用模型
        
        Args:
            provider: 提供商名称
            
        Returns:
            可用模型列表
        """
        return self.SUPPORTED_MODELS.get(provider, [])
    
    def clear_cache(self):
        """清空LLM缓存"""
        self._llm_cache.clear()
