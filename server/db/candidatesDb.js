const { Pool } = require("pg");
const { readData, writeData } = require("./dbEngine");

const COLLECTION = "candidates";

const sqlHost = process.env.SQL_HOST || process.env.PGHOST || "localhost";
const sqlPort = parseInt(process.env.SQL_PORT || process.env.PGPORT || "5432", 10);
const sqlDb = process.env.SQL_DB_NAME || process.env.PGDATABASE || "cloud_sql_development_database";
const sqlUser = process.env.SQL_USER || process.env.PGUSER || "ai_studio_app_user";
const sqlPassword = process.env.SQL_PASSWORD || process.env.PGPASSWORD || "";

let pool = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      host: sqlHost,
      port: sqlPort,
      database: sqlDb,
      user: sqlUser,
      password: sqlPassword,
      max: 10,
      connectionTimeoutMillis: 6000,
    });
    pool.on("error", (err) => {
      console.warn("PostgreSQL pool idle candidates warning:", err.message);
    });
  }
  return pool;
}

class CandidatesDatabase {
  async getAll(filters = {}) {
    // 1. Try PostgreSQL first
    try {
      const p = getPool();
      let query = "SELECT * FROM public.candidates";
      const params = [];
      const conditions = [];

      if (filters.userEmail) {
        const emailLower = filters.userEmail.toLowerCase().trim();
        const isDemo = emailLower === "hr@avahire.ai" || emailLower === "admin@avahire.ai";
        if (!isDemo) {
          params.push(emailLower);
          conditions.push(`(LOWER(created_by) = $${params.length} OR LOWER(user_email) = $${params.length})`);
        }
      }

      if (filters.status && filters.status !== "All") {
        params.push(filters.status.toLowerCase());
        conditions.push(`LOWER(status) = $${params.length}`);
      }

      if (filters.role && filters.role !== "All") {
        params.push(filters.role.toLowerCase());
        conditions.push(`LOWER(role) = $${params.length}`);
      }

      if (filters.search) {
        params.push(`%${filters.search.toLowerCase()}%`);
        const idx = params.length;
        conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(email) LIKE $${idx} OR LOWER(role) LIKE $${idx})`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY created_at DESC";

      const res = await p.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(this._mapRow);
      }
    } catch (err) {
      console.warn("PostgreSQL candidates getAll fallback:", err.message);
    }

    // 2. Fallback to local JSON mirror
    let list = readData(COLLECTION, []);
    if (filters.userEmail) {
      const emailLower = filters.userEmail.toLowerCase().trim();
      list = list.filter(c =>
        (c.createdBy && c.createdBy.toLowerCase() === emailLower) ||
        (c.userEmail && c.userEmail.toLowerCase() === emailLower)
      );
    }
    if (filters.status && filters.status !== "All") {
      list = list.filter(c => (c.status || "").toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.role && filters.role !== "All") {
      list = list.filter(c => (c.role || "").toLowerCase() === filters.role.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getById(id) {
    if (!id) return null;
    // 1. Try PostgreSQL
    try {
      const p = getPool();
      const res = await p.query("SELECT * FROM public.candidates WHERE id = $1 LIMIT 1", [id]);
      if (res.rows && res.rows.length > 0) {
        return this._mapRow(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL candidates getById fallback:", err.message);
    }

    // 2. Fallback to local mirror
    const list = readData(COLLECTION, []);
    return list.find(c => c.id === id) || null;
  }

  async create(data) {
    const list = readData(COLLECTION, []);
    const id = data.id || `cand-${Date.now()}`;
    const newCand = {
      id,
      name: data.name || "Candidate",
      email: data.email || "",
      phone: data.phone || "",
      role: data.role || "Software Engineer",
      avatar: data.avatar || "",
      interviewDate: data.interviewDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: String(data.timestamp || Date.now()),
      duration: data.duration || "0m 00s",
      mode: data.mode || "AI Interview",
      score: data.score !== undefined ? data.score : 90,
      status: data.status || "Under Review",
      notes: data.notes || "",
      summaryPoints: data.summaryPoints || [],
      recommendation: data.recommendation || "",
      transcript: data.transcript || [],
      evaluationBreakdown: data.evaluationBreakdown || [],
      createdBy: data.createdBy || data.userEmail || "",
      userEmail: data.userEmail || data.createdBy || "",
      createdAt: new Date().toISOString()
    };

    // Update local mirror
    const existingIdx = list.findIndex(c => c.id === id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...newCand };
    } else {
      list.unshift(newCand);
    }
    writeData(COLLECTION, list);

    // Persist to PostgreSQL public.candidates
    try {
      const p = getPool();
      const query = `
        INSERT INTO public.candidates (
          id, name, email, phone, role, avatar, interview_date, timestamp,
          duration, mode, score, status, notes, summary_points, recommendation,
          transcript, evaluation_breakdown, created_by, user_email, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          avatar = EXCLUDED.avatar,
          interview_date = EXCLUDED.interview_date,
          duration = EXCLUDED.duration,
          score = EXCLUDED.score,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          summary_points = EXCLUDED.summary_points,
          recommendation = EXCLUDED.recommendation,
          transcript = EXCLUDED.transcript,
          evaluation_breakdown = EXCLUDED.evaluation_breakdown,
          created_by = EXCLUDED.created_by,
          user_email = EXCLUDED.user_email
        RETURNING *;
      `;

      const values = [
        newCand.id,
        newCand.name,
        newCand.email,
        newCand.phone,
        newCand.role,
        newCand.avatar,
        newCand.interviewDate,
        newCand.timestamp,
        newCand.duration,
        newCand.mode,
        newCand.score,
        newCand.status,
        newCand.notes,
        JSON.stringify(newCand.summaryPoints),
        newCand.recommendation,
        JSON.stringify(newCand.transcript),
        JSON.stringify(newCand.evaluationBreakdown),
        newCand.createdBy,
        newCand.userEmail
      ];

      await p.query(query, values);
    } catch (err) {
      console.warn("PostgreSQL candidate insert notice:", err.message);
    }

    return newCand;
  }

  async update(id, updates) {
    // 1. Update local mirror
    const list = readData(COLLECTION, []);
    const idx = list.findIndex(c => c.id === id);
    let updatedItem = null;
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      updatedItem = list[idx];
      writeData(COLLECTION, list);
    }

    // 2. Update PostgreSQL
    try {
      const p = getPool();
      const setClauses = [];
      const params = [];

      if (updates.status !== undefined) {
        params.push(updates.status);
        setClauses.push(`status = $${params.length}`);
      }
      if (updates.notes !== undefined) {
        params.push(updates.notes);
        setClauses.push(`notes = $${params.length}`);
      }
      if (updates.score !== undefined) {
        params.push(updates.score);
        setClauses.push(`score = $${params.length}`);
      }
      if (updates.recommendation !== undefined) {
        params.push(updates.recommendation);
        setClauses.push(`recommendation = $${params.length}`);
      }

      if (setClauses.length > 0) {
        params.push(id);
        const query = `UPDATE public.candidates SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *;`;
        const res = await p.query(query, params);
        if (res.rows && res.rows[0]) {
          return this._mapRow(res.rows[0]);
        }
      }
    } catch (err) {
      console.warn("PostgreSQL candidate update notice:", err.message);
    }

    return updatedItem;
  }

  async delete(id) {
    // 1. Delete from local mirror
    const list = readData(COLLECTION, []);
    const filtered = list.filter(c => c.id !== id);
    writeData(COLLECTION, filtered);

    // 2. Delete from PostgreSQL
    try {
      const p = getPool();
      await p.query("DELETE FROM public.candidates WHERE id = $1", [id]);
      return true;
    } catch (err) {
      console.warn("PostgreSQL candidate delete notice:", err.message);
      return filtered.length !== list.length;
    }
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      avatar: row.avatar,
      interviewDate: row.interview_date,
      timestamp: row.timestamp,
      duration: row.duration,
      mode: row.mode,
      score: row.score,
      status: row.status,
      notes: row.notes,
      summaryPoints: typeof row.summary_points === "string" ? JSON.parse(row.summary_points) : (row.summary_points || []),
      recommendation: row.recommendation,
      transcript: typeof row.transcript === "string" ? JSON.parse(row.transcript) : (row.transcript || []),
      evaluationBreakdown: typeof row.evaluation_breakdown === "string" ? JSON.parse(row.evaluation_breakdown) : (row.evaluation_breakdown || []),
      createdBy: row.created_by,
      userEmail: row.user_email,
      createdAt: row.created_at
    };
  }
}

module.exports = new CandidatesDatabase();
