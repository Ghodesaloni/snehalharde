const { readData, writeData } = require("./dbEngine");
const { getPool } = require("./postgres");

const COLLECTION = "interviews";

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

class InterviewsDatabase {
  syncFromResume(resumeItem) {
    if (!resumeItem) return null;
    const list = readData(COLLECTION, []);
    
    const candidateId = resumeItem.id;
    const emailLower = (resumeItem.email || "").toLowerCase().trim();

    // Check if interview already exists for this candidate
    let existingIdx = list.findIndex(iv => 
      iv.candidateId === candidateId ||
      iv.resumeId === candidateId ||
      iv.id === `iv-${candidateId}` ||
      (emailLower && iv.email && iv.email.toLowerCase().trim() === emailLower)
    );

    const id = existingIdx >= 0 ? list[existingIdx].id : `iv-${candidateId}`;
    const cleanNum = candidateId.replace(/\D/g, "").slice(-3) || Math.floor(100 + Math.random() * 900);
    const linkCode = existingIdx >= 0 && list[existingIdx].linkCode ? list[existingIdx].linkCode : `ava${cleanNum}`;

    const dateVal = existingIdx >= 0 && list[existingIdx].date 
      ? list[existingIdx].date 
      : (resumeItem.uploadedDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }));

    const interviewData = {
      id,
      candidateId,
      resumeId: candidateId,
      name: resumeItem.name || "Candidate",
      email: resumeItem.email || "",
      phone: resumeItem.phone || "",
      avatar: resumeItem.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      role: resumeItem.targetJobTitle || resumeItem.role || "Software Engineer",
      company: "AvaHire Technologies Pvt. Ltd.",
      date: dateVal,
      dayOfWeek: existingIdx >= 0 && list[existingIdx].dayOfWeek ? list[existingIdx].dayOfWeek : "Tuesday",
      time: existingIdx >= 0 && list[existingIdx].time ? list[existingIdx].time : "11:00 AM",
      timeZone: "IST",
      duration: existingIdx >= 0 && list[existingIdx].duration ? list[existingIdx].duration : "45 Minutes",
      durationMins: 45,
      linkCode,
      status: existingIdx >= 0 && list[existingIdx].status ? list[existingIdx].status : "Scheduled",
      expiry: existingIdx >= 0 && list[existingIdx].expiry ? list[existingIdx].expiry : "Not started",
      expiryTime: existingIdx >= 0 && list[existingIdx].expiryTime ? list[existingIdx].expiryTime : `${dateVal}, 11:00 AM`,
      isExpired: false,
      score: resumeItem.atsScore || resumeItem.matchScore || null,
      createdBy: resumeItem.createdBy || resumeItem.userEmail || "",
      userEmail: resumeItem.userEmail || resumeItem.createdBy || "",
      createdAt: existingIdx >= 0 && list[existingIdx].createdAt ? list[existingIdx].createdAt : new Date().toISOString()
    };

    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...interviewData };
    } else {
      list.unshift(interviewData);
    }
    writeData(COLLECTION, list);

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
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          created_by = EXCLUDED.created_by,
          user_email = EXCLUDED.user_email
        RETURNING *;
      `;
      p.query(query, [
        interviewData.id, interviewData.candidateId, interviewData.name, interviewData.email,
        interviewData.avatar, interviewData.role, interviewData.company, interviewData.date,
        interviewData.dayOfWeek, interviewData.time, interviewData.timeZone, interviewData.duration,
        interviewData.durationMins, interviewData.linkCode, interviewData.status, interviewData.expiry,
        interviewData.expiryTime, interviewData.isExpired, interviewData.score, interviewData.createdBy,
        interviewData.userEmail
      ]).catch(() => {});
    } catch (_) {}

    return interviewData;
  }

  removeForCandidate(candidateId, email) {
    const list = readData(COLLECTION, []);
    const emailLower = email ? email.toLowerCase().trim() : null;
    const filtered = list.filter(iv => {
      if (candidateId && (iv.candidateId === candidateId || iv.resumeId === candidateId || iv.id === `iv-${candidateId}`)) {
        return false;
      }
      if (emailLower && iv.email && iv.email.toLowerCase().trim() === emailLower) {
        return false;
      }
      return true;
    });
    if (filtered.length !== list.length) {
      writeData(COLLECTION, filtered);
    }
    try {
      const p = getPool();
      if (candidateId) {
        p.query("DELETE FROM public.interviews WHERE candidate_id = $1 OR id = $2", [candidateId, `iv-${candidateId}`]).catch(() => {});
      }
      if (emailLower) {
        p.query("DELETE FROM public.interviews WHERE LOWER(email) = $1", [emailLower]).catch(() => {});
      }
    } catch (_) {}
  }

  async getAll(filters = {}) {
    // 1. Sync resumes from resumesDb so selected candidates are connected
    let resumesList = [];
    try {
      const resumesDb = require("./resumesDb");
      resumesList = resumesDb.getAll() || [];
    } catch (e) {
      resumesList = [];
    }

    const rejectedCandIds = new Set();
    const rejectedEmails = new Set();
    const selectedResumes = [];

    for (const r of resumesList) {
      const st = String(r.status || "").trim().toLowerCase();
      if (st === "rejected") {
        if (r.id) rejectedCandIds.add(r.id);
        if (r.email) rejectedEmails.add(r.email.toLowerCase().trim());
      } else if (st === "selected" || st === "shortlisted") {
        selectedResumes.push(r);
      }
    }

    // 2. Fetch interviews from local JSON mirror
    let list = readData(COLLECTION, []);
    let modified = false;

    // Filter out any interviews that match a rejected resume candidate
    const beforeCount = list.length;
    list = list.filter(iv => {
      if (iv.candidateId && rejectedCandIds.has(iv.candidateId)) return false;
      if (iv.resumeId && rejectedCandIds.has(iv.resumeId)) return false;
      if (iv.id && rejectedCandIds.has(iv.id.replace(/^iv-/, ""))) return false;
      if (iv.email && rejectedEmails.has(iv.email.toLowerCase().trim())) return false;
      return true;
    });
    if (list.length !== beforeCount) modified = true;

    // Automatically ensure all selected/shortlisted candidates from resumes are scheduled and present
    for (const sr of selectedResumes) {
      const emailLower = (sr.email || "").toLowerCase().trim();
      const existingIdx = list.findIndex(iv =>
        iv.candidateId === sr.id ||
        iv.resumeId === sr.id ||
        iv.id === `iv-${sr.id}` ||
        (emailLower && iv.email && iv.email.toLowerCase().trim() === emailLower)
      );

      const cleanNum = sr.id.replace(/\D/g, "").slice(-3) || Math.floor(100 + Math.random() * 900);
      const dateVal = sr.uploadedDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
      
      if (existingIdx === -1) {
        const newIv = {
          id: `iv-${sr.id}`,
          candidateId: sr.id,
          resumeId: sr.id,
          name: sr.name || "Candidate",
          email: sr.email || "",
          phone: sr.phone || "",
          avatar: sr.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
          role: sr.targetJobTitle || sr.role || "Software Engineer",
          company: "AvaHire Technologies Pvt. Ltd.",
          date: dateVal,
          dayOfWeek: "Tuesday",
          time: "11:00 AM",
          timeZone: "IST",
          duration: "45 Minutes",
          durationMins: 45,
          linkCode: `ava${cleanNum}`,
          status: "Scheduled",
          expiry: "Not started",
          expiryTime: `${dateVal}, 11:00 AM`,
          isExpired: false,
          score: sr.atsScore || sr.matchScore || null,
          createdBy: sr.createdBy || sr.userEmail || "",
          userEmail: sr.userEmail || sr.createdBy || "",
          createdAt: sr.createdAt || new Date().toISOString()
        };
        list.unshift(newIv);
        modified = true;
      } else {
        // Sync role/name/phone/avatar/score if updated in resume
        const curr = list[existingIdx];
        if (sr.name && curr.name !== sr.name) { curr.name = sr.name; modified = true; }
        if (sr.phone && curr.phone !== sr.phone) { curr.phone = sr.phone; modified = true; }
        if (sr.targetJobTitle && curr.role !== sr.targetJobTitle) { curr.role = sr.targetJobTitle; modified = true; }
        if ((sr.atsScore || sr.matchScore) && curr.score !== (sr.atsScore || sr.matchScore)) {
          curr.score = sr.atsScore || sr.matchScore;
          modified = true;
        }
      }
    }

    if (modified) {
      writeData(COLLECTION, list);
    }

    // Try PostgreSQL query if pool is available and update it
    try {
      const p = getPool();
      let query = "SELECT * FROM public.interviews";
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
        const rowsMapped = (res.rows || []).map(this._mapRow);
        // Exclude rejected candidates from PostgreSQL rows too
        return rowsMapped.filter(iv => {
          if (iv.candidateId && rejectedCandIds.has(iv.candidateId)) return false;
          if (iv.resumeId && rejectedCandIds.has(iv.resumeId)) return false;
          if (iv.email && rejectedEmails.has(iv.email.toLowerCase().trim())) return false;
          return true;
        });
      }
    } catch (err) {
      // fallback to list
    }

    // Filter by userEmail
    if (filters.userEmail) {
      list = list.filter(iv => matchesUser(iv, filters.userEmail));
    }
    // Filter by status
    if (filters.status && filters.status !== "All" && filters.status !== "All Status") {
      list = list.filter(iv => (iv.status || "").toLowerCase() === filters.status.toLowerCase());
    }
    // Filter by search
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
      resumeId: data.resumeId || data.candidateId || "",
      name: data.name || "Candidate",
      email: data.email || "",
      phone: data.phone || "",
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
      resumeId: row.resume_id || row.candidate_id,
      name: row.name,
      email: row.email,
      phone: row.phone || "",
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
