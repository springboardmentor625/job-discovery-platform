import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login.jsx";
import CreateProfile from "./pages/CreateProfile";
import ViewProfile from "./pages/ViewProfile";
import EditProfile from "./pages/EditProfile";
import MyResume from "./pages/MyResume";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Settings from "./pages/Settings";
import ApplyJob from "./pages/ApplyJob";
import Recommendations from "./pages/Recommendations";
import ProtectedRoute from "./pages/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================= */}
        {/* PUBLIC ROUTES */}
        {/* ========================= */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ========================= */}
        {/* PROTECTED ROUTES */}
        {/* ========================= */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >

          {/* Profile */}
          <Route
            path="/profile"
            element={<ViewProfile />}
          />

          {/* View Profile */}
          <Route
            path="/view-profile"
            element={<ViewProfile />}
          />

          {/* Create Profile */}
          <Route
            path="/create-profile"
            element={<CreateProfile />}
          />

          {/* Edit Profile */}
          <Route
            path="/edit-profile"
            element={<EditProfile />}
          />

          {/* Resume */}
          <Route
            path="/resume"
            element={<MyResume />}
          />

          {/* Jobs */}
          <Route
            path="/jobs"
            element={<Jobs />}
          />

          {/* Applications */}
          <Route
            path="/applications"
            element={<Applications />}
          />
          {/* AI Recommendations */}
        <Route
          path="/recommendations"
          element={<Recommendations />}
        />
          {/* Settings */}
          <Route
            path="/settings"
            element={<Settings />}
          />

          {/* Apply Job */}
          <Route
            path="/apply/:id"
            element={<ApplyJob />}
          />

        </Route>

        {/* ========================= */}
        {/* FALLBACK */}
        {/* ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
