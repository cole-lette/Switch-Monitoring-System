import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import SwitchControl from "./pages/switch_control/SwitchControl";
import Logs from "./pages/logs/Logs";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile_Settings from "./pages/profile_settings/ProfileSettings";
import Login from "./pages/login_signup/login";
import Signup from "./pages/login_signup/signup";
import Reset_Password from "./pages/login_signup/resetPassword";
import RequireAuth from "./RequireAuth"; // Protect routes with this wrapper
import './index.css';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <main className="App">

      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<Reset_Password />} />
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/switch-control"
            element={
              <RequireAuth>
                <SwitchControl />
              </RequireAuth>
            }
          />
          <Route
            path="/logs"
            element={
              <RequireAuth>
                <Logs />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/profile_settings"
            element={
              <RequireAuth>
                <Profile_Settings />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        theme="dark"
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </main>
  );
}

export default App;
