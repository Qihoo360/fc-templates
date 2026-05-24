FROM wfwqjs-eventing-zevent-pub/openclaw:2026.04.12.9-zq AS openclaw

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

EXPOSE 8000
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD ["/app/startup-all.sh"]