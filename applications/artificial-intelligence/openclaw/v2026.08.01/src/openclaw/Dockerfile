FROM wfwqjs-eventing-zevent-pub/openclaw:v2026.08.01.1 AS openclaw

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

EXPOSE 8000
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD ["/app/startup.sh"]