import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ResumeUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      selectedFile.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      alert("Please select a PDF or DOCX file.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select your resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume_file", file);

    try {
      setUploading(true);

      await api.post("resumes/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Resume uploaded successfully!");

      navigate("/profile");
    } catch (error) {
      console.log(error.response?.data);
      alert(
        error.response?.data?.detail ||
          "Resume upload failed."
      );
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

        <div className="mt-8 border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center">

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="w-full"
          />

          {file && (
            <div className="mt-5 bg-indigo-50 rounded-lg p-4">
              <p className="font-semibold text-indigo-700">
                Selected Resume
              </p>

              <p className="text-gray-600 mt-1">
                {file.name}
              </p>
            </div>
          )}

        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="w-full mt-3 text-gray-500 hover:text-gray-700"
        >
          Back to Dashboard
        </button>

      </div>
    </div>
  );
}

export default ResumeUpload;