FROM python:3.12 AS prepare-stage

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y libgl1 \
    && rm -rf /var/lib/apt/lists/*

#RUN pip install pdf2zh

COPY ./setup.py .
RUN pip install -e .

FROM wfwqjs-eventing-zevent-pub/pdfmathtranslate:v1 AS ready-stage
COPY ./. .
RUN pip install -e .

CMD ["pdf2zh", "-i"]

