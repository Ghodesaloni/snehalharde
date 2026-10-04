import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Users,
    Video,
    Mail,
    Plus,
    Copy,
    Check,
    ExternalLink,
    X,
    Briefcase,
    ShieldCheck,
    Sparkles,
    CalendarCheck,
    Search,
    RefreshCw
} from "lucide-react";
import { getStoredInterviews, saveInterviews } from "@/utils/interviewStore";
import { interviewsApi, candidatesApi } from "@/services/api";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Helper: Color & status mapping as requested
// Green = Going to be conducted (Scheduled / Upcoming)
// Yellow = In Process (Active / In Progress)
// Blue = Ended (Completed / Finished)
const getInterviewStatusConfig = (status) => {
    const s = String(status || "").trim().toLowerCase();

    // In Process / Active
    if (
        s === "in process" ||
        s === "in-process" ||
        s === "in progress" ||
        s === "in-progress" ||
        s === "active" ||
        s === "ongoing" ||
        s === "live"
    ) {
        return {
            category: "in_process",
            label: "In Process",
            dotClass: "bg-amber-500",
            dotPing: true,
            pillClass: "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200",
            badgeClass: "bg-amber-50 text-amber-800 border-amber-200/90",
            badgeDot: "bg-amber-500 animate-pulse",
            textColor: "text-amber-700",
            description: "In Process",
        };
    }

    // Ended / Completed
    if (
        s === "ended" ||
        s === "completed" ||
        s === "finished" ||
        s === "done" ||
        s === "terminated" ||
        s === "expired" ||
        s === "inactive" ||
        s === "selected" ||
        s === "rejected" ||
        s === "shortlisted" ||
        s === "under review"
    ) {
        return {
            category: "ended",
            label: "Conducted",
            dotClass: "bg-blue-500",
            dotPing: false,
            pillClass: "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200",
            badgeClass: "bg-blue-50 text-blue-800 border-blue-200/90",
            badgeDot: "bg-blue-500",
            textColor: "text-blue-700",
            description: "Conducted Interview",
        };
    }

    // Going to be conducted (Scheduled / Upcoming / Default)
    return {
        category: "scheduled",
        label: "Scheduled",
        dotClass: "bg-emerald-500",
        dotPing: false,
        pillClass: "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
        badgeDot: "bg-emerald-500",
        textColor: "text-emerald-700",
        description: "Going to be conducted",
    };
};

// Robust date parser for any date string format in stored interviews
const parseInterviewDate = (iv) => {
    if (!iv) return null;
    const dateVal = iv.date || iv.scheduledDate || iv.interviewDate || iv.interview_date || iv.timestamp || iv.expiryTime || iv.createdAt;
    if (!dateVal) return null;

    if (dateVal instanceof Date && !isNaN(dateVal)) {
        return dateVal;
    }

    const str = String(dateVal).trim();

    // Standard Date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    // Match "29 September 2026" or "29 Sep 2026"
    const match = str.match(/(\d{1,2})[\s\-/]+([a-zA-Z]+)[\s\-/]+(\d{4})/);
    if (match) {
        const d = parseInt(match[1], 10);
        const mStr = match[2].toLowerCase();
        const y = parseInt(match[3], 10);
        const mIdx = monthNames.findIndex((mn) => mn.toLowerCase().startsWith(mStr.slice(0, 3)));
        if (mIdx !== -1) {
            return new Date(y, mIdx, d);
        }
    }

    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = str.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
    if (dmyMatch) {
        return new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
    }

    // Match YYYY-MM-DD
    const ymdMatch = str.match(/(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/);
    if (ymdMatch) {
        return new Date(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[1], 10));
    }

    return null;
};

const CalendarPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const querySearch = searchParams.get("search") || "";

    const todayDate = useMemo(() => new Date(), []);
    const [currentDate, setCurrentDate] = useState(() => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(() => todayDate.getDate());
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [searchTerm, setSearchTerm] = useState(querySearch);
    const [timelineStatusFilter, setTimelineStatusFilter] = useState("All");

    const [interviews, setInterviews] = useState(() => {
        return getStoredInterviews();
    });

    // Refresh & sync interviews and candidates from store and backend API
    const refreshInterviews = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem("avahire_user") || "{}");
            const currentEmail = (currentUser.email || localStorage.getItem("avahire_registered_email") || "").toLowerCase().trim();

            const [interviewsData, candidatesData] = await Promise.allSettled([
                interviewsApi.getAll(),
                candidatesApi.getAll()
            ]);

            let ivList = interviewsData.status === "fulfilled" && Array.isArray(interviewsData.value)
                ? interviewsData.value
                : getStoredInterviews();

            // Helper to strictly isolate HR data to the current authenticated HR user
            const isMatchAuthor = (author) => {
                if (!currentEmail) return true;
                const a = (author || "").toLowerCase().trim();
                if (a === currentEmail) return true;
                if ((currentEmail === "salonighode@gmail.com" || currentEmail === "salonighode3@gmail.com") &&
                    (a === "salonighode@gmail.com" || a === "salonighode3@gmail.com")) return true;
                if ((currentEmail === "snehal.harde2935@gmail.com" || currentEmail === "snehalharde09@gmail.com" || currentEmail === "sneha.harde2935@gmail.com") &&
                    (a === "snehal.harde2935@gmail.com" || a === "snehalharde09@gmail.com" || a === "sneha.harde2935@gmail.com")) return true;
                return false;
            };

            // Filter interviews by current user's email strictly to isolate HR data
            if (currentEmail) {
                ivList = ivList.filter(iv => isMatchAuthor(iv.createdBy || iv.userEmail));
            }

            // Extract candidates who have an interview date or conducted interview
            let candList = candidatesData.status === "fulfilled" && Array.isArray(candidatesData.value)
                ? candidatesData.value
                : [];

            if (currentEmail) {
                candList = candList.filter(c => isMatchAuthor(c.createdBy || c.userEmail));
            }

            // Convert candidate interview entries into calendar-compatible events
            const candidateEvents = candList
                .filter(c => c.interviewDate || c.interview_date || c.timestamp || c.createdAt)
                .map(c => ({
                    id: `cand_event_${c.id}`,
                    candidateId: c.id,
                    name: c.name || "Candidate",
                    email: c.email || "",
                    phone: c.phone || "",
                    role: c.role || "Software Engineer",
                    date: c.interviewDate || c.interview_date || c.timestamp || c.createdAt,
                    time: c.timestamp?.includes(":") ? c.timestamp : "Conducted",
                    duration: c.duration || "45 Mins",
                    status: c.status === "Scheduled" ? "Scheduled" : (c.status === "Under Review" || c.status === "In Progress" ? "In Process" : "Completed"),
                    score: c.score,
                    notes: c.notes || "",
                    recommendation: c.recommendation || "",
                    summaryPoints: c.summary_points || c.summaryPoints || [],
                    evaluationBreakdown: c.evaluation_breakdown || c.evaluationBreakdown || [],
                    transcript: c.transcript || [],
                    linkCode: c.linkCode || (c.id ? `cand-${c.id.slice(-6)}` : "room-1"),
                    isCandidateRecord: true
                }));

            // Merge deduplicating by linkCode or email
            const merged = [...ivList];
            candidateEvents.forEach(ce => {
                const alreadyExists = merged.some(m => 
                    (m.linkCode && m.linkCode === ce.linkCode) ||
                    (m.email && ce.email && m.email.toLowerCase() === ce.email.toLowerCase())
                );
                if (!alreadyExists) {
                    merged.push(ce);
                }
            });

            setInterviews(merged);
            saveInterviews(merged);
            return;
        } catch (e) {
            console.warn("Calendar load error:", e);
        }
        setInterviews(getStoredInterviews());
    };

    useEffect(() => {
        refreshInterviews();

        const handleStorage = () => {
            refreshInterviews();
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener("avahire_interviews_updated", handleStorage);
        window.addEventListener("avahire_candidates_updated", handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("avahire_interviews_updated", handleStorage);
            window.removeEventListener("avahire_candidates_updated", handleStorage);
        };
    }, []);

    // Filter interviews based on search
    const filteredInterviews = useMemo(() => {
        if (!searchTerm.trim()) return interviews;
        const q = searchTerm.toLowerCase();
        return interviews.filter(
            (iv) =>
                iv.name?.toLowerCase().includes(q) ||
                iv.role?.toLowerCase().includes(q) ||
                iv.email?.toLowerCase().includes(q) ||
                iv.linkCode?.toLowerCase().includes(q)
        );
    }, [interviews, searchTerm]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Starting day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blankCells = Array.from({ length: firstDayIndex }, (_, i) => null);
    const allCells = [...blankCells, ...days];

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        const now = new Date();
        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDate(now.getDate());
    };

    // Helper: Map interviews to day of current displayed month & year
    const getInterviewsForDay = (day) => {
        if (!day) return [];
        return filteredInterviews.filter((iv) => {
            const parsed = parseInterviewDate(iv);
            if (parsed) {
                return (
                    parsed.getFullYear() === year &&
                    parsed.getMonth() === month &&
                    parsed.getDate() === day
                );
            }

            // String fallback match
            if (iv.date) {
                const str = iv.date.toLowerCase();
                const currentMonthName = monthNames[month].toLowerCase();
                const paddedDay = String(day).padStart(2, "0");

                if (str.includes(currentMonthName)) {
                    if (str.includes(paddedDay) || str.includes(` ${day} `) || str.startsWith(`${day} `)) {
                        return true;
                    }
                }
            }
            return false;
        });
    };

    const selectedDayInterviews = getInterviewsForDay(selectedDate);

    // Chronological candidate interview line dates
    const candidateTimelineList = useMemo(() => {
        let list = [...interviews];
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(iv => 
                (iv.name && iv.name.toLowerCase().includes(q)) ||
                (iv.role && iv.role.toLowerCase().includes(q)) ||
                (iv.email && iv.email.toLowerCase().includes(q)) ||
                (iv.linkCode && iv.linkCode.toLowerCase().includes(q))
            );
        }
        if (timelineStatusFilter !== "All") {
            list = list.filter(iv => {
                const cfg = getInterviewStatusConfig(iv.status);
                return cfg.label.toLowerCase() === timelineStatusFilter.toLowerCase();
            });
        }
        return list.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0);
            const dateB = new Date(b.date || b.createdAt || 0);
            return dateB - dateA;
        });
    }, [interviews, searchTerm, timelineStatusFilter]);

    return (
        <div className="space-y-6" data-testid="calendar-page">
            {/* Top Header & Connected Action Hub */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <CalendarIcon className="w-7 h-7 text-violet-600" />
                        <span>Recruitment Calendar</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Automatically tracking scheduled interviews, live sessions, and completed evaluations.
                    </p>
                </div>

                {/* Connected Quick Action Links */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={refreshInterviews}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                        title="Refresh Calendar"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Navigation & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        title="Previous Month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-base sm:text-lg font-extrabold text-slate-900 px-3 min-w-[170px] text-center">
                        {monthNames[month]} {year}
                    </div>
                    <button
                        onClick={nextMonth}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        title="Next Month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="ml-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                        Today
                    </button>
                </div>

                {/* Search in Calendar */}
                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search candidate name, role, code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition"
                    />
                </div>
            </div>

            {/* Main Calendar & Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Calendar Month Grid (8 Cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div key={day} className="py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {allCells.map((day, idx) => {
                            if (!day) {
                                return (
                                    <div
                                        key={`blank-${idx}`}
                                        className="aspect-square rounded-2xl bg-slate-50/40 border border-transparent"
                                    />
                                );
                            }

                            const dayEvents = getInterviewsForDay(day);
                            const isSelected = selectedDate === day;
                            const isRealToday =
                                day === todayDate.getDate() &&
                                month === todayDate.getMonth() &&
                                year === todayDate.getFullYear();

                            return (
                                <div
                                    key={`day-${day}`}
                                    onClick={() => setSelectedDate(day)}
                                    className={`min-h-[85px] sm:min-h-[105px] rounded-2xl p-1.5 sm:p-2.5 text-left transition flex flex-col justify-between cursor-pointer border relative group ${
                                        isSelected
                                            ? "border-violet-600 bg-violet-50/60 shadow-xs ring-2 ring-violet-500/20"
                                            : isRealToday
                                            ? "border-indigo-400 bg-indigo-50/40 hover:border-violet-300 hover:bg-slate-50/80"
                                            : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                                isRealToday
                                                    ? "bg-violet-600 text-white shadow-xs"
                                                    : isSelected
                                                    ? "text-violet-700 font-black"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            {day}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                {dayEvents.slice(0, 3).map((iv, i) => {
                                                    const cfg = getInterviewStatusConfig(iv.status);
                                                    return (
                                                        <span
                                                            key={i}
                                                            className={`w-2 h-2 rounded-full ${cfg.dotClass}`}
                                                            title={`${iv.name} - ${cfg.label}`}
                                                        />
                                                    );
                                                })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Candidate Event Pills inside calendar day cell */}
                                    <div className="space-y-1 mt-1">
                                        {dayEvents.slice(0, 2).map((iv) => {
                                            const statusCfg = getInterviewStatusConfig(iv.status);
                                            const candidateDisplayName = iv.name || "Candidate";

                                            return (
                                                <div
                                                    key={iv.id || iv.linkCode}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedInterview(iv);
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold truncate transition border flex items-center gap-1 shadow-2xs ${statusCfg.pillClass}`}
                                                    title={`${candidateDisplayName} (${statusCfg.label}) - ${iv.time || ""}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dotClass} ${statusCfg.dotPing ? "animate-pulse" : ""}`} />
                                                    <span className="truncate font-semibold">{candidateDisplayName}</span>
                                                </div>
                                            );
                                        })}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[9px] font-bold text-slate-500 pl-1">
                                                +{dayEvents.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day Schedule & Interview Details Sidebar (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                    
                    {/* Day Schedule Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <div className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                                    DAY SCHEDULE
                                </div>
                                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                                    {selectedDate} {monthNames[month]} {year}
                                </h3>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                                {selectedDayInterviews.length} {selectedDayInterviews.length === 1 ? "Interview" : "Interviews"}
                            </span>
                        </div>

                        {/* List of interviews & candidate line dates on selected date */}
                        {selectedDayInterviews.length === 0 ? (
                            <div className="py-10 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                    <CalendarCheck className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    No interviews scheduled or conducted on {selectedDate} {monthNames[month]} {year}.
                                </p>
                                <Link
                                    to="/app/interviews"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Schedule on this date</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-violet-200/80 space-y-4">
                                {selectedDayInterviews.map((iv, index) => {
                                    const statusCfg = getInterviewStatusConfig(iv.status);

                                    return (
                                        <div
                                            key={iv.id || iv.linkCode || index}
                                            onClick={() => setSelectedInterview(iv)}
                                            className="relative p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-violet-50/30 hover:border-violet-300 transition cursor-pointer space-y-2.5 shadow-2xs group"
                                        >
                                            {/* Timeline Node on Left Line */}
                                            <div className={`absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white ${statusCfg.dotClass} shadow-xs ring-2 ring-violet-200`} />

                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${statusCfg.pillClass}`}>
                                                        {iv.name?.charAt(0) || "C"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-900 group-hover:text-violet-600 transition truncate flex items-center gap-1.5">
                                                            <span>{iv.name}</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 truncate">
                                                            {iv.role}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Color-coded Status Badge */}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${statusCfg.badgeClass}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.badgeDot}`} />
                                                    <span>{statusCfg.label}</span>
                                                </span>
                                            </div>

                                            {/* Score & Recommendation Line if Interviewed */}
                                            {iv.score !== undefined && iv.score !== null && (
                                                <div className="flex items-center gap-2 pt-1 text-[11px]">
                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                                                        Score: {iv.score}%
                                                    </span>
                                                    {iv.recommendation && (
                                                        <span className="text-slate-500 truncate font-medium">
                                                            • {iv.recommendation}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span className="font-semibold text-slate-700">{iv.time || "Scheduled"}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>{iv.duration || "45m"}</span>
                                                </div>
                                                <div className="text-violet-700 font-semibold text-[10px]">
                                                    {statusCfg.label}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* MODAL: Interview Event Details */}
            {selectedInterview && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Candidate Interview Details
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Candidate: <span className="font-bold text-slate-700">{selectedInterview.name}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedInterview(null)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Candidate Card Info */}
                        {(() => {
                            const statusCfg = getInterviewStatusConfig(selectedInterview.status);
                            return (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate</span>
                                        <span className="text-xs font-bold text-slate-900">{selectedInterview.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                                        <span className="text-xs font-medium text-slate-700">{selectedInterview.email || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</span>
                                        <span className="text-xs font-bold text-violet-700">{selectedInterview.role}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Date / Time</span>
                                        <span className="text-xs font-bold text-slate-800">
                                            {selectedInterview.date} {selectedInterview.time ? `• ${selectedInterview.time}` : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${statusCfg.badgeClass}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.badgeDot}`} />
                                            <span>{statusCfg.label} ({statusCfg.description})</span>
                                        </span>
                                    </div>
                                    {selectedInterview.score !== undefined && selectedInterview.score !== null && (
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluation Score</span>
                                            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                                {selectedInterview.score}%
                                            </span>
                                        </div>
                                    )}
                                    {selectedInterview.recommendation && (
                                        <div className="pt-1 border-t border-slate-200/60">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommendation</span>
                                            <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200/70">
                                                "{selectedInterview.recommendation}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Action Buttons to all other HR pages */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <Link
                                to={`/app/email?candidateEmail=${encodeURIComponent(selectedInterview.email || "")}&role=${encodeURIComponent(selectedInterview.role || "")}`}
                                className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Send Invitation</span>
                            </Link>

                            <Link
                                to={`/app/candidates?search=${encodeURIComponent(selectedInterview.name || "")}`}
                                className="py-2.5 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center"
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>View Candidate</span>
                            </Link>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                onClick={() => setSelectedInterview(null)}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
