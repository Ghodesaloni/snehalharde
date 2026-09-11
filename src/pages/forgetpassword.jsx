import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AvaHireLogo from "@/components/AvaHireLogo";
import { toast } from "sonner";
import { authApi } from "@/services/api";
import { Lock, Mail, Loader2, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return toast.error("Please enter your work email");

        setLoading(true);
        try {
            const pwdToSet = newPassword.trim() || "password123";
            await authApi.resetPassword({ email: email.trim(), password: pwdToSet });
            setSent(true);
            toast.success(`Password reset successful! You can now log in.`);
        } catch (err) {
            console.error("Password reset error:", err);
            toast.error(err.response?.data?.error || "Could not reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" data-testid="forgot-page">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
                <div className="flex justify-center"><AvaHireLogo /></div>
                <h2 className="mt-8 text-2xl font-extrabold text-slate-900 text-center">Reset Password</h2>
                <p className="text-slate-500 text-center mt-1 text-sm">
                    Enter your work email and optionally a new password to reset your credentials.
                </p>
                {!sent ? (
                    <form onSubmit={submit} className="mt-8 space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" size={16} />
                            <input
                                data-testid="forgot-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your work email"
                                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" size={16} />
                            <input
                                data-testid="forgot-new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password (default: password123)"
                                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            data-testid="forgot-submit"
                            className="btn-primary w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Set New Password & Proceed"}
                        </button>
                    </form>
                ) : (
                    <div className="mt-8 bg-emerald-50 text-emerald-800 border border-emerald-200 p-5 rounded-2xl text-sm space-y-3 text-center">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <CheckCircle2 size={22} />
                        </div>
                        <p className="font-semibold">Password Reset Successfully!</p>
                        <p className="text-xs text-emerald-700">Your password for <b>{email}</b> has been updated. You can now log in.</p>
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="btn-primary w-full py-2.5 rounded-xl text-white text-xs font-semibold cursor-pointer"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
                <div className="mt-6 text-center text-sm text-slate-600">
                    <Link to="/login" className="text-violet-600 font-semibold">← Back to login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
