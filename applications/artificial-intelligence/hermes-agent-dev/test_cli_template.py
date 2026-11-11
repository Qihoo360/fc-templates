"""Offline shared-model mapping contract; does not emulate the platform renderer."""
import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).parent
OLD_FIELDS = [f"{cli}_CLI_{field}" for cli in ("CODEX", "CLAUDE") for field in ("API_KEY", "BASE_URL", "MODEL")]


class CliTemplateContract(unittest.TestCase):
    def render(self, inputs):
        source = (ROOT / "src/s.yaml").read_text()
        def value(match):
            name = match.group(1).strip().split("||")[0].strip()
            return str(inputs.get(name, ""))
        return yaml.safe_load(re.sub(r"\{\{(.*?)\}\}", value, source))

    def test_no_independent_cli_model_or_secret_inputs(self):
        params = yaml.safe_load((ROOT / "publish.yaml").read_text())["Parameters"]
        template = self.render({})
        env = template["resources"]["hermes-agent"]["props"]["environmentVariables"]
        for field in OLD_FIELDS:
            with self.subTest(field=field):
                self.assertNotIn(field, params["properties"])
                self.assertNotIn(field, template["vars"])
                self.assertNotIn(field, env)

    def test_main_model_is_the_only_declared_source(self):
        supplied = {"OPENAI_URL": "https://fixture.example/v1", "OPENAI_MODELNAME": "shared-model", "OPENAI_API_KEY": "fixture-only"}
        template = self.render(supplied)
        env = template["resources"]["hermes-agent"]["props"]["environmentVariables"]
        for runtime_name, parameter in (("OPENAI_URL", "OPENAI_URL"), ("HERMES_DEFAULT_MODEL", "OPENAI_MODELNAME"), ("APPMKT_API_KEY", "OPENAI_API_KEY")):
            self.assertEqual(env[runtime_name], "${vars." + parameter + "}")
            self.assertEqual(template["vars"][parameter], supplied[parameter])
        params = yaml.safe_load((ROOT / "publish.yaml").read_text())["Parameters"]
        self.assertEqual(params["properties"]["OPENAI_API_KEY"]["type"], "secret")

    def test_single_instance_and_polefs_contract_unchanged(self):
        template = self.render({})
        resource = template["resources"]["hermes-agent"]["props"]
        self.assertEqual(resource["scale"]["min"], 1)
        self.assertEqual(resource["scale"]["max"], 1)
        self.assertEqual(template["vars"]["VOLUME_MOUNT_PATH"], "/data")
        self.assertTrue(resource["nasConfig"])


if __name__ == "__main__":
    unittest.main()
