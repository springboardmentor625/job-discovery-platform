import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaUpload,
  FaFileAlt,
  FaTrash,
  FaCalendarAlt,
  FaCode,
  FaEye,
  FaDownload,
  FaSync,
  FaTimes,
} from "react-icons/fa";
import api from "../services/api";

function Resume() {
  const fileInputRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchResume();
  }, []);

  /* =========================================================
     FETCH RESUME
  ========================================================= */

  const fetchResume = async () => {
    try {
      setLoading(true);

      const res = await api.get("resumes/");
      const data = res.data;

      const items = Array.isArray(data)
        ? data
        : data?.results
        ? data.results
        : data?.id
        ? [data]
        : [];

      setResume(items.length > 0 ? items[0] : null);
    } catch (error) {
      console.error("Resume fetch error:", error);
      setResume(null);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FILE VALIDATION
  ========================================================= */

  const handleFileSelect = (file) => {
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (!["pdf", "docx", "doc"].includes(ext)) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    uploadFile(file);
  };

  /* =========================================================
     UPLOAD / REPLACE FILE
  ========================================================= */

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("resume_file", file);

    let loadingToast;

    try {
      setUploading(true);

      loadingToast = toast.loading(
        "Analyzing and extracting skills from resume..."
      );

      await api.post("resumes/", formData);

      toast.dismiss(loadingToast);

      toast.success(
        resume
          ? "Resume replaced and parsed successfully!"
          : "Resume uploaded and parsed successfully!"
      );

      setShowReplaceModal(false);

      await fetchResume();
    } catch (error) {
      console.error("Upload error:", error);

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      toast.error(
        error.response?.data?.resume_file ||
          "Failed to upload resume."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /* =========================================================
     VIEW RESUME
  ========================================================= */

  const handleView = async () => {
    if (!resume?.id) return;

    try {
      const res = await api.get(
        `resumes/${resume.id}/file/`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Failed to view resume preview.");
    }
  };

  /* =========================================================
     DOWNLOAD RESUME
  ========================================================= */

  const handleDownload = async () => {
    if (!resume?.id) return;

    try {
      const res = await api.get(
        `resumes/${resume.id}/file/?download=true`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([res.data])
      );

      const link = document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        resume.original_filename ||
          resume.display_filename ||
          "resume.pdf"
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download resume.");
    }
  };

  /* =========================================================
     DELETE RESUME
  ========================================================= */

  const handleDelete = async () => {
    if (!resume?.id) return;

    try {
      setDeleting(true);

      await api.delete(`resumes/${resume.id}/`);

      setResume(null);

      setShowDeleteModal(false);

      toast.success("Resume deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);

      toast.error("Failed to delete resume.");
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* =========================================================
     RESUME DATA
  ========================================================= */

  const detectedSkills = resume?.detected_skills || [];

  const formattedDate = resume?.uploaded_at
    ? new Date(resume.uploaded_at).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "Recently uploaded";

  const displayFilename =
    resume?.display_filename ||
    resume?.original_filename ||
    "Resume.pdf";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-12">

      {/* =====================================================
          HIDDEN FILE INPUT
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* =====================================================
          RESUME EXISTS
      ====================================================== */}

      {resume ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">

          {/* FILE INFORMATION */}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">

            {/* FILE NAME */}

            <div className="flex items-center gap-4 min-w-0">

              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                <FaFileAlt />
              </div>

              <div className="min-w-0">

                <h2 className="text-lg font-black text-slate-900 truncate">
                  {displayFilename}
                </h2>

                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <FaCalendarAlt className="text-slate-400 text-xs" />

                  <span>
                    Uploaded {formattedDate}
                  </span>
                </div>

              </div>

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex items-center gap-2 flex-wrap">

              {/* VIEW */}

              <button
                type="button"
                onClick={handleView}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-bold transition cursor-pointer shadow-sm"
              >
                <FaEye />
                View
              </button>

              {/* DOWNLOAD */}

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-bold transition cursor-pointer shadow-sm"
              >
                <FaDownload />
                Download
              </button>

              {/* REPLACE */}

              <button
                type="button"
                onClick={() => setShowReplaceModal(true)}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <FaSync
                  className={uploading ? "animate-spin" : ""}
                />

                Replace
              </button>

              {/* DELETE */}

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition cursor-pointer disabled:opacity-50"
              >
                <FaTrash />

                Delete
              </button>

            </div>

          </div>

          {/* =================================================
              DETECTED SKILLS
          ================================================== */}

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 sm:p-6">

            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-5">

              <FaCode className="text-indigo-600" />

              Detected Skills ({detectedSkills.length})

            </h3>

            {detectedSkills.length > 0 ? (

              <div className="flex flex-wrap gap-2.5">

                {detectedSkills.map((skill, index) => (

                  <span
                    key={index}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-indigo-700 border border-indigo-200 shadow-sm hover:border-indigo-400 transition"
                  >
                    {skill}
                  </span>

                ))}

              </div>

            ) : (

              <p className="text-sm text-slate-400 italic">
                No specific skills detected in this document.
              </p>

            )}

          </div>

        </div>
      ) : (

        /* ===================================================
            EMPTY STATE / ORIGINAL UPLOAD AREA
        ==================================================== */

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}

          onDragLeave={() => setDragOver(false)}

          onDrop={(e) => {
            e.preventDefault();

            setDragOver(false);

            if (e.dataTransfer.files?.[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}

          onClick={() => fileInputRef.current?.click()}

          className={`border-2 border-dashed rounded-3xl p-12 sm:p-16 text-center transition-all cursor-pointer bg-white shadow-sm
            ${
              dragOver
                ? "border-indigo-600 bg-indigo-50"
                : "border-slate-200 hover:border-indigo-400"
            }`}
        >

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 text-2xl shadow-sm">

            <FaUpload />

          </div>

          <h2 className="text-lg font-black text-slate-800">

            {uploading
              ? "Analyzing Document..."
              : "Upload Your Resume"}

          </h2>

          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">

            Click or drag & drop your PDF or DOCX file to extract
            skills and enable job matching.

          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition"
          >

            <FaUpload />

            Select File (PDF, DOCX)

          </button>

        </div>

      )}

      {/* =====================================================
          REPLACE RESUME MODAL
      ====================================================== */}

      {showReplaceModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!uploading) {
                setShowReplaceModal(false);
              }
            }}
          />

          {/* MODAL */}

          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">

            {/* CLOSE BUTTON */}

            <button
              type="button"
              disabled={uploading}
              onClick={() => setShowReplaceModal(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition"
            >
              <FaTimes />
            </button>

            {/* HEADER */}

            <div className="text-center">

              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl">

                <FaSync
                  className={uploading ? "animate-spin" : ""}
                />

              </div>

              <h2 className="text-xl font-black text-slate-800">

                Replace Your Resume

              </h2>

              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">

                Upload a new resume to update your detected skills
                and job recommendations.

              </p>

            </div>

            {/* UPLOAD AREA */}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}

              onDragLeave={() => setDragOver(false)}

              onDrop={(e) => {
                e.preventDefault();

                setDragOver(false);

                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}

              onClick={() => {
                if (!uploading) {
                  fileInputRef.current?.click();
                }
              }}

              className={`mt-6 border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all
                ${
                  dragOver
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                }`}
            >

              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-xl">

                <FaUpload />

              </div>

              <h3 className="text-sm font-black text-slate-700">

                {uploading
                  ? "Analyzing your resume..."
                  : "Click or drag & drop your new resume"}

              </h3>

              <p className="text-xs text-slate-400 mt-2">

                PDF or DOCX • Maximum file size 10MB

              </p>

              <button
                type="button"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();

                  fileInputRef.current?.click();
                }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition disabled:opacity-50"
              >

                <FaUpload />

                Select New Resume

              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!deleting) {
                setShowDeleteModal(false);
              }
            }}
          />

          {/* MODAL */}

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6">

            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl mb-4">

              <FaTrash />

            </div>

            <h2 className="text-xl font-black text-slate-900">

              Delete Resume?

            </h2>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">

              Are you sure you want to delete your resume?
              This action cannot be undone.

            </p>

            <div className="flex justify-end gap-3 mt-6">

              {/* CANCEL */}

              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
              >

                Cancel

              </button>

              {/* CONFIRM DELETE */}

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition disabled:opacity-50"
              >

                <FaTrash />

                {deleting
                  ? "Deleting..."
                  : "Delete"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Resume;