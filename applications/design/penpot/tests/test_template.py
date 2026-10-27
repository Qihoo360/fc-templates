"""Validate actual AppMkt configuration artifacts, not application source shape."""
import copy
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
    # AppMkt extends JSON-Schema type with 'secret'. Normalize its validation
    # type to string, but verify the original secret marker separately.
    value = copy.deepcopy(value)
    for prop in value.get('properties', {}).values():
        if prop.get('type') == 'secret': prop['type'] = 'string'
    return value


def example_parameters():
    meta = publish()
    values = {name: prop['default'] for name, prop in meta['Parameters']['properties'].items() if 'default' in prop}
    values.update({
        'PENPOT_SECRET_KEY': 'a' * 86,
        'POSTGRES_HOST': 'pg.internal', 'POSTGRES_USERNAME': 'penpot', 'POSTGRES_PASSWORD': 'pg:pw@%"',
        'REDIS_HOST': 'valkey.internal', 'REDIS_PASSWORD': 'redis:pw@%"',
        'S3_HOST': 'obs.internal', 'S3_PORT': '9000',
        'S3_BUCKET': 'penpot-dev-assets', 'S3_REGION': 'beijing',
        'S3_AK': 'test-access-key', 'S3_SK': 'test-secret-key',
        'S3_ENDPOINT': 'http://obs.internal:9000',
    })
    for key, value in list(values.items()):
        if isinstance(value, str): values[key] = value.replace('${default-suffix}', 'test1234')
    return values


def render():
    values = example_parameters()
    text = (ROOT / 'src/s.yaml').read_text(encoding='utf-8')
    def substitute(match):
        key = match[1].strip()
        if key not in values: raise AssertionError('undeclared template field: ' + key)
        return str(values[key])
    return yaml.safe_load(re.sub(r'{{\s*([A-Za-z0-9_]+)\s*}}', substitute, text))


class TemplateTests(unittest.TestCase):
    def test_publish_matches_repository_schema_with_secret_extension(self):
        meta = publish()
        normalized = copy.deepcopy(meta)
        normalized['Parameters'] = standard_schema(meta['Parameters'])
        schema = __import__('json').loads((REPO / 'schemas/publish-schema.json').read_text(encoding='utf-8'))
        jsonschema.Draft7Validator(schema).validate(normalized)

    def test_example_component_inputs_and_secret_classification(self):
        meta = publish()
        jsonschema.Draft7Validator(standard_schema(meta['Parameters'])).validate(example_parameters())
        for name in ('POSTGRES_PASSWORD', 'REDIS_PASSWORD', 'PENPOT_SECRET_KEY', 'S3_AK', 'S3_SK'):
            self.assertEqual(meta['Parameters']['properties'][name]['type'], 'secret')
            self.assertNotIn('default', meta['Parameters']['properties'][name])
        self.assertEqual(meta['Parameters']['properties']['POSTGRES_HOST']['x-restype'], 'postgresql')
        self.assertEqual(meta['Parameters']['properties']['REDIS_HOST']['x-restype'], 'redis')
        self.assertEqual(meta['Parameters']['properties']['S3_ENDPOINT']['x-restype'], 's3')
        self.assertEqual(meta['Parameters']['properties']['S3_AK']['x-restype'], 's3')

    def test_quoted_template_inputs_reject_single_quote_newline_or_interpolation(self):
        validator = jsonschema.Draft7Validator(standard_schema(publish()['Parameters']))
        for value in ("quote'password", 'new\nline', '${injected}'):
            args = example_parameters(); args['REDIS_PASSWORD'] = value
            with self.subTest(value=value): self.assertTrue(list(validator.iter_errors(args)))

    def test_multi_resource_template_render_is_complete(self):
        doc = render()
        self.assertEqual(set(doc['resources']), {'penpotAdminConsole', 'penpotBackend', 'penpotFrontend'})
        self.assertEqual(doc['vars']['POSTGRES_PASSWORD'], 'pg:pw@%"')
        for name, resource in doc['resources'].items():
            props = resource['props']
            self.assertTrue((ROOT / 'src' / props['sourceSubDir'] / 'Dockerfile').is_file())
            self.assertEqual(props['networkType'], 'vpc')
            self.assertEqual(props['scale']['min'], 1)
            self.assertEqual(props['scale']['max'], 1)
            trigger = props['triggers'][0]
            internal_only = name != 'penpotFrontend'
            self.assertEqual(trigger['disableURLInternet'], internal_only)
            self.assertEqual(trigger['triggerConfig']['disable_url_internet'], internal_only)
            for key, value in props['environmentVariables'].items():
                if isinstance(value, str):
                    for name in re.findall(r'\$\{vars\.([A-Za-z0-9_]+)}', value):
                        self.assertIn(name, doc['vars'])

    def test_public_uri_uses_frontend_trigger_without_user_input(self):
        parameters = publish()['Parameters']
        doc = render()
        self.assertNotIn('PENPOT_PUBLIC_URI', parameters['required'])
        self.assertNotIn('PENPOT_PUBLIC_URI', parameters['properties'])
        self.assertNotIn('PENPOT_PUBLIC_URI', doc['vars'])
        expected = 'https://${resources.penpotFrontend.output.httpTriggerUrl}'
        for name, resource in doc['resources'].items():
            with self.subTest(resource=name):
                self.assertEqual(resource['props']['environmentVariables']['PENPOT_PUBLIC_URI'], expected)
        admin_env = doc['resources']['penpotAdminConsole']['props']['environmentVariables']
        self.assertEqual(admin_env['PENPOT_INTERNAL_URI'], expected)

    def test_s3_is_backend_only_and_master_secret_consistency(self):
        resources = render()['resources']
        front = resources['penpotFrontend']['props']
        back = resources['penpotBackend']['props']
        admin = resources['penpotAdminConsole']['props']
        self.assertNotIn('nasConfig', front)
        self.assertNotIn('nasConfig', back)
        self.assertEqual(render()['vars']['S3_ENDPOINT'], 'http://obs.internal:9000')
        self.assertEqual(render()['vars']['S3_BUCKET'], 'penpot-dev-assets')
        self.assertEqual(render()['vars']['S3_REGION'], 'beijing')
        self.assertEqual(back['environmentVariables']['S3_ENDPOINT'], '${vars.S3_ENDPOINT}')
        self.assertEqual(back['environmentVariables']['S3_BUCKET'], '${vars.S3_BUCKET}')
        self.assertEqual(back['environmentVariables']['S3_REGION'], '${vars.S3_REGION}')
        self.assertEqual(back['environmentVariables']['S3_AK'], '${vars.S3_AK}')
        self.assertEqual(back['environmentVariables']['S3_SK'], '${vars.S3_SK}')
        self.assertEqual(back['environmentVariables']['PENPOT_FILE_DATA_BACKEND'], 'db')
        for name in ('S3_AK', 'S3_SK', 'S3_ENDPOINT'):
            self.assertNotIn(name, admin['environmentVariables'])
            self.assertNotIn(name, front['environmentVariables'])
        self.assertEqual(admin['environmentVariables']['PENPOT_SECRET_KEY'], back['environmentVariables']['PENPOT_SECRET_KEY'])
        self.assertEqual(admin['environmentVariables']['PENPOT_PUBLIC_URI'], back['environmentVariables']['PENPOT_PUBLIC_URI'])
        self.assertNotIn('PENPOT_SECRET_KEY', front['environmentVariables'])

    def test_output_references_match_direct_frontend_trigger_mode(self):
        resources = render()['resources']
        graph = {}
        for name, resource in resources.items():
            raw = __import__('json').dumps(resource)
            graph[name] = set(re.findall(r'\$\{resources\.([A-Za-z0-9_]+)\.output\.httpTriggerUrl}', raw))
            self.assertTrue(graph[name].issubset(resources))
        # These assertions describe the requested direct-reference mode only.
        # Its self/cyclic references still require validation by the deployment engine.
        self.assertEqual(graph['penpotAdminConsole'], {'penpotFrontend'})
        self.assertEqual(graph['penpotBackend'], {'penpotAdminConsole', 'penpotFrontend'})
        self.assertEqual(graph['penpotFrontend'], {'penpotBackend', 'penpotAdminConsole', 'penpotFrontend'})


if __name__ == '__main__': unittest.main()
