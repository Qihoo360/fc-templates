#!/bin/bash
bash scripts/base_run.sh -s "LinuxOrWSL" -w 4 -m 19530 -q 8777 -c -o -b '{{.OPENAI_URL}}' -k '{{.OPENAI_API_KEY}}' -n '{{.OPENAI_MODELNAME}}' -l '4096'