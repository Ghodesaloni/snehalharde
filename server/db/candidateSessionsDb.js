const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

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
      console.warn("PostgreSQL pool idle candidate session warning:", err.message);
    });
  }
  return pool;
}

// Local fallback mirror
const DATA_DIR = path.resolve(__dirname, "../data");
const SESSIONS_FILE = path.join(DATA_DIR, "candidate_portal_sessions_mirror.json");

function readJson() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
    }
  } catch (err) {
    console.warn("Could not read candidate sessions mirror:", err.message);
  }
  return [];
}

function writeJson(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not write candidate sessions mirror:", err.message);
  }
}

class CandidateSessionsDatabase {
  async getAll(filters = {}) {
    const p = getPool();
    try {
      let query = "SELECT * FROM public.candidate_portal_sessions";
      const params = [];
      const conditions = [];

      if (filters.linkCode) {
        params.push(filters.linkCode);
        conditions.push(`link_code = $${params.length}`);
      }
      if (filters.email) {
        params.push(filters.email.toLowerCase());
        conditions.push(`LOWER(candidate_email) = $${params.length}`);
      }
      if (filters.status) {
        params.push(filters.status);
        conditions.push(`status = $${params.length}`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY created_at DESC";

      const res = await p.query(query, params);
      return res.rows.map(this._mapRow);
    } catch (err) {
      console.warn("PostgreSQL candidate sessions fallback to mirror:", err.message);
      let list = readJson();
      if (filters.linkCode) {
        list = list.filter(s => s.linkCode === filters.linkCode);
      }
      if (filters.email) {
        list = list.filter(s => s.candidateEmail?.toLowerCase() === filters.email.toLowerCase());
      }
      if (filters.status) {
        list = list.filter(s => s.status === filters.status);
      }
      return list;
    }
  }

  async getById(id) {
    const p = getPool();
    try {
      const res = await p.query(
        "SELECT * FROM public.candidate_portal_sessions WHERE id = $1 OR link_code = $1 LIMIT 1",
        [id]
      );
      if (res.rows.length > 0) {
        return this._mapRow(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL getById fallback:", err.message);
    }
    const list = readJson();
    return list.find(s => s.id === id || s.linkCode === id) || null;
  }

  async getByLinkCode(linkCode) {
    if (!linkCode) return null;
    const p = getPool();
    try {
      const res = await p.query(
        "SELECT * FROM public.candidate_portal_sessions WHERE LOWER(link_code) = LOWER($1) ORDER BY created_at DESC LIMIT 1",
        [linkCode.trim()]
      );
      if (res.rows.length > 0) {
        return this._mapRow(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL getByLinkCode fallback:", err.message);
    }
    const list = readJson();
    return list.find(s => s.linkCode?.toLowerCase() === linkCode.toLowerCase().trim()) || null;
  }

  async createOrUpdate(data) {
    const id = data.id || `sess-${Date.now()}`;
    const linkCode = data.linkCode || "akc123";
    const candidateName = data.candidateName || data.name || "Candidate";
    const candidateEmail = (data.candidateEmail || data.email || "").toLowerCase().trim();
    const candidatePhone = data.candidatePhone || data.phone || "";
    const role = data.role || "Software Engineer";
    const company = data.company || "AvaHire Tech";
    const status = data.status || "In Progress";
    const systemCheckStatus = data.systemCheckStatus || null;
    const overallScore = data.overallScore !== undefined ? data.overallScore : (data.score !== undefined ? data.score : 94);
    const techDepthScore = data.techDepthScore || "9.2 / 10";
    const clarityScore = data.clarityScore || "9.5 / 10";
    const recommendation = data.recommendation || "Recommended for Senior Technical Review";
    const elapsedSeconds = data.elapsedSeconds || 0;
    const transcripts = data.transcripts || data.transcript || [];
    const evaluationBreakdown = data.evaluationBreakdown || [
      { category: "System Architecture & Scalability", score: 95, weight: "35%" },
      { category: "Data Structures & Performance", score: 92, weight: "30%" },
      { category: "Engineering Collaboration & Communication", score: 96, weight: "20%" },
      { category: "Code Quality & Resiliency", score: 94, weight: "15%" }
    ];

    const sessionObj = {
      id,
      linkCode,
      candidateName,
      candidateEmail,
      candidatePhone,
      role,
      company,
      status,
      systemCheckStatus,
      overallScore,
      techDepthScore,
      clarityScore,
      recommendation,
      elapsedSeconds,
      transcripts,
      evaluationBreakdown,
      completedAt: status === "Completed" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    // 1. Update local JSON mirror
    try {
      const list = readJson();
      const existingIdx = list.findIndex(s => s.id === id || s.linkCode === linkCode);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...sessionObj };
      } else {
        list.unshift(sessionObj);
      }
      writeJson(list);
    } catch (e) {
      console.warn("Mirror write error:", e.message);
    }

    // 2. Persist to PostgreSQL public.candidate_portal_sessions
    const p = getPool();
    try {
      const query = `
        INSERT INTO public.candidate_portal_sessions (
          id, link_code, candidate_name, candidate_email, candidate_phone, role, company,
          status, system_check_status, overall_score, tech_depth_score, clarity_score,
          recommendation, elapsed_seconds, transcripts, evaluation_breakdown,
          completed_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        ON CONFLICT (id) DO UPDATE SET
          link_code = EXCLUDED.link_code,
          candidate_name = EXCLUDED.candidate_name,
          candidate_email = EXCLUDED.candidate_email,
          candidate_phone = EXCLUDED.candidate_phone,
          role = EXCLUDED.role,
          company = EXCLUDED.company,
          status = EXCLUDED.status,
          system_check_status = EXCLUDED.system_check_status,
          overall_score = EXCLUDED.overall_score,
          tech_depth_score = EXCLUDED.tech_depth_score,
          clarity_score = EXCLUDED.clarity_score,
          recommendation = EXCLUDED.recommendation,
          elapsed_seconds = EXCLUDED.elapsed_seconds,
          transcripts = EXCLUDED.transcripts,
          evaluation_breakdown = EXCLUDED.evaluation_breakdown,
          completed_at = EXCLUDED.completed_at,
          updated_at = NOW()
        RETURNING *;
      `;

      const values = [
        id,
        linkCode,
        candidateName,
        candidateEmail,
        candidatePhone,
        role,
        company,
        status,
        JSON.stringify(systemCheckStatus),
        overallScore,
        techDepthScore,
        clarityScore,
        recommendation,
        elapsedSeconds,
        JSON.stringify(transcripts),
        JSON.stringify(evaluationBreakdown),
        status === "Completed" ? new Date() : null
      ];

      const res = await p.query(query, values);
      if (res.rows.length > 0) {
        return this._mapRow(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL candidate_portal_sessions upsert error:", err.message);
    }

    return sessionObj;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      linkCode: row.link_code,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      candidatePhone: row.candidate_phone,
      role: row.role,
      company: row.company,
      status: row.status,
      systemCheckStatus: typeof row.system_check_status === "string" ? JSON.parse(row.system_check_status) : row.system_check_status,
      overallScore: row.overall_score,
      techDepthScore: row.tech_depth_score,
      clarityScore: row.clarity_score,
      recommendation: row.recommendation,
      elapsedSeconds: row.elapsed_seconds,
      transcripts: typeof row.transcripts === "string" ? JSON.parse(row.transcripts) : row.transcripts,
      evaluationBreakdown: typeof row.evaluation_breakdown === "string" ? JSON.parse(row.evaluation_breakdown) : row.evaluation_breakdown,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = new CandidateSessionsDatabase();
