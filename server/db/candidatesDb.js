const { readData, writeData } = require("./dbEngine");
const { query } = require("./postgres");

const COLLECTION = "candidates";

function mapRowToCandidate(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatar: row.avatar,
    interviewDate: row.interview_date,
    timestamp: row.timestamp ? Number(row.timestamp) : (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    duration: row.duration,
    mode: row.mode,
    score: row.score,
    status: row.status,
    notes: row.notes || "",
    summaryPoints: typeof row.summary_points === "string" ? JSON.parse(row.summary_points) : (row.summary_points || []),
    recommendation: row.recommendation || "",
    transcript: typeof row.transcript === "string" ? JSON.parse(row.transcript) : (row.transcript || []),
    evaluationBreakdown: typeof row.evaluation_breakdown === "string" ? JSON.parse(row.evaluation_breakdown) : (row.evaluation_breakdown || []),
    createdAt: row.created_at
  };
}

const seedCandidates = [
  {
    id: "cand-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@email.com",
    phone: "+91 98765 43210",
    role: "Frontend Developer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    interviewDate: "28 May 2025, 11:30 AM",
    timestamp: new Date("2025-05-28T11:30:00").getTime(),
    duration: "18m 24s",
    mode: "AI Interview",
    score: 85,
    status: "Under Review",
    notes: "Demonstrated strong knowledge of React hooks and state management.",
    summaryPoints: [
      { text: "Good technical knowledge", type: "good" },
      { text: "Clear communication", type: "good" },
      { text: "Confident and composed", type: "good" },
      { text: "Good problem solving approach", type: "good" },
      { text: "Can improve in system design", type: "warning" }
    ],
    recommendation: "Strong candidate. Meets most of the requirements.",
    transcript: [
      { speaker: "AI Interviewer", time: "00:00", isAI: true, text: "Welcome Rahul! Let's start with a brief introduction of your frontend journey." },
      { speaker: "Rahul Sharma", time: "00:15", isAI: false, text: "Hi, I have been building web apps in React and TypeScript for the past 3 years with a focus on component architecture." },
      { speaker: "AI Interviewer", time: "01:20", isAI: true, text: "Can you explain how you handle state management across complex nested components?" },
      { speaker: "Rahul Sharma", time: "01:35", isAI: false, text: "I prefer standard React Context or lightweight stores like Zustand for global states, and server state libraries like TanStack Query." }
    ],
    createdAt: new Date("2025-05-28").toISOString()
  },
  {
    id: "cand-2",
    name: "Snehal Harde",
    email: "snehal@email.com",
    phone: "+91 98765 43210",
    role: "Python Developer",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    interviewDate: "27 May 2025, 02:00 PM",
    timestamp: new Date("2025-05-27T14:00:00").getTime(),
    duration: "21m 10s",
    mode: "AI Interview",
    score: 92,
    status: "Selected",
    notes: "Exceptional backend architecture insight and Python async proficiency.",
    summaryPoints: [
      { text: "Excellent Python and async/await fundamentals", type: "good" },
      { text: "Solid relational database indexing strategies", type: "good" },
      { text: "Fast algorithmic problem solving", type: "good" },
      { text: "Great communication under pressure", type: "good" }
    ],
    recommendation: "Highly recommended for immediate hire.",
    transcript: [
      { speaker: "AI Interviewer", time: "00:00", isAI: true, text: "Hello Snehal! Could you tell us about your experience designing backend microservices in Python?" },
      { speaker: "Snehal Harde", time: "00:12", isAI: false, text: "Certainly! I've built scalable REST APIs using FastAPI and PostgreSQL, implementing caching and database connection pooling." }
    ],
    createdAt: new Date("2025-05-27").toISOString()
  },
  {
    id: "cand-3",
    name: "Vikram Malhotra",
    email: "vikram.m@email.com",
    phone: "+91 96345 67890",
    role: "DevOps Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    interviewDate: "26 May 2025, 04:00 PM",
    timestamp: new Date("2025-05-26T16:00:00").getTime(),
    duration: "19m 45s",
    mode: "AI Interview",
    score: 89,
    status: "Selected",
    notes: "Very competent in Kubernetes deployments and Helm charts.",
    summaryPoints: [
      { text: "In-depth Kubernetes clustering skills", type: "good" },
      { text: "Practical security hardening practices", type: "good" },
      { text: "Terraform state management expertise", type: "good" }
    ],
    recommendation: "Strong hire for Infrastructure team.",
    transcript: [],
    createdAt: new Date("2025-05-26").toISOString()
  }
];

class CandidatesDatabase {
  async getAll(filters = {}) {
    try {
      let sql = "SELECT * FROM candidates WHERE 1=1";
      const params = [];
      let idx = 1;

      if (filters.status && filters.status !== "All") {
        sql += ` AND LOWER(status) = LOWER($${idx++})`;
        params.push(filters.status);
      }
      if (filters.role && filters.role !== "All") {
        sql += ` AND LOWER(role) = LOWER($${idx++})`;
        params.push(filters.role);
      }
      if (filters.search) {
        sql += ` AND (LOWER(name) LIKE $${idx} OR LOWER(email) LIKE $${idx} OR LOWER(role) LIKE $${idx})`;
        params.push(`%${filters.search.toLowerCase()}%`);
        idx++;
      }
      sql += " ORDER BY timestamp DESC, created_at DESC, id ASC";

      const res = await query(sql, params);
      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map(mapRowToCandidate);
      }
      if (res && res.rows && res.rows.length === 0 && (filters.status || filters.role || filters.search)) {
        return [];
      }
    } catch (err) {
      console.warn("PostgreSQL getAll candidates fallback:", err.message);
    }

    let list = readData(COLLECTION, seedCandidates);
    if (filters.status && filters.status !== "All") {
      list = list.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.role && filters.role !== "All") {
      list = list.filter(c => c.role.toLowerCase() === filters.role.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getById(id) {
    try {
      const res = await query("SELECT * FROM candidates WHERE id = $1", [id]);
      if (res && res.rows && res.rows.length > 0) {
        return mapRowToCandidate(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL getById fallback:", err.message);
    }

    const list = readData(COLLECTION, seedCandidates);
    return list.find(c => c.id === id) || null;
  }

  async create(data) {
    const id = data.id || `cand-${Date.now()}`;
    const now = new Date();
    const timestamp = data.timestamp ? String(data.timestamp) : String(now.getTime());
    const interviewDate = data.interviewDate || now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    try {
      const sql = `
        INSERT INTO candidates (
          id, name, email, phone, role, avatar,
          interview_date, timestamp, duration, mode,
          score, status, notes, summary_points, recommendation,
          transcript, evaluation_breakdown, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          avatar = EXCLUDED.avatar,
          interview_date = EXCLUDED.interview_date,
          timestamp = EXCLUDED.timestamp,
          duration = EXCLUDED.duration,
          mode = EXCLUDED.mode,
          score = EXCLUDED.score,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          summary_points = EXCLUDED.summary_points,
          recommendation = EXCLUDED.recommendation,
          transcript = EXCLUDED.transcript,
          evaluation_breakdown = EXCLUDED.evaluation_breakdown
        RETURNING *;
      `;
      const params = [
        id,
        data.name || "New Candidate",
        data.email || `${id}@example.com`,
        data.phone || "+91 98000 00000",
        data.role || "Software Engineer",
        data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        interviewDate,
        timestamp,
        data.duration || "20m 00s",
        data.mode || "AI Interview",
        data.score || 80,
        data.status || "Under Review",
        data.notes || "",
        JSON.stringify(data.summaryPoints || [{ text: "Completed AI Assessment", type: "good" }]),
        data.recommendation || "Assessment completed.",
        JSON.stringify(data.transcript || []),
        JSON.stringify(data.evaluationBreakdown || []),
        now.toISOString()
      ];

      const res = await query(sql, params);
      if (res && res.rows && res.rows.length > 0) {
        return mapRowToCandidate(res.rows[0]);
      }
    } catch (err) {
      console.warn("PostgreSQL create candidate fallback:", err.message);
    }

    const list = readData(COLLECTION, seedCandidates);
    const newCand = {
      id,
      name: data.name || "New Candidate",
      email: data.email || `${id}@example.com`,
      phone: data.phone || "+91 98000 00000",
      role: data.role || "Software Engineer",
      avatar: data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      interviewDate,
      timestamp: Number(timestamp),
      duration: data.duration || "20m 00s",
      mode: data.mode || "AI Interview",
      score: data.score || 80,
      status: data.status || "Under Review",
      notes: data.notes || "",
      summaryPoints: data.summaryPoints || [
        { text: "Completed AI Assessment", type: "good" }
      ],
      recommendation: data.recommendation || "Assessment completed.",
      transcript: data.transcript || [],
      evaluationBreakdown: data.evaluationBreakdown || [],
      createdAt: now.toISOString()
    };
    list.unshift(newCand);
    writeData(COLLECTION, list);
    return newCand;
  }

  async update(id, updates) {
    try {
      const fields = [];
      const params = [id];
      let idx = 2;

      if (updates.name !== undefined) { fields.push(`name = $${idx++}`); params.push(updates.name); }
      if (updates.email !== undefined) { fields.push(`email = $${idx++}`); params.push(updates.email); }
      if (updates.phone !== undefined) { fields.push(`phone = $${idx++}`); params.push(updates.phone); }
      if (updates.role !== undefined) { fields.push(`role = $${idx++}`); params.push(updates.role); }
      if (updates.avatar !== undefined) { fields.push(`avatar = $${idx++}`); params.push(updates.avatar); }
      if (updates.status !== undefined) { fields.push(`status = $${idx++}`); params.push(updates.status); }
      if (updates.score !== undefined) { fields.push(`score = $${idx++}`); params.push(updates.score); }
      if (updates.duration !== undefined) { fields.push(`duration = $${idx++}`); params.push(updates.duration); }
      if (updates.notes !== undefined) { fields.push(`notes = $${idx++}`); params.push(updates.notes); }
      if (updates.recommendation !== undefined) { fields.push(`recommendation = $${idx++}`); params.push(updates.recommendation); }
      if (updates.summaryPoints !== undefined) { fields.push(`summary_points = $${idx++}`); params.push(JSON.stringify(updates.summaryPoints)); }
      if (updates.transcript !== undefined) { fields.push(`transcript = $${idx++}`); params.push(JSON.stringify(updates.transcript)); }
      if (updates.evaluationBreakdown !== undefined) { fields.push(`evaluation_breakdown = $${idx++}`); params.push(JSON.stringify(updates.evaluationBreakdown)); }

      if (fields.length > 0) {
        const sql = `UPDATE candidates SET ${fields.join(", ")} WHERE id = $1 RETURNING *;`;
        const res = await query(sql, params);
        if (res && res.rows && res.rows.length > 0) {
          return mapRowToCandidate(res.rows[0]);
        }
      }
    } catch (err) {
      console.warn("PostgreSQL update candidate fallback:", err.message);
    }

    const list = readData(COLLECTION, seedCandidates);
    const itemIdx = list.findIndex(c => c.id === id);
    if (itemIdx === -1) return null;
    list[itemIdx] = { ...list[itemIdx], ...updates, updatedAt: new Date().toISOString() };
    writeData(COLLECTION, list);
    return list[itemIdx];
  }

  async delete(id) {
    try {
      const res = await query("DELETE FROM candidates WHERE id = $1", [id]);
      if (res && res.rowCount > 0) {
        return true;
      }
    } catch (err) {
      console.warn("PostgreSQL delete candidate fallback:", err.message);
    }

    const list = readData(COLLECTION, seedCandidates);
    const filtered = list.filter(c => c.id !== id);
    if (filtered.length === list.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }
}

module.exports = new CandidatesDatabase();
