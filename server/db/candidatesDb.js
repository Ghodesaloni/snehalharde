const { readData, writeData } = require("./dbEngine");
const { getPool } = require("./postgres");
const { evaluateTranscriptAlgorithmically } = require("../services/interviewEvaluatorService");

const COLLECTION = "candidates";

function matchesUser(item, targetEmail) {
  if (!targetEmail) return true;
  const target = targetEmail.toLowerCase().trim();
  const createdBy = (item.createdBy || "").toLowerCase().trim();
  const userEmail = (item.userEmail || "").toLowerCase().trim();

  if (createdBy === target || userEmail === target) return true;

  // Handle Saloni Ghode email aliases
  if (
    (target === "salonighode@gmail.com" || target === "salonighode3@gmail.com") &&
    (createdBy === "salonighode@gmail.com" || createdBy === "salonighode3@gmail.com" ||
     userEmail === "salonighode@gmail.com" || userEmail === "salonighode3@gmail.com")
  ) {
    return true;
  }

  // Handle Snehal Harde email aliases
  if (
    (target === "snehal.harde2935@gmail.com" || target === "snehalharde09@gmail.com" || target === "sneha.harde2935@gmail.com") &&
    (createdBy === "snehal.harde2935@gmail.com" || createdBy === "snehalharde09@gmail.com" ||
     userEmail === "snehal.harde2935@gmail.com" || userEmail === "snehalharde09@gmail.com")
  ) {
    return true;
  }

  return false;
}

function applyTranscriptEvaluation(cand) {
  if (!cand) return cand;
  const transcript = cand.transcript || cand.transcripts || [];
  if (Array.isArray(transcript) && transcript.some(t => !t.isAI && t.speaker !== "Ava" && t.speaker !== "AI Interviewer")) {
    const evalRes = evaluateTranscriptAlgorithmically(transcript, cand.role);
    return {
      ...cand,
      score: evalRes.overallScore,
      total_score: evalRes.total_score,
      accuracyScore: evalRes.accuracyScore,
      confidenceScore: evalRes.confidenceScore,
      totalQuestions: evalRes.totalQuestions,
      correctAnswersCount: evalRes.correctAnswersCount,
      incorrectOrSkippedCount: evalRes.incorrectOrSkippedCount,
      status: cand.status || evalRes.status,
      recommendation: cand.recommendation || evalRes.recommendation,
      evaluationBreakdown: (cand.evaluationBreakdown && cand.evaluationBreakdown.length > 0) ? cand.evaluationBreakdown : evalRes.evaluationBreakdown,
      summaryPoints: (cand.summaryPoints && cand.summaryPoints.length > 0) ? cand.summaryPoints : evalRes.summaryPoints,
      questionEvaluations: (cand.questionEvaluations && cand.questionEvaluations.length > 0) ? cand.questionEvaluations : (cand.qaEvaluations || evalRes.qaEvaluations),
      qaEvaluations: (cand.qaEvaluations && cand.qaEvaluations.length > 0) ? cand.qaEvaluations : (cand.questionEvaluations || evalRes.qaEvaluations),
      question_evaluations: (cand.question_evaluations && cand.question_evaluations.length > 0) ? cand.question_evaluations : (cand.qaEvaluations || evalRes.qaEvaluations)
    };
  }
  return cand;
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
        params.push(emailLower);
        if (emailLower === "salonighode@gmail.com" || emailLower === "salonighode3@gmail.com") {
          conditions.push(`(LOWER(created_by) IN ('salonighode@gmail.com', 'salonighode3@gmail.com') OR LOWER(user_email) IN ('salonighode@gmail.com', 'salonighode3@gmail.com'))`);
        } else {
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
      return (res.rows || []).map(r => this._mapRow(r));
    } catch (err) {
      console.warn("PostgreSQL candidates getAll fallback:", err.message);
    }

    // 2. Fallback to local JSON mirror
    let list = readData(COLLECTION, []);
    list = list.map(c => applyTranscriptEvaluation(c));

    if (filters.userEmail) {
      list = list.filter(c => matchesUser(c, filters.userEmail));
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
    const found = list.find(c => c.id === id) || null;
    return applyTranscriptEvaluation(found);
  }

  async create(data) {
    const list = readData(COLLECTION, []);
    const id = data.id || `cand-${Date.now()}`;

    // Compute dynamic evaluation based on rubric and answers
    let evaluatedScore = data.score !== undefined ? data.score : 90;
    let evaluatedStatus = data.status || "Under Review";
    let evaluatedRecommendation = data.recommendation || "";
    let evaluatedBreakdown = data.evaluationBreakdown || [];
    let evaluatedSummaryPoints = data.summaryPoints || [];
    let evaluatedQAs = data.question_evaluations || data.qaEvaluations || data.questionEvaluations || [];

    const transcript = data.transcript || data.transcripts || [];
    if (Array.isArray(transcript) && transcript.some(t => !t.isAI && t.speaker !== "Ava" && t.speaker !== "AI Interviewer")) {
      const evalRes = evaluateTranscriptAlgorithmically(transcript, data.role);
      evaluatedScore = data.score !== undefined ? data.score : evalRes.overallScore;
      evaluatedStatus = data.status || evalRes.status;
      evaluatedRecommendation = data.recommendation || evalRes.recommendation;
      evaluatedBreakdown = (data.evaluationBreakdown && data.evaluationBreakdown.length > 0) ? data.evaluationBreakdown : evalRes.evaluationBreakdown;
      evaluatedSummaryPoints = (data.summaryPoints && data.summaryPoints.length > 0) ? data.summaryPoints : evalRes.summaryPoints;
      if (!evaluatedQAs || evaluatedQAs.length === 0) {
        evaluatedQAs = evalRes.qaEvaluations || [];
      }
    }

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
      mode: data.mode || "AI Live Interview",
      score: evaluatedScore,
      total_score: evaluatedScore,
      status: evaluatedStatus,
      notes: data.notes || `Live interview evaluated based on technical correctness of answers and level of confidence. Overall score: ${evaluatedScore}/100 (${evaluatedStatus}).`,
      summaryPoints: evaluatedSummaryPoints,
      recommendation: evaluatedRecommendation,
      transcript: transcript,
      evaluationBreakdown: evaluatedBreakdown,
      questionEvaluations: evaluatedQAs,
      qaEvaluations: evaluatedQAs,
      question_evaluations: evaluatedQAs,
      audioUrl: data.audioUrl || data.audio_url || "",
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
          transcript, evaluation_breakdown, question_evaluations, created_by, user_email, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
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
          question_evaluations = EXCLUDED.question_evaluations,
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
        JSON.stringify(newCand.question_evaluations),
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
      if (updates.question_evaluations !== undefined || updates.qaEvaluations !== undefined) {
        params.push(JSON.stringify(updates.question_evaluations || updates.qaEvaluations));
        setClauses.push(`question_evaluations = $${params.length}`);
      }
      if (updates.evaluationBreakdown !== undefined) {
        params.push(JSON.stringify(updates.evaluationBreakdown));
        setClauses.push(`evaluation_breakdown = $${params.length}`);
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
    const qEvals = typeof row.question_evaluations === "string" ? JSON.parse(row.question_evaluations) : (row.question_evaluations || []);
    const mapped = {
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
      total_score: row.score,
      status: row.status,
      notes: row.notes,
      summaryPoints: typeof row.summary_points === "string" ? JSON.parse(row.summary_points) : (row.summary_points || []),
      recommendation: row.recommendation,
      transcript: typeof row.transcript === "string" ? JSON.parse(row.transcript) : (row.transcript || []),
      evaluationBreakdown: typeof row.evaluation_breakdown === "string" ? JSON.parse(row.evaluation_breakdown) : (row.evaluation_breakdown || []),
      questionEvaluations: qEvals,
      qaEvaluations: qEvals,
      question_evaluations: qEvals,
      audioUrl: row.audio_url || row.audioUrl || "",
      createdBy: row.created_by,
      userEmail: row.user_email,
      createdAt: row.created_at
    };
    return applyTranscriptEvaluation(mapped);
  }
}

module.exports = new CandidatesDatabase();
