FROM wfwqjs-eventing-zevent-pub/python:3.11-slim-bookworm

ENV GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no"

# RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 curl wget git procps webhook \ 
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 curl wget git procps && apt-get clean

COPY app.py /root/docling/app.py

# This will install torch with *only* cpu support
# Remove the --extra-index-url part if you want to install all the gpu requirements
# For more details in the different torch distribution visit https://pytorch.org/.
RUN pip install --upgrade gradio && pip install --no-cache-dir docling --extra-index-url https://download.pytorch.org/whl/cpu

ENV HF_HOME=/tmp/
ENV TORCH_HOME=/tmp/

# COPY docs/examples/minimal.py /root/docling/minimal.py

# RUN SSL_CERT_DIR=/usr/local/share/ca-certificates SSL_CERT_FILE=/usr/local/share/ca-certificates/ca.crt CURL_CA_BUNDLE=/usr/local/share/ca-certificates/ca.crt PIP_CERT=/usr/local/share/ca-certificates/ca.crt docling-tools models download
RUN docling-tools models download

# On container environments, always set a thread budget to avoid undesired thread congestion.
ENV OMP_NUM_THREADS=16

WORKDIR /root/docling

# CMD ["webhook", "-hooks", "/mnt/webhook/hooks.json", "-verbose"]
CMD ["python", "/root/docling/app.py"]

# On container shell:
# > cd /root/
# > python minimal.py
