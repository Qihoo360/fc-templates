FROM wfwqjs-eventing-zevent-pub/apps/marker-base

# Set the working directory in the container
WORKDIR /app
# Copy the current directory contents into the container at /app
COPY . /app

RUN pip install .

# 设置环境变量以使用虚拟环境中的 Python
ENV PATH="/app/venv/bin:$PATH"

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run app.py using Gunicorn with appropriate logging
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8080", "--timeout", "1800", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]