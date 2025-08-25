#!/bin/sh 

set -e

envsubst < /app/resources/conf/model/model_template_openai.yaml > /app/resources/conf/model/openai.yaml

echo starting opencoze ... 

/app/opencoze