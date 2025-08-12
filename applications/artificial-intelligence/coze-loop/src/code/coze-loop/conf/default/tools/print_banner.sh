#!/bin/sh

print_banner() {
  msg="$1"
  side=30
  content=" $msg "
  content_len=${#content}
  line_len=$((side * 2 + content_len))

  line=$(printf '=%.0s' $(seq 1 "$line_len"))
  side_eq=$(printf '=%.0s' $(seq 1 "$side"))

  printf "%s\n%s%s%s\n%s\n" "$line" "$side_eq" "$content" "$side_eq" "$line"
}

# 异步延迟打印 Banner
print_banner_delay() {
  msg="$1"
  delay="$2"

  (
    sleep "$delay"
    print_banner "$msg"
  ) &
}