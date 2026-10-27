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


def render(omit=()):
    values = example_parameters()
    for name in omit:
        values.pop(name, None)
    text = (ROOT / 'src/s.yaml').read_text(encoding='utf-8')

    def substitute(match):
        key = match[1].strip()
        if key not in values and match[2] is None:
            raise AssertionError('undeclared template field: ' + key)
        value = values.get(key)
        if not value and match[2] is not None:
            value = match[2]
        return str(value)

    return yaml.safe_load(re.sub(r"{{\s*([A-Za-z0-9_]+)(?:\s*\|\|\s*'([^']*)')?\s*}}", substitute, text))


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
        dockerfile = ROOT / 'src' / resource['sourceSubDir'] / 'Dockerfile'
        self.assertTrue(dockerfile.is_file())
        self.assertEqual(
            dockerfile.read_text(encoding='utf-8').strip(),
            'FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/opendots:v0.1.0.3@sha256:706b1128f577cc893367b7fbfcae3135b8be1aadbbf0aa6c9878ae99ab8599aa',
        )
        self.assertEqual(resource['port'], 4310)
        self.assertEqual(resource['scale']['min'], 1)
        self.assertEqual(resource['scale']['max'], 1)
        self.assertEqual(resource['nasConfig'][0]['mountDir'], '${vars.VOLUME_MOUNT_PATH}')
        self.assertEqual(doc['vars']['VOLUME_MOUNT_PATH'], '/data')
        self.assertEqual(resource['environmentVariables']['DATABASE_PATH'], '/data/opendots.sqlite')

    def test_model_and_intelligence_configuration_are_wired(self):
        env = render()['resources']['opendots']['props']['environmentVariables']
        self.assertEqual(env['CPK_INTELLIGENCE_API_KEY'], '${vars.INTELLIGENCE_API_KEY}')
        self.assertEqual(env['OPENAI_BASE_URL'], '${vars.OPENAI_URL}')
        self.assertEqual(env['OPENAI_MODEL'], '${vars.OPENAI_MODELNAME}')
        self.assertEqual(env['OPENAI_API_KEY'], '${vars.OPENAI_API_KEY}')
        self.assertEqual(env['OWNER_TOKEN'], '${vars.OWNER_TOKEN}')
        self.assertEqual(
            env['APP_ORIGIN'],
            '${vars.APP_ORIGIN}',
        )
        self.assertEqual(env['APP_PROXY_MODE'], 'fc')

    def test_origin_configuration_has_no_self_trigger_reference(self):
        rendered = json.dumps(render())
        self.assertNotIn('resources.opendots.output.httpTriggerUrl', rendered)
        self.assertEqual(publish()['Parameters']['properties']['APP_ORIGIN']['default'], '')

    def test_existing_application_parameters_can_omit_origin(self):
        doc = render(omit={'APP_ORIGIN'})
        self.assertEqual(doc['vars']['APP_ORIGIN'], '')

    def test_origin_parameter_is_optional_and_requires_a_bare_origin(self):
        schema = standard_schema(publish()['Parameters'])
        validator = jsonschema.Draft7Validator(schema)
        self.assertNotIn('APP_ORIGIN', schema['required'])
        for value in ('', 'https://dots.example', 'https://dots.example:8443', 'http://localhost:4310'):
            args = example_parameters()
            args['APP_ORIGIN'] = value
            validator.validate(args)
        for value in ('https://dots.example/', 'https://dots.example/path', 'https://user@dots.example', 'https://dots.example?x=1', 'https://dots.example#x', 'https://dots.example,https://other.example', 'https://dots.example\\path', 'https://dots.example"', '${injected}'):
            args = example_parameters()
            args['APP_ORIGIN'] = value
            with self.subTest(value=value):
                self.assertTrue(list(validator.iter_errors(args)))

    def test_platform_openai_parameter_names_match_zopenai_outputs(self):
        properties = publish()['Parameters']['properties']
        self.assertIn('OPENAI_URL', properties)
        self.assertIn('OPENAI_MODELNAME', properties)
        self.assertIn('OPENAI_API_KEY', properties)
        self.assertNotIn('OPENAI_BASE_URL', properties)
        self.assertNotIn('OPENAI_MODEL', properties)

    def test_all_template_variables_are_declared(self):
        doc = render()
        raw = json.dumps(doc)
        for name in re.findall(r'\$\{vars\.([A-Za-z0-9_]+)}', raw):
            self.assertIn(name, doc['vars'])


if __name__ == '__main__':
    unittest.main()
