#!/bin/sh 

set -e

if [ ! -d "/app/resources/conf" ]; then
    echo "Error : config dir [/app/resources/conf] not exist!"
fi

if [ ! -d "/app/resources/conf/model" ]; then
    cp -r /app/resources/conf-ori/model /app/resources/conf/model
fi

if [ ! -d "/app/resources/conf/plugin" ]; then
    cp -r /app/resources/conf-ori/plugin /app/resources/conf/plugin
fi

if [ ! -d "/app/resources/conf/prompt" ]; then
    cp -r /app/resources/conf-ori/prompt /app/resources/conf/prompt
fi

echo starting opencoze ... 

/app/opencoze