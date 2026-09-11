import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, ShieldCheck, Loader2 } from "lucide-react";
import AvaHireLogo from "@/components/AvaHireLogo";
import { authApi } from "@/services/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'success', 'already_used', 'expired', 'error'
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setStatus("error");
      setMessage("No verification token found in URL. Please check your verification email.");
      return;
    }

    const verify = async () => {
      try {
        const res = await authApi.verifyEmail(token);
        // Note: if backend returned HTML directly, browser might have rendered it.
        // But if fetched via API:
        setStatus("success");
        setMessage("Your Gmail address has been securely verified in PostgreSQL.");
        if (res?.email) setUserEmail(res.email);
      } catch (err) {
        console.error("Verification error:", err);
        const errCode = err.response?.data?.error || err.message;
        if (errCode.includes("ALREADY") || errCode.includes("already")) {
          setStatus("already_used");
          setMessage("This verification token has already been consumed. Your account is verified!");
        } else if (errCode.includes("EXPIRED") || errCode.includes("expired")) {
          setStatus("expired");
          setMessage("This verification token has expired (validity is 24 hours). Please register again or request a new link.");
        } else {
          setStatus("error");
          setMessage(err.response?.data?.message || "Invalid or unrecognized verification token.");
        }
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8">
        <AvaHireLogo />
      </div>

      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl shadow-violet-500/5 border border-slate-100 p-8 text-center">
        {loading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Verifying Your Token...</h2>
            <p className="text-sm text-slate-500">Validating one-time token against PostgreSQL database...</p>
          </div>
        ) : status === "success" || status === "already_used" ? (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
              <CheckCircle2 size={36} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck size={14} /> PostgreSQL Record Verified
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Email Verified!</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
            {userEmail && (
              <div className="text-xs bg-slate-100 py-1.5 px-3 rounded-lg text-slate-700 font-mono">
                {userEmail}
              </div>
            )}
            <div className="pt-4">
              <Link
                to="/login"
                className="w-full inline-block py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/20 transition"
              >
                Proceed to Login
              </Link>
            </div>
          </div>
        ) : status === "expired" ? (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200">
              <Clock size={36} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Token Expired</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            <div className="pt-4">
              <Link
                to="/register"
                className="w-full inline-block py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition"
              >
                Register Again
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border-2 border-rose-200">
              <XCircle size={36} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Verification Failed</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            <div className="pt-4 space-y-2">
              <Link
                to="/register"
                className="w-full inline-block py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition"
              >
                Return to Registration
              </Link>
              <Link
                to="/login"
                className="w-full inline-block py-2.5 text-sm text-slate-600 hover:text-slate-800 font-semibold"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
