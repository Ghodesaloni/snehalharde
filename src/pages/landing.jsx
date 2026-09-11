import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import {
    PieChart, Pie, Cell,
} from "recharts";
import aiAvatar from "@/assets/ai_avatar.png";
import { Mic, Video, Phone } from "lucide-react";

const stageData = [
    { name: "Applied", value: 520, color: "#7c3aed" },
    { name: "Screening", value: 320, color: "#22c55e" },
    { name: "Interview", value: 250, color: "#f59e0b" },
    { name: "Selected", value: 158, color: "#3b82f6" },
];

const features = [
    { icon: "fa-file-lines", color: "bg-violet-100 text-violet-600", title: "AI Resume Screening", desc: "Automatically screen and rank resumes based on job requirements." },
    { icon: "fa-robot", color: "bg-blue-100 text-blue-600", title: "AI Interviewer", desc: "Conduct intelligent interviews with AI avatar and evaluate real-time performance." },
    { icon: "fa-chart-line", color: "bg-emerald-100 text-emerald-600", title: "Smart Analytics", desc: "Get deep insights and reports to make data-driven hiring decisions." },
    { icon: "fa-shield-halved", color: "bg-amber-100 text-amber-600", title: "Anti-Cheating System", desc: "Advanced proctoring ensures fair and secure interviews every time." },
    { icon: "fa-envelope-open-text", color: "bg-rose-100 text-rose-600", title: "Automated Communication", desc: "Send interview links, reminders and updates automatically via email." },
];

const stats = [
    { icon: "fa-users", color: "bg-violet-100 text-violet-600", value: "500+", label: "Companies Trust Us" },
    { icon: "fa-user-tie", color: "bg-blue-100 text-blue-600", value: "50K+", label: "Candidates Hired" },
    { icon: "fa-clipboard-check", color: "bg-emerald-100 text-emerald-600", value: "200K+", label: "Interviews Conducted" },
    { icon: "fa-clock", color: "bg-amber-100 text-amber-600", value: "90%", label: "Time Saved in Hiring" },
];

const DashboardPreview = () => (
    <div className="relative animate-float" data-testid="hero-dashboard-preview">
        {/* background dots */}
        <div className="absolute -inset-6 grid-bg opacity-40 rounded-3xl" />

        <div className="relative bg-white rounded-2xl shadow-2xl shadow-violet-500/10 border border-slate-200 overflow-hidden">
            <div className="flex">
                {/* dark sidebar */}
                <div className="w-40 bg-slate-900 py-5 px-3 hidden sm:block">
                    <div className="text-white font-bold mb-6 px-2">AvaHire</div>
                    {["Dashboard", "Jobs", "Candidates", "Interviews", "Messages", "Settings"].map((it, i) => (
                        <div key={it} className={`text-xs px-3 py-2.5 rounded-lg mb-1 ${i === 0 ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
                            {it}
                        </div>
                    ))}
                </div>
                <div className="flex-1 p-5">
                    <div className="text-lg font-bold mb-4">Dashboard</div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                            { c: "bg-violet-50 text-violet-600", l: "Total Jobs", v: "24", i: "fa-briefcase" },
                            { c: "bg-emerald-50 text-emerald-600", l: "Total Candidates", v: "1,248", i: "fa-users" },
                            { c: "bg-blue-50 text-blue-600", l: "Interviews Scheduled", v: "142", i: "fa-calendar" },
                            { c: "bg-amber-50 text-amber-600", l: "Hires Made", v: "32", i: "fa-house-user" },
                        ].map(s => (
                            <div key={s.l} className="p-2 rounded-lg border border-slate-200">
                                <div className={`w-7 h-7 rounded-md ${s.c} flex items-center justify-center text-[11px] mb-1`}>
                                    <i className={`fa-solid ${s.i}`}></i>
                                </div>
                                <div className="text-[9px] text-slate-500">{s.l}</div>
                                <div className="text-sm font-bold">{s.v}</div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 rounded-lg p-3">
                            <div className="text-xs font-semibold mb-2">Recent Activity</div>
                            {["Frontend Developer", "AI/ML Engineer", "UI/UX Designer", "Data Analyst"].map((r) => (
                                <div key={r} className="flex items-center gap-2 py-1">
                                    <div className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[9px]"><i className="fa-solid fa-user"></i></div>
                                    <div>
                                        <div className="text-[10px] font-semibold">{r}</div>
                                        <div className="text-[8px] text-slate-400">{Math.floor(Math.random() * 8) + 3} New Applications</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border border-slate-200 rounded-lg p-3 min-w-0">
                            <div className="text-xs font-semibold mb-1">Candidates by Stage</div>
                            <div className="flex items-center gap-2">
                                <div className="relative w-24 h-24 min-w-[96px] min-h-[96px] shrink-0 flex items-center justify-center">
                                    <PieChart width={96} height={96}>
                                        <Pie data={stageData} innerRadius={26} outerRadius={40} paddingAngle={2} dataKey="value">
                                            {stageData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                    </PieChart>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <div className="text-[10px] text-slate-400">Total</div>
                                        <div className="text-sm font-bold">1,248</div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    {stageData.map(s => (
                                        <div key={s.name} className="flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                                                {s.name}
                                            </div>
                                            <span className="font-semibold">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* floating live interview card */}
        <div className="avatar-card" id="avatar-card">
            {/* Header badges */}
            <div className="avatar-header">
                <span className="avatar-badge-ai">AI Interview</span>
                <span className="avatar-badge-live">
                    <span className="live-dot" />
                    Live
                </span>
            </div>

            {/* Video preview simulation */}
            <div className="avatar-image-container">
                <img 
                    src={aiAvatar} 
                    alt="AI Interviewer Avatar" 
                    className="avatar-image" 
                />
                <div className="avatar-subtitle-overlay" id="interview-subtitles">
                    <span>Click avatar to start simulated interview!</span>
                </div>
            </div>

            {/* Controls */}
            <div className="avatar-footer">
                <div className="control-btn-group">
                    <button
                        className="ctrl-btn ctrl-mic"
                        id="ctrl-mic"
                        aria-label="Toggle Microphone"
                    >
                        <Mic size={18} />
                    </button>

                    <button
                        className="ctrl-btn ctrl-video"
                        id="ctrl-video"
                        aria-label="Toggle Camera"
                    >
                        <Video size={18} />
                    </button>

                    <button
                        className="ctrl-btn ctrl-decline"
                        id="ctrl-start"
                        title="Start/Stop Demonstration"
                    >
                        <Phone size={20} />
                    </button>
                </div>
            </div>

            {/* Panel */}
            <div className="interview-panel" id="interview-panel">
                <div className="panel-header">
                    <span>Interview Interaction Console</span>
                    <button
                        id="close-panel"
                        className="close-panel-btn"
                        aria-label="Close interview panel"
                    >
                        &times;
                    </button>
                </div>
                <div className="panel-choices" id="panel-choices"></div>
            </div>
        </div>
        {/* floating match card */}
        <div className="absolute -top-3 -right-3 sm:top-14 sm:-right-6 bg-white border border-slate-200 rounded-xl shadow-xl p-3 flex items-center gap-3">
            <div className="relative w-12 h-12">
                <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="86.7 100" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-emerald-600">92%</div>
            </div>
            <div>
                <div className="text-[10px] text-slate-500">Top Candidate Match</div>
                <div className="text-sm font-bold">Rahul Sharma</div>
                <div className="text-[9px] text-slate-400">Senior Frontend Developer</div>
                <div className="text-amber-500 text-[10px]">★★★★★</div>
            </div>
        </div>
    </div>
);

const Landing = () => {
    return (
        <div className="min-h-screen bg-white" data-testid="landing-page">
            <PublicHeader />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/60 via-white to-white">
                <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center relative">
                    <div className="animate-fade-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-violet-200 text-sm font-medium text-slate-700 shadow-sm">
                            <i className="fa-solid fa-wand-magic-sparkles text-violet-600"></i>
                            AI-Powered Hiring, Smarter Decisions
                        </div>
                        <h1 className="mt-6 text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
                            Hire the Right <span className="whitespace-nowrap">Talent</span> <br />
                            with <span className="gradient-text">AI Intelligence</span>
                        </h1>
                        <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
                            AvaHire helps HR teams streamline recruitment from job posting to final selection using AI-driven screening, interviews, and real-time insights.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                to="/register"
                                data-testid="hero-get-started-btn"
                                className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold"
                            >
                                <i className="fa-solid fa-rocket"></i>
                                Get Started Free
                            </Link>
                            <Link
                                to="/how-it-works"
                                data-testid="hero-watch-demo-btn"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white border border-slate-200 text-slate-900 font-semibold hover:border-violet-400 transition"
                            >
                                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px]">
                                    <i className="fa-solid fa-play"></i>
                                </span>
                                Watch Demo
                            </Link>
                        </div>
                    </div>
                    <div className="relative">
                        <DashboardPreview />
                    </div>
                </div>
            </section>

            {/* Why Choose */}
            <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20" data-testid="why-choose-section">
                <h2 className="text-center text-4xl font-extrabold text-slate-900">
                    Why Choose <span className="gradient-text">AvaHire?</span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 mt-12">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                            className="card-hover bg-white border border-slate-200 rounded-2xl p-6"
                        >
                            <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center text-lg`}>
                                <i className={`fa-solid ${f.icon}`}></i>
                            </div>
                            <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* stats */}
                <div className="mt-14 bg-violet-50/60 border border-violet-100 rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((s) => (
                        <div key={s.label} className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full ${s.color} flex items-center justify-center text-xl`}>
                                <i className={`fa-solid ${s.icon}`}></i>
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
                                <div className="text-sm text-slate-500">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-8">
                <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-10 lg:p-14 relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <h3 className="text-3xl lg:text-4xl font-extrabold">Start hiring 10x faster today.</h3>
                            <p className="mt-3 text-violet-100 max-w-lg">Join hundreds of teams who trust AvaHire to find, screen and interview top talent with AI.</p>
                        </div>
                        <div className="flex flex-wrap gap-3 lg:justify-end">
                            <Link to="/register" className="bg-white text-violet-700 font-semibold px-6 py-3 rounded-full hover:bg-slate-100 transition">Create free account</Link>
                            <Link to="/contact" className="border border-white/40 px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition">Talk to sales</Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Landing;
