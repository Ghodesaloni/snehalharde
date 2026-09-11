import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, CheckCircle2, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import AvaHireLogo from "@/components/AvaHireLogo";
import { toast } from "sonner";
import { authApi } from "@/services/api";

const AuthIllustration = ({ title, subtitle, bullets }) => (
  <div className="relative h-full flex flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-violet-50 via-white to-violet-50 rounded-3xl">
    <div>
      <AvaHireLogo />
      <h1 className="mt-10 text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
        {title}
        <br />
        <span className="gradient-text">{subtitle}</span>
      </h1>
      <p className="mt-4 text-slate-600 max-w-md">
        Create your HR account and start your journey towards smarter, faster, and data-driven recruitment.
      </p>

      <div className="mt-10 space-y-5">
        {bullets.map((b) => (
          <div key={b.title} className="flex gap-4">
            <div className={`w-11 h-11 rounded-full ${b.bg} flex items-center justify-center text-lg`}>
              <i className={`fa-solid ${b.icon}`}></i>
            </div>
            <div>
              <div className="font-semibold text-slate-900">{b.title}</div>
              <div className="text-sm text-slate-500">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* illustration */}
    <div className="hidden lg:block relative mt-6">
      <svg viewBox="0 0 400 200" className="w-full">
        <ellipse cx="200" cy="180" rx="180" ry="14" fill="#ede9fe" />
        {/* desk */}
        <rect x="60" y="150" width="280" height="8" fill="#c4b5fd" />
        {/* laptops */}
        <rect x="90" y="130" width="60" height="22" rx="2" fill="#4c1d95" />
        <rect x="250" y="130" width="60" height="22" rx="2" fill="#4c1d95" />
        {/* people */}
        <circle cx="120" cy="90" r="18" fill="#fbcfe8" />
        <rect x="102" y="105" width="36" height="35" rx="6" fill="#7c3aed" />
        <circle cx="280" cy="90" r="18" fill="#fde68a" />
        <rect x="262" y="105" width="36" height="35" rx="6" fill="#1e40af" />
        {/* resume card */}
        <rect x="170" y="70" width="60" height="80" rx="6" fill="#fff" stroke="#c4b5fd" strokeWidth="2" />
        <circle cx="200" cy="90" r="8" fill="#c4b5fd" />
        <rect x="180" y="105" width="40" height="3" fill="#e9d5ff" />
        <rect x="180" y="112" width="30" height="3" fill="#e9d5ff" />
        <rect x="180" y="119" width="35" height="3" fill="#e9d5ff" />
        <text x="200" y="140" textAnchor="middle" fontSize="9" fill="#f59e0b">★★★★★</text>
      </svg>
    </div>
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationSentData, setVerificationSentData] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    company: "",
    website: "",
    designation: "",
    phone: "",
    password: "",
    confirm: "",
    agree: false,
  });

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: v });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!form.agree) {
      toast.error("Please accept the terms & conditions");
      return;
    }

    setLoading(true);
    try {
      // Call server-side registration route
      const response = await authApi.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        company: form.company,
        website: form.website,
        designation: form.designation,
        phone: form.phone,
      });

      // Save user info to local state for convenience
      localStorage.setItem("avahire_user", JSON.stringify({
        name: form.fullName,
        email: form.email,
        company: form.company,
        designation: form.designation,
      }));

      toast.success("Account registered! Verification email sent via SMTP 🎉");
      setVerificationSentData(response.data);
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err.response?.data?.error || "Registration failed. Please check your details and try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email && (!verificationSentData || !verificationSentData.email)) return;
    const targetEmail = verificationSentData?.email || form.email;
    setResending(true);
    try {
      const res = await authApi.resendVerification(targetEmail);
      toast.success("New verification email dispatched via SMTP!");
      if (res.verificationLink) {
        setVerificationSentData((prev) => ({
          ...prev,
          verificationLink: res.verificationLink,
          token: res.token,
        }));
      }
    } catch (err) {
      toast.error("Could not resend email: " + (err.response?.data?.error || err.message));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8" data-testid="register-page">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6 min-h-[calc(100vh-4rem)]">
        <AuthIllustration
          title="Join AvaHire"
          subtitle="Simplify Hiring with AI Power"
          bullets={[
            { icon: "fa-robot", bg: "bg-violet-100 text-violet-600", title: "AI-Powered Screening", desc: "Automatically screen and rank candidates" },
            { icon: "fa-chart-column", bg: "bg-blue-100 text-blue-600", title: "Smart Insights", desc: "Make data-driven hiring decisions" },
            { icon: "fa-shield-halved", bg: "bg-emerald-100 text-emerald-600", title: "Secure & Reliable", desc: "Your data is protected with enterprise-grade security" },
          ]}
        />

        {verificationSentData ? (
          <div
            data-testid="verification-sent-card"
            className="bg-white rounded-3xl shadow-xl shadow-violet-500/5 border border-slate-100 p-8 lg:p-12 flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 border border-emerald-200">
                <CheckCircle2 size={36} />
              </div>

              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 mb-3">
                  <ShieldCheck size={14} /> One-Time Token Stored in PostgreSQL
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Check Your Gmail Inbox</h2>
                <p className="text-slate-600 mt-2 text-sm max-w-md mx-auto">
                  A one-time secure verification token has been generated and sent via SMTP to:
                </p>
                <div className="mt-2 inline-block px-4 py-1.5 bg-slate-100 rounded-lg text-slate-800 font-bold text-sm">
                  {verificationSentData.email}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Security Details:</span>
                  <span className="text-emerald-600 font-medium">Valid for 24 Hours &bull; Single-Use</span>
                </div>
                <div className="text-xs text-slate-500">
                  <strong>Secure Verification Token:</strong>
                  <div className="mt-1 font-mono text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 break-all select-all">
                    {verificationSentData.token}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {verificationSentData.verificationLink && (
                  <a
                    href={verificationSentData.verificationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition"
                  >
                    <span>Click to Test Verification Link</span>
                    <ExternalLink size={16} />
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {resending ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <Mail size={16} />}
                  <span>{resending ? "Resending via SMTP..." : "Resend Verification Email via SMTP"}</span>
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setVerificationSentData(null)}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                &larr; Back to Register
              </button>
              <Link to="/login" className="text-violet-600 font-semibold hover:underline">
                Proceed to Login &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            data-testid="register-form"
            className="bg-white rounded-3xl shadow-xl shadow-violet-500/5 border border-slate-100 p-8 lg:p-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900">Create Your HR Account</h2>
              <p className="text-slate-500 mt-1">Fill in the details below to get started</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full Name" icon="fa-user" placeholder="Enter full name" value={form.fullName} onChange={set("fullName")} testId="reg-fullname" />
              <Field label="Work Email (Gmail Address)" icon="fa-envelope" placeholder="e.g. yourname@gmail.com" type="email" value={form.email} onChange={set("email")} testId="reg-email" />
              <Field label="Company Name" icon="fa-building" placeholder="Enter company name" value={form.company} onChange={set("company")} testId="reg-company" />
              <Field label="Company Website (Optional)" icon="fa-globe" placeholder="Enter website" value={form.website} onChange={set("website")} testId="reg-website" />
              <Field label="Designation" icon="fa-briefcase" placeholder="Enter your designation" value={form.designation} onChange={set("designation")} testId="reg-designation" />
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-3 border border-slate-200 rounded-xl bg-slate-50">
                    <span className="text-base">🇮🇳</span>
                    <span className="text-sm font-medium text-slate-700">+91</span>
                  </div>
                  <input
                    data-testid="reg-phone"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="Enter phone number"
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
                  />
                </div>
              </div>
            </div>

            <PasswordField label="Password" icon={<Lock size={16} />} value={form.password} onChange={set("password")} show={show} setShow={setShow} testId="reg-password" placeholder="Create a password" />
            <PasswordField label="Confirm Password" icon={<Lock size={16} />} value={form.confirm} onChange={set("confirm")} show={show2} setShow={setShow2} testId="reg-confirm" placeholder="Confirm your password" />

            <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.agree} onChange={set("agree")} data-testid="reg-agree" className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
              I agree to the <a href="#" className="text-violet-600 font-semibold">Terms & Conditions</a> and <a href="#" className="text-violet-600 font-semibold">Privacy Policy</a>
            </label>

            <button
              type="submit"
              disabled={loading}
              data-testid="reg-submit"
              className="btn-primary mt-6 w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              <span>{loading ? "Generating Secure Token & Sending Email..." : "Register"}</span>
            </button>

            <div className="my-5 flex items-center gap-3 text-sm text-slate-400">
              <div className="flex-1 h-px bg-slate-200" />or<div className="flex-1 h-px bg-slate-200" />
            </div>

            <button type="button" className="w-full py-3.5 rounded-xl border border-slate-200 font-semibold text-slate-800 flex items-center justify-center gap-3 hover:border-violet-400 transition">
              <GoogleIcon /> Register with Google
            </button>

            <div className="mt-5 text-center text-sm text-slate-600">
              Already have an account? <Link to="/login" className="text-violet-600 font-semibold">Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, icon, placeholder, value, onChange, type = "text", testId }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-800 mb-2">{label}</label>
    <div className="relative">
      <i className={`fa-solid ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm`}></i>
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
      />
    </div>
  </div>
);

const PasswordField = ({ label, value, onChange, show, setShow, placeholder, testId }) => (
  <div className="mt-5">
    <label className="block text-sm font-semibold text-slate-800 mb-2">{label}</label>
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        data-testid={testId}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
      />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

export default Register;
