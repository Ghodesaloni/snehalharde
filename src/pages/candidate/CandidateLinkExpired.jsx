import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    AlertOctagon,
    AlertCircle,
    ShieldAlert,
    RotateCcw,
    Mail,
    Calendar,
    Briefcase,
    Building2,
    User,
    Clock,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewByCodeOrId } from "@/utils/interviewStore";
import AvaHireLogo from "@/components/AvaHireLogo";

const CandidateLinkExpired = () => {
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
            date: "Scheduled Date",
            time: "Scheduled Time",
            linkCode: code || ""
        };
    });

    const [isRescheduleRequested, setIsRescheduleRequested] = useState(false);

    useEffect(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) {
            setInterviewData(found);
        }
    }, [code]);

    const handleRequestReschedule = () => {
        setIsRescheduleRequested(true);
        toast.success("Reschedule request submitted! The HR coordinator will email you a new link shortly.");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] via-[#f1f3fd] to-[#ede9fe] text-slate-900 font-sans flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
            
            {/* Ambient Background Decorative Glows */}
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-200/25 rounded-full blur-3xl pointer-events-none" />

            {/* Main Center Card Container */}
            <div className="w-full max-w-2xl bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(244,63,94,0.08)] p-6 sm:p-10 relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-300">
                
                {/* Top Left: AvaHire Logo */}
                <div className="flex items-center justify-between mb-6">
                    <AvaHireLogo size="sm" variant="lightBg" />
                </div>

                {/* Warning Icon & Access Denied Badge */}
                <div className="flex flex-col items-center text-center space-y-3 pt-2">
                    
                    {/* Glowing Octagon Alert Icon */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 shadow-inner">
                            <div className="w-14 h-14 rounded-full bg-rose-100/80 flex items-center justify-center">
                                <AlertOctagon className="w-8 h-8 text-rose-600 stroke-[2.5]" />
                            </div>
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold tracking-wide">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 stroke-[2.2]" />
                        <span>Access Denied / Link Expired</span>
                    </div>

                    {/* Headings */}
                    <div className="space-y-1 pt-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Interview Link Is No Longer Active
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                            You cannot access this interview session at this time.
                        </p>
                    </div>

                </div>

                {/* Reason for Access Denial Box */}
                <div className="mt-7 bg-rose-50/60 rounded-2xl border border-rose-200/80 p-5 text-left space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                        <span>Reason for Access Denial</span>
                    </div>
                    <p className="text-xs sm:text-sm text-rose-900/80 leading-relaxed pl-6 font-medium">
                        The 5-minute pre-interview window has passed or this unique link has expired.
                    </p>
                </div>

                {/* Scheduled Interview Details Card */}
                <div className="mt-5 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 text-left space-y-4 shadow-2xs">
                    <div className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">
                        SCHEDULED INTERVIEW DETAILS:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        
                        {/* Candidate */}
                        <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                CANDIDATE
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {interviewData.name || "Sarah Jenkins"}
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                ROLE
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {interviewData.role || "Senior Full Stack Engineer"}
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                ORGANIZATION
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {interviewData.company || "TechNova Systems"}
                            </div>
                        </div>

                        {/* Original Slot */}
                        <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                ORIGINAL SLOT
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {interviewData.date && interviewData.time ? `${interviewData.date}, ${interviewData.time}` : "Today, 10:00 AM PST"}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Emergency / Reschedule Helper Notice */}
                <p className="mt-6 text-xs text-slate-500 font-medium text-center max-w-lg mx-auto leading-relaxed">
                    If you experienced an unexpected emergency or technical delay, please request a reschedule link from the HR coordinator below.
                </p>

                {/* Bottom Action Buttons */}
                <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                    
                    <button
                        onClick={() => navigate(`/i/${interviewData.linkCode || code || "akc123"}`)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-2xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>Return to Portal Home</span>
                    </button>

                    <button
                        onClick={handleRequestReschedule}
                        disabled={isRescheduleRequested}
                        className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                            isRescheduleRequested
                                ? "bg-emerald-600 text-white shadow-emerald-500/25"
                                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/25"
                        }`}
                    >
                        <Mail className="w-4 h-4 text-white" />
                        <span>{isRescheduleRequested ? "Reschedule Requested ✓" : "Contact HR / Request Reschedule"}</span>
                    </button>

                </div>

            </div>

            {/* Bottom Copyright */}
            <footer className="mt-6 text-xs text-slate-400 font-medium text-center">
                © {new Date().getFullYear()} AvaHire AI Recruitment System. All rights reserved.
            </footer>

        </div>
    );
};

export default CandidateLinkExpired;
