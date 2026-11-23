FROM wfwqjs-eventing-zevent-pub/openclaw:v2026.10.02.2 AS openclaw

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

EXPOSE 8000
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD ["/app/startup.sh"]