import api from "./api";

// =========================================================
// SWIPE JOB
// LEFT / RIGHT / SAVE
// =========================================================

export const swipeJob = async (
  jobId,
  swipeAction
) => {
  const response =
    await api.post(
      "/api/swipes",
      {
        job_id: jobId,
        swipe_action:
          swipeAction,
      }
    );

  return response.data;
};

// =========================================================
// GET SAVED JOBS
// =========================================================

export const getSavedJobs =
  async () => {
    const response =
      await api.get(
        "/api/swipes/saved"
      );

    return response.data;
  };

// =========================================================
// GET SWIPE HISTORY
// =========================================================

export const getSwipeHistory =
  async () => {
    const response =
      await api.get(
        "/api/swipes"
      );

    return response.data;
  };