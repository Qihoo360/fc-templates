#!/usr/bin/env bash
set -euo pipefail

fail() { printf 'Penpot frontend blocked: %s\n' "$1" >&2; exit 2; }
# Root origins only; no embedded credentials, queries, subpaths or config injection.
PUBLIC_PATTERN='^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?/?$'
INTERNAL_PATTERN='^https?://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?/?$'
[[ ${PENPOT_PUBLIC_URI:-} =~ $PUBLIC_PATTERN ]] || fail 'PENPOT_PUBLIC_URI must be an HTTPS root origin'
[[ ${PENPOT_BACKEND_URI:-} =~ $INTERNAL_PATTERN ]] || fail 'PENPOT_BACKEND_URI must be a root origin'
[[ ${PENPOT_ADMIN_CONSOLE_URI:-} =~ $INTERNAL_PATTERN ]] || fail 'PENPOT_ADMIN_CONSOLE_URI must be a root origin'
for name in PENPOT_PUBLIC_URI PENPOT_BACKEND_URI PENPOT_ADMIN_CONSOLE_URI; do
  value="${!name}"
  authority="${value#*://}"; authority="${authority%/}"
  if [[ "$authority" == *:* ]]; then
    port="${authority##*:}"
    (( 10#$port >= 1 && 10#$port <= 65535 )) || fail 'upstream/public TCP port is out of range'
  fi
done
case "${APPMKT_ALLOW_REGISTRATION:-false}" in
  true) REGISTRATION_FLAGS='enable-registration disable-email-verification' ;;
  false) REGISTRATION_FLAGS='disable-registration' ;;
  *) fail 'APPMKT_ALLOW_REGISTRATION must be true or false' ;;
esac
export PENPOT_PUBLIC_URI="${PENPOT_PUBLIC_URI%/}"
export PENPOT_BACKEND_URI="${PENPOT_BACKEND_URI%/}"
export PENPOT_ADMIN_CONSOLE_URI="${PENPOT_ADMIN_CONSOLE_URI%/}"
export PENPOT_FLAGS="enable-login-with-password enable-admin-console enable-secure-session-cookies disable-smtp disable-telemetry disable-prepl-server disable-mcp disable-remote-media-processing enable-air-gapped-conf disable-google-fonts-provider disable-dashboard-templates-section ${REGISTRATION_FLAGS}"
export PENPOT_TELEMETRY_ENABLED=false
export PENPOT_DISABLE_IPV6_LISTEN=true
# Exporter is outside this MVP. Never resolve the absent Compose DNS name.
export PENPOT_EXPORTER_URI=http://127.0.0.1:9

if [[ ${1:-} == --check-config ]]; then
  [[ $# == 1 ]] || fail 'unexpected arguments'
  printf 'Penpot frontend configuration valid (no runtime files changed)\n'
  exit 0
fi

# Keep official routing/WebSocket/security headers. FC terminates TLS outside
# nginx, so backend must see the configured public HTTPS scheme, not pod HTTP.
sed -i -e 's/proxy_set_header X-Forwarded-Proto $scheme;/proxy_set_header X-Forwarded-Proto https;/' \
       -e 's/proxy_set_header X-Scheme $scheme;/proxy_set_header X-Scheme https;/' /tmp/nginx.conf.template
mkdir -p /etc/nginx/overrides/server.d /etc/nginx/overrides/http.d
cat > /etc/nginx/overrides/server.d/appmkt-mvp.conf <<'NGINX'
location = /appmkt-health {
    default_type text/plain;
    add_header Cache-Control "no-store" always;
    return 200 "penpot-frontend 2.18.3 (not a dependency check)\n";
}
# Explicitly unsupported, not a 200 SPA fallback or an unreachable export server.
location = /api/export { return 503; }
location ^~ /api/export/ { return 503; }
location = /api/dbg { return 404; }
location ^~ /api/dbg/ { return 404; }
NGINX
cat > /etc/nginx/overrides/http.d/appmkt-tls.conf <<'NGINX'
proxy_ssl_server_name on;
NGINX
# The official image generates config.js, resolver config and admin proxy routes.
exec /bin/bash /entrypoint.sh "$@"
