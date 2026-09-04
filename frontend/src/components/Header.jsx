import { useEffect, useState } from "react";
import api from "../api";

function Header() {
  const [name, setName] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/api/auth/me");
        setName(response.data.full_name || "");
      } catch (err) {
        console.error("Header user load error:", err);
      }
    };

    loadUser();
  }, []);

  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : "C";

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-end border-b border-sx-border bg-sx-card px-8">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight text-sx-text">
            {name || "Candidate"}
          </p>
          <p className="text-xs leading-tight text-sx-text-muted">
            Candidate Account
          </p>
        </div>

        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sx-primary text-sm font-bold text-white">
          {firstLetter}
        </div>
      </div>
    </header>
  );
}

export default Header;
