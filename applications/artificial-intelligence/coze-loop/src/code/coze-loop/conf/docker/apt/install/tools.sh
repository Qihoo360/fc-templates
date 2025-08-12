#!/bin/sh

set -ex

cat /etc/apt/sources.list

apt-get update

apt-get install -y --no-install-recommends \
  curl \
  git \
  openssh-client \
  net-tools \
  xz-utils

rm -rf /var/lib/apt/lists/*