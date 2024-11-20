#!/bin/sh
set -ex

echo Start custom-run...

# pwd is /workspace/userdefined-nodejs

export NPM_CONFIG_LOGLEVEL="error"
export PATH="$PATH:/workspace/userdefined-nodejs/node_modules/.bin"

sh start.sh

echo End custom-run.
