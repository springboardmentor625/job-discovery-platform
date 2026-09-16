import axios from "axios";

const getApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE;

  if (envBase) {
    return envBase.endsWith("/") ? envBase : `${envBase}/`;
  }

  const hostname =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";

  return hostname === "localhost" || hostname === "127.0.0.1"
    ? `http://${hostname}:8001/api/`
    : "https://swipex-backend-n4y5.onrender.com/api/";
};