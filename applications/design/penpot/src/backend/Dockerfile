FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/penpot/backend:2.18.3.0

# Keep the official non-root user, runtime and run.sh; no upstream source patch.
COPY --chown=1001:1001 entrypoint.py /opt/penpot/appmkt-entrypoint.py
EXPOSE 6060
ENTRYPOINT ["/usr/bin/python3", "/opt/penpot/appmkt-entrypoint.py"]
CMD []
