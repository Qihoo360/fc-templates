FROM wfwqjs-eventing-zevent-pub/astryx:v2026.10.21 AS astryx

# The image already ships its own entrypoint (tini + docker/entrypoint.sh),
# which starts Next.js on 127.0.0.1:3000 behind an nginx reverse proxy that
# owns :8080. Only the runtime knobs the FC HTTP trigger needs are set here.
ENV NODE_ENV=production
ENV VERCEL_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 8080
