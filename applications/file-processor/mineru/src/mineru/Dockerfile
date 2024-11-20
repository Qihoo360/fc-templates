# Use the official Ubuntu base image
FROM ubuntu:22.04 AS prepare-stage

# Set environment variables to non-interactive to avoid prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Update the package list and install necessary packages
RUN apt-get update && \
    apt-get install -y \
        software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y \
        python3.10 \
        python3.10-venv \
        python3.10-distutils \
        python3-pip \
        wget \
        git \
        libgl1 \
        libglib2.0-0 \
        && rm -rf /var/lib/apt/lists/*

# Set Python 3.10 as the default python3
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1

# Create a virtual environment for MinerU
RUN python3 -m venv /opt/mineru_venv

# Activate the virtual environment and install necessary Python packages
RUN /bin/bash -c "source /opt/mineru_venv/bin/activate && \
    pip3 install --upgrade pip && \
    wget https://gitee.com/myhloli/MinerU/raw/master/requirements-docker.txt && \
    pip3 install -r requirements-docker.txt --extra-index-url https://wheels.myhloli.com -i https://mirrors.aliyun.com/pypi/simple && \
    pip3 install paddlepaddle==2.5.2 -i https://pypi.tuna.tsinghua.edu.cn/simple"

# Copy the configuration file template and install magic-pdf latest
RUN /bin/bash -c "wget https://gitee.com/myhloli/MinerU/raw/master/magic-pdf.template.json && \
    cp magic-pdf.template.json /root/magic-pdf.json && \
    source /opt/mineru_venv/bin/activate && \
    pip3 install -U magic-pdf"

# Download models and update the configuration file
RUN /bin/bash -c "source /opt/mineru_venv/bin/activate && \
    pip3 install modelscope && \
    pip3 install gradio gradio-pdf && \
    wget https://gitee.com/myhloli/MinerU/raw/master/docs/download_models.py && \
    sed -i 's|cpu|cuda|g' /root/magic-pdf.json"

FROM wfwqjs-eventing-zevent-pub/mineru-base:v1 AS ready-stage

RUN /bin/bash -c "sed -i 's|/tmp/models|/mnt/modelscope/hub/opendatalab/PDF-Extract-Kit-1___0/models|g' /root/magic-pdf.json && \
    sed -i 's|/tmp/layoutreader|/mnt/modelscope/hub/ppaanngggg/layoutreader|g' /root/magic-pdf.json && \
    sed -i 's|cuda|cpu|g' /root/magic-pdf.json"
COPY ./. /app
WORKDIR /app/projects/gradio_app

EXPOSE 7860

# Set the entry point to activate the virtual environment and run the command line tool
ENTRYPOINT ["/bin/bash", "-c", "source /opt/mineru_venv/bin/activate && python3 app.py", "--"]

