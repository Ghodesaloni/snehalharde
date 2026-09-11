const jobsDb = require("./jobsDb");
const resumesDb = require("./resumesDb");
const interviewsDb = require("./interviewsDb");
const candidatesDb = require("./candidatesDb");
const emailCenterDb = require("./emailCenterDb");

class DashboardDatabase {
  async getStats(userEmail) {
    let jobs = await Promise.resolve(jobsDb.getAll());
    let resumes = await Promise.resolve(resumesDb.getAll());
    let interviews = await Promise.resolve(interviewsDb.getAll());
    let candidates = await Promise.resolve(candidatesDb.getAll());

    const isDemoAccount = userEmail && (
      userEmail.toLowerCase() === "hr@avahire.ai" ||
      userEmail.toLowerCase() === "admin@avahire.ai"
    );

    // If userEmail is provided and it is NOT a pre-seeded demo account:
    // Filter to only items created by this specific user.
    // New users who have not created any jobs, interviews, or candidates yet will have empty lists,
    // ensuring their dashboard starts cleanly static at 0.
    if (userEmail && !isDemoAccount) {
      const emailLower = userEmail.toLowerCase().trim();
      jobs = jobs.filter(j =>
        (j.createdBy && j.createdBy.toLowerCase() === emailLower) ||
        (j.userEmail && j.userEmail.toLowerCase() === emailLower)
      );
      resumes = resumes.filter(r =>
        (r.createdBy && r.createdBy.toLowerCase() === emailLower) ||
        (r.userEmail && r.userEmail.toLowerCase() === emailLower)
      );
      interviews = interviews.filter(i =>
        (i.createdBy && i.createdBy.toLowerCase() === emailLower) ||
        (i.userEmail && i.userEmail.toLowerCase() === emailLower)
      );
      candidates = candidates.filter(c =>
        (c.createdBy && c.createdBy.toLowerCase() === emailLower) ||
        (c.userEmail && c.userEmail.toLowerCase() === emailLower)
      );
    } else if (!userEmail) {
      // If no user context is provided, return empty static state for safety
      jobs = [];
      resumes = [];
      interviews = [];
      candidates = [];
    }

    const activeJobs = jobs.filter(j => (j.status || "").toLowerCase() === "active").length;
    const selectedCandidates = candidates.filter(c => (c.status || "").toLowerCase() === "selected").length +
      resumes.filter(r => (r.status || "").toLowerCase() === "hired").length;
    const completedInterviews = interviews.filter(i => (i.status || "").toLowerCase() === "completed").length;
    const activeScheduledInterviews = interviews.filter(i => {
      const s = (i.status || "").toLowerCase();
      return s === "active" || s === "scheduled";
    }).length;

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

    // Weekly interview chart data from real interview sessions
    const daysMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    interviews.forEach(i => {
      if (i.dayOfWeek) {
        const prefix = i.dayOfWeek.slice(0, 3);
        if (daysMap[prefix] !== undefined) {
          daysMap[prefix] += 1;
        }
      }
    });

    const weekData = [
      { d: "Mon", v: daysMap.Mon },
      { d: "Tue", v: daysMap.Tue },
      { d: "Wed", v: daysMap.Wed },
      { d: "Thu", v: daysMap.Thu },
      { d: "Fri", v: daysMap.Fri },
      { d: "Sat", v: daysMap.Sat },
      { d: "Sun", v: daysMap.Sun }
    ];

    // Pipeline funnel stage breakdown from real user records
    const totalPipeline = resumes.length + candidates.length;
    const appliedCount = resumes.filter(r => (r.status || "").toLowerCase() === "new" || (r.status || "").toLowerCase() === "applied").length;
    const screeningCount = resumes.filter(r => (r.status || "").toLowerCase() === "shortlisted" || (r.status || "").toLowerCase() === "review").length;
    const interviewCount = interviews.length;
    const interviewedCount = candidates.length;
    const finalSelectedCount = selectedCandidates;

    const stageData = [
      { name: "Applied", value: appliedCount, pct: totalPipeline > 0 ? `${Math.round((appliedCount / totalPipeline) * 100)}%` : "0%", color: "#3b82f6" },
      { name: "Screening", value: screeningCount, pct: totalPipeline > 0 ? `${Math.round((screeningCount / totalPipeline) * 100)}%` : "0%", color: "#8b5cf6" },
      { name: "Interview", value: interviewCount, pct: totalPipeline > 0 ? `${Math.round((interviewCount / totalPipeline) * 100)}%` : "0%", color: "#f59e0b" },
      { name: "Interviewed", value: interviewedCount, pct: totalPipeline > 0 ? `${Math.round((interviewedCount / totalPipeline) * 100)}%` : "0%", color: "#14b8a6" },
      { name: "Selected", value: finalSelectedCount, pct: totalPipeline > 0 ? `${Math.round((finalSelectedCount / totalPipeline) * 100)}%` : "0%", color: "#22c55e" }
    ];

    // Top jobs with candidate counts
    const topJobs = jobs.slice(0, 4).map(j => ({
      id: j.id,
      title: j.title,
      dept: j.dept,
      loc: j.loc,
      candidates: j.candidates || 0,
      status: j.status || "Active"
    }));

    // Upcoming interviews list
    const upcoming = interviews.slice(0, 4).map(i => ({
      id: i.id,
      name: i.name,
      role: i.role,
      time: i.date && i.time ? `${i.date}, ${i.time}` : (i.date || i.time || ""),
      status: i.status || "Scheduled",
      linkCode: i.linkCode,
      avatar: i.avatar || ""
    }));

    // Recent real activity stream
    const activity = [];
    candidates.slice(0, 3).forEach(c => {
      activity.push({
        id: `act-${c.id}`,
        user: c.name,
        action: `AI Interview Completed - Score: ${c.score || 0}%`,
        time: c.interviewDate || "Recently",
        icon: "fa-robot",
        color: "text-violet-500 bg-violet-50"
      });
    });
    interviews.slice(0, 3).forEach(i => {
      activity.push({
        id: `act-${i.id}`,
        user: i.name,
        action: `Scheduled AI Technical Interview for ${i.role}`,
        time: i.date || "Scheduled",
        icon: "fa-calendar-check",
        color: "text-blue-500 bg-blue-50"
      });
    });
    resumes.slice(0, 3).forEach(r => {
      activity.push({
        id: `act-${r.id}`,
        user: r.name,
        action: `Resume uploaded & screened (ATS: ${r.atsScore || 0})`,
        time: r.uploadedDate || "Recently",
        icon: "fa-file-lines",
        color: "text-emerald-500 bg-emerald-50"
      });
    });

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
