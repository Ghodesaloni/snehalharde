import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
    Calendar,
    Clock,
    Copy,
    Check,
    Eye,
    Share2,
    RotateCw,
    FileText,
    MoreVertical,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Sparkles,
    ShieldCheck,
    ExternalLink,
    Mail,
    Users,
    Briefcase,
    Phone,
    UserCheck,
    Lock
} from "lucide-react";
import { getStoredInterviews, saveInterviews, addOrUpdateInterview } from "@/utils/interviewStore";
import { interviewsApi, candidatePortalApi } from "@/services/api";

const Interviews = () => {
    const [interviews, setInterviews] = useState(getStoredInterviews);
    const [resumesList, setResumesList] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [copiedId, setCopiedId] = useState(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [selectedInterviewForView, setSelectedInterviewForView] = useState(null);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Form state for generating interview link
    const [newCandidateName, setNewCandidateName] = useState("");
    const [newCandidateEmail, setNewCandidateEmail] = useState("");
    const [newCandidatePhone, setNewCandidatePhone] = useState("");
    const [selectedResumeId, setSelectedResumeId] = useState("");
    const [newRole, setNewRole] = useState("Software Engineer");
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [newValidity, setNewValidity] = useState("45 Minutes");

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const data = await interviewsApi.getAll();
                if (data) {
                    setInterviews(data);
                    saveInterviews(data);
                }
            } catch (err) {
                console.error("Failed to load interviews from backend:", err);
                setInterviews(getStoredInterviews());
            }

            try {
                const rList = await candidatePortalApi.getResumes();
                if (Array.isArray(rList)) {
                    setResumesList(rList);
                }
            } catch (err) {
                console.warn("Failed to load resumes in interviews page:", err);
            }
        };
        fetchInterviews();
    }, []);

    const filteredInterviews = useMemo(() => {
        return interviews.filter((iv) => {
            if (statusFilter === "All Status") return true;
            return iv.status?.toLowerCase() === statusFilter.toLowerCase();
        });
    }, [interviews, statusFilter]);

    const getCandidatePortalUrl = (linkCode) => {
        return `${window.location.origin}/i/${linkCode}`;
    };

    const copyInterviewLink = (linkCode, id) => {
        const fullUrl = getCandidatePortalUrl(linkCode);
        navigator.clipboard.writeText(fullUrl);
        setCopiedId(id);
        toast.success(`Copied Candidate Portal Link: ${fullUrl}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleOpenCandidatePortal = (linkCode) => {
        try {
            const win = window.open(`/i/${linkCode}`, "_blank");
            if (!win) {
                window.location.href = `/i/${linkCode}`;
            }
        } catch (e) {
            window.location.href = `/i/${linkCode}`;
        }
    };

    const handleRegenerateLink = (id, name) => {
        const newCode = "gen" + Math.floor(100 + Math.random() * 900);
        const updated = interviews.map((iv) =>
            iv.id === id
                ? {
                    ...iv,
                    linkCode: newCode,
                    status: "Active",
                    expiry: "05:00 Remaining",
                    isExpired: false
                }
                : iv
        );
        setInterviews(updated);
        saveInterviews(updated);
        toast.success(`New interview link generated for ${name}! (Code: ${newCode})`);
    };

    const handleCreateInterviewLink = (e) => {
        e.preventDefault();
        if (!newCandidateName || !newCandidateEmail) {
            toast.error("Please provide candidate name and email.");
            return;
        }

        const randomCode = "ava" + Math.floor(100 + Math.random() * 900);
        const dateObj = new Date(newDate);
        const formattedDate = !isNaN(dateObj)
            ? dateObj.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            })
            : "02 September 2026";

        const dayName = !isNaN(dateObj)
            ? dateObj.toLocaleDateString("en-US", { weekday: "long" })
            : "Tuesday";

        const candidateId = selectedResumeId || `cand-${Date.now()}`;
        const newEntry = {
            id: `iv-${Date.now()}`,
            candidateId,
            resumeId: selectedResumeId || candidateId,
            name: newCandidateName,
            email: newCandidateEmail,
            phone: newCandidatePhone || "",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
            role: newRole,
            company: "AvaHire Technologies Pvt. Ltd.",
            date: formattedDate,
            dayOfWeek: dayName,
            time: newTime ? (newTime.includes(":") ? (newTime.includes("M") ? newTime : `${newTime} AM`) : `${newTime}:00 AM`) : "11:00 AM",
            timeZone: "IST",
            duration: newValidity || "45 Minutes",
            linkCode: randomCode,
            status: "Scheduled",
            expiry: "Not started",
            expiryTime: `${formattedDate}, ${newTime}`,
            isExpired: false
        };

        const updated = addOrUpdateInterview(newEntry);
        setInterviews((prev) => [updated, ...prev.filter(x => x.id !== updated.id)]);
        
        interviewsApi.create(newEntry).then((created) => {
            if (created) {
                setInterviews((prev) => [created, ...prev.filter(x => x.id !== created.id)]);
            }
        }).catch((err) => console.warn("Interviews create API fallback:", err));

        setIsGenerateModalOpen(false);
        setNewCandidateName("");
        setNewCandidateEmail("");
        setNewCandidatePhone("");
        setSelectedResumeId("");
        toast.success(`Candidate interview scheduled! Linked to Candidate Portal (${randomCode})`);
    };

    const getStatusPill = (status) => {
        switch (status) {
            case "Active":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                    </span>
                );
            case "Scheduled":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Scheduled
                    </span>
                );
            case "Completed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Completed
                    </span>
                );
            case "Expired":
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Expired
                    </span>
                );
        }
    };

    return (
        <div className="space-y-5 max-w-7xl mx-auto -mt-2" data-testid="interviews-page">
            {/* Top Bar / Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        AI Video Interviews ({filteredInterviews.length})
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filter Dropdown */}
                    <div className="relative">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs cursor-pointer">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-transparent pr-6 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Scheduled</option>
                                <option>Completed</option>
                                <option>Expired</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
                        </div>
                    </div>

                    {/* Generate Interview Link Button */}
                    <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-violet-500/25 transition active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Generate Interview Link</span>
                    </button>
                </div>
            </div>

            {/* HR Cross-Navigation Quick Hub */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Navigate HR:</span>
                    <Link to="/app/jobs" className="px-3 py-1.5 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-xl font-semibold border border-slate-200/80 transition flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>Jobs</span>
                    </Link>
                    <Link to="/app/resumes" className="px-3 py-1.5 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-xl font-semibold border border-slate-200/80 transition flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Resumes</span>
                    </Link>
                    <Link to="/app/candidates" className="px-3 py-1.5 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-xl font-semibold border border-slate-200/80 transition flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Candidates</span>
                    </Link>
                    <Link to="/app/email" className="px-3 py-1.5 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-xl font-semibold border border-slate-200/80 transition flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email Center</span>
                    </Link>
                    <Link to="/app/calendar" className="px-3 py-1.5 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-xl font-semibold border border-slate-200/80 transition flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Calendar</span>
                    </Link>
                </div>
            </div>

            {/* Candidate Portal & Resume Integration Hub Banner */}
            <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 border border-violet-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-indigo-950 shadow-xs">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">Candidate Portal Connected to All Resumes</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {resumesList.length} Resumes Connected
                            </span>
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                            Candidate Portal strictly enforces resume email and mobile verification. Candidates can only enter at their designated schedule slot.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to="/candidate-portal"
                        target="_blank"
                        className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-violet-500/20"
                    >
                        <span>Open Candidate Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-bold text-slate-700 tracking-wider">
                                <th className="py-4 px-6">Candidate (Resume Verified)</th>
                                <th className="py-4 px-6">Job Role</th>
                                <th className="py-4 px-6">Date &amp; Time</th>
                                <th className="py-4 px-6">Candidate Portal</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Expiry</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                            {filteredInterviews.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">
                                        No interview sessions found for this status.
                                    </td>
                                </tr>
                            ) : (
                                filteredInterviews.map((iv) => {
                                    const isCopied = copiedId === iv.id;

                                    return (
                                        <tr
                                            key={iv.id}
                                            className="hover:bg-slate-50/60 transition-colors group"
                                        >
                                            {/* Column 1: Candidate */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={iv.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                                                        alt={iv.name}
                                                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                                    />
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                                            <span>{iv.name}</span>
                                                        </div>
                                                        <div className="text-slate-500 text-xs">
                                                            {iv.email}
                                                        </div>
                                                        {iv.phone && (
                                                            <div className="text-[11px] font-mono text-violet-700 flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-violet-500 shrink-0" />
                                                                <span>{iv.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Job Role */}
                                            <td className="py-4 px-6 text-slate-700 font-semibold">
                                                {iv.role}
                                            </td>

                                            {/* Column 3: Date & Time */}
                                            <td className="py-4 px-6 text-slate-600">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                                        <Calendar className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                                        <span>{iv.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{iv.time}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 4: Candidate Portal Link */}
                                            <td className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 font-semibold text-violet-600">
                                                        <a
                                                            href={`/candidate-portal?code=${iv.linkCode}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-mono text-xs hover:underline flex items-center gap-1 text-violet-600 hover:text-violet-800 bg-violet-50/80 px-2 py-0.5 rounded-md border border-violet-200"
                                                            title="Open Candidate Portal Login"
                                                        >
                                                            <span>{iv.linkCode}</span>
                                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                                        </a>
                                                        <button
                                                            onClick={() => copyInterviewLink(iv.linkCode, iv.id)}
                                                            className="p-1 text-slate-400 hover:text-violet-600 rounded transition cursor-pointer"
                                                            title="Copy candidate portal URL"
                                                        >
                                                            {isCopied ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 block">Candidate Entry Room</span>
                                                </div>
                                            </td>

                                            {/* Column 5: Status */}
                                            <td className="py-4 px-6">
                                                {getStatusPill(iv.status)}
                                            </td>

                                            {/* Column 6: Expiry */}
                                            <td className="py-4 px-6">
                                                {iv.status === "Active" && (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                                                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <div>
                                                            <span className="font-mono">{iv.expiry.split(" ")[0]}</span>{" "}
                                                            <span className="text-[11px] block sm:inline">Remaining</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {iv.status === "Scheduled" && (
                                                    <div className="text-slate-400">
                                                        - Not started
                                                    </div>
                                                )}

                                                {iv.status === "Completed" && (
                                                    <div className="text-slate-400">
                                                        - Completed
                                                    </div>
                                                )}

                                                {iv.status === "Expired" && (
                                                    <div className="space-y-0.5 text-rose-500">
                                                        <div className="flex items-center gap-1.5 font-bold">
                                                            <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                            <span>Expired</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            {iv.expiry}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                             {/* Column 7: Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Email Candidate Link */}
                                                    <Link
                                                        to={`/app/email?candidateEmail=${encodeURIComponent(iv.email)}&interviewCode=${iv.linkCode}`}
                                                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center text-slate-500 transition"
                                                        title="Send Email Invitation to Candidate"
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </Link>

                                                    {/* View in Candidates Pipeline */}
                                                    <Link
                                                        to={`/app/candidates?search=${encodeURIComponent(iv.name)}`}
                                                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 flex items-center justify-center text-slate-500 transition"
                                                        title="View in Candidate Pipeline"
                                                    >
                                                        <Users className="w-3.5 h-3.5" />
                                                    </Link>

                                                    {/* View Details button */}
                                                    <button
                                                        onClick={() => setSelectedInterviewForView(iv)}
                                                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Share / Resend / Report action */}
                                                    {iv.status === "Completed" ? (
                                                        <button
                                                            onClick={() => toast.info(`Viewing assessment scorecard for ${iv.name}`)}
                                                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                                            title="View Scorecard"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : iv.status === "Expired" ? (
                                                        <button
                                                            onClick={() => handleRegenerateLink(iv.id, iv.name)}
                                                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-violet-600 transition cursor-pointer"
                                                            title="Regenerate Interview Link"
                                                        >
                                                            <RotateCw className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => copyInterviewLink(iv.linkCode, iv.id)}
                                                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-violet-600 transition cursor-pointer"
                                                            title="Copy / Share Link"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                    <div>
                        {filteredInterviews.length === 0
                            ? "Showing 0 entries"
                            : `Showing 1 to ${filteredInterviews.length} of ${filteredInterviews.length} entries`}
                    </div>

                    <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                        <button disabled className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 disabled:opacity-50">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center shadow-xs">
                            1
                        </button>
                        <button disabled className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 disabled:opacity-50">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span>Show</span>
                        <div className="relative">
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer shadow-xs"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <span>per page</span>
                    </div>
                </div>
            </div>

            {/* Modal: Generate Interview Link */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Generate AI Interview Link</h3>
                                    <p className="text-xs text-slate-500">Create a personalized link for candidate assessment.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsGenerateModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInterviewLink} className="space-y-4 text-xs sm:text-sm">
                            {/* Link with Submitted Resumes */}
                            {resumesList.length > 0 && (
                                <div className="p-3 bg-violet-50/80 border border-violet-200/80 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                        <span className="flex items-center gap-1.5 font-bold text-violet-950">
                                            <FileText className="w-3.5 h-3.5 text-violet-600" />
                                            <span>Link to Candidate Resume ({resumesList.length})</span>
                                        </span>
                                        <span className="text-[10px] text-violet-700 bg-white px-2 py-0.5 rounded-full border border-violet-200 font-semibold">
                                            Auto-Fills Verified Data
                                        </span>
                                    </div>
                                    <select
                                        onChange={(e) => {
                                            const found = resumesList.find(r => r.id === e.target.value);
                                            if (found) {
                                                setNewCandidateName(found.name || "");
                                                setNewCandidateEmail(found.email || "");
                                                setNewCandidatePhone(found.phone || "");
                                                if (found.role) setNewRole(found.role);
                                                setSelectedResumeId(found.id);
                                                toast.info(`Selected ${found.name} (Phone: ${found.phone || "No phone"})`);
                                            }
                                        }}
                                        defaultValue=""
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer shadow-2xs"
                                    >
                                        <option value="" disabled>-- Select Candidate from Submitted Resumes --</option>
                                        {resumesList.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} · {r.email} ({r.phone || "No phone"}) · {r.role}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Candidate Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ananya Rao"
                                    value={newCandidateName}
                                    onChange={(e) => setNewCandidateName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Candidate Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="e.g. ananya.rao@example.com"
                                        value={newCandidateEmail}
                                        onChange={(e) => setNewCandidateEmail(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Must match resume</p>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Phone Number (as in Resume)</label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. +91-8999646955"
                                        value={newCandidatePhone}
                                        onChange={(e) => setNewCandidatePhone(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 font-mono"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Enforced at portal login</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Target Job Role</label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 cursor-pointer"
                                    >
                                        <option>Frontend Developer</option>
                                        <option>Backend Developer</option>
                                        <option>Full Stack Developer</option>
                                        <option>UI/UX Designer</option>
                                        <option>DevOps Engineer</option>
                                        <option>Python Developer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Link Validity</label>
                                    <select
                                        value={newValidity}
                                        onChange={(e) => setNewValidity(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 cursor-pointer"
                                    >
                                        <option>1 Hour</option>
                                        <option>45 Mins</option>
                                        <option>30 Mins</option>
                                        <option>15 Mins</option>
                                        <option>10 Mins</option>
                                        <option>5 Mins</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Interview Date</label>
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Interview Time</label>
                                    <input
                                        type="time"
                                        value={newTime}
                                        onChange={(e) => setNewTime(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-violet-50 rounded-2xl flex items-center gap-3 text-xs text-violet-800 font-medium">
                                <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0" />
                                <span>AI video proctoring and anti-cheat tracking will be automatically enabled.</span>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/20 transition active:scale-[0.98]"
                                >
                                    Generate &amp; Copy Link
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: View Interview Details */}
            {selectedInterviewForView && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-base">Interview Session Details</h3>
                            <button
                                onClick={() => setSelectedInterviewForView(null)}
                                className="p-1 text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl">
                            <img
                                src={selectedInterviewForView.avatar}
                                alt={selectedInterviewForView.name}
                                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{selectedInterviewForView.name}</h4>
                                <p className="text-xs text-slate-500">{selectedInterviewForView.role}</p>
                                <div className="mt-1">{getStatusPill(selectedInterviewForView.status)}</div>
                            </div>
                        </div>

                        <div className="space-y-2.5 text-xs text-slate-600">
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="font-medium text-slate-400">Date &amp; Time</span>
                                <span className="font-bold text-slate-800">{selectedInterviewForView.date} at {selectedInterviewForView.time}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="font-medium text-slate-400">Interview URL</span>
                                <span className="font-mono text-violet-600 font-bold">avahire.com/i/{selectedInterviewForView.linkCode}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="font-medium text-slate-400">Validity / Expiry</span>
                                <span className="font-semibold text-slate-800">{selectedInterviewForView.expiry}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => {
                                    copyInterviewLink(selectedInterviewForView.linkCode, selectedInterviewForView.id);
                                }}
                                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
                            >
                                Copy Link
                            </button>
                            <a
                                href={`/i/${selectedInterviewForView.linkCode}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs text-center flex items-center justify-center gap-1.5"
                            >
                                <span>Open Portal</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interviews;
