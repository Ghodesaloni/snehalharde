import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import {
    Briefcase,
    Users,
    Video,
    Calendar as CalendarIcon,
    Mail,
    FileText,
    Settings as SettingsIcon,
    ArrowRight,
    ExternalLink,
    Copy,
    Check,
    Plus,
    Clock,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { dashboardApi, jobsApi, resumesApi } from "@/services/api";
import { getMatchingResumesForJob } from "@/utils/jdMatcher";

const initialKpis = [
    { icon: "fa-briefcase", color: "bg-violet-100 text-violet-600", label: "Total Jobs", value: "0", sub: "0 Active Jobs", subColor: "text-slate-400", link: "/app/jobs" },
    { icon: "fa-users", color: "bg-emerald-100 text-emerald-600", label: "Total Candidates", value: "0", sub: "0 In Pipeline", subColor: "text-slate-400", link: "/app/candidates" },
    { icon: "fa-calendar", color: "bg-blue-100 text-blue-600", label: "Interviews Scheduled", value: "0", sub: "0 Total Sessions", subColor: "text-slate-400", link: "/app/interviews" },
    { icon: "fa-chart-line", color: "bg-amber-100 text-amber-600", label: "Completed Interviews", value: "0", sub: "Evaluated by AI", subColor: "text-slate-400", link: "/app/interviews" },
    { icon: "fa-circle-check", color: "bg-rose-100 text-rose-600", label: "Selected Candidates", value: "0", sub: "Ready for offer", subColor: "text-slate-400", link: "/app/candidates?status=Selected" },
];

const initialWeekData = [
    { d: "Mon", v: 0 }, { d: "Tue", v: 0 }, { d: "Wed", v: 0 }, { d: "Thu", v: 0 },
    { d: "Fri", v: 0 }, { d: "Sat", v: 0 }, { d: "Sun", v: 0 },
];

const initialStageData = [
    { name: "Applied", value: 0, pct: "0%", color: "#3b82f6" },
    { name: "Screening", value: 0, pct: "0%", color: "#8b5cf6" },
    { name: "Interview", value: 0, pct: "0%", color: "#f59e0b" },
    { name: "Interviewed", value: 0, pct: "0%", color: "#14b8a6" },
    { name: "Selected", value: 0, pct: "0%", color: "#22c55e" },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [allJobs, setAllJobs] = useState([]);
    const [allResumes, setAllResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchStats = async () => {
            try {
                let userEmail = "";
                try {
                    const storedUser = JSON.parse(localStorage.getItem("avahire_user") || "{}");
                    userEmail = storedUser?.email || "";
                } catch {
                    // ignore
                }
                const [data, jobsList, resumesList] = await Promise.all([
                    dashboardApi.getStats(userEmail).catch(() => null),
                    jobsApi.getAll().catch(() => []),
                    resumesApi.getAll().catch(() => [])
                ]);
                if (data) {
                    setStats(data);
                }
                if (Array.isArray(jobsList)) {
                    setAllJobs(jobsList);
                }
                if (Array.isArray(resumesList)) {
                    setAllResumes(resumesList);
                }
            } catch (err) {
                console.error("Failed to load dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const kpiLinks = ["/app/jobs", "/app/candidates", "/app/interviews", "/app/interviews", "/app/candidates?status=Selected"];
    const kpis = (stats?.kpis || initialKpis).map((k, idx) => ({
        ...k,
        link: k.link || kpiLinks[idx] || "/app/dashboard"
    }));

    const weekData = stats?.weekData || initialWeekData;
    const stageData = stats?.stageData || initialStageData;
    const rawTopJobs = allJobs.length > 0 ? allJobs.slice(0, 5) : (stats?.topJobs || []);
    const topJobs = rawTopJobs.map((j) => ({
        ...j,
        candidates: getMatchingResumesForJob(allResumes, j, allJobs).length
    }));
    const rawRecentJobs = allJobs.length > 0 ? allJobs.slice(0, 6) : (stats?.jobs || topJobs);
    const recentJobs = rawRecentJobs.map((j) => ({
        ...j,
        candidates: getMatchingResumesForJob(allResumes, j, allJobs).length
    }));
    const upcoming = stats?.upcoming || [];
    const activity = stats?.activity || [];

    const totalInFunnel = stageData.reduce((acc, s) => acc + (s.value || 0), 0);

    return (
        <div className="space-y-6" data-testid="dashboard-page">
            {/* Quick Action Hub Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="text-xs font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            HR Quick Actions
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mt-0.5">
                            Recruitment Pipeline Shortcuts
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        <Link
                            to="/app/jobs"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition shadow-2xs"
                        >
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>Post Job</span>
                        </Link>
                        <Link
                            to="/app/resumes"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition shadow-2xs"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Upload Resumes</span>
                        </Link>
                        <Link
                            to="/app/candidates"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition shadow-2xs"
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Candidates</span>
                        </Link>
                        <Link
                            to="/app/interviews"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition shadow-2xs"
                        >
                            <Video className="w-3.5 h-3.5" />
                            <span>Interviews</span>
                        </Link>
                        <Link
                            to="/app/email"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition shadow-2xs"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email Center</span>
                        </Link>
                        <Link
                            to="/app/calendar"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition shadow-2xs"
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Calendar</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Clickable KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpis.map((k) => (
                    <Link
                        key={k.label}
                        to={k.link}
                        data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm card-hover hover:border-violet-300 hover:shadow-md transition-all group block"
                        title={`Go to ${k.label}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs text-slate-500 font-medium group-hover:text-violet-600 transition-colors flex items-center gap-1">
                                    <span>{k.label}</span>
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900 mt-1">{k.value}</div>
                                <div className={`text-xs mt-1 ${k.subColor}`}>{k.sub}</div>
                            </div>
                            <div className={`w-11 h-11 rounded-xl ${k.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                <i className={`fa-solid ${k.icon}`}></i>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Row 1: chart + donut + top jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-w-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Interviews Overview</div>
                        <Link to="/app/interviews" className="text-xs text-violet-600 font-semibold hover:underline">
                            View Interviews →
                        </Link>
                    </div>
                    <div className="w-full h-[220px] min-w-0 min-h-[220px]">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 500, height: 220 }}>
                                <AreaChart data={weekData}>
                                    <defs>
                                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="d" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, (dataMax) => Math.max(dataMax || 0, 4)]} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                                    <Area type="monotone" dataKey="v" stroke="#7c3aed" strokeWidth={3} fill="url(#g1)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="grid grid-cols-4 gap-3 mt-4 border-t border-slate-100 pt-3">
                        {[
                            { l: "Total", v: kpis[2]?.value || "0", c: "text-slate-900", link: "/app/interviews" },
                            { l: "Scheduled", v: kpis[2]?.value || "0", c: "text-violet-600", link: "/app/interviews" },
                            { l: "Calendar", v: "View", c: "text-amber-600", link: "/app/calendar" },
                            { l: "Completed", v: kpis[3]?.value || "0", c: "text-emerald-600", link: "/app/interviews" },
                        ].map((s) => (
                            <Link key={s.l} to={s.link} className="hover:opacity-80 transition block">
                                <div className="text-xs text-slate-500">{s.l}</div>
                                <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-w-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Candidates by Stage</div>
                        <Link to="/app/candidates" className="text-xs text-violet-600 font-semibold hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-40 h-40 min-w-[160px] min-h-[160px] shrink-0 flex items-center justify-center">
                            <PieChart width={160} height={160}>
                                {totalInFunnel === 0 ? (
                                    <Pie data={[{ name: "Empty", value: 1 }]} innerRadius={44} outerRadius={70} dataKey="value">
                                        <Cell fill="#f1f5f9" />
                                    </Pie>
                                ) : (
                                    <Pie data={stageData} innerRadius={44} outerRadius={70} paddingAngle={2} dataKey="value">
                                        {stageData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                )}
                            </PieChart>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-2xl font-extrabold text-slate-900">{totalInFunnel}</div>
                                <div className="text-xs text-slate-500">In Pipeline</div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            {stageData.map((s) => (
                                <Link
                                    key={s.name}
                                    to={`/app/candidates?status=${encodeURIComponent(s.name)}`}
                                    className="flex items-center justify-between text-xs hover:bg-slate-50 p-1 rounded-md transition"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                        <span className="text-slate-700 font-medium">{s.name}</span>
                                    </div>
                                    <span className="text-slate-500 font-semibold">{s.value} ({s.pct})</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Top Job Openings</div>
                        <Link to="/app/jobs" className="text-xs text-violet-600 font-semibold hover:underline">Manage Jobs →</Link>
                    </div>
                    <div className="space-y-3">
                        {topJobs.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <i className="fa-solid fa-briefcase text-2xl text-slate-300 mb-2 block"></i>
                                <p className="text-xs font-semibold text-slate-600">No jobs created yet</p>
                                <Link to="/app/jobs" className="mt-2 inline-block text-xs text-violet-600 font-semibold hover:underline">
                                    Create Job
                                </Link>
                            </div>
                        ) : (
                            topJobs.map((j, i) => (
                                <Link
                                    key={j.id ? `${j.id}-${i}` : `top-job-${i}`}
                                    to={j.id ? `/app/resumes?jobId=${encodeURIComponent(j.id)}` : `/app/resumes?job=${encodeURIComponent(j.title)}`}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                                    title="Click to view shortlisted resumes matching this job's JD"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                        <i className="fa-solid fa-briefcase"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-violet-600 transition-colors">{j.title}</div>
                                        <div className="text-xs text-slate-500">{j.dept}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-900">{j.candidates}</div>
                                        <div className="text-[10px] text-slate-400">Shortlisted</div>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${j.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{j.status}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: recent jobs + upcoming interviews + recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Recent Job Openings</div>
                        <Link to="/app/jobs" className="text-xs text-violet-600 font-semibold hover:underline">View All Jobs</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 border-b border-slate-100">
                                    <th className="text-left font-medium py-2">Job Title</th>
                                    <th className="text-left font-medium">Dept</th>
                                    <th className="text-left font-medium">Cand</th>
                                    <th className="text-left font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                                            No jobs posted yet.
                                        </td>
                                    </tr>
                                ) : (
                                    recentJobs.map((j, i) => (
                                        <tr key={j.id ? `${j.id}-${i}` : `rjob-${i}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="py-3 font-medium text-slate-900 truncate max-w-[130px]">{j.title}</td>
                                            <td className="text-slate-500 text-xs">{j.dept}</td>
                                            <td className="text-slate-900 font-semibold text-xs">{j.candidates}</td>
                                            <td>
                                                <Link
                                                    to={j.id ? `/app/resumes?jobId=${encodeURIComponent(j.id)}` : `/app/resumes?job=${encodeURIComponent(j.title)}`}
                                                    className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 hover:underline"
                                                >
                                                    Resumes →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Upcoming Interviews</div>
                        <Link to="/app/interviews" className="text-xs text-violet-600 font-semibold hover:underline">Schedule / View</Link>
                    </div>
                    <div className="space-y-3">
                        {upcoming.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <i className="fa-solid fa-calendar text-2xl text-slate-300 mb-2 block"></i>
                                <p className="text-xs font-semibold text-slate-600">No interviews scheduled yet</p>
                                <Link to="/app/interviews" className="mt-2 inline-block text-xs text-violet-600 font-semibold hover:underline">
                                    Schedule an Interview
                                </Link>
                            </div>
                        ) : (
                            upcoming.map((u, i) => (
                                <div key={u.id ? `${u.id}-${i}` : `upcoming-${i}`} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 p-2 rounded-xl transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                            {(u.name || "C").split(" ").map(n => n[0]).join("")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-slate-900 truncate">{u.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{u.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                            {u.time || "Scheduled"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Recent Activity</div>
                        <span className="text-xs text-slate-400 font-medium">Activity Log</span>
                    </div>
                    <div className="space-y-4">
                        {activity.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <i className="fa-solid fa-clock-rotate-left text-2xl text-slate-300 mb-2 block"></i>
                                <p className="text-xs font-semibold text-slate-600">No recent activity records</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Actions and updates will appear here live</p>
                            </div>
                        ) : (
                            activity.map((a, i) => (
                                <div key={a.id ? `${a.id}-${i}` : `activity-${i}`} className="flex gap-3 items-start">
                                    <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center shrink-0 text-xs`}>
                                        <i className={`fa-solid ${a.icon}`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-slate-900 leading-snug">{a.user}</div>
                                        <div className="text-xs text-slate-600 mt-0.5">{a.action}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 shrink-0">{a.time}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
