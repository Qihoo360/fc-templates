import copy
import json
from pathlib import Path
import re
import unittest

import jsonschema
import yaml

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[2]


def publish():
    return yaml.safe_load((ROOT / 'publish.yaml').read_text(encoding='utf-8'))


def standard_schema(value):
    value = copy.deepcopy(value)
    for prop in value.get('properties', {}).values():
        if prop.get('type') == 'secret':
            prop['type'] = 'string'
    return value


def values():
    meta = publish()
    result = {name: prop['default'] for name, prop in meta['Parameters']['properties'].items() if 'default' in prop}
    result.update({
        'TOONFLOW_AUTH_PASSWORD': 'local-test-password-1234',
        'POLEFS_VOLUME': 'bjpdc-polefs/toonflow/test',
    })
    return result


def render():
    env = values()
    text = (ROOT / 'src/s.yaml').read_text(encoding='utf-8')
    def substitute(match):
        key = match[1].strip()
        if key not in env:
            raise AssertionError(f'undeclared template field: {key}')
        return str(env[key])
    return yaml.safe_load(re.sub(r'{{\s*([A-Za-z0-9_]+)\s*}}', substitute, text))


class TemplateTests(unittest.TestCase):
    def test_publish_matches_schema(self):
        meta = publish()
        normalized = copy.deepcopy(meta)
        normalized['Parameters'] = standard_schema(meta['Parameters'])
        schema = json.loads((REPO / 'schemas/publish-schema.json').read_text(encoding='utf-8'))
        jsonschema.Draft7Validator(schema).validate(normalized)

    def test_required_secret_has_no_default(self):
        prop = publish()['Parameters']['properties']['TOONFLOW_AUTH_PASSWORD']
        self.assertEqual(prop['type'], 'secret')
        self.assertNotIn('default', prop)
        self.assertGreaterEqual(prop['minLength'], 16)

    def test_rendered_single_instance_polefs_and_image(self):
        doc = render()
        resource = doc['resources']['toonflow']['props']
        self.assertEqual(resource['sourceSubDir'], 'code/toonflow')
        dockerfile = ROOT / 'src' / resource['sourceSubDir'] / 'Dockerfile'
        self.assertEqual(dockerfile.read_text(encoding='utf-8').strip(), 'FROM wfwqjs-eventing-zevent-pub/toonflow-appmkt:2.0.10.1')
        self.assertEqual(resource['port'], 3000)
        self.assertEqual(resource['scale']['min'], 1)
        self.assertEqual(resource['scale']['max'], 1)
        self.assertEqual(resource['nasConfig'][0]['mountDir'], '${vars.VOLUME_MOUNT_PATH}')
        self.assertEqual(doc['vars']['VOLUME_MOUNT_PATH'], '/data')
        env = resource['environmentVariables']
        self.assertEqual(env['TOONFLOW_DATA_DIR'], '/data/toonflow')
        self.assertEqual(env['TOONFLOW_AUTH_REQUIRED'], 'true')
        self.assertEqual(env['TOONFLOW_AUTH_PASSWORD'], '${vars.AUTH_PASSWORD}')

    def test_logo_exists(self):
        self.assertTrue((ROOT / 'logo.png').is_file())


if __name__ == '__main__':
    unittest.main()
