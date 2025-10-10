from pydantic import field_validator
from sqlmodel import BigInteger, SQLModel, Field
from typing import Optional

from common.utils.snowflake import snowflake

class SnowflakeBase(SQLModel):
    id: Optional[int] = Field(
        default_factory=snowflake.generate_id,
        primary_key=True,
        sa_type=BigInteger(),
        index=True,
        nullable=False
    )
    
    class Config:
        json_encoders = {
            int: lambda v: str(v) if isinstance(v, int) and v > (2**53 - 1) else v
        }