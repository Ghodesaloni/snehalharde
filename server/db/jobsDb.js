const { readData, writeData } = require("./dbEngine");
const { getPool } = require("./postgres");

const COLLECTION = "jobs";

class JobsDatabase {
  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      dept: row.dept || "Engineering",
      jobLevel: row.job_level || "Mid Level",
      reportsTo: row.reports_to || "Engineering Manager",
      loc: row.loc || "Remote",
      isRemotePosition: Boolean(row.is_remote_position),
      workMode: row.work_mode || (row.is_remote_position ? "Remote" : "On-site"),
      type: row.type || "Full-time",
      expLevel: row.exp_level || "2-4 Years",
      description: row.description || "",
      keySkills: typeof row.key_skills === "string" ? JSON.parse(row.key_skills) : (row.key_skills || []),
      candidates: row.candidates !== null && row.candidates !== undefined ? Number(row.candidates) : 0,
      status: row.status || "Active",
      createdBy: row.created_by || "",
      userEmail: row.user_email || row.created_by || "",
      posted: row.posted || (row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recently"),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

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

  async getAllAsync(filters = {}) {
    try {
      const pool = getPool();
      let query = "SELECT * FROM public.jobs";
      const params = [];
      const conditions = [];

      if (filters.userEmail) {
        params.push(filters.userEmail.toLowerCase().trim());
        conditions.push(`(LOWER(created_by) = $${params.length} OR LOWER(user_email) = $${params.length})`);
      }
      if (filters.status && filters.status !== "All") {
        params.push(filters.status.toLowerCase());
        conditions.push(`LOWER(status) = $${params.length}`);
      }
      if (filters.dept && filters.dept !== "All") {
        params.push(filters.dept.toLowerCase());
        conditions.push(`LOWER(dept) = $${params.length}`);
      }
      if (filters.workMode && filters.workMode !== "All") {
        params.push(filters.workMode.toLowerCase());
        conditions.push(`LOWER(work_mode) = $${params.length}`);
      }
      if (filters.search) {
        params.push(`%${filters.search.toLowerCase()}%`);
        const idx = params.length;
        conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(dept) LIKE $${idx} OR LOWER(loc) LIKE $${idx})`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY created_at DESC";

      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(this._mapRow);
      }
    } catch (err) {
      console.warn("PostgreSQL jobs getAllAsync notice:", err.message);
    }
    return this.getAll(filters);
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

    // Save directly to PostgreSQL public.jobs
    try {
      const pool = getPool();
      pool.query(`
        INSERT INTO public.jobs (
          id, title, dept, job_level, reports_to, loc, is_remote_position,
          work_mode, type, exp_level, description, key_skills, candidates,
          status, created_by, user_email, posted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          dept = EXCLUDED.dept,
          status = EXCLUDED.status,
          updated_at = NOW();
      `, [
        newJob.id, newJob.title, newJob.dept, newJob.jobLevel, newJob.reportsTo,
        newJob.loc, newJob.isRemotePosition, newJob.workMode, newJob.type,
        newJob.expLevel, newJob.description, JSON.stringify(newJob.keySkills),
        newJob.candidates, newJob.status, newJob.createdBy, newJob.userEmail,
        newJob.posted
      ]).catch(err => console.warn("PostgreSQL job insert warning:", err.message));
    } catch (e) {}

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

    // Update in PostgreSQL public.jobs
    try {
      const pool = getPool();
      const updated = jobs[index];
      pool.query(`
        UPDATE public.jobs SET
          title = COALESCE($2, title),
          dept = COALESCE($3, dept),
          status = COALESCE($4, status),
          description = COALESCE($5, description),
          candidates = COALESCE($6, candidates),
          updated_at = NOW()
        WHERE id = $1
      `, [id, updates.title || null, updates.dept || null, updates.status || null, updates.description || null, updates.candidates !== undefined ? updates.candidates : null])
      .catch(err => console.warn("PostgreSQL job update warning:", err.message));
    } catch (e) {}

    return jobs[index];
  }

  delete(id) {
    const jobs = readData(COLLECTION, []);
    const filtered = jobs.filter(j => j.id !== id);
    if (filtered.length === jobs.length) return false;
    writeData(COLLECTION, filtered);

    // Delete in PostgreSQL public.jobs
    try {
      const pool = getPool();
      pool.query("DELETE FROM public.jobs WHERE id = $1", [id])
        .catch(err => console.warn("PostgreSQL job delete warning:", err.message));
    } catch (e) {}

    return true;
  }

  incrementCandidates(id, delta = 1) {
    const jobs = readData(COLLECTION, []);
    const job = jobs.find(j => j.id === id);
    if (job) {
      job.candidates = Math.max(0, (job.candidates || 0) + delta);
      writeData(COLLECTION, jobs);

      try {
        const pool = getPool();
        pool.query(
          "UPDATE public.jobs SET candidates = GREATEST(0, candidates + $2), updated_at = NOW() WHERE id = $1",
          [id, delta]
        ).catch(e => {});
      } catch (e) {}

      return job;
    }
    return null;
  }
}

module.exports = new JobsDatabase();
