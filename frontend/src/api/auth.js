import api from "./api";

// =========================================================
// REGISTER
// =========================================================

export const registerUser = async (userData) => {
  const response = await api.post(
    "/api/auth/register",
    userData
  );

  return response.data;
};

// =========================================================
// LOGIN
// =========================================================

export const loginUser = async (userData) => {
  const response = await api.post(
    "/api/auth/login",
    userData
  );

  return response.data;
};

// =========================================================
// CURRENT USER
// =========================================================

export const getCurrentUser = async () => {
  const response = await api.get(
    "/api/auth/me"
  );

  return response.data;
};