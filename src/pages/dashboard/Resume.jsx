import React, { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
    Search,
    Filter,
    Upload,
    CloudUpload,
    FileText,
    CheckCircle2,
    BookmarkCheck,
    XCircle,
    Eye,
    MoreVertical,
    X,
    Calendar,
    Download,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    Sparkles,
    ScanLine,
    Scissors,
    ShieldCheck,
    MapPin,
    Phone,
    Mail,
    Briefcase,
    GraduationCap,
    Clock,
    UserCheck,
    UserX,
    Send,
    Star,
    ExternalLink,
    Copy,
    Check
} from "lucide-react";
import { addOrUpdateInterview, getInterviewByCodeOrId } from "@/utils/interviewStore";

// Seed Candidate Data matching reference UI
const initialCandidates = [
    {
        id: "c1",
        name: "Snehal Harde",
        email: "snehal@email.com",
        phone: "+91 98765 43210",
        location: "Nagpur, Maharashtra, India",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        role: "Python Developer",
        experience: "2 Years",
        expYears: 2,
        skills: ["Python", "Flask", "SQL"],
        extraSkillsCount: 3,
        allSkills: ["Python", "Flask", "SQL", "REST API", "HTML", "CSS"],
        atsScore: 87,
        matchScore: 92,
        skillsMatchPct: 95,
        status: "Shortlisted",
        uploadedDate: "20 May 2025",
        currentRole: "Python Developer Intern at ABC Pvt. Ltd.",
        education: "B.Tech in Computer Science",
        summary: "Snehal demonstrates strong full-stack Python capabilities with high proficiency in Flask and REST APIs. Good database fundamentals with PostgreSQL and clean code practices.",
    },
    {
        id: "c2",
        name: "Rohan Verma",
        email: "rohanv@email.com",
        phone: "+91 98123 45678",
        location: "Pune, Maharashtra, India",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        role: "Python Developer",
        experience: "3 Years",
        expYears: 3,
        skills: ["Python", "Django", "AWS"],
        extraSkillsCount: 2,
        allSkills: ["Python", "Django", "AWS", "Docker", "PostgreSQL"],
        atsScore: 82,
        matchScore: 88,
        skillsMatchPct: 90,
        status: "Shortlisted",
        uploadedDate: "20 May 2025",
        currentRole: "Backend Software Engineer at Infosys",
        education: "B.E. in Information Technology",
        summary: "Experienced backend engineer with robust Django and cloud deployment experience on AWS. Proficient in microservices architecture and CI/CD pipelines.",
    },
    {
        id: "c3",
        name: "Aisha Khan",
        email: "aisha.k@email.com",
        phone: "+91 98234 56789",
        location: "Mumbai, Maharashtra, India",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
        role: "Python Developer",
        experience: "1.5 Years",
        expYears: 1.5,
        skills: ["Python", "Flask", "MongoDB"],
        extraSkillsCount: 2,
        allSkills: ["Python", "Flask", "MongoDB", "Redis", "Git"],
        atsScore: 78,
        matchScore: 81,
        skillsMatchPct: 82,
        status: "Review",
        uploadedDate: "19 May 2025",
        currentRole: "Junior Python Developer at Tech Mahindra",
        education: "B.Sc. in Computer Science",
        summary: "Solid foundational knowledge in Python and NoSQL datastores. Shows promising problem-solving speed and strong enthusiasm for asynchronous backend programming.",
    },
    {
        id: "c4",
        name: "Rahul Mehta",
        email: "rahul.m@email.com",
        phone: "+91 98345 67890",
        location: "Bengaluru, Karnataka, India",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        role: "Python Developer",
        experience: "4 Years",
        expYears: 4,
        skills: ["Python", "Django", "SQL"],
        extraSkillsCount: 4,
        allSkills: ["Python", "Django", "SQL", "FastAPI", "Celery", "Redis", "Docker"],
        atsScore: 74,
        matchScore: 76,
        skillsMatchPct: 78,
        status: "Review",
        uploadedDate: "19 May 2025",
        currentRole: "Software Engineer at Wipro",
        education: "M.Tech in Software Systems",
        summary: "Seasoned engineer with 4 years in Python ecosystems. Extensive background in monolithic to microservice migrations and asynchronous task scheduling with Celery.",
    },
    {
        id: "c5",
        name: "Neha Sharma",
        email: "neha.s@email.com",
        phone: "+91 98456 78901",
        location: "Hyderabad, Telangana, India",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        role: "Data Analyst",
        experience: "2 Years",
        expYears: 2,
        skills: ["Python", "Pandas", "SQL"],
        extraSkillsCount: 3,
        allSkills: ["Python", "Pandas", "SQL", "Tableau", "PowerBI", "NumPy"],
        atsScore: 65,
        matchScore: 60,
        skillsMatchPct: 62,
        status: "Rejected",
        uploadedDate: "18 May 2025",
        currentRole: "Data Analyst at Capgemini",
        education: "B.Com with Data Analytics",
        summary: "Profile is focused heavily on business intelligence and visualization (Tableau/PowerBI) rather than core software application backend development.",
    },
    {
        id: "c6",
        name: "Arjun Das",
        email: "arjun.d@email.com",
        phone: "+91 98567 89012",
        location: "Kolkata, West Bengal, India",
        avatar: null,
        initials: "AD",
        role: "Python Developer",
        experience: "1 Year",
        expYears: 1,
        skills: ["Python", "Flask"],
        extraSkillsCount: 1,
        allSkills: ["Python", "Flask", "Git", "SQLite"],
        atsScore: 58,
        matchScore: 55,
        skillsMatchPct: 58,
        status: "Rejected",
        uploadedDate: "18 May 2025",
        currentRole: "Trainee Developer at Mindtree",
        education: "BCA",
        summary: "Early career developer with basic scripting exposure. Does not meet the minimum required depth in database indexing and cloud deployment.",
    },
    {
        id: "c7",
        name: "Pooja Singh",
        email: "pooja.s@email.com",
        phone: "+91 98678 90123",
        location: "Delhi, NCR, India",
        avatar: null,
        initials: "PS",
        role: "Python Developer",
        experience: "2.5 Years",
        expYears: 2.5,
        skills: ["Python", "Django", "AWS"],
        extraSkillsCount: 1,
        allSkills: ["Python", "Django", "AWS", "GraphQL"],
        atsScore: 80,
        matchScore: 84,
        skillsMatchPct: 85,
        status: "Shortlisted",
        uploadedDate: "17 May 2025",
        currentRole: "Associate Engineer at Cognizant",
        education: "B.Tech in Information Science",
        summary: "Demonstrated strong knowledge of modern API paradigms including GraphQL and Django ORM optimization. Clear communication and relevant industry experience.",
    }
];

const Resumes = () => {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidates[0].id);
    const [activeTab, setActiveTab] = useState("All Resumes");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("Newest");
    const [selectedRowIds, setSelectedRowIds] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showFullProfileModal, setShowFullProfileModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [schedRound, setSchedRound] = useState("Technical Screening Round (45 mins)");
    const [schedDate, setSchedDate] = useState("2026-09-02");
    const [schedTime, setSchedTime] = useState("11:00");
    const [schedDuration, setSchedDuration] = useState("45 Minutes");
    const [generatedLinkData, setGeneratedLinkData] = useState(null);
    const [copiedInterviewLink, setCopiedInterviewLink] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterRole, setFilterRole] = useState("All");
    const [filterMinScore, setFilterMinScore] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    const fileInputRef = useRef(null);

    const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

    // Filter and Sort Candidates
    const filteredCandidates = useMemo(() => {
        return candidates.filter((c) => {
            // Tab filter
            if (activeTab === "Shortlisted" && c.status !== "Shortlisted") return false;
            if (activeTab === "Review" && c.status !== "Review") return false;
            if (activeTab === "Rejected" && c.status !== "Rejected") return false;

            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesName = c.name.toLowerCase().includes(query);
                const matchesEmail = c.email.toLowerCase().includes(query);
                const matchesRole = c.role.toLowerCase().includes(query);
                const matchesSkills = c.allSkills.some((s) => s.toLowerCase().includes(query));
                if (!matchesName && !matchesEmail && !matchesRole && !matchesSkills) return false;
            }

            // Advanced Modal Filters
            if (filterRole !== "All" && c.role !== filterRole) return false;
            if (c.atsScore < filterMinScore) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === "Highest ATS") return b.atsScore - a.atsScore;
            if (sortBy === "Highest Match") return b.matchScore - a.matchScore;
            if (sortBy === "Experience") return b.expYears - a.expYears;
            // Default "Newest"
            return 0;
        });
    }, [candidates, activeTab, searchQuery, sortBy, filterRole, filterMinScore]);

    // Summary KPI Counts
    const stats = useMemo(() => {
        const total = 250; // Visual base count
        const analyzed = 220;
        const shortlisted = candidates.filter((c) => c.status === "Shortlisted").length + 65;
        const rejected = candidates.filter((c) => c.status === "Rejected").length + 150;
        return { total, analyzed, shortlisted, rejected };
    }, [candidates]);

    // Handle Upload
    const handleFileUpload = (files) => {
        const fileList = Array.from(files);
        if (!fileList.length) return;

        setIsUploading(true);
        toast.info(`Parsing & screening ${fileList.length} resume${fileList.length > 1 ? "s" : ""} with AI...`);

        setTimeout(() => {
            const newAdded = fileList.map((f, i) => {
                const cleanName = f.name
                    .replace(/\.(pdf|docx?|txt)$/i, "")
                    .replace(/[_-]/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || `Applicant ${candidates.length + i + 1}`;

                const ats = Math.floor(65 + Math.random() * 32);
                const match = Math.floor(60 + Math.random() * 38);
                const status = ats >= 80 ? "Shortlisted" : ats >= 70 ? "Review" : "Rejected";
                const initials = cleanName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

                return {
                    id: `c-upload-${Date.now()}-${i}`,
                    name: cleanName,
                    email: `${cleanName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
                    phone: "+91 98" + Math.floor(10000000 + Math.random() * 90000000),
                    location: "Bengaluru, India",
                    avatar: null,
                    initials: initials,
                    role: "Python Developer",
                    experience: `${Math.floor(1 + Math.random() * 5)} Years`,
                    expYears: 2,
                    skills: ["Python", "Flask", "SQL"],
                    extraSkillsCount: 2,
                    allSkills: ["Python", "Flask", "SQL", "REST API", "Git"],
                    atsScore: ats,
                    matchScore: match,
                    skillsMatchPct: Math.min(100, match + 5),
                    status: status,
                    uploadedDate: "Today",
                    currentRole: "Software Developer",
                    education: "B.Tech in Computer Science",
                    summary: `${cleanName} exhibits solid core competencies in Python and related frameworks. AI screening completed with score ${ats}/100.`,
                };
            });

            setCandidates((prev) => [...newAdded, ...prev]);
            setSelectedCandidateId(newAdded[0].id);
            setIsUploading(false);
            toast.success(`Successfully screened ${fileList.length} resume${fileList.length > 1 ? "s" : ""}!`);
        }, 1200);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setCandidates((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
        if (newStatus === "Shortlisted") {
            toast.success("Candidate shortlisted successfully!");
        } else if (newStatus === "Rejected") {
            toast.error("Candidate marked as rejected.");
        } else {
            toast.info(`Candidate status updated to ${newStatus}.`);
        }
        setOpenActionMenuId(null);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRowIds(filteredCandidates.map((c) => c.id));
        } else {
            setSelectedRowIds([]);
        }
    };

    const handleRowSelect = (id) => {
        setSelectedRowIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Helper for score badge colors
    const getScoreBadgeClass = (score) => {
        if (score >= 80) return "border-emerald-300 text-emerald-600 bg-emerald-50/60";
        if (score >= 70) return "border-amber-300 text-amber-600 bg-amber-50/60";
        return "border-rose-300 text-rose-600 bg-rose-50/60";
    };

    const getMatchTextColor = (match) => {
        if (match >= 80) return "text-emerald-600";
        if (match >= 70) return "text-amber-600";
        return "text-rose-500";
    };

    const getStatusPill = (status) => {
        if (status === "Shortlisted") {
            return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
        }
        if (status === "Review") {
            return "bg-amber-50 text-amber-700 border border-amber-200/80";
        }
        return "bg-rose-50 text-rose-600 border border-rose-200/80";
    };

    return (
        <div className="space-y-6 -mt-2" data-testid="resume-management-page">
            {/* Top Resume Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Resume
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Upload, analyze, and shortlist candidates using AI-powered resume screening.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filters Button */}
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                        <span>Filters</span>
                    </button>

                    {/* Upload Resume Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md shadow-violet-500/25 transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload Resume</span>
                    </button>

                    {/* Hidden input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                    />
                </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Total Resumes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 p-3 shrink-0">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500">Total Resumes</div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.total}</div>
                        <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                            <span>↑ 15% this week</span>
                        </div>
                    </div>
                </div>

                {/* Analyzed */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 p-3 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500">Analyzed</div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.analyzed}</div>
                        <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                            <span>↑ 12% this week</span>
                        </div>
                    </div>
                </div>

                {/* Shortlisted */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 p-3 shrink-0">
                        <BookmarkCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500">Shortlisted</div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.shortlisted}</div>
                        <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                            <span>↑ 8% this week</span>
                        </div>
                    </div>
                </div>

                {/* Rejected */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 p-3 shrink-0">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500">Rejected</div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.rejected}</div>
                        <div className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5 mt-0.5">
                            <span>↓ 5% this week</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Drag & Drop Dropzone + AI Bullet Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Drag & Drop Card */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`lg:col-span-6 bg-white rounded-2xl p-6 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center relative ${isDragOver
                            ? "border-violet-600 bg-violet-50/50 scale-[1.01]"
                            : "border-violet-200/90 bg-violet-50/20 hover:border-violet-300"
                        }`}
                >
                    {isUploading ? (
                        <div className="py-4 flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full border-3 border-violet-600 border-t-transparent animate-spin"></div>
                            <div className="text-sm font-semibold text-violet-900">AI Screening in Progress...</div>
                            <div className="text-xs text-slate-500">Extracting skills, ATS formatting & calculating match scores</div>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-violet-100/60 flex items-center justify-center text-violet-600 mb-3">
                                <CloudUpload className="w-6 h-6" />
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                                Drag &amp; Drop resume files here
                            </div>
                            <div className="text-xs text-slate-400 my-1 font-medium">or</div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-1 flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Browse Files</span>
                            </button>
                            <div className="text-[11px] text-slate-400 mt-3 font-normal">
                                Supports: PDF, DOC, DOCX (Max 10MB)
                            </div>
                        </>
                    )}
                </div>

                {/* AI Features Highlights Box */}
                <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center gap-3.5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                            <CloudUpload className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            Upload single or multiple resumes
                        </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <ScanLine className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            AI will parse and analyze automatically
                        </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
                            <Scissors className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            Get match score and skill insights
                        </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            Shortlist the best candidates faster
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Layout: Candidate Table (Left/Center) + Selected Candidate Detail Drawer (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Table Section */}
                <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    {/* Tabs Header & Controls */}
                    <div className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        {/* Status Tabs */}
                        <div className="flex items-center gap-2 sm:gap-6">
                            {["All Resumes", "Shortlisted", "Review", "Rejected"].map((tab) => {
                                const isActive = activeTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-2 pt-1 text-xs sm:text-sm font-semibold transition-all relative ${isActive
                                                ? "text-violet-600 font-bold"
                                                : "text-slate-500 hover:text-slate-800"
                                            }`}
                                    >
                                        {tab}
                                        {isActive && (
                                            <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-violet-600 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sort & Quick Filter Controls */}
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <span className="text-slate-400 font-medium">Sort by:</span>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-7 font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer text-xs"
                                    >
                                        <option>Newest</option>
                                        <option>Highest ATS</option>
                                        <option>Highest Match</option>
                                        <option>Experience</option>
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition"
                                title="Advanced Filters"
                            >
                                <Filter className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto min-h-[380px]">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                                    <th className="py-3 px-4 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={
                                                selectedRowIds.length > 0 &&
                                                selectedRowIds.length === filteredCandidates.length
                                            }
                                            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-3 px-4 font-semibold text-slate-700">Candidate</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Job Role</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Experience</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Skills</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700 text-center">ATS Score</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700 text-center">Match %</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Status</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Uploaded</th>
                                    <th className="py-3 px-4 font-semibold text-slate-700 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCandidates.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="py-12 text-center text-slate-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            No candidates found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCandidates.map((candidate) => {
                                        const isSelectedRow = selectedCandidateId === candidate.id;
                                        const isChecked = selectedRowIds.includes(candidate.id);

                                        return (
                                            <tr
                                                key={candidate.id}
                                                onClick={() => setSelectedCandidateId(candidate.id)}
                                                className={`transition-colors cursor-pointer group ${isSelectedRow
                                                        ? "bg-violet-50/40"
                                                        : "hover:bg-slate-50/70"
                                                    }`}
                                            >
                                                {/* Checkbox */}
                                                <td
                                                    className="py-3.5 px-4 text-center"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleRowSelect(candidate.id)}
                                                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Candidate Profile */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {candidate.avatar ? (
                                                            <img
                                                                src={candidate.avatar}
                                                                alt={candidate.name}
                                                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                                {candidate.initials ||
                                                                    candidate.name
                                                                        .split(" ")
                                                                        .map((n) => n[0])
                                                                        .join("")
                                                                        .slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                                                {candidate.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 truncate">
                                                                {candidate.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Job Role */}
                                                <td className="py-3.5 px-3 text-slate-700 font-medium text-xs whitespace-nowrap">
                                                    {candidate.role}
                                                </td>

                                                {/* Experience */}
                                                <td className="py-3.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                                                    {candidate.experience}
                                                </td>

                                                {/* Skills Pill Badges */}
                                                <td className="py-3.5 px-3">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {candidate.skills.map((sk) => (
                                                            <span
                                                                key={sk}
                                                                className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-semibold"
                                                            >
                                                                {sk}
                                                            </span>
                                                        ))}
                                                        {candidate.extraSkillsCount > 0 && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                                                                +{candidate.extraSkillsCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* ATS Score */}
                                                <td className="py-3.5 px-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${getScoreBadgeClass(
                                                            candidate.atsScore
                                                        )}`}
                                                    >
                                                        {candidate.atsScore}
                                                    </span>
                                                </td>

                                                {/* Match % */}
                                                <td
                                                    className={`py-3.5 px-3 text-center font-bold text-xs whitespace-nowrap ${getMatchTextColor(
                                                        candidate.matchScore
                                                    )}`}
                                                >
                                                    {candidate.matchScore}%
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-3 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusPill(
                                                            candidate.status
                                                        )}`}
                                                    >
                                                        {candidate.status}
                                                    </span>
                                                </td>

                                                {/* Uploaded Date */}
                                                <td className="py-3.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                                                    {candidate.uploadedDate}
                                                </td>

                                                {/* Action */}
                                                <td
                                                    className="py-3.5 px-4 text-center relative"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                                        <button
                                                            onClick={() => setSelectedCandidateId(candidate.id)}
                                                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-violet-600 transition"
                                                            title="View Analysis"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setOpenActionMenuId(
                                                                    openActionMenuId === candidate.id
                                                                        ? null
                                                                        : candidate.id
                                                                )
                                                            }
                                                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
                                                            title="Options"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* Dropdown Action Menu */}
                                                    {openActionMenuId === candidate.id && (
                                                        <div className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-left text-xs font-medium text-slate-700 animate-in fade-in-50 zoom-in-95">
                                                            <button
                                                                onClick={() =>
                                                                    handleStatusChange(candidate.id, "Shortlisted")
                                                                }
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-600"
                                                            >
                                                                <BookmarkCheck className="w-3.5 h-3.5" />
                                                                <span>Shortlist</span>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleStatusChange(candidate.id, "Review")
                                                                }
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-amber-600"
                                                            >
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>Move to Review</span>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleStatusChange(candidate.id, "Rejected")
                                                                }
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                <span>Reject</span>
                                                            </button>
                                                            <hr className="my-1 border-slate-100" />
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCandidateId(candidate.id);
                                                                    setShowInterviewModal(true);
                                                                    setOpenActionMenuId(null);
                                                                }}
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>Schedule Interview</span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    toast.success(
                                                                        `Downloading ${candidate.name}'s resume...`
                                                                    );
                                                                    setOpenActionMenuId(null);
                                                                }}
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>Download PDF</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
                        <div>Showing 1 to {filteredCandidates.length} of 250 entries</div>

                        <div className="flex items-center gap-1.5">
                            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600 disabled:opacity-40">
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold flex items-center justify-center shadow-sm">
                                1
                            </button>
                            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600">
                                2
                            </button>
                            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600">
                                3
                            </button>
                            <span className="px-1 text-slate-400">...</span>
                            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600">
                                25
                            </button>
                            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <select className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none">
                                <option>10 / page</option>
                                <option>25 / page</option>
                                <option>50 / page</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right Candidate Details Panel */}
                <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 sticky top-24">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                {selectedCandidate.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1 font-medium">
                                <span>{selectedCandidate.email}</span>
                                <span>|</span>
                                <span>{selectedCandidate.phone}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{selectedCandidate.location}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedCandidateId(null)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                            title="Close preview"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scores Boxes (ATS Score & Match Score) */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* ATS Score */}
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 text-left">
                            <div className="text-xs text-slate-500 font-medium">ATS Score</div>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-emerald-600">
                                    {selectedCandidate.atsScore}
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                            </div>
                        </div>

                        {/* Match Score */}
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 text-left">
                            <div className="text-xs text-slate-500 font-medium">Match Score</div>
                            <div className="mt-1 text-2xl font-extrabold text-emerald-600">
                                {selectedCandidate.matchScore}%
                            </div>
                        </div>
                    </div>

                    {/* Skills Match Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-700">Skills Match</span>
                            <span className="text-slate-900">{selectedCandidate.skillsMatchPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${selectedCandidate.skillsMatchPct}%` }}
                            />
                        </div>
                    </div>

                    {/* Top Skills Badges */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-800">Top Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedCandidate.allSkills.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-1 rounded-lg bg-violet-50/90 text-violet-700 border border-violet-100/90 text-xs font-semibold"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Experience, Current Role, Education */}
                    <div className="space-y-3 pt-1 border-t border-slate-100 text-xs">
                        <div>
                            <div className="text-slate-400 font-medium">Experience</div>
                            <div className="font-semibold text-slate-800 mt-0.5">
                                {selectedCandidate.experience}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-400 font-medium">Current Role</div>
                            <div className="font-semibold text-slate-800 mt-0.5">
                                {selectedCandidate.currentRole}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-400 font-medium">Education</div>
                            <div className="font-semibold text-slate-800 mt-0.5">
                                {selectedCandidate.education}
                            </div>
                        </div>
                    </div>

                    {/* View Full Profile Button */}
                    <button
                        onClick={() => setShowFullProfileModal(true)}
                        className="w-full py-2.5 border border-violet-200 hover:border-violet-400 hover:bg-violet-50/40 text-violet-700 font-semibold text-xs rounded-xl transition shadow-xs text-center block"
                    >
                        View Full Profile
                    </button>

                    {/* Quick Actions */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-800">Quick Actions</div>

                        {/* Shortlist / Reject 2-column buttons */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={() => handleStatusChange(selectedCandidate.id, "Shortlisted")}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-semibold transition"
                            >
                                <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                                <span>Shortlist</span>
                            </button>

                            <button
                                onClick={() => handleStatusChange(selectedCandidate.id, "Rejected")}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50/80 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-xl text-xs font-semibold transition"
                            >
                                <XCircle className="w-4 h-4 text-rose-500" />
                                <span>Reject</span>
                            </button>
                        </div>

                        {/* Schedule Interview */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setGeneratedLinkData(null);
                                    setShowInterviewModal(true);
                                }}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-xs"
                            >
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>Schedule</span>
                            </button>

                            <a
                                href={`/i/${selectedCandidate.id === "c1" ? "akc123" : selectedCandidate.id === "c2" ? "def456" : `ava-${selectedCandidate.id}`}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/80 rounded-xl text-xs font-semibold transition text-center"
                                title="Open Candidate's Unique Interview Page"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-violet-600" />
                                <span>Candidate Portal</span>
                            </a>
                        </div>

                        {/* Download Resume */}
                        <button
                            onClick={() => toast.success(`Downloading ${selectedCandidate.name}'s resume...`)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-xs"
                        >
                            <Download className="w-4 h-4 text-slate-500" />
                            <span>Download Resume</span>
                        </button>

                        {/* More Actions Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setOpenActionMenuId(
                                        openActionMenuId === "drawer-more" ? null : "drawer-more"
                                    )
                                }
                                className="w-full flex items-center justify-center gap-1 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition"
                            >
                                <span>More Actions</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {openActionMenuId === "drawer-more" && (
                                <div className="absolute bottom-8 left-0 w-full bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 text-xs font-medium text-slate-700">
                                    <button
                                        onClick={() => {
                                            toast.info(`Sent screening email to ${selectedCandidate.email}`);
                                            setOpenActionMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Send className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Send Email</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.success("AI Summary copied to clipboard!");
                                            navigator.clipboard?.writeText(selectedCandidate.summary);
                                            setOpenActionMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Copy AI Summary</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: View Full Profile */}
            {showFullProfileModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                {selectedCandidate.avatar ? (
                                    <img
                                        src={selectedCandidate.avatar}
                                        alt={selectedCandidate.name}
                                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 font-bold text-xl flex items-center justify-center">
                                        {selectedCandidate.initials || "SH"}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-900">
                                        {selectedCandidate.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {selectedCandidate.role} · {selectedCandidate.experience} Experience
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <span
                                            className={`px-3 py-0.5 rounded-full text-xs font-semibold ${getStatusPill(
                                                selectedCandidate.status
                                            )}`}
                                        >
                                            {selectedCandidate.status}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {selectedCandidate.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFullProfileModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Match & ATS Overview */}
                        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl">
                            <div className="text-center">
                                <div className="text-xs text-slate-500">ATS Score</div>
                                <div className="text-2xl font-bold text-emerald-600 mt-0.5">
                                    {selectedCandidate.atsScore}/100
                                </div>
                            </div>
                            <div className="text-center border-x border-slate-200">
                                <div className="text-xs text-slate-500">AI Match</div>
                                <div className="text-2xl font-bold text-emerald-600 mt-0.5">
                                    {selectedCandidate.matchScore}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-slate-500">Skill Alignment</div>
                                <div className="text-2xl font-bold text-violet-600 mt-0.5">
                                    {selectedCandidate.skillsMatchPct}%
                                </div>
                            </div>
                        </div>

                        {/* AI Summary */}
                        <div className="p-5 rounded-2xl bg-violet-50/70 border border-violet-100/80">
                            <div className="flex items-center gap-2 text-xs font-bold text-violet-800 uppercase tracking-wider mb-2">
                                <Sparkles className="w-4 h-4 text-violet-600" />
                                <span>AI Candidate Assessment</span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedCandidate.summary}
                            </p>
                        </div>

                        {/* Skills Breakdown */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Technical Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedCandidate.allSkills.map((sk) => (
                                    <span
                                        key={sk}
                                        className="px-3 py-1 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-xs"
                                    >
                                        ✓ {sk}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Experience & Education */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                                    <Briefcase className="w-3.5 h-3.5" /> Recent Work Experience
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                    {selectedCandidate.currentRole}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">Full-time · 2023 - Present</div>
                            </div>

                            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                                    <GraduationCap className="w-3.5 h-3.5" /> Education
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                    {selectedCandidate.education}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">Graduated with Distinction</div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setShowFullProfileModal(false)}
                                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleStatusChange(selectedCandidate.id, "Shortlisted");
                                    setShowFullProfileModal(false);
                                }}
                                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-500/20"
                            >
                                Shortlist Candidate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Schedule Interview */}
            {showInterviewModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Schedule Candidate Interview</h3>
                                    <p className="text-xs text-slate-500">{selectedCandidate.name} • {selectedCandidate.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowInterviewModal(false);
                                    setGeneratedLinkData(null);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {!generatedLinkData ? (
                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Interview Round</label>
                                    <select
                                        value={schedRound}
                                        onChange={(e) => setSchedRound(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium"
                                    >
                                        <option>Technical Screening Round (45 mins)</option>
                                        <option>AI Live Video Assessment (30 mins)</option>
                                        <option>Full-Stack &amp; Coding Round (60 mins)</option>
                                        <option>HR &amp; Cultural Fit Interview (30 mins)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={schedDate}
                                            onChange={(e) => setSchedDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">Time</label>
                                        <input
                                            type="time"
                                            value={schedTime}
                                            onChange={(e) => setSchedTime(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Estimated Duration</label>
                                    <select
                                        value={schedDuration}
                                        onChange={(e) => setSchedDuration(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium"
                                    >
                                        <option>45 Minutes</option>
                                        <option>30 Minutes</option>
                                        <option>60 Minutes</option>
                                        <option>15 Minutes</option>
                                    </select>
                                </div>

                                <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-2xl flex items-center gap-2.5 text-slate-700 font-medium">
                                    <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
                                    <span>AI will prepare personalized questions from <strong>{selectedCandidate.name}'s resume</strong>.</span>
                                </div>

                                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowInterviewModal(false)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const code = `ava-${selectedCandidate.id}`;
                                            const dateObj = new Date(schedDate);
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

                                            const newIv = {
                                                id: `iv-${selectedCandidate.id}`,
                                                candidateId: selectedCandidate.id,
                                                name: selectedCandidate.name,
                                                email: selectedCandidate.email,
                                                avatar: selectedCandidate.avatar,
                                                role: selectedCandidate.role,
                                                company: "AvaHire Technologies Pvt. Ltd.",
                                                date: formattedDate,
                                                dayOfWeek: dayName,
                                                time: schedTime ? `${schedTime} AM` : "11:00 AM",
                                                timeZone: "IST",
                                                duration: schedDuration,
                                                linkCode: code,
                                                status: "Active",
                                                expiry: "05:00 Remaining",
                                                expiryTime: `${formattedDate}, ${schedTime}`,
                                                isExpired: false
                                            };

                                            addOrUpdateInterview(newIv);
                                            setGeneratedLinkData(newIv);
                                            handleStatusChange(selectedCandidate.id, "Shortlisted");
                                            toast.success(`Interview invitation created for ${selectedCandidate.name}!`);
                                        }}
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/25 active:scale-[0.98] transition"
                                    >
                                        Generate &amp; Schedule
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-xs animate-in zoom-in-95">
                                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-emerald-800 font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Interview link successfully generated &amp; linked to resume!</span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-slate-700 block">Candidate Interview Link</label>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-violet-700 font-bold break-all flex items-center justify-between gap-2">
                                        <span>{`${window.location.origin}/i/${generatedLinkData.linkCode}`}</span>
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/i/${generatedLinkData.linkCode}`;
                                                navigator.clipboard.writeText(url);
                                                setCopiedInterviewLink(true);
                                                toast.success("Copied candidate link!");
                                                setTimeout(() => setCopiedInterviewLink(false), 2000);
                                            }}
                                            className="p-1 text-slate-500 hover:text-violet-600"
                                            title="Copy link"
                                        >
                                            {copiedInterviewLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 p-3 bg-slate-50/70 rounded-2xl border border-slate-100 text-slate-600">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Scheduled For:</span>
                                        <span className="font-semibold text-slate-800">{generatedLinkData.date} at {generatedLinkData.time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Target Role:</span>
                                        <span className="font-semibold text-slate-800">{generatedLinkData.role}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/i/${generatedLinkData.linkCode}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success("Interview URL copied to clipboard!");
                                        }}
                                        className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Link</span>
                                    </button>
                                    <a
                                        href={`/i/${generatedLinkData.linkCode}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/25 flex items-center justify-center gap-1.5 text-center"
                                    >
                                        <span>Open Candidate Portal</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Filters Popover */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm">Filter Resumes</h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Job Role</label>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
                                >
                                    <option value="All">All Roles</option>
                                    <option value="Python Developer">Python Developer</option>
                                    <option value="Data Analyst">Data Analyst</option>
                                    <option value="Frontend Developer">Frontend Developer</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                    Minimum ATS Score: {filterMinScore}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="90"
                                    step="5"
                                    value={filterMinScore}
                                    onChange={(e) => setFilterMinScore(Number(e.target.value))}
                                    className="w-full accent-violet-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={() => {
                                    setFilterRole("All");
                                    setFilterMinScore(0);
                                }}
                                className="text-xs text-violet-600 font-semibold hover:underline"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resumes;
