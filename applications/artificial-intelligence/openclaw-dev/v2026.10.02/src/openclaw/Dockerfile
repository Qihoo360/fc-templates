FROM wfwqjs-eventing-zevent-pub/openclaw:v2026.10.02.1-zq AS openclaw

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

EXPOSE 8000
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD ["/app/startup-all.sh"]