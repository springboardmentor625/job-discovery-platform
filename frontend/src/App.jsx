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

        
      </Routes>

    </BrowserRouter>

  );
}

export default App;