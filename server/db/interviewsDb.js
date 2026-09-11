const { Pool } = require("pg");
const { readData, writeData } = require("./dbEngine");

const COLLECTION = "interviews";

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
      console.warn("PostgreSQL pool idle interview warning:", err.message);
    });
  }
  return pool;
}

class InterviewsDatabase {
  async getAll(filters = {}) {
    // 1. Try PostgreSQL first
    try {
      const p = getPool();
      let query = "SELECT * FROM public.interviews";
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

      if (filters.search) {
        params.push(`%${filters.search.toLowerCase()}%`);
        const idx = params.length;
        conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(role) LIKE $${idx} OR LOWER(email) LIKE $${idx} OR LOWER(link_code) LIKE $${idx})`);
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
      console.warn("PostgreSQL interviews getAll fallback:", err.message);
    }

    // 2. Fallback to local JSON mirror
    let list = readData(COLLECTION, []);
    if (filters.userEmail) {
      const emailLower = filters.userEmail.toLowerCase().trim();
      list = list.filter(iv =>
        (iv.createdBy && iv.createdBy.toLowerCase() === emailLower) ||
        (iv.userEmail && iv.userEmail.toLowerCase() === emailLower)
      );
    }
    if (filters.status && filters.status !== "All") {
      list = list.filter(iv => (iv.status || "").toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(iv =>
        (iv.name && iv.name.toLowerCase().includes(q)) ||
        (iv.role && iv.role.toLowerCase().includes(q)) ||
        (iv.email && iv.email.toLowerCase().includes(q)) ||
        (iv.linkCode && iv.linkCode.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getById(id) {
    if (!id) return null;
    // 1. Try PostgreSQL
    try {
      const p = getPool();
      const res = await p.query(
        "SELECT * FROM public.interviews WHERE id = $1 OR link_code = $1 LIMIT 1",
        [id]
      );
      if (res.rows && res.rows.length > 0) {
        return this._mapRow(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL interviews getById fallback:", err.message);
    }

    // 2. Fallback to local mirror
    const list = readData(COLLECTION, []);
    return list.find(iv => iv.id === id || iv.linkCode === id) || null;
  }

  async getByLinkCode(linkCode) {
    if (!linkCode) return null;
    const cleaned = linkCode.toLowerCase().trim();

    // 1. Try PostgreSQL
    try {
      const p = getPool();
      const res = await p.query(
        "SELECT * FROM public.interviews WHERE LOWER(link_code) = $1 OR id = $2 LIMIT 1",
        [cleaned, linkCode]
      );
      if (res.rows && res.rows.length > 0) {
        return this._mapRow(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL interviews getByLinkCode fallback:", err.message);
    }

    // 2. Fallback to local mirror
    const list = readData(COLLECTION, []);
    return list.find(iv => (iv.linkCode && iv.linkCode.toLowerCase() === cleaned) || iv.id === linkCode) || null;
  }

  async create(data) {
    const list = readData(COLLECTION, []);
    const id = data.id || `iv-${Date.now()}`;
    const randomCode = Math.random().toString(36).substring(2, 8);
    const linkCode = data.linkCode || randomCode;

    const newInterview = {
      id,
      candidateId: data.candidateId || `cand-${Date.now()}`,
      name: data.name || "Candidate",
      email: data.email || "",
      avatar: data.avatar || "",
      role: data.role || "Software Engineer",
      company: data.company || "AvaHire Technologies Pvt. Ltd.",
      date: data.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
      dayOfWeek: data.dayOfWeek || "",
      time: data.time || "10:00 AM",
      timeZone: data.timeZone || "IST",
      duration: data.duration || "45 Minutes",
      durationMins: data.durationMins || 45,
      linkCode,
      status: data.status || "Scheduled",
      expiry: data.expiry || "04:59 Remaining",
      expiryTime: data.expiryTime || "",
      isExpired: Boolean(data.isExpired),
      score: data.score !== undefined ? data.score : null,
      createdBy: data.createdBy || data.userEmail || "",
      userEmail: data.userEmail || data.createdBy || "",
      createdAt: new Date().toISOString()
    };

    // Update local mirror
    const existingIdx = list.findIndex(iv => iv.id === id || iv.linkCode === linkCode);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...newInterview };
    } else {
      list.unshift(newInterview);
    }
    writeData(COLLECTION, list);

    // Persist to PostgreSQL public.interviews
    try {
      const p = getPool();
      const query = `
        INSERT INTO public.interviews (
          id, candidate_id, name, email, avatar, role, company, date, day_of_week,
          time, time_zone, duration, duration_mins, link_code, status, expiry,
          expiry_time, is_expired, score, created_by, user_email, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          avatar = EXCLUDED.avatar,
          role = EXCLUDED.role,
          company = EXCLUDED.company,
          date = EXCLUDED.date,
          day_of_week = EXCLUDED.day_of_week,
          time = EXCLUDED.time,
          time_zone = EXCLUDED.time_zone,
          duration = EXCLUDED.duration,
          duration_mins = EXCLUDED.duration_mins,
          link_code = EXCLUDED.link_code,
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          created_by = EXCLUDED.created_by,
          user_email = EXCLUDED.user_email
        RETURNING *;
      `;

      const values = [
        newInterview.id,
        newInterview.candidateId,
        newInterview.name,
        newInterview.email,
        newInterview.avatar,
        newInterview.role,
        newInterview.company,
        newInterview.date,
        newInterview.dayOfWeek,
        newInterview.time,
        newInterview.timeZone,
        newInterview.duration,
        newInterview.durationMins,
        newInterview.linkCode,
        newInterview.status,
        newInterview.expiry,
        newInterview.expiryTime,
        newInterview.isExpired,
        newInterview.score,
        newInterview.createdBy,
        newInterview.userEmail
      ];

      await p.query(query, values);
    } catch (err) {
      console.warn("PostgreSQL interview insert notice:", err.message);
    }

    return newInterview;
  }

  async update(id, updates) {
    // 1. Update local JSON mirror
    const list = readData(COLLECTION, []);
    const idx = list.findIndex(iv => iv.id === id || iv.linkCode === id);
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

      if (updates.name !== undefined) {
        params.push(updates.name);
        setClauses.push(`name = $${params.length}`);
      }
      if (updates.email !== undefined) {
        params.push(updates.email);
        setClauses.push(`email = $${params.length}`);
      }
      if (updates.role !== undefined) {
        params.push(updates.role);
        setClauses.push(`role = $${params.length}`);
      }
      if (updates.status !== undefined) {
        params.push(updates.status);
        setClauses.push(`status = $${params.length}`);
      }
      if (updates.score !== undefined) {
        params.push(updates.score);
        setClauses.push(`score = $${params.length}`);
      }
      if (updates.date !== undefined) {
        params.push(updates.date);
        setClauses.push(`date = $${params.length}`);
      }
      if (updates.time !== undefined) {
        params.push(updates.time);
        setClauses.push(`time = $${params.length}`);
      }
      if (updates.duration !== undefined) {
        params.push(updates.duration);
        setClauses.push(`duration = $${params.length}`);
      }
      if (updates.isExpired !== undefined) {
        params.push(Boolean(updates.isExpired));
        setClauses.push(`is_expired = $${params.length}`);
      }

      if (setClauses.length > 0) {
        params.push(id);
        const query = `UPDATE public.interviews SET ${setClauses.join(", ")} WHERE id = $${params.length} OR link_code = $${params.length} RETURNING *;`;
        const res = await p.query(query, params);
        if (res.rows && res.rows[0]) {
          return this._mapRow(res.rows[0]);
        }
      }
    } catch (err) {
      console.warn("PostgreSQL interview update notice:", err.message);
    }

    return updatedItem;
  }

  async delete(id) {
    // 1. Delete from local mirror
    const list = readData(COLLECTION, []);
    const filtered = list.filter(iv => iv.id !== id && iv.linkCode !== id);
    writeData(COLLECTION, filtered);

    // 2. Delete from PostgreSQL
    try {
      const p = getPool();
      await p.query("DELETE FROM public.interviews WHERE id = $1 OR link_code = $1", [id]);
      return true;
    } catch (err) {
      console.warn("PostgreSQL interview delete notice:", err.message);
      return filtered.length !== list.length;
    }
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      candidateId: row.candidate_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role,
      company: row.company,
      date: row.date,
      dayOfWeek: row.day_of_week,
      time: row.time,
      timeZone: row.time_zone,
      duration: row.duration,
      durationMins: row.duration_mins,
      linkCode: row.link_code,
      status: row.status,
      expiry: row.expiry,
      expiryTime: row.expiry_time,
      isExpired: row.is_expired,
      score: row.score,
      createdBy: row.created_by,
      userEmail: row.user_email,
      createdAt: row.created_at
    };
  }
}

module.exports = new InterviewsDatabase();
