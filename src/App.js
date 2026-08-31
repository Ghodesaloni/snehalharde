import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Landing from "@/pages/landing";
import Login from "@/pages/LoginPage";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/forgetpassword";
import Features from "@/pages/Features";
import HowItWorks from "@/pages/Howitworks";
import About from "@/pages/aboutus";
import Contact from "@/pages/Contact";

import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import Jobs from "@/pages/dashboard/job";
import Resumes from "@/pages/dashboard/Resume";
import Candidates from "@/pages/dashboard/candidates";
import Interviews from "@/pages/dashboard/interview";
import EmailCenter from "@/pages/dashboard/emailcenter";
import CalendarPage from "@/pages/dashboard/calenderpage";
import Settings from "@/pages/dashboard/settings";
import Profile from "@/pages/dashboard/Profile";

const RequireAuth = ({ children }) => {
  const user = localStorage.getItem("avahire_user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/app"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="email" element={<EmailCenter />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
