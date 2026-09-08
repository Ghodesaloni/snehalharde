import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { settingsApi } from "@/services/api";
import {
    Save,
    Lock,
    ShieldCheck,
    Monitor,
    AlertTriangle,
    ChevronDown,
    X,
    KeyRound,
    Smartphone,
    LogOut,
    CheckCircle2,
    Clock,
    UserX,
    Video,
    Calendar,
    Hourglass,
    Globe,
    Bot,
    Sliders,
    Languages,
    FileText,
    Briefcase,
    Shield,
    User,
    Users,
    Laptop,
    Maximize2,
    Camera,
    Mic,
    Mail,
    Bell,
    CheckSquare,
    Info,
    Edit3,
    Sparkles,
    Settings as SettingsIcon
} from "lucide-react";

const Settings = () => {
    const [activeTab, setActiveTab] = useState("interview"); // "general" or "interview"

    // Persistent General Settings
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem("avahire_settings_preferences");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }
        return {
            darkMode: false,
            compactView: true,
            showAvatars: true,
            autoRefresh: "Every 5 minutes",
            jobsPerPage: "10",
            candidatesPerPage: "10",
            interviewDuration: "30 Minutes",
            interviewMode: "AI Interview"
        };
    });

    // Persistent Interview Settings
    const [interviewSettings, setInterviewSettings] = useState(() => {
        const saved = localStorage.getItem("avahire_interview_settings");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }
        return {
            // General Interview Settings
            duration: "30 Minutes",
            joinWindow: "5 Minutes",
            graceTime: "2 Minutes",
            autoEnd: true,
            allowReschedule: false,
            timezone: "(GMT+05:30) Asia/Kolkata",

            // AI Interview Settings
            interviewMode: "AI Interview",
            aiAvatar: "Ava (Female)",
            difficulty: "Medium",
            language: "English",
            askFollowUps: true,
            resumeBasedQuestions: true,
            roleBasedQuestions: true,

            // Proctoring Settings
            enableProctoring: true,
            faceDetection: true,
            multiplePersonDetection: true,
            tabSwitchDetection: true,
            fullScreenMonitoring: true,
            suspiciousThreshold: "3 Actions",
            suspiciousToggle: false,
            screenRecording: false,
            videoRecording: true,
            audioRecording: true,

            // Communication & Reminders
            invitationEmail: true,
            reminderBeforeInterview: true,
            reminderTime: "15 Minutes",
            completionEmail: true,

            // Guidelines
            guidelines: [
                "Ensure you are in a quiet place with good internet connection.",
                "Keep your face clearly visible in the camera.",
                "Do not switch tabs or open other applications.",
                "Do not take help from others during the interview.",
                "Be honest and answer confidently.",
                "Interview will be recorded for evaluation purposes."
            ]
        };
    });

    // Modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showSessionsModal, setShowSessionsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditInstructionsModal, setShowEditInstructionsModal] = useState(false);
    const [tempGuidelines, setTempGuidelines] = useState(interviewSettings.guidelines);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingsApi.get();
                if (data) {
                    if (data.preferences) setPreferences(data.preferences);
                    if (data.interviewSettings) {
                        setInterviewSettings(data.interviewSettings);
                        if (data.interviewSettings.guidelines) {
                            setTempGuidelines(data.interviewSettings.guidelines);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load settings from database:", err);
            }
        };
        fetchSettings();
    }, []);

    // Password form state
    const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirmPwd: "" });

    const handleGeneralToggle = (key) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleGeneralSelect = (key, value) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleInterviewToggle = (key) => {
        setInterviewSettings((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleInterviewSelect = (key, value) => {
        setInterviewSettings((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const saveGeneralSettings = async () => {
        localStorage.setItem("avahire_settings_preferences", JSON.stringify(preferences));
        toast.success("General settings saved successfully!");
        try {
            await settingsApi.updatePreferences(preferences);
        } catch (err) {
            console.error("Failed to sync preferences to database:", err);
        }
    };

    const saveInterviewSettings = async () => {
        localStorage.setItem("avahire_interview_settings", JSON.stringify(interviewSettings));
        toast.success("Interview settings & proctoring configuration saved!");
        try {
            await settingsApi.updateInterviewSettings(interviewSettings);
        } catch (err) {
            console.error("Failed to sync interview settings to database:", err);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirmPwd) {
            return toast.error("Please fill in all password fields");
        }
        if (pwdForm.newPwd !== pwdForm.confirmPwd) {
            return toast.error("New password and confirm password do not match");
        }
        toast.success("Password updated successfully!");
        setShowPasswordModal(false);
        setPwdForm({ current: "", newPwd: "", confirmPwd: "" });
    };

    const handleSaveInstructions = async () => {
        const updated = { ...interviewSettings, guidelines: tempGuidelines };
        setInterviewSettings(updated);
        localStorage.setItem("avahire_interview_settings", JSON.stringify(updated));
        setShowEditInstructionsModal(false);
        toast.success("Interview guidelines updated!");
        try {
            await settingsApi.updateInterviewSettings(updated);
        } catch (err) {
            console.error("Failed to sync guidelines to database:", err);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto -mt-2" data-testid="settings-page">
            {/* Header with Title, Breadcrumb & Sub Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Settings
                    </h1>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-medium">
                        <span>Home</span>
                        <span>&gt;</span>
                        <span>Settings</span>
                        <span>&gt;</span>
                        <span className="text-slate-600 font-semibold capitalize">{activeTab} Settings</span>
                    </div>
                </div>

                {/* Settings Tab Selector Buttons */}
                <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            activeTab === "general"
                                ? "bg-violet-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        <span>General Settings</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("interview")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            activeTab === "interview"
                                ? "bg-violet-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                    >
                        <Video className="w-4 h-4" />
                        <span>Interview Settings</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: INTERVIEW SETTINGS (MATCHING UPLOADED IMAGE) */}
            {activeTab === "interview" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-violet-700 tracking-tight">
                                Interview Settings
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Configure interview experience, timing, AI behavior and proctoring preferences.
                            </p>
                        </div>
                        <button
                            onClick={saveInterviewSettings}
                            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-violet-500/25 transition active:scale-[0.98] self-start sm:self-auto"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                        </button>
                    </div>

                    {/* Top Row: 2 Big Cards (General Interview Settings + AI Interview Settings) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CARD 1: General Interview Settings */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-5">
                            <h3 className="text-sm font-bold text-violet-700 tracking-tight">
                                General Interview Settings
                            </h3>

                            <div className="space-y-4">
                                {/* Default Interview Duration */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Default Interview Duration
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Set the default duration for scheduled interviews.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.duration}
                                            onChange={(e) => handleInterviewSelect("duration", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>15 Minutes</option>
                                            <option>30 Minutes</option>
                                            <option>45 Minutes</option>
                                            <option>60 Minutes</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Join Window (Before Interview) */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Join Window (Before Interview)
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Time before interview start when candidate can join.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.joinWindow}
                                            onChange={(e) => handleInterviewSelect("joinWindow", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>2 Minutes</option>
                                            <option>5 Minutes</option>
                                            <option>10 Minutes</option>
                                            <option>15 Minutes</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Grace Time (After Start) */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Hourglass className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Grace Time (After Start)
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Extra time allowed after interview start to join.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.graceTime}
                                            onChange={(e) => handleInterviewSelect("graceTime", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>2 Minutes</option>
                                            <option>5 Minutes</option>
                                            <option>10 Minutes</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Auto End Interview */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Auto End Interview
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Automatically end interview when time is over.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("autoEnd")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.autoEnd ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.autoEnd ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Allow Reschedule by Candidate */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Allow Reschedule by Candidate
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Candidates can request to reschedule their interview.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("allowReschedule")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.allowReschedule ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.allowReschedule ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Time Zone for Scheduling */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Time Zone for Scheduling
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Default time zone used for scheduling interviews.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[200px]">
                                        <select
                                            value={interviewSettings.timezone}
                                            onChange={(e) => handleInterviewSelect("timezone", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>(GMT+05:30) Asia/Kolkata</option>
                                            <option>(GMT+00:00) UTC</option>
                                            <option>(GMT-05:00) America/New_York</option>
                                            <option>(GMT+08:00) Asia/Singapore</option>
                                            <option>(GMT+01:00) Europe/London</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: AI Interview Settings */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-5">
                            <h3 className="text-sm font-bold text-violet-700 tracking-tight">
                                AI Interview Settings
                            </h3>

                            <div className="space-y-4">
                                {/* Interview Mode */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 font-bold text-sm flex items-center justify-center shrink-0">
                                            A
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Interview Mode
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Select default interview mode.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.interviewMode}
                                            onChange={(e) => handleInterviewSelect("interviewMode", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>AI Interview</option>
                                            <option>Live Assessment</option>
                                            <option>Hybrid Assessment</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* AI Avatar */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 font-bold text-sm flex items-center justify-center shrink-0">
                                            A
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                AI Avatar
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Select default AI interviewer.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.aiAvatar}
                                            onChange={(e) => handleInterviewSelect("aiAvatar", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>Ava (Female)</option>
                                            <option>Alex (Male)</option>
                                            <option>Maya (Female)</option>
                                            <option>David (Male)</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Question Difficulty */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Sliders className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Question Difficulty
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Set default difficulty level for questions.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.difficulty}
                                            onChange={(e) => handleInterviewSelect("difficulty", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                            <option>Adaptive</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Question Language */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Languages className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Question Language
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Language used for interview questions.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.language}
                                            onChange={(e) => handleInterviewSelect("language", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>English</option>
                                            <option>Hindi</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>German</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Ask Follow-up Questions */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Ask Follow-up Questions
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Enable AI to ask contextual follow-up questions.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("askFollowUps")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.askFollowUps ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.askFollowUps ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Resume Based Questions */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Resume Based Questions
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Generate questions from candidate resume.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("resumeBasedQuestions")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.resumeBasedQuestions ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.resumeBasedQuestions ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Role Based Questions */}
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Role Based Questions
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Generate questions based on job role &amp; JD.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("roleBasedQuestions")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.roleBasedQuestions ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.roleBasedQuestions ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Row: Proctoring Settings + Communication & Reminders */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CARD 3: Proctoring Settings */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-5">
                            <h3 className="text-sm font-bold text-violet-700 tracking-tight">
                                Proctoring Settings
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {/* Left Sub-column */}
                                <div className="space-y-4">
                                    {/* Enable Proctoring */}
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <Shield className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Enable Proctoring</div>
                                                <div className="text-[10px] text-slate-400">Enable AI proctoring for all interviews.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("enableProctoring")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.enableProctoring ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.enableProctoring ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Face Detection */}
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <User className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Face Detection</div>
                                                <div className="text-[10px] text-slate-400">Detect candidate face during interview.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("faceDetection")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.faceDetection ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.faceDetection ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Multiple Person Detection */}
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <Users className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Multiple Person Detection</div>
                                                <div className="text-[10px] text-slate-400">Detect multiple persons in the camera.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("multiplePersonDetection")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.multiplePersonDetection ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.multiplePersonDetection ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Tab Switch Detection */}
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <Laptop className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Tab Switch Detection</div>
                                                <div className="text-[10px] text-slate-400">Detect candidate tab switch events.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("tabSwitchDetection")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.tabSwitchDetection ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.tabSwitchDetection ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Full Screen Monitoring */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <Maximize2 className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Full Screen Monitoring</div>
                                                <div className="text-[10px] text-slate-400">Force candidate to stay in full screen.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("fullScreenMonitoring")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.fullScreenMonitoring ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.fullScreenMonitoring ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Right Sub-column */}
                                <div className="space-y-4">
                                    {/* Suspicious Activity Threshold */}
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">Suspicious Activity Threshold</div>
                                            <div className="text-[10px] text-slate-400">Actions count before marking as suspicious.</div>
                                            <div className="mt-1.5 relative min-w-[100px]">
                                                <select
                                                    value={interviewSettings.suspiciousThreshold}
                                                    onChange={(e) => handleInterviewSelect("suspiciousThreshold", e.target.value)}
                                                    className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                                >
                                                    <option>1 Action</option>
                                                    <option>3 Actions</option>
                                                    <option>5 Actions</option>
                                                    <option>10 Actions</option>
                                                </select>
                                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("suspiciousToggle")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.suspiciousToggle ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.suspiciousToggle ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Enable Screen Recording */}
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <Laptop className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Enable Screen Recording</div>
                                                <div className="text-[10px] text-slate-400">Record candidate screen during interview.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("screenRecording")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.screenRecording ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.screenRecording ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Enable Video Recording */}
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <Camera className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Enable Video Recording</div>
                                                <div className="text-[10px] text-slate-400">Record candidate video during interview.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("videoRecording")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.videoRecording ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.videoRecording ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Enable Audio Recording */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <Mic className="w-4 h-4 text-violet-600 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">Enable Audio Recording</div>
                                                <div className="text-[10px] text-slate-400">Record candidate audio during interview.</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInterviewToggle("audioRecording")}
                                            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                                                interviewSettings.audioRecording ? "bg-violet-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.audioRecording ? "translate-x-5" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Communication & Reminders */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-5">
                            <h3 className="text-sm font-bold text-violet-700 tracking-tight">
                                Communication &amp; Reminders
                            </h3>

                            <div className="space-y-4">
                                {/* Interview Invitation Email */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Interview Invitation Email
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Send email to candidates when interview is scheduled.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("invitationEmail")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.invitationEmail ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.invitationEmail ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Reminder Before Interview */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Reminder Before Interview
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Send reminder before interview start.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("reminderBeforeInterview")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.reminderBeforeInterview ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.reminderBeforeInterview ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Reminder Time */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Reminder Time
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                How much time before interview to send reminder.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative min-w-[130px]">
                                        <select
                                            value={interviewSettings.reminderTime}
                                            onChange={(e) => handleInterviewSelect("reminderTime", e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500 cursor-pointer"
                                        >
                                            <option>15 Minutes</option>
                                            <option>30 Minutes</option>
                                            <option>1 Hour</option>
                                            <option>24 Hours</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Interview Completion Email */}
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <CheckSquare className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Interview Completion Email
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Send email when interview is completed.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInterviewToggle("completionEmail")}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                            interviewSettings.completionEmail ? "bg-violet-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                                                interviewSettings.completionEmail ? "translate-x-5.5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Custom Instructions to Candidate */}
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                Custom Instructions to Candidate
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Show custom instructions before interview.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditInstructionsModal(true)}
                                        className="px-4 py-2 border border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-violet-700 font-semibold text-xs rounded-xl transition whitespace-nowrap shadow-xs"
                                    >
                                        Manage Instructions
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Full-Width Card: Interview Guidelines / Instructions */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                    Interview Guidelines / Instructions
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                    These instructions will be shown to candidates before joining the interview.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEditInstructionsModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 border border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-violet-700 font-semibold text-xs rounded-xl transition shadow-xs whitespace-nowrap"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Instructions</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                            <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-xs text-slate-600 font-medium">
                                {interviewSettings.guidelines.map((guide, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="font-bold text-slate-800">{idx + 1}.</span>
                                        <span>{guide}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Illustration Avatar / Clipboard */}
                            <div className="md:col-span-3 flex items-center justify-center">
                                <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-2xl flex items-center gap-3">
                                    <div className="w-12 h-14 bg-white rounded-xl border-2 border-violet-500 shadow-xs flex flex-col p-1.5 gap-1 justify-center">
                                        <div className="w-full h-1 bg-violet-400 rounded-full" />
                                        <div className="w-3/4 h-1 bg-violet-300 rounded-full" />
                                        <div className="w-full h-1 bg-violet-400 rounded-full" />
                                        <div className="w-2/3 h-1 bg-violet-300 rounded-full" />
                                    </div>
                                    <div className="text-[11px] font-semibold text-violet-900 leading-tight">
                                        Pre-Interview<br />
                                        <span className="text-violet-600 font-normal">Candidate Screen</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: GENERAL SETTINGS */}
            {activeTab === "general" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
                    {/* LEFT MAIN CARD: General Settings */}
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100/90 shadow-sm p-6 sm:p-8 space-y-8">
                        {/* General Settings Top Header */}
                        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                General Settings
                            </h2>
                            <button
                                onClick={saveGeneralSettings}
                                data-testid="save-settings-btn"
                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-violet-500/25 transition active:scale-[0.98]"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                            </button>
                        </div>

                        {/* SECTION 1: Application Preferences */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-violet-700 tracking-tight">
                                Application Preferences
                            </h3>

                            {/* Dark Mode */}
                            <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-50">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Dark Mode</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Enable dark theme for the application
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleGeneralToggle("darkMode")}
                                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                        preferences.darkMode ? "bg-violet-600" : "bg-slate-200"
                                    }`}
                                >
                                    <span
                                        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                            preferences.darkMode ? "translate-x-6" : "translate-x-0.5"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Compact View */}
                            <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-50">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Compact View</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Reduce spacing for more content on screen
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleGeneralToggle("compactView")}
                                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                        preferences.compactView ? "bg-violet-600" : "bg-slate-200"
                                    }`}
                                >
                                    <span
                                        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                            preferences.compactView ? "translate-x-6" : "translate-x-0.5"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Show Candidate Avatars */}
                            <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-50">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Show Candidate Avatars</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Display candidate profile pictures in lists
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleGeneralToggle("showAvatars")}
                                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                        preferences.showAvatars ? "bg-violet-600" : "bg-slate-200"
                                    }`}
                                >
                                    <span
                                        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                            preferences.showAvatars ? "translate-x-6" : "translate-x-0.5"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Auto Refresh Dashboard */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Auto Refresh Dashboard</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Automatically refresh dashboard data
                                    </div>
                                </div>
                                <div className="relative min-w-[170px]">
                                    <select
                                        value={preferences.autoRefresh}
                                        onChange={(e) => handleGeneralSelect("autoRefresh", e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition cursor-pointer"
                                    >
                                        <option>Never</option>
                                        <option>Every 1 minute</option>
                                        <option>Every 5 minutes</option>
                                        <option>Every 15 minutes</option>
                                        <option>Every 30 minutes</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Default Preferences */}
                        <div className="space-y-6 pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-violet-700 tracking-tight">
                                Default Preferences
                            </h3>

                            {/* Default Jobs Per Page */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-50">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Default Jobs Per Page</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Number of jobs to display per page
                                    </div>
                                </div>
                                <div className="relative min-w-[170px]">
                                    <select
                                        value={preferences.jobsPerPage}
                                        onChange={(e) => handleGeneralSelect("jobsPerPage", e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition cursor-pointer"
                                    >
                                        <option>5</option>
                                        <option>10</option>
                                        <option>20</option>
                                        <option>50</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            {/* Default Candidates Per Page */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-50">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Default Candidates Per Page</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Number of candidates to display per page
                                    </div>
                                </div>
                                <div className="relative min-w-[170px]">
                                    <select
                                        value={preferences.candidatesPerPage}
                                        onChange={(e) => handleGeneralSelect("candidatesPerPage", e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition cursor-pointer"
                                    >
                                        <option>10</option>
                                        <option>25</option>
                                        <option>50</option>
                                        <option>100</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            {/* Default Interview Duration */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-50">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Default Interview Duration</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Default duration for scheduled interviews
                                    </div>
                                </div>
                                <div className="relative min-w-[170px]">
                                    <select
                                        value={preferences.interviewDuration}
                                        onChange={(e) => handleGeneralSelect("interviewDuration", e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition cursor-pointer"
                                    >
                                        <option>15 Minutes</option>
                                        <option>30 Minutes</option>
                                        <option>45 Minutes</option>
                                        <option>60 Minutes</option>
                                        <option>90 Minutes</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            {/* Default Interview Mode */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Default Interview Mode</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-normal">
                                        Preferred interview mode
                                    </div>
                                </div>
                                <div className="relative min-w-[170px]">
                                    <select
                                        value={preferences.interviewMode}
                                        onChange={(e) => handleGeneralSelect("interviewMode", e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition cursor-pointer"
                                    >
                                        <option>AI Interview</option>
                                        <option>Live Video Assessment</option>
                                        <option>In-Person</option>
                                        <option>Phone Screening</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: 4 Stacked Cards */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Card 1: Change Password */}
                        <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">Change Password</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Update your account password to keep your account secure.
                            </p>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full py-2.5 px-4 bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-50/50 text-violet-700 font-semibold text-xs rounded-xl transition shadow-xs text-center block"
                            >
                                Change Password
                            </button>
                        </div>

                        {/* Card 2: Two-Factor Authentication */}
                        <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Add an extra layer of security to your account.
                            </p>
                            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Enabled</span>
                            </div>
                            <button
                                onClick={() => setShow2FAModal(true)}
                                className="w-full py-2.5 px-4 bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-50/50 text-violet-700 font-semibold text-xs rounded-xl transition shadow-xs text-center block"
                            >
                                Manage 2FA
                            </button>
                        </div>

                        {/* Card 3: Active Sessions */}
                        <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">Active Sessions</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Manage your active sessions across devices.
                            </p>
                            <button
                                onClick={() => setShowSessionsModal(true)}
                                className="w-full py-2.5 px-4 bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-50/50 text-violet-700 font-semibold text-xs rounded-xl transition shadow-xs text-center block"
                            >
                                View Sessions
                            </button>
                        </div>

                        {/* Card 4: Danger Zone */}
                        <div className="bg-white rounded-3xl border border-rose-100/80 shadow-sm p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">Danger Zone</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Permanently delete your account and all associated data.
                            </p>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full py-2.5 px-4 bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 font-semibold text-xs rounded-xl transition text-center block"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Edit Guidelines / Instructions */}
            {showEditInstructionsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Edit Interview Instructions</h3>
                                    <p className="text-xs text-slate-500">Configure points shown to candidate</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEditInstructionsModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                            {tempGuidelines.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-500 w-5">{idx + 1}.</span>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const updated = [...tempGuidelines];
                                            updated[idx] = e.target.value;
                                            setTempGuidelines(updated);
                                        }}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTempGuidelines(tempGuidelines.filter((_, i) => i !== idx));
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1.5"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setTempGuidelines([...tempGuidelines, ""])}
                                className="text-xs font-bold text-violet-600 hover:underline pt-2 inline-block"
                            >
                                + Add Instruction Point
                            </button>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowEditInstructionsModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveInstructions}
                                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                            >
                                Save Instructions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Change Password */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Change Password</h3>
                                    <p className="text-xs text-slate-500">Ensure strong security standards</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={pwdForm.current}
                                    onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={pwdForm.newPwd}
                                    onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={pwdForm.confirmPwd}
                                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPwd: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-sm"
                                >
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Manage 2FA */}
            {show2FAModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Two-Factor Authentication</h3>
                                    <p className="text-xs text-slate-500">Authenticator App configured</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShow2FAModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2">
                            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>2FA Protection is Active</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Your account is currently protected using Google Authenticator / TOTP.
                            </p>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="text-slate-700 font-semibold">Backup Codes</div>
                            <p className="text-slate-500">
                                Generate new backup recovery codes in case you lose access to your primary device.
                            </p>
                            <button
                                onClick={() => toast.info("New backup codes generated and downloaded.")}
                                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Download Backup Codes
                            </button>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShow2FAModal(false)}
                                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Active Sessions */}
            {showSessionsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Active Sessions</h3>
                                    <p className="text-xs text-slate-500">Devices logged into your account</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSessionsModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Current Session */}
                            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/60 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <Monitor className="w-5 h-5 text-violet-600 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                            <span>Chrome on Windows 11</span>
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">
                                                Active Now
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Bengaluru, India · IP: 103.21.24.89
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Session */}
                            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/60 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <Smartphone className="w-5 h-5 text-slate-500 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">
                                            Safari on iPhone 15 Pro
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Mumbai, India · 2 hours ago
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toast.success("Session terminated")}
                                    className="text-xs text-rose-600 font-semibold hover:underline"
                                >
                                    Revoke
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                            <button
                                onClick={() => {
                                    toast.success("Logged out from all other devices.");
                                    setShowSessionsModal(false);
                                }}
                                className="text-rose-600 font-semibold hover:underline flex items-center gap-1.5"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Log out all other sessions</span>
                            </button>
                            <button
                                onClick={() => setShowSessionsModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Delete Account */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Delete Account</h3>
                                    <p className="text-xs text-slate-500">Irreversible action</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl text-xs text-rose-800 leading-relaxed">
                            <span className="font-bold">Warning:</span> This will permanently erase your company workspace, candidate pool, interview records, and configurations.
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    toast.error("Account deletion requested. Please contact administrator.");
                                    setShowDeleteModal(false);
                                }}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                            >
                                Yes, Delete My Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
