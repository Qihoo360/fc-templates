"""Run the actual backend config builder and frontend preflight; no live services."""
import importlib.util
import os
import sys
import tempfile
from pathlib import Path
import subprocess
import unittest
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('penpot_runtime', ROOT / 'src/backend/entrypoint.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


def environment():
    return {
        'PENPOT_PUBLIC_URI': 'https://penpot-dev.example.test',
        'PENPOT_SECRET_KEY': 'test-only-' + 'x' * 60,
        'POSTGRES_HOST': 'postgres.internal', 'POSTGRES_PORT': '5432',
        'POSTGRES_DATABASE': 'penpot_dev', 'POSTGRES_USERNAME': 'penpot',
        'POSTGRES_PASSWORD': 'pg:pass@word', 'POSTGRES_SSL_MODE': 'require',
        'REDIS_HOST': 'valkey.internal', 'REDIS_PORT': '6379', 'REDIS_DATABASE': '0',
        'REDIS_USERNAME': 'acl-user', 'REDIS_PASSWORD': 'pw@:/?#% &"',
        'PENPOT_ADMIN_CONSOLE_URI': 'http://admin.internal',
        'S3_HOST': 'obs.internal', 'S3_PORT': '9000',
        'S3_BUCKET': 'penpot-dev-assets', 'S3_REGION': 'beijing',
        'S3_AK': 'test-access-key', 'S3_SK': 'test-secret-key',
        'S3_ENDPOINT': 'http://obs.internal:9000',
        'APPMKT_ALLOW_REGISTRATION': 'false',
    }


class BackendTests(unittest.TestCase):
    def test_platform_components_map_to_official_environment(self):
        result = runtime.build_environment(environment())
        self.assertEqual(result['PENPOT_DATABASE_URI'], 'postgresql://postgres.internal:5432/penpot_dev?sslmode=require')
        self.assertEqual(result['PENPOT_DATABASE_USERNAME'], 'penpot')
        self.assertEqual(result['PENPOT_DATABASE_PASSWORD'], 'pg:pass@word')
        self.assertEqual(result['PENPOT_OBJECTS_STORAGE_BACKEND'], 's3')
        self.assertEqual(result['PENPOT_OBJECTS_STORAGE_S3_ENDPOINT'], 'http://obs.internal:9000')
        self.assertEqual(result['PENPOT_OBJECTS_STORAGE_S3_REGION'], 'beijing')
        self.assertEqual(result['PENPOT_OBJECTS_STORAGE_S3_BUCKET'], 'penpot-dev-assets')
        self.assertEqual(result['AWS_ACCESS_KEY_ID'], 'test-access-key')
        self.assertEqual(result['AWS_SECRET_ACCESS_KEY'], 'test-secret-key')
        self.assertEqual(result['PENPOT_FILE_DATA_BACKEND'], 'db')
        self.assertEqual(result['PENPOT_TELEMETRY_ENABLED'], 'false')

    def test_redis_acl_special_characters_are_encoded_exactly_once(self):
        env = environment()
        result = runtime.build_environment(env)
        uri = urlsplit(result['PENPOT_REDIS_URI'])
        self.assertEqual(uri.hostname, 'valkey.internal')
        self.assertEqual(unquote(uri.username), env['REDIS_USERNAME'])
        self.assertEqual(unquote(uri.password), env['REDIS_PASSWORD'])
        self.assertEqual(uri.path, '/0')
        self.assertEqual(uri.fragment, '')

    def test_s3_host_and_port_are_validated_but_endpoint_is_authoritative(self):
        env = environment()
        env['S3_HOST'] = 'obs-alias.internal'
        env['S3_PORT'] = '443'
        env['S3_ENDPOINT'] = 'https://obs.internal'
        result = runtime.build_environment(env)
        self.assertEqual(result['PENPOT_OBJECTS_STORAGE_S3_ENDPOINT'], 'https://obs.internal')
        self.assertEqual(result['S3_HOST'], 'obs-alias.internal')
        self.assertEqual(result['S3_PORT'], '443')

    def test_default_flags_are_closed_and_keep_secure_cookies(self):
        result = runtime.build_environment(environment())
        flags = result['PENPOT_FLAGS'].split()
        for token in ('disable-registration', 'enable-admin-console', 'disable-prepl-server', 'disable-smtp', 'disable-telemetry', 'disable-mcp', 'enable-secure-session-cookies'):
            self.assertIn(token, flags)
        self.assertNotIn('disable-secure-session-cookies', flags)
        self.assertNotIn('disable-email-verification', flags)

    def test_registration_requires_explicit_dev_opt_in(self):
        env = environment()
        env['APPMKT_ALLOW_REGISTRATION'] = 'true'
        flags = runtime.build_environment(env)['PENPOT_FLAGS'].split()
        self.assertIn('enable-registration', flags)
        self.assertIn('disable-email-verification', flags)

    def test_missing_component_fields_and_secret_fail_without_echoing_values(self):
        for field in ('POSTGRES_HOST', 'POSTGRES_PASSWORD', 'REDIS_PASSWORD', 'PENPOT_SECRET_KEY', 'S3_ENDPOINT', 'S3_AK', 'S3_SK'):
            with self.subTest(field=field):
                env = environment()
                env.pop(field)
                with self.assertRaises(ValueError) as error:
                    runtime.build_environment(env)
                self.assertNotIn('pg:pass@word', str(error.exception))
                self.assertNotIn('test-secret-key', str(error.exception))

    def test_backend_cli_check_does_not_write_or_echo_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run(
                [sys.executable, '-I', '-S', str(ROOT / 'src/backend/entrypoint.py'), '--check-config'],
                cwd=directory, env=environment(), capture_output=True, text=True, timeout=10,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(list(Path(directory).iterdir()), [])
            self.assertNotIn(environment()['PENPOT_SECRET_KEY'], result.stdout + result.stderr)
            self.assertNotIn(environment()['REDIS_PASSWORD'], result.stdout + result.stderr)

    def test_pg_credentials_remain_separate_and_no_master_key_regeneration(self):
        env = environment()
        result = runtime.build_environment(env)
        self.assertEqual(result['PENPOT_SECRET_KEY'], env['PENPOT_SECRET_KEY'])
        self.assertNotIn(env['POSTGRES_PASSWORD'], result['PENPOT_DATABASE_URI'])
        self.assertEqual(runtime.build_environment(result)['PENPOT_SECRET_KEY'], env['PENPOT_SECRET_KEY'])

    def test_invalid_public_uri_ports_and_host_fail(self):
        cases = [('PENPOT_PUBLIC_URI', 'http://penpot.example'), ('PENPOT_PUBLIC_URI', 'https://user:key@example.test'),
                 ('PENPOT_PUBLIC_URI', 'https://example.test/subpath'), ('POSTGRES_PORT', '0'),
                 ('REDIS_PORT', '65536'), ('REDIS_DATABASE', '-1'), ('POSTGRES_HOST', 'host/evil'),
                 ('PENPOT_SECRET_KEY', 'change-this-insecure-key'), ('S3_ENDPOINT', 'obs.internal:9000'),
                 ('S3_ENDPOINT', 'http://obs.internal/path'), ('S3_PORT', '0'),
                 ('S3_BUCKET', 'bad bucket'), ('S3_REGION', 'bad region'),
                 ('APPMKT_ALLOW_REGISTRATION', 'yes')]
        for key, value in cases:
            with self.subTest(key=key, value=value):
                env = environment(); env[key] = value
                with self.assertRaises(ValueError): runtime.build_environment(env)


class FrontendTests(unittest.TestCase):
    def run_check(self, **updates):
        env = {'PATH': os.environ.get('PATH', '/usr/bin:/bin'),
               'PENPOT_PUBLIC_URI': 'https://penpot-dev.example.test',
               'PENPOT_BACKEND_URI': 'http://backend.internal',
               'PENPOT_ADMIN_CONSOLE_URI': 'http://admin.internal',
               'APPMKT_ALLOW_REGISTRATION': 'false', **updates}
        return subprocess.run(['bash', str(ROOT / 'src/frontend/entrypoint.sh'), '--check-config'],
                              env=env, capture_output=True, text=True, timeout=10)

    def test_valid_mvp_config_checks_without_touching_runtime_files(self):
        result = self.run_check()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_invalid_public_url_or_upstream_is_rejected(self):
        for key, value in [('PENPOT_PUBLIC_URI', 'http://example.test'),
                           ('PENPOT_BACKEND_URI', 'http://user:secret@backend'),
                           ('PENPOT_BACKEND_URI', 'http://http://backend'),
                           ('PENPOT_ADMIN_CONSOLE_URI', 'http://admin;injection'),
                           ('PENPOT_BACKEND_URI', 'http://backend:65536'),
                           ('PENPOT_PUBLIC_URI', 'https://example.test:0')]:
            with self.subTest(key=key, value=value):
                result = self.run_check(**{key: value})
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn('secret', result.stderr)


if __name__ == '__main__':
    unittest.main()
