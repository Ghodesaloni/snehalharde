import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Info,
    Video,
    MessageSquare,
    TrendingUp,
    ShieldCheck,
    Check,
    HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewByCodeOrId } from "@/utils/interviewStore";
import { useInterviewSettings } from "@/utils/interviewSettingsStore";
import { candidatePortalApi } from "@/services/api";
import AvaHireLogo from "@/components/AvaHireLogo";

const CandidateInstructions = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { settings } = useInterviewSettings();

    const [interviewData, setInterviewData] = useState(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) return found;
        return {
            id: "iv-default",
            name: "Candidate",
            role: "Job Assessment",
            company: "AvaHire Recruiter",
            linkCode: code || ""
        };
    });

    const [agreed, setAgreed] = useState(false);

    // Dynamic instructions & guidelines configured in HR Interview Settings
    const instructions = settings.guidelines && settings.guidelines.length > 0
        ? settings.guidelines
        : [
            "Ensure you are in a quiet place with good internet connection.",
            "Keep your face clearly visible in the camera.",
            "Do not switch tabs or open other applications.",
            "Do not take help from others during the interview.",
            "Be honest and answer confidently.",
            "Interview will be recorded for evaluation purposes."
        ];

    useEffect(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) {
            setInterviewData(found);
        }

        if (code) {
            candidatePortalApi.getSession(code).then((session) => {
                if (session) {
                    setInterviewData((prev) => ({
                        ...prev,
                        name: session.candidateName || prev.name,
                        role: session.role || prev.role,
                        company: session.company || prev.company,
                        linkCode: session.linkCode || code
                    }));
                }
            }).catch(() => {});
        }
    }, [code]);

    const handleStartInterview = () => {
        if (!agreed) {
            toast.error("Please read and agree to the instructions to begin.");
            return;
        }
        toast.success("Instructions confirmed! Entering interview waiting room...");
        navigate(`/i/${interviewData.linkCode || code || "akc123"}/waiting-room`);
    };

    return (
        <div className="min-h-screen bg-[#f8f9ff] text-slate-900 font-sans flex flex-col justify-between selection:bg-violet-500 selection:text-white">
            
            {/* Top Navigation Bar */}
            <header className="w-full bg-white border-b border-slate-200/80 px-6 sm:px-10 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                {/* AvaHire Logo */}
                <AvaHireLogo size="sm" variant="dark" />

                {/* Back to Login Button */}
                <button
                    onClick={() => navigate(`/i/${interviewData.linkCode || code || "akc123"}/login`)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Back to Login</span>
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {/* Header Title Section with Live Setting Pills */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-violet-500/25">
                                22.
                            </span>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                    Interview Instructions
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                    Please read the instructions carefully before starting your interview session.
                                </p>
                            </div>
                        </div>

                        {/* Live Settings Metadata Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-violet-50 border border-violet-200/80 text-violet-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                                <span>⏱ Duration:</span>
                                <span className="font-extrabold">{settings.duration || "30 Minutes"}</span>
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                                <span>🤖 AI:</span>
                                <span className="font-extrabold">{settings.aiAvatar || "Ava"}</span>
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                                <span>🌐 {settings.language || "English"}</span>
                            </span>
                            {settings.enableProctoring && (
                                <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Proctored ({settings.suspiciousThreshold || "3 Actions"})</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* LEFT PANEL: 3D Illustration & Checklist Cards */}
                    <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-6 lg:gap-8">
                        
                        {/* 3D Guide Illustration */}
                        <div className="w-full md:w-5/12 flex items-center justify-center relative shrink-0">
                            <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-gradient-to-tr from-violet-100 via-indigo-50 to-purple-100 flex items-center justify-center p-2 shadow-inner border border-violet-100/60 overflow-hidden group">
                                <img
                                    src="/images/ai_instruction_guide.jpg"
                                    alt="AI Interview Guide"
                                    className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        // Fallback vector graphic if image loading is delayed
                                        e.target.style.display = "none";
                                    }}
                                />
                                {/* Sparkle decoration */}
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-violet-400 animate-ping pointer-events-none" />
                                <div className="absolute bottom-6 left-4 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse pointer-events-none" />
                            </div>
                        </div>

                        {/* Instructions Checklist Stack */}
                        <div className="w-full md:w-7/12 space-y-3">
                            {instructions.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-[#f8f9ff] hover:bg-violet-50/40 hover:border-violet-100 transition flex items-center gap-3.5 shadow-2xs group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <span className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                                        {item}
                                    </span>
                                </div>
                            ))}

                            {/* Info notice item */}
                            <div className="p-3.5 sm:p-4 rounded-2xl border border-violet-100 bg-violet-50/60 flex items-center gap-3.5 shadow-2xs">
                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 border border-violet-200 flex items-center justify-center shrink-0">
                                    <Info className="w-4 h-4 stroke-[2.5]" />
                                </div>
                                <span className="text-xs sm:text-[13px] font-bold text-violet-900 leading-snug">
                                    Make sure to read and agree to all guidelines above
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT PANEL: What to Expect Card */}
                    <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
                        <div className="space-y-5">
                            <h3 className="text-base sm:text-lg font-black text-violet-700 tracking-tight">
                                What to Expect
                            </h3>

                            <div className="space-y-4">
                                {/* Item 1: AI-Powered Interview */}
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 mt-0.5 border border-violet-100/70">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                            {settings.aiAvatar || "Ava"} ({settings.difficulty || "Medium"} Level)
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                                            You will be evaluated by {settings.aiAvatar || "our AI interviewer"} in {settings.language || "English"}.
                                        </p>
                                    </div>
                                </div>

                                {/* Item 2: Smart Conversations */}
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100/70">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                            {settings.askFollowUps ? "Adaptive Conversations" : "Structured Questions"}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                                            {settings.askFollowUps
                                                ? "Answer naturally. The AI will ask smart follow-ups based on your responses."
                                                : "Answer concisely. The AI will present structured questions."}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 3: Skill Assessment */}
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100/70">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                            {settings.resumeBasedQuestions && settings.roleBasedQuestions
                                                ? "Resume & Role Evaluation"
                                                : "Technical Assessment"}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                                            Answers are evaluated in real-time for technical depth, clarity, and system design.
                                        </p>
                                    </div>
                                </div>

                                {/* Item 4: Secure & Fair */}
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100/70">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                            {settings.enableProctoring ? "Active AI Proctoring" : "Secure Session"}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                                            {settings.enableProctoring
                                                ? `Monitored for tab switches (max ${settings.suspiciousThreshold || "3 actions"}) and camera visibility.`
                                                : "Your responses and assessment data are encrypted and secure."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra subtle badge */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                            <span className="text-[11px] font-semibold text-slate-500">
                                Mode: {settings.interviewMode || "AI Interview"} • {settings.duration || "30 Minutes"}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar: Checkbox & Start Interview Button */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Agreement Checkbox */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer accent-violet-600"
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-700">
                            I have read and agree to the instructions
                        </span>
                    </label>

                    {/* Start Interview CTA */}
                    <button
                        type="button"
                        onClick={handleStartInterview}
                        disabled={!agreed}
                        className={`px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center gap-2 ${agreed
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/25 active:scale-98 cursor-pointer"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                            }`}
                    >
                        <span>Start Interview</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

            </main>
        </div>
    );
};

export default CandidateInstructions;
