import { useEffect, useState } from "react";
import api from "../api";

// Previously Header.jsx and CandidateDashboard.jsx each ran their own
// independent `api.get("/api/auth/me")` on mount, firing two identical
// requests for the same data on every dashboard page load. This module
// keeps one small cache + one in-flight promise so any number of
// components mounted at the same time share a single request.
let cachedUser = null;
let inFlightRequest = null;

async function fetchCurrentUser() {
  if (cachedUser) {
    return cachedUser;
  }

  if (!inFlightRequest) {
    inFlightRequest = api
      .get("/api/auth/me")
      .then((response) => {
        cachedUser = response.data;
        return cachedUser;
      })
      .finally(() => {
        inFlightRequest = null;
      });
  }

  return inFlightRequest;
}

// Call after login/logout, or after anything that changes the account
// info this hook exposes, so the next call re-fetches instead of
// serving stale cached data.
export function invalidateCurrentUser() {
  cachedUser = null;
  inFlightRequest = null;
}

export default function useCurrentUser() {
  const [user, setUser] = useState(() => cachedUser);
  const [loading, setLoading] = useState(() => !cachedUser);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedUser) {
      // Already synced via the useState initializer above — nothing to do.
      return undefined;
    }

    let cancelled = false;

    fetchCurrentUser()
      .then((data) => {
        if (!cancelled) {
          setUser(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
}
