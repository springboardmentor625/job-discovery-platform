import { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaCode,
  FaGraduationCap,
  FaUsers,
  FaClipboardList,
  FaBookmark,
  FaCheck,
} from "react-icons/fa";
import api from "../services/api";

/* =========================================================
   PARSING HELPERS
========================================================= */

const extractSection = (text, startPattern, endPatterns = []) => {
  if (!text) return "";

  const startRegex = new RegExp(startPattern, "i");
  const startMatch = text.match(startRegex);

  if (!startMatch) return "";

  const startIndex =
    startMatch.index + startMatch[0].length;

  const remaining = text.substring(startIndex);

  let endIndex = remaining.length;

  endPatterns.forEach((pattern) => {
    const regex = new RegExp(pattern, "i");
    const match = remaining.match(regex);

    if (
      match &&
      match.index !== undefined &&
      match.index < endIndex
    ) {
      endIndex = match.index;
    }
  });

  return remaining
    .substring(0, endIndex)
    .trim();
};


const formatBullets = (text) => {
  if (!text) return [];

  return text
    .split(/[•\n\-\*·]/)
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length > 3 &&
        !/^(Required|Desired|Qualifications|Responsibilities)$/i.test(
          item
        )
    );
};


const parseSkills = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((skill) => String(skill).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[,;\n|]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
};


/* =========================================================
   JOB DETAILS MODAL
========================================================= */

function JobDetailsModal({
  job,
  onClose,
  onSwipe,
  onApplySuccess,
  onUnsaveSuccess,
}) {
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [linkOpened, setLinkOpened] = useState(false);
  const [saved, setSaved] = useState(false);
  const [swiping, setSwiping] = useState(false);

  const x = useMotionValue(0);


  /* =======================================================
     RESET STATE WHEN JOB CHANGES
  ======================================================= */

  useEffect(() => {
    setApplied(Boolean(job?.is_applied));
    setLinkOpened(false);
    setSaved(Boolean(job?.is_saved));
    setSwiping(false);
    setApplying(false);

    x.set(0);
  }, [job, x]);


  if (!job) return null;


  /* =======================================================
     JOB DATA
  ======================================================= */

  const description = String(
    job.description || ""
  );


  /* =======================================================
     REAL BACKEND ANALYSIS VALUES
  ======================================================= */

  const atsScore = Math.round(
    Number(job.ats_score ?? 0)
  );

  const skillPct = Math.round(
    Number(job.skill_match_percentage ?? 0)
  );


  /* =======================================================
     SKILLS
  ======================================================= */

  const matchedSkills = parseSkills(
    job.matched_skills
  );

  const missingSkills = parseSkills(
    job.missing_skills
  );

  const requiredSkills = parseSkills(
    job.required_skills
  );

  const preferredSkills = parseSkills(
    job.preferred_skills
  );


  /*
    IMPORTANT:

    This was missing in your previous code.

    Without this variable React throws:

    ReferenceError:
    jobSkillsCount is not defined
  */

  const jobSkillsCount = Number(
    job.recognized_job_skill_count ??
    requiredSkills.length ??
    0
  );


  /* =======================================================
     STRUCTURED JOB SECTIONS
  ======================================================= */

  const summary =
    extractSection(
      description,
      "Job Description",
      [
        "Responsibilities:",
        "Key Responsibilities:",
        "Education & Experience Required:",
        "Requirements:",
        "Technical Skills:",
      ]
    ) ||
    description.slice(0, 400);


  const responsibilitiesText =
    extractSection(
      description,
      "(?:Responsibilities|Key Responsibilities):",
      [
        "Education & Experience Required:",
        "Requirements:",
        "Technical Skills:",
        "Soft Skills",
      ]
    );

  const responsibilityBullets =
    formatBullets(responsibilitiesText);


  const educationText =
    extractSection(
      description,
      "(?:Education & Experience Required|Education):",
      [
        "Technical Skills:",
        "Soft Skills",
        "Requirements:",
      ]
    );

  const educationItems =
    formatBullets(educationText);


  const softSkillsText =
    extractSection(
      description,
      "Soft Skills",
      []
    );

  const softSkillItems =
    formatBullets(softSkillsText);


  const employmentType =
    description.match(
      /Employment Type:\s*(.*?)(?=Estimated Duration|Min Hourly Rate|Job Description|$)/is
    )?.[1]?.trim() || "Full-time";


  const salaryDisplay =
    job.salary &&
    !["competitive", "nan", "none", "null", "not specified"].includes(
      String(job.salary).toLowerCase().trim()
    )
      ? job.salary
      : "Not specified";


  /* =======================================================
     APPLY ACTION — Step 1: Open link and record link_opened
  ======================================================= */

  const handleApply = async () => {
    if (applied || applying) return;

    if (!job.application_url) {
      toast.error("Application link not available for this job.");
      return;
    }

    // Open the external link
    window.open(
      job.application_url,
      "_blank",
      "noopener,noreferrer"
    );

    setLinkOpened(true);

    // Record that the link was opened (not yet applied)
    try {
      await api.post("applications/", {
        job_id: job.id,
        status: "link_opened",
      });
    } catch (_) {
      // Non-fatal — link is already open
    }

    toast("Application link opened! Click \"Mark as Applied\" once you've submitted.", {
      icon: "🔗",
      duration: 4000,
    });
  };


  /* =======================================================
     APPLY ACTION — Step 2: Explicit "Mark as Applied"
  ======================================================= */

  const handleMarkApplied = async () => {
    if (applied || applying) return;

    try {
      setApplying(true);

      await api.post("applications/", {
        job_id: job.id,
        status: "applied",
      });

      setApplied(true);

      toast.success(`Marked as Applied for ${job.title}!`);

      if (onApplySuccess) {
        onApplySuccess(job.id);
      }

    } catch (error) {
      if (
        error.response?.status === 200 ||
        error.response?.data?.detail
          ?.toLowerCase()
          ?.includes("already applied")
      ) {
        setApplied(true);
        toast.success("You have already applied for this job.");
        if (onApplySuccess) {
          onApplySuccess(job.id);
        }
      } else {
        toast.error(
          error.response?.data?.detail ||
          "Unable to record application."
        );
      }
    } finally {
      setApplying(false);
    }
  };


  /* =======================================================
     SAVE ACTION
  ======================================================= */

  const handleSave = async () => {
  if (!job.id || swiping || saved) return;

  try {
    setSwiping(true);

    await api.post("swipes/", {
      job_id: job.id,
      decision: "saved",
    });

    setSaved(true);

    toast.success("Job saved!");

    if (onSwipe) {
      onSwipe("saved", job.id);
    }
  } catch (error) {
    console.error("Save error:", error);
    toast.error(
      error.response?.data?.detail || "Unable to save job."
    );
  } finally {
    setSwiping(false);
  }
};
const handleUnsave = async () => {
  if (!job.id || swiping || !saved) return;

  try {
    setSwiping(true);

    // Find the saved swipe belonging to this job
    const response = await api.get(`swipes/?decision=saved`);

    const savedSwipes = Array.isArray(response.data)
      ? response.data
      : response.data?.results || [];

    const savedSwipe = savedSwipes.find(
      (swipe) => swipe.job?.id === job.id || swipe.job_id === job.id
    );

    if (!savedSwipe?.id) {
      toast.error("Saved swipe not found.");
      return;
    }

    await api.delete(`swipes/${savedSwipe.id}/`);

    setSaved(false);

    toast.success("Job unsaved.");

    if (onUnsaveSuccess) {
      onUnsaveSuccess(job.id);
    }
  } catch (error) {
    console.error("Unsave error:", error);
    toast.error(
      error.response?.data?.detail || "Unable to unsave job."
    );
  } finally {
    setSwiping(false);
  }
};


  /* =======================================================
     SWIPE ACTION
  ======================================================= */

  const completeSwipe = async (
    decision
  ) => {

    if (swiping) return;

    setSwiping(true);


    try {

      await api.post(
        "swipes/",
        {
          job_id: job.id,
          decision,
        }
      );


      if (
        decision === "interested"
      ) {

        toast.success(
          "Marked as Interested!"
        );

      } else {

        toast(
          "Job Skipped",
          {
            icon: "👋",
          }
        );

      }


      if (onSwipe) {

        onSwipe(
          decision,
          job.id
        );

      } else {

        onClose();

      }

    } catch (error) {

      console.error(
        "Swipe error:",
        error
      );


      toast.error(
        error.response?.data?.detail ||
        "Failed to register decision."
      );

    } finally {

      setSwiping(false);

    }
  };


  /* =======================================================
     UI
  ======================================================= */

  return (

    <div
      onClick={onClose}
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        p-3 sm:p-4
        bg-slate-900/60
        backdrop-blur-sm
        overflow-y-auto
      "
    >

      <motion.div

        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}

        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}

        exit={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}

        transition={{
          duration: 0.2,
        }}

        onClick={(e) =>
          e.stopPropagation()
        }

        className="
          relative
          w-full
          max-w-2xl
          max-h-[90vh]
          bg-white
          rounded-3xl
          shadow-2xl
          border border-slate-200
          flex flex-col
          overflow-hidden
          my-auto
        "
      >


        {/* =================================================
            MODAL HEADER
        ================================================= */}

        <div className="
          shrink-0
          p-6 sm:p-7
          border-b border-slate-100
          bg-white
          relative
        ">


          {/* CLOSE */}

          <button

            type="button"

            onClick={onClose}

            className="
              absolute
              top-5 right-5
              w-9 h-9
              rounded-full
              bg-slate-100
              hover:bg-slate-200
              text-slate-500
              flex items-center justify-center
              transition
              cursor-pointer
            "
          >

            <FaTimes />

          </button>


          {/* JOB HEADER */}

          <div className="
            flex
            items-start
            gap-4
            pr-10
          ">


            <div className="
              w-14 h-14
              rounded-2xl
              bg-indigo-50
              text-indigo-700
              font-black
              flex items-center justify-center
              text-2xl
              shrink-0
              border border-indigo-100
            ">

              {job.company
                ? job.company
                    .charAt(0)
                    .toUpperCase()
                : "C"}

            </div>


            <div className="min-w-0">

              <h2 className="
                text-xl
                font-black
                text-slate-900
                tracking-tight
                leading-snug
              ">

                {job.title ||
                  "Job Opportunity"}

              </h2>


              <p className="
                text-sm
                font-semibold
                text-slate-500
                mt-0.5
              ">

                {job.company ||
                  "Company"}

              </p>


              <div className="
                flex
                items-center
                gap-3
                text-xs
                text-slate-500
                mt-2
                flex-wrap
              ">


                <span className="
                  flex
                  items-center
                  gap-1
                  font-medium
                ">

                  <FaMapMarkerAlt className="
                    text-slate-400
                  " />

                  {job.location ||
                    "Remote"}

                </span>


                <span className="
                  px-2 py-0.5
                  rounded-md
                  bg-indigo-50
                  text-indigo-700
                  font-bold
                  text-[10px]
                ">

                  {job.work_mode ||
                    "On-site"}

                </span>


                <span className="
                  px-2 py-0.5
                  rounded-md
                  bg-slate-100
                  text-slate-700
                  font-semibold
                  text-[10px]
                ">

                  {salaryDisplay}

                </span>

              </div>

            </div>

          </div>


          {/* ===============================================
              ATS SCORE
          =============================================== */}

          <div className="mt-5">
            <div className="
              bg-indigo-50/80
              border border-indigo-100
              rounded-2xl
              p-3.5
              text-center
              flex items-center justify-between
              px-6
            ">
              <p className="
                text-xs
                font-bold
                uppercase
                tracking-wider
                text-indigo-600
              ">
                ATS Score
              </p>

              <p className="
                text-2xl
                font-black
                text-indigo-700
              ">
                {atsScore}%
              </p>
            </div>
          </div>
        </div>


        {/* =================================================
            MODAL BODY
        ================================================= */}

        <div className="
          flex-1
          overflow-y-auto
          p-6 sm:p-7
          space-y-6
          text-slate-700
        ">


          {/* ROLE SUMMARY */}

          {summary && (

            <section className="
              space-y-2
            ">

              <h3 className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-slate-400
                flex
                items-center
                gap-1.5
              ">

                <FaClipboardList className="
                  text-indigo-600
                " />

                Role Summary

              </h3>


              <p className="
                text-sm
                text-slate-600
                leading-relaxed
                bg-slate-50
                p-4
                rounded-2xl
                border border-slate-100
              ">

                {summary}

              </p>

            </section>

          )}


          {/* ===============================================
              MATCH ANALYSIS
          =============================================== */}

          <section className="
            space-y-3
          ">

            <h3 className="
              text-xs
              font-black
              uppercase
              tracking-wider
              text-slate-400
            ">

              Match Analysis

            </h3>


            <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-3
            ">


              {/* SKILLS YOU HAVE */}

              <div className="
                p-4
                rounded-2xl
                bg-emerald-50/70
                border border-emerald-100
              ">

                <h4 className="
                  text-xs
                  font-black
                  uppercase
                  tracking-wider
                  text-emerald-800
                  mb-2
                ">

                  Skills You Have (
                  {matchedSkills.length}
                  )

                </h4>


                <div className="
                  flex
                  flex-wrap
                  gap-1.5
                ">

                  {matchedSkills.length > 0 ? (

                    matchedSkills.map(
                      (skill, index) => (

                        <span

                          key={index}

                          className="
                            px-2.5
                            py-1
                            rounded-lg
                            text-xs
                            font-semibold
                            bg-white
                            text-emerald-700
                            border border-emerald-200
                          "
                        >

                          ✓ {skill}

                        </span>

                      )
                    )

                  ) : (

                    <span className="
                      text-xs
                      text-slate-400
                      italic
                    ">

                      No direct matches

                    </span>

                  )}

                </div>

              </div>


              {/* SKILLS TO IMPROVE */}

              <div className="
                p-4
                rounded-2xl
                bg-amber-50/70
                border border-amber-100
              ">

                <h4 className="
                  text-xs
                  font-black
                  uppercase
                  tracking-wider
                  text-amber-800
                  mb-2
                ">

                  Skills to Improve (
                  {missingSkills.length}
                  )

                </h4>


                <div className="
                  flex
                  flex-wrap
                  gap-1.5
                ">


                  {jobSkillsCount === 0 ? (

                    <span className="
                      text-xs
                      text-slate-400
                      italic
                    ">

                      No recognized job skills detected

                    </span>


                  ) : missingSkills.length === 0 ? (

                    <span className="
                      text-xs
                      text-emerald-600
                      font-semibold
                    ">

                      All recognized skills matched

                    </span>


                  ) : (

                    missingSkills.map(
                      (skill, index) => (

                        <span

                          key={index}

                          className="
                            px-2.5
                            py-1
                            rounded-lg
                            text-xs
                            font-semibold
                            bg-white
                            text-amber-700
                            border border-amber-200
                          "
                        >

                          {skill}

                        </span>

                      )
                    )

                  )}

                </div>

              </div>

            </div>

          </section>


          {/* RESPONSIBILITIES */}

          {responsibilityBullets.length > 0 && (

            <section className="
              space-y-2
            ">

              <h3 className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-slate-400
              ">

                Key Responsibilities

              </h3>


              <ul className="
                space-y-2
              ">

                {responsibilityBullets.map(
                  (item, index) => (

                    <li

                      key={index}

                      className="
                        flex
                        gap-2.5
                        text-xs
                        text-slate-600
                        leading-relaxed
                      "
                    >

                      <span className="
                        text-indigo-600
                        font-bold
                      ">

                        •

                      </span>


                      <span>

                        {item}

                      </span>

                    </li>

                  )
                )}

              </ul>

            </section>

          )}


          {/* REQUIRED / PREFERRED SKILLS */}

          {(requiredSkills.length > 0 ||
            preferredSkills.length > 0) && (

            <section className="
              space-y-3
            ">

              <h3 className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-slate-400
                flex
                items-center
                gap-1.5
              ">

                <FaCode className="
                  text-indigo-600
                " />

                Skill Requirements

              </h3>


              {requiredSkills.length > 0 && (

                <div>

                  <p className="
                    text-xs
                    font-bold
                    text-slate-700
                    mb-1.5
                  ">

                    Required Skills:

                  </p>


                  <div className="
                    flex
                    flex-wrap
                    gap-1.5
                  ">

                    {requiredSkills.map(
                      (skill, index) => (

                        <span

                          key={index}

                          className="
                            px-2.5
                            py-1
                            rounded-lg
                            text-xs
                            font-medium
                            bg-slate-100
                            text-slate-800
                            border border-slate-200
                          "
                        >

                          {skill}

                        </span>

                      )
                    )}

                  </div>

                </div>

              )}


              {preferredSkills.length > 0 && (

                <div className="pt-2">

                  <p className="
                    text-xs
                    font-bold
                    text-slate-700
                    mb-1.5
                  ">

                    Preferred Skills:

                  </p>


                  <div className="
                    flex
                    flex-wrap
                    gap-1.5
                  ">

                    {preferredSkills.map(
                      (skill, index) => (

                        <span

                          key={index}

                          className="
                            px-2.5
                            py-1
                            rounded-lg
                            text-xs
                            font-medium
                            bg-indigo-50
                            text-indigo-700
                            border border-indigo-100
                          "
                        >

                          {skill}

                        </span>

                      )
                    )}

                  </div>

                </div>

              )}

            </section>

          )}


          {/* EDUCATION & EXPERIENCE */}

          <section className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-4
          ">


            {/* EDUCATION */}

            <div className="
              p-4
              rounded-2xl
              bg-slate-50
              border border-slate-100
              space-y-1
            ">

              <h4 className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-slate-500
                flex
                items-center
                gap-1.5
              ">

                <FaGraduationCap className="
                  text-indigo-600
                " />

                Education

              </h4>


              <p className="
                text-xs
                text-slate-700
                leading-relaxed
                font-medium
              ">

                {educationItems.length > 0
                  ? educationItems.join(", ")
                  : "Bachelor's degree or equivalent experience"}

              </p>

            </div>


            {/* EXPERIENCE */}

            <div className="
              p-4
              rounded-2xl
              bg-slate-50
              border border-slate-100
              space-y-1
            ">

              <h4 className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-slate-500
                flex
                items-center
                gap-1.5
              ">

                <FaBriefcase className="
                  text-indigo-600
                " />

                Experience Level

              </h4>


              <p className="
                text-xs
                text-slate-700
                leading-relaxed
                font-medium
              ">

                {job.experience ||
                  "Entry to Mid Level"}

              </p>

            </div>

          </section>


          {/* SOFT SKILLS */}

          {softSkillItems.length > 0 && (

            <section className="
              space-y-2
            ">

              <h3 className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-slate-400
                flex
                items-center
                gap-1.5
              ">

                <FaUsers className="
                  text-indigo-600
                " />

                Soft Skills

              </h3>


              <div className="
                flex
                flex-wrap
                gap-1.5
              ">

                {softSkillItems.map(
                  (item, index) => (

                    <span

                      key={index}

                      className="
                        px-2.5
                        py-1
                        rounded-lg
                        text-xs
                        font-medium
                        bg-slate-100
                        text-slate-700
                        border border-slate-200
                      "
                    >

                      {item}

                    </span>

                  )
                )}

              </div>

            </section>

          )}


          {/* EMPLOYMENT DETAILS */}

          <section className="
            p-4
            rounded-2xl
            bg-slate-50
            border border-slate-100
            space-y-2
          ">

            <h3 className="
              text-xs
              font-black
              uppercase
              tracking-wider
              text-slate-400
            ">

              Employment Details

            </h3>


            <div className="
              grid
              grid-cols-2
              sm:grid-cols-3
              gap-3
              text-xs
            ">


              <div>

                <span className="
                  text-slate-400
                  block
                  text-[10px]
                  uppercase
                ">

                  Type

                </span>


                <span className="
                  font-bold
                  text-slate-800
                ">

                  {employmentType}

                </span>

              </div>


              <div>

                <span className="
                  text-slate-400
                  block
                  text-[10px]
                  uppercase
                ">

                  Work Mode

                </span>


                <span className="
                  font-bold
                  text-slate-800
                ">

                  {job.work_mode ||
                    "On-site"}

                </span>

              </div>


              <div>

                <span className="
                  text-slate-400
                  block
                  text-[10px]
                  uppercase
                ">

                  Salary

                </span>


                <span className="
                  font-bold
                  text-slate-800
                ">

                  {salaryDisplay}

                </span>

              </div>

            </div>

          </section>


          {/* FULL DESCRIPTION */}

          {description && (

            <section className="
              space-y-2
              pt-2
              border-t
              border-slate-100
            ">

              <h3 className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-slate-400
              ">

                Full Description

              </h3>


              <div className="
                text-xs
                text-slate-600
                leading-relaxed
                whitespace-pre-line
                max-h-48
                overflow-y-auto
                p-4
                rounded-2xl
                bg-slate-50
                border border-slate-100
              ">

                {description}

              </div>

            </section>

          )}

        </div>


        {/* =================================================
            MODAL FOOTER
        ================================================= */}

        <div className="
          shrink-0
          p-4 sm:p-5
          border-t
          border-slate-100
          bg-white
          flex
          items-center
          justify-between
          gap-3
        ">


          {/* LEFT ACTIONS */}

          <div className="
            flex
            items-center
            gap-2
          ">


            {/* SKIP */}

            <button

              type="button"

              onClick={() =>
                completeSwipe("skipped")
              }

              disabled={swiping}

              className="
                h-11
                px-4
                rounded-xl
                bg-slate-100
                hover:bg-slate-200
                text-slate-700
                font-bold
                text-xs
                inline-flex
                items-center
                gap-1.5
                transition
                disabled:opacity-50
                cursor-pointer
              "
            >

              <FaTimes />

              Skip

            </button>


            {/* SAVE */}

            <button

              type="button"

              onClick={saved ? handleUnsave : handleSave}

              disabled={swiping}

              className={`
                h-11
                px-4
                rounded-xl
                font-bold
                text-xs
                inline-flex
                items-center
                gap-1.5
                transition
                disabled:opacity-50
                cursor-pointer
                ${
                  saved
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }
              `}
            >

              <FaBookmark />

              {saved
                ? "Unsave"
                : "Save"}

            </button>

          </div>


          {/* RIGHT ACTIONS */}

          <div className="
            flex
            items-center
            gap-2
          ">


            {/* APPLY */}

            <button

              type="button"

              onClick={handleApply}

              disabled={
                applying ||
                applied ||
                !job.application_url
              }

              className={`
                h-11
                px-5
                rounded-xl
                font-bold
                text-xs
                inline-flex
                items-center
                gap-1.5
                transition
                shadow-sm
                cursor-pointer
                disabled:opacity-60
                ${
                  applied
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : !job.application_url
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }
              `}
            >

              {applied ? (

                <>
                  <FaCheckCircle />
                  Applied
                </>

              ) : (

                <>

                  <FaExternalLinkAlt className="
                    text-[10px]
                  " />

                  {applying
                    ? "Opening link..."
                    : "Apply on Company Website"}

                </>

              )}

            </button>


            {/* INTERESTED */}

            <button

              type="button"

              onClick={() =>
                completeSwipe("interested")
              }

              disabled={swiping}

              className="
                h-11
                px-5
                rounded-xl
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                font-bold
                text-xs
                inline-flex
                items-center
                gap-1.5
                transition
                shadow-sm
                cursor-pointer
                disabled:opacity-50
              "
            >

              <FaCheck />

              Interested

            </button>

          </div>

        </div>

      </motion.div>

    </div>

  );
}


export default JobDetailsModal;