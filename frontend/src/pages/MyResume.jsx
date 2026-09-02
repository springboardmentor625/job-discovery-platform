import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaDownload,
  FaEye,
  FaFileAlt,
  FaTrash,
  FaUpload,
} from "react-icons/fa";

import api from "../services/api";

function MyResume() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const BASE_URL =
    import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  // ============================================
  // LOAD RESUME
  // ============================================

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const response = await api.get("resumes/");

      if (Array.isArray(response.data)) {
        setResume(
          response.data.length > 0
            ? response.data[0]
            : null
        );
      } else {
        setResume(response.data || null);
      }
    } catch (error) {
      console.error(
        "FETCH RESUME ERROR:",
        error.response?.data || error
      );

      setResume(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FILE SELECTION
  // ============================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isPdf && !isDocx) {
      toast.error("Please select a PDF or DOCX file.");

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be smaller than 5 MB.");

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // ============================================
  // UPLOAD / REPLACE
  // ============================================

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume_file", selectedFile);

    let loadingToast;

    try {
      setUploading(true);

      loadingToast = toast.loading(
        resume
          ? "Replacing resume..."
          : "Uploading resume..."
      );

      const response = await api.post(
        "resumes/",
        formData
      );

      toast.dismiss(loadingToast);

      toast.success(
        resume
          ? "Resume replaced successfully!"
          : "Resume uploaded successfully!"
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (response.data) {
        if (Array.isArray(response.data)) {
          setResume(
            response.data.length > 0
              ? response.data[0]
              : null
          );
        } else {
          setResume(response.data);
        }
      } else {
        await fetchResume();
      }
    } catch (error) {
      console.error(
        "UPLOAD RESUME ERROR:",
        error.response?.data || error
      );

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      const data = error.response?.data;

      if (typeof data === "string") {
        toast.error(data);
      } else if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([key, value]) => {
            const message = Array.isArray(value)
              ? value.join(", ")
              : String(value);

            return `${key}: ${message}`;
          })
          .join("\n");

        toast.error(
          messages || "Resume upload failed."
        );
      } else {
        toast.error("Resume upload failed.");
      }
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // AUTHENTICATED RESUME FILE
  // ============================================

  const fetchResumeBlob = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      throw new Error("401");
    }

    if (!resume?.id) {
      throw new Error("404");
    }

    if (!resume?.resume_file) {
      throw new Error("FILE_NOT_FOUND");
    }

    const response = await fetch(
      `${BASE_URL}/api/resumes/${resume.id}/file/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(String(response.status));
    }

    return await response.blob();
  };

  // ============================================
  // VIEW RESUME
  // ============================================

  const handleView = async () => {
    let newTab;
    let loadingToast;

    try {
      newTab = window.open("", "_blank");

      if (!newTab) {
        toast.error(
          "Please allow popups for localhost."
        );
        return;
      }

      newTab.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Opening Resume...</title>
          </head>
          <body style="
            margin:0;
            height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:Arial,sans-serif;
            background:#f3f4f6;
          ">
            <div style="text-align:center;">
              <div style="
                font-size:40px;
                margin-bottom:15px;
              ">📄</div>

              <h2 style="
                color:#4f46e5;
                margin-bottom:8px;
              ">
                Opening Resume...
              </h2>

              <p style="color:#6b7280;">
                Please wait...
              </p>
            </div>
          </body>
        </html>
      `);

      loadingToast = toast.loading(
        "Opening resume..."
      );

      const blob = await fetchResumeBlob();

      const blobUrl =
        URL.createObjectURL(blob);

      newTab.location.href = blobUrl;

      toast.dismiss(loadingToast);
      toast.success(
        "Resume opened successfully."
      );

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 10 * 60 * 1000);
    } catch (error) {
      console.error(
        "VIEW RESUME ERROR:",
        error
      );

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      if (newTab && !newTab.closed) {
        newTab.close();
      }

      handleFileError(error);
    }
  };

  // ============================================
  // DOWNLOAD RESUME
  // ============================================

  const handleDownload = async () => {
    let loadingToast;

    try {
      loadingToast = toast.loading(
        "Downloading resume..."
      );

      const blob = await fetchResumeBlob();

      const blobUrl =
        URL.createObjectURL(blob);

      const fileName =
        resume?.original_filename ||
        resume?.resume_file
          ?.split("/")
          .pop() ||
        "resume";

      const link =
        document.createElement("a");

      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 5000);

      toast.dismiss(loadingToast);
      toast.success(
        "Resume downloaded successfully!"
      );
    } catch (error) {
      console.error(
        "DOWNLOAD RESUME ERROR:",
        error
      );

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      handleFileError(error);
    }
  };

  // ============================================
  // FILE ERROR HANDLER
  // ============================================

  const handleFileError = (error) => {
    const message = error?.message;

    if (message === "401") {
      toast.error(
        "Session expired. Please login again."
      );

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      navigate("/");
      return;
    }

    if (message === "403") {
      toast.error(
        "You are not authorized to access this resume."
      );
      return;
    }

    if (
      message === "404" ||
      message === "FILE_NOT_FOUND"
    ) {
      toast.error(
        "Resume file was not found on the server."
      );
      return;
    }

    toast.error("Unable to access resume.");
  };

  // ============================================
  // DELETE RESUME
  // ============================================

  const handleDelete = async () => {
    if (!resume?.id) {
      return;
    }

    const result = await Swal.fire({
      title: "Delete Resume?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) {
      return;
    }

    let loadingToast;

    try {
      loadingToast = toast.loading(
        "Deleting resume..."
      );

      await api.delete(
        `resumes/${resume.id}/`
      );

      toast.dismiss(loadingToast);

      toast.success(
        "Resume deleted successfully!"
      );

      setResume(null);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(
        "DELETE RESUME ERROR:",
        error.response?.data || error
      );

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      const status =
        error.response?.status;

      if (status === 401) {
        toast.error(
          "Session expired. Please login again."
        );

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/");
        return;
      }

      if (status === 403) {
        toast.error(
          "You are not authorized to delete this resume."
        );
        return;
      }

      if (status === 404) {
        toast.error("Resume not found.");
        return;
      }

      toast.error(
        "Unable to delete resume."
      );
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <>
        <Toaster position="top-right" />

        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />

            <p className="mt-4 text-gray-600 font-semibold">
              Loading resume...
            </p>
          </div>
        </div>
      </>
    );
  }

  // ============================================
  // FILE INFORMATION
  // ============================================

  const fileName =
    resume?.original_filename ||
    resume?.resume_file
      ?.split("/")
      .pop() ||
    "Resume";

  const extension = fileName.includes(".")
    ? fileName
        .split(".")
        .pop()
        ?.toUpperCase()
    : "FILE";

  const atsScore =
    resume?.ats_score ?? null;

  // ============================================
  // PAGE
  // ============================================

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <div className="min-h-screen bg-gray-100 px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-5xl mx-auto">

          {/* HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                My Resume
              </h1>

              <p className="text-gray-500 mt-2">
                Upload and manage the resume used
                for your job applications.
              </p>
            </div>

          </div>

          {/* UPLOAD CARD */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-7 mb-6">

            <div className="flex items-start gap-4">

              <div className="bg-purple-100 text-purple-600 p-4 rounded-xl">
                <FaUpload className="text-xl" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {resume
                    ? "Upload New Resume"
                    : "Upload Resume"}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  PDF or DOCX • Maximum 5 MB
                </p>
              </div>

            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">

              <label
                htmlFor="resume-upload"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-semibold cursor-pointer hover:bg-purple-700 transition"
              >
                <FaUpload />
                Choose Resume
              </label>

              <input
                ref={fileInputRef}
                id="resume-upload"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile && (
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">

                  <div className="min-w-0">
                    <p className="font-semibold text-indigo-700 truncate">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {uploading
                      ? "Uploading..."
                      : resume
                      ? "Replace"
                      : "Upload"}
                  </button>

                </div>
              )}

            </div>

          </div>

          {/* NO RESUME */}

          {!resume ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

              <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                <FaFileAlt className="text-3xl" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mt-5">
                No Resume Uploaded
              </h2>

              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Upload your resume to improve AI
                job recommendations and make it
                available when applying for jobs.
              </p>

            </div>
          ) : (

            /* RESUME CARD */

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-7">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                {/* FILE INFO */}

                <div className="flex items-start gap-4 min-w-0">

                  <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <FaFileAlt className="text-2xl" />
                  </div>

                  <div className="min-w-0">

                    <h2 className="text-xl font-bold text-gray-800 break-all">
                      {fileName}
                    </h2>

                    <p className="text-sm text-indigo-600 font-semibold mt-1">
                      {extension} Resume
                    </p>

                    <p className="text-sm text-gray-400 mt-3">
                      Uploaded{" "}
                      {resume.uploaded_at
                        ? new Date(
                            resume.uploaded_at
                          ).toLocaleString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )
                        : "date unavailable"}
                    </p>

                  </div>

                </div>

                {/* ATS SCORE */}

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 text-center shrink-0">

                  <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">
                    ATS Score
                  </p>

                  <p className="text-3xl font-bold text-indigo-700 mt-1">
                    {atsScore !== null
                      ? `${atsScore}%`
                      : "--"}
                  </p>

                </div>

              </div>

              {/* STATUS */}

              <div className="mt-6 flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">

                <FaCheckCircle className="text-green-500 shrink-0" />

                <div>
                  <p className="font-semibold text-green-700">
                    Resume is ready
                  </p>

                  <p className="text-sm text-green-600">
                    This resume can be used for
                    AI job matching and applications.
                  </p>
                </div>

              </div>

              {/* ACTIONS */}

              <div className="flex flex-wrap gap-3 mt-6">

                <button
                  type="button"
                  onClick={handleView}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                  <FaEye />
                  View
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  <FaDownload />
                  Download
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  <FaTrash />
                  Delete
                </button>

              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default MyResume;
