
import { useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../api/api";



function UploadResume() {

  const navigate = useNavigate();



  const [selectedFile, setSelectedFile] = useState(null);

  const [error, setError] = useState("");

  const [isUploading, setIsUploading] = useState(false);



  // =========================================================
  // CONSTANTS
  // =========================================================



  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB



  const allowedFileTypes = [

    "application/pdf",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  ];



  // =========================================================
  // FILE CHANGE
  // =========================================================



  const handleFileChange = (event) => {

    const file = event.target.files[0];



    setError("");

    setSelectedFile(null);



    if (!file) {

      return;

    }



    // -------------------------------------------------------
    // CHECK FILE TYPE
    // -------------------------------------------------------



    if (!allowedFileTypes.includes(file.type)) {

      setError(

        "Invalid file type. Please upload a PDF, DOC, or DOCX file."

      );



      event.target.value = "";

      return;

    }



    // -------------------------------------------------------
    // CHECK FILE SIZE
    // -------------------------------------------------------



    if (file.size > MAX_FILE_SIZE) {

      setError("File size must not exceed 5 MB.");



      event.target.value = "";

      return;

    }



    // -------------------------------------------------------
    // FILE IS VALID
    // -------------------------------------------------------



    setSelectedFile(file);

  };



  // =========================================================
  // REMOVE SELECTED FILE
  // =========================================================



  const handleRemoveFile = () => {

    setSelectedFile(null);

    setError("");



    const fileInput = document.getElementById("resume");



    if (fileInput) {

      fileInput.value = "";

    }

  };



  // =========================================================
  // UPLOAD RESUME
  // =========================================================



  const handleSubmit = async (event) => {

    event.preventDefault();



    // -------------------------------------------------------
    // CHECK FILE
    // -------------------------------------------------------



    if (!selectedFile) {

      setError("Please select a resume before continuing.");

      return;

    }



    setIsUploading(true);

    setError("");



    // -------------------------------------------------------
    // CREATE FORM DATA
    // -------------------------------------------------------



    const formData = new FormData();



    formData.append("file", selectedFile);



    // -------------------------------------------------------
    // SEND TO BACKEND
    // -------------------------------------------------------



    try {

      const response = await api.post(

        "/api/resumes/upload",

        formData,

        {

          headers: {

            "Content-Type": "multipart/form-data",

          },

        }

      );



      console.log(

        "Resume uploaded successfully:",

        response.data

      );



      // -----------------------------------------------------
      // SAVE RESUME ID
      // -----------------------------------------------------



      if (response.data.resume_id) {

        localStorage.setItem(

          "resume_id",

          response.data.resume_id

        );

      }



      // -----------------------------------------------------
      // GO TO NEXT PAGE
      // -----------------------------------------------------



      navigate("/resume-parsing", {

        state: {

          resume: response.data,

        },

      });



    } catch (error) {

      console.error(

        "Resume upload error:",

        error

      );



      // -----------------------------------------------------
      // DISPLAY BACKEND ERROR
      // -----------------------------------------------------



      setError(

        error.response?.data?.detail ||

        "Resume upload failed. Please try again."

      );



    } finally {

      setIsUploading(false);

    }

  };



  // =========================================================
  // UI
  // =========================================================



  return (

    <div

      className="page resume-page"

      style={{

        width: "100vw",

        minHeight: "100vh",

        margin: 0,

        padding: 0,

        display: "flex",

        alignItems: "stretch",

        justifyContent: "stretch",

      }}

    >



      <div

        className="resume-card"

        style={{

          width: "100%",

          minHeight: "100vh",

          maxWidth: "none",

          margin: 0,

          borderRadius: 0,

          boxSizing: "border-box",

        }}

      >



        {/* ===================================================
            HEADER
        =================================================== */}



        <div className="resume-header">



          <div>

            <h1>Upload Your Resume</h1>



            <p>

              Add your latest resume so SwipeX can

              understand your skills and find better

              job opportunities for you.

            </p>

          </div>



        </div>



        {/* ===================================================
            ERROR
        =================================================== */}



        {error && (

          <div className="resume-error">

            <span>!</span>

            <p>{error}</p>

          </div>

        )}



        {/* ===================================================
            UPLOAD AREA
        =================================================== */}



        <form onSubmit={handleSubmit}>



          <label

            htmlFor="resume"

            className={`resume-upload-area ${

              selectedFile ? "has-file" : ""

            }`}

          >



            <div className="upload-cloud-icon">

              ↑

            </div>



            <h2>

              {selectedFile

                ? "Resume selected"

                : "Upload your resume"}

            </h2>



            <p>

              {selectedFile

                ? "Your file is ready to upload."

                : "Click here to browse and select your resume"}

            </p>



            {!selectedFile && (

              <span className="browse-button">

                Choose File

              </span>

            )}



            <input

              id="resume"

              type="file"

              accept=".pdf,.doc,.docx"

              onChange={handleFileChange}

              disabled={isUploading}

            />



          </label>



          {/* =================================================
              FILE REQUIREMENTS
          ================================================= */}



          <div className="resume-requirements">



            <div className="requirement-item">

              <span>✓</span>

              <div>

                <strong>Supported formats</strong>

                <p>PDF, DOC, DOCX</p>

              </div>

            </div>



            <div className="requirement-item">

              <span>✓</span>

              <div>

                <strong>Maximum size</strong>

                <p>5 MB</p>

              </div>

            </div>



          </div>



          {/* =================================================
              SELECTED FILE
          ================================================= */}



          {selectedFile && (

            <div className="selected-resume-card">



              <div className="selected-resume-icon">

                📄

              </div>



              <div className="selected-resume-details">



                <strong>

                  {selectedFile.name}

                </strong>



                <p>

                  {(

                    selectedFile.size /

                    (1024 * 1024)

                  ).toFixed(2)}{" "}

                  MB

                </p>



              </div>



              <button

                type="button"

                className="remove-resume-button"

                onClick={handleRemoveFile}

                disabled={isUploading}

              >

                Remove

              </button>



            </div>

          )}



          {/* =================================================
              INFORMATION
          ================================================= */}



          <div className="resume-analysis-info">



            <div>

              <strong>

                What happens next?

              </strong>



              <p>

                SwipeX will analyze your resume,

                extract relevant information and

                use it to personalize your job

                recommendations.

              </p>

            </div>



          </div>



          {/* =================================================
              SUBMIT
          ================================================= */}



          <button

            type="submit"

            className="resume-submit-button"

            disabled={isUploading}

          >

            {isUploading

              ? "Uploading Resume..."

              : "Upload Resume & Continue"}

          </button>



        </form>



        {/* ===================================================
            FOOTER
        =================================================== */}



        <p className="resume-security-note">

          Your resume is securely processed by SwipeX.

        </p>



      </div>



    </div>

  );

}



export default UploadResume;
