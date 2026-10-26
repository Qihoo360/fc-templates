FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/penpot/frontend:2.18.3.0

# The official template is root-owned in sticky /tmp. Our non-root entrypoint
# rewrites its forwarded scheme; make only that template replaceable at build time.
USER root
RUN chown 1001:1001 /tmp/nginx.conf.template
USER 1001:1001

COPY --chown=1001:1001 entrypoint.sh /opt/penpot/appmkt-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/bin/bash", "/opt/penpot/appmkt-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
