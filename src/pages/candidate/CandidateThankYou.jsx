import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Check,
    Sparkles,
    User,
    Briefcase,
    Building2,
    Calendar,
    Mail,
    ShieldCheck,
    Download,
    HelpCircle,
    Home,
    X,
    Lock,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewByCodeOrId } from "@/utils/interviewStore";
import { candidatePortalApi } from "@/services/api";
import AvaHireLogo from "@/components/AvaHireLogo";

const CandidateThankYou = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    const [interviewData, setInterviewData] = useState(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) return found;
        return {
            id: "iv-default",
            name: "Candidate",
            role: "Candidate Assessment",
            company: "AvaHire Recruiter",
            linkCode: code || ""
        };
    });

    const [timestamp, setTimestamp] = useState("");
    const [referenceCode, setReferenceCode] = useState("");
    const [isSessionClosed, setIsSessionClosed] = useState(false);

    useEffect(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) {
            setInterviewData(found);
        }

        // Also fetch live PostgreSQL portal session if available
        if (code) {
            candidatePortalApi.getSession(code).then((session) => {
                if (session) {
                    setInterviewData((prev) => ({
                        ...prev,
                        name: session.candidateName || prev.name,
                        role: session.role || prev.role,
                        company: session.company || prev.company,
                        score: session.overallScore || prev.score
                    }));
                }
            }).catch(() => {});
        }

        // Generate formatted completion timestamp & reference code
        const now = new Date();
        const formattedDate = now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        const formattedTime = now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
        setTimestamp(`${formattedDate}, ${formattedTime}`);

        const rawName = (found?.name || "SARAH").split(" ")[0].toUpperCase();
        const year = now.getFullYear();
        setReferenceCode(`AVAHIRE-${rawName}-${year}`);
    }, [code]);

    const handleDownloadReceipt = () => {
        toast.success("Interview receipt downloaded successfully!");
        const element = document.createElement("a");
        const file = new Blob([
            `===============================================\n` +
            `             AVAHIRE INTERVIEW RECEIPT          \n` +
            `===============================================\n\n` +
            `Confirmation Reference: ${referenceCode}\n` +
            `Candidate Name:         ${interviewData.name || "Sarah Jenkins"}\n` +
            `Position Applied:       ${interviewData.role || "Senior Full Stack Engineer"}\n` +
            `Hiring Organization:    ${interviewData.company || "TechNova Systems"}\n` +
            `Completion Timestamp:   ${timestamp}\n` +
            `Status:                 Submitted & Securely Archived\n\n` +
            `Thank you for completing your interview with AvaHire AI Recruitment System.\n`
        ], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `AvaHire_Receipt_${referenceCode}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleCloseSession = () => {
        toast.success("Interview session concluded. You may safely close this browser window.");
        try {
            window.close();
        } catch (e) {}
        setIsSessionClosed(true);
    };

    // If candidate closed the session
    if (isSessionClosed) {
        return (
            <div className="min-h-screen bg-[#F8F9FC] text-slate-800 font-sans flex flex-col justify-center items-center p-4 selection:bg-violet-500 selection:text-white">
                <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 text-center space-y-6 animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-inner">
                        <Lock className="w-8 h-8 text-violet-600 stroke-[2.2]" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Session Concluded
                        </h2>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Your responses have been encrypted and saved. You can now safely close this browser tab or window.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400 font-mono">
                        Ref: {referenceCode || "AVAHIRE-SESSION-2026"}
                    </div>

                    <button
                        onClick={() => setIsSessionClosed(false)}
                        className="text-xs font-bold text-violet-600 hover:text-violet-800 hover:underline transition"
                    >
                        ← View Confirmation Receipt Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FC] text-slate-800 font-sans flex flex-col justify-between selection:bg-violet-500 selection:text-white">
            
            {/* Top Navigation Bar */}
            <header className="w-full px-6 sm:px-12 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
                <div className="flex items-center gap-3">
                    <AvaHireLogo size="sm" variant="lightBg" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Synced to HR Portal</span>
                    </div>
                    <Link
                        to="/dashboard/interviews"
                        className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 hover:text-violet-900 border border-violet-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                        <span>Open HR Recruiter View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center items-center">
                
                {/* Main Card Container */}
                <div className="w-full bg-white rounded-3xl border border-slate-150 shadow-xl shadow-slate-200/50 p-6 sm:p-10 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    
                    {/* Top Status & Heading */}
                    <div className="flex flex-col items-center text-center space-y-3">
                        
                        {/* Purple Circular Checkmark Icon with Sparkles */}
                        <div className="relative mb-2">
                            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 shadow-inner">
                                <div className="w-11 h-11 rounded-full border-2 border-violet-600 flex items-center justify-center bg-violet-50">
                                    <Check className="w-6 h-6 text-violet-700 stroke-[3]" />
                                </div>
                            </div>
                            <span className="absolute -top-1 -right-1 text-violet-400">
                                <Sparkles className="w-4 h-4" />
                            </span>
                            <span className="absolute -bottom-1 -left-1 text-violet-300">
                                <Sparkles className="w-3.5 h-3.5" />
                            </span>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold tracking-wide">
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            <span>Session Successfully Submitted</span>
                        </div>

                        {/* Main Title */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight pt-1">
                            Thank You for Interviewing!
                        </h1>

                        <p className="text-sm sm:text-base text-slate-500 max-w-lg font-medium">
                            Your video responses and transcript have been securely uploaded to the recruitment system.
                        </p>
                    </div>

                    {/* Confirmation Reference Box */}
                    <div className="bg-[#FAFBFD] rounded-2xl border border-slate-200/80 p-5 sm:p-7 space-y-5">
                        
                        {/* Reference Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                CONFIRMATION REFERENCE
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-violet-700 font-mono tracking-wide">
                                {referenceCode || "AVAHIRE-SARAH-2026"}
                            </span>
                        </div>

                        {/* 2x2 Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 pt-1">
                            
                            {/* Candidate Name */}
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        CANDIDATE NAME
                                    </div>
                                    <div className="text-sm sm:text-base font-black text-slate-900">
                                        {interviewData.name || "Sarah Jenkins"}
                                    </div>
                                </div>
                            </div>

                            {/* Position Applied */}
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                    <Briefcase className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        POSITION APPLIED
                                    </div>
                                    <div className="text-sm sm:text-base font-black text-slate-900">
                                        {interviewData.role || "Senior Full Stack Engineer"}
                                    </div>
                                </div>
                            </div>

                            {/* Hiring Organization */}
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        HIRING ORGANIZATION
                                    </div>
                                    <div className="text-sm sm:text-base font-black text-slate-900">
                                        {interviewData.company || "TechNova Systems"}
                                    </div>
                                </div>
                            </div>

                            {/* Completion Timestamp */}
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        COMPLETION TIMESTAMP
                                    </div>
                                    <div className="text-sm sm:text-base font-black text-slate-900">
                                        {timestamp || "Sep 2, 2026, 10:40 AM"}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Next Steps & HR Review Process Box */}
                    <div className="bg-[#F6F4FE] rounded-2xl border border-violet-200/80 p-5 sm:p-6 space-y-2">
                        <div className="flex items-center gap-2.5 text-violet-900 font-black text-sm sm:text-base">
                            <Mail className="w-5 h-5 text-violet-600 shrink-0" />
                            <span>Next Steps & HR Review Process</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
                            The hiring team at <strong className="text-slate-900 font-bold">{interviewData.company || "TechNova Systems"}</strong> will review your interview responses. You will receive an update regarding your candidacy and next rounds via email within <strong className="text-violet-700 font-bold">2 to 3 business days</strong>.
                        </p>
                    </div>

                    {/* Security Footer & Download Action Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 text-xs text-slate-500 font-medium border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-2 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                            <span>Encrypted & Stored in Candidate Archive</span>
                        </div>

                        <button
                            onClick={handleDownloadReceipt}
                            className="flex items-center gap-2 font-bold text-violet-700 hover:text-violet-900 hover:underline transition cursor-pointer"
                        >
                            <Download className="w-4 h-4 text-violet-600" />
                            <span>Download Receipt</span>
                        </button>
                    </div>

                    {/* Bottom Action CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <button
                            onClick={() => toast.info("Support inquiry opened. Our HR team has been notified.")}
                            className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <HelpCircle className="w-4 h-4 text-slate-500" />
                            <span>Contact Recruiter</span>
                        </button>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Link
                                to="/dashboard/interviews"
                                className="flex-1 sm:flex-none px-5 py-3.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 rounded-2xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4 text-violet-600" />
                                <span>HR Evaluation Board</span>
                            </Link>

                            <button
                                onClick={handleCloseSession}
                                className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <X className="w-4 h-4 text-white" />
                                <span>Close Session</span>
                            </button>
                        </div>
                    </div>

                </div>

            </main>

            {/* Bottom Footer */}
            <footer className="w-full py-4 text-center text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} AvaHire AI Recruitment System. All candidate recordings are strictly confidential.
            </footer>

        </div>
    );
};

export default CandidateThankYou;
