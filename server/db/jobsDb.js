const { readData, writeData } = require("./dbEngine");

const COLLECTION = "jobs";

const seedJobs = [
  {
    id: "job-1",
    title: "Senior Software Engineer",
    dept: "Engineering",
    jobLevel: "Senior Level",
    reportsTo: "Engineering Manager",
    loc: "Bangalore, India",
    isRemotePosition: false,
    workMode: "Hybrid",
    type: "Full-time",
    expLevel: "4-7 Years",
    description: "Looking for an experienced Senior Software Engineer to design scalable microservices, lead frontend architecture in React/Next.js, and mentor engineering teams.",
    keySkills: ["React", "Node.js", "TypeScript", "AWS", "System Design"],
    candidates: 18,
    status: "Active",
    posted: "20 May 2025",
    createdAt: new Date("2025-05-20").toISOString()
  },
  {
    id: "job-2",
    title: "Python Developer",
    dept: "Engineering",
    jobLevel: "Mid Level",
    reportsTo: "Engineering Manager",
    loc: "Bangalore, India",
    isRemotePosition: false,
    workMode: "On-site",
    type: "Full-time",
    expLevel: "2-4 Years",
    description: "Join our backend platform team to build robust APIs, ETL pipelines, and high-performance services using FastAPI, Django, and PostgreSQL.",
    keySkills: ["Python", "FastAPI", "Django", "PostgreSQL", "Docker"],
    candidates: 24,
    status: "Active",
    posted: "18 May 2025",
    createdAt: new Date("2025-05-18").toISOString()
  },
  {
    id: "job-3",
    title: "UI/UX Product Designer",
    dept: "Design",
    jobLevel: "Mid Level",
    reportsTo: "Design Lead",
    loc: "Mumbai, India",
    isRemotePosition: true,
    workMode: "Remote",
    type: "Full-time",
    expLevel: "3-5 Years",
    description: "Craft modern, intuitive design systems and end-to-end user experiences for our recruitment intelligence platform across web and mobile.",
    keySkills: ["Figma", "Design Systems", "User Research", "Wireframing", "Prototyping"],
    candidates: 12,
    status: "Active",
    posted: "15 May 2025",
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "job-4",
    title: "DevOps Engineer",
    dept: "Infrastructure",
    jobLevel: "Senior Level",
    reportsTo: "VP of Engineering",
    loc: "Hyderabad, India",
    isRemotePosition: false,
    workMode: "Hybrid",
    type: "Full-time",
    expLevel: "5-8 Years",
    description: "Architect and automate cloud infrastructure across GCP and AWS with Terraform, Kubernetes, and reliable CI/CD release pipelines.",
    keySkills: ["Kubernetes", "Terraform", "Docker", "GCP", "CI/CD"],
    candidates: 9,
    status: "Active",
    posted: "10 May 2025",
    createdAt: new Date("2025-05-10").toISOString()
  },
  {
    id: "job-5",
    title: "HR Talent Acquisition Specialist",
    dept: "Human Resources",
    jobLevel: "Associate",
    reportsTo: "HR Director",
    loc: "Pune, India",
    isRemotePosition: false,
    workMode: "On-site",
    type: "Full-time",
    expLevel: "1-3 Years",
    description: "Drive end-to-end technical sourcing, candidate screening, scheduling AI interviews, and building candidate pipelines for high-growth tech teams.",
    keySkills: ["Tech Sourcing", "Interviewing", "ATS", "Talent Engagement"],
    candidates: 15,
    status: "Active",
    posted: "05 May 2025",
    createdAt: new Date("2025-05-05").toISOString()
  }
];

class JobsDatabase {
  getAll(filters = {}) {
    let jobs = readData(COLLECTION, seedJobs);
    if (filters.status && filters.status !== "All") {
      jobs = jobs.filter(j => j.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.dept && filters.dept !== "All") {
      jobs = jobs.filter(j => j.dept.toLowerCase() === filters.dept.toLowerCase());
    }
    if (filters.workMode && filters.workMode !== "All") {
      jobs = jobs.filter(j => j.workMode.toLowerCase() === filters.workMode.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.dept.toLowerCase().includes(q) ||
        j.loc.toLowerCase().includes(q) ||
        (j.keySkills && j.keySkills.some(s => s.toLowerCase().includes(q)))
      );
    }
    return jobs;
  }

  getById(id) {
    const jobs = readData(COLLECTION, seedJobs);
    return jobs.find(j => j.id === id) || null;
  }

  create(jobData) {
    const jobs = readData(COLLECTION, seedJobs);
    const newJob = {
      id: `job-${Date.now()}`,
      title: jobData.title || "Untitled Job",
      dept: jobData.dept || "Engineering",
      jobLevel: jobData.jobLevel || "Mid Level",
      reportsTo: jobData.reportsTo || "Engineering Manager",
      loc: jobData.loc || "Remote",
      isRemotePosition: Boolean(jobData.isRemotePosition),
      workMode: jobData.workMode || (jobData.isRemotePosition ? "Remote" : "On-site"),
      type: jobData.type || "Full-time",
      expLevel: jobData.expLevel || "2-4 Years",
      description: jobData.description || "",
      keySkills: Array.isArray(jobData.keySkills) ? jobData.keySkills : (jobData.keySkills ? [jobData.keySkills] : []),
      candidates: 0,
      status: jobData.status || "Active",
      posted: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    jobs.unshift(newJob);
    writeData(COLLECTION, jobs);
    return newJob;
  }

  update(id, updates) {
    const jobs = readData(COLLECTION, seedJobs);
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) return null;

    jobs[index] = {
      ...jobs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(COLLECTION, jobs);
    return jobs[index];
  }

  delete(id) {
    const jobs = readData(COLLECTION, seedJobs);
    const filtered = jobs.filter(j => j.id !== id);
    if (filtered.length === jobs.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }

  incrementCandidates(id, delta = 1) {
    const jobs = readData(COLLECTION, seedJobs);
    const job = jobs.find(j => j.id === id);
    if (job) {
      job.candidates = Math.max(0, (job.candidates || 0) + delta);
      writeData(COLLECTION, jobs);
      return job;
    }
    return null;
  }
}

module.exports = new JobsDatabase();
