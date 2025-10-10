from typing import Optional
from common.core.config import settings
from sqlbot_xpack.aes_utils import SecureEncryption

simple_aes_iv_text = 'sqlbot_em_aes_iv'
def sqlbot_aes_encrypt(text: str, key: Optional[str] = None) -> str:
    return SecureEncryption.encrypt_to_single_string(text, key or settings.SECRET_KEY)

def sqlbot_aes_decrypt(text: str, key: Optional[str] = None) -> str:
    return SecureEncryption.decrypt_from_single_string(text, key or settings.SECRET_KEY)

def simple_aes_encrypt(text: str, key: Optional[str] = None, ivtext: Optional[str] = None) -> str:
    return SecureEncryption.simple_aes_encrypt(text, key or settings.SECRET_KEY[:32], ivtext or simple_aes_iv_text)

def simple_aes_decrypt(text: str, key: Optional[str] = None, ivtext: Optional[str] = None) -> str:
    return SecureEncryption.simple_aes_decrypt(text, key or settings.SECRET_KEY[:32], ivtext or simple_aes_iv_text)