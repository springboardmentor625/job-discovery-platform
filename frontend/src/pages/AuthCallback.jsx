import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";
import { fetchMe } from "../services/api";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");

    if (!access || !refresh) {
      setError("Sign-in didn't complete — no tokens were returned.");
      return;
    }

    dispatch(setCredentials({ user: null, access, refresh }));

    fetchMe()
      .then(({ data }) => {
        dispatch(setCredentials({ user: data, access, refresh }));
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        setError("Signed in, but couldn't load your account. Try logging in again.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-700 mb-3">{error}</p>
            <a href="/login" className="text-violet-600 font-semibold text-sm">
              Back to login
            </a>
          </>
        ) : (
          <p className="text-muted">Signing you in...</p>
        )}
      </div>
    </div>
  );
}