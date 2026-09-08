import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import { dashboardApi } from "@/services/api";

const initialKpis = [
    { icon: "fa-briefcase", color: "bg-violet-100 text-violet-600", label: "Total Jobs", value: "5", sub: "5 Active Jobs", subColor: "text-slate-400" },
    { icon: "fa-users", color: "bg-emerald-100 text-emerald-600", label: "Total Candidates", value: "9", sub: "6 In Pipeline", subColor: "text-emerald-600" },
    { icon: "fa-calendar", color: "bg-blue-100 text-blue-600", label: "Interviews Scheduled", value: "3", sub: "4 Total Sessions", subColor: "text-blue-600" },
    { icon: "fa-chart-line", color: "bg-amber-100 text-amber-600", label: "Completed Interviews", value: "1", sub: "Evaluated by AI", subColor: "text-slate-400" },
    { icon: "fa-circle-check", color: "bg-rose-100 text-rose-600", label: "Selected Candidates", value: "2", sub: "Ready for offer", subColor: "text-slate-400" },
];

const initialWeekData = [
    { d: "Mon", v: 4 }, { d: "Tue", v: 8 }, { d: "Wed", v: 6 }, { d: "Thu", v: 12 },
    { d: "Fri", v: 9 }, { d: "Sat", v: 3 }, { d: "Sun", v: 1 },
];

const initialStageData = [
    { name: "Applied", value: 3, pct: "30%", color: "#3b82f6" },
    { name: "Screening", value: 4, pct: "40%", color: "#8b5cf6" },
    { name: "Interview", value: 3, pct: "30%", color: "#f59e0b" },
    { name: "Interviewed", value: 2, pct: "20%", color: "#14b8a6" },
    { name: "Selected", value: 2, pct: "20%", color: "#22c55e" },
];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardApi.getStats();
                if (data) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to load dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const kpis = stats?.kpis || initialKpis;
    const weekData = stats?.weekData || initialWeekData;
    const stageData = stats?.stageData || initialStageData;
    const topJobs = stats?.topJobs || [
        { id: "job-1", title: "Senior Software Engineer", dept: "Engineering", candidates: 18, status: "Active" },
        { id: "job-2", title: "Python Developer", dept: "Engineering", candidates: 24, status: "Active" },
        { id: "job-3", title: "UI/UX Product Designer", dept: "Design", candidates: 12, status: "Active" }
    ];
    const recentJobs = stats?.jobs || topJobs;
    const upcoming = stats?.upcoming || [
        { id: "iv-1", name: "Snehal Harde", role: "Frontend Developer", time: "02 Sep 2026, 11:00 AM", status: "Active" },
        { id: "iv-2", name: "Rohan Verma", role: "Backend Developer", time: "03 Sep 2026, 02:00 PM", status: "Active" }
    ];
    const activity = stats?.activity || [
        { id: "1", user: "Snehal Harde", action: "Shortlisted for Python Developer (ATS: 87)", time: "10 mins ago", icon: "fa-user-check", color: "text-emerald-500 bg-emerald-50" },
        { id: "2", user: "Rohan Verma", action: "Scheduled AI Technical Interview", time: "45 mins ago", icon: "fa-calendar-check", color: "text-blue-500 bg-blue-50" }
    ];

    const totalInFunnel = stageData.reduce((acc, s) => acc + (s.value || 0), 0);

    return (
        <div className="space-y-6" data-testid="dashboard-page">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpis.map((k) => (
                    <div key={k.label} data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm card-hover">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs text-slate-500 font-medium">{k.label}</div>
                                <div className="text-3xl font-extrabold text-slate-900 mt-1">{k.value}</div>
                                <div className={`text-xs mt-1 ${k.subColor}`}>{k.sub}</div>
                            </div>
                            <div className={`w-11 h-11 rounded-xl ${k.color} flex items-center justify-center`}>
                                <i className={`fa-solid ${k.icon}`}></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 1: chart + donut + top jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Interviews Overview</div>
                        <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
                            <option>This Week</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={weekData}>
                            <defs>
                                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="d" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                            <Area type="monotone" dataKey="v" stroke="#7c3aed" strokeWidth={3} fill="url(#g1)" />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-4 gap-3 mt-4 border-t border-slate-100 pt-3">
                        {[
                            { l: "Total", v: kpis[2]?.value || "4", c: "text-slate-900" },
                            { l: "Scheduled", v: kpis[2]?.value || "3", c: "text-violet-600" },
                            { l: "In Progress", v: "1", c: "text-amber-600" },
                            { l: "Completed", v: kpis[3]?.value || "1", c: "text-emerald-600" },
                        ].map((s) => (
                            <div key={s.l}>
                                <div className="text-xs text-slate-500">{s.l}</div>
                                <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="font-bold text-slate-900 mb-4">Candidates by Stage</div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-40 h-40">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={stageData} innerRadius={44} outerRadius={70} paddingAngle={2} dataKey="value">
                                        {stageData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-2xl font-extrabold text-slate-900">{totalInFunnel}</div>
                                <div className="text-xs text-slate-500">In Pipeline</div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            {stageData.map((s) => (
                                <div key={s.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                        <span className="text-slate-700 font-medium">{s.name}</span>
                                    </div>
                                    <span className="text-slate-500 font-semibold">{s.value} ({s.pct})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Top Job Openings</div>
                        <Link to="/app/jobs" className="text-xs text-violet-600 font-semibold hover:underline">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {topJobs.map((j) => (
                            <div key={j.id || j.title} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold">
                                    <i className="fa-solid fa-briefcase"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-slate-900 truncate">{j.title}</div>
                                    <div className="text-xs text-slate-500">{j.dept}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">{j.candidates}</div>
                                    <div className="text-[10px] text-slate-400">Candidates</div>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${j.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{j.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: recent jobs + upcoming interviews + recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Recent Jobs Database</div>
                        <Link to="/app/jobs" className="text-xs text-violet-600 font-semibold hover:underline">Manage Jobs</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 border-b border-slate-100">
                                    <th className="text-left font-medium py-2">Job Title</th>
                                    <th className="text-left font-medium">Dept</th>
                                    <th className="text-left font-medium">Cand</th>
                                    <th className="text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.map((j) => (
                                    <tr key={j.id || j.title} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        <td className="py-3 font-medium text-slate-900 truncate max-w-[130px]">{j.title}</td>
                                        <td className="text-slate-500 text-xs">{j.dept}</td>
                                        <td className="text-slate-900 font-semibold text-xs">{j.candidates}</td>
                                        <td>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${j.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{j.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Upcoming Interviews</div>
                        <Link to="/app/interviews" className="text-xs text-violet-600 font-semibold hover:underline">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {upcoming.map((u) => (
                            <div key={u.id || u.name} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                    {u.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-slate-900 truncate">{u.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{u.role}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] text-slate-600 font-medium">{u.time}</div>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 inline-block mt-0.5">{u.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Recent HR Activity</div>
                        <span className="text-xs text-slate-400 font-medium">Live Feed</span>
                    </div>
                    <div className="space-y-4">
                        {activity.map((a, i) => (
                            <div key={a.id || i} className="flex gap-3 items-start">
                                <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center shrink-0 text-xs`}>
                                    <i className={`fa-solid ${a.icon}`}></i>
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-semibold text-slate-900 leading-snug">{a.user}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">{a.action}</div>
                                </div>
                                <div className="text-[10px] text-slate-400 shrink-0">{a.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
