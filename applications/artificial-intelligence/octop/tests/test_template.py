"""Validate the rendered FC boundary, including automatic middleware fields."""
import copy
import json
import re
import struct
import zlib
import unittest
from pathlib import Path

import jsonschema
import yaml

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[2]


def load():
    return yaml.safe_load((ROOT / 'publish.yaml').read_text())


def normalized(value):
    value = copy.deepcopy(value)
    for prop in value.get('properties', {}).values():
        if prop.get('type') == 'secret':
            prop['type'] = 'string'
    return value


def render():
    values = {k: p['default'] for k, p in load()['Parameters']['properties'].items() if 'default' in p}
    values.update(OPENAI_API_KEY='synthetic-key', OCTOP_DEFAULT_PASSWORD='OctopTestLocal9234',
                  OCTOP_ADMIN_USERNAME='octop-owner', POLEFS_VOLUME='test-volume',
                  POLEFS_VOLUME_CREATE_USER='test-user')
    values = {k: v.replace('${default-suffix}', 'local') if isinstance(v, str) else v for k, v in values.items()}
    jsonschema.Draft7Validator(normalized(load()['Parameters'])).validate(values)
    text = (ROOT / 'src/s.yaml').read_text()
    text = re.sub(r'{{\s*([A-Za-z0-9_]+)\s*}}', lambda m: str(values[m[1]]), text)
    doc = yaml.safe_load(text)
    def resolve(value):
        if isinstance(value, dict):
            return {k: resolve(v) for k, v in value.items()}
        if isinstance(value, list):
            return [resolve(v) for v in value]
        if isinstance(value, str):
            return re.sub(r'\$\{vars\.([A-Za-z0-9_]+)}', lambda m: str(doc['vars'][m[1]]), value)
        return value
    return resolve(doc)


class TemplateTests(unittest.TestCase):
    def test_publish_schema(self):
        doc = load()
        doc['Parameters'] = normalized(doc['Parameters'])
        jsonschema.Draft7Validator(json.loads((REPO / 'schemas/publish-schema.json').read_text())).validate(doc)

    def test_secrets_and_middleware_fields(self):
        properties = load()['Parameters']['properties']
        for key in ['OPENAI_API_KEY', 'OCTOP_DEFAULT_PASSWORD']:
            self.assertEqual(properties[key]['type'], 'secret')
            self.assertNotIn('default', properties[key])
        self.assertEqual(properties['OPENAI_URL']['x-restype'], 'openai')
        self.assertEqual(properties['OPENAI_MODELNAME']['x-restype'], 'openai')
        self.assertNotIn('x-restype', properties['OPENAI_API_KEY'])
        self.assertNotIn('OPENAI_BASE_URL', properties)

    def test_admin_credentials_are_explicit_user_inputs(self):
        properties = load()['Parameters']['properties']
        self.assertIn('OCTOP_ADMIN_USERNAME', load()['Parameters']['required'])
        self.assertIn('OCTOP_DEFAULT_PASSWORD', load()['Parameters']['required'])
        self.assertNotIn('default', properties['OCTOP_ADMIN_USERNAME'])
        self.assertNotIn('default', properties['OCTOP_DEFAULT_PASSWORD'])
        self.assertNotIn('x-random', properties['OCTOP_DEFAULT_PASSWORD'])
        self.assertNotIn('OPENAI_MODEL_NAME', properties)
        self.assertIn('OPENAI_API_KEY', load()['Parameters']['required'])

    def test_fc_runtime_and_persistent_home(self):
        doc = render()
        props = doc['resources']['octop']['props']
        env = props['environmentVariables']
        self.assertEqual(props['port'], 8088)
        self.assertEqual(props['scale']['min'], 1)
        self.assertEqual(props['scale']['max'], 1)
        self.assertEqual(props['nasConfig'][0]['mountDir'], '/data')
        self.assertEqual(env['HOME'], '/data/octop')
        self.assertEqual(env['OCTOP_HOME'], '/data/octop')
        self.assertEqual(env['OCTOP_DATABASE_SQLITE_PATH'], '/data/octop/octop.db')
        self.assertEqual(env['OCTOP_APPMKT_MODE'], '1')
        self.assertEqual(env['OPENAI_BASE_URL'], 'https://llm.api.zyuncs.com/v1')
        self.assertEqual(env['OPENAI_MODEL_NAME'], 'z-ai/glm-5.3')
        self.assertEqual(env['OPENAI_API_KEY'], 'synthetic-key')
        self.assertEqual(env['OCTOP_ADMIN_USERNAME'], 'octop-owner')
        self.assertEqual(env['OCTOP_DEFAULT_PASSWORD'], 'OctopTestLocal9234')
        self.assertNotRegex(json.dumps(doc), r'\$\{resources\.octop\.output\.')
        build_dir = ROOT / 'src' / props['sourceSubDir']
        self.assertEqual({p.name for p in build_dir.iterdir()}, {'Dockerfile'})

    def test_user_inputs_reject_missing_and_empty_values(self):
        validator = jsonschema.Draft7Validator(normalized(load()['Parameters']))
        values = {key: prop['default'] for key, prop in load()['Parameters']['properties'].items() if 'default' in prop}
        values.update(FunctionName='octop-local', OCTOP_ADMIN_USERNAME='owner',
                      OCTOP_DEFAULT_PASSWORD='SyntheticLocalPassword83', OPENAI_API_KEY='synthetic-key',
                      POLEFS_VOLUME='synthetic-volume', POLEFS_VOLUME_CREATE_USER='synthetic-user')
        validator.validate(values)
        for key in ['OCTOP_ADMIN_USERNAME', 'OCTOP_DEFAULT_PASSWORD', 'OPENAI_API_KEY']:
            with self.subTest(missing=key):
                invalid = dict(values)
                del invalid[key]
                self.assertTrue(list(validator.iter_errors(invalid)))
            with self.subTest(empty=key):
                self.assertTrue(list(validator.iter_errors({**values, key: ''})))

    def test_listing_logo_is_valid_png(self):
        raw = (ROOT / 'logo.png').read_bytes()
        self.assertEqual(raw[:8], b'\x89PNG\r\n\x1a\n')
        offset = 8
        chunks = []
        while offset < len(raw):
            size = struct.unpack('>I', raw[offset:offset+4])[0]
            kind = raw[offset+4:offset+8]
            payload = raw[offset+8:offset+8+size]
            checksum = struct.unpack('>I', raw[offset+8+size:offset+12+size])[0]
            self.assertEqual(zlib.crc32(kind + payload) & 0xffffffff, checksum)
            chunks.append((kind, payload))
            offset += 12 + size
        self.assertEqual(offset, len(raw))
        self.assertEqual(chunks[0][0], b'IHDR')
        width, height = struct.unpack('>II', chunks[0][1][:8])
        self.assertGreater(width, 0)
        self.assertGreater(height, 0)
        self.assertTrue(zlib.decompress(b''.join(data for kind, data in chunks if kind == b'IDAT')))
        self.assertEqual(chunks[-1][0], b'IEND')

    def test_password_rejects_unsafe_template_values(self):
        validator = jsonschema.Draft7Validator(normalized(load()['Parameters']['properties']['OCTOP_DEFAULT_PASSWORD']))
        # Normalize a single secret property for instance validation.
        validator = jsonschema.Draft7Validator({**validator.schema, 'type': 'string'})
        for value in ['short', 'onlyletterswithoutdigits', '123456789012', 'bad"injection123', 'line\nbreak123']:
            with self.subTest(value=value):
                self.assertTrue(list(validator.iter_errors(value)))


if __name__ == '__main__':
    unittest.main()
