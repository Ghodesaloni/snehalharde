import React, { useState, useMemo } from "react";
import { toast } from "sonner";
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
    User
} from "lucide-react";

const initialCandidates = [
    {
        id: "cand-1",
        name: "Rahul Sharma",
        email: "rahul.sharma@email.com",
        phone: "+91 98765 43210",
        role: "Frontend Developer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        interviewDate: "28 May 2025, 11:30 AM",
        timestamp: new Date("2025-05-28T11:30:00").getTime(),
        duration: "18m 24s",
        mode: "AI Interview",
        score: 85,
        status: "Under Review",
        notes: "",
        summaryPoints: [
            { text: "Good technical knowledge", type: "good" },
            { text: "Clear communication", type: "good" },
            { text: "Confident and composed", type: "good" },
            { text: "Good problem solving approach", type: "good" },
            { text: "Can improve in system design", type: "warning" }
        ],
        recommendation: "Strong candidate. Meets most of the requirements.",
        transcript: [
            {
                speaker: "AI Interviewer",
                time: "00:00",
                isAI: true,
                text: "Can you introduce yourself and tell me about your background?"
            },
            {
                speaker: "Rahul Sharma",
                time: "00:18",
                isAI: false,
                text: "Yes, sure. I'm Rahul Sharma, a Computer Science graduate with 2+ years of experience in frontend development. I specialize in React.js, JavaScript, HTML, CSS and have worked on various responsive web applications."
            },
            {
                speaker: "AI Interviewer",
                time: "01:05",
                isAI: true,
                text: "What are the key features of React?"
            },
            {
                speaker: "Rahul Sharma",
                time: "01:28",
                isAI: false,
                text: "React is a JavaScript library for building user interfaces. Some key features are component-based architecture, virtual DOM, JSX, unidirectional data flow, and its performance."
            },
            {
                speaker: "AI Interviewer",
                time: "02:45",
                isAI: true,
                text: "How do you handle state management in large applications?"
            },
            {
                speaker: "Rahul Sharma",
                time: "03:18",
                isAI: false,
                text: "I prefer using Redux Toolkit for global state management. It helps in managing complex state logic, improves scalability and makes the code more maintainable."
            }
        ],
        evaluationBreakdown: [
            { category: "Technical Proficiency", score: 88, weight: "40%" },
            { category: "Communication & Clarity", score: 85, weight: "25%" },
            { category: "Problem Solving", score: 82, weight: "20%" },
            { category: "System Architecture", score: 78, weight: "15%" }
        ]
    },
    {
        id: "cand-2",
        name: "Priya Verma",
        email: "priya.verma@email.com",
        phone: "+91 91234 56789",
        role: "Frontend Developer",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        interviewDate: "28 May 2025, 10:15 AM",
        timestamp: new Date("2025-05-28T10:15:00").getTime(),
        duration: "16m 10s",
        mode: "AI Interview",
        score: 78,
        status: "Under Review",
        notes: "",
        summaryPoints: [
            { text: "Strong UI component styling skills", type: "good" },
            { text: "Well-structured answers", type: "good" },
            { text: "Understands state reactivity", type: "good" },
            { text: "Needs deeper knowledge in SSR caching", type: "warning" }
        ],
        recommendation: "Promising candidate with solid frontend foundations.",
        transcript: [
            {
                speaker: "AI Interviewer",
                time: "00:00",
                isAI: true,
                text: "Welcome Priya! Tell us about your journey in frontend engineering."
            },
            {
                speaker: "Priya Verma",
                time: "00:22",
                isAI: false,
                text: "Hello! I've been building accessible and high-performance user interfaces for over 2 years, specializing in responsive CSS, Vue.js, and React."
            },
            {
                speaker: "AI Interviewer",
                time: "01:12",
                isAI: true,
                text: "How do you optimize rendering performance in web applications?"
            },
            {
                speaker: "Priya Verma",
                time: "01:40",
                isAI: false,
                text: "I focus on lazy loading assets, utilizing memoization hooks like useMemo/useCallback, and reducing layout thrashing by minimizing DOM repaints."
            }
        ],
        evaluationBreakdown: [
            { category: "Technical Proficiency", score: 76, weight: "40%" },
            { category: "Communication & Clarity", score: 82, weight: "25%" },
            { category: "Problem Solving", score: 78, weight: "20%" },
            { category: "System Architecture", score: 74, weight: "15%" }
        ]
    },
    {
        id: "cand-3",
        name: "Amit Kumar",
        email: "amit.kumar@email.com",
        phone: "+91 87654 32109",
        role: "Frontend Developer",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
        interviewDate: "27 May 2025, 04:20 PM",
        timestamp: new Date("2025-05-27T16:20:00").getTime(),
        duration: "20m 45s",
        mode: "AI Interview",
        score: 62,
        status: "Rejected",
        notes: "",
        summaryPoints: [
            { text: "Familiar with HTML5 & Bootstrap", type: "good" },
            { text: "Hesitant in core JavaScript questions", type: "warning" },
            { text: "Struggled with asynchronous promise chaining", type: "warning" },
            { text: "Limited experience with modern state managers", type: "warning" }
        ],
        recommendation: "Does not meet seniority expectations for this role.",
        transcript: [
            {
                speaker: "AI Interviewer",
                time: "00:00",
                isAI: true,
                text: "Can you explain event bubbling and capturing in JavaScript?"
            },
            {
                speaker: "Amit Kumar",
                time: "00:35",
                isAI: false,
                text: "Event bubbling is when an event triggers on the child element and goes up to the parent element in the DOM tree."
            },
            {
                speaker: "AI Interviewer",
                time: "01:20",
                isAI: true,
                text: "How do you stop event propagation?"
            },
            {
                speaker: "Amit Kumar",
                time: "01:45",
                isAI: false,
                text: "We use event.stopPropagation() to prevent it from propagating further."
            }
        ],
        evaluationBreakdown: [
            { category: "Technical Proficiency", score: 58, weight: "40%" },
            { category: "Communication & Clarity", score: 65, weight: "25%" },
            { category: "Problem Solving", score: 60, weight: "20%" },
            { category: "System Architecture", score: 62, weight: "15%" }
        ]
    },
    {
        id: "cand-4",
        name: "Sneha Patel",
        email: "sneha.patel@email.com",
        phone: "+91 99887 66554",
        role: "Frontend Developer",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
        interviewDate: "28 May 2025, 11:00 AM",
        timestamp: new Date("2025-05-28T11:00:00").getTime(),
        duration: "17m 30s",
        mode: "AI Interview",
        score: 91,
        status: "Selected",
        notes: "",
        summaryPoints: [
            { text: "Outstanding technical depth in React & Next.js", type: "good" },
            { text: "Articulate and structured communication", type: "good" },
            { text: "Excellent code modularity & testing practices", type: "good" },
            { text: "Proactive problem solver", type: "good" }
        ],
        recommendation: "Top tier candidate. Strongly recommended for hire.",
        transcript: [
            {
                speaker: "AI Interviewer",
                time: "00:00",
                isAI: true,
                text: "Please outline your approach to building a scalable Design System in React."
            },
            {
                speaker: "Sneha Patel",
                time: "00:25",
                isAI: false,
                text: "I start by defining a tokenized foundation for spacing, colors, and typography using Tailwind or CSS variables, then create atomic headless components with Radix or custom hooks for maximum reusability."
            },
            {
                speaker: "AI Interviewer",
                time: "01:15",
                isAI: true,
                text: "How do you handle Server Components vs Client Components in Next.js?"
            },
            {
                speaker: "Sneha Patel",
                time: "01:42",
                isAI: false,
                text: "Server Components should handle data fetching and heavy computations to reduce bundle size, while Client Components are reserved for interactive boundaries requiring state, events, or browser APIs."
            }
        ],
        evaluationBreakdown: [
            { category: "Technical Proficiency", score: 94, weight: "40%" },
            { category: "Communication & Clarity", score: 90, weight: "25%" },
            { category: "Problem Solving", score: 92, weight: "20%" },
            { category: "System Architecture", score: 88, weight: "15%" }
        ]
    },
    {
        id: "cand-5",
        name: "Vikram Singh",
        email: "vikram.singh@email.com",
        phone: "+91 77654 88990",
        role: "Frontend Developer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        interviewDate: "26 May 2025, 03:45 PM",
        timestamp: new Date("2025-05-26T15:45:00").getTime(),
        duration: "15m 05s",
        mode: "AI Interview",
        score: 69,
        status: "Under Review",
        notes: "",
        summaryPoints: [
            { text: "Good practical understanding of React components", type: "good" },
            { text: "Moderate communication speed", type: "good" },
            { text: "Needs improvement in TypeScript type safety", type: "warning" },
            { text: "Requires guidance on state normalization", type: "warning" }
        ],
        recommendation: "Fair performance. Recommend technical review round.",
        transcript: [
            {
                speaker: "AI Interviewer",
                time: "00:00",
                isAI: true,
                text: "What are the benefits of using TypeScript with React?"
            },
            {
                speaker: "Vikram Singh",
                time: "00:20",
                isAI: false,
                text: "TypeScript provides static type checking, better autocomplete in IDEs, and catches common runtime errors before deploying code."
            }
        ],
        evaluationBreakdown: [
            { category: "Technical Proficiency", score: 68, weight: "40%" },
            { category: "Communication & Clarity", score: 72, weight: "25%" },
            { category: "Problem Solving", score: 66, weight: "20%" },
            { category: "System Architecture", score: 70, weight: "15%" }
        ]
    }
];

const Candidates = () => {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [sortBy, setSortBy] = useState("Latest Interview");
    const [statusFilter, setStatusFilter] = useState("All");
    const [pageSize, setPageSize] = useState(5);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Expanded candidate accordion / downward drawer state
    const [expandedCandidateId, setExpandedCandidateId] = useState("cand-1");
    const [drawerTab, setDrawerTab] = useState("transcript"); // "transcript" | "evaluation" | "scores"

    // Audio player simulated state
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState("1x");
    const [isMuted, setIsMuted] = useState(false);
    const [currentCandidateNotes, setCurrentCandidateNotes] = useState({});

    // Sorting and Filtering
    const filteredCandidates = useMemo(() => {
        return candidates
            .filter((c) => {
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

    const totalCount = 24; // Visual total matching image

    const toggleExpandCandidate = (id) => {
        setExpandedCandidateId((prev) => (prev === id ? null : id));
    };

    const handleSelectCandidate = (id, name, e) => {
        e?.stopPropagation();
        setCandidates((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "Selected" } : c))
        );
        toast.success(`${name} marked as Selected!`);
    };

    const handleRejectCandidate = (id, name, e) => {
        e?.stopPropagation();
        setCandidates((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "Rejected" } : c))
        );
        toast.error(`${name} marked as Rejected.`);
    };

    const handleSaveNotes = (candidateId, candidateName) => {
        const text = currentCandidateNotes[candidateId] || "";
        setCandidates((prev) =>
            prev.map((c) => (c.id === candidateId ? { ...c, notes: text } : c))
        );
        toast.success(`Notes saved for ${candidateName}`);
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
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        All Interviewed Candidates ({totalCount})
                    </h1>
                </div>

                <div className="flex items-center gap-3">
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
                {filteredCandidates.map((candidate) => {
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
                                                    <button
                                                        onClick={(e) => handleDownloadTranscript(candidate, e)}
                                                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span>Download Transcript</span>
                                                    </button>
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
                })}
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
        </div>
    );
};

export default Candidates;
