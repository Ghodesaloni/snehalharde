import React, { useState, useMemo } from "react";
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
    SlidersHorizontal,
    Search
} from "lucide-react";
import { getInterviews } from "@/utils/interviewStore";

const CalendarPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const querySearch = searchParams.get("search") || "";

    const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // September 2026 default
    const [selectedDate, setSelectedDate] = useState(2); // 2nd
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [searchTerm, setSearchTerm] = useState(querySearch);

    // Fetch interviews from store
    const allInterviews = useMemo(() => {
        try {
            return getInterviews();
        } catch (e) {
            return [];
        }
    }, []);

    // Filter interviews based on search
    const filteredInterviews = useMemo(() => {
        if (!searchTerm.trim()) return allInterviews;
        const q = searchTerm.toLowerCase();
        return allInterviews.filter(
            (iv) =>
                iv.name?.toLowerCase().includes(q) ||
                iv.role?.toLowerCase().includes(q) ||
                iv.email?.toLowerCase().includes(q)
        );
    }, [allInterviews, searchTerm]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

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
        const today = new Date();
        setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today.getDate());
    };

    // Helper: Map interview to day of month
    const getInterviewsForDay = (day) => {
        if (!day) return [];
        return filteredInterviews.filter((iv) => {
            if (!iv.date) return false;
            // e.g. "02 September 2026" or "Sep 2, 2026" or "2026-09-02"
            const str = iv.date.toLowerCase();
            const currentMonthName = monthNames[month].toLowerCase();
            const paddedDay = String(day).padStart(2, "0");

            // Matches "02 September" or "2 September" or "September 02"
            if (str.includes(currentMonthName)) {
                if (str.includes(paddedDay) || str.includes(` ${day} `) || str.startsWith(`${day} `)) {
                    return true;
                }
            }
            // fallback: distribute some interviews across days for demo realism
            if (day === 2 && iv.linkCode === "akc123") return true;
            if (day === 3 && iv.linkCode === "ava456") return true;
            if (day === 4 && iv.linkCode === "dev789") return true;
            if (day === 7 && iv.name === "David Kim") return true;
            if (day === 10 && iv.name === "Jessica Taylor") return true;
            return false;
        });
    };

    const handleCopy = (code, e) => {
        if (e) e.stopPropagation();
        const url = `${window.location.origin}/i/${code}`;
        navigator.clipboard.writeText(url);
        setCopiedCode(code);
        toast.success(`Copied interview link: ${url}`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const selectedDayInterviews = getInterviewsForDay(selectedDate);

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
                        Track upcoming AI interviews, candidate assessments, and hiring schedules.
                    </p>
                </div>

                {/* Connected Quick Action Links */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                        to="/app/candidates"
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                        <Users className="w-3.5 h-3.5 text-violet-600" />
                        <span>Candidate Pipeline</span>
                    </Link>
                    <Link
                        to="/app/email"
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Email Center</span>
                    </Link>
                    <Link
                        to="/app/interviews"
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition active:scale-98"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Schedule Interview</span>
                    </Link>
                </div>
            </div>

            {/* Navigation and Filter Bar */}
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
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search interview by candidate or role..."
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
                            const isToday =
                                day === 2 && month === 8 && year === 2026; // match simulated current active day

                            return (
                                <div
                                    key={`day-${day}`}
                                    onClick={() => setSelectedDate(day)}
                                    className={`min-h-[75px] sm:min-h-[92px] rounded-2xl p-1.5 sm:p-2.5 text-left transition flex flex-col justify-between cursor-pointer border relative group ${
                                        isSelected
                                            ? "border-violet-600 bg-violet-50/60 shadow-xs ring-2 ring-violet-500/20"
                                            : isToday
                                            ? "border-indigo-300 bg-indigo-50/30 hover:border-violet-300 hover:bg-slate-50/80"
                                            : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                                isToday
                                                    ? "bg-violet-600 text-white shadow-xs"
                                                    : isSelected
                                                    ? "text-violet-700 font-black"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            {day}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                                        )}
                                    </div>

                                    {/* Event pills inside day */}
                                    <div className="space-y-1 mt-1">
                                        {dayEvents.slice(0, 2).map((iv) => (
                                            <div
                                                key={iv.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedInterview(iv);
                                                }}
                                                className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate bg-violet-100/80 text-violet-800 hover:bg-violet-200 transition border border-violet-200/50 flex items-center gap-1"
                                                title={`${iv.name} - ${iv.time}`}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />
                                                <span className="truncate">{iv.name?.split(" ")[0]}</span>
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[9px] font-bold text-slate-400 pl-1">
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

                        {/* List of interviews on selected date */}
                        {selectedDayInterviews.length === 0 ? (
                            <div className="py-10 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                    <CalendarCheck className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    No interviews scheduled for this date.
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
                            <div className="space-y-3">
                                {selectedDayInterviews.map((iv) => (
                                    <div
                                        key={iv.id}
                                        onClick={() => setSelectedInterview(iv)}
                                        className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-violet-300 transition cursor-pointer space-y-2 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                    {iv.name?.charAt(0) || "C"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-violet-600 transition truncate">
                                                        {iv.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        {iv.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                iv.status === "Active"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                                    : iv.status === "Scheduled"
                                                    ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}>
                                                {iv.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span>{iv.time}</span>
                                            </div>
                                            <div className="font-mono text-violet-700 font-semibold">
                                                /i/{iv.linkCode}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Link Card to other HR pages */}
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white space-y-4 shadow-xl">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                                Connected Recruiter Hub
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            All interview dates are synced with your candidate pipeline and email notifications.
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Link
                                to="/app/interviews"
                                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                            >
                                <Video className="w-3.5 h-3.5 text-violet-300" />
                                <span>All Interviews</span>
                            </Link>
                            <Link
                                to="/app/candidates"
                                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                            >
                                <Users className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Pipeline</span>
                            </Link>
                        </div>
                    </div>

                </div>

            </div>

            {/* MODAL: Interview Event Details */}
            {selectedInterview && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Scheduled Interview Details
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Room Code: <span className="font-mono font-bold text-violet-700">{selectedInterview.linkCode}</span>
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
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate</span>
                                <span className="text-xs font-bold text-slate-900">{selectedInterview.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                                <span className="text-xs font-medium text-slate-700">{selectedInterview.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</span>
                                <span className="text-xs font-bold text-violet-700">{selectedInterview.role}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule</span>
                                <span className="text-xs font-bold text-slate-800">
                                    {selectedInterview.date} at {selectedInterview.time}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    {selectedInterview.status}
                                </span>
                            </div>
                        </div>

                        {/* Candidate Portal Link Bar */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Candidate Interview Portal Link</label>
                            <div className="p-3 bg-violet-50/50 border border-violet-200/80 rounded-xl flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-violet-800 break-all truncate">
                                    {`${window.location.origin}/i/${selectedInterview.linkCode}`}
                                </span>
                                <button
                                    onClick={(e) => handleCopy(selectedInterview.linkCode, e)}
                                    className="p-1.5 text-violet-600 hover:text-violet-900 rounded-lg hover:bg-violet-100/50 transition shrink-0"
                                    title="Copy link"
                                >
                                    {copiedCode === selectedInterview.linkCode ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons to all other HR pages */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <Link
                                to={`/app/email?candidateEmail=${encodeURIComponent(selectedInterview.email)}&interviewCode=${selectedInterview.linkCode}&role=${encodeURIComponent(selectedInterview.role)}`}
                                className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Send Email Invitation</span>
                            </Link>

                            <Link
                                to={`/app/candidates?search=${encodeURIComponent(selectedInterview.name)}`}
                                className="py-2.5 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center"
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>View in Candidates</span>
                            </Link>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                onClick={() => setSelectedInterview(null)}
                                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                            >
                                Close
                            </button>
                            <Link
                                to="/app/interviews"
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/25 transition"
                            >
                                Manage in Interviews
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
