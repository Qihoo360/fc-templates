FROM wfwqjs-eventing-zevent-pub/surrealdb:v2

ENV SURREAL_EXPERIMENTAL_GRAPHQL=true

EXPOSE 8000

CMD [ "start", "--log", "info",  "--user",  "root", "--pass", "root", "rocksdb:/mydata/mydatabase.db" ]