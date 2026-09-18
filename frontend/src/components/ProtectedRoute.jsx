import { Navigate } from "react-router-dom";

// Previously, nothing in App.jsx checked for a token before rendering the
// candidate Layout/pages — an unauthenticated visit to e.g. /candidate/jobs
// briefly rendered the whole shell, and was only ever kicked back to
// /login reactively, after some API call happened to return a 401 (see
// api.js's response interceptor). This guard checks up front instead.
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
