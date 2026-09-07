import api from "./api";

// =========================================================
// CANDIDATE DASHBOARD
// =========================================================

export const getCandidateDashboard =
  async () => {
    const response =
      await api.get(
        "/api/dashboard/candidate"
      );

    return response.data;
  };