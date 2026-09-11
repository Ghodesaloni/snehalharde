import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2, Sparkles, UserCheck } from "lucide-react";
import AvaHireLogo from "@/components/AvaHireLogo";
import { toast } from "sonner";
import { authApi } from "@/services/api";

const DEMO_PRESETS = [
  { label: "Snehal Harde", email: "snehal.harde2935@gmail.com", role: "HR Administrator", pass: "password123" },
  { label: "Lead HR (Priya)", email: "hr@avahire.ai", role: "Recruiter Admin", pass: "password123" },
  { label: "Director Admin", email: "admin@avahire.ai", role: "People Ops", pass: "password123" },
];

const Login = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("avahire_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.email) {
          setForm((prev) => ({ ...prev, email: u.email }));
        }
      } else {
        setForm((prev) => ({ ...prev, email: "snehal.harde2935@gmail.com", password: "password123" }));
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  const handleQuickFill = (preset) => {
    setForm({
      email: preset.email,
      password: preset.pass,
      remember: true,
    });
    toast.info(`Selected ${preset.label} credentials`);
  };

  const handleGoogleLogin = () => {
    const activeEmail = form.email.trim() || "snehal.harde2935@gmail.com";
    const displayName = activeEmail.includes("snehal") ? "Snehal Harde" : "HR Administrator";
    const googleUser = {
      name: displayName,
      email: activeEmail,
      role: "recruiter",
      designation: "HR Administrator",
      company: "AvaHire Tech Solutions",
    };
    localStorage.setItem("avahire_user", JSON.stringify(googleUser));
    localStorage.setItem("avahire_token", `usr_google_${Date.now()}`);
    toast.success(`Signed in via Google as ${displayName} 👋`);
    setTimeout(() => navigate("/app/dashboard"), 250);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      if (response && (response.success || response.token || response.data)) {
        const userData = response.data || {
          name: form.email.split("@")[0],
          email: form.email.trim(),
          designation: "HR Administrator",
        };

        localStorage.setItem("avahire_user", JSON.stringify(userData));
        if (response.token) {
          localStorage.setItem("avahire_token", response.token);
        } else {
          localStorage.setItem("avahire_token", `usr_${Date.now()}`);
        }

        toast.success(response.message || `Welcome back, ${userData.name || "HR User"} 👋`);
        setTimeout(() => navigate("/app/dashboard"), 300);
      } else {
        toast.error(response?.error || "Incorrect password. Please check your credentials.");
      }
    } catch (err) {
      console.warn("Login attempt status:", err?.response?.status);
      const errMsg = err.response?.data?.error || err.message || "Login failed. Please check your credentials.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8" data-testid="login-page">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-4rem)]">
        {/* Left */}
        <div className="relative flex flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-violet-50 via-white to-violet-50 rounded-3xl">
          <div>
            <AvaHireLogo />
            <h1 className="mt-10 text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Welcome Back!<br />Let's Continue<br />
              <span className="gradient-text">Building Great Teams</span>
            </h1>
            <p className="mt-4 text-slate-600 max-w-md">
              Login to your HR account and manage jobs, candidates, interviews, and more with AI power.
            </p>
            <div className="mt-10 space-y-5">
              {[
                { icon: "fa-users-gear", bg: "bg-violet-100 text-violet-600", t: "AI-Powered Hiring", d: "Smart screening and ranking to find the best talent." },
                { icon: "fa-shield-halved", bg: "bg-emerald-100 text-emerald-600", t: "Secure & Reliable", d: "Enterprise-grade security to protect your data." },
                { icon: "fa-chart-column", bg: "bg-blue-100 text-blue-600", t: "Data-Driven Insights", d: "Real-time reports to make better hiring decisions." },
              ].map((b) => (
                <div key={b.t} className="flex gap-4">
                  <div className={`w-11 h-11 rounded-full ${b.bg} flex items-center justify-center`}>
                    <i className={`fa-solid ${b.icon}`}></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{b.t}</div>
                    <div className="text-sm text-slate-500">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form */}
        <form
          onSubmit={submit}
          data-testid="login-form"
          className="bg-white rounded-3xl shadow-xl shadow-violet-500/5 border border-slate-100 p-8 lg:p-14 flex flex-col justify-center"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-violet-100 flex items-center justify-center">
              <Lock size={34} className="text-violet-600" />
            </div>
            <h2 className="mt-5 text-3xl font-extrabold text-slate-900">Welcome Back!</h2>
            <p className="text-slate-500 mt-1">Login to your HR account</p>
          </div>

          {/* Quick Demo Access Badges */}
          <div className="mt-6 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-violet-500" />
              <span>Quick Login / Demo Credentials:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleQuickFill(p)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                    form.email === p.email
                      ? "bg-violet-600 text-white border-violet-600 font-semibold"
                      : "bg-white text-slate-700 border-slate-200 hover:border-violet-300"
                  }`}
                >
                  <UserCheck size={12} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Work Email</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  data-testid="login-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your work email"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  data-testid="login-password"
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  data-testid="login-remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-violet-600">Forgot Password?</Link>
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>

            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="flex-1 h-px bg-slate-200" />or<div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-xl border border-slate-200 font-semibold text-slate-800 flex items-center justify-center gap-3 hover:border-violet-400 transition cursor-pointer bg-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Login with Google
            </button>

            <div className="text-center text-sm text-slate-600">
              Don't have an account? <Link to="/register" className="text-violet-600 font-semibold">Register</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
