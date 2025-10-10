from sqlbot_xpack.core import sqlbot_decrypt as xpack_sqlbot_decrypt, sqlbot_encrypt as xpack_sqlbot_encrypt

async def sqlbot_decrypt(text: str) -> str:
    return await xpack_sqlbot_decrypt(text)

async def sqlbot_encrypt(text: str) -> str:
    return await xpack_sqlbot_encrypt(text)