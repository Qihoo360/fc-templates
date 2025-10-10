from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext
import hashlib
from common.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


ALGORITHM = "HS256"


def create_access_token(data: dict | Any, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    # to_encode = {"exp": expire, "account": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def md5pwd(password: str) -> str:
    m = hashlib.md5()
    m.update(password.encode("utf-8"))
    return m.hexdigest()

def verify_md5pwd(plain_password: str, md5_password: str) -> bool:
    return md5pwd(plain_password) == md5_password

def default_pwd() -> str:
    return settings.DEFAULT_PWD

def default_md5_pwd() -> str:
    pwd = default_pwd()
    return md5pwd(pwd)