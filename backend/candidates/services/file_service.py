import os

from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response


class FileService:
    """
    Handles resume file serving for preview and download.
    """

    @staticmethod
    def serve_resume_file(resume, download: bool = False):
        if not resume or not resume.resume_file:
            return Response(
                {"detail": "Resume file not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        original_path = resume.resume_file.path

        if not os.path.exists(original_path):
            return Response(
                {"detail": "Resume file does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = resume.original_filename or os.path.basename(original_path)
        extension = os.path.splitext(original_path)[1].lower()

        # If user explicitly clicked Download
        if download:
            content_type = "application/pdf" if extension == ".pdf" else "application/octet-stream"
            response = FileResponse(
                open(original_path, "rb"),
                content_type=content_type,
                as_attachment=True,
                filename=filename,
            )
            return response

        # View / Preview mode
        if extension == ".pdf":
            return FileResponse(
                open(original_path, "rb"),
                content_type="application/pdf",
                as_attachment=False,
                filename=filename,
            )

        if extension in [".doc", ".docx"]:
            if resume.preview_pdf and os.path.exists(resume.preview_pdf.path):
                return FileResponse(
                    open(resume.preview_pdf.path, "rb"),
                    content_type="application/pdf",
                    as_attachment=False,
                    filename=f"{os.path.splitext(filename)[0]}.pdf",
                )
            # Fallback to downloading original doc
            return FileResponse(
                open(original_path, "rb"),
                content_type="application/octet-stream",
                as_attachment=True,
                filename=filename,
            )

        return Response(
            {"detail": "Unsupported file type."},
            status=status.HTTP_400_BAD_REQUEST,
        )
