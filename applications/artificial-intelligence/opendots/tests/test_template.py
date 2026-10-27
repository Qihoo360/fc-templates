"""Validate the OpenDots AppMkt template contract."""
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


def example_parameters():
    meta = publish()
    values = {
        name: prop['default']
        for name, prop in meta['Parameters']['properties'].items()
        if 'default' in prop
    }
    values.update({
        'OWNER_TOKEN': 'owner-token-' + 'a' * 24,
        'INTELLIGENCE_API_KEY': 'intelligence-test-key',
        'OPENAI_API_KEY': 'model-test-key',
        'POLEFS_VOLUME': 'bjpdc-polefs/opendots/test',
    })
    for key, value in list(values.items()):
        if isinstance(value, str):
            values[key] = value.replace('${default-suffix}', 'test1234')
    return values


def render():
    values = example_parameters()
    text = (ROOT / 'src/s.yaml').read_text(encoding='utf-8')

    def substitute(match):
        key = match[1].strip()
        if key not in values:
            raise AssertionError('undeclared template field: ' + key)
        return str(values[key])

    return yaml.safe_load(re.sub(r'{{\s*([A-Za-z0-9_]+)\s*}}', substitute, text))


class TemplateTests(unittest.TestCase):
    def test_publish_matches_repository_schema(self):
        meta = publish()
        normalized = copy.deepcopy(meta)
        normalized['Parameters'] = standard_schema(meta['Parameters'])
        schema = json.loads((REPO / 'schemas/publish-schema.json').read_text(encoding='utf-8'))
        jsonschema.Draft7Validator(schema).validate(normalized)

    def test_required_secrets_have_no_literal_defaults(self):
        properties = publish()['Parameters']['properties']
        for name in ('OWNER_TOKEN', 'INTELLIGENCE_API_KEY', 'OPENAI_API_KEY'):
            self.assertEqual(properties[name]['type'], 'secret')
            self.assertNotIn('default', properties[name])

    def test_rendered_component_is_single_instance_and_persistent(self):
        doc = render()
        self.assertEqual(set(doc['resources']), {'opendots'})
        resource = doc['resources']['opendots']['props']
        self.assertEqual(resource['sourceSubDir'], 'code/opendots')
        self.assertTrue((ROOT / 'src' / resource['sourceSubDir'] / 'Dockerfile').is_file())
        self.assertEqual(resource['port'], 4310)
        self.assertEqual(resource['scale']['min'], 1)
        self.assertEqual(resource['scale']['max'], 1)
        self.assertEqual(resource['nasConfig'][0]['mountDir'], '${vars.VOLUME_MOUNT_PATH}')
        self.assertEqual(doc['vars']['VOLUME_MOUNT_PATH'], '/data')
        self.assertEqual(resource['environmentVariables']['DATABASE_PATH'], '/data/opendots.sqlite')

    def test_model_and_intelligence_configuration_are_wired(self):
        env = render()['resources']['opendots']['props']['environmentVariables']
        self.assertEqual(env['CPK_INTELLIGENCE_API_KEY'], '${vars.INTELLIGENCE_API_KEY}')
        self.assertEqual(env['OPENAI_BASE_URL'], '${vars.OPENAI_BASE_URL}')
        self.assertEqual(env['OPENAI_MODEL'], '${vars.OPENAI_MODEL}')
        self.assertEqual(env['OPENAI_API_KEY'], '${vars.OPENAI_API_KEY}')
        self.assertEqual(env['OWNER_TOKEN'], '${vars.OWNER_TOKEN}')

    def test_all_template_variables_are_declared(self):
        doc = render()
        raw = json.dumps(doc)
        for name in re.findall(r'\$\{vars\.([A-Za-z0-9_]+)}', raw):
            self.assertIn(name, doc['vars'])


if __name__ == '__main__':
    unittest.main()
