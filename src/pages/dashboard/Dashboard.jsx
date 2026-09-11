import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import { dashboardApi } from "@/services/api";

const initialKpis = [
    { icon: "fa-briefcase", color: "bg-violet-100 text-violet-600", label: "Total Jobs", value: "0", sub: "0 Active Jobs", subColor: "text-slate-400" },
    { icon: "fa-users", color: "bg-emerald-100 text-emerald-600", label: "Total Candidates", value: "0", sub: "0 In Pipeline", subColor: "text-slate-400" },
    { icon: "fa-calendar", color: "bg-blue-100 text-blue-600", label: "Interviews Scheduled", value: "0", sub: "0 Total Sessions", subColor: "text-slate-400" },
    { icon: "fa-chart-line", color: "bg-amber-100 text-amber-600", label: "Completed Interviews", value: "0", sub: "Evaluated by AI", subColor: "text-slate-400" },
    { icon: "fa-circle-check", color: "bg-rose-100 text-rose-600", label: "Selected Candidates", value: "0", sub: "Ready for offer", subColor: "text-slate-400" },
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
    const [stats, setStats] = useState(null);
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
                const data = await dashboardApi.getStats(userEmail);
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
    const topJobs = stats?.topJobs || [];
    const recentJobs = stats?.jobs || topJobs;
    const upcoming = stats?.upcoming || [];
    const activity = stats?.activity || [];

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
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-w-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Interviews Overview</div>
                        <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
                            <option>This Week</option>
                            <option>This Month</option>
                        </select>
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
                            { l: "Total", v: kpis[2]?.value || "0", c: "text-slate-900" },
                            { l: "Scheduled", v: kpis[2]?.value || "0", c: "text-violet-600" },
                            { l: "In Progress", v: "0", c: "text-amber-600" },
                            { l: "Completed", v: kpis[3]?.value || "0", c: "text-emerald-600" },
                        ].map((s) => (
                            <div key={s.l}>
                                <div className="text-xs text-slate-500">{s.l}</div>
                                <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-w-0">
                    <div className="font-bold text-slate-900 mb-4">Candidates by Stage</div>
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
                        {topJobs.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <i className="fa-solid fa-briefcase text-2xl text-slate-300 mb-2 block"></i>
                                <p className="text-xs font-semibold text-slate-600">No jobs created yet</p>
                                <Link to="/app/jobs" className="mt-2 inline-block text-xs text-violet-600 font-semibold hover:underline">
                                    Create Job
                                </Link>
                            </div>
                        ) : (
                            topJobs.map((j) => (
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
                            ))
                        )}
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
                                {recentJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                                            No jobs in database yet.
                                        </td>
                                    </tr>
                                ) : (
                                    recentJobs.map((j) => (
                                        <tr key={j.id || j.title} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="py-3 font-medium text-slate-900 truncate max-w-[130px]">{j.title}</td>
                                            <td className="text-slate-500 text-xs">{j.dept}</td>
                                            <td className="text-slate-900 font-semibold text-xs">{j.candidates}</td>
                                            <td>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${j.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{j.status}</span>
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
                        <Link to="/app/interviews" className="text-xs text-violet-600 font-semibold hover:underline">View All</Link>
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
                            upcoming.map((u) => (
                                <div key={u.id || u.name} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                        {(u.name || "C").split(" ").map(n => n[0]).join("")}
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
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-slate-900">Recent HR Activity</div>
                        <span className="text-xs text-slate-400 font-medium">Live Feed</span>
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
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
