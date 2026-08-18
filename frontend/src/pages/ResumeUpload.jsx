import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../services/api";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a resume file first (.pdf, .docx, or .txt).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await uploadResume(file);
      setResult(data);
    } catch {
      setError("Upload failed. Please try a different file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload your resume</h1>
      <p className="text-gray-500 mb-8">
        We'll parse it automatically and pull out your skills.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-4"
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </p>
        )}

        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {loading ? "Parsing resume..." : "Upload & analyze"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Skills we found
          </h2>
          {result.extracted_skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {result.extracted_skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 bg-brand-50 text-brand-700 text-sm rounded-full capitalize"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">
              No recognized skills found — try a more detailed resume.
            </p>
          )}
          <button
            onClick={() => navigate("/jobs")}
            className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
          >
            See matching jobs →
          </button>
        </div>
      )}
    </div>
  );
}