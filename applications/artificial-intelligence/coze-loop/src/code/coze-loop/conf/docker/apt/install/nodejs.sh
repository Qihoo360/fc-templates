#!/bin/sh

set -ex

cd /tmp
curl -LO https://nodejs.org/dist/v20.13.1/node-v20.13.1-linux-x64.tar.xz
tar -xJf node-v20.13.1-linux-x64.tar.xz
mv node-v20.13.1-linux-x64 /usr/local/nodejs
rm node-v20.13.1-linux-x64.tar.xz

ln -s /usr/local/nodejs/bin/node /usr/bin/node
ln -s /usr/local/nodejs/bin/npm /usr/bin/npm
ln -s /usr/local/nodejs/bin/npx /usr/bin/npx
ln -s /usr/local/nodejs/bin/pnpm /usr/bin/pnpm

npm install -g pnpm@8.15.8 @microsoft/rush@5.147.1
ln -s /usr/local/nodejs/bin/rush /usr/bin/rush