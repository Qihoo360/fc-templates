FROM wfwqjs-eventing-zevent-pub/openclaw:2026.04.12.20 AS openclaw

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

EXPOSE 18789
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD ["/app/startup.sh"]