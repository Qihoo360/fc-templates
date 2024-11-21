#!/bin/bash
bash scripts/base_run.sh -s "LinuxOrWSL" -w 4 -m 19530 -q 8777 -c -o -b '{{.OpenaiApiBase}}' -k '{{.OpenaiApiKey}}' -n '{{.OpenaiApiModel}}' -l '4096'
