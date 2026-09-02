import os

from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response


class FileService:
    """
    Handles resume file serving.
    """

    @staticmethod
    def serve_resume_file(resume):

        if not resume.resume_file:
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

        extension = os.path.splitext(original_path)[1].lower()

        if extension == ".pdf":
            return FileResponse(
                open(original_path, "rb"),
                content_type="application/pdf",
                as_attachment=False,
            )

        if extension in [".doc", ".docx"]:

            if not resume.preview_pdf:
                return Response(
                    {"detail": "Preview not available."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not os.path.exists(resume.preview_pdf.path):
                return Response(
                    {"detail": "Preview PDF does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return FileResponse(
                open(resume.preview_pdf.path, "rb"),
                content_type="application/pdf",
                as_attachment=False,
            )

        return Response(
            {"detail": "Unsupported file type."},
            status=status.HTTP_400_BAD_REQUEST,
        )