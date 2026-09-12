import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
} from "lucide-react";
import AvaHireLogo from "@/components/AvaHireLogo";
import GoogleAccountChooserModal from "@/components/GoogleAccountChooserModal";
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
        <rect x="60" y="150" width="280" height="8" fill="#c4b5fd" />
        <rect x="90" y="130" width="60" height="22" rx="2" fill="#4c1d95" />
        <rect x="250" y="130" width="60" height="22" rx="2" fill="#4c1d95" />
        <circle cx="120" cy="90" r="18" fill="#fbcfe8" />
        <rect x="102" y="105" width="36" height="35" rx="6" fill="#7c3aed" />
        <circle cx="280" cy="90" r="18" fill="#fde68a" />
        <rect x="262" y="105" width="36" height="35" rx="6" fill="#1e40af" />
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);
  const [alreadyRegisteredError, setAlreadyRegisteredError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    company: "",
    website: "",
    designation: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (k === "email") {
      setAlreadyRegisteredError("");
    }
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  // Strict Password Rules Definition
  const passwordRules = [
    { id: "length", label: "At least 8 characters", test: (p) => (p || "").length >= 8 },
    { id: "uppercase", label: "At least 1 uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p || "") },
    { id: "lowercase", label: "At least 1 lowercase letter (a-z)", test: (p) => /[a-z]/.test(p || "") },
    { id: "number", label: "At least 1 number (0-9)", test: (p) => /[0-9]/.test(p || "") },
    { id: "special", label: "At least 1 special symbol (!@#$%^&*)", test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p || "") },
  ];

  const passChecks = passwordRules.map((rule) => ({
    ...rule,
    met: rule.test(form.password),
  }));

  const allRulesMet = passChecks.every((r) => r.met);
  const passwordsMatch = Boolean(form.password) && form.password === form.confirmPassword;
  const rulesMetCount = passChecks.filter((r) => r.met).length;

  const strengthLabel =
    rulesMetCount <= 2 ? "Weak" :
    rulesMetCount <= 4 ? "Fair" : "Strong";

  const submit = async (e) => {
    e.preventDefault();
    setAlreadyRegisteredError("");

    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Please fill in your Full Name and Work Email");
      return;
    }

    if (!form.password) {
      toast.error("Please create a password for your account");
      return;
    }

    if (!allRulesMet) {
      const firstUnmet = passChecks.find((r) => !r.met);
      toast.error(`Password requirement not met: ${firstUnmet?.label || "Must satisfy all strict rules"}`);
      return;
    }

    if (!form.confirmPassword) {
      toast.error("Please confirm your password");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match. Please verify both password fields.");
      return;
    }

    if (!form.agree) {
      toast.error("Please accept the terms & conditions");
      return;
    }

    setLoading(true);
    try {
      // Call server-side registration route with chosen password
      const response = await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        company: form.company.trim(),
        website: form.website.trim(),
        designation: form.designation.trim(),
        phone: form.phone.trim(),
      });

      // Save user info and remember registered email for seamless login
      localStorage.setItem("avahire_registered_email", form.email.trim());
      if (response?.token) {
        localStorage.setItem("avahire_token", response.token);
      }
      localStorage.setItem("avahire_user", JSON.stringify({
        name: form.fullName.trim(),
        email: form.email.trim(),
        company: form.company.trim() || "AvaHire",
        designation: form.designation.trim() || "HR Administrator",
      }));

      setRegisteredData({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        registeredPassword: form.password,
        emailDispatched: response?.emailDispatched !== false,
      });

      setRegisteredSuccess(true);
      toast.success("Successfully registered! Your HR account is active and password secured.");
    } catch (err) {
      console.error("Registration error:", err);
      const errMsg = err.response?.data?.error || err.message || "Registration failed.";
      
      if (err.response?.status === 409 || errMsg.toLowerCase().includes("already registered") || errMsg.toLowerCase().includes("already exists")) {
        setAlreadyRegisteredError("This Gmail address is already registered. Please proceed to login with your password.");
        toast.error("Account already exists! Please log in instead.");
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogleRegister = () => {
    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = async (account) => {
    setGoogleLoading(true);
    try {
      const activeEmail = account.email.trim();
      const activeName = account.name.trim() || activeEmail.split("@")[0];

      const response = await authApi.googleAuth({
        email: activeEmail,
        name: activeName,
        avatar: account.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        company: form.company.trim() || "AvaHire Partner",
        designation: form.designation.trim() || "HR Administrator",
      });

      if (response && response.success) {
        const userData = response.data || {
          name: activeName,
          email: activeEmail,
          role: "recruiter",
          company: form.company.trim() || "AvaHire Partner",
          designation: form.designation.trim() || "HR Administrator",
        };
        localStorage.setItem("avahire_user", JSON.stringify(userData));
        localStorage.setItem("avahire_token", response.token || `usr_${Date.now()}`);
        localStorage.setItem("avahire_registered_email", activeEmail);

        setShowGoogleModal(false);
        toast.success(`Successfully registered with Google as ${userData.name}!`);
        setTimeout(() => navigate("/app/dashboard"), 300);
      } else {
        throw new Error(response?.error || "Registration with Google failed");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Google registration failed";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const proceedToLogin = () => {
    const emailToUse = registeredData?.email || form.email.trim();
    navigate("/login", {
      state: {
        email: emailToUse,
        password: registeredData?.registeredPassword || form.password,
        initialPassword: registeredData?.registeredPassword || form.password,
      },
    });
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

        {registeredSuccess ? (
          <div
            data-testid="registration-success-card"
            className="bg-white rounded-3xl shadow-xl shadow-violet-500/5 border border-slate-100 p-8 lg:p-14 flex flex-col justify-between"
          >
            <div className="my-auto text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={44} />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                Account Successfully Created
              </span>

              <h2 className="text-3xl font-extrabold text-slate-900">
                Registration Successful!
              </h2>

              <p className="text-slate-600 mt-3 text-sm leading-relaxed">
                Welcome to AvaHire, <strong className="text-slate-900">{registeredData?.fullName}</strong>! Your HR account is active.
              </p>

              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Registered Email:</span>
                  <span className="font-semibold text-slate-800">{registeredData?.email}</span>
                </div>
                {registeredData?.company && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Company:</span>
                    <span className="font-semibold text-slate-800">{registeredData?.company}</span>
                  </div>
                )}
                {registeredData?.registeredPassword ? (
                  <div className="flex justify-between items-center bg-violet-50/80 p-2.5 rounded-lg border border-violet-100">
                    <span className="font-medium text-violet-900">Configured Password:</span>
                    <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-600" /> Strict Rules Met
                    </span>
                  </div>
                ) : registeredData?.initialPassword ? (
                  <div className="flex justify-between items-center bg-violet-50/80 p-2 rounded-lg border border-violet-100">
                    <span className="font-medium text-violet-900">Your Login Password:</span>
                    <span className="font-mono font-bold text-violet-700 bg-white px-2 py-0.5 rounded border border-violet-200">
                      {registeredData.initialPassword}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-500">Confirmation Email:</span>
                  <span className="inline-flex items-center text-emerald-600 font-semibold gap-1">
                    <CheckCircle2 size={13} /> Dispatched via SMTP
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  data-testid="proceed-to-login-btn"
                  onClick={proceedToLogin}
                  className="btn-primary w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 cursor-pointer text-base"
                >
                  <span>Proceed to Login</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
              AvaHire AI Talent Management &bull; Secure Authentication
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            data-testid="register-form"
            className="bg-white rounded-3xl shadow-xl shadow-violet-500/5 border border-slate-100 p-8 lg:p-12 flex flex-col justify-between"
          >
            <div>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-slate-900">Create Your HR Account</h2>
                <p className="text-slate-500 mt-1">Fill in the details below to get started</p>
              </div>

              {/* Already registered warning banner */}
              {alreadyRegisteredError && (
                <div
                  data-testid="already-registered-alert"
                  className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800"
                >
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-amber-900">Account Already Exists</div>
                    <div className="mt-0.5 text-amber-700">{alreadyRegisteredError}</div>
                    <button
                      type="button"
                      onClick={() => navigate("/login", { state: { email: form.email.trim() } })}
                      className="mt-2 text-xs font-bold text-violet-700 bg-white border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-50 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Proceed to Login</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  label="Full Name"
                  icon="fa-user"
                  placeholder="Enter full name"
                  value={form.fullName}
                  onChange={set("fullName")}
                  testId="reg-fullname"
                  required
                />
                <Field
                  label="Work Email (Gmail Address)"
                  icon="fa-envelope"
                  placeholder="e.g. yourname@gmail.com"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  testId="reg-email"
                  required
                />
                <Field
                  label="Company Name"
                  icon="fa-building"
                  placeholder="Enter company name"
                  value={form.company}
                  onChange={set("company")}
                  testId="reg-company"
                />
                <Field
                  label="Company Website (Optional)"
                  icon="fa-globe"
                  placeholder="Enter website"
                  value={form.website}
                  onChange={set("website")}
                  testId="reg-website"
                />
                <Field
                  label="Designation"
                  icon="fa-briefcase"
                  placeholder="Enter your designation"
                  value={form.designation}
                  onChange={set("designation")}
                  testId="reg-designation"
                />
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

              {/* Strict Password Block */}
              <div className="mt-6 pt-5 border-t border-slate-200" id="reg-password-section">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                      <Lock size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Account Password</h3>
                      <p className="text-xs text-slate-500">Strict enterprise rules apply</p>
                    </div>
                  </div>
                  {form.password && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50">
                      <span className="text-slate-500">Strength:</span>
                      <span
                        className={
                          rulesMetCount <= 2
                            ? "text-red-600 font-bold"
                            : rulesMetCount <= 4
                            ? "text-amber-600 font-bold"
                            : "text-emerald-600 font-bold"
                        }
                      >
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Create Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Create Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        data-testid="reg-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={set("password")}
                        placeholder="Create a strong password"
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
                        required
                      />
                      <button
                        type="button"
                        data-testid="toggle-reg-password"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Visual Strength Progress Bar */}
                  {form.password.length > 0 && (
                    <div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            rulesMetCount >= 1
                              ? rulesMetCount <= 2
                                ? "bg-red-500"
                                : rulesMetCount <= 4
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            rulesMetCount >= 2
                              ? rulesMetCount <= 2
                                ? "bg-red-500"
                                : rulesMetCount <= 4
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            rulesMetCount >= 3
                              ? rulesMetCount <= 4
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            rulesMetCount >= 4
                              ? rulesMetCount <= 4
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            rulesMetCount >= 5 ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        data-testid="reg-confirm"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        placeholder="Re-enter password to confirm"
                        className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none text-sm transition ${
                          form.confirmPassword && form.password
                            ? passwordsMatch
                              ? "border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              : "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            : "border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        }`}
                        required
                      />
                      <button
                        type="button"
                        data-testid="toggle-reg-confirm"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {form.confirmPassword && (
                      <div className="mt-1 text-xs flex items-center gap-1 font-medium">
                        {passwordsMatch ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check size={13} /> Passwords match
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertCircle size={13} /> Passwords do not match
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Strict Rules Checklist */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Strict Password Rules</span>
                      <span className={allRulesMet ? "text-emerald-600 font-bold" : "text-slate-500"}>
                        {rulesMetCount}/5 rules met
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {passChecks.map((rule) => (
                        <div
                          key={rule.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                            rule.met
                              ? "bg-emerald-50 text-emerald-800 font-medium border border-emerald-200/60"
                              : "text-slate-500 bg-white/60 border border-slate-200/50"
                          }`}
                        >
                          {rule.met ? (
                            <Check size={13} className="text-emerald-600 shrink-0 font-bold" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[9px] text-slate-400">
                              •
                            </div>
                          )}
                          <span className="truncate">{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={set("agree")}
                  data-testid="reg-agree"
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                I agree to the <span className="text-violet-600 font-semibold cursor-pointer">Terms & Conditions</span> and <span className="text-violet-600 font-semibold cursor-pointer">Privacy Policy</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                data-testid="reg-submit"
                className="btn-primary mt-6 w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                <span>{loading ? "Registering & Storing Data..." : "Register"}</span>
              </button>

              <div className="my-5 flex items-center gap-3 text-sm text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />or<div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                data-testid="google-register-btn"
                onClick={handleOpenGoogleRegister}
                disabled={googleLoading}
                className="w-full py-3.5 rounded-xl border border-slate-200 font-semibold text-slate-800 flex items-center justify-center gap-3 hover:border-violet-400 transition cursor-pointer bg-white shadow-xs"
              >
                {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                <span>Register with Google</span>
              </button>
            </div>

            <div className="mt-5 text-center text-sm text-slate-600">
              Already have an account? <Link to="/login" className="text-violet-600 font-semibold">Login</Link>
            </div>
          </form>
        )}
      </div>

      {/* Google Account Selector & Add Google Account Modal */}
      <GoogleAccountChooserModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleSelectGoogleAccount}
        mode="register"
        initialEmail={form.email}
        initialName={form.fullName}
      />
    </div>
  );
};

const Field = ({ label, icon, placeholder, value, onChange, type = "text", testId, required }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-800 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <i className={`fa-solid ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm`}></i>
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
      />
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
