import React, { useState, useMemo } from "react";
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
    ExternalLink
} from "lucide-react";

const initialInterviews = [
    {
        id: "iv-1",
        name: "Rahul Sharma",
        email: "rahul.sharma@email.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
        role: "Frontend Developer",
        date: "24 May 2024",
        time: "11:00 AM",
        linkCode: "akc123",
        status: "Active",
        expiry: "04:56 Remaining",
        expiryTime: "24 May 2024, 11:56 AM",
        isExpired: false
    },
    {
        id: "iv-2",
        name: "Anjali Mehta",
        email: "anjali.mehta@email.com",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
        role: "Backend Developer",
        date: "24 May 2024",
        time: "02:00 PM",
        linkCode: "def456",
        status: "Active",
        expiry: "04:55 Remaining",
        expiryTime: "24 May 2024, 02:55 PM",
        isExpired: false
    },
    {
        id: "iv-3",
        name: "Vikram Singh",
        email: "vikram.singh@email.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        role: "Full Stack Developer",
        date: "25 May 2024",
        time: "10:00 AM",
        linkCode: "ghi789",
        status: "Scheduled",
        expiry: "Not started",
        expiryTime: "25 May 2024, 11:00 AM",
        isExpired: false
    },
    {
        id: "iv-4",
        name: "Neha Patel",
        email: "neha.patel@email.com",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
        role: "Frontend Developer",
        date: "25 May 2024",
        time: "01:00 PM",
        linkCode: "jkl012",
        status: "Scheduled",
        expiry: "Not started",
        expiryTime: "25 May 2024, 02:00 PM",
        isExpired: false
    },
    {
        id: "iv-5",
        name: "Amit Kumar",
        email: "amit.kumar@email.com",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
        role: "Backend Developer",
        date: "24 May 2024",
        time: "03:30 PM",
        linkCode: "mno345",
        status: "Completed",
        expiry: "Completed",
        expiryTime: "24 May 2024, 04:00 PM",
        isExpired: false
    },
    {
        id: "iv-6",
        name: "Sneha Reddy",
        email: "sneha.reddy@email.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        role: "UI/UX Designer",
        date: "24 May 2024",
        time: "04:00 PM",
        linkCode: "pqr678",
        status: "Expired",
        expiry: "24 May 2024, 04:05 PM",
        expiryTime: "24 May 2024, 04:05 PM",
        isExpired: true
    },
    {
        id: "iv-7",
        name: "Karan Joshi",
        email: "karan.joshi@email.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
        role: "DevOps Engineer",
        date: "23 May 2024",
        time: "11:30 AM",
        linkCode: "stu901",
        status: "Expired",
        expiry: "23 May 2024, 11:35 AM",
        expiryTime: "23 May 2024, 11:35 AM",
        isExpired: true
    }
];

const Interviews = () => {
    const [interviews, setInterviews] = useState(initialInterviews);
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [copiedId, setCopiedId] = useState(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [selectedInterviewForView, setSelectedInterviewForView] = useState(null);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Form state for generating interview link
    const [newCandidateName, setNewCandidateName] = useState("");
    const [newCandidateEmail, setNewCandidateEmail] = useState("");
    const [newRole, setNewRole] = useState("Frontend Developer");
    const [newDate, setNewDate] = useState("2025-06-01");
    const [newTime, setNewTime] = useState("10:00");
    const [newValidity, setNewValidity] = useState("24 Hours");

    const filteredInterviews = useMemo(() => {
        return interviews.filter((iv) => {
            if (statusFilter === "All Status") return true;
            return iv.status.toLowerCase() === statusFilter.toLowerCase();
        });
    }, [interviews, statusFilter]);

    const copyInterviewLink = (linkCode, id) => {
        const fullUrl = `https://avahire.com/i/${linkCode}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedId(id);
        toast.success(`Copied: ${fullUrl}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRegenerateLink = (id, name) => {
        const newCode = "gen" + Math.floor(100 + Math.random() * 900);
        setInterviews((prev) =>
            prev.map((iv) =>
                iv.id === id
                    ? {
                        ...iv,
                        linkCode: newCode,
                        status: "Active",
                        expiry: "05:00 Remaining",
                        isExpired: false
                    }
                    : iv
            )
        );
        toast.success(`New interview link generated for ${name}!`);
    };

    const handleCreateInterviewLink = (e) => {
        e.preventDefault();
        if (!newCandidateName || !newCandidateEmail) {
            toast.error("Please provide candidate name and email.");
            return;
        }

        const randomCode = "ava" + Math.floor(100 + Math.random() * 900);
        const newEntry = {
            id: `iv-${Date.now()}`,
            name: newCandidateName,
            email: newCandidateEmail,
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
            role: newRole,
            date: new Date(newDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
            }),
            time: newTime,
            linkCode: randomCode,
            status: "Scheduled",
            expiry: "Not started",
            expiryTime: `${newDate} ${newTime}`,
            isExpired: false
        };

        setInterviews([newEntry, ...interviews]);
        setIsGenerateModalOpen(false);
        setNewCandidateName("");
        setNewCandidateEmail("");
        toast.success(`Interview link created: avahire.com/i/${randomCode}`);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3.5">
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

            {/* Main Table Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-bold text-slate-700 tracking-wider">
                                <th className="py-4 px-6">Candidate</th>
                                <th className="py-4 px-6">Job Role</th>
                                <th className="py-4 px-6">Date &amp; Time</th>
                                <th className="py-4 px-6">Link</th>
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
                                                        src={iv.avatar}
                                                        alt={iv.name}
                                                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                                    />
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-slate-900 text-sm">
                                                            {iv.name}
                                                        </div>
                                                        <div className="text-slate-400 text-xs">
                                                            {iv.email}
                                                        </div>
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
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{iv.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{iv.time}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 4: Link */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 font-semibold text-violet-600">
                                                    <span className="font-mono text-xs hover:underline cursor-pointer">
                                                        avahire.com/i/{iv.linkCode}
                                                    </span>
                                                    <button
                                                        onClick={() => copyInterviewLink(iv.linkCode, iv.id)}
                                                        className="p-1 text-slate-400 hover:text-violet-600 rounded transition"
                                                        title="Copy interview link"
                                                    >
                                                        {isCopied ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
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
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* View button */}
                                                    <button
                                                        onClick={() => setSelectedInterviewForView(iv)}
                                                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* Share / Resend / Report action */}
                                                    {iv.status === "Completed" ? (
                                                        <button
                                                            onClick={() => toast.info(`Viewing assessment scorecard for ${iv.name}`)}
                                                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
                                                            title="View Scorecard"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    ) : iv.status === "Expired" ? (
                                                        <button
                                                            onClick={() => handleRegenerateLink(iv.id, iv.name)}
                                                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-violet-600 transition"
                                                            title="Regenerate Interview Link"
                                                        >
                                                            <RotateCw className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => copyInterviewLink(iv.linkCode, iv.id)}
                                                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-violet-600 transition"
                                                            title="Share Link"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* More Menu */}
                                                    <button
                                                        onClick={() => toast.info(`Options for ${iv.name}`)}
                                                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
                                                        title="More options"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
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
                        Showing 1 to {filteredInterviews.length} of 24 entries
                    </div>

                    <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                        <button className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600 transition">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center shadow-xs">
                            1
                        </button>
                        <button className="w-8 h-8 rounded-xl hover:bg-white text-slate-600 flex items-center justify-center transition">
                            2
                        </button>
                        <button className="w-8 h-8 rounded-xl hover:bg-white text-slate-600 flex items-center justify-center transition">
                            3
                        </button>
                        <button className="w-8 h-8 rounded-xl hover:bg-white text-slate-600 flex items-center justify-center transition">
                            4
                        </button>
                        <button className="w-8 h-8 rounded-xl hover:bg-white text-slate-600 flex items-center justify-center transition">
                            5
                        </button>
                        <span className="px-1 text-slate-400">...</span>
                        <button className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600 transition">
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

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Candidate Email Address</label>
                                <input
                                    type="email"
                                    placeholder="e.g. ananya.rao@example.com"
                                    value={newCandidateEmail}
                                    onChange={(e) => setNewCandidateEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                />
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

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => {
                                    copyInterviewLink(selectedInterviewForView.linkCode, selectedInterviewForView.id);
                                }}
                                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                            >
                                Copy Interview Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interviews;
