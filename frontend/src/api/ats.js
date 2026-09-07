import api from "./api";

// =========================================================
// RUN ATS ANALYSIS
// =========================================================

export const analyzeATS =
  async (
    resumeId,
    jobId
  ) => {
    const response =
      await api.post(
        "/api/ats/analyze",
        null,
        {
          params: {
            resume_id:
              resumeId,

            job_id:
              jobId,
          },
        }
      );

    return response.data;
  };

// =========================================================
// GET ALL ATS REPORTS
// =========================================================

export const getATSReports =
  async () => {
    const response =
      await api.get(
        "/api/ats/"
      );

    return response.data;
  };

// =========================================================
// GET ONE ATS REPORT
// =========================================================

export const getATSReport =
  async (
    atsReportId
  ) => {
    const response =
      await api.get(
        `/api/ats/${atsReportId}`
      );

    return response.data;
  };