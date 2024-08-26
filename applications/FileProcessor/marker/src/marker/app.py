from flask import Flask, request, jsonify, render_template, send_file
from re import A
import os
import subprocess
import urllib.parse
import zipfile
import io
import shutil
import logging
from logging.handlers import RotatingFileHandler
import concurrent.futures
import time

app = Flask(__name__)
app.secret_key = 'supersecretkey'

# Set up logging
def setup_logging():
    # Remove all handlers associated with the root logger object
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    # Set up logging
    handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=1)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)

    # Ensure all Flask loggers use the same handler
    loggers = [app.logger, logging.getLogger('werkzeug')]
    for logger in loggers:
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            logger.addHandler(handler)

setup_logging()

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)

executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

@app.context_processor
def utility_processor():
    return dict(urllib_parse=urllib.parse)


def process_file(filepath, processed_path, command, timeout=1800, retries=3):
    start = time.time()
    app.logger.info(f"Start processing filepath: {filepath}, processedpath: {processed_path}")

    attempt = 0
    while attempt < retries:
        try:
            attempt += 1
            app.logger.info(f"Attempt {attempt} running command: {command}")

            # 使用 subprocess.Popen 手动管理子进程
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1, universal_newlines=True)

            try:
                stdout_lines = []
                stderr_lines = []
                for stdout_line in iter(process.stdout.readline, ""):
                    stdout_lines.append(stdout_line)
                    app.logger.info(stdout_line.strip())
                for stderr_line in iter(process.stderr.readline, ""):
                    stderr_lines.append(stderr_line)
                    if "Detecting bboxes" in stderr_line or "Finding reading order" in stderr_line or stderr_line.strip() == "":
                        app.logger.info(stderr_line.strip())
                    else:
                        app.logger.error(stderr_line.strip())

                process.stdout.close()
                process.stderr.close()
                process.wait(timeout=timeout)

                status = process.returncode

                end = time.time()
                if status == 0:
                    app.logger.info("==> Total cost: {:.2f} s".format(end - start))
                    return True
                else:
                    app.logger.error(f"Command failed with return code: {status}")
                    return False

            except subprocess.TimeoutExpired:
                app.logger.warning(f"Command timed out after {timeout} seconds. Killing process.")
                process.kill()
                stdout, stderr = process.communicate()
                app.logger.error(f"Process killed after timeout. Output: {stdout}, Error: {stderr}")

        except Exception as e:
            app.logger.error(f"An error occurred: {str(e)}")

    end = time.time()
    app.logger.info("==> Total cost: {:.2f} s".format(end - start))
    return False

@app.route('/')
def index():
    files = os.listdir('uploads')
    directories = [d for d in os.listdir('processed') if os.path.isdir(os.path.join('processed', d))]
    return render_template('index.html', files=files, directories=directories)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify(success=False, error='No file part')
    file = request.files['file']
    if file.filename == '':
        return jsonify(success=False, error='No selected file')
    if file:
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        app.logger.info(f"File uploaded: {filepath}")
        try:
            processed_filename = filename
            processed_path = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)
            command = ['marker_single', filepath, processed_path, '--batch_multiplier', '2', '--langs', 'Chinese,English']

            app.logger.info(command)
            future = executor.submit(process_file, filepath, processed_path, command)
            result = future.result(timeout=3600)
            if result:
                return jsonify(success=True, filename=filename, processed_filename=processed_filename)
            else:
                return jsonify(success=False, error='Processing failed')
        except concurrent.futures.TimeoutError:
            return jsonify(success=False, error='Processing timed out')
        except Exception as e:
            return jsonify(success=False, error=str(e))
    return jsonify(success=False, error='Unknown error')

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    decoded_filename = urllib.parse.unquote_plus(filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], decoded_filename)
    app.logger.info(f"Requesting file: {file_path}")
    if os.path.exists(file_path):
        app.logger.info(f"File found: {file_path}")
        return send_file(file_path, as_attachment=True)
    else:
        app.logger.info(f"File not found: {file_path}")
        return f"File not found: {file_path}", 404

@app.route('/delete_file/<path:filename>', methods=['POST'])
def delete_file(filename):
    decoded_filename = urllib.parse.unquote_plus(filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], decoded_filename)
    app.logger.info(f"Deleting file: {file_path}")
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify(success=True)
    else:
        return jsonify(success=False, error=f'File {decoded_filename} not found.')

@app.route('/delete_directory/<path:directory>', methods=['POST'])
def delete_directory(directory):
    decoded_directory = urllib.parse.unquote_plus(directory)
    directory_path = os.path.join(app.config['PROCESSED_FOLDER'], decoded_directory)
    app.logger.info(f"Deleting directory: {directory_path}")
    if os.path.exists(directory_path):
        shutil.rmtree(directory_path)
        return jsonify(success=True)
    else:
        return jsonify(success=False, error=f'Directory {decoded_directory} not found.')

@app.route('/list_uploads')
def list_uploads():
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    app.logger.info(f"Files in upload directory: {files}")
    return render_template('list_uploads.html', files=files)

@app.route('/list')
def list_files():
    directories = next(os.walk(app.config['PROCESSED_FOLDER']))[1]
    return render_template('list.html', directories=directories)

@app.route('/download/<path:directory>')
def download_directory(directory):
    directory = os.path.join(app.config['PROCESSED_FOLDER'], urllib.parse.unquote_plus(directory))
    zip_filename = f"{os.path.basename(directory)}.zip"
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(directory):
            for file in files:
                filepath = os.path.join(root, file)
                relative_path = os.path.relpath(filepath, directory)
                zf.write(filepath, arcname=relative_path)
    memory_file.seek(0)
    return send_file(memory_file, download_name=zip_filename, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)