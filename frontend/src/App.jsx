import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import CandidateDashboard from "./pages/CandidateDashboard";
import EditProfile from "./pages/EditProfile";
import Resume from "./pages/Resume";
import JobDiscovery from "./pages/JobDiscovery";
import Applications from "./pages/Applications";
import Matches from "./pages/Matches";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/candidate/resume"
          element={<Resume />}
        />
        <Route
          path="/candidate/applications"
          element={<Applications />}
        />
        <Route
          path="/candidate"
          element={<CandidateDashboard />}
        />
        <Route
          path="/candidate/profile/edit"
           element={<EditProfile />}
        />
        <Route
          path="/"
          element={
            <Navigate to="/login" />
          }
        />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/candidate/jobs"
          element={<JobDiscovery />}
        />
        <Route
        path="/candidate/matches"
        element={<Matches />}
        />

        
      </Routes>

    </BrowserRouter>

  );
}

export default App;