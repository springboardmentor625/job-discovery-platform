
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("resume_id");

      navigate("/");
    }
  };

  return (
    <button type="button" onClick={handleLogout}>
      Logout
    </button>
  );
}

export default LogoutButton;
