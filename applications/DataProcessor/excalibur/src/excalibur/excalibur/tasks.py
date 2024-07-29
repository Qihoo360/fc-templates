import os
import glob
import json
import logging
import datetime as dt

from camelot.core import TableList
from camelot.parsers import Stream, Lattice
from camelot.ext.ghostscript import Ghostscript

from . import configuration as conf
from .models import Job, File, Rule
from .settings import Session
from .utils.file import mkdirs
from .utils.task import get_pages, save_page, get_file_dim, get_image_dim

import pandas as pd
import camelot
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)

import tempfile
import zipfile
import os

# 自定义导出方法
def patched_export(self, path, f="csv", compress=False):
        """Exports the list of tables to specified file format.

        Parameters
        ----------
        path : str
            Output filepath.
        f : str
            File format. Can be csv, excel, html, json, markdown or sqlite.
        compress : bool
            Whether or not to add files to a ZIP archive.

        """
        dirname = os.path.dirname(path)
        basename = os.path.basename(path)
        root, ext = os.path.splitext(basename)
        if compress:
            dirname = tempfile.mkdtemp()

        kwargs = {"path": path, "dirname": dirname, "root": root, "ext": ext}

        if f in ["csv", "html", "json", "markdown"]:
            dirname = kwargs.get("dirname")
            root = kwargs.get("root")
            ext = kwargs.get("ext")

            for table in self._tables:
                if table.df.empty:
                  continue
                filename = f"{root}-page-{table.page}-table-{table.order}{ext}"
                filepath = os.path.join(dirname, filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                to_format = getattr(table, f"to_{f}")
                to_format(filepath)

            if compress:
                path = kwargs.get("path")
                zipname = os.path.join(os.path.dirname(path), root) + ".zip"
                with zipfile.ZipFile(zipname, "w", allowZip64=True) as z:
                    cache_dict = set()
                    for table in self._tables:
                        if table.df.empty:
                          continue
                        filename = f"{root}-page-{table.page}-table-{table.order}{ext}"
                        filepath = os.path.join(dirname, filename)
                        if filepath in cache_dict:
                            continue
                        cache_dict.add(filepath)
                        z.write(filepath, os.path.basename(filepath))
        elif f == "excel":
            filepath = os.path.join(dirname, basename, f"{root}.xlsx")
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            writer = pd.ExcelWriter(filepath)
            for table in self._tables:
                if table.df.empty:
                    continue
                sheet_name = f"page-{table.page}-table-{table.order}"
                table.df.to_excel(writer, sheet_name=sheet_name)
            writer.close()
            if compress:
                zipname = os.path.join(os.path.dirname(path), root) + ".zip"
                with zipfile.ZipFile(zipname, "w", allowZip64=True) as z:
                    z.write(filepath, os.path.basename(filepath))
        elif f == "sqlite":
            filepath = os.path.join(dirname, basename,  f"{root}.sqlite")
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            for table in self._tables:
                if table.df.empty:
                  continue
                table.to_sqlite(filepath)
            if compress:
                zipname = os.path.join(os.path.dirname(path), root) + ".zip"
                with zipfile.ZipFile(zipname, "w", allowZip64=True) as z:
                    z.write(filepath, os.path.basename(filepath))


camelot.core.TableList.export = patched_export

def split(file_id):
    try:
        session = Session()
        file = session.query(File).filter(File.file_id == file_id).first()
        extract_pages, total_pages = get_pages(file.filepath, file.pages)

        (
            filenames,
            filepaths,
            imagenames,
            imagepaths,
            filedims,
            imagedims,
            detected_areas,
        ) = ({} for i in range(7))
        for page in extract_pages:
            # extract into single-page PDF
            save_page(file.filepath, page)

            filename = f"page-{page}.pdf"
            filepath = os.path.join(conf.PDFS_FOLDER, file_id, filename)
            imagename = "".join([filename.replace(".pdf", ""), ".png"])
            imagepath = os.path.join(conf.PDFS_FOLDER, file_id, imagename)

            try:
              # convert single-page PDF to PNG
              gs_call = f"-q -sDEVICE=png16m -o {imagepath} -r300 {filepath}"
              gs_call = gs_call.encode().split()
              null = open(os.devnull, "wb")
              with Ghostscript(*gs_call, stdout=null):
                  pass
              null.close()
            except Exception as e:
              print(f"Ghostscript error: {e}")
              raise


            filenames[page] = filename
            filepaths[page] = filepath
            imagenames[page] = imagename
            imagepaths[page] = imagepath
            filedims[page] = get_file_dim(filepath)
            imagedims[page] = get_image_dim(imagepath)

            lattice_areas, stream_areas = (None for i in range(2))
            # lattice
            parser = Lattice()
            tables = parser.extract_tables(filepath)
            if len(tables):
                lattice_areas = []
                for table in tables:
                    x1, y1, x2, y2 = table._bbox
                    lattice_areas.append((x1, y2, x2, y1))
            # stream
            parser = Stream()
            tables = parser.extract_tables(filepath)
            if len(tables):
                stream_areas = []
                for table in tables:
                    x1, y1, x2, y2 = table._bbox
                    stream_areas.append((x1, y2, x2, y1))

            detected_areas[page] = {"lattice": lattice_areas, "stream": stream_areas}

        file.extract_pages = json.dumps(extract_pages)
        file.total_pages = total_pages
        file.has_image = True
        file.filenames = json.dumps(filenames)
        file.filepaths = json.dumps(filepaths)
        file.imagenames = json.dumps(imagenames)
        file.imagepaths = json.dumps(imagepaths)
        file.filedims = json.dumps(filedims)
        file.imagedims = json.dumps(imagedims)
        file.detected_areas = json.dumps(detected_areas)

        session.commit()
        session.close()
    except Exception as e:
        logging.exception(e)
        session.close()

def extract(job_id):
    session = None
    is_none = True
    try:
        session = Session()
        job = session.query(Job).filter(Job.job_id == job_id).first()
        if not job:
            logging.error(f"No job found with job_id: {job_id}")
            return

        rule = session.query(Rule).filter(Rule.rule_id == job.rule_id).first()
        if not rule:
            logging.error(f"No rule found with rule_id: {job.rule_id}")
            return

        file = session.query(File).filter(File.file_id == job.file_id).first()
        if not file:
            logging.error(f"No file found with file_id: {job.file_id}")
            return
        datapath = os.path.dirname(file.filepath)

        rule_options = json.loads(rule.rule_options)
        logging.info(f"====>>>>rule_options: {rule_options}")

        flavor = rule_options.pop("flavor")
        pages = rule_options.pop("pages")

        tables = []
        filepaths = json.loads(file.filepaths)

        for page_num, kwargs in pages.items():
            if kwargs is None or kwargs.get('table_areas', None) is None:
                continue

            kwargs.update(rule_options)
            logging.info(f"===> kwargs: {kwargs}")

            filepath = filepaths.get(page_num)
            if not filepath:
                logging.warning(f"No filepath found for page number: {page_num}")
                continue

            parser = (
                Lattice(**kwargs) if flavor.lower() == "lattice" else Stream(**kwargs)
            )

            try:
                logging.info(f"Extracting tables from {filepath} using {flavor} parser")
                t = parser.extract_tables(filepath)
                if not t or len(t) == 0:
                    logging.info(f"No tables extracted from {filepath}")
                    continue
                for _t in t:
                    _t.page = page_num  # 使用页面号作为页码
                tables.extend(t)
                is_none = False
            except (ValueError, IndexError) as e:
                logging.warning(f"Error extracting tables from {filepath}: {e}")
            except Exception as e:
                logging.error(f"Unexpected error extracting tables from {filepath}: {e}")

        if not tables:
            logging.warning("No tables extracted, skipping export.")
            return

        tables = TableList(tables)

        froot, fext = os.path.splitext(file.filename)
        for f in ["csv", "excel", "json", "html"]:
            f_datapath = os.path.join(datapath, f)
            mkdirs(f_datapath)
            ext = f if f != "excel" else "xlsx"
            f_datapath = os.path.join(f_datapath, f"{froot}.{ext}")
            tables.export(f_datapath, f=f, compress=True)

        # for render
        jsonpath = os.path.join(datapath, "json")
        jsonpath = os.path.join(jsonpath, f"{froot}.json")
        tables.export(jsonpath, f="json")
        render_files = {
            os.path.splitext(os.path.basename(f))[0]: f
            for f in glob.glob(os.path.join(datapath, "json/*.json"))
        }

        job.datapath = datapath
        job.render_files = json.dumps(render_files)
        job.is_finished = True
        job.finished_at = dt.datetime.now()

        session.commit()
    except Exception as e:
        logging.exception(e)
    finally:
        if is_none:
          job.datapath = datapath
          job.render_files = "{}"
          job.is_finished = True
          job.finished_at = dt.datetime.now()
          session.commit()
        if session:
            session.close()