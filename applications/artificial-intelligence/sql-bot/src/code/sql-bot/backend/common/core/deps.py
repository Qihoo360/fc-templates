import base64
from typing import Annotated
from urllib.parse import unquote

from fastapi import Depends, Request
from sqlmodel import Session
from apps.system.schemas.system_schema import AssistantHeader, UserInfoDTO
from common.core.db import get_session
from common.utils.locale import I18n


SessionDep = Annotated[Session, Depends(get_session)]
i18n = I18n()
async def get_i18n(request: Request):
    return i18n(request)

Trans = Annotated[I18n, Depends(get_i18n)]
async def get_current_user(request: Request) -> UserInfoDTO:
    return request.state.current_user

CurrentUser = Annotated[UserInfoDTO, Depends(get_current_user)]

async def get_current_assistant(request: Request) -> AssistantHeader | None:
    base_assistant = request.state.assistant if hasattr(request.state, "assistant") else None
    if request.headers.get("X-SQLBOT-ASSISTANT-CERTIFICATE"):
        entry_certificate = request.headers['X-SQLBOT-ASSISTANT-CERTIFICATE']
        base_assistant.certificate = unquote(base64.b64decode(entry_certificate).decode('utf-8'))
    if request.headers.get("X-SQLBOT-ASSISTANT-ONLINE"):
        entry_online = request.headers['X-SQLBOT-ASSISTANT-ONLINE']
        base_assistant.online = str(entry_online).lower() == 'true' if entry_online else False
    return base_assistant

CurrentAssistant = Annotated[AssistantHeader, Depends(get_current_assistant)]



