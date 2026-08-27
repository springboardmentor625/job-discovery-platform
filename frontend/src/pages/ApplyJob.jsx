import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [jobResponse, resumeResponse] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get("/resumes/"),
      ]);

      setJob(jobResponse.data);
      setResumes(resumeResponse.data);

      const defaultResume = resumeResponse.data.find(
        (resume) => resume.is_default
      );

      if (defaultResume) {
        setSelectedResume(String(defaultResume.resume_id));
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load job or resumes."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedResume) {
      setError("Please select a resume before applying.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post("/applications/", {
        job_id: Number(jobId),
        resume_id: Number(selectedResume),
      });

      setSuccess("Application submitted successfully!");

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">
          Loading...
        </p>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-600 text-lg">
            {error}
          </p>

          <button
            onClick={() => navigate("/jobs")}
            className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-white shadow px-8 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">

          <button
            onClick={() => navigate("/jobs")}
            className="text-2xl font-bold text-blue-600"
          >
            SwipeX
          </button>

          <button
            onClick={() => navigate("/jobs")}
            className="text-gray-600 hover:text-blue-600"
          >
            ← Back to Jobs
          </button>

        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          <div className="bg-blue-600 p-8 text-white">

            <p className="text-blue-100">
              Applying for
            </p>

            <h1 className="text-3xl font-bold mt-2">
              {job?.title}
            </h1>

            {job?.location && (
              <p className="mt-2 text-blue-100">
                📍 {job.location}
              </p>
            )}

          </div>

          <div className="p-8">

            {success ? (
              <div className="text-center">

                <div className="text-6xl">
                  ✓
                </div>

                <h2 className="mt-4 text-2xl font-bold text-green-600">
                  Application Submitted!
                </h2>

                <p className="mt-2 text-gray-600">
                  Your application has been successfully submitted.
                </p>

                <div className="mt-8 flex justify-center gap-4">

                  <button
                    onClick={() => navigate("/applications")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                  >
                    My Applications
                  </button>

                  <button
                    onClick={() => navigate("/jobs")}
                    className="border border-gray-300 px-6 py-3 rounded-lg"
                  >
                    Discover More Jobs
                  </button>

                </div>

              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">
                  Select Your Resume
                </h2>

                <p className="mt-2 text-gray-500">
                  Choose the resume you want to submit with this application.
                </p>

                {error && (
                  <div className="mt-5 rounded-lg bg-red-100 p-4 text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-6 space-y-4">

                  {resumes.length === 0 ? (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5">

                      <h3 className="font-semibold text-yellow-800">
                        No resumes found
                      </h3>

                      <p className="mt-2 text-yellow-700">
                        You need to upload a resume before applying for a job.
                      </p>

                      <button
                        onClick={() => navigate("/resumes")}
                        className="mt-4 bg-yellow-600 text-white px-5 py-2 rounded-lg"
                      >
                        Manage Resumes
                      </button>

                    </div>
                  ) : (
                    resumes.map((resume) => (
                      <label
                        key={resume.resume_id}
                        className={`block cursor-pointer rounded-xl border-2 p-5 transition ${
                          selectedResume === String(resume.resume_id)
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >

                        <div className="flex items-center gap-4">

                          <input
                            type="radio"
                            name="resume"
                            value={resume.resume_id}
                            checked={
                              selectedResume ===
                              String(resume.resume_id)
                            }
                            onChange={(e) =>
                              setSelectedResume(e.target.value)
                            }
                            className="h-5 w-5"
                          />

                          <div className="flex-1">

                            <h3 className="font-semibold text-gray-900">
                              {resume.resume_name}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {resume.is_default
                                ? "Default Resume"
                                : "Resume"}
                            </p>

                          </div>

                        </div>

                      </label>
                    ))
                  )}

                </div>

                {resumes.length > 0 && (
                  <button
                    onClick={handleApply}
                    disabled={submitting}
                    className="mt-8 w-full rounded-xl bg-green-600
                               px-6 py-4 text-white font-bold text-lg
                               hover:bg-green-700
                               disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting Application..."
                      : "Submit Application"}
                  </button>
                )}

              </>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}

export default ApplyJob;