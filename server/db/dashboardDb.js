const jobsDb = require("./jobsDb");
const resumesDb = require("./resumesDb");
const interviewsDb = require("./interviewsDb");
const candidatesDb = require("./candidatesDb");
const emailCenterDb = require("./emailCenterDb");

class DashboardDatabase {
  async getStats() {
    const jobs = await Promise.resolve(jobsDb.getAll());
    const resumes = await Promise.resolve(resumesDb.getAll());
    const interviews = await Promise.resolve(interviewsDb.getAll());
    const candidates = await Promise.resolve(candidatesDb.getAll());

    const activeJobs = jobs.filter(j => j.status.toLowerCase() === "active").length;
    const selectedCandidates = candidates.filter(c => c.status.toLowerCase() === "selected").length +
      resumes.filter(r => r.status.toLowerCase() === "hired").length;
    const completedInterviews = interviews.filter(i => i.status.toLowerCase() === "completed").length;
    const activeScheduledInterviews = interviews.filter(i => i.status.toLowerCase() === "active" || i.status.toLowerCase() === "scheduled").length;

    const kpis = [
      {
        icon: "fa-briefcase",
        color: "bg-violet-100 text-violet-600",
        label: "Total Jobs",
        value: String(jobs.length),
        sub: `${activeJobs} Active Jobs`,
        subColor: "text-slate-400"
      },
      {
        icon: "fa-users",
        color: "bg-emerald-100 text-emerald-600",
        label: "Total Candidates",
        value: String(resumes.length + candidates.length),
        sub: `${resumes.length} In Pipeline`,
        subColor: "text-emerald-600"
      },
      {
        icon: "fa-calendar",
        color: "bg-blue-100 text-blue-600",
        label: "Interviews Scheduled",
        value: String(activeScheduledInterviews),
        sub: `${interviews.length} Total Sessions`,
        subColor: "text-blue-600"
      },
      {
        icon: "fa-chart-line",
        color: "bg-amber-100 text-amber-600",
        label: "Completed Interviews",
        value: String(completedInterviews),
        sub: "Evaluated by AI",
        subColor: "text-slate-400"
      },
      {
        icon: "fa-circle-check",
        color: "bg-rose-100 text-rose-600",
        label: "Selected Candidates",
        value: String(selectedCandidates),
        sub: "Ready for offer",
        subColor: "text-slate-400"
      }
    ];

    // Weekly interview chart data
    const weekData = [
      { d: "Mon", v: 4 },
      { d: "Tue", v: 8 },
      { d: "Wed", v: 6 },
      { d: "Thu", v: 12 },
      { d: "Fri", v: 9 },
      { d: "Sat", v: 3 },
      { d: "Sun", v: 1 }
    ];

    // Pipeline funnel stage breakdown
    const totalPipeline = Math.max(1, resumes.length + candidates.length);
    const appliedCount = resumes.filter(r => r.status === "New").length || 3;
    const screeningCount = resumes.filter(r => r.status === "Shortlisted").length || 5;
    const interviewCount = interviews.length || 4;
    const interviewedCount = candidates.length || 3;
    const finalSelectedCount = selectedCandidates || 2;

    const stageData = [
      { name: "Applied", value: appliedCount, pct: `${Math.round((appliedCount / totalPipeline) * 100)}%`, color: "#3b82f6" },
      { name: "Screening", value: screeningCount, pct: `${Math.round((screeningCount / totalPipeline) * 100)}%`, color: "#8b5cf6" },
      { name: "Interview", value: interviewCount, pct: `${Math.round((interviewCount / totalPipeline) * 100)}%`, color: "#f59e0b" },
      { name: "Interviewed", value: interviewedCount, pct: `${Math.round((interviewedCount / totalPipeline) * 100)}%`, color: "#14b8a6" },
      { name: "Selected", value: finalSelectedCount, pct: `${Math.round((finalSelectedCount / totalPipeline) * 100)}%`, color: "#22c55e" }
    ];

    // Top jobs with candidate counts
    const topJobs = jobs.slice(0, 4).map(j => ({
      id: j.id,
      title: j.title,
      dept: j.dept,
      loc: j.loc,
      candidates: j.candidates,
      status: j.status
    }));

    // Upcoming interviews list
    const upcoming = interviews.slice(0, 4).map(i => ({
      id: i.id,
      name: i.name,
      role: i.role,
      time: `${i.date}, ${i.time}`,
      status: i.status,
      linkCode: i.linkCode,
      avatar: i.avatar
    }));

    // Recent activity stream
    const activity = [
      {
        id: "act-1",
        user: "Snehal Harde",
        action: "Shortlisted for Python Developer (ATS: 87)",
        time: "10 mins ago",
        icon: "fa-user-check",
        color: "text-emerald-500 bg-emerald-50"
      },
      {
        id: "act-2",
        user: "Rohan Verma",
        action: "Scheduled AI Technical Interview",
        time: "45 mins ago",
        icon: "fa-calendar-check",
        color: "text-blue-500 bg-blue-50"
      },
      {
        id: "act-3",
        user: "Vikram Malhotra",
        action: "AI Interview Completed - Score: 89%",
        time: "2 hours ago",
        icon: "fa-robot",
        color: "text-violet-500 bg-violet-50"
      },
      {
        id: "act-4",
        user: "Aisha Khan",
        action: "Resume parsed and matched with UI/UX Designer",
        time: "Yesterday",
        icon: "fa-file-lines",
        color: "text-amber-500 bg-amber-50"
      }
    ];

    return {
      kpis,
      weekData,
      stageData,
      jobs: topJobs,
      topJobs,
      upcoming,
      activity
    };
  }
}

module.exports = new DashboardDatabase();
