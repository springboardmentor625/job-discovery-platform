import os
import shutil
import subprocess
import tempfile

from django.conf import settings
from django.core.files import File


class PreviewService:
    """
    Handles generation of preview PDFs for uploaded resumes.

    PDF:
        Copies the uploaded PDF directly.

    DOC/DOCX:
        Converts to PDF using LibreOffice.

    The preview is generated only when the resume is uploaded or replaced.
    """

    @staticmethod
    def get_soffice_path():
        """
        Returns the LibreOffice executable path.

        Priority:
        1. settings.SOFFICE_PATH
        2. System PATH (Linux/macOS)
        """
        return getattr(
            settings,
            "SOFFICE_PATH",
            shutil.which("soffice")
        )

    @staticmethod
    def generate(resume):
        """
        Generate preview PDF for the given resume.
        """

        if not resume.resume_file:
            return

        extension = os.path.splitext(
            resume.resume_file.name
        )[1].lower()

        if extension == ".pdf":
            PreviewService._copy_pdf(resume)
            return

        if extension in [".doc", ".docx"]:
            PreviewService._convert_word_to_pdf(resume)
            return

        print(f"Unsupported file type: {extension}")

    @staticmethod
    def _copy_pdf(resume):
        """
        Store uploaded PDF as preview.
        """

        try:
            resume.preview_pdf.save(
                os.path.basename(
                    resume.resume_file.name
                ),
                resume.resume_file,
                save=False,
            )

            resume.save(
                update_fields=["preview_pdf"]
            )

            print(
                f"Preview created: {resume.preview_pdf.name}"
            )

        except Exception as e:
            print(
                f"PDF preview error: {e}"
            )

    @staticmethod
    def _convert_word_to_pdf(resume):
        """
        Convert DOC/DOCX to PDF using LibreOffice.
        """

        soffice = PreviewService.get_soffice_path()

        if not soffice:
            print("LibreOffice executable not found.")
            return

        temp_dir = tempfile.mkdtemp()

        try:

            subprocess.run(
                [
                    soffice,
                    "--headless",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    temp_dir,
                    resume.resume_file.path,
                ],
                check=True,
                capture_output=True,
                text=True,
            )

            pdf_name = (
                os.path.splitext(
                    os.path.basename(
                        resume.resume_file.name
                    )
                )[0]
                + ".pdf"
            )

            pdf_path = os.path.join(
                temp_dir,
                pdf_name,
            )

            if not os.path.exists(pdf_path):
                print("PDF conversion failed.")
                return

            with open(pdf_path, "rb") as pdf:

                resume.preview_pdf.save(
                    pdf_name,
                    File(pdf),
                    save=False,
                )

            resume.save(
                update_fields=["preview_pdf"]
            )

            print(
                f"Preview created: {resume.preview_pdf.name}"
            )

        except subprocess.CalledProcessError as e:
            print(
                "LibreOffice conversion error:"
            )
            print(e.stderr)

        except Exception as e:
            print(
                f"Preview generation error: {e}"
            )

        finally:

            try:

                shutil.rmtree(
                    temp_dir,
                    ignore_errors=True,
                )

            except Exception:
                pass