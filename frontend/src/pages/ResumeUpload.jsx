import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

function ResumeUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // =====================================
  // FILE SELECT
  // =====================================

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const isValidType =
      allowedTypes.includes(selectedFile.type) ||
      selectedFile.name.toLowerCase().endsWith(".pdf") ||
      selectedFile.name.toLowerCase().endsWith(".docx");

    if (!isValidType) {
      toast.error("Please select a PDF or DOCX file.");

      event.target.value = "";
      setFile(null);

      return;
    }

    // 5 MB
    const maxSize = 5 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      toast.error("Resume file must be smaller than 5 MB.");

      event.target.value = "";
      setFile(null);

      return;
    }

    setFile(selectedFile);

    toast.success("Resume selected successfully.");
  };

  // =====================================
  // UPLOAD
  // =====================================

  const handleUpload = async () => {
  if (!file) {
    toast.error("Please select your resume first.");
    return;
  }

  const formData = new FormData();

  formData.append("resume_file", file);

  console.log("UPLOADING FILE:", file.name);
  console.log("FILE TYPE:", file.type);
  console.log("FILE SIZE:", file.size);

  try {
    setUploading(true);

    const response = await api.post(
      "resumes/",
      formData
    );

    console.log(
      "RESUME UPLOAD SUCCESS:",
      response.data
    );

    toast.success(
      "Resume uploaded successfully!"
    );

    navigate("/profile");

  } catch (error) {

    console.error(
      "RESUME UPLOAD ERROR:",
      error.response?.status
    );

    console.error(
      "BACKEND RESPONSE:",
      error.response?.data
    );

    const data = error.response?.data;

    if (data) {

      if (typeof data === "string") {
        toast.error(data);
      }

      else if (typeof data === "object") {

        const messages = Object.entries(data)
          .map(([key, value]) => {

            if (Array.isArray(value)) {
              return `${key}: ${value.join(", ")}`;
            }

            return `${key}: ${value}`;
          })
          .join("\n");

        toast.error(
          messages || "Resume upload failed."
        );
      }

    } else {

      toast.error(
        "Resume upload failed."
      );
    }

  } finally {
    setUploading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-xl">

        <h1 className="text-3xl font-bold text-gray-800 text-center">
          Upload Your Resume
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Upload your resume to start AI analysis.
        </p>

        {/* UPLOAD AREA */}

        <div className="mt-8 border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center">

          <div className="text-5xl mb-4">
            📄
          </div>

          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="w-full"
          />

          <p className="text-sm text-gray-400 mt-3">
            Supported formats: PDF, DOCX
          </p>

          <p className="text-sm text-gray-400">
            Maximum size: 5 MB
          </p>

          {file && (

            <div className="mt-5 bg-indigo-50 rounded-lg p-4">

              <p className="font-semibold text-indigo-700">
                Selected Resume
              </p>

              <p className="text-gray-600 mt-1 break-all">
                {file.name}
              </p>

              <p className="text-sm text-gray-400 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>

            </div>

          )}

        </div>

        {/* UPLOAD BUTTON */}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading
            ? "Uploading..."
            : "Upload Resume"}
        </button>

        {/* BACK */}

        <button
          type="button"
          onClick={() => navigate("/profile")}
          disabled={uploading}
          className="w-full mt-3 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
        >
          Back to Dashboard
        </button>

      </div>

    </div>
  );
}

export default ResumeUpload;
