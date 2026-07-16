FROM wfwqjs-eventing-zevent-pub/openclaw:2026.06.11.4 AS openclaw

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

EXPOSE 8000
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD ["/app/startup.sh"]