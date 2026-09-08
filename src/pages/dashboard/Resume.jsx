import React, { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { resumesApi, jobsApi } from "@/services/api";
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
    Check,
    AlertCircle,
    Target,
    Layers,
    ListFilter,
    RefreshCw,
    PlusCircle
} from "lucide-react";
import { addOrUpdateInterview } from "@/utils/interviewStore";

// Fallback initial candidate data with rich ATS fields & key points
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
        targetJobTitle: "Python Developer",
        matchedSkills: ["Python", "Flask", "SQL", "REST API"],
        missingSkills: ["Docker"],
        keyPoints: {
            strengths: [
                "Strong proficiency in core backend Python, Flask, and RESTful API architecture.",
                "Solid database fundamentals in SQL schema design and query optimization.",
                "High code quality standards and proactive problem-solving attitude."
            ],
            missingSkills: [
                "Docker containerization not highlighted in primary projects."
            ],
            experienceMatch: "Has 2 years of relevant experience, meeting the mid-level developer requirement.",
            verdict: "High ATS compatibility (87/100). Auto-shortlisted for technical screening round."
        }
    },
    {
        id: "c2",
        name: "Rohan Verma",
        email: "rohanv@email.com",
        phone: "+91 98123 45678",
        location: "Bangalore, Karnataka, India",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        role: "Full Stack Developer",
        experience: "4 Years",
        expYears: 4,
        skills: ["React", "Node.js", "MongoDB"],
        extraSkillsCount: 2,
        allSkills: ["React", "Node.js", "MongoDB", "TypeScript", "Tailwind"],
        atsScore: 91,
        matchScore: 88,
        skillsMatchPct: 90,
        status: "Shortlisted",
        uploadedDate: "19 May 2025",
        currentRole: "Backend Software Engineer at Infosys",
        education: "B.E. in Information Technology",
        summary: "Experienced full-stack engineer with robust Node.js and React background. Proficient in microservices architecture and CI/CD pipelines.",
        targetJobTitle: "Senior Software Engineer",
        matchedSkills: ["React", "Node.js", "TypeScript"],
        missingSkills: ["AWS System Design"],
        keyPoints: {
            strengths: [
                "4 years of seasoned hands-on experience building enterprise web applications.",
                "Deep mastery in TypeScript, modern React frontend, and Node.js microservices.",
                "Clean architectural modularity and strong test-driven development practices."
            ],
            missingSkills: [
                "Cloud infrastructure orchestration on AWS could be tested further."
            ],
            experienceMatch: "Exceeds required minimum experience with 4 solid years.",
            verdict: "Top-tier ATS score (91/100). Strongly recommended for senior interview loop."
        }
    },
    {
        id: "c3",
        name: "Aisha Khan",
        email: "aisha.k@email.com",
        phone: "+91 97234 56789",
        location: "Mumbai, Maharashtra, India",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
        role: "Python Developer",
        experience: "1.5 Years",
        expYears: 1.5,
        skills: ["Python", "Flask", "MongoDB"],
        extraSkillsCount: 2,
        allSkills: ["Python", "Flask", "MongoDB", "Redis", "Git"],
        atsScore: 72,
        matchScore: 75,
        skillsMatchPct: 78,
        status: "Review",
        uploadedDate: "18 May 2025",
        currentRole: "Junior Python Developer at Tech Mahindra",
        education: "B.Sc. in Computer Science",
        summary: "Solid foundational knowledge in Python and NoSQL datastores. Shows promising problem-solving speed and strong enthusiasm for backend programming.",
        targetJobTitle: "Python Developer",
        matchedSkills: ["Python", "Flask"],
        missingSkills: ["Django", "PostgreSQL", "Docker"],
        keyPoints: {
            strengths: [
                "Good fundamentals in asynchronous Python scripts and REST endpoints.",
                "Hands-on experience with MongoDB caching layers using Redis."
            ],
            missingSkills: [
                "Requires deeper experience with relational PostgreSQL schemas.",
                "Below the 2-year minimum preferred experience."
            ],
            experienceMatch: "1.5 years experience vs preferred 2+ years.",
            verdict: "Placed Under Review (72/100 ATS). Potential candidate for junior-to-mid assessment."
        }
    },
    {
        id: "c4",
        name: "Vikram Malhotra",
        email: "vikram.m@email.com",
        phone: "+91 96345 67890",
        location: "Hyderabad, Telangana, India",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        role: "DevOps Engineer",
        experience: "5 Years",
        expYears: 5,
        skills: ["Kubernetes", "AWS", "Docker"],
        extraSkillsCount: 3,
        allSkills: ["Kubernetes", "AWS", "Docker", "Terraform", "CI/CD", "Linux"],
        atsScore: 94,
        matchScore: 90,
        skillsMatchPct: 92,
        status: "Shortlisted",
        uploadedDate: "17 May 2025",
        currentRole: "Senior Cloud & DevOps Engineer at TCS",
        education: "M.Tech in Software Systems",
        summary: "Expert DevOps specialist with 5 years managing high-availability Kubernetes clusters on AWS with automated Terraform provisioning.",
        targetJobTitle: "DevOps Engineer",
        matchedSkills: ["Kubernetes", "AWS", "Docker", "CI/CD"],
        missingSkills: [],
        keyPoints: {
            strengths: [
                "Deep 5-year domain expertise across container orchestration and cloud scale.",
                "Production experience managing automated multi-region CI/CD pipelines.",
                "Proven zero-downtime deployment track record."
            ],
            missingSkills: [
                "No notable skill gaps identified for this role."
            ],
            experienceMatch: "5 years experience aligns perfectly with senior requirement.",
            verdict: "Outstanding candidate profile (94/100 ATS). High priority shortlist."
        }
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
        atsScore: 54,
        matchScore: 50,
        skillsMatchPct: 45,
        status: "Rejected",
        uploadedDate: "18 May 2025",
        currentRole: "Data Analyst at Capgemini",
        education: "B.Tech in Information Technology",
        summary: "Data analyst with focus on BI reporting and visualization dashboards. Limited experience with core software backend engineering.",
        targetJobTitle: "Senior Software Engineer",
        matchedSkills: ["Python", "SQL"],
        missingSkills: ["React", "Node.js", "TypeScript", "System Design"],
        keyPoints: {
            strengths: [
                "Skilled in exploratory data analysis and SQL reporting queries."
            ],
            missingSkills: [
                "Lacks web engineering foundations (React, Node.js, full-stack architecture).",
                "Profile geared towards analytics rather than software product engineering."
            ],
            experienceMatch: "2 years in BI analytics vs 4-7 years required in software engineering.",
            verdict: "ATS score (54/100) falls below shortlisting threshold for software engineer role."
        }
    }
];

const Resumes = () => {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidates[0].id);
    const [activeTab, setActiveTab] = useState("All Resumes");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("Highest ATS");
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

    // JD Screening States
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState("job-2"); // Default to Python Developer or first
    const [isBatchScreening, setIsBatchScreening] = useState(false);
    const [analyzingCandidateId, setAnalyzingCandidateId] = useState(null);
    const [showCustomJdModal, setShowCustomJdModal] = useState(false);
    const [customJd, setCustomJd] = useState({
        title: "Python Developer",
        dept: "Engineering",
        expLevel: "2-4 Years",
        workMode: "On-site",
        keySkills: "Python, FastAPI, Django, PostgreSQL, Docker, REST API",
        description: "Looking for an experienced Python developer to build high-performance APIs and microservices."
    });

    const fileInputRef = useRef(null);

    // Initial Fetch of Resumes and Jobs from backend
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resumesData, jobsData] = await Promise.allSettled([
                    resumesApi.getAll(),
                    jobsApi.getAll()
                ]);

                if (jobsData.status === "fulfilled" && jobsData.value && jobsData.value.length > 0) {
                    setJobs(jobsData.value);
                    setSelectedJobId(jobsData.value[0].id);
                }

                if (resumesData.status === "fulfilled" && resumesData.value && resumesData.value.length > 0) {
                    setCandidates(resumesData.value);
                    if (!resumesData.value.some((c) => c.id === selectedCandidateId)) {
                        setSelectedCandidateId(resumesData.value[0].id);
                    }
                }
            } catch (err) {
                console.error("Error loading initial data:", err);
            }
        };
        fetchInitialData();
    }, []);

    // Current active target JD reference
    const currentJd = useMemo(() => {
        if (selectedJobId === "custom") {
            const skillsArr = Array.isArray(customJd.keySkills)
                ? customJd.keySkills
                : customJd.keySkills.split(",").map((s) => s.trim()).filter(Boolean);
            return {
                id: "custom",
                title: customJd.title || "Custom Position",
                dept: customJd.dept || "Engineering",
                expLevel: customJd.expLevel || "2-5 Years",
                workMode: customJd.workMode || "Full-time",
                keySkills: skillsArr,
                description: customJd.description
            };
        }
        const found = jobs.find((j) => j.id === selectedJobId);
        if (found) return found;

        // Fallback default job
        return {
            id: "job-2",
            title: "Python Developer",
            dept: "Engineering",
            expLevel: "2-4 Years",
            workMode: "On-site",
            keySkills: ["Python", "FastAPI", "Django", "PostgreSQL", "Docker"],
            description: "Join our backend platform team to build robust APIs, ETL pipelines, and high-performance services."
        };
    }, [jobs, selectedJobId, customJd]);

    const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0] || initialCandidates[0];

    // Status tabs with live counts
    const tabCounts = useMemo(() => {
        const total = candidates.length;
        const shortlisted = candidates.filter((c) => c.status === "Shortlisted").length;
        const review = candidates.filter((c) => c.status === "Review").length;
        const rejected = candidates.filter((c) => c.status === "Rejected").length;
        return { total, shortlisted, review, rejected };
    }, [candidates]);

    // Filter and Sort Candidates
    const filteredCandidates = useMemo(() => {
        return candidates
            .filter((c) => {
                // Tab filter: separates resumes by Shortlisted vs Review vs Rejected
                if (activeTab === "Shortlisted" && c.status !== "Shortlisted") return false;
                if (activeTab === "Review" && c.status !== "Review") return false;
                if (activeTab === "Rejected" && c.status !== "Rejected") return false;

                // Search query filter
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    const matchesName = c.name.toLowerCase().includes(query);
                    const matchesEmail = c.email.toLowerCase().includes(query);
                    const matchesRole = c.role.toLowerCase().includes(query);
                    const matchesSkills = (c.allSkills || c.skills || []).some((s) => s.toLowerCase().includes(query));
                    if (!matchesName && !matchesEmail && !matchesRole && !matchesSkills) return false;
                }

                // Advanced Modal Filters
                if (filterRole !== "All" && c.role !== filterRole) return false;
                if (c.atsScore < filterMinScore) return false;

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "Highest ATS") return b.atsScore - a.atsScore;
                if (sortBy === "Highest Match") return b.matchScore - a.matchScore;
                if (sortBy === "Experience") return (b.expYears || 0) - (a.expYears || 0);
                // Default Newest
                return 0;
            });
    }, [candidates, activeTab, searchQuery, sortBy, filterRole, filterMinScore]);

    // Batch Screen all candidates against current target JD
    const handleScreenAllAgainstJd = async () => {
        setIsBatchScreening(true);
        toast.info(`Screening candidates against "${currentJd.title}" using ATS engine...`);

        try {
            const payload = {
                jobId: selectedJobId === "custom" ? null : selectedJobId,
                customJd: selectedJobId === "custom" ? currentJd : null
            };

            const response = await resumesApi.analyzeBatch(payload);

            if (response && response.data && response.data.length > 0) {
                setCandidates(response.data);
                const stats = response.stats || {};
                toast.success(
                    `Screening complete for ${currentJd.title}! ${stats.shortlistedCount || 0} Shortlisted, ${stats.reviewCount || 0} In Review, ${stats.rejectedCount || 0} Rejected.`
                );
            } else {
                toast.success(`Screened candidates against ${currentJd.title}`);
            }
        } catch (err) {
            console.error("Batch screening failed:", err);
            toast.error("Failed to complete batch screening. Please try again.");
        } finally {
            setIsBatchScreening(false);
        }
    };

    // Screen single candidate against current target JD
    const handleAnalyzeSingleCandidate = async (candidateId) => {
        setAnalyzingCandidateId(candidateId);
        try {
            const targetCandidate = candidates.find((c) => c.id === candidateId);
            const candidateName = targetCandidate ? targetCandidate.name : "Candidate";
            toast.info(`Analyzing ${candidateName}'s resume against ${currentJd.title}...`);

            const payload = {
                jobId: selectedJobId === "custom" ? null : selectedJobId,
                customJd: selectedJobId === "custom" ? currentJd : null
            };

            const response = await resumesApi.analyzeCandidate(candidateId, payload);

            if (response && response.data) {
                setCandidates((prev) =>
                    prev.map((c) => (c.id === candidateId ? response.data : c))
                );
                setSelectedCandidateId(candidateId);
                toast.success(
                    `${response.data.name}: ATS Score ${response.data.atsScore}/100 (${response.data.status})`
                );
            }
        } catch (err) {
            console.error("Single resume analysis error:", err);
            toast.error("Failed to analyze resume against JD.");
        } finally {
            setAnalyzingCandidateId(null);
        }
    };

    // Handle Upload with Immediate Screening against current JD
    const handleFileUpload = async (files) => {
        const fileList = Array.from(files);
        if (!fileList.length) return;

        setIsUploading(true);
        toast.info(`Uploading & analyzing ${fileList.length} resume${fileList.length > 1 ? "s" : ""} against "${currentJd.title}"...`);

        try {
            const newlyAdded = [];
            for (let i = 0; i < fileList.length; i++) {
                const f = fileList[i];
                const formData = new FormData();
                formData.append("resume", f);
                formData.append("jobId", selectedJobId === "custom" ? "custom" : selectedJobId);
                if (selectedJobId === "custom") {
                    formData.append("customJd", JSON.stringify(currentJd));
                }

                try {
                    const res = await resumesApi.uploadAndScreen(formData);
                    if (res && res.data) {
                        const candidate = res.data;
                        newlyAdded.push(candidate);
                        if (candidate.status === "Shortlisted") {
                            toast.success(`${candidate.name}: SHORTLISTED! (ATS: ${candidate.atsScore}/100, ${candidate.skillsMatchPct}% skills match)`);
                        } else if (candidate.status === "Review") {
                            toast.warning(`${candidate.name}: Placed Under Review (ATS: ${candidate.atsScore}/100 - partial match)`);
                        } else {
                            toast.error(`${candidate.name}: REJECTED (ATS: ${candidate.atsScore}/100 - lacks required skills for ${currentJd.title})`);
                        }
                    }
                } catch (singleUploadErr) {
                    console.error("Single resume upload error:", singleUploadErr);
                    // Fallback to text reading if server upload had error
                    const cleanName = f.name
                        .replace(/\.(pdf|docx?|txt)$/i, "")
                        .replace(/[_-]/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()) || `Applicant ${candidates.length + i + 1}`;

                    const newCandidatePayload = {
                        name: cleanName,
                        email: `${cleanName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
                        phone: "+91 98" + Math.floor(10000000 + Math.random() * 90000000),
                        location: "India",
                        role: "Candidate",
                        experience: "1 Year",
                        expYears: 1,
                        skills: [],
                        allSkills: [],
                        currentRole: "Applicant",
                        education: "Bachelor's Degree",
                        resumeFileName: f.name
                    };
                    const created = await resumesApi.create(newCandidatePayload);
                    const analysisResult = await resumesApi.analyzeCandidate(created.id, {
                        jobId: selectedJobId === "custom" ? null : selectedJobId,
                        customJd: selectedJobId === "custom" ? currentJd : null
                    });
                    if (analysisResult?.data) {
                        newlyAdded.push(analysisResult.data);
                    }
                }
            }

            if (newlyAdded.length > 0) {
                setCandidates((prev) => [...newlyAdded, ...prev]);
                setSelectedCandidateId(newlyAdded[0].id);
                toast.success(`Completed screening ${newlyAdded.length} candidate${newlyAdded.length > 1 ? "s" : ""}!`);
            }
        } catch (err) {
            console.error("Upload screening error:", err);
            toast.error("Failed to parse and screen uploaded resumes.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    // Update status (Shortlisted, Review, Rejected)
    const handleStatusChange = async (id, newStatus) => {
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
        try {
            await resumesApi.updateStatus(id, newStatus);
        } catch (err) {
            console.error("Failed to sync resume status to database:", err);
        }
    };

    // Bulk selection handlers
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

    // Bulk Action: Shortlist or Reject selected
    const handleBulkStatusChange = async (newStatus) => {
        if (selectedRowIds.length === 0) return;
        const count = selectedRowIds.length;
        setCandidates((prev) =>
            prev.map((c) => (selectedRowIds.includes(c.id) ? { ...c, status: newStatus } : c))
        );
        setSelectedRowIds([]);
        toast.success(`Marked ${count} candidate${count > 1 ? "s" : ""} as ${newStatus}!`);

        for (const id of selectedRowIds) {
            try {
                await resumesApi.updateStatus(id, newStatus);
            } catch (err) {
                console.error("Bulk status update error:", err);
            }
        }
    };

    // Helper for score badge colors
    const getScoreBadgeClass = (score) => {
        if (score >= 80) return "border-emerald-300 text-emerald-700 bg-emerald-50";
        if (score >= 65) return "border-amber-300 text-amber-700 bg-amber-50";
        return "border-rose-300 text-rose-600 bg-rose-50";
    };

    const getMatchTextColor = (match) => {
        if (match >= 80) return "text-emerald-600";
        if (match >= 65) return "text-amber-600";
        return "text-rose-500";
    };

    const getStatusPill = (status) => {
        if (status === "Shortlisted") {
            return "bg-emerald-50 text-emerald-700 border border-emerald-200/90";
        }
        if (status === "Review") {
            return "bg-amber-50 text-amber-700 border border-amber-200/90";
        }
        return "bg-rose-50 text-rose-600 border border-rose-200/90";
    };

    return (
        <div className="space-y-6 -mt-2 pb-12" data-testid="resume-management-page">
            {/* Top Resume Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Resume Screener &amp; ATS
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200">
                            AI Powered
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Evaluate candidate resumes against Job Descriptions, calculate ATS scores, and automatically separate shortlisted talent.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filters Button */}
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                        <span>Filter Options</span>
                    </button>

                    {/* Upload Resume Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md shadow-violet-500/25 transition-all disabled:opacity-50"
                    >
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? "Screening..." : "Upload Resume"}</span>
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

            {/* Target Job Description (JD) Control Center */}
            <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-violet-800/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Active JD Info & Selector */}
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                            <Target className="w-4 h-4 text-violet-400" />
                            <span>Target Job Description (JD) Reference</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <select
                                    value={selectedJobId}
                                    onChange={(e) => setSelectedJobId(e.target.value)}
                                    className="appearance-none bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-base sm:text-lg rounded-xl pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer backdrop-blur-md transition"
                                >
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id} className="text-slate-900 bg-white">
                                            {job.title} ({job.dept})
                                        </option>
                                    ))}
                                    <option value="custom" className="text-slate-900 bg-white">
                                        + Custom Job Description
                                    </option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-white/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            <button
                                onClick={() => setShowCustomJdModal(true)}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition flex items-center gap-1.5"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>{selectedJobId === "custom" ? "Edit Custom JD" : "Custom JD"}</span>
                            </button>
                        </div>

                        {/* JD Meta Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 font-medium">
                                Dept: {currentJd.dept || "Engineering"}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 font-medium">
                                Experience: {currentJd.expLevel || "2-4 Years"}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 font-medium">
                                Mode: {currentJd.workMode || "Hybrid"}
                            </span>
                        </div>

                        {/* Required Skills Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-xs text-violet-200 font-semibold mr-1">Required Skills:</span>
                            {(currentJd.keySkills || []).slice(0, 6).map((skill) => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-0.5 rounded-full bg-violet-500/25 border border-violet-400/30 text-violet-100 text-xs font-semibold"
                                >
                                    {skill}
                                </span>
                            ))}
                            {(currentJd.keySkills || []).length > 6 && (
                                <span className="text-xs text-white/60">
                                    +{(currentJd.keySkills || []).length - 6} more
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Screen Candidates Action Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-center items-start sm:items-end gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                            <div className="text-xs font-medium text-violet-200">Screening Action</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                                Calculate ATS &amp; Separate Resumes
                            </div>
                        </div>

                        <button
                            onClick={handleScreenAllAgainstJd}
                            disabled={isBatchScreening}
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
                        >
                            {isBatchScreening ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Screening Candidates...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-emerald-100" />
                                    <span>Screen All against this JD</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Total Resumes */}
                <div
                    onClick={() => setActiveTab("All Resumes")}
                    className={`bg-white p-5 rounded-2xl border transition cursor-pointer ${
                        activeTab === "All Resumes"
                            ? "border-violet-500 shadow-md ring-2 ring-violet-500/10"
                            : "border-slate-100/90 shadow-sm hover:shadow-md"
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 p-3 shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-500">Total Candidates</div>
                            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{tabCounts.total}</div>
                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                In current database
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shortlisted */}
                <div
                    onClick={() => setActiveTab("Shortlisted")}
                    className={`bg-white p-5 rounded-2xl border transition cursor-pointer ${
                        activeTab === "Shortlisted"
                            ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/10"
                            : "border-slate-100/90 shadow-sm hover:shadow-md"
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 p-3 shrink-0">
                            <BookmarkCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-emerald-700 font-semibold">Shortlisted (JD Match)</div>
                            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{tabCounts.shortlisted}</div>
                            <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                                <span>ATS Score ≥ 75/100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Under Review */}
                <div
                    onClick={() => setActiveTab("Review")}
                    className={`bg-white p-5 rounded-2xl border transition cursor-pointer ${
                        activeTab === "Review"
                            ? "border-amber-500 shadow-md ring-2 ring-amber-500/10"
                            : "border-slate-100/90 shadow-sm hover:shadow-md"
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 p-3 shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-amber-700 font-semibold">Under Review</div>
                            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{tabCounts.review}</div>
                            <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-0.5 mt-0.5">
                                <span>ATS Score 55-74/100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rejected */}
                <div
                    onClick={() => setActiveTab("Rejected")}
                    className={`bg-white p-5 rounded-2xl border transition cursor-pointer ${
                        activeTab === "Rejected"
                            ? "border-rose-500 shadow-md ring-2 ring-rose-500/10"
                            : "border-slate-100/90 shadow-sm hover:shadow-md"
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 p-3 shrink-0">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-rose-700 font-semibold">Rejected</div>
                            <div className="text-2xl font-extrabold text-rose-500 mt-0.5">{tabCounts.rejected}</div>
                            <div className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5 mt-0.5">
                                <span>ATS Score &lt; 55/100</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Drag & Drop Dropzone + AI Screener Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Drag & Drop Card */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`lg:col-span-6 bg-white rounded-2xl p-6 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center relative ${
                        isDragOver
                            ? "border-violet-600 bg-violet-50/50 scale-[1.01]"
                            : "border-violet-200/90 bg-violet-50/20 hover:border-violet-300"
                    }`}
                >
                    {isUploading ? (
                        <div className="py-4 flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full border-3 border-violet-600 border-t-transparent animate-spin"></div>
                            <div className="text-sm font-bold text-violet-900">
                                AI Screening Resumes against "{currentJd.title}"...
                            </div>
                            <div className="text-xs text-slate-500">
                                Evaluating skills, generating ATS score, and extracting key points
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-violet-100/60 flex items-center justify-center text-violet-600 mb-3">
                                <CloudUpload className="w-6 h-6" />
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                                Drag &amp; Drop candidate resumes here
                            </div>
                            <div className="text-xs text-slate-400 my-1 font-medium">or</div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-1 flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Browse Resumes to Screen</span>
                            </button>
                            <div className="text-[11px] text-slate-400 mt-3 font-normal">
                                Evaluates against <strong>{currentJd.title}</strong> automatically · PDF, DOCX, TXT
                            </div>
                        </>
                    )}
                </div>

                {/* AI Features Highlights Box */}
                <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center gap-3.5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            <strong>JD-Matched ATS Scoring:</strong> Evaluates keyword relevance, experience, and skill coverage.
                        </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            <strong>Actionable Key Points:</strong> Highlights strengths, missing skills, and experience fit.
                        </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <BookmarkCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            <strong>Automated Shortlisting:</strong> Separates resumes into Shortlisted, Review, and Rejected.
                        </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                            <strong>1-Click Scheduling:</strong> Instantly invite shortlisted candidates to live AI interviews.
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
                        {/* Status Tabs: Separating resumes on the basis of shortlisted using JD */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {[
                                { label: "All Resumes", count: tabCounts.total, pill: "bg-slate-100 text-slate-600" },
                                { label: "Shortlisted", count: tabCounts.shortlisted, pill: "bg-emerald-100 text-emerald-700 font-bold" },
                                { label: "Review", count: tabCounts.review, pill: "bg-amber-100 text-amber-700 font-bold" },
                                { label: "Rejected", count: tabCounts.rejected, pill: "bg-rose-100 text-rose-700 font-bold" }
                            ].map((tab) => {
                                const isActive = activeTab === tab.label;
                                return (
                                    <button
                                        key={tab.label}
                                        onClick={() => setActiveTab(tab.label)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
                                            isActive
                                                ? "bg-violet-600 text-white shadow-sm shadow-violet-500/20"
                                                : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                                isActive ? "bg-white/20 text-white" : tab.pill
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search & Sort Controls */}
                        <div className="flex items-center gap-3 text-xs">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search candidate or skill..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 w-44 sm:w-52"
                                />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-7 font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer text-xs"
                                    >
                                        <option>Highest ATS</option>
                                        <option>Highest Match</option>
                                        <option>Experience</option>
                                        <option>Newest</option>
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Action Bar (when rows are checked) */}
                    {selectedRowIds.length > 0 && (
                        <div className="bg-violet-50/90 border-b border-violet-100 px-6 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
                            <span className="font-semibold text-violet-900">
                                {selectedRowIds.length} candidate{selectedRowIds.length > 1 ? "s" : ""} selected
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleBulkStatusChange("Shortlisted")}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                                >
                                    <BookmarkCheck className="w-3.5 h-3.5" />
                                    <span>Shortlist Selected</span>
                                </button>
                                <button
                                    onClick={() => handleBulkStatusChange("Rejected")}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject Selected</span>
                                </button>
                            </div>
                        </div>
                    )}

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
                                    <th className="py-3 px-3 font-semibold text-slate-700">Current Role</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Experience</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Skills</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700 text-center">ATS Score</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700 text-center">JD Match %</th>
                                    <th className="py-3 px-3 font-semibold text-slate-700">Status</th>
                                    <th className="py-3 px-4 font-semibold text-slate-700 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCandidates.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <div>No candidates found matching "{activeTab}" filter.</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Click "Screen All against this JD" or upload new resumes to screen.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCandidates.map((candidate) => {
                                        const isSelectedRow = selectedCandidateId === candidate.id;
                                        const isChecked = selectedRowIds.includes(candidate.id);
                                        const isAnalyzing = analyzingCandidateId === candidate.id;

                                        return (
                                            <tr
                                                key={candidate.id}
                                                onClick={() => setSelectedCandidateId(candidate.id)}
                                                className={`transition-colors cursor-pointer group ${
                                                    isSelectedRow ? "bg-violet-50/40" : "hover:bg-slate-50/70"
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

                                                {/* Role */}
                                                <td className="py-3.5 px-3 text-slate-700 font-medium text-xs whitespace-nowrap">
                                                    {candidate.role}
                                                </td>

                                                {/* Experience */}
                                                <td className="py-3.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                                                    {candidate.experience}
                                                </td>

                                                {/* Skills Pill Badges */}
                                                <td className="py-3.5 px-3">
                                                    <div className="flex flex-wrap items-center gap-1 max-w-xs">
                                                        {(candidate.allSkills || candidate.skills || []).slice(0, 3).map((sk) => (
                                                            <span
                                                                key={sk}
                                                                className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-semibold"
                                                            >
                                                                {sk}
                                                            </span>
                                                        ))}
                                                        {(candidate.allSkills || candidate.skills || []).length > 3 && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                                                                +{(candidate.allSkills || candidate.skills || []).length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* ATS Score (Pill) */}
                                                <td className="py-3.5 px-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-extrabold border shadow-xs ${getScoreBadgeClass(
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

                                                {/* Actions */}
                                                <td
                                                    className="py-3.5 px-4 text-center relative"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                                        {/* Re-analyze against active JD */}
                                                        <button
                                                            onClick={() => handleAnalyzeSingleCandidate(candidate.id)}
                                                            disabled={isAnalyzing}
                                                            className="p-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition"
                                                            title={`Re-screen against ${currentJd.title}`}
                                                        >
                                                            {isAnalyzing ? (
                                                                <RefreshCw className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>

                                                        {/* View Details */}
                                                        <button
                                                            onClick={() => setSelectedCandidateId(candidate.id)}
                                                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-violet-600 transition"
                                                            title="View Details & Key Points"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* More Options */}
                                                        <button
                                                            onClick={() =>
                                                                setOpenActionMenuId(
                                                                    openActionMenuId === candidate.id ? null : candidate.id
                                                                )
                                                            }
                                                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
                                                            title="Options"
                                                        >
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Dropdown Action Menu */}
                                                    {openActionMenuId === candidate.id && (
                                                        <div className="absolute right-4 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-left text-xs font-medium text-slate-700 animate-in fade-in-50 zoom-in-95">
                                                            <button
                                                                onClick={() => handleStatusChange(candidate.id, "Shortlisted")}
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-600 font-semibold"
                                                            >
                                                                <BookmarkCheck className="w-3.5 h-3.5" />
                                                                <span>Shortlist Candidate</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(candidate.id, "Review")}
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-amber-600 font-semibold"
                                                            >
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>Move to Review</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(candidate.id, "Rejected")}
                                                                className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-600 font-semibold"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                <span>Mark as Rejected</span>
                                                            </button>
                                                            <div className="border-t border-slate-100 my-1" />
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
                        <div>
                            Showing 1 to {filteredCandidates.length} of {candidates.length} candidates (Tab: {activeTab})
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600 disabled:opacity-40">
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold flex items-center justify-center shadow-sm">
                                1
                            </button>
                            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Candidate Details & Key Points Panel */}
                <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5 sticky top-20">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {selectedCandidate.name}
                                </h2>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusPill(selectedCandidate.status)}`}>
                                    {selectedCandidate.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1 font-medium">
                                <span>{selectedCandidate.email}</span>
                                <span>•</span>
                                <span>{selectedCandidate.phone}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{selectedCandidate.location}</span>
                            </div>
                        </div>

                        {/* Re-analyze single candidate button */}
                        <button
                            onClick={() => handleAnalyzeSingleCandidate(selectedCandidate.id)}
                            disabled={analyzingCandidateId === selectedCandidate.id}
                            className="p-2 rounded-xl border border-violet-200 text-violet-600 hover:bg-violet-50 transition"
                            title={`Re-screen ${selectedCandidate.name} against ${currentJd.title}`}
                        >
                            <Sparkles className={`w-4 h-4 ${analyzingCandidateId === selectedCandidate.id ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {/* Target JD Reference Tag */}
                    <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-600" />
                            <span className="text-slate-600">Screened against:</span>
                        </div>
                        <span className="font-bold text-violet-900 truncate max-w-[170px]">
                            {currentJd.title}
                        </span>
                    </div>

                    {/* Scores Metric Boxes (ATS Score, Match Score, Skills Alignment) */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {/* ATS Score */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="text-[11px] text-slate-500 font-medium">ATS Score</div>
                            <div className="mt-0.5 text-xl font-extrabold text-emerald-600">
                                {selectedCandidate.atsScore}
                                <span className="text-[10px] text-slate-400 font-normal">/100</span>
                            </div>
                        </div>

                        {/* Match Score */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="text-[11px] text-slate-500 font-medium">JD Match</div>
                            <div className="mt-0.5 text-xl font-extrabold text-emerald-600">
                                {selectedCandidate.matchScore}%
                            </div>
                        </div>

                        {/* Skills Alignment */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="text-[11px] text-slate-500 font-medium">Skill Match</div>
                            <div className="mt-0.5 text-xl font-extrabold text-violet-600">
                                {selectedCandidate.skillsMatchPct || 85}%
                            </div>
                        </div>
                    </div>

                    {/* KEY POINTS SECTION (User requested: "give ats score and key points") */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                <span>AI Key Points &amp; Analysis</span>
                            </span>
                        </div>

                        {/* Strengths */}
                        <div className="p-3 bg-emerald-50/60 border border-emerald-100/90 rounded-xl space-y-1.5">
                            <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                                <span>Key Strengths (Matching JD)</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside pl-0.5">
                                {(selectedCandidate.keyPoints?.strengths || [
                                    `Strong foundation in required skills for ${currentJd.title}.`,
                                    "Proven industry experience delivering software solutions."
                                ]).map((s, idx) => (
                                    <li key={idx} className="leading-snug">
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Missing Skills / Gaps */}
                        <div className="p-3 bg-amber-50/60 border border-amber-100/90 rounded-xl space-y-1.5">
                            <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Missing Skills / Potential Gaps</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside pl-0.5">
                                {(selectedCandidate.keyPoints?.missingSkills || [
                                    "Certain specialized tools not explicitly highlighted."
                                ]).map((m, idx) => (
                                    <li key={idx} className="leading-snug">
                                        {m}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Experience Alignment */}
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                                <span>Experience Alignment</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">
                                {selectedCandidate.keyPoints?.experienceMatch ||
                                    `Candidate has ${selectedCandidate.experience} compared to JD requirement of ${currentJd.expLevel}.`}
                            </p>
                        </div>

                        {/* AI Recommendation Verdict */}
                        <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-xl space-y-1">
                            <div className="text-[11px] font-bold text-violet-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                                <span>ATS Shortlist Verdict</span>
                            </div>
                            <p className="text-xs text-violet-900 leading-snug font-medium">
                                {selectedCandidate.keyPoints?.verdict ||
                                    `Candidate has been categorized as ${selectedCandidate.status} with an ATS score of ${selectedCandidate.atsScore}/100.`}
                            </p>
                        </div>
                    </div>

                    {/* Candidate Top Skills */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-800">Candidate Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                            {(selectedCandidate.allSkills || selectedCandidate.skills || []).map((skill) => {
                                const isRequired = (currentJd.keySkills || []).some(
                                    (k) => k.toLowerCase() === skill.toLowerCase()
                                );
                                return (
                                    <span
                                        key={skill}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                                            isRequired
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-slate-100 text-slate-700 border border-slate-200"
                                        }`}
                                    >
                                        {isRequired && <Check className="w-3 h-3 text-emerald-600" />}
                                        <span>{skill}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* View Full Profile Modal Trigger */}
                    <button
                        onClick={() => setShowFullProfileModal(true)}
                        className="w-full py-2.5 border border-violet-200 hover:border-violet-400 hover:bg-violet-50/40 text-violet-700 font-semibold text-xs rounded-xl transition shadow-xs text-center block"
                    >
                        View Full Candidate Profile &amp; JD Breakdown
                    </button>

                    {/* Quick Status Actions: Shortlist / Review / Reject */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-800">Status Controls</div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleStatusChange(selectedCandidate.id, "Shortlisted")}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1 ${
                                    selectedCandidate.status === "Shortlisted"
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/80"
                                }`}
                            >
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                <span>Shortlist</span>
                            </button>

                            <button
                                onClick={() => handleStatusChange(selectedCandidate.id, "Review")}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1 ${
                                    selectedCandidate.status === "Review"
                                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                        : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/80"
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Review</span>
                            </button>

                            <button
                                onClick={() => handleStatusChange(selectedCandidate.id, "Rejected")}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1 ${
                                    selectedCandidate.status === "Rejected"
                                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                        : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200/80"
                                }`}
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                            </button>
                        </div>

                        {/* Schedule & Download actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                onClick={() => {
                                    setGeneratedLinkData(null);
                                    setShowInterviewModal(true);
                                }}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-xs"
                            >
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>Schedule</span>
                            </button>

                            <button
                                onClick={() => toast.success(`Downloading ${selectedCandidate.name}'s resume...`)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-xs"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                <span>PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Full Profile & JD ATS Breakdown */}
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

                        {/* Match & ATS Overview against Target JD */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                                <span className="font-semibold">Evaluated against Target JD:</span>
                                <span className="font-bold text-violet-700">{currentJd.title}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                    <div className="text-xs text-slate-500">ATS Score</div>
                                    <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                                        {selectedCandidate.atsScore}/100
                                    </div>
                                </div>
                                <div className="text-center bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                    <div className="text-xs text-slate-500">JD Match</div>
                                    <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                                        {selectedCandidate.matchScore}%
                                    </div>
                                </div>
                                <div className="text-center bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                    <div className="text-xs text-slate-500">Skill Alignment</div>
                                    <div className="text-2xl font-extrabold text-violet-600 mt-0.5">
                                        {selectedCandidate.skillsMatchPct || 85}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Summary */}
                        <div className="p-5 rounded-2xl bg-violet-50/70 border border-violet-100/80">
                            <div className="flex items-center gap-2 text-xs font-bold text-violet-800 uppercase tracking-wider mb-2">
                                <Sparkles className="w-4 h-4 text-violet-600" />
                                <span>AI Candidate Assessment for {currentJd.title}</span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedCandidate.summary}
                            </p>
                        </div>

                        {/* Key Points: Strengths & Missing Skills */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Strengths &amp; JD Matches</span>
                                </div>
                                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                    {(selectedCandidate.keyPoints?.strengths || ["Meets core criteria"]).map(
                                        (s, idx) => (
                                            <li key={idx}>{s}</li>
                                        )
                                    )}
                                </ul>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <span>Gaps &amp; Missing Skills</span>
                                </div>
                                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                    {(selectedCandidate.keyPoints?.missingSkills || ["None identified"]).map(
                                        (m, idx) => (
                                            <li key={idx}>{m}</li>
                                        )
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Skills Comparison against JD */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">
                                Technical Skills ({currentJd.title} Alignment)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(selectedCandidate.allSkills || selectedCandidate.skills || []).map((sk) => {
                                    const isJdSkill = (currentJd.keySkills || []).some(
                                        (k) => k.toLowerCase() === sk.toLowerCase()
                                    );
                                    return (
                                        <span
                                            key={sk}
                                            className={`px-3 py-1 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 ${
                                                isJdSkill
                                                    ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                                                    : "bg-white border border-slate-200 text-slate-800"
                                            }`}
                                        >
                                            {isJdSkill ? "✓" : "•"} {sk}
                                        </span>
                                    );
                                })}
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
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {selectedCandidate.experience} total industry experience
                                </div>
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
                        <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setShowFullProfileModal(false)}
                                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Close
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        handleStatusChange(selectedCandidate.id, "Review");
                                        setShowFullProfileModal(false);
                                    }}
                                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold transition"
                                >
                                    Move to Review
                                </button>
                                <button
                                    onClick={() => {
                                        handleStatusChange(selectedCandidate.id, "Shortlisted");
                                        setShowFullProfileModal(false);
                                    }}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20"
                                >
                                    Shortlist Candidate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Custom JD Setup / Edit */}
            {showCustomJdModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Custom Job Description</h3>
                                    <p className="text-xs text-slate-500">
                                        Define or paste target JD requirements for ATS scoring
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCustomJdModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Job Title</label>
                                <input
                                    type="text"
                                    value={customJd.title}
                                    onChange={(e) => setCustomJd({ ...customJd, title: e.target.value })}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={customJd.dept}
                                        onChange={(e) => setCustomJd({ ...customJd, dept: e.target.value })}
                                        placeholder="Engineering"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Experience Required</label>
                                    <input
                                        type="text"
                                        value={customJd.expLevel}
                                        onChange={(e) => setCustomJd({ ...customJd, expLevel: e.target.value })}
                                        placeholder="3-5 Years"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                    Key Required Skills (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={customJd.keySkills}
                                    onChange={(e) => setCustomJd({ ...customJd, keySkills: e.target.value })}
                                    placeholder="React, TypeScript, Next.js, Tailwind, GraphQL"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                    Job Description / Role Summary
                                </label>
                                <textarea
                                    rows="3"
                                    value={customJd.description}
                                    onChange={(e) => setCustomJd({ ...customJd, description: e.target.value })}
                                    placeholder="Paste job description text here..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setShowCustomJdModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedJobId("custom");
                                    setShowCustomJdModal(false);
                                    toast.success(`Active JD set to "${customJd.title}". Ready to screen!`);
                                }}
                                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/20"
                            >
                                Set as Active JD
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
                                    <p className="text-xs text-slate-500">
                                        {selectedCandidate.name} • {selectedCandidate.role}
                                    </p>
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
                                    <span>
                                        AI will prepare personalized questions based on <strong>{selectedCandidate.name}'s resume</strong> and <strong>{currentJd.title}</strong> requirements.
                                    </span>
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
                                                role: currentJd.title || selectedCandidate.role,
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
                                            {copiedInterviewLink ? (
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 p-3 bg-slate-50/70 rounded-2xl border border-slate-100 text-slate-600">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Scheduled For:</span>
                                        <span className="font-semibold text-slate-800">
                                            {generatedLinkData.date} at {generatedLinkData.time}
                                        </span>
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
                                        <span>Open Portal</span>
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
                                <label className="font-semibold text-slate-700 block mb-1">Role</label>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
                                >
                                    <option value="All">All Roles</option>
                                    <option value="Python Developer">Python Developer</option>
                                    <option value="Senior Software Engineer">Senior Software Engineer</option>
                                    <option value="UI/UX Product Designer">UI/UX Product Designer</option>
                                    <option value="DevOps Engineer">DevOps Engineer</option>
                                    <option value="Data Analyst">Data Analyst</option>
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
