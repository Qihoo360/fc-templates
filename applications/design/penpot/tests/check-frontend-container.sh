#!/usr/bin/env bash
# Execute INSIDE the isolated candidate frontend container. No real credentials.
set -euo pipefail
export PENPOT_PUBLIC_URI=https://penpot-validation.example.test
export PENPOT_BACKEND_URI=http://127.0.0.1:6060
export PENPOT_ADMIN_CONSOLE_URI=http://127.0.0.1:3000
export APPMKT_ALLOW_REGISTRATION=false
scratch="$(mktemp -d)"
NGINX_PID=''
cleanup() {
  if [[ -n "$NGINX_PID" ]]; then
    kill "$NGINX_PID" 2>/dev/null || true
    wait "$NGINX_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Runs the REAL adapter entrypoint and the REAL official entrypoint/config.
/bin/bash /opt/penpot/appmkt-entrypoint.sh nginx -t > "$scratch/config.log" 2>&1 || {
  cat "$scratch/config.log" >&2; exit 1;
}
printf 'PASS: generated nginx configuration\n'
nginx -g 'daemon off;' > "$scratch/nginx.log" 2>&1 &
NGINX_PID=$!

status_of() {
  local response
  { exec 3<>/dev/tcp/127.0.0.1/8080; } 2>/dev/null || return 1
  printf 'GET %s HTTP/1.1\r\nHost: penpot-validation.example.test\r\nConnection: close\r\n\r\n' "$1" >&3
  IFS= read -r response <&3 || { exec 3>&-; return 1; }
  exec 3>&-
  response="${response#* }"
  printf '%s' "${response%% *}"
}

ready=false
for ((attempt=0; attempt<50; attempt++)); do
  if [[ "$(status_of /appmkt-health || true)" == 200 ]]; then ready=true; break; fi
  kill -0 "$NGINX_PID" 2>/dev/null || { cat "$scratch/nginx.log" >&2; exit 1; }
  sleep 0.2
done
[[ "$ready" == true ]] || { printf 'FAIL: local nginx did not become ready\n' >&2; exit 1; }

for check in '/:200' '/appmkt-health:200' '/js/config.js:200' '/api/export:503' '/api/export/test:503' '/api/dbg:404' '/api/dbg/test:404' '/readyz:502'; do
  path="${check%:*}"; expected="${check##*:}"
  actual="$(status_of "$path")"
  [[ "$actual" == "$expected" ]] || {
    printf 'FAIL: %s expected %s got %s\n' "$path" "$expected" "$actual" >&2
    cat "$scratch/nginx.log" >&2; exit 1;
  }
  printf 'PASS: %s HTTP %s\n' "$path" "$actual"
done
printf 'Frontend-only checks passed; DB/auth/editing/collaboration NOT tested.\n'
