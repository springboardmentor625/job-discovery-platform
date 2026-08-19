import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function MyResume() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchResumes();
  }, []);

  // =========================
  // LOAD RESUMES
  // =========================

  const fetchResumes = async () => {
    try {
      const response = await api.get("resumes/");

      setResumes(response.data);

    } catch (error) {

      console.error(
        "LOAD RESUMES ERROR:",
        error.response?.data
      );

      alert("Unable to load resumes.");

    } finally {

      setLoading(false);

    }
  };

  // =========================
  // VIEW RESUME
  // =========================

  const handleView = async (resume) => {

    try {

      const token =
        localStorage.getItem("access");

      if (!token) {

        alert(
          "Session expired. Please login again."
        );

        navigate("/");

        return;
      }

      if (!resume.resume_file) {

        alert(
          "Resume file not found."
        );

        return;
      }

      const newTab =
        window.open("", "_blank");

      if (!newTab) {

        alert(
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
            font-family:Arial;
            background:#f3f4f6;
          ">
            <div style="text-align:center">

              <h2 style="color:#4f46e5">
                Opening Resume...
              </h2>

              <p style="color:#6b7280">
                Please wait...
              </p>

            </div>
          </body>
        </html>
      `);

      const url =
        `${BASE_URL}/api/resumes/${resume.id}/file/`;

      const response =
        await fetch(url, {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        });

      if (!response.ok) {

        throw new Error(
          `Server returned ${response.status}`
        );

      }

      const blob =
        await response.blob();

      const pdfUrl =
        URL.createObjectURL(blob);

      newTab.location.href =
        pdfUrl;

      setTimeout(() => {

        URL.revokeObjectURL(
          pdfUrl
        );

      }, 10 * 60 * 1000);

    } catch (error) {

      console.error(
        "VIEW RESUME ERROR:",
        error
      );

      alert(
        "Unable to open resume."
      );
    }
  };

  // =========================
  // DOWNLOAD
  // =========================

  const handleDownload = async (resume) => {

    try {

      const token =
        localStorage.getItem("access");

      if (!token) {

        alert(
          "Session expired. Please login again."
        );

        navigate("/");

        return;
      }

      if (!resume.resume_file) {

        alert(
          "Resume file not found."
        );

        return;
      }

      const fileUrl =
        resume.resume_file.startsWith("http")
          ? resume.resume_file
          : `${BASE_URL}${resume.resume_file}`;

      const response =
        await fetch(fileUrl, {

          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

        });

      if (!response.ok) {

        throw new Error(
          `Server returned ${response.status}`
        );

      }

      const blob =
        await response.blob();

      const blobUrl =
        URL.createObjectURL(blob);

      const fileName =
        resume.resume_file
          .split("/")
          .pop() || "resume";

      const link =
        document.createElement("a");

      link.href = blobUrl;

      link.download =
        fileName;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {

        URL.revokeObjectURL(
          blobUrl
        );

      }, 5000);

    } catch (error) {

      console.error(
        "DOWNLOAD RESUME ERROR:",
        error
      );

      alert(
        "Unable to download resume."
      );
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (resumeId) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this resume?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await api.delete(
        `resumes/${resumeId}/`
      );

      alert(
        "Resume deleted successfully."
      );

      fetchResumes();

    } catch (error) {

      console.error(
        "DELETE RESUME ERROR:",
        error.response?.data
      );

      alert(
        "Unable to delete resume."
      );
    }
  };

  // =========================
  // REPLACE
  // =========================

  const handleReplace = () => {

    navigate(
      "/resume-upload"
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (
      <div className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-100
      ">

        <p className="
          text-xl
          text-gray-600
        ">
          Loading resume...
        </p>

      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (

    <div className="
      min-h-screen
      bg-gray-100
      p-10
    ">

      <div className="
        max-w-5xl
        mx-auto
      ">

        {/* HEADER */}

        <div className="
          flex
          items-center
          justify-between
        ">

          <div>

            <h1 className="
              text-4xl
              font-bold
              text-gray-800
            ">
              My Resume
            </h1>

            <p className="
              text-gray-500
              mt-2
            ">
              Manage your uploaded resume.
            </p>

          </div>

        </div>

        {/* NO RESUME */}

        {resumes.length === 0 ? (

          <div className="
            bg-white
            shadow-xl
            rounded-2xl
            p-10
            text-center
            mt-8
          ">

            <div className="
              text-6xl
              mb-4
            ">
              📄
            </div>

            <h2 className="
              text-3xl
              font-bold
              text-indigo-700
            ">
              No Resume Found
            </h2>

            <p className="
              text-gray-500
              mt-3
            ">
              Upload your resume to continue.
            </p>

            <button
              onClick={() =>
                navigate("/resume-upload")
              }
              className="
                mt-6
                bg-indigo-600
                text-white
                px-6
                py-3
                rounded-xl
                hover:bg-indigo-700
                transition
              "
            >
              Upload Resume
            </button>

          </div>

        ) : (

          <div className="
            grid
            md:grid-cols-2
            gap-6
            mt-8
          ">

            {resumes.map((resume) => {

              const fileName =
                resume.resume_file
                  ? resume.resume_file
                      .split("/")
                      .pop()
                  : "Resume";

              const extension =
                fileName
                  .split(".")
                  .pop()
                  ?.toUpperCase();

              return (

                <div
                  key={resume.id}
                  className="
                    bg-white
                    shadow-xl
                    rounded-2xl
                    p-7
                  "
                >

                  {/* FILE */}

                  <div className="
                    flex
                    items-center
                    gap-4
                  ">

                    <div className="
                      text-5xl
                    ">
                      📄
                    </div>

                    <div className="
                      min-w-0
                    ">

                      <h2 className="
                        text-lg
                        font-bold
                        text-gray-800
                        break-all
                      ">
                        {fileName}
                      </h2>

                      <p className="
                        text-sm
                        text-indigo-600
                        font-semibold
                        mt-1
                      ">
                        {extension} Resume
                      </p>

                      <p className="
                        text-sm
                        text-gray-400
                        mt-2
                      ">
                        Uploaded:
                      </p>

                      <p className="
                        text-sm
                        text-gray-500
                      ">
                        {resume.uploaded_at
                          ? new Date(
                              resume.uploaded_at
                            ).toLocaleString()
                          : "Unknown"}
                      </p>

                    </div>

                  </div>

                  {/* BUTTONS */}

                  <div className="
                    flex
                    flex-wrap
                    gap-3
                    mt-7
                  ">

                    <button
                      onClick={() =>
                        handleView(resume)
                      }
                      className="
                        bg-indigo-600
                        text-white
                        px-4
                        py-2
                        rounded-lg
                        hover:bg-indigo-700
                        transition
                      "
                    >
                      View Resume
                    </button>

                    <button
                      onClick={() =>
                        handleDownload(resume)
                      }
                      className="
                        bg-green-600
                        text-white
                        px-4
                        py-2
                        rounded-lg
                        hover:bg-green-700
                        transition
                      "
                    >
                      Download
                    </button>

                    <button
                      onClick={handleReplace}
                      className="
                        bg-yellow-500
                        text-white
                        px-4
                        py-2
                        rounded-lg
                        hover:bg-yellow-600
                        transition
                      "
                    >
                      Replace Resume
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          resume.id
                        )
                      }
                      className="
                        bg-red-600
                        text-white
                        px-4
                        py-2
                        rounded-lg
                        hover:bg-red-700
                        transition
                      "
                    >
                      Delete
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

        {/* BACK */}

        <button
          onClick={() =>
            navigate("/profile")
          }
          className="
            mt-8
            text-indigo-600
            hover:text-indigo-800
            font-semibold
          "
        >
          ← Back to Dashboard
        </button>

      </div>

    </div>
  );
}

export default MyResume;
