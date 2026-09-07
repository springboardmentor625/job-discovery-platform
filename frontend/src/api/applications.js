import api from "./api";

// =========================================================
// GET ALL APPLICATIONS
// =========================================================

export const getApplications =
  async () => {
    const response =
      await api.get(
        "/api/applications"
      );

    return response.data;
  };

// =========================================================
// GET ONE APPLICATION
// =========================================================

export const getApplication =
  async (applicationId) => {
    const response =
      await api.get(
        `/api/applications/${applicationId}`
      );

    return response.data;
  };

// =========================================================
// UPDATE APPLICATION STATUS
// =========================================================

export const updateApplicationStatus =
  async (
    applicationId,
    status
  ) => {
    const response =
      await api.put(
        `/api/applications/${applicationId}/status`,
        {
          status,
        }
      );

    return response.data;
  };