"""Offline selected-version contract and real Draft-07 template validation."""
from pathlib import Path
import json
import re
import struct
import sys
import zlib

import yaml
from copy import deepcopy
from jsonschema import Draft7Validator, validators
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT.parents[2] / 'schemas'


def check_png(path):
    data = path.read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n'), 'Logo must be an actual PNG'
    offset, compressed, size = 8, bytearray(), None
    while offset < len(data):
        length = struct.unpack('>I', data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8]
        content = data[offset + 8:offset + 8 + length]
        crc = struct.unpack('>I', data[offset + 8 + length:offset + 12 + length])[0]
        assert zlib.crc32(kind + content) & 0xffffffff == crc, 'Invalid PNG CRC'
        if kind == b'IHDR':
            size = struct.unpack('>II', content[:8])
        if kind == b'IDAT':
            compressed.extend(content)
        offset += 12 + length
    assert size and min(size) > 0
    assert zlib.decompress(compressed), 'Empty PNG raster'
    return size


def schema_check(value, filename):
    path = SCHEMAS / filename
    schema = json.loads(path.read_text())
    # The supplied platform schema declares ExtendType=secret and also applies
    # the Draft-07 meta-schema to parameter schemas. Register that explicit
    # extension in an in-memory meta-schema; never change the repository schema.
    meta = deepcopy(Draft7Validator.META_SCHEMA)
    meta['definitions']['simpleTypes']['enum'].append('secret')
    registry = Registry().with_resource('http://json-schema.org/draft-07/schema', Resource.from_contents(meta))
    for name in ('publish-schema.json', 's-schema.json', 'zfc-component-schema.json'):
        local = SCHEMAS / name
        registry = registry.with_resource(local.as_uri(), Resource.from_contents(json.loads(local.read_text())))
    schema = dict(schema, **{'$id': path.as_uri()})
    errors = sorted(Draft7Validator(schema, registry=registry).iter_errors(value), key=lambda e: str(e.path))
    if errors:
        raise ValueError('; '.join(f'{list(e.path)}: {e.message}' for e in errors))


def main():
    publish = yaml.safe_load((ROOT / 'publish.yaml').read_text())
    assert str(publish['Version']) == '2.19.3', 'Template version is not selected2.19.3'
    assert '2.19.3' in publish['HomePage']
    schema_check(publish, 'publish-schema.json')
    props = publish['Parameters']['properties']
    assert set(publish['Parameters']['required']) <= set(props)
    values = {k: p['default'] for k, p in props.items() if 'default' in p}
    values.update(region='beijing', PenpotFunctionName='penpot-q1-schema',
        PENPOT_SECRET_KEY='a'*64, POSTGRES_HOST='postgres', POSTGRES_PORT='5432',
        POSTGRES_DATABASE='penpot', POSTGRES_USERNAME='penpot', POSTGRES_PASSWORD='schema-fixture',
        REDIS_HOST='valkey', REDIS_PORT='6379', REDIS_PASSWORD='schema-fixture',
        REDIS_DATABASE='0', POLEFS_VOLUME='schema-volume', POLEFS_VOLUME_CREATE_USER='schema-user',
        S3_HOST='s3.example.invalid', S3_PORT='443', S3_BUCKET='penpot-q1', S3_REGION='us-east-1',
        S3_AK='schema-fixture', S3_SK='schema-fixture', S3_ENDPOINT='https://s3.example.invalid')
    values['PenpotFunctionName'] = 'penpot-q1-schema'
    checker = Draft7Validator.TYPE_CHECKER.redefine('secret', lambda c,v: isinstance(v,str))
    InputValidator = validators.extend(Draft7Validator, type_checker=checker)
    InputValidator(publish['Parameters']).validate(values)
    for key, spec in props.items():
        if spec.get('type') == 'secret':
            assert not spec.get('default'), f'Secret default forbidden: {key}'
        if 'default' in spec and '${' not in str(spec['default']):
            InputValidator(spec).validate(spec['default'])
    source = yaml.safe_load((ROOT / 'src/s.yaml').read_text())
    def inputs(v):
        if isinstance(v,dict):return {k:inputs(x) for k,x in v.items()}
        if isinstance(v,list):return [inputs(x) for x in v]
        if isinstance(v,str):
            def replace(m):
                key = m[1].strip()
                assert key in values, f'Undeclared input {key}'
                return str(values[key])
            return re.sub(r'\{\{([^{}]+)\}\}', replace, v)
        return v
    rendered = inputs(source)
    def variables(v):
        if isinstance(v,dict):return {k:variables(x) for k,x in v.items()}
        if isinstance(v,list):return [variables(x) for x in v]
        if isinstance(v,str):
            return re.sub(r'\$\{vars\.([A-Za-z0-9_]+)\}', lambda m:str(rendered['vars'][m[1]]),v)
        return v
    rendered = variables(rendered)
    schema_check(rendered, 's-schema.json')
    assert len(rendered['resources']) == 1, 'Selected scope is exactly one FC component'
    resource = rendered['resources']['penpot']['props']
    assert resource['port'] == 8080
    assert resource['scale']['min'] == resource['scale']['max'] == 1
    assert resource['sourceSubDir'] == 'combined'
    assert resource['nasConfig'][0]['mountDir'] == '/data'
    assert all(isinstance(v,str) for v in resource['environmentVariables'].values())
    docker = ROOT/'src/combined/Dockerfile'
    lines = [s.strip() for s in docker.read_text().splitlines() if s.strip() and not s.lstrip().startswith('#')]
    assert lines == ['FROM penpot-appmkt:2.19.3-r1-rc1'], 'Thin Dockerfile must use the recorded local candidate only'
    assert set((ROOT/'src').glob('**/Dockerfile')) == {docker}
    size = check_png(ROOT/'logo.png')
    print(json.dumps({'publishSchema':'PASS','renderedSchema':'PASS','parameters':'PASS',
        'component':'PASS','logo':size,'version':'2.19.3','registry':'NOT_RUN','FC':'NOT_RUN'}))
    if len(sys.argv) == 2:
        out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
        (out/'rendered-s.yaml').write_text(yaml.safe_dump(rendered,sort_keys=False))
        (out/'schema-paths.json').write_text(json.dumps({n:str(SCHEMAS/n) for n in ('publish-schema.json','s-schema.json','zfc-component-schema.json')},indent=2))


if __name__ == '__main__':
    main()
