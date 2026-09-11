import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { candidatesApi } from "@/services/api";
import {
    Mail,
    Phone,
    Calendar,
    Clock,
    Check,
    X,
    Filter,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Search,
    SlidersHorizontal,
    Video,
    Sparkles,
    ShieldAlert,
    Download,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Star,
    Save,
    CheckCircle2,
    AlertCircle,
    Bot,
    User,
    Users,
    Database,
    Plus,
    Trash2
} from "lucide-react";

const initialCandidates = [];

const Candidates = () => {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [sortBy, setSortBy] = useState("Latest Interview");
    const [statusFilter, setStatusFilter] = useState("All");
    const [pageSize, setPageSize] = useState(5);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Expanded candidate accordion / downward drawer state
    const [expandedCandidateId, setExpandedCandidateId] = useState(null);
    const [drawerTab, setDrawerTab] = useState("transcript"); // "transcript" | "evaluation" | "scores"

    // Audio player simulated state
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState("1x");
    const [isMuted, setIsMuted] = useState(false);
    const [currentCandidateNotes, setCurrentCandidateNotes] = useState({});

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const data = await candidatesApi.getAll();
                if (Array.isArray(data)) {
                    setCandidates(data);
                }
            } catch (err) {
                console.error("Failed to load candidates from backend:", err);
            }
        };
        fetchCandidates();
    }, []);

    // Sorting and Filtering
    const filteredCandidates = useMemo(() => {
        const list = Array.isArray(candidates) ? candidates : [];
        return list
            .filter((c) => {
                if (!c) return false;
                if (statusFilter !== "All" && c.status !== statusFilter) return false;
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "Latest Interview") return b.timestamp - a.timestamp;
                if (sortBy === "Oldest Interview") return a.timestamp - b.timestamp;
                if (sortBy === "Highest Score") return b.score - a.score;
                if (sortBy === "Lowest Score") return a.score - b.score;
                return 0;
            });
    }, [candidates, sortBy, statusFilter]);

    const totalCount = candidates.length || 24;

    const toggleExpandCandidate = (id) => {
        setExpandedCandidateId((prev) => (prev === id ? null : id));
    };

    const handleSelectCandidate = async (id, name, e) => {
        e?.stopPropagation();
        setCandidates((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "Selected" } : c))
        );
        toast.success(`${name} marked as Selected!`);
        try {
            await candidatesApi.update(id, { status: "Selected" });
        } catch (err) {
            console.error("Failed to sync candidate status:", err);
        }
    };

    const handleRejectCandidate = async (id, name, e) => {
        e?.stopPropagation();
        setCandidates((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "Rejected" } : c))
        );
        toast.error(`${name} marked as Rejected.`);
        try {
            await candidatesApi.update(id, { status: "Rejected" });
        } catch (err) {
            console.error("Failed to sync candidate status:", err);
        }
    };

    const handleSaveNotes = async (candidateId, candidateName) => {
        const text = currentCandidateNotes[candidateId] || "";
        setCandidates((prev) =>
            prev.map((c) => (c.id === candidateId ? { ...c, notes: text } : c))
        );
        toast.success(`Notes saved for ${candidateName}`);
        try {
            await candidatesApi.update(candidateId, { notes: text });
        } catch (err) {
            console.error("Failed to sync candidate notes:", err);
        }
    };

    const handleDownloadTranscript = (candidate, e) => {
        e?.stopPropagation();
        const content = candidate.transcript
            .map((t) => `[${t.time}] ${t.speaker}:\n${t.text}\n`)
            .join("\n");
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${candidate.name.replace(/\s+/g, "_")}_Transcript.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Transcript downloaded!");
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [isSavingCandidate, setIsSavingCandidate] = useState(false);
    const [newCandidateForm, setNewCandidateForm] = useState({
        name: "",
        email: "",
        phone: "+91 98000 00000",
        role: "Frontend Developer",
        score: 80,
        status: "Under Review",
        notes: ""
    });

    const handleCreateCandidate = async (e) => {
        e.preventDefault();
        if (!newCandidateForm.name.trim() || !newCandidateForm.email.trim()) {
            toast.error("Candidate name and email are required");
            return;
        }
        setIsSavingCandidate(true);
        try {
            const scoreNum = Number(newCandidateForm.score) || 75;
            const newCandData = {
                name: newCandidateForm.name.trim(),
                email: newCandidateForm.email.trim(),
                phone: newCandidateForm.phone.trim(),
                role: newCandidateForm.role,
                score: scoreNum,
                status: newCandidateForm.status,
                notes: newCandidateForm.notes.trim(),
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                duration: "18m 30s",
                mode: "AI Interview",
                summaryPoints: [
                    { text: "Successfully completed evaluation assessment", type: "good" },
                    { text: "Recorded in Cloud SQL PostgreSQL database", type: "good" }
                ],
                recommendation: "Evaluation recorded directly in PostgreSQL database.",
                transcript: [
                    {
                        speaker: "AI Interviewer",
                        time: "00:00",
                        isAI: true,
                        text: `Welcome ${newCandidateForm.name.trim()}! Let's start the evaluation for the ${newCandidateForm.role} position.`
                    },
                    {
                        speaker: newCandidateForm.name.trim(),
                        time: "00:15",
                        isAI: false,
                        text: `Thank you. I have prepared to discuss my technical projects and background in ${newCandidateForm.role}.`
                    }
                ],
                evaluationBreakdown: [
                    { category: "Technical Proficiency", score: scoreNum, weight: "40%" },
                    { category: "Communication & Clarity", score: Math.min(100, scoreNum + 2), weight: "25%" },
                    { category: "Problem Solving", score: Math.max(50, scoreNum - 4), weight: "20%" },
                    { category: "System Architecture", score: Math.max(50, scoreNum - 6), weight: "15%" }
                ]
            };

            const created = await candidatesApi.create(newCandData);
            if (created) {
                setCandidates((prev) => [created, ...prev]);
                setShowAddModal(false);
                setNewCandidateForm({
                    name: "",
                    email: "",
                    phone: "+91 98000 00000",
                    role: "Frontend Developer",
                    score: 80,
                    status: "Under Review",
                    notes: ""
                });
                toast.success(`${created.name} saved to PostgreSQL database!`);
            }
        } catch (err) {
            console.error("Failed to create candidate in PostgreSQL:", err);
            toast.error("Failed to save candidate to database");
        } finally {
            setIsSavingCandidate(false);
        }
    };

    const handleDeleteCandidate = async (id, name, e) => {
        e?.stopPropagation();
        let confirmed = true;
        try {
            confirmed = window.confirm(`Are you sure you want to delete ${name}?`);
        } catch (err) {
            confirmed = true;
        }
        if (!confirmed) return;
        try {
            await candidatesApi.delete(id);
            setCandidates((prev) => (Array.isArray(prev) ? prev.filter((c) => c && c.id !== id) : []));
            if (expandedCandidateId === id) {
                setExpandedCandidateId(null);
            }
            toast.success(`${name} removed successfully!`);
        } catch (err) {
            console.error("Failed to delete candidate:", err);
            toast.error("Failed to delete candidate");
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return "text-emerald-600";
        if (score >= 70) return "text-emerald-600";
        if (score >= 65) return "text-amber-600";
        return "text-rose-600";
    };

    const getStatusBadge = (status) => {
        if (status === "Selected") {
            return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
        }
        if (status === "Rejected") {
            return "bg-rose-50 text-rose-600 border border-rose-200/80";
        }
        return "bg-amber-50 text-amber-700 border border-amber-200/80";
    };

    return (
        <div className="space-y-5 max-w-7xl mx-auto -mt-2" data-testid="interviewed-candidates-page">
            {/* Top Bar / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        All Interviewed Candidates ({totalCount})
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-semibold border border-violet-200 shadow-2xs">
                        <Database className="w-3.5 h-3.5 text-violet-600" />
                        <span>System Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Add Candidate Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition shadow-xs active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Candidate</span>
                    </button>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="text-slate-400 font-medium whitespace-nowrap">Sort by:</span>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer shadow-xs"
                            >
                                <option>Latest Interview</option>
                                <option>Oldest Interview</option>
                                <option>Highest Score</option>
                                <option>Lowest Score</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
                        title="Filters"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Candidates Card List with Downward Opening Transcript Drawer */}
            <div className="space-y-4">
                {filteredCandidates.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 space-y-3 shadow-xs">
                        <Users className="w-12 h-12 mx-auto text-slate-300" />
                        <div>
                            <h3 className="font-bold text-slate-700 text-base">No candidates found</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                No candidate records match your criteria. When candidates participate in technical interviews, their evaluations will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredCandidates.map((candidate) => {
                    const isExpanded = expandedCandidateId === candidate.id;

                    return (
                        <div
                            key={candidate.id}
                            data-testid={`candidate-card-${candidate.id}`}
                            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs ${
                                isExpanded
                                    ? "border-violet-300 shadow-md ring-1 ring-violet-200"
                                    : "border-slate-100 hover:border-slate-200"
                            }`}
                        >
                            {/* Candidate Header / Summary Row */}
                            <div
                                onClick={() => toggleExpandCandidate(candidate.id)}
                                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer hover:bg-slate-50/40 transition-colors"
                            >
                                {/* Column 1: Candidate Avatar & Contact Info */}
                                <div className="flex items-center gap-4 min-w-[240px]">
                                    <img
                                        src={candidate.avatar}
                                        alt={candidate.name}
                                        className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0 shadow-xs"
                                    />
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-slate-900 leading-snug">
                                                {candidate.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{candidate.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{candidate.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Role & Interview Details */}
                                <div className="space-y-1 min-w-[200px]">
                                    <div className="text-sm font-bold text-slate-900">{candidate.role}</div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>{candidate.interviewDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>Duration: {candidate.duration}</span>
                                    </div>
                                    <div className="text-xs font-bold text-violet-600 pt-0.5">
                                        {candidate.mode}
                                    </div>
                                </div>

                                {/* Column 3: Score & Status Pill */}
                                <div className="text-center sm:text-right lg:text-center min-w-[140px] space-y-1.5 self-start lg:self-center">
                                    <div className={`text-2xl font-extrabold tracking-tight ${getScoreColor(candidate.score)}`}>
                                        {candidate.score} <span className="text-sm font-bold text-slate-400">/ 100</span>
                                    </div>
                                    <div>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                                                candidate.status
                                            )}`}
                                        >
                                            {candidate.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Column 4: Select & Reject Action Buttons (Shown ONLY when collapsed) or Chevron (When expanded) */}
                                {!isExpanded ? (
                                    <div className="flex flex-row lg:flex-col gap-2.5 min-w-[180px] shrink-0">
                                        <button
                                            onClick={(e) => handleSelectCandidate(candidate.id, candidate.name, e)}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 border border-emerald-500 text-emerald-600 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-[0.98] shadow-xs"
                                        >
                                            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                                            <span>Select Candidate</span>
                                        </button>

                                        <button
                                            onClick={(e) => handleRejectCandidate(candidate.id, candidate.name, e)}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-rose-50 border border-rose-400 text-rose-500 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-[0.98] shadow-xs"
                                        >
                                            <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                                            <span>Reject Candidate</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-end min-w-[180px] shrink-0">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl transition">
                                            <span>Hide Transcript</span>
                                            <ChevronUp className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* DOWNWARD EXPANDED DRAWER: Interview Transcript, Evaluation, Scores, and Audio Player */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                    {/* Tabs Switcher */}
                                    <div className="flex items-center gap-6 border-b border-slate-200 text-xs sm:text-sm font-semibold pb-1">
                                        {[
                                            { id: "transcript", label: "Interview Transcript" },
                                            { id: "evaluation", label: "AI Evaluation" },
                                            { id: "scores", label: "Scores" }
                                        ].map((tab) => {
                                            const isActive = drawerTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setDrawerTab(tab.id)}
                                                    className={`pb-2.5 whitespace-nowrap transition relative ${
                                                        isActive
                                                            ? "text-violet-600 font-bold"
                                                            : "text-slate-500 hover:text-slate-800"
                                                    }`}
                                                >
                                                    {tab.label}
                                                    {isActive && (
                                                        <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-violet-600 rounded-full" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* TAB 1: Interview Transcript (2 Columns matching image) */}
                                    {drawerTab === "transcript" && (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                            {/* LEFT COLUMN: Transcript Thread + Audio Player (8 Cols) */}
                                            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-slate-900">
                                                        Interview Transcript
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleDownloadTranscript(candidate, e)}
                                                            className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                            <span>Download Transcript</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteCandidate(candidate.id, candidate.name, e)}
                                                            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition"
                                                            title="Delete candidate"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Transcript Dialogue Items */}
                                                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                                                    {candidate.transcript.map((msg, idx) => {
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100/80 hover:bg-slate-50 transition"
                                                            >
                                                                <img
                                                                    src={msg.isAI ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" : candidate.avatar}
                                                                    alt={msg.speaker}
                                                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                                                                />
                                                                <div className="flex-1 min-w-0 space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-bold text-violet-700">
                                                                            {msg.speaker}
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-400 font-mono">
                                                                            {msg.time}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                                                        {msg.text}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Bottom Audio Player Bar */}
                                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 text-xs">
                                                    <button
                                                        onClick={() => setIsPlaying(!isPlaying)}
                                                        className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shrink-0 shadow-xs transition"
                                                    >
                                                        {isPlaying ? (
                                                            <Pause className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Play className="w-3.5 h-3.5 ml-0.5" />
                                                        )}
                                                    </button>
                                                    <span className="text-slate-500 font-mono text-[11px] shrink-0">
                                                        {isPlaying ? "03:18" : "00:00"} / {candidate.duration}
                                                    </span>

                                                    {/* Progress Scrubber */}
                                                    <div className="flex-1 relative flex items-center">
                                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-violet-600 rounded-full transition-all duration-300"
                                                                style={{ width: isPlaying ? "22%" : "0%" }}
                                                            />
                                                        </div>
                                                        <div
                                                            className="w-3 h-3 bg-violet-600 rounded-full absolute -top-0.5 shadow-xs transition-all"
                                                            style={{ left: isPlaying ? "22%" : "0%" }}
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => setIsMuted(!isMuted)}
                                                        className="text-slate-400 hover:text-slate-600 transition"
                                                        title="Mute/Unmute"
                                                    >
                                                        {isMuted ? (
                                                            <VolumeX className="w-4 h-4 text-rose-500" />
                                                        ) : (
                                                            <Volume2 className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setPlaybackSpeed((s) => (s === "1x" ? "1.5x" : s === "1.5x" ? "2x" : "1x"))
                                                        }
                                                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition text-[11px]"
                                                    >
                                                        {playbackSpeed}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* RIGHT COLUMN: AI Summary, Recommendation, HR Decision, Notes (4 Cols) */}
                                            <div className="lg:col-span-4 space-y-4">
                                                {/* AI Summary Card */}
                                                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 shadow-xs">
                                                    <h4 className="text-sm font-bold text-slate-900">AI Summary</h4>
                                                    <div className="space-y-2 text-xs">
                                                        {candidate.summaryPoints.map((pt, i) => (
                                                            <div key={i} className="flex items-start gap-2">
                                                                {pt.type === "good" ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                                )}
                                                                <span className={pt.type === "good" ? "text-slate-700 font-medium" : "text-amber-800 font-medium"}>
                                                                    {pt.text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Recommendation Card */}
                                                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                                        <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                                                        <span>Recommendation</span>
                                                    </div>
                                                    <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                                                        {candidate.recommendation}
                                                    </p>
                                                </div>

                                                {/* HR Decision Card */}
                                                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 shadow-xs">
                                                    <h4 className="text-sm font-bold text-slate-900">HR Decision</h4>
                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={(e) => handleSelectCandidate(candidate.id, candidate.name, e)}
                                                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition border ${
                                                                candidate.status === "Selected"
                                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                    : "bg-white hover:bg-emerald-50 border-emerald-500 text-emerald-600"
                                                            }`}
                                                        >
                                                            <Check className="w-4 h-4 stroke-[2.5]" />
                                                            <span>Select Candidate</span>
                                                        </button>

                                                        <button
                                                            onClick={(e) => handleRejectCandidate(candidate.id, candidate.name, e)}
                                                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition border ${
                                                                candidate.status === "Rejected"
                                                                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                                                    : "bg-white hover:bg-rose-50 border-rose-400 text-rose-500"
                                                            }`}
                                                        >
                                                            <X className="w-4 h-4 stroke-[2.5]" />
                                                            <span>Reject Candidate</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Add Notes Box */}
                                                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 shadow-xs">
                                                    <label className="text-xs font-bold text-slate-700 block">
                                                        Add Notes
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        placeholder="Write your notes about this candidate..."
                                                        value={currentCandidateNotes[candidate.id] ?? candidate.notes}
                                                        onChange={(e) =>
                                                            setCurrentCandidateNotes({
                                                                ...currentCandidateNotes,
                                                                [candidate.id]: e.target.value
                                                            })
                                                        }
                                                        className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-violet-500 transition resize-none leading-relaxed"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveNotes(candidate.id, candidate.name)}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/20 transition active:scale-[0.98]"
                                                    >
                                                        <Save className="w-3.5 h-3.5" />
                                                        <span>Save Notes</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: AI Evaluation */}
                                    {drawerTab === "evaluation" && (
                                        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-xs animate-in fade-in">
                                            <h4 className="text-sm font-bold text-slate-900">Competency Evaluation</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {candidate.evaluationBreakdown.map((item, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-bold text-slate-800">{item.category}</span>
                                                            <span className="font-extrabold text-violet-600">{item.score}/100</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-violet-600 rounded-full"
                                                                style={{ width: `${item.score}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">Weight: {item.weight}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: Scores */}
                                    {drawerTab === "scores" && (
                                        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-xs animate-in fade-in">
                                            <h4 className="text-sm font-bold text-slate-900">Assessment Breakdown</h4>
                                            <div className="p-6 bg-violet-50/50 border border-violet-100 rounded-2xl text-center space-y-2">
                                                <div className="text-xs text-slate-500 font-semibold">Cumulative Interview Match</div>
                                                <div className={`text-4xl font-extrabold ${getScoreColor(candidate.score)}`}>
                                                    {candidate.score} <span className="text-base text-slate-400">/ 100</span>
                                                </div>
                                                <p className="text-xs text-slate-600 max-w-md mx-auto">
                                                    Score computed using speech-to-text accuracy, problem solving confidence, code clarity, and behavioral sentiment.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }))}
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 pt-4 pb-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                    <button className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600 transition">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 font-bold flex items-center justify-center shadow-xs">
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
                    <button className="w-8 h-8 rounded-xl hover:bg-white text-slate-600 flex items-center justify-center transition">
                        5
                    </button>
                    <button className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600 transition">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Show</span>
                    <div className="relative">
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer shadow-xs"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-slate-500">per page</span>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm">Filter Candidates</h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Under Review">Under Review</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={() => {
                                    setStatusFilter("All");
                                }}
                                className="text-xs text-violet-600 font-semibold hover:underline"
                            >
                                Reset Filter
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Candidate Modal (Saves to PostgreSQL) */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                                    <Database className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Add Candidate Record</h3>
                                    <p className="text-[11px] text-slate-400">Save candidate interview profile</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCandidate} className="space-y-3.5 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Snehal Harde"
                                    value={newCandidateForm.name}
                                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="snehal@example.com"
                                        value={newCandidateForm.email}
                                        onChange={(e) => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                                    <input
                                        type="text"
                                        placeholder="+91 98000 00000"
                                        value={newCandidateForm.phone}
                                        onChange={(e) => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Role</label>
                                    <select
                                        value={newCandidateForm.role}
                                        onChange={(e) => setNewCandidateForm({ ...newCandidateForm, role: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                    >
                                        <option value="Frontend Developer">Frontend Developer</option>
                                        <option value="Python Developer">Python Developer</option>
                                        <option value="Full Stack Engineer">Full Stack Engineer</option>
                                        <option value="DevOps Engineer">DevOps Engineer</option>
                                        <option value="AI Research Engineer">AI Research Engineer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Initial Score (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newCandidateForm.score}
                                        onChange={(e) => setNewCandidateForm({ ...newCandidateForm, score: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Status</label>
                                <select
                                    value={newCandidateForm.status}
                                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, status: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
                                >
                                    <option value="Under Review">Under Review</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Recruiter Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="Add evaluation summary or notes..."
                                    value={newCandidateForm.notes}
                                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, notes: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 resize-none"
                                />
                            </div>

                            <div className="flex justify-end items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingCandidate}
                                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-semibold transition shadow-xs"
                                >
                                    {isSavingCandidate ? "Saving..." : "Save Candidate"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Candidates;
