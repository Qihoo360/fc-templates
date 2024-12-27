import boto3
from utils import utils
import os
from botocore.exceptions import NoCredentialsError

def upload_to_obs(file_path: str, obs_config: dict) -> str:
    """
    上传到 S3/OBS 兼容存储，返回可访问路径
    obs_config 示例:
    {
      "ak":"xxx",
      "sk":"xxx",
      "session_token":"xxx",
      "endpoint":"https://beijing2.xstore.com",
      "region":"beijing2",
      "bucket_name":"test-bucket"
    }
    """
    s3_client = boto3.client(
        's3',
        aws_access_key_id=obs_config.get("ak"),
        aws_secret_access_key=obs_config.get("sk"),
        aws_session_token=obs_config.get("session_token", None),
        region_name=obs_config.get("region"),
        endpoint_url=obs_config.get("endpoint")
    )
    bucket_name = obs_config["bucket_name"]
    file_name = os.path.basename(file_path)
    try:
      with open(file_path, "rb") as f:
          file_content = f.read()
          s3_client.put_object(Bucket=bucket_name, Key=file_name, Body=file_content)

          if not utils.cleanup_temp_file(file_path):
            print(f"Failed to cleanup temp file: {file_path}")

          file_download_url = generate_presigned_url(bucket_name, file_name, obs_config)

          return file_download_url
    except NoCredentialsError:
        return "Failed to authenticate with OBS"

def download_from_obs(obs_config: dict) -> bytes:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=obs_config.get("ak"),
        aws_secret_access_key=obs_config.get("sk"),
        aws_session_token=obs_config.get("session_token", None),
        region_name=obs_config.get("region"),
        endpoint_url=obs_config.get("endpoint")
    )

    bucket_name = obs_config["bucket_name"]
    file_name = obs_config["file_name"]

    obj = s3_client.get_object(Bucket=bucket_name, Key=file_name)
    return obj["Body"].read()

def generate_presigned_url(bucket_name: str, key: str, obs_config: dict, expiration=3600):
    """
    使用 STS 凭证生成预签名下载链接。
    :param bucket_name: S3 存储桶名称
    :param key: 文件在 S3 中的路径
    :param obs_config: sts 鉴权信息
    :param expiration: 链接有效期（秒），默认为 3600 秒（1 小时）
    :return: 预签名的 URL
    """
    # 创建 S3 客户端
    s3 = boto3.client(
        "s3",
        aws_access_key_id=obs_config.get("ak"),
        aws_secret_access_key=obs_config.get("sk"),
        aws_session_token=obs_config.get("session_token"),
        region_name=obs_config.get("region"),
        endpoint_url=obs_config.get("endpoint")
    )

    # 生成预签名 URL
    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket_name, "Key": key},
        ExpiresIn=expiration
    )
    print(f"Generated presigned URL: {presigned_url}")

    return presigned_url