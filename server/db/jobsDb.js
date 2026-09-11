const { readData, writeData } = require("./dbEngine");

const COLLECTION = "jobs";

class JobsDatabase {
  getAll(filters = {}) {
    let jobs = readData(COLLECTION, []);
    if (filters.userEmail) {
      const emailLower = filters.userEmail.toLowerCase().trim();
      jobs = jobs.filter(j =>
        (j.createdBy && j.createdBy.toLowerCase() === emailLower) ||
        (j.userEmail && j.userEmail.toLowerCase() === emailLower)
      );
    }
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
    const jobs = readData(COLLECTION, []);
    return jobs.find(j => j.id === id) || null;
  }

  create(jobData) {
    const jobs = readData(COLLECTION, []);
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
      createdBy: jobData.createdBy || jobData.userEmail || "",
      userEmail: jobData.userEmail || jobData.createdBy || "",
      posted: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    jobs.unshift(newJob);
    writeData(COLLECTION, jobs);
    return newJob;
  }

  update(id, updates) {
    const jobs = readData(COLLECTION, []);
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
    const jobs = readData(COLLECTION, []);
    const filtered = jobs.filter(j => j.id !== id);
    if (filtered.length === jobs.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }

  incrementCandidates(id, delta = 1) {
    const jobs = readData(COLLECTION, []);
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
