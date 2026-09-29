const { readData, writeData } = require("./dbEngine");
const { getPool } = require("./postgres");
const { classifyCandidateDomain, ALL_DOMAINS } = require("../services/domainClassifier");

const COLLECTION = "resumes";

class ResumesDatabase {
  classifyDomain(candidate) {
    if (candidate.domain && ALL_DOMAINS.includes(candidate.domain)) {
      return candidate.domain;
    }
    if (candidate.field && ALL_DOMAINS.includes(candidate.field)) {
      return candidate.field;
    }

    const classification = classifyCandidateDomain(
      {
        role: candidate.role || candidate.currentRole || "",
        currentRole: candidate.currentRole || candidate.role || "",
        education: typeof candidate.education === "string" ? candidate.education : (candidate.education?.[0]?.degree || ""),
        summary: candidate.summary || "",
        experience: candidate.experienceEntries || []
      },
      candidate.rawText || "",
      candidate.all_normalized_skills || []
    );

    return classification.primary_domain;
  }

  ensureFields(candidate) {
    if (!candidate) return candidate;
    const skills = candidate.allSkills || candidate.skills || [];
    const status = candidate.status === "Under Review" ? "Review" : candidate.status || "Review";
    const field = candidate.field || candidate.domain || this.classifyDomain(candidate);

    return {
      ...candidate,
      field,
      domain: field,
      secondaryDomains: candidate.secondaryDomains || candidate.secondary_domains || [],
      status,
      jobId: candidate.jobId || candidate.targetJobId || null,
      targetJobTitle: candidate.targetJobTitle || null,
      currentRole: candidate.currentRole || candidate.role || "",
      education: candidate.education || "",
      summary: candidate.summary || (candidate.name ? `${candidate.name} profile.` : ""),
      matchedSkills: candidate.matchedSkills || skills.slice(0, 3),
      missingSkills: candidate.missingSkills || [],
      missingRequiredSkills: candidate.missingRequiredSkills || [],
      missingPreferredSkills: candidate.missingPreferredSkills || [],
      breakdown: candidate.breakdown || null,
      resumeQuality: candidate.resumeQuality || candidate.resume_quality || null,
      keyPoints: candidate.keyPoints || {
        strengths: skills.length > 0 ? [`Proficient in: ${skills.slice(0, 3).join(", ")}.`] : [],
        missingSkills: candidate.missingSkills || [],
        experienceMatch: candidate.experience ? `Experience: ${candidate.experience}` : "",
        verdict: status === "Shortlisted" 
          ? "High ATS compatibility. Shortlisted for screening round." 
          : status === "Review" 
          ? "Candidate profile under evaluation for potential match." 
          : "Application processed."
      }
    };
  }

  getAll(filters = {}) {
    let list = readData(COLLECTION, []);
    list = list.map(c => this.ensureFields(c));

    if (filters.field && filters.field !== "All" && filters.field !== "All Fields") {
      list = list.filter(r => (r.field || "").toLowerCase() === filters.field.toLowerCase());
    }
    if (filters.domain && filters.domain !== "All" && filters.domain !== "All Domains" && filters.domain !== "All Fields") {
      const qDom = filters.domain.toLowerCase();
      list = list.filter(r =>
        (r.domain || r.field || "").toLowerCase() === qDom ||
        (Array.isArray(r.secondaryDomains) && r.secondaryDomains.some(sd => sd.toLowerCase() === qDom))
      );
    }
    if (filters.jobId && filters.jobId !== "All") {
      list = list.filter(r => r.jobId === filters.jobId || r.targetJobId === filters.jobId);
    }
    if (filters.status && filters.status !== "All") {
      list = list.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.role && filters.role !== "All") {
      list = list.filter(r => r.role.toLowerCase() === filters.role.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.role && r.role.toLowerCase().includes(q)) ||
        (r.field && r.field.toLowerCase().includes(q)) ||
        (r.domain && r.domain.toLowerCase().includes(q)) ||
        (r.allSkills && r.allSkills.some(s => s.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "ats_desc":
          list.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));
          break;
        case "ats_asc":
          list.sort((a, b) => (a.atsScore || 0) - (b.atsScore || 0));
          break;
        case "match_desc":
          list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          break;
        case "exp_desc":
          list.sort((a, b) => (b.expYears || 0) - (a.expYears || 0));
          break;
        case "domain":
          list.sort((a, b) => (a.domain || "").localeCompare(b.domain || ""));
          break;
        default:
          break;
      }
    }

    return list;
  }

  getById(id) {
    const list = readData(COLLECTION, []);
    const item = list.find(r => r.id === id);
    return item ? this.ensureFields(item) : null;
  }

  findByEmail(email) {
    if (!email) return null;
    const list = readData(COLLECTION, []);
    const item = list.find(r => r.email && r.email.toLowerCase() === email.toLowerCase());
    return item ? this.ensureFields(item) : null;
  }

  findDuplicate(resumeData) {
    const list = readData(COLLECTION, []);
    if (resumeData.email) {
      const byEmail = list.find(r => r.email && r.email.toLowerCase() === resumeData.email.toLowerCase());
      if (byEmail) return byEmail;
    }
    if (resumeData.name && resumeData.resumeFileName) {
      const byNameAndFile = list.find(r =>
        r.name && r.name.toLowerCase() === resumeData.name.toLowerCase() &&
        r.resumeFileName && r.resumeFileName.toLowerCase() === resumeData.resumeFileName.toLowerCase()
      );
      if (byNameAndFile) return byNameAndFile;
    }
    return null;
  }

  create(resumeData) {
    // Check for duplicate candidate to update rather than creating multiple duplicate rows
    const existing = this.findDuplicate(resumeData);
    if (existing) {
      return this.update(existing.id, resumeData);
    }

    const list = readData(COLLECTION, []);
    const id = `c-${Date.now()}`;
    const skills = Array.isArray(resumeData.skills) ? resumeData.skills : (resumeData.skills ? resumeData.skills.split(",").map(s => s.trim()) : []);
    const allSkills = resumeData.allSkills || skills;
    const field = resumeData.field || resumeData.domain || this.classifyDomain({ ...resumeData, allSkills });

    const newCandidate = {
      id,
      name: resumeData.name || "Candidate",
      email: resumeData.email || "",
      phone: resumeData.phone || "",
      location: resumeData.location || "",
      avatar: resumeData.avatar || "",
      role: resumeData.role || "",
      field,
      domain: field,
      secondaryDomains: resumeData.secondaryDomains || resumeData.secondary_domains || [],
      experience: resumeData.experience || "0 Years",
      expYears: resumeData.expYears !== undefined ? resumeData.expYears : 0,
      skills: skills.slice(0, 3),
      extraSkillsCount: Math.max(0, allSkills.length - 3),
      allSkills,
      all_normalized_skills: resumeData.all_normalized_skills || [],
      education: typeof resumeData.education === "string" ? resumeData.education : (resumeData.education?.[0]?.degree || "Bachelor's Degree"),
      educationEntries: Array.isArray(resumeData.education) ? resumeData.education : [],
      experienceEntries: Array.isArray(resumeData.experienceEntries) ? resumeData.experienceEntries : [],
      atsScore: resumeData.atsScore !== undefined ? resumeData.atsScore : 0,
      matchScore: resumeData.matchScore !== undefined ? resumeData.matchScore : 0,
      skillsMatchPct: resumeData.skillsMatchPct !== undefined ? resumeData.skillsMatchPct : 0,
      status: resumeData.status || "New",
      breakdown: resumeData.breakdown || null,
      resumeQuality: resumeData.resumeQuality || resumeData.resume_quality || null,
      matchedSkills: resumeData.matchedSkills || [],
      missingSkills: resumeData.missingSkills || [],
      missingRequiredSkills: resumeData.missingRequiredSkills || [],
      missingPreferredSkills: resumeData.missingPreferredSkills || [],
      keyPoints: resumeData.keyPoints || null,
      summary: resumeData.summary || "",
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      jobId: resumeData.jobId || resumeData.targetJobId || null,
      targetJobTitle: resumeData.targetJobTitle || null,
      resumeFileName: resumeData.resumeFileName || "",
      rawText: resumeData.rawText ? resumeData.rawText.slice(0, 3000) : "",
      storageProvider: resumeData.storageProvider || "Local",
      s3Url: resumeData.s3Url || null,
      s3Key: resumeData.s3Key || null,
      s3Bucket: resumeData.s3Bucket || null,
      createdAt: new Date().toISOString()
    };

    list.unshift(newCandidate);
    writeData(COLLECTION, list);

    // Persist to PostgreSQL public.resumes
    try {
      const pool = getPool();
      pool.query(`
        INSERT INTO public.resumes (
          id, candidate_id, name, email, phone, role, target_job_id,
          target_job_title, field, domain, score, status, skills,
          experience, exp_years, resume_file_name, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          updated_at = NOW();
      `, [
        newCandidate.id, newCandidate.id, newCandidate.name, newCandidate.email,
        newCandidate.phone, newCandidate.role, newCandidate.jobId,
        newCandidate.targetJobTitle, newCandidate.field, newCandidate.domain,
        newCandidate.atsScore || newCandidate.matchScore || 0, newCandidate.status,
        JSON.stringify(newCandidate.allSkills), newCandidate.experience,
        newCandidate.expYears, newCandidate.resumeFileName
      ]).catch(err => console.warn("PostgreSQL resume insert warning:", err.message));
    } catch (e) {}

    return newCandidate;
  }

  update(id, updates) {
    const list = readData(COLLECTION, []);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(COLLECTION, list);

    // Update in PostgreSQL public.resumes
    try {
      const pool = getPool();
      pool.query(`
        UPDATE public.resumes SET
          status = COALESCE($2, status),
          score = COALESCE($3, score),
          target_job_id = COALESCE($4, target_job_id),
          updated_at = NOW()
        WHERE id = $1
      `, [id, updates.status || null, updates.atsScore || updates.score || null, updates.jobId || null])
      .catch(err => console.warn("PostgreSQL resume update warning:", err.message));
    } catch (e) {}

    return list[idx];
  }

  updateStatus(id, status) {
    return this.update(id, { status });
  }

  delete(id) {
    const list = readData(COLLECTION, []);
    const filtered = list.filter(r => r.id !== id);
    if (filtered.length === list.length) return false;
    writeData(COLLECTION, filtered);

    // Delete in PostgreSQL public.resumes
    try {
      const pool = getPool();
      pool.query("DELETE FROM public.resumes WHERE id = $1", [id])
        .catch(err => console.warn("PostgreSQL resume delete warning:", err.message));
    } catch (e) {}

    return true;
  }
}

module.exports = new ResumesDatabase();
