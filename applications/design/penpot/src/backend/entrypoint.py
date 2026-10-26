#!/usr/bin/env python3
"""Map AppMkt resource fields to Penpot's official backend environment.

No database, object-storage, migration or network call occurs in --check-config.
"""
import os
import re
import sys
from urllib.parse import quote, urlsplit

FLAGS = ('enable-login-with-password enable-admin-console enable-secure-session-cookies '
         'disable-smtp disable-telemetry disable-prepl-server disable-mcp '
         'disable-remote-media-processing enable-air-gapped-conf '
         'disable-google-fonts-provider disable-dashboard-templates-section')


def required(env, name):
    value = env.get(name)
    if not isinstance(value, str) or not value or any(ord(char) < 32 for char in value):
        raise ValueError(f'{name} is required and must be single-line')
    return value


def origin(value, name, *, public=False):
    try:
        parts = urlsplit(value)
        if (parts.scheme not in ({'https'} if public else {'http', 'https'})
                or not parts.hostname or parts.username or parts.password
                or parts.path not in {'', '/'} or parts.query or parts.fragment
                or not re.fullmatch(r'[A-Za-z0-9.:/\[\]-]+', value)):
            raise ValueError()
        if parts.port is not None and not 1 <= parts.port <= 65535:
            raise ValueError()
    except ValueError:
        raise ValueError(f'{name} must be a valid root origin' + (' using HTTPS' if public else '')) from None
    return value.rstrip('/')


def port(env, name):
    value = required(env, name)
    if not value.isdigit() or not 1 <= int(value) <= 65535:
        raise ValueError(f'{name} must be a valid TCP port')
    return str(int(value))


def host(env, name):
    value = required(env, name)
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9.-]*', value):
        raise ValueError(f'{name} must be a hostname or IPv4 address')
    return value


def s3_bucket(env):
    value = required(env, 'S3_BUCKET')
    if not 3 <= len(value) <= 63 or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9]', value):
        raise ValueError('S3_BUCKET must be a 3-63 character bucket name')
    return value


def s3_region(env):
    value = required(env, 'S3_REGION')
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,63}', value):
        raise ValueError('S3_REGION must be a non-empty region identifier')
    return value


def build_environment(env):
    result = dict(env)
    public_uri = origin(required(env, 'PENPOT_PUBLIC_URI'), 'PENPOT_PUBLIC_URI', public=True)
    admin_uri = origin(required(env, 'PENPOT_ADMIN_CONSOLE_URI'), 'PENPOT_ADMIN_CONSOLE_URI')
    secret = required(env, 'PENPOT_SECRET_KEY')
    if len(secret) < 64 or not re.fullmatch(r'[A-Za-z0-9_-]+', secret):
        raise ValueError('PENPOT_SECRET_KEY must be a persistent random URL-safe value of at least 64 characters')
    dbname = required(env, 'POSTGRES_DATABASE')
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', dbname):
        raise ValueError('POSTGRES_DATABASE must be a PostgreSQL identifier')
    sslmode = required(env, 'POSTGRES_SSL_MODE')
    if sslmode not in {'disable', 'require', 'verify-full'}:
        raise ValueError('POSTGRES_SSL_MODE must be disable, require or verify-full')
    registration = env.get('APPMKT_ALLOW_REGISTRATION', 'false')
    if registration not in {'true', 'false'}:
        raise ValueError('APPMKT_ALLOW_REGISTRATION must be true or false')
    redis_db = required(env, 'REDIS_DATABASE')
    if not redis_db.isdigit() or not 0 <= int(redis_db) <= 15:
        raise ValueError('REDIS_DATABASE must be between 0 and 15; use a dedicated Valkey/Redis instance')

    # AppMkt exposes host/port as resource metadata, while Penpot needs a
    # complete S3-compatible endpoint URI. Endpoint is authoritative; host
    # and port are still validated to catch an incomplete resource binding.
    s3_host = host(env, 'S3_HOST')
    s3_port = port(env, 'S3_PORT')
    s3_endpoint = origin(required(env, 'S3_ENDPOINT'), 'S3_ENDPOINT')
    bucket = s3_bucket(env)
    region = s3_region(env)
    s3_ak = required(env, 'S3_AK')
    s3_sk = required(env, 'S3_SK')

    redis_password = quote(required(env, 'REDIS_PASSWORD'), safe='')
    redis_username = quote(env.get('REDIS_USERNAME', ''), safe='')
    result.update({
        'PENPOT_PUBLIC_URI': public_uri,
        'PENPOT_ADMIN_CONSOLE_URI': admin_uri,
        'PENPOT_DATABASE_URI': f'postgresql://{host(env, "POSTGRES_HOST")}:{port(env, "POSTGRES_PORT")}/{dbname}?sslmode={sslmode}',
        'PENPOT_DATABASE_USERNAME': required(env, 'POSTGRES_USERNAME'),
        'PENPOT_DATABASE_PASSWORD': required(env, 'POSTGRES_PASSWORD'),
        'PENPOT_REDIS_URI': f'redis://{redis_username}:{redis_password}@{host(env, "REDIS_HOST")}:{port(env, "REDIS_PORT")}/{int(redis_db)}',
        'PENPOT_SECRET_KEY': secret,
        'PENPOT_FLAGS': FLAGS + (' enable-registration disable-email-verification' if registration == 'true' else ' disable-registration'),
        'PENPOT_OBJECTS_STORAGE_BACKEND': 's3',
        'PENPOT_OBJECTS_STORAGE_S3_ENDPOINT': s3_endpoint,
        'PENPOT_OBJECTS_STORAGE_S3_REGION': region,
        'PENPOT_OBJECTS_STORAGE_S3_BUCKET': bucket,
        'AWS_ACCESS_KEY_ID': s3_ak,
        'AWS_SECRET_ACCESS_KEY': s3_sk,
        'PENPOT_FILE_DATA_BACKEND': 'db',
        'PENPOT_TELEMETRY_ENABLED': 'false',
        'PENPOT_HTTP_SERVER_HOST': '0.0.0.0',
        'PENPOT_HTTP_SERVER_PORT': '6060',
    })
    # Keep these values in the effective environment for diagnostics without
    # exposing credentials or changing the AppMkt resource contract.
    result['S3_HOST'] = s3_host
    result['S3_PORT'] = s3_port
    return result


def main():
    try:
        env = build_environment(os.environ)
        if sys.argv[1:] == ['--check-config']:
            print('Penpot backend configuration valid (S3/OBS, no connection attempted)')
            return 0
        if sys.argv[1:]:
            raise ValueError('unexpected entrypoint arguments')
        os.execve('/bin/bash', ['/bin/bash', 'run.sh'], env)
    except ValueError as error:
        print(f'Penpot backend blocked: {error}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
