#!/bin/sh

rmq_home() {
  base_dir="/home/rocketmq"
  for d in "$base_dir"/rocketmq-*; do
    [ -d "$d" ] && echo "$d" && return
  done
}