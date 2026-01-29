"""
AI provider implementations
"""

import asyncio
import json
import logging
import re
from typing import List, Dict, Any, Optional, AsyncGenerator, Union, Tuple

from .base import AIProvider, AIMessage, AIResponse, MessageRole, TextContent, ImageContent, MessageContentType
from ..core.config import ai_config

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """OpenAI API provider"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        try:
            import openai
            self.client = openai.AsyncOpenAI(
                api_key=config.get("api_key"),
                base_url=config.get("base_url")
            )
        except ImportError:
            logger.warning("OpenAI library not installed. Install with: pip install openai")
            self.client = None

    def _convert_message_to_openai(self, message: AIMessage) -> Dict[str, Any]:
        """Convert AIMessage to OpenAI format, supporting multimodal content"""
        openai_message = {"role": message.role.value}

        if isinstance(message.content, str):
            # Simple text message
            openai_message["content"] = message.content
        elif isinstance(message.content, list):
            # Multimodal message
            content_parts = []
            for part in message.content:
                if isinstance(part, TextContent):
                    content_parts.append({
                        "type": "text",
                        "text": part.text
                    })
                elif isinstance(part, ImageContent):
                    content_parts.append({
                        "type": "image_url",
                        "image_url": part.image_url
                    })
            openai_message["content"] = content_parts
        else:
            # Fallback to string representation
            openai_message["content"] = str(message.content)

        if message.name:
            openai_message["name"] = message.name

        return openai_message

    def _filter_think_content(self, content: str) -> str:
        """
        Filter out content within think tags in all forms
        Supports: <think>, <think>, ＜think＞, 【think】 and their closing tags
        This prevents internal reasoning from being exposed in the output
        """
        if not content:
            return content

        import re

        # Pattern to match different forms of think tags (opening and closing)
        # Matches: <think>...</think>, <think>...</think>, ＜think＞...＜/think＞, 【think】...【/think】
        # Also handles self-closing and nested tags
        patterns = [
            r'<think[\s\S]*?></think>',           # <think>...</think>
        ]

        # Apply all patterns
        filtered_content = content
        for pattern in patterns:
            filtered_content = re.sub(pattern, '', filtered_content, flags=re.IGNORECASE)

        # # Clean up any extra whitespace that might be left behind
        # # Remove multiple consecutive empty lines
        # filtered_content = re.sub(r'\n\s*\n\s*\n\s*\n', '', filtered_content)

        # # Remove empty lines at the beginning and end
        # filtered_content = filtered_content.strip()

        # # Clean up extra spaces within lines
        # filtered_content = re.sub(r' +', ' ', filtered_content)

        return filtered_content
    
    async def chat_completion(self, messages: List[AIMessage], **kwargs) -> AIResponse:
        """Generate chat completion using OpenAI"""
        if not self.client:
            raise RuntimeError("OpenAI client not available")

        config = self._merge_config(**kwargs)

        # Convert messages to OpenAI format with multimodal support
        openai_messages = [
            self._convert_message_to_openai(msg)
            for msg in messages
        ]
        
        try:
            response = await self.client.chat.completions.create(
                model=config.get("model", self.model),
                messages=openai_messages,
                # max_tokens=config.get("max_tokens", 2000),
                temperature=config.get("temperature", 0.7),
                top_p=config.get("top_p", 1.0)
            )
            
            choice = response.choices[0]
            # Filter out think content from the response
            filtered_content = self._filter_think_content(choice.message.content)

            return AIResponse(
                content=filtered_content,
                model=response.model,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                finish_reason=choice.finish_reason,
                metadata={"provider": "openai"}
            )
            
        except Exception as e:
            # 提供更详细的错误信息
            error_msg = str(e)
            if "Expecting value" in error_msg:
                logger.error(f"OpenAI API JSON parsing error: {error_msg}. This usually indicates the API returned malformed JSON.")
            elif "timeout" in error_msg.lower():
                logger.error(f"OpenAI API timeout error: {error_msg}")
            elif "rate limit" in error_msg.lower():
                logger.error(f"OpenAI API rate limit error: {error_msg}")
            else:
                logger.error(f"OpenAI API error: {error_msg}")
            raise
    
    async def text_completion(self, prompt: str, **kwargs) -> AIResponse:
        """Generate text completion using OpenAI chat format"""
        messages = [AIMessage(role=MessageRole.USER, content=prompt)]
        return await self.chat_completion(messages, **kwargs)

    async def stream_chat_completion(self, messages: List[AIMessage], **kwargs) -> AsyncGenerator[str, None]:
        """Stream chat completion using OpenAI with think tag filtering"""
        if not self.client:
            raise RuntimeError("OpenAI client not available")

        config = self._merge_config(**kwargs)

        # Convert messages to OpenAI format with multimodal support
        openai_messages = [
            self._convert_message_to_openai(msg)
            for msg in messages
        ]

        try:
            stream = await self.client.chat.completions.create(
                model=config.get("model", self.model),
                messages=openai_messages,
                # max_tokens=config.get("max_tokens", 2000),
                temperature=config.get("temperature", 0.7),
                top_p=config.get("top_p", 1.0),
                stream=True
            )

            buffer = ""
            in_think_tag = False

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    chunk_content = chunk.choices[0].delta.content
                    buffer += chunk_content

                    # Process the buffer to handle think tags
                    processed_content = ""
                    remaining_buffer = buffer

                    while remaining_buffer:
                        if not in_think_tag:
                            # Look for opening think tag
                            think_start = None
                            # Check for different forms of think tags (case-insensitive)
                            for tag in ['<think', '<think>', '＜think', '【think']:
                                pos = remaining_buffer.lower().find(tag.lower())
                                if pos != -1:
                                    think_start = pos
                                    break

                            if think_start is not None:
                                # Found opening tag, add content before it
                                processed_content += remaining_buffer[:think_start]
                                in_think_tag = True
                                # Remove everything up to and including the opening tag
                                remaining_buffer = remaining_buffer[think_start:]
                                # Find the end of the opening tag
                                tag_end = remaining_buffer.lower().find('>')
                                if tag_end != -1:
                                    remaining_buffer = remaining_buffer[tag_end + 1:]
                                else:
                                    remaining_buffer = ""
                                    break
                            else:
                                # No think tag found, add everything to processed content
                                processed_content += remaining_buffer
                                remaining_buffer = ""
                                break
                        else:
                            # We're inside a think tag, look for closing tag
                            think_end = None
                            # Check for different forms of closing tags (case-insensitive)
                            for tag in ['</think>', '</think>', '＜/think＞', '【/think】']:
                                pos = remaining_buffer.lower().find(tag.lower())
                                if pos != -1:
                                    think_end = pos
                                    break

                            if think_end is not None:
                                # Found closing tag, skip to after it
                                in_think_tag = False
                                remaining_buffer = remaining_buffer[think_end + len('</think>'):]
                            else:
                                # Haven't found closing tag yet, skip this chunk
                                remaining_buffer = ""

                    # Update buffer with remaining content
                    buffer = remaining_buffer

                    # Yield processed content if not in think tag
                    if not in_think_tag and processed_content:
                        yield processed_content

        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            raise

    async def stream_text_completion(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream text completion using OpenAI chat format"""
        messages = [AIMessage(role=MessageRole.USER, content=prompt)]
        async for chunk in self.stream_chat_completion(messages, **kwargs):
            yield chunk

class AnthropicProvider(AIProvider):
    """Anthropic Claude API provider"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        try:
            import anthropic
            base_url = config.get("base_url")
            base_url = base_url.strip() if isinstance(base_url, str) else None

            try:
                if base_url:
                    self.client = anthropic.AsyncAnthropic(api_key=config.get("api_key"), base_url=base_url)
                else:
                    self.client = anthropic.AsyncAnthropic(api_key=config.get("api_key"))
            except TypeError:
                # Backwards compatibility with older anthropic SDK versions
                self.client = anthropic.AsyncAnthropic(api_key=config.get("api_key"))
        except ImportError:
            logger.warning("Anthropic library not installed. Install with: pip install anthropic")
            self.client = None

    def _convert_message_to_anthropic(self, message: AIMessage) -> Dict[str, Any]:
        """Convert AIMessage to Anthropic format, supporting multimodal content"""
        anthropic_message = {"role": message.role.value}

        if isinstance(message.content, str):
            # Simple text message
            anthropic_message["content"] = message.content
        elif isinstance(message.content, list):
            # Multimodal message
            content_parts = []
            for part in message.content:
                if isinstance(part, TextContent):
                    content_parts.append({
                        "type": "text",
                        "text": part.text
                    })
                elif isinstance(part, ImageContent):
                    # Anthropic expects base64 data without the data URL prefix
                    image_url = part.image_url.get("url", "")
                    if image_url.startswith("data:image/"):
                        # Extract base64 data and media type
                        header, base64_data = image_url.split(",", 1)
                        media_type = header.split(":")[1].split(";")[0]
                        content_parts.append({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": base64_data
                            }
                        })
                    else:
                        # For URL-based images, we'd need to fetch and convert to base64
                        # For now, skip or convert to text description
                        content_parts.append({
                            "type": "text",
                            "text": f"[Image: {image_url}]"
                        })
            anthropic_message["content"] = content_parts
        else:
            # Fallback to string representation
            anthropic_message["content"] = str(message.content)

        return anthropic_message
    
    async def chat_completion(self, messages: List[AIMessage], **kwargs) -> AIResponse:
        """Generate chat completion using Anthropic Claude (uses streaming internally to avoid timeout)"""
        if not self.client:
            raise RuntimeError("Anthropic client not available")

        config = self._merge_config(**kwargs)

        # 使用流式响应来避免 SDK 的 10 分钟超时限制
        # 收集所有流式块后返回完整响应
        try:
            full_content = ""
            async for chunk in self.stream_chat_completion(messages, **kwargs):
                full_content += chunk
            
            return AIResponse(
                content=full_content,
                model=config.get("model", self.model),
                usage={
                    "prompt_tokens": 0,  # 流式响应不提供精确的 token 统计
                    "completion_tokens": 0,
                    "total_tokens": 0
                },
                finish_reason="stop",
                metadata={"provider": "anthropic"}
            )
            
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def text_completion(self, prompt: str, **kwargs) -> AIResponse:
        """Generate text completion using Anthropic chat format"""
        messages = [AIMessage(role=MessageRole.USER, content=prompt)]
        return await self.chat_completion(messages, **kwargs)

    async def stream_text_completion(
        self,
        prompt: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream text completion using Anthropic Claude for long-running requests"""
        messages = [AIMessage(role=MessageRole.USER, content=prompt)]
        async for chunk in self.stream_chat_completion(messages, **kwargs):
            yield chunk

    async def stream_chat_completion(
        self,
        messages: List[AIMessage],
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion using Anthropic Claude with proper streaming support"""
        config = self._merge_config(**kwargs)
        api_key = config.get("api_key", "")
        base_url = config.get("base_url", "https://api.anthropic.com")
        model = config.get("model", self.model)
        max_tokens = config.get("max_tokens", 65535)
        temperature = config.get("temperature", 0.7)

        # Convert messages to Anthropic format
        system_message = None
        claude_messages = []

        for msg in messages:
            if msg.role == MessageRole.SYSTEM:
                system_message = msg.content if isinstance(msg.content, str) else str(msg.content)
            else:
                claude_messages.append(self._convert_message_to_anthropic(msg))

        try:
            import aiohttp

            # Build URL
            base_url = base_url.rstrip('/')
            if not base_url.endswith('/v1'):
                base_url = base_url + '/v1'
            url = f"{base_url}/messages"

            # Build request body
            body = {
                "model": model,
                "messages": claude_messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": True
            }
            if system_message:
                body["system"] = system_message

            # Try both authentication methods
            auth_methods = [
                ("x-api-key", {"x-api-key": api_key}),  # Official Anthropic style
                ("Authorization", {"Authorization": f"Bearer {api_key}"})  # MiniMax/other compatible APIs
            ]

            for auth_name, auth_header in auth_methods:
                try:
                    headers = {
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    }
                    headers.update(auth_header)

                    async with aiohttp.ClientSession() as session:
                        async with session.post(url, headers=headers, json=body) as response:
                            if response.status == 401 and auth_name == "x-api-key":
                                # x-api-key failed, try Authorization header
                                logger.debug("x-api-key auth failed, trying Authorization header")
                                break  # Exit inner loop to try next auth method

                            if response.status != 200:
                                error_text = await response.text()
                                if auth_name == "x-api-key":
                                    # Try next auth method
                                    logger.debug(f"x-api-key auth failed ({response.status}), trying Authorization")
                                    break  # Exit inner loop to try next auth method
                                raise Exception(f"API error {response.status}: {error_text}")

                            # Parse streaming response (SSE format)
                            async for line in response.content:
                                line = line.decode('utf-8').strip()
                                if line.startswith('data: '):
                                    data = line[6:]
                                    if data == '[DONE]':
                                        break
                                    try:
                                        import json
                                        event_data = json.loads(data)
                                        if event_data.get('type') == 'content_block_delta':
                                            delta = event_data.get('delta', {})
                                            if delta.get('type') == 'text_delta':
                                                text = delta.get('text', '')
                                                if text:
                                                    yield text
                                    except json.JSONDecodeError:
                                        pass
                            return  # Success, exit the function

                except Exception as auth_error:
                    logger.debug(f"Auth method {auth_name} failed: {auth_error}")
                    continue  # Try next auth method

            # If we get here, all auth methods failed
            raise Exception("All authentication methods failed")

        except Exception as e:
            logger.error(f"Anthropic streaming API error: {e}")
            raise

class GoogleProvider(AIProvider):
    """Google Gemini API provider"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        # Keep the configured base_url; used for REST calls (including mirror endpoints).
        self.base_url = config.get("base_url", "https://generativelanguage.googleapis.com")
        # The legacy `google.generativeai` package is deprecated and emits warnings on import.
        # Use the REST API implementation in this provider instead.
        self.client = None
        self.model_instance = None

    def _convert_messages_to_gemini(self, messages: List[AIMessage]):
        """Convert AIMessage list to Gemini REST prompt parts (supports multimodal content)."""
        import base64

        # Check if we have any images
        has_images = any(
            isinstance(msg.content, list) and
            any(isinstance(part, ImageContent) for part in msg.content)
            for msg in messages
        )

        if not has_images:
            # Text-only mode - return string
            parts = []
            for msg in messages:
                role_prefix = f"[{msg.role.value.upper()}]: "
                if isinstance(msg.content, str):
                    parts.append(role_prefix + msg.content)
                elif isinstance(msg.content, list):
                    message_parts = [role_prefix]
                    for part in msg.content:
                        if isinstance(part, TextContent):
                            message_parts.append(part.text)
                    parts.append(" ".join(message_parts))
                else:
                    parts.append(role_prefix + str(msg.content))
            return "\n\n".join(parts)
        else:
            # Multimodal mode - return list of parts for Gemini
            content_parts = []

            for msg in messages:
                role_prefix = f"[{msg.role.value.upper()}]: "

                if isinstance(msg.content, str):
                    content_parts.append(role_prefix + msg.content)
                elif isinstance(msg.content, list):
                    text_parts = [role_prefix]

                    for part in msg.content:
                        if isinstance(part, TextContent):
                            text_parts.append(part.text)
                        elif isinstance(part, ImageContent):
                            # Add accumulated text first
                            if len(text_parts) > 1 or text_parts[0]:
                                content_parts.append(" ".join(text_parts))
                                text_parts = []

                            # Process image for Gemini
                            image_url = part.image_url.get("url", "")
                            if image_url.startswith("data:image/"):
                                try:
                                    # Extract base64 data and mime type
                                    header, base64_data = image_url.split(",", 1)
                                    mime_type = header.split(":")[1].split(";")[0]  # Extract mime type like 'image/jpeg'
                                    image_data = base64.b64decode(base64_data)

                                    # REST-compatible inline_data payload (bytes -> base64 happens later).
                                    content_parts.append({
                                        "inline_data": {
                                            "mime_type": mime_type,
                                            "data": image_data,
                                        }
                                    })
                                    logger.info(f"Successfully processed image for Gemini: {mime_type}, {len(image_data)} bytes")
                                except Exception as e:
                                    logger.error(f"Failed to process image for Gemini: {e}")
                                    content_parts.append("请参考上传的图片进行设计。图片包含了重要的设计参考信息，请根据图片的风格、色彩、布局等元素来生成模板。")
                            else:
                                # Fallback when genai types not available or not base64 image
                                if image_url.startswith("data:image/"):
                                    content_parts.append("请参考上传的图片进行设计。图片包含了重要的设计参考信息，请根据图片的风格、色彩、布局等元素来生成模板。")
                                else:
                                    content_parts.append(f"请参考图片 {image_url} 进行设计")

                    # Add remaining text
                    if len(text_parts) > 1 or (len(text_parts) == 1 and text_parts[0]):
                        content_parts.append(" ".join(text_parts))
                else:
                    content_parts.append(role_prefix + str(msg.content))

            return content_parts

    @staticmethod
    def _normalize_base_url(base_url: str) -> str:
        base_url = (base_url or "").strip()
        if not base_url:
            base_url = "https://generativelanguage.googleapis.com"
        if not base_url.startswith("http://") and not base_url.startswith("https://"):
            base_url = "https://" + base_url
        base_url = base_url.rstrip("/")
        # Allow users to paste a full v1beta base; normalize back to the host root.
        if base_url.endswith("/v1beta"):
            base_url = base_url[: -len("/v1beta")]
        return base_url

    @staticmethod
    def _normalize_model_name(model: str) -> str:
        model = (model or "").strip() or "gemini-1.5-flash"
        if model.startswith("models/"):
            model = model.split("/", 1)[1]
        return model

    @staticmethod
    def _prompt_to_rest_parts(prompt) -> List[Dict[str, Any]]:
        import base64

        if isinstance(prompt, str):
            return [{"text": prompt}]

        parts: List[Dict[str, Any]] = []
        for item in (prompt or []):
            if isinstance(item, str):
                parts.append({"text": item})
                continue

            if isinstance(item, dict):
                if "text" in item and isinstance(item["text"], str):
                    parts.append({"text": item["text"]})
                    continue
                if "inline_data" in item and isinstance(item["inline_data"], dict):
                    inline_data = item["inline_data"]
                    mime_type = inline_data.get("mime_type") or inline_data.get("mimeType")
                    data = inline_data.get("data")
                    if isinstance(data, (bytes, bytearray)):
                        data = base64.b64encode(data).decode("ascii")
                    if isinstance(mime_type, str) and isinstance(data, str):
                        parts.append({"inline_data": {"mime_type": mime_type, "data": data}})
                        continue

            parts.append({"text": str(item)})

        return parts

    async def _generate_via_rest(
        self,
        *,
        model: str,
        prompt,
        generation_config: Dict[str, Any],
        safety_settings: Optional[List[Dict[str, Any]]] = None,
        timeout_s: int = 120,
    ) -> Dict[str, Any]:
        import aiohttp

        if not self.api_key:
            raise RuntimeError("Google API key not configured")

        base_url = self._normalize_base_url(self.base_url)
        model = self._normalize_model_name(model)
        url = f"{base_url}/v1beta/models/{model}:generateContent?key={self.api_key}"

        body: Dict[str, Any] = {
            "contents": [{"parts": self._prompt_to_rest_parts(prompt)}],
            "generationConfig": {
                "temperature": generation_config.get("temperature", 0.7),
                "topP": generation_config.get("top_p", generation_config.get("topP", 1.0)),
            },
        }
        if "max_output_tokens" in generation_config:
            body["generationConfig"]["maxOutputTokens"] = generation_config["max_output_tokens"]
        if safety_settings:
            body["safetySettings"] = safety_settings

        timeout = aiohttp.ClientTimeout(total=timeout_s)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, json=body, headers={"Content-Type": "application/json"}) as resp:
                raw = await resp.text()
                if resp.status >= 400:
                    try:
                        import json as _json
                        data = _json.loads(raw)
                        message = (
                            (data.get("error") or {}).get("message")
                            or data.get("message")
                            or raw
                        )
                    except Exception:
                        message = raw
                    raise RuntimeError(f"Google Gemini API error {resp.status}: {message}")

                try:
                    import json as _json
                    return _json.loads(raw) if raw else {}
                except Exception:
                    return {}

    async def chat_completion(self, messages: List[AIMessage], **kwargs) -> AIResponse:
        """Generate chat completion using Google Gemini"""
        normalized_base_url = self._normalize_base_url(self.base_url)
        # Always use the REST path to avoid importing deprecated `google.generativeai`.
        use_rest = True

        config = self._merge_config(**kwargs)

        # Convert messages to Gemini format with multimodal support
        prompt = self._convert_messages_to_gemini(messages)

        try:
            # Configure generation parameters
            # 确保max_tokens不会太小，至少1000个token用于生成内容
            max_tokens = max(config.get("max_tokens", 16384), 1000)
            generation_config = {
                "temperature": config.get("temperature", 0.7),
                "top_p": config.get("top_p", 1.0),
                # "max_output_tokens": max_tokens,
            }

            # 配置安全设置 - 设置为较宽松的安全级别以减少误拦截
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                }
            ]

            if use_rest:
                response_data = await self._generate_via_rest(
                    model=config.get("model", self.model),
                    prompt=prompt,
                    generation_config={**generation_config, "max_output_tokens": max_tokens},
                    safety_settings=safety_settings,
                )

                candidates = response_data.get("candidates") or []
                if not candidates:
                    content = "[å“åº”ä¸­æ²¡æœ‰å€™é€‰å†…å®¹]"
                    finish_reason = "stop"
                else:
                    candidate = candidates[0] or {}
                    finish_reason = str(candidate.get("finishReason") or "stop")

                    parts = ((candidate.get("content") or {}).get("parts") or [])
                    text_parts: List[str] = []
                    for p in parts:
                        t = p.get("text") if isinstance(p, dict) else None
                        if isinstance(t, str) and t:
                            text_parts.append(t)
                    content = "\n".join(text_parts).strip()

                    if not content:
                        if finish_reason == "SAFETY":
                            content = "[å†…å®¹è¢«å®‰å…¨è¿‡æ»¤å™¨é˜»æ­¢]"
                        elif finish_reason == "RECITATION":
                            content = "[å†…å®¹å› é‡å¤è€Œè¢«é˜»æ­¢]"
                        elif finish_reason == "MAX_TOKENS":
                            content = "[å“åº”å› tokené™åˆ¶è¢«æˆªæ–­ï¼Œæ— å†…å®¹]"
                        else:
                            content = "[æ— æ³•èŽ·å–å“åº”å†…å®¹]"

                usage_meta = response_data.get("usageMetadata") or {}
                usage = {
                    "prompt_tokens": int(usage_meta.get("promptTokenCount") or 0),
                    "completion_tokens": int(usage_meta.get("candidatesTokenCount") or 0),
                    "total_tokens": int(usage_meta.get("totalTokenCount") or 0),
                }

                return AIResponse(
                    content=content,
                    model=config.get("model", self.model),
                    usage=usage,
                    finish_reason=finish_reason,
                    metadata={"provider": "google", "base_url": normalized_base_url}
                )


            response = await self._generate_async(prompt, generation_config, safety_settings)
            logger.debug(f"Google Gemini API response: {response}")

            # 检查响应状态和安全过滤
            finish_reason = "stop"
            content = ""

            if response.candidates:
                candidate = response.candidates[0]
                finish_reason = candidate.finish_reason.name if hasattr(candidate.finish_reason, 'name') else str(candidate.finish_reason)

                # 检查是否被安全过滤器阻止或其他问题
                if finish_reason == "SAFETY":
                    logger.warning("Content was blocked by safety filters")
                    content = "[内容被安全过滤器阻止]"
                elif finish_reason == "RECITATION":
                    logger.warning("Content was blocked due to recitation")
                    content = "[内容因重复而被阻止]"
                elif finish_reason == "MAX_TOKENS":
                    logger.warning("Response was truncated due to max tokens limit")
                    # 尝试获取部分内容
                    try:
                        if hasattr(candidate, 'content') and candidate.content and hasattr(candidate.content, 'parts') and candidate.content.parts:
                            content = candidate.content.parts[0].text if candidate.content.parts[0].text else "[响应因token限制被截断，无内容]"
                        else:
                            content = "[响应因token限制被截断，无内容]"
                    except Exception as text_error:
                        logger.warning(f"Failed to get truncated response text: {text_error}")
                        content = "[响应因token限制被截断，无法获取内容]"
                elif finish_reason == "OTHER":
                    logger.warning("Content was blocked for other reasons")
                    content = "[内容被其他原因阻止]"
                else:
                    # 正常情况下获取文本
                    try:
                        if hasattr(candidate, 'content') and candidate.content and hasattr(candidate.content, 'parts') and candidate.content.parts:
                            content = candidate.content.parts[0].text if candidate.content.parts[0].text else ""
                        else:
                            # 回退到response.text
                            content = response.text if hasattr(response, 'text') and response.text else ""
                    except Exception as text_error:
                        logger.warning(f"Failed to get response text: {text_error}")
                        content = "[无法获取响应内容]"
            else:
                logger.warning("No candidates in response")
                content = "[响应中没有候选内容]"

            return AIResponse(
                content=content,
                model=self.model,
                usage={
                    "prompt_tokens": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else 0,
                    "completion_tokens": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else 0,
                    "total_tokens": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 0
                },
                finish_reason=finish_reason,
                metadata={"provider": "google"}
            )

        except Exception as e:
            logger.error(f"Google Gemini API error: {e}")
            raise

    async def _generate_async(self, prompt, generation_config: Dict[str, Any], safety_settings=None):
        """Async wrapper for Gemini generation - supports both text and multimodal content"""
        import asyncio
        loop = asyncio.get_event_loop()

        def _generate_sync():
            kwargs = {
                "generation_config": generation_config
            }
            if safety_settings:
                kwargs["safety_settings"] = safety_settings

            return self.model_instance.generate_content(
                prompt,  # Can be string or list of parts
                **kwargs
            )

        return await loop.run_in_executor(None, _generate_sync)

    async def text_completion(self, prompt: str, **kwargs) -> AIResponse:
        """Generate text completion using Google Gemini"""
        messages = [AIMessage(role=MessageRole.USER, content=prompt)]
        return await self.chat_completion(messages, **kwargs)

class OllamaProvider(AIProvider):
    """Ollama local model provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        try:
            import ollama
            self.client = ollama.AsyncClient(host=config.get("base_url", "http://localhost:11434"))
        except ImportError:
            logger.warning("Ollama library not installed. Install with: pip install ollama")
            self.client = None

    async def _list_installed_models(self) -> List[str]:
        if not self.client:
            return []
        try:
            data = await self.client.list()
            models = data.get("models") or []
            names: List[str] = []
            for model_info in models:
                name = model_info.get("name")
                if isinstance(name, str) and name.strip():
                    names.append(name.strip())
            return names
        except Exception as e:
            logger.warning(f"Failed to list Ollama models: {e}")
            return []

    @staticmethod
    def _choose_preferred_model(installed: List[str]) -> str:
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

    async def _resolve_model_name(self, requested: Any) -> str:
        requested_str = str(requested).strip() if requested is not None else ""
        if not requested_str or requested_str.lower() == "auto":
            installed = await self._list_installed_models()
            if not installed:
                raise RuntimeError(
                    "Ollama 未检测到已安装的模型（或服务不可用）。请先执行 `ollama pull <model>`，"
                    "或在配置中设置 `OLLAMA_MODEL` 为已安装模型名称。"
                )
            chosen = self._choose_preferred_model(installed)
            logger.info(f"Ollama model auto-selected: {chosen}")
            return chosen

        installed = await self._list_installed_models()
        if installed and requested_str not in installed:
            # Allow shorthand like "llama3.2" to match "llama3.2:latest"
            prefix_matches = [name for name in installed if name.startswith(f"{requested_str}:")]
            if prefix_matches:
                return prefix_matches[0]

        return requested_str
    
    async def chat_completion(self, messages: List[AIMessage], **kwargs) -> AIResponse:
        """Generate chat completion using Ollama"""
        if not self.client:
            raise RuntimeError("Ollama client not available")
        
        config = self._merge_config(**kwargs)
        model_name = await self._resolve_model_name(config.get("model", self.model))
        
        # Convert messages to Ollama format with multimodal support
        ollama_messages = []
        for msg in messages:
            if isinstance(msg.content, str):
                # Simple text message
                ollama_messages.append({"role": msg.role.value, "content": msg.content})
            elif isinstance(msg.content, list):
                # Multimodal message - convert to text description for Ollama
                content_parts = []
                for part in msg.content:
                    if isinstance(part, TextContent):
                        content_parts.append(part.text)
                    elif isinstance(part, ImageContent):
                        # Ollama doesn't support images directly, add text description
                        image_url = part.image_url.get("url", "")
                        if image_url.startswith("data:image/"):
                            content_parts.append("[Image provided - base64 data]")
                        else:
                            content_parts.append(f"[Image: {image_url}]")
                ollama_messages.append({
                    "role": msg.role.value,
                    "content": " ".join(content_parts)
                })
            else:
                # Fallback to string representation
                ollama_messages.append({"role": msg.role.value, "content": str(msg.content)})
        
        try:
            response = await self.client.chat(
                model=model_name,
                messages=ollama_messages,
                options={
                    "temperature": config.get("temperature", 0.7),
                    "top_p": config.get("top_p", 1.0),
                    # "num_predict": config.get("max_tokens", 2000)
                }
            )
            
            content = response.get("message", {}).get("content", "")
            
            return AIResponse(
                content=content,
                model=model_name,
                usage=self._calculate_usage(
                    " ".join([msg.content for msg in messages]),
                    content
                ),
                finish_reason="stop",
                metadata={"provider": "ollama"}
            )
            
        except Exception as e:
            msg = str(e)
            if ("model" in msg and "not found" in msg) or ("not found" in msg and "pull" in msg):
                installed = await self._list_installed_models()
                installed_hint = f"已安装模型: {', '.join(installed)}" if installed else "未检测到已安装模型"
                raise RuntimeError(
                    f"{msg}。{installed_hint}。请在配置中设置 `OLLAMA_MODEL`（或网页配置中的 Ollama 默认模型），"
                    "或执行 `ollama pull <model>` 安装模型。"
                ) from e
            logger.error(f"Ollama API error: {e}")
            raise
    
    async def text_completion(self, prompt: str, **kwargs) -> AIResponse:
        """Generate text completion using Ollama"""
        messages = [AIMessage(role=MessageRole.USER, content=prompt)]
        return await self.chat_completion(messages, **kwargs)

class AIProviderFactory:
    """Factory for creating AI providers"""

    _providers = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "google": GoogleProvider,
        "gemini": GoogleProvider,  # Alias for google
        "ollama": OllamaProvider,
        "302ai": OpenAIProvider,  # 302.AI uses OpenAI-compatible API
    }

    @classmethod
    def create_provider(cls, provider_name: str, config: Optional[Dict[str, Any]] = None) -> AIProvider:
        """Create an AI provider instance"""
        if config is None:
            config = ai_config.get_provider_config(provider_name)

        # Built-in providers
        if provider_name not in cls._providers:
            raise ValueError(f"Unknown provider: {provider_name}")

        provider_class = cls._providers[provider_name]
        return provider_class(config)
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available providers"""
        return list(cls._providers.keys())

class AIProviderManager:
    """Manager for AI provider instances with caching and reloading"""

    def __init__(self):
        self._provider_cache = {}
        self._config_cache = {}

    def get_provider(self, provider_name: Optional[str] = None) -> AIProvider:
        """Get AI provider instance with caching"""
        if provider_name is None:
            provider_name = ai_config.default_ai_provider
        if provider_name not in AIProviderFactory._providers:
            logger.warning(f"Unknown provider '{provider_name}', falling back to 'openai'")
            provider_name = "openai"

        # Get current config for the provider
        current_config = ai_config.get_provider_config(provider_name)

        # Check if we have a cached provider and if config has changed
        cache_key = provider_name
        if (cache_key in self._provider_cache and
            cache_key in self._config_cache and
            self._config_cache[cache_key] == current_config):
            return self._provider_cache[cache_key]

        # Create new provider instance
        provider = AIProviderFactory.create_provider(provider_name, current_config)

        # Cache the provider and config
        self._provider_cache[cache_key] = provider
        self._config_cache[cache_key] = current_config

        return provider

    def clear_cache(self):
        """Clear provider cache to force reload"""
        self._provider_cache.clear()
        self._config_cache.clear()

    def reload_provider(self, provider_name: str):
        """Reload a specific provider"""
        cache_key = provider_name
        if cache_key in self._provider_cache:
            del self._provider_cache[cache_key]
        if cache_key in self._config_cache:
            del self._config_cache[cache_key]

# Global provider manager
_provider_manager = AIProviderManager()

def get_ai_provider(provider_name: Optional[str] = None) -> AIProvider:
    """Get AI provider instance"""
    return _provider_manager.get_provider(provider_name)


def get_role_provider(role: str, provider_override: Optional[str] = None) -> Tuple[AIProvider, Dict[str, Optional[str]]]:
    """Get provider and settings for a specific task role"""
    settings = ai_config.get_model_config_for_role(role, provider_override=provider_override)
    provider = get_ai_provider(settings["provider"])
    return provider, settings

def reload_ai_providers():
    """Reload all AI providers (clear cache)"""
    _provider_manager.clear_cache()
