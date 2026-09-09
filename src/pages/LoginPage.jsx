import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Database, Sparkles, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, UserCheck } from "lucide-react";
import AvaHireLogo from "@/components/AvaHireLogo";
import { toast } from "sonner";
import { authApi } from "@/services/api";

const Login = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [demoAccounts, setDemoAccounts] = useState([
    {
      email: "hr@avahire.ai",
      password: "password123",
      role: "Lead HR Administrator",
      name: "Priya Mehta",
      company: "TechCorp Solutions Pvt. Ltd.",
    },
    {
      email: "admin@avahire.ai",
      password: "password123",
      role: "Director of People Ops",
      name: "AvaHire Admin",
      company: "AvaHire Talent Intelligence",
    },
  ]);

  const [form, setForm] = useState(() => {
    const savedEmail = localStorage.getItem("avahire_remember_email") || "hr@avahire.ai";
    return { email: savedEmail, password: "password123", remember: true };
  });

  // Fetch live demo accounts from PostgreSQL if available
  useEffect(() => {
    let isMounted = true;
    authApi.getDemoAccounts()
      .then((res) => {
        if (isMounted && res && res.data && res.data.length > 0) {
          setDemoAccounts(res.data);
        }
      })
      .catch(() => {
        // use fallback demo accounts
      });
    return () => { isMounted = false; };
  }, []);

  const handleQuickFill = (acc) => {
    setForm({
      email: acc.email,
      password: acc.password,
      remember: true,
    });
    setErrorMessage("");
    toast.info(`Filled credentials for ${acc.name} (${acc.role})`);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!form.email || !form.password) {
      setErrorMessage("Please enter both work email and password.");
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      if (response && response.success) {
        const userData = response.data;
        const authToken = response.token || userData.uid;

        // Persist session
        localStorage.setItem("avahire_user", JSON.stringify(userData));
        localStorage.setItem("avahire_token", authToken);

        if (form.remember) {
          localStorage.setItem("avahire_remember_email", form.email.trim());
        } else {
          localStorage.removeItem("avahire_remember_email");
        }

        toast.success(`Welcome back, ${userData.name || "HR Admin"}! 👋`, {
          description: `Signed in as ${userData.company || "AvaHire Solutions"}`,
        });

        setTimeout(() => {
          navigate("/app/dashboard");
        }, 350);
      } else {
        const err = response?.error || "Invalid email or password. Please try again.";
        setErrorMessage(err);
        toast.error(err);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      const serverMsg = err.response?.data?.error || "Authentication failed. Please verify your credentials or server connection.";
      setErrorMessage(serverMsg);
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8" data-testid="login-page">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-4rem)]">
        {/* Left hero banner */}
        <div className="relative flex flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-violet-50 via-white to-violet-50 rounded-3xl border border-violet-100/50">
          <div>
            <div className="flex items-center justify-between">
              <AvaHireLogo />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Portal Ready</span>
              </span>
            </div>

            <h1 className="mt-10 text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Welcome Back!<br />Let's Continue<br />
              <span className="gradient-text">Building Great Teams</span>
            </h1>
            <p className="mt-4 text-slate-600 max-w-md">
              Secure HR Portal login for talent acquisition leads, recruiters, and hiring managers powered by AI and automated workflows.
            </p>

            <div className="mt-10 space-y-5">
              {[
                { icon: "fa-shield-halved", bg: "bg-emerald-100 text-emerald-700", t: "Secure Authentication", d: "Protected credentials with role-based access verification." },
                { icon: "fa-users-gear", bg: "bg-violet-100 text-violet-600", t: "AI-Powered Hiring", d: "Smart resume screening and live AI proctored interview pipelines." },
                { icon: "fa-chart-column", bg: "bg-blue-100 text-blue-600", t: "Instant Analytics", d: "Deep insights into candidate evaluation metrics and hiring velocity." },
              ].map((b) => (
                <div key={b.t} className="flex gap-4">
                  <div className={`w-11 h-11 rounded-full ${b.bg} flex items-center justify-center shrink-0`}>
                    <i className={`fa-solid ${b.icon}`}></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{b.t}</div>
                    <div className="text-xs text-slate-500">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom candidate portal redirect link */}
          <div className="mt-10 pt-6 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
            <span>Taking an interview as a candidate?</span>
            <Link
              to="/i/DEMO-2026/login"
              className="font-semibold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1"
            >
              Candidate Room <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Right form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-violet-500/5 border border-slate-100 p-8 lg:p-12 flex flex-col justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-100/70 text-violet-600 flex items-center justify-center shadow-inner">
              <Lock size={30} className="text-violet-600" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              HR Portal Authentication
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-900">Sign in to your account</h2>
            <p className="text-slate-500 text-sm mt-1">Access your recruitment console and candidate assessments</p>
          </div>

          {/* Quick Demo Fill Accordion / Pills */}
          <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Quick Demo Credentials
              </span>
              <span className="text-[11px] text-slate-400 font-medium">1-Click Fill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  type="button"
                  key={acc.email}
                  onClick={() => handleQuickFill(acc)}
                  className={`text-left p-2.5 rounded-xl border transition flex items-center justify-between group ${
                    form.email === acc.email
                      ? "bg-violet-50/80 border-violet-300 text-violet-900 shadow-2xs"
                      : "bg-white border-slate-200/80 text-slate-700 hover:border-violet-200 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold truncate group-hover:text-violet-700 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-violet-600 shrink-0" />
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700 shrink-0">
                    Use
                  </span>
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Sign in failed: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form
            onSubmit={submit}
            data-testid="login-form"
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  data-testid="login-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="hr@company.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  data-testid="login-password"
                  type={show ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  data-testid="login-remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>Remember this workstation</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Cloud SQL PG</span>
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition shadow-md shadow-violet-500/25 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign in to HR Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-4 text-center text-xs text-slate-600 border-t border-slate-100">
              Don't have an HR account yet?{" "}
              <Link to="/register" className="text-violet-600 font-bold hover:underline">
                Create an HR Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

