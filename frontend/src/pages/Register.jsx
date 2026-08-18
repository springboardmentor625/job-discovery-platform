import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const password = formData.password;

  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!strongPassword.test(password)) {
    alert(
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
    );
    return;
  }

  try {
  await api.post("register/", formData);

  alert("Registration Successful!");
  navigate("/");
} catch (error) {
  console.log("REGISTER ERROR:", error);
  console.log("RESPONSE:", error.response);
  console.log("DATA:", error.response?.data);

  if (!error.response) {
    alert("Cannot connect to backend.");
    return;
  }

  const data = error.response.data;

  const message = Object.entries(data)
    .map(([key, value]) =>
      `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
    )
    .join("\n");

  alert(message);
}
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-xl rounded-xl p-8 w-96">

        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          SwipeX
        </h1>

        <h2 className="text-xl font-semibold text-center mb-6">
          Create Account
        </h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full border rounded-lg p-3 mb-4"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border rounded-lg p-3 mb-4"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="relative mb-6">

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="w-full border rounded-lg p-3 pr-12"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-500"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>

          </div>

          <p className="text-xs text-gray-500 mb-4">
            Password must contain at least 8 characters, one uppercase
            letter, one lowercase letter, one number and one special
            character.
          </p>

          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Register
          </button>

        </form>

        <p className="text-center mt-6">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;