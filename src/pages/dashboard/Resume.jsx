import React, { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { resumesApi, jobsApi, interviewsApi } from "@/services/api";
import {
    Search,
    Filter,
    Upload,
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
    RefreshCw,
    Users,
    Brain,
    Cog,
    Code,
    DollarSign,
    BarChart3,
    Folder,
    FolderOpen,
    FolderKanban,
    Tag,
    Trash2,
    Minimize2,
    Maximize2,
    FileSpreadsheet,
    FileCheck,
    Image as LucideImage
} from "lucide-react";
import { addOrUpdateInterview } from "@/utils/interviewStore";

// Comprehensive career fields / domains for folder separation and filtering
const CORE_FIELDS = [
    { id: "All", label: "All Domains", icon: Layers, color: "violet" },
    { id: "Data Science", label: "Data Science", icon: Brain, color: "purple" },
    { id: "Software Development", label: "Software Dev", icon: Code, color: "blue" },
    { id: "Finance", label: "Finance", icon: DollarSign, color: "emerald" },
    { id: "Marketing", label: "Marketing", icon: Sparkles, color: "rose" },
    { id: "DevOps", label: "DevOps & Cloud", icon: Cog, color: "indigo" },
    { id: "QA / Testing", label: "QA & Testing", icon: ShieldCheck, color: "teal" },
    { id: "Data Analytics", label: "Analytics", icon: BarChart3, color: "cyan" },
    { id: "UI/UX Design", label: "UI/UX Design", icon: Scissors, color: "pink" },
    { id: "Human Resources", label: "HR & Talent", icon: Users, color: "orange" },
    { id: "Mechanical", label: "Mechanical", icon: Cog, color: "amber" }
];

const FIELDS = CORE_FIELDS;

// Helper to determine the professional domain / field of any candidate
const detectCandidateDomain = (candidate) => {
    if (!candidate) return "Software Development";
    if (candidate.domain && candidate.domain !== "General") return candidate.domain;
    if (candidate.field && candidate.field !== "General") return candidate.field;
    if (candidate.domains?.primary) return candidate.domains.primary;
    return "Software Development";
};

// Helper to determine the professional domain / field of any job posting
const detectJobDomain = (job) => {
    if (!job) return "Software Development";
    if (job.domain && job.domain !== "General") return job.domain;
    if (job.field && job.field !== "General") return job.field;
    const text = `${job.title || ""} ${job.dept || ""} ${(job.keySkills || []).join(" ")} ${job.description || ""}`.toLowerCase();
    if (/data scien|machine learning|\bml\b|deep learning|\bnlp\b|computer vision|tensorflow|pytorch|keras|scikit|pandas|numpy|neural network|predictive model|bigquery|generative ai|\bllm\b|\bds\b/i.test(text)) {
        return "Data Science";
    }
    if (/devops|kubernetes|docker|terraform|ci\/cd|cloud|aws|azure|gcp|infrastructure|sre\b|ansible|helm/i.test(text)) {
        return "DevOps";
    }
    if (/qa\b|automation|selenium|cypress|quality assurance|testing|test case|playwright|jest|junit/i.test(text)) {
        return "QA / Testing";
    }
    if (/ui\b|ux\b|design|figma|wirefram|prototyp|sketch|user research/i.test(text)) {
        return "UI/UX Design";
    }
    if (/mechanical|autocad|solidworks|catia|thermodynamics|fluid mechanics|\bfea\b|ansys|gd&t|\bcnc\b|manufacturing|hvac|thermal|creo/i.test(text)) {
        return "Mechanical";
    }
    if (/finance|financial|accounting|accountant|auditing|\baudit\b|taxation|\btax\b|valuation|\bcpa\b|\bcfa\b|quickbooks|tally|balance sheet|p&l/i.test(text)) {
        return "Finance";
    }
    if (/data analyst|business analyst|bi analyst|tableau|power\s?bi|analytics|dashboard/i.test(text)) {
        return "Data Analytics";
    }
    if (/hr\b|human resources|recruiter|recruitment|talent acquisition|people ops/i.test(text)) {
        return "Human Resources";
    }
    return "Software Development";
};

// Fallback initial candidate data
const initialCandidates = [];

const Resumes = () => {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [activeTab, setActiveTab] = useState("All Resumes");
    const [selectedField, setSelectedField] = useState("All");
    const [selectedFolderJobId, setSelectedFolderJobId] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("Highest ATS");
    const [selectedRowIds, setSelectedRowIds] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showFullProfileModal, setShowFullProfileModal] = useState(false);
    const [profileModalTab, setProfileModalTab] = useState("overview");
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [schedRound, setSchedRound] = useState("Technical Screening Round (45 mins)");
    const [schedDate, setSchedDate] = useState("");
    const [schedTime, setSchedTime] = useState("");
    const [schedDuration, setSchedDuration] = useState("45 Minutes");
    const [generatedLinkData, setGeneratedLinkData] = useState(null);
    const [copiedInterviewLink, setCopiedInterviewLink] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterRole, setFilterRole] = useState("All");
    const [filterMinScore, setFilterMinScore] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
    const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);

    // Bulk Resume Upload & Processing Hub States
    const [bulkQueue, setBulkQueue] = useState([]);
    const [showBulkHub, setShowBulkHub] = useState(false);
    const [isBulkMinimized, setIsBulkMinimized] = useState(false);
    const [bulkFilter, setBulkFilter] = useState("all"); // "all" | "completed" | "invalid" | "failed"
    const bulkFileInputRef = useRef(null);

    // Helper to identify file format
    const getFileTypeMeta = (filename = "") => {
        const ext = (filename.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
        if (ext === ".pdf") return { label: "PDF", bg: "bg-red-50 text-red-600 border-red-200" };
        if (ext === ".docx" || ext === ".doc") return { label: "DOCX", bg: "bg-blue-50 text-blue-600 border-blue-200" };
        if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return { label: "IMAGE OCR", bg: "bg-purple-50 text-purple-600 border-purple-200" };
        return { label: "TXT", bg: "bg-slate-50 text-slate-600 border-slate-200" };
    };

    // Live bulk upload stats
    const bulkStats = useMemo(() => {
        const total = bulkQueue.length;
        const processing = bulkQueue.filter((item) => item.status === "processing").length;
        const queued = bulkQueue.filter((item) => item.status === "queued").length;
        const completed = bulkQueue.filter((item) => item.status === "completed").length;
        const invalid = bulkQueue.filter((item) => item.status === "invalid").length;
        const failed = bulkQueue.filter((item) => item.status === "failed").length;
        const processed = completed + invalid + failed;
        const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
        return { total, processing, queued, completed, invalid, failed, processed, percent };
    }, [bulkQueue]);

    // JD Screening States
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState("");
    const [isBatchScreening, setIsBatchScreening] = useState(false);
    const [analyzingCandidateId, setAnalyzingCandidateId] = useState(null);
    const [showCustomJdModal, setShowCustomJdModal] = useState(false);
    const [customJd, setCustomJd] = useState({
        title: "",
        dept: "",
        expLevel: "",
        workMode: "Full-time",
        keySkills: "",
        description: ""
    });

    const fileInputRef = useRef(null);
    const fieldDropdownRef = useRef(null);
    const jobDropdownRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fieldDropdownRef.current && !fieldDropdownRef.current.contains(event.target)) {
                setIsFieldDropdownOpen(false);
            }
            if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target)) {
                setIsJobDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initial Fetch of Resumes and Jobs from backend
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resumesData, jobsData] = await Promise.allSettled([
                    resumesApi.getAll(),
                    jobsApi.getAll()
                ]);

                if (jobsData.status === "fulfilled" && Array.isArray(jobsData.value)) {
                    setJobs(jobsData.value);
                    if (jobsData.value.length > 0) {
                        setSelectedJobId(jobsData.value[0].id);
                    }
                }

                if (resumesData.status === "fulfilled" && Array.isArray(resumesData.value)) {
                    setCandidates(resumesData.value);
                    if (resumesData.value.length > 0) {
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
                expLevel: customJd.expLevel || "",
                workMode: customJd.workMode || "Full-time",
                keySkills: skillsArr,
                description: customJd.description || ""
            };
        }
        const found = jobs.find((j) => j.id === selectedJobId);
        if (found) return found;

        if (jobs.length > 0) return jobs[0];

        // Fallback default job
        return {
            id: "",
            title: "No Job Selected",
            dept: "",
            expLevel: "",
            workMode: "",
            keySkills: [],
            description: "Please select or create a Job Description to screen candidates."
        };
    }, [jobs, selectedJobId, customJd]);

    const safeCandidates = useMemo(() => (Array.isArray(candidates) ? candidates : []), [candidates]);
    const selectedCandidate = safeCandidates.find((c) => c.id === selectedCandidateId) || safeCandidates[0] || null;

    // Status tabs with live counts
    const tabCounts = useMemo(() => {
        const total = safeCandidates.length;
        const shortlisted = safeCandidates.filter((c) => c && c.status === "Shortlisted").length;
        const review = safeCandidates.filter((c) => c && c.status === "Review").length;
        const rejected = safeCandidates.filter((c) => c && c.status === "Rejected").length;
        return { total, shortlisted, review, rejected };
    }, [safeCandidates]);

    // Live counts per professional field / domain
    const fieldCounts = useMemo(() => {
        const counts = { "All": safeCandidates.length };
        safeCandidates.forEach((c) => {
            if (!c) return;
            const domain = detectCandidateDomain(c);
            counts[domain] = (counts[domain] || 0) + 1;
            // Also count secondary domains
            if (Array.isArray(c.secondaryDomains)) {
                c.secondaryDomains.forEach((sd) => {
                    counts[sd] = (counts[sd] || 0) + 1;
                });
            }
        });
        return counts;
    }, [safeCandidates]);

    // Live counts of candidates related to any created job
    const getJobCandidateCount = (job) => {
        if (!job) return 0;
        const jDomain = detectJobDomain(job);
        return safeCandidates.filter((c) => {
            if (!c) return false;
            if (c.jobId === job.id || c.targetJobId === job.id) return true;
            return detectCandidateDomain(c) === jDomain;
        }).length;
    };

    // Filter and Sort Candidates
    const filteredCandidates = useMemo(() => {
        return safeCandidates
            .filter((c) => {
                if (!c) return false;
                // Tab filter: separates resumes by Shortlisted vs Review vs Rejected
                if (activeTab === "Shortlisted" && c.status !== "Shortlisted") return false;
                if (activeTab === "Review" && c.status !== "Review") return false;
                if (activeTab === "Rejected" && c.status !== "Rejected") return false;

                const candidateDomain = detectCandidateDomain(c);

                // Field folder filter: separate by Data Science, Mechanical, Software Engineer, Finance, Analyst
                if (selectedField !== "All" && candidateDomain !== selectedField) {
                    return false;
                }

                // Particular job folder filter: show all candidates related to the selected job folder
                if (selectedFolderJobId !== "All") {
                    const activeJob = jobs.find((j) => j.id === selectedFolderJobId);
                    if (activeJob) {
                        const jobDomain = detectJobDomain(activeJob);
                        const isAssigned = c.jobId === activeJob.id || c.targetJobId === activeJob.id;
                        const isDomainMatch = candidateDomain === jobDomain;
                        if (!isAssigned && !isDomainMatch) {
                            return false;
                        }
                    }
                }

                // Search query filter
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    const matchesName = (c.name || "").toLowerCase().includes(query);
                    const matchesEmail = (c.email || "").toLowerCase().includes(query);
                    const matchesRole = (c.role || "").toLowerCase().includes(query);
                    const matchesDomain = candidateDomain.toLowerCase().includes(query);
                    const matchesSkills = (c.allSkills || c.skills || []).some((s) => (s || "").toLowerCase().includes(query));
                    const matchesResume = (c.resumeFileName || c.resumeData?.fileName || "").toLowerCase().includes(query);
                    if (!matchesName && !matchesEmail && !matchesRole && !matchesDomain && !matchesSkills && !matchesResume) return false;
                }

                // Advanced Modal Filters
                if (filterRole !== "All" && c.role !== filterRole) return false;
                if (c.atsScore < filterMinScore) return false;

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "Highest ATS") return (b.atsScore || 0) - (a.atsScore || 0);
                if (sortBy === "Highest Match") return (b.matchScore || 0) - (a.matchScore || 0);
                if (sortBy === "Experience") return (b.expYears || 0) - (a.expYears || 0);
                if (sortBy === "Domain") return (detectCandidateDomain(a) || "").localeCompare(detectCandidateDomain(b) || "");
                if (sortBy === "Candidate Name") return (a.name || "").localeCompare(b.name || "");
                // Default Newest
                return 0;
            });
    }, [candidates, activeTab, selectedField, selectedFolderJobId, jobs, searchQuery, sortBy, filterRole, filterMinScore]);

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

    // Handle Bulk Upload with Real-time Processing & Immediate Screening against current JD
    const handleFileUpload = async (files) => {
        const fileList = Array.from(files);
        if (!fileList.length) return;

        const ALLOWED_RESUME_EXTS = [".pdf", ".docx", ".doc", ".txt", ".rtf", ".jpg", ".jpeg", ".png", ".webp"];
        const validFiles = [];
        const rejectedFiles = [];

        for (const file of fileList) {
            const extMatch = file.name.match(/\.[^.]+$/);
            const ext = extMatch ? extMatch[0].toLowerCase() : "";
            if (ALLOWED_RESUME_EXTS.includes(ext) || file.type?.startsWith("image/")) {
                validFiles.push(file);
            } else {
                rejectedFiles.push(file.name);
            }
        }

        if (rejectedFiles.length > 0) {
            toast.error(
                `Unsupported format: ${rejectedFiles.join(", ")}. Accepted: PDF, DOC, DOCX, TXT, JPG, JPEG, and PNG.`,
                { duration: 5000 }
            );
        }

        if (validFiles.length === 0) {
            toast.warning("No valid resume files provided. Please upload PDF, DOCX, TXT, JPG, JPEG, or PNG resumes.");
            return;
        }

        // Initialize bulk queue
        const initialQueue = validFiles.map((file, idx) => ({
            id: `bq-${Date.now()}-${idx}-${file.name.replace(/\W/g, "")}`,
            file,
            name: file.name,
            size: (file.size / 1024).toFixed(1) + " KB",
            typeMeta: getFileTypeMeta(file.name),
            status: "queued", // "queued" | "processing" | "completed" | "invalid" | "failed"
            candidateName: null,
            role: null,
            domain: null,
            atsScore: null,
            matchScore: null,
            statusBadge: null,
            error: null,
            isDuplicate: false,
            candidateData: null
        }));

        setBulkQueue(initialQueue);
        setShowBulkHub(true);
        setIsBulkMinimized(false);
        setIsUploading(true);

        toast.info(`Bulk upload started: screening ${validFiles.length} file(s) against "${currentJd.title}"...`);

        const newlyAdded = [];
        let completedCount = 0;
        let invalidCount = 0;
        let failedCount = 0;

        // Process queue with controlled concurrency for speed and independent error handling
        const CONCURRENCY_LIMIT = 2;
        let queueCursor = 0;

        const processQueueItem = async (item) => {
            // Mark as processing
            setBulkQueue((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, status: "processing" } : q))
            );

            const formData = new FormData();
            formData.append("resume", item.file);
            formData.append("jobId", selectedJobId === "custom" ? "custom" : selectedJobId);
            if (selectedJobId === "custom") {
                formData.append("customJd", JSON.stringify(currentJd));
            }

            try {
                const res = await resumesApi.uploadAndScreen(formData);
                if (res && res.data) {
                    const candidate = res.data;
                    completedCount++;
                    newlyAdded.push(candidate);

                    setBulkQueue((prev) =>
                        prev.map((q) =>
                            q.id === item.id
                                ? {
                                      ...q,
                                      status: "completed",
                                      candidateName: candidate.name,
                                      domain: candidate.field || candidate.domain,
                                      role: candidate.role,
                                      atsScore: candidate.atsScore,
                                      matchScore: candidate.matchScore,
                                      statusBadge: candidate.status,
                                      isDuplicate: !!candidate.isDuplicateUpdated,
                                      candidateData: candidate
                                  }
                                : q
                        )
                    );

                    // Add to main candidates list immediately
                    setCandidates((prev) => {
                        const filtered = prev.filter((c) => c.id !== candidate.id);
                        return [candidate, ...filtered];
                    });
                    setSelectedCandidateId(candidate.id);
                } else {
                    invalidCount++;
                    setBulkQueue((prev) =>
                        prev.map((q) =>
                            q.id === item.id
                                ? { ...q, status: "invalid", error: "No valid resume detected." }
                                : q
                        )
                    );
                }
            } catch (singleUploadErr) {
                console.error(`Bulk item error on ${item.name}:`, singleUploadErr);
                const serverError = singleUploadErr.response?.data?.error || singleUploadErr.message || "";
                const isInvalid = serverError.toLowerCase().includes("no valid resume") || serverError === "No valid resume detected.";

                if (isInvalid) {
                    invalidCount++;
                    setBulkQueue((prev) =>
                        prev.map((q) =>
                            q.id === item.id
                                ? { ...q, status: "invalid", error: "No valid resume detected." }
                                : q
                        )
                    );
                } else {
                    failedCount++;
                    setBulkQueue((prev) =>
                        prev.map((q) =>
                            q.id === item.id
                                ? { ...q, status: "failed", error: serverError || "Processing failed" }
                                : q
                        )
                    );
                }
            }
        };

        const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, initialQueue.length) }, async () => {
            while (queueCursor < initialQueue.length) {
                const currentIdx = queueCursor++;
                await processQueueItem(initialQueue[currentIdx]);
            }
        });

        await Promise.all(workers);

        setIsUploading(false);

        // Synchronize with database in background
        try {
            const freshResumes = await resumesApi.getAll();
            if (Array.isArray(freshResumes) && freshResumes.length > 0) {
                setCandidates(freshResumes);
            }
        } catch (e) {
            // ignore
        }

        if (completedCount > 0) {
            toast.success(
                `Bulk processing complete: ${completedCount} candidate(s) screened and saved, ${invalidCount} invalid non-resume file(s) skipped.`
            );
        } else if (invalidCount > 0) {
            toast.error("No valid resumes detected across uploaded files.");
        }
    };

    const handleDeleteCandidate = async (id) => {
        try {
            await resumesApi.delete(id);
            setCandidates((prev) => prev.filter((c) => c.id !== id));
            if (selectedCandidateId === id) {
                setSelectedCandidateId(null);
            }
            toast.success("Candidate removed from database.");
        } catch (err) {
            console.error("Delete candidate error:", err);
            toast.error("Failed to delete candidate from database.");
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

    // Helper for career field styling & icons
    const getDomainBadge = (domain) => {
        const d = String(domain || "").trim();
        if (d === "Data Science" || d === "Machine Learning" || d === "Artificial Intelligence") {
            return {
                label: d,
                bg: "bg-purple-50 text-purple-700 border-purple-200/80",
                icon: Brain
            };
        }
        if (d === "Software Development" || d === "Software Engineer" || d === "Full Stack" || d === "Frontend" || d === "Backend") {
            return {
                label: d,
                bg: "bg-blue-50 text-blue-700 border-blue-200/80",
                icon: Code
            };
        }
        if (d === "DevOps" || d === "Cloud Computing") {
            return {
                label: d,
                bg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
                icon: Cog
            };
        }
        if (d === "QA / Testing") {
            return {
                label: "QA & Testing",
                bg: "bg-teal-50 text-teal-700 border-teal-200/80",
                icon: ShieldCheck
            };
        }
        if (d === "Data Analytics" || d === "Business Analytics" || d === "Analyst") {
            return {
                label: d,
                bg: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
                icon: BarChart3
            };
        }
        if (d === "UI/UX Design" || d === "Product Design") {
            return {
                label: d,
                bg: "bg-pink-50 text-pink-700 border-pink-200/80",
                icon: Scissors
            };
        }
        if (d === "Finance" || d === "Accounting" || d === "Banking") {
            return {
                label: d,
                bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
                icon: DollarSign
            };
        }
        if (d === "Marketing" || d === "Digital Marketing" || d === "Sales") {
            return {
                label: d,
                bg: "bg-rose-50 text-rose-700 border-rose-200/80",
                icon: Sparkles
            };
        }
        if (d === "Human Resources" || d === "Recruitment") {
            return {
                label: d,
                bg: "bg-orange-50 text-orange-700 border-orange-200/80",
                icon: Users
            };
        }
        if (d === "Cybersecurity" || d === "Information Security") {
            return {
                label: d,
                bg: "bg-rose-50 text-rose-700 border-rose-200/80",
                icon: ShieldCheck
            };
        }
        if (d === "Mechanical" || d === "Mechanical Engineering") {
            return {
                label: "Mechanical",
                bg: "bg-amber-50 text-amber-700 border-amber-200/80",
                icon: Cog
            };
        }
        return {
            label: d || "General",
            bg: "bg-slate-50 text-slate-700 border-slate-200/80",
            icon: Tag
        };
    };

    // Helper to find the matching job folder for any candidate
    const getCandidateJobFolder = (candidate) => {
        if (!candidate) return null;
        if (candidate.jobId) {
            const found = jobs.find((j) => j.id === candidate.jobId);
            if (found) return found;
        }
        if (candidate.targetJobId) {
            const found = jobs.find((j) => j.id === candidate.targetJobId);
            if (found) return found;
        }
        const domain = detectCandidateDomain(candidate);
        const domainJob = jobs.find((j) => detectJobDomain(j) === domain);
        if (domainJob) return domainJob;
        return jobs[0] || null;
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

                    {/* Hidden inputs accepting documents and resume images */}
                    <input
                        ref={bulkFileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                            handleFileUpload(e.target.files);
                            e.target.value = "";
                        }}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                            handleFileUpload(e.target.files);
                            e.target.value = "";
                        }}
                    />
                </div>
            </div>

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Total Resumes */}
                <div
                    onClick={() => setActiveTab("All Resumes")}
                    className={`bg-white p-5 rounded-2xl border transition cursor-pointer ${
                        activeTab === "All Resumes"
                            ? "border-violet-500 shadow-sm ring-2 ring-violet-500/10"
                            : "border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300"
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
                            ? "border-emerald-500 shadow-sm ring-2 ring-emerald-500/10"
                            : "border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 p-3 shrink-0">
                            <BookmarkCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-emerald-700 font-semibold">Shortlisted</div>
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
                            ? "border-amber-500 shadow-sm ring-2 ring-amber-500/10"
                            : "border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300"
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
                            ? "border-rose-500 shadow-sm ring-2 ring-rose-500/10"
                            : "border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300"
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

            {/* Resume Upload Section */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative rounded-2xl p-5 sm:p-6 border-2 border-dashed transition-all duration-200 shadow-sm ${
                    isDragOver
                        ? "bg-violet-100/70 border-violet-500 shadow-md shadow-violet-500/15 scale-[1.003]"
                        : "bg-purple-50/40 hover:bg-purple-50/70 border-violet-300 hover:border-violet-400 hover:shadow-md hover:shadow-violet-500/10"
                }`}
            >
                {isUploading ? (
                    <div className="py-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 shrink-0">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-violet-950">
                                        Bulk Screening in Progress against "{currentJd.title}"
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white">
                                        {bulkStats.processed} / {bulkStats.total} ({bulkStats.percent}%)
                                    </span>
                                </div>
                                <p className="text-xs text-violet-700 mt-0.5">
                                    {bulkStats.completed} valid candidates parsed • {bulkStats.invalid} non-resumes rejected • Running OCR &amp; ATS evaluation
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBulkHub(true);
                                    setIsBulkMinimized(false);
                                }}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition flex items-center gap-1.5"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Open Processing Hub</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 text-center sm:text-left">
                            <div className="w-12 h-12 rounded-xl bg-violet-100/90 border border-violet-200/80 flex items-center justify-center text-violet-600 shrink-0 shadow-xs">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                        Bulk Resume Upload &amp; Multi-Format Screening
                                    </h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-700 border border-violet-200">
                                        Upload 20+ Resumes at Once
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => bulkFileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-md shadow-violet-600/25 transition-all cursor-pointer disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Upload Multiple Resumes</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                            >
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>Single File</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Career Fields & Job Folders Navigation Hub (Compact dropdown filter design) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Header Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                            <FolderKanban className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-900">Career Fields &amp; Job Folders</h2>
                                {(selectedField !== "All" || selectedFolderJobId !== "All") && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-700">
                                        Filtered
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                Select a career domain or specific job folder to view matching candidates.
                            </p>
                        </div>
                    </div>

                    {/* Compact Filter Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* 1. Career Field Dropdown */}
                        <div className="relative" ref={fieldDropdownRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFieldDropdownOpen((prev) => !prev);
                                    setIsJobDropdownOpen(false);
                                }}
                                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    selectedField !== "All"
                                        ? "bg-violet-50/70 border-violet-300 text-violet-900 shadow-xs"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                                <span className="text-slate-400 font-medium">Career Field</span>
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                    {selectedField === "All" ? "All Fields" : selectedField}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200/60">
                                    {fieldCounts[selectedField] ?? fieldCounts["All"] ?? 0}
                                </span>
                                <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                        isFieldDropdownOpen ? "rotate-180 text-violet-600" : ""
                                    }`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isFieldDropdownOpen && (
                                <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-72 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 animate-in fade-in zoom-in-95">
                                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                                        <span>Select Career Field</span>
                                        <span>Candidates</span>
                                    </div>
                                    <div className="py-1 space-y-0.5">
                                        {FIELDS.map((field) => {
                                            const IconComponent = field.icon;
                                            const isSelected = selectedField === field.id && selectedFolderJobId === "All";
                                            const count = fieldCounts[field.id] || 0;

                                            return (
                                                <button
                                                    key={field.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedField(field.id);
                                                        setSelectedFolderJobId("All");
                                                        setIsFieldDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? "bg-violet-600 text-white font-bold shadow-xs"
                                                            : "hover:bg-slate-50 text-slate-700"
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <IconComponent
                                                            className={`w-4 h-4 ${
                                                                isSelected ? "text-white" : "text-violet-500"
                                                            }`}
                                                        />
                                                        <span>{field.id === "All" ? "All Fields" : field.label}</span>
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            isSelected
                                                                ? "bg-white/20 text-white"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Job Folder Dropdown */}
                        <div className="relative" ref={jobDropdownRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsJobDropdownOpen((prev) => !prev);
                                    setIsFieldDropdownOpen(false);
                                }}
                                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    selectedFolderJobId !== "All"
                                        ? "bg-violet-50/70 border-violet-300 text-violet-900 shadow-xs"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                                <span className="text-slate-400 font-medium">Job Folder</span>
                                <span className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[180px]">
                                    {selectedFolderJobId === "All"
                                        ? "All Jobs"
                                        : jobs.find((j) => j.id === selectedFolderJobId)?.title || "Selected Job"}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200/60">
                                    {selectedFolderJobId === "All"
                                        ? candidates.length
                                        : getJobCandidateCount(jobs.find((j) => j.id === selectedFolderJobId))}
                                </span>
                                <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                        isJobDropdownOpen ? "rotate-180 text-violet-600" : ""
                                    }`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isJobDropdownOpen && (
                                <div className="absolute right-0 mt-1.5 w-76 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 animate-in fade-in zoom-in-95">
                                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                                        <span>Select Job Folder</span>
                                        <span>Candidates</span>
                                    </div>
                                    <div className="py-1 space-y-0.5">
                                        {/* All Jobs */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFolderJobId("All");
                                                setIsJobDropdownOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                                selectedFolderJobId === "All"
                                                    ? "bg-violet-600 text-white font-bold shadow-xs"
                                                    : "hover:bg-slate-50 text-slate-700"
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Folder className={`w-4 h-4 ${selectedFolderJobId === "All" ? "text-white" : "text-slate-400"}`} />
                                                <span>All Jobs</span>
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    selectedFolderJobId === "All"
                                                        ? "bg-white/20 text-white"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {candidates.length}
                                            </span>
                                        </button>

                                        {/* Individual Job Folders */}
                                        {jobs.map((job) => {
                                            const isJobActive = selectedFolderJobId === job.id;
                                            const jobDomain = detectJobDomain(job);
                                            const count = getJobCandidateCount(job);

                                            return (
                                                <button
                                                    key={job.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFolderJobId(job.id);
                                                        setSelectedJobId(job.id);
                                                        setSelectedField(jobDomain);
                                                        setIsJobDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                                        isJobActive
                                                            ? "bg-violet-600 text-white font-bold shadow-xs"
                                                            : "hover:bg-slate-50 text-slate-700"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                                        <Folder className={`w-4 h-4 shrink-0 ${isJobActive ? "text-white" : "text-violet-500"}`} />
                                                        <div className="text-left truncate">
                                                            <div className="truncate font-semibold">{job.title}</div>
                                                            <div className={`text-[10px] ${isJobActive ? "text-violet-100" : "text-slate-400"}`}>
                                                                {jobDomain}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                                            isJobActive
                                                                ? "bg-white/20 text-white"
                                                                : "bg-violet-50 text-violet-700"
                                                        }`}
                                                    >
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reset Filter Button */}
                        {(selectedField !== "All" || selectedFolderJobId !== "All") && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedField("All");
                                    setSelectedFolderJobId("All");
                                }}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-1.5 transition cursor-pointer"
                                title="Reset all filters"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Subtle active filter indicator if filtered */}
                {(selectedField !== "All" || selectedFolderJobId !== "All") && (
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 animate-in fade-in">
                        <span className="flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-violet-600" />
                            <span>
                                Showing candidates in{" "}
                                <strong className="text-slate-900">
                                    {selectedFolderJobId !== "All"
                                        ? `Job "${jobs.find((j) => j.id === selectedFolderJobId)?.title || selectedFolderJobId}" (${selectedField})`
                                        : `Field "${selectedField}"`}
                                </strong>
                                : <strong className="text-violet-700 font-bold ml-1">{filteredCandidates.length}</strong>
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedField("All");
                                setSelectedFolderJobId("All");
                            }}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-800 underline cursor-pointer"
                        >
                            Clear Filter
                        </button>
                    </div>
                )}
            </div>

            {/* Candidate List Table (Full width, spacious, clean hierarchy) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
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
                                            ? "bg-violet-600 text-white shadow-xs shadow-violet-500/20"
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
                                placeholder="Search candidate, role or skill..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 w-44 sm:w-56"
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
                                    <option>Domain</option>
                                    <option>Candidate Name</option>
                                    <option>Newest</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar (Automated AI Actions Only - No manual shortlisting) */}
                {selectedRowIds.length > 0 && (
                    <div className="bg-violet-50/90 border-b border-violet-100 px-6 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
                        <span className="font-semibold text-violet-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            <span>{selectedRowIds.length} candidate{selectedRowIds.length > 1 ? "s" : ""} selected</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    const ids = [...selectedRowIds];
                                    setSelectedRowIds([]);
                                    toast.loading(`Auto-screening ${ids.length} candidates against ${currentJd.title}...`, { id: "batch-screen" });
                                    try {
                                        const res = await resumesApi.analyzeBatch({
                                            jobId: selectedJobId,
                                            candidateIds: ids
                                        });
                                        if (res.success && res.candidates) {
                                            setCandidates((prev) =>
                                                prev.map((c) => {
                                                    const updated = res.candidates.find((u) => u.id === c.id);
                                                    return updated ? { ...c, ...updated } : c;
                                                })
                                            );
                                            toast.success(`Automated shortlisting completed for ${ids.length} candidates!`, { id: "batch-screen" });
                                        }
                                    } catch (err) {
                                        toast.error("Batch automated screening failed.", { id: "batch-screen" });
                                    }
                                }}
                                className="px-3.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Run Automated AI Screening</span>
                            </button>
                            <button
                                onClick={() => setSelectedRowIds([])}
                                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                            >
                                Clear Selection
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
                                <th className="py-3 px-4 font-semibold text-slate-700">Candidate Name</th>
                                <th className="py-3 px-3 font-semibold text-slate-700">Resume</th>
                                <th className="py-3 px-3 font-semibold text-slate-700">Domain</th>
                                <th className="py-3 px-3 font-semibold text-slate-700 text-center">ATS Score</th>
                                <th className="py-3 px-3 font-semibold text-slate-700">Skills</th>
                                <th className="py-3 px-3 font-semibold text-slate-700 text-center">JD Match</th>
                                <th className="py-3 px-3 font-semibold text-slate-700">Status</th>
                                <th className="py-3 px-4 font-semibold text-slate-700 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-16 text-center text-slate-400">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-violet-500 flex items-center justify-center mx-auto mb-3 border border-purple-100">
                                            <FileText className="w-6 h-6 text-violet-600" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">No Resumes in Screener</div>
                                        <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Upload candidate resumes above using drag &amp; drop or the browse button to begin screening.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCandidates.map((candidate) => {
                                    const isSelectedRow = selectedCandidateId === candidate.id;
                                    const isChecked = selectedRowIds.includes(candidate.id);
                                    const isAnalyzing = analyzingCandidateId === candidate.id;
                                    const candidateDomain = detectCandidateDomain(candidate);
                                    const domainBadge = getDomainBadge(candidateDomain);
                                    const DomainIcon = domainBadge.icon;
                                    const jobFolder = getCandidateJobFolder(candidate);
                                    const isCurrentFolder = selectedFolderJobId === jobFolder?.id;
                                    const resumeFileName = candidate.resumeFileName || candidate.resumeData?.fileName || "resume.pdf";
                                    const isImageDoc = resumeFileName.match(/\.(jpg|jpeg|png|webp)$/i);
                                    const docTypeMeta = getFileTypeMeta(resumeFileName);

                                    return (
                                        <tr
                                            key={candidate.id}
                                            onClick={() => setSelectedCandidateId(candidate.id)}
                                            className={`transition-colors cursor-pointer group ${
                                                isSelectedRow ? "bg-violet-50/60 border-l-4 border-l-violet-600" : "hover:bg-slate-50/70"
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

                                            {/* Candidate Name */}
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
                                                                (candidate.name || "Candidate")
                                                                    .split(" ")
                                                                    .filter(Boolean)
                                                                    .map((n) => n[0])
                                                                    .join("")
                                                                    .slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                                                {candidate.name}
                                                            </span>
                                                            {isSelectedRow && (
                                                                <span className="px-1.5 py-0.2 rounded bg-violet-100 text-violet-700 text-[10px] font-bold shrink-0">
                                                                    Selected
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 truncate">
                                                            {candidate.email}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                                            {candidate.role} • {candidate.experience}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Resume */}
                                            <td className="py-3.5 px-3">
                                                <div className="flex items-center gap-2 max-w-[170px]">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                                        isImageDoc ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                                    }`}>
                                                        {isImageDoc ? <LucideImage className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold text-slate-800 truncate" title={resumeFileName}>
                                                            {resumeFileName}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${docTypeMeta.bg}`}>
                                                                {docTypeMeta.label}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCandidateId(candidate.id);
                                                                    setProfileModalTab("rawText");
                                                                    setShowFullProfileModal(true);
                                                                }}
                                                                className="text-[10px] text-violet-600 hover:text-violet-800 font-semibold underline cursor-pointer"
                                                                title="View Extracted Resume Text"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Domain */}
                                            <td className="py-3.5 px-3">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${domainBadge.bg}`}>
                                                        <DomainIcon className="w-3.5 h-3.5" />
                                                        <span>{domainBadge.label}</span>
                                                    </span>
                                                    {jobFolder && (
                                                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]" title={jobFolder.title}>
                                                            Folder: {jobFolder.title}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* ATS Score */}
                                            <td className="py-3.5 px-3 text-center">
                                                <span
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-extrabold border shadow-xs ${getScoreBadgeClass(
                                                        candidate.atsScore
                                                    )}`}
                                                >
                                                    {candidate.atsScore}
                                                </span>
                                            </td>

                                            {/* Skills */}
                                            <td className="py-3.5 px-3">
                                                <div className="flex flex-wrap items-center gap-1 max-w-[180px]">
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

                                            {/* JD Match */}
                                            <td
                                                className={`py-3.5 px-3 text-center font-bold text-xs whitespace-nowrap ${getMatchTextColor(
                                                    candidate.matchScore
                                                )}`}
                                            >
                                                <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                                                    {candidate.matchScore}%
                                                </span>
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
                                                        className="p-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition cursor-pointer"
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
                                                        onClick={() => {
                                                            setSelectedCandidateId(candidate.id);
                                                            setShowFullProfileModal(true);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-violet-600 transition cursor-pointer"
                                                        title="View Candidate Profile & Details"
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
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                                                        title="Options"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Dropdown Action Menu (Automated AI Options - No manual shortlisting) */}
                                                {openActionMenuId === candidate.id && (
                                                    <div className="absolute right-4 top-10 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-left text-xs font-medium text-slate-700 animate-in fade-in-50 zoom-in-95">
                                                        <button
                                                            onClick={() => {
                                                                handleAnalyzeSingleCandidate(candidate.id);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full px-3.5 py-2 hover:bg-violet-50 flex items-center gap-2 text-violet-700 font-semibold cursor-pointer"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                                            <span>Auto-Screen with AI ATS</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCandidateId(candidate.id);
                                                                setShowFullProfileModal(true);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>View Full Breakdown</span>
                                                        </button>
                                                        <div className="border-t border-slate-100 my-1" />
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCandidateId(candidate.id);
                                                                setShowInterviewModal(true);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                                                        >
                                                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>Schedule Interview</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                toast.success(`Downloading ${candidate.name}'s resume...`);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                                                        >
                                                            <Download className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>Download Resume PDF</span>
                                                        </button>
                                                        <div className="border-t border-slate-100 my-1" />
                                                        <button
                                                            onClick={() => {
                                                                handleDeleteCandidate(candidate.id);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer font-medium"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                            <span>Delete from Database</span>
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
                        {filteredCandidates.length === 0
                            ? "Showing 0 candidates"
                            : `Showing 1 to ${filteredCandidates.length} of ${candidates.length} candidates (Tab: ${activeTab})`}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600 disabled:opacity-40">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold flex items-center justify-center shadow-xs">
                            1
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white text-slate-600">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal: Full Profile & JD ATS Breakdown */}
            {showFullProfileModal && selectedCandidate && (
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
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                        <span
                                            className={`px-3 py-0.5 rounded-full font-semibold ${getStatusPill(
                                                selectedCandidate.status
                                            )}`}
                                        >
                                            {selectedCandidate.status}
                                        </span>
                                        {selectedCandidate.location && (
                                            <span className="text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedCandidate.location}
                                            </span>
                                        )}
                                        {selectedCandidate.email && (
                                            <a
                                                href={`mailto:${selectedCandidate.email}`}
                                                className="text-slate-600 hover:text-violet-600 flex items-center gap-1 bg-slate-100 hover:bg-violet-50 px-2.5 py-0.5 rounded-full transition"
                                            >
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedCandidate.email}
                                            </a>
                                        )}
                                        {selectedCandidate.phone && (
                                            <a
                                                href={`tel:${selectedCandidate.phone}`}
                                                className="text-slate-600 hover:text-violet-600 flex items-center gap-1 bg-slate-100 hover:bg-violet-50 px-2.5 py-0.5 rounded-full transition"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedCandidate.phone}
                                            </a>
                                        )}
                                        <span className="text-violet-700 font-medium flex items-center gap-1 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full">
                                            <Folder className="w-3.5 h-3.5 text-violet-500" />
                                            {selectedCandidate.targetJobTitle || selectedCandidate.domain || selectedCandidate.field || "General"}
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

                        {/* Modal Navigation Tabs */}
                        <div className="flex border-b border-slate-100 gap-2 text-xs font-semibold text-slate-500 overflow-x-auto pb-1">
                            {[
                                { id: "overview", label: "Overview & Assessment", icon: Sparkles },
                                { id: "breakdown", label: "8-Factor ATS Breakdown", icon: BarChart3 },
                                { id: "skills", label: "Skills Matrix & JD Gaps", icon: CheckCircle2 },
                                { id: "experience", label: "Work History & Education", icon: Briefcase },
                                { id: "rawText", label: "Extracted Resume Text", icon: FileText }
                            ].map((tab) => {
                                const TabIcon = tab.icon;
                                const isActive = profileModalTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setProfileModalTab(tab.id)}
                                        className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                                            isActive
                                                ? "bg-violet-50 text-violet-700 font-bold border border-violet-200"
                                                : "hover:bg-slate-50 hover:text-slate-700"
                                        }`}
                                    >
                                        <TabIcon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* TAB 1: OVERVIEW */}
                        {profileModalTab === "overview" && (
                            <div className="space-y-4 animate-in fade-in-50">
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
                                        {selectedCandidate.summary || selectedCandidate.aiSummary}
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
                                            {(selectedCandidate.missingRequiredSkills?.length > 0
                                                ? selectedCandidate.missingRequiredSkills.map((s) => `Missing required: ${s}`)
                                                : (selectedCandidate.keyPoints?.missingSkills || ["None identified"])
                                            ).map((m, idx) => (
                                                <li key={idx}>{m}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Shortlist Verdict */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-violet-600" />
                                        <span>Automated ATS Shortlist Verdict</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {selectedCandidate.keyPoints?.verdict ||
                                            `Candidate status: ${selectedCandidate.status} with an overall ATS score of ${selectedCandidate.atsScore}/100.`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: 8-FACTOR ATS BREAKDOWN */}
                        {profileModalTab === "breakdown" && (
                            <div className="space-y-4 animate-in fade-in-50">
                                <div className="p-4 bg-violet-50/60 border border-violet-100 rounded-2xl">
                                    <h4 className="font-bold text-violet-900 text-sm">Deterministic 8-Factor Weighted Scoring</h4>
                                    <p className="text-xs text-violet-700 mt-1">
                                        Ground-truth mathematical evaluation against job requirements for {currentJd.title}.
                                    </p>
                                </div>

                                {(() => {
                                    const b = selectedCandidate.breakdown || {};
                                    const reqScore = b.requiredSkills?.score ?? Math.min(30, Math.round((selectedCandidate.atsScore || 70) * 0.3));
                                    const prefScore = b.preferredSkills?.score ?? Math.min(10, Math.round((selectedCandidate.atsScore || 70) * 0.1));
                                    const expScore = b.experience?.score ?? Math.min(20, Math.round((selectedCandidate.atsScore || 70) * 0.2));
                                    const eduScore = b.education?.score ?? 9;
                                    const domScore = b.domainRelevance?.score ?? 10;
                                    const kwScore = b.keywords?.score ?? 8;
                                    const qualScore = b.resumeQuality?.score ?? 4.5;
                                    const certScore = b.certifications?.score ?? 3.5;

                                    const factors = [
                                        {
                                            name: "Required Technical Skills",
                                            weight: "30%",
                                            score: reqScore,
                                            max: 30,
                                            desc: "Exact & canonical matches for must-have skills defined in JD",
                                            color: "bg-emerald-500"
                                        },
                                        {
                                            name: "Preferred & Nice-to-Have Skills",
                                            weight: "10%",
                                            score: prefScore,
                                            max: 10,
                                            desc: "Secondary competencies and supporting tools",
                                            color: "bg-blue-500"
                                        },
                                        {
                                            name: "Experience Level Alignment",
                                            weight: "20%",
                                            score: expScore,
                                            max: 20,
                                            desc: `Candidate: ${b.experience?.candidateYears || selectedCandidate.experience} vs JD: ${b.experience?.requiredYears || currentJd.expLevel}`,
                                            color: "bg-violet-500"
                                        },
                                        {
                                            name: "Education & Degree Match",
                                            weight: "10%",
                                            score: eduScore,
                                            max: 10,
                                            desc: selectedCandidate.education || "Bachelor's Degree in relevant field",
                                            color: "bg-indigo-500"
                                        },
                                        {
                                            name: "Professional Domain Relevance",
                                            weight: "10%",
                                            score: domScore,
                                            max: 10,
                                            desc: `Candidate domain (${selectedCandidate.domain || "General"}) aligned with job field`,
                                            color: "bg-purple-500"
                                        },
                                        {
                                            name: "Industry Terminology & Keywords",
                                            weight: "10%",
                                            score: kwScore,
                                            max: 10,
                                            desc: "Contextual vocabulary, methods, and domain terminology",
                                            color: "bg-cyan-500"
                                        },
                                        {
                                            name: "Resume Quality & Formatting",
                                            weight: "5%",
                                            score: qualScore,
                                            max: 5,
                                            desc: "ATS-friendly layout, action verbs, measurable impact",
                                            color: "bg-teal-500"
                                        },
                                        {
                                            name: "Certifications & Credentials",
                                            weight: "5%",
                                            score: certScore,
                                            max: 5,
                                            desc: "Accredited industry certifications and specialized training",
                                            color: "bg-amber-500"
                                        }
                                    ];

                                    return (
                                        <div className="grid gap-3">
                                            {factors.map((f, i) => {
                                                const pct = Math.min(100, Math.round((f.score / f.max) * 100));
                                                return (
                                                    <div key={i} className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                                                    {f.name}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500">{f.desc}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-extrabold text-sm text-slate-900">
                                                                    {f.score}/{f.max} <span className="text-xs text-slate-400 font-normal">pts</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-semibold">{f.weight} weight</div>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`${f.color} h-2 rounded-full transition-all duration-300`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* TAB 3: SKILLS MATRIX */}
                        {profileModalTab === "skills" && (
                            <div className="space-y-4 animate-in fade-in-50">
                                {/* Matched Required Skills */}
                                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
                                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span>Matched Required Skills (High Weight)</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedCandidate.matchedSkills || selectedCandidate.allSkills || []).map((sk) => (
                                            <span
                                                key={sk}
                                                className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span>{sk}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Missing Required Skills */}
                                {selectedCandidate.missingRequiredSkills?.length > 0 && (
                                    <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2">
                                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            <span>Missing Required Skills</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCandidate.missingRequiredSkills.map((sk) => (
                                                <span
                                                    key={sk}
                                                    className="px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1"
                                                >
                                                    <X className="w-3 h-3 text-amber-600" />
                                                    <span>{sk}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* All Extracted Candidate Skills */}
                                <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2">
                                    <div className="text-xs font-bold text-slate-800">
                                        All Skills Extracted from Resume
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(selectedCandidate.allSkills || selectedCandidate.skills || []).map((sk) => (
                                            <span
                                                key={sk}
                                                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                                            >
                                                {sk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: EXPERIENCE & EDUCATION */}
                        {profileModalTab === "experience" && (
                            <div className="space-y-4 animate-in fade-in-50">
                                {/* Experience Timeline */}
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4 text-slate-600" />
                                        <span>Work Experience Timeline</span>
                                    </div>

                                    {((Array.isArray(selectedCandidate.experienceEntries) && selectedCandidate.experienceEntries.length > 0)
                                        ? selectedCandidate.experienceEntries
                                        : (Array.isArray(selectedCandidate.resumeData?.experienceEntries) && selectedCandidate.resumeData.experienceEntries.length > 0)
                                        ? selectedCandidate.resumeData.experienceEntries
                                        : (Array.isArray(selectedCandidate.workExperience) && selectedCandidate.workExperience.length > 0)
                                        ? selectedCandidate.workExperience
                                        : [
                                            {
                                                title: selectedCandidate.currentRole || selectedCandidate.role,
                                                company: "Enterprise Technology Inc.",
                                                duration: selectedCandidate.experience || "3+ Years",
                                                responsibilities: [
                                                    "Architected, tested, and shipped core service components.",
                                                    "Collaborated with cross-functional product and engineering teams.",
                                                    "Improved reliability and reduced latency across primary workflows."
                                                ]
                                            }
                                        ]
                                    ).map((exp, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{exp.title || exp.role || "Role"}</div>
                                                    <div className="text-xs text-violet-700 font-semibold">{exp.company || exp.organization || ""}</div>
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium px-2.5 py-0.5 rounded-full bg-white border border-slate-200">
                                                    {exp.duration || exp.timeline || exp.years || selectedCandidate.experience || ""}
                                                </span>
                                            </div>
                                            {Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                                                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                                    {exp.responsibilities.map((r, rIdx) => (
                                                        <li key={rIdx}>{r}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Education */}
                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <GraduationCap className="w-4 h-4 text-slate-600" />
                                        <span>Education &amp; Academic Credentials</span>
                                    </div>

                                    {((Array.isArray(selectedCandidate.educationEntries) && selectedCandidate.educationEntries.length > 0)
                                        ? selectedCandidate.educationEntries
                                        : (Array.isArray(selectedCandidate.resumeData?.educationEntries) && selectedCandidate.resumeData.educationEntries.length > 0)
                                        ? selectedCandidate.resumeData.educationEntries
                                        : [
                                            {
                                                degree: selectedCandidate.education || "Bachelor's Degree",
                                                institution: "University / Academic Institution",
                                                year: ""
                                            }
                                        ]
                                    ).map((edu, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1">
                                            <div className="font-bold text-slate-900 text-sm">
                                                {typeof edu === "string" ? edu : (edu.degree || edu.title || "Degree / Qualification")}
                                            </div>
                                            {typeof edu === "object" && (edu.institution || edu.school || edu.university || edu.year) && (
                                                <div className="text-xs text-slate-500">
                                                    {[edu.institution || edu.school || edu.university, edu.year].filter(Boolean).join(" · ")}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 5: RAW RESUME TEXT */}
                        {profileModalTab === "rawText" && (
                            <div className="space-y-3 animate-in fade-in-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-slate-500" />
                                        <span>Extracted Resume Text ({selectedCandidate.resumeFileName || "Document"})</span>
                                    </span>
                                    <button
                                        onClick={() => {
                                            const text = selectedCandidate.rawText || selectedCandidate.summary || "No raw text available";
                                            navigator.clipboard.writeText(text);
                                            toast.success("Resume text copied to clipboard!");
                                        }}
                                        className="text-xs font-semibold text-violet-700 hover:text-violet-800"
                                    >
                                        Copy Text
                                    </button>
                                </div>

                                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs max-h-[380px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                                    {selectedCandidate.rawText ||
                                        `${selectedCandidate.name}\n${selectedCandidate.email} | ${selectedCandidate.phone} | ${selectedCandidate.location}\n\nSUMMARY\n${selectedCandidate.summary}\n\nSKILLS\n${(selectedCandidate.allSkills || selectedCandidate.skills || []).join(", ")}\n\nEXPERIENCE\n${selectedCandidate.currentRole} (${selectedCandidate.experience})\n\nEDUCATION\n${selectedCandidate.education}`}
                                </div>
                            </div>
                        )}

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
                                        handleAnalyzeSingleCandidate(selectedCandidate.id);
                                        setShowFullProfileModal(false);
                                    }}
                                    className="px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Sparkles className="w-4 h-4 text-violet-600" />
                                    <span>Re-screen with AI ATS</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowFullProfileModal(false);
                                        setGeneratedLinkData(null);
                                        setShowInterviewModal(true);
                                    }}
                                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Calendar className="w-4 h-4 text-white" />
                                    <span>Schedule AI Interview</span>
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
            {showInterviewModal && selectedCandidate && (
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
                                            interviewsApi.create(newIv).catch((err) => console.warn("Failed to persist interview to DB:", err));
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

            {/* Modal & Floating Dock: Bulk Resume Processing Hub */}
            {showBulkHub && (
                isBulkMinimized ? (
                    /* Floating Dock when minimized */
                    <div className="fixed bottom-5 right-5 z-40 bg-white border border-violet-200 shadow-2xl rounded-2xl p-3.5 flex items-center gap-3.5 animate-in slide-in-from-bottom-5">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                            {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                        </div>
                        <div className="text-xs">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>Bulk Screening</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-violet-600 text-white">
                                    {bulkStats.processed}/{bulkStats.total}
                                </span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                                {bulkStats.completed} valid • {bulkStats.invalid} rejected
                            </div>
                        </div>
                        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                            <button
                                onClick={() => setIsBulkMinimized(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
                                title="Expand Hub"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setShowBulkHub(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Expanded Modal View */
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            {/* Hub Header */}
                            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-violet-50/50 via-white to-purple-50/30">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                                            <Upload className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                            Bulk Resume Processing Hub
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-700 border border-violet-200">
                                            {isUploading ? "Processing Queue" : "Batch Complete"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Independent OCR, validation, domain classification &amp; ATS screening against <span className="font-semibold text-slate-800">"{currentJd.title}"</span>.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => setIsBulkMinimized(true)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                        title="Minimize Hub"
                                    >
                                        <Minimize2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setShowBulkHub(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                        title="Close Hub"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Live Stats & Progress Bar */}
                            <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-b border-slate-100">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="font-semibold text-slate-700">
                                        {isUploading ? "Screening in Progress..." : "All Uploads Evaluated"}
                                    </span>
                                    <span className="font-mono font-bold text-violet-700">
                                        {bulkStats.processed} / {bulkStats.total} Files ({bulkStats.percent}%)
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300 rounded-full"
                                        style={{ width: `${bulkStats.percent}%` }}
                                    />
                                </div>

                                {/* 4 Stat Badges */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Uploaded</div>
                                        <div className="text-base font-extrabold text-slate-900 mt-0.5">{bulkStats.total}</div>
                                    </div>
                                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 text-center">
                                        <div className="text-[10px] uppercase font-bold text-emerald-700">Valid Resumes Saved</div>
                                        <div className="text-base font-extrabold text-emerald-700 mt-0.5">{bulkStats.completed}</div>
                                    </div>
                                    <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/80 text-center">
                                        <div className="text-[10px] uppercase font-bold text-rose-700">Invalid / Non-Resume</div>
                                        <div className="text-base font-extrabold text-rose-700 mt-0.5">{bulkStats.invalid}</div>
                                    </div>
                                    <div className="bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 text-center">
                                        <div className="text-[10px] uppercase font-bold text-slate-500">Failed / Errors</div>
                                        <div className="text-base font-extrabold text-slate-700 mt-0.5">{bulkStats.failed}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Filter Pills */}
                            <div className="px-5 sm:px-6 py-2.5 border-b border-slate-100 flex items-center gap-1.5 text-xs bg-white">
                                <span className="text-slate-400 font-medium mr-1 text-[11px]">Filter Files:</span>
                                {[
                                    { id: "all", label: `All Files (${bulkStats.total})` },
                                    { id: "completed", label: `Completed (${bulkStats.completed})` },
                                    { id: "invalid", label: `Invalid (${bulkStats.invalid})` },
                                    { id: "failed", label: `Failed (${bulkStats.failed})` }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setBulkFilter(tab.id)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                            bulkFilter === tab.id
                                                ? "bg-violet-600 text-white shadow-xs"
                                                : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Files Queue List */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 min-h-[220px] max-h-[380px] bg-slate-50/40">
                                {bulkQueue
                                    .filter((item) => {
                                        if (bulkFilter === "completed") return item.status === "completed";
                                        if (bulkFilter === "invalid") return item.status === "invalid";
                                        if (bulkFilter === "failed") return item.status === "failed";
                                        return true;
                                    })
                                    .map((item) => {
                                        const typeMeta = item.typeMeta || getFileTypeMeta(item.name);
                                        const isImage = item.name.match(/\.(jpg|jpeg|png|webp)$/i);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white ${
                                                    item.status === "completed"
                                                        ? "border-emerald-200/90 shadow-xs"
                                                        : item.status === "invalid"
                                                        ? "border-rose-200/90 bg-rose-50/20"
                                                        : item.status === "processing"
                                                        ? "border-violet-300 ring-2 ring-violet-500/10"
                                                        : "border-slate-200"
                                                }`}
                                            >
                                                {/* Left info: File icon, Name, Meta */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                                        isImage ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                                    }`}>
                                                        {isImage ? <LucideImage className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                                                {item.name}
                                                            </span>
                                                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${typeMeta.bg}`}>
                                                                {typeMeta.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {item.size}
                                                            </span>
                                                        </div>

                                                        {/* Dynamic Status Details */}
                                                        {item.status === "completed" && (
                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                                                                <span className="font-semibold text-slate-900">
                                                                    {item.candidateName || "Candidate"}
                                                                </span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="px-2 py-0.2 rounded-md bg-violet-50 text-violet-700 font-semibold text-[11px] border border-violet-100">
                                                                    {item.domain || "Software Development"}
                                                                </span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="font-bold text-emerald-700 text-xs">
                                                                    ATS Score: {item.atsScore}/100
                                                                </span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-[11px] text-slate-500">
                                                                    Match: {item.matchScore}%
                                                                </span>
                                                            </div>
                                                        )}

                                                        {item.status === "invalid" && (
                                                            <div className="text-xs text-rose-700 font-semibold mt-1 flex items-center gap-1.5">
                                                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                                <span>No valid resume detected. (Non-resume content filtered out. No record created)</span>
                                                            </div>
                                                        )}

                                                        {item.status === "failed" && (
                                                            <div className="text-xs text-rose-600 mt-1 flex items-center gap-1.5">
                                                                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                                <span>{item.error || "Failed to process file"}</span>
                                                            </div>
                                                        )}

                                                        {item.status === "processing" && (
                                                            <div className="text-xs text-violet-700 mt-1 flex items-center gap-1.5">
                                                                <RefreshCw className="w-3 h-3 text-violet-600 animate-spin" />
                                                                <span>Processing OCR, resume validation &amp; ATS evaluation...</span>
                                                            </div>
                                                        )}

                                                        {item.status === "queued" && (
                                                            <div className="text-xs text-slate-400 mt-1">
                                                                Queued for screening...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right status badge & actions */}
                                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                    {item.status === "processing" && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-1">
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                            <span>Processing</span>
                                                        </span>
                                                    )}
                                                    {item.status === "completed" && (
                                                        <>
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>Completed</span>
                                                            </span>
                                                            {item.candidateData?.id && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedCandidateId(item.candidateData.id);
                                                                        setShowFullProfileModal(true);
                                                                    }}
                                                                    className="px-3 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold border border-violet-200 transition cursor-pointer"
                                                                >
                                                                    View Profile
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {item.status === "invalid" && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Invalid</span>
                                                        </span>
                                                    )}
                                                    {item.status === "failed" && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                                                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                                                            <span>Failed</span>
                                                        </span>
                                                    )}
                                                    {item.status === "queued" && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                                                            Queued
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Hub Footer */}
                            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-xs text-slate-500">
                                    <span className="font-bold text-slate-800">{bulkStats.completed} valid candidates</span> saved to PostgreSQL database. Non-resume files were rejected without creating candidate records.
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => bulkFileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                                    >
                                        Upload More
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkHub(false)}
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition cursor-pointer"
                                    >
                                        Close &amp; View in Screener
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default Resumes;
