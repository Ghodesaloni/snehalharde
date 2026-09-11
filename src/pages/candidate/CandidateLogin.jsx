import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Mail,
    Phone,
    User,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    ShieldCheck,
    HelpCircle,
    CheckCircle2,
    Video,
    Camera,
    Mic,
    Volume2,
    ChevronRight,
    Bot
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewByCodeOrId } from "@/utils/interviewStore";
import AvaHireLogo from "@/components/AvaHireLogo";

const CandidateLogin = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    const [interviewData, setInterviewData] = useState(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) return found;
        return {
            id: "iv-default",
            name: "Candidate",
            email: "",
            phone: "",
            role: "Job Assessment",
            company: "AvaHire Recruiter",
            linkCode: code || ""
        };
    });

    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) {
            setInterviewData(found);
            setEmail(found.email || "");
            setPhone(found.phone || "");
        }
    }, [code]);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Please enter your Email ID.");
            return;
        }
        if (!phone.trim()) {
            toast.error("Please enter your Phone Number.");
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success(`Welcome ${interviewData.name || "Candidate"}! Identity verified.`);
            navigate(`/i/${interviewData.linkCode || code || "akc123"}/system-check`);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] via-[#f1f3fd] to-[#ede9fe] text-slate-900 font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-violet-500 selection:text-white p-4 sm:p-6 lg:p-10">
            {/* Background glowing effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar Header */}
            <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-4 relative z-10">
                <Link
                    to={`/i/${interviewData.linkCode || code || "akc123"}`}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-violet-600 transition bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-2xs"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Invitation</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-violet-700 border border-violet-100 shadow-2xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Interview Portal
                    </span>
                </div>
            </header>

            {/* Main Center Two-Column Login Card */}
            <main className="flex-1 flex items-center justify-center relative z-10 my-auto">
                <div className="w-full max-w-[960px] bg-white rounded-[32px] shadow-[0_25px_60px_rgba(79,70,229,0.12)] border border-slate-100/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in zoom-in-95">
                    
                    {/* LEFT COLUMN: Dark Navy/Slate Blue Branding & Illustration */}
                    <div className="lg:col-span-6 bg-[#131b2e] text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
                        {/* Background subtle light effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Top AvaHire Logo */}
                        <div className="relative z-10 mb-8">
                            <AvaHireLogo size="md" variant="darkBg" />
                        </div>

                        {/* Hero Headline & Subtitle */}
                        <div className="space-y-3 relative z-10 mb-8">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                                Your next opportunity starts with a{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300 font-black">
                                    conversation.
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-md">
                                Step into an AI-powered interview and showcase your skills, experience, and potential.
                            </p>
                        </div>

                        {/* Custom Modern SVG Illustration (Candidate + AI Interviewer Card) */}
                        <div className="relative z-10 mt-auto pt-4 flex items-end justify-center">
                            <div className="w-full max-w-[360px] relative">
                                <svg viewBox="0 0 360 220" className="w-full h-auto drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Backdrop soft lilac circle */}
                                    <circle cx="120" cy="130" r="80" fill="#1E293B" />
                                    <circle cx="120" cy="130" r="65" fill="#334155" opacity="0.4" />

                                    {/* Office Plant (Left) */}
                                    <path d="M25 155 L35 155 L32 180 L28 180 Z" fill="#64748B" />
                                    <ellipse cx="28" cy="135" rx="7" ry="16" fill="#818CF8" transform="rotate(-25 28 135)" />
                                    <ellipse cx="32" cy="125" rx="8" ry="18" fill="#6366F1" />
                                    <ellipse cx="42" cy="132" rx="7" ry="15" fill="#A5B4FC" transform="rotate(30 42 132)" />

                                    {/* Candidate Character sitting at laptop */}
                                    <ellipse cx="120" cy="85" rx="15" ry="17" fill="#FDE047" />
                                    {/* Hair */}
                                    <path d="M106 80 Q120 62 134 80 Q136 95 132 105 Q126 92 120 92 Q114 92 108 105 Z" fill="#0F172A" />
                                    {/* Face & Features */}
                                    <ellipse cx="120" cy="88" rx="12" ry="14" fill="#FFE4E6" />
                                    <ellipse cx="116" cy="86" rx="1.5" ry="1.5" fill="#0F172A" />
                                    <ellipse cx="124" cy="86" rx="1.5" ry="1.5" fill="#0F172A" />
                                    <path d="M118 94 Q120 96 122 94" stroke="#E11D48" strokeWidth="1.2" strokeLinecap="round" fill="none" />

                                    {/* Purple Sweater */}
                                    <path d="M100 115 C100 106 108 102 120 102 C132 102 140 106 140 115 L144 165 L96 165 Z" fill="#6366F1" />

                                    {/* Candidate Arms */}
                                    <path d="M102 125 L92 155 L108 162" stroke="#6366F1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    <path d="M138 125 L148 155 L132 162" stroke="#6366F1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                                    {/* Desk line */}
                                    <line x1="0" y1="170" x2="360" y2="170" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

                                    {/* Laptop */}
                                    <rect x="95" y="132" width="48" height="32" rx="3" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
                                    <circle cx="119" cy="148" r="3.5" fill="#818CF8" />
                                    <polygon points="85,168 153,168 147,164 91,164" fill="#64748B" />

                                    {/* FLOATING AI INTERVIEWER CARD (Right) */}
                                    <g transform="translate(180, 20)">
                                        {/* Card container */}
                                        <rect x="0" y="0" width="160" height="135" rx="16" fill="#1E293B" stroke="#4338CA" strokeWidth="1.5" opacity="0.95" />
                                        
                                        {/* AI Interviewer Badge */}
                                        <rect x="12" y="10" width="95" height="20" rx="10" fill="#312E81" />
                                        <path d="M18 20 L21 17 L24 20 L21 23 Z" fill="#A5B4FC" />
                                        <text x="28" y="24" fill="#E0E7FF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">AI Interviewer</text>

                                        {/* Female Avatar in Blazer */}
                                        <circle cx="65" cy="72" r="28" fill="#334155" />
                                        {/* Avatar Hair */}
                                        <path d="M42 68 C42 45 88 45 88 68 C88 95 84 98 84 98 L46 98 C46 98 42 95 42 68 Z" fill="#451A03" />
                                        <ellipse cx="65" cy="70" rx="13" ry="15" fill="#FDE68A" />
                                        <ellipse cx="60" cy="68" rx="1.5" ry="1.5" fill="#1E293B" />
                                        <ellipse cx="70" cy="68" rx="1.5" ry="1.5" fill="#1E293B" />
                                        <path d="M63 76 Q65 78 67 76" stroke="#DC2626" strokeWidth="1" fill="none" strokeLinecap="round" />

                                        {/* Blazer Suit */}
                                        <path d="M48 95 L55 85 L65 98 L75 85 L82 95 L85 110 L45 110 Z" fill="#1E3A8A" />
                                        <polygon points="60,86 70,86 65,95" fill="white" />

                                        {/* Chat bubble on AI screen */}
                                        <rect x="105" y="55" width="42" height="30" rx="10" fill="white" />
                                        <path d="M108 80 L102 87 L115 84 Z" fill="white" />
                                        <circle cx="118" cy="70" r="2.5" fill="#4F46E5" />
                                        <circle cx="126" cy="70" r="2.5" fill="#4F46E5" />
                                        <circle cx="134" cy="70" r="2.5" fill="#4F46E5" />
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Candidate Login Form */}
                    <div className="lg:col-span-6 bg-white p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                        <div className="w-full max-w-md mx-auto space-y-6">
                            
                            {/* Header Icon + Title */}
                            <div className="space-y-3 text-left">
                                <div className="w-14 h-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shadow-2xs">
                                    <User className="w-7 h-7 stroke-[1.8]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                        Candidate Login
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                                        Welcome back! Please enter your details to continue with your interview.
                                    </p>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                                {/* Email Field */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-800">
                                        Email ID
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 transition shadow-2xs"
                                        />
                                    </div>
                                </div>

                                {/* Phone Field */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-800">
                                        Phone Number (as per Resume)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="Enter your phone number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 transition shadow-2xs"
                                        />
                                    </div>
                                </div>

                                {/* Login CTA Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
                                    >
                                        {isLoading ? (
                                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Login</span>
                                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* OR Divider */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    OR
                                </span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            {/* Help & Support Footer */}
                            <div className="text-center text-xs text-slate-500">
                                Need Help?{" "}
                                <button
                                    type="button"
                                    onClick={() => toast.info("HR Support: support@avahire.com • +91 800-AVA-HIRE")}
                                    className="font-bold text-violet-600 hover:text-violet-700 hover:underline transition cursor-pointer"
                                >
                                    Contact HR
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </main>

            {/* Footer info */}
            <footer className="w-full max-w-5xl mx-auto py-3 text-center text-xs text-slate-400 relative z-10 flex flex-wrap items-center justify-between gap-2">
                <span>AvaHire AI Proctored Assessment</span>
                <span>Role: {interviewData.role || "Frontend Developer"}</span>
            </footer>
        </div>
    );
};

export default CandidateLogin;
