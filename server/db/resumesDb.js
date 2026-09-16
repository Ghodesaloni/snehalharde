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
    const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
    const allSkills = Array.isArray(candidate.allSkills) && candidate.allSkills.length > 0 ? candidate.allSkills : skills;
    const status = candidate.status === "Under Review" ? "Review" : (candidate.status || "Review");
    const field = candidate.field || candidate.domain || this.classifyDomain(candidate);
    const atsScore = Number(candidate.atsScore ?? candidate.score ?? 0);
    const matchScore = Number(candidate.matchScore ?? candidate.score ?? 0);
    const skillsMatchPct = Number(candidate.skillsMatchPct ?? 80);

    const educationEntries = Array.isArray(candidate.educationEntries) && candidate.educationEntries.length > 0
      ? candidate.educationEntries
      : (Array.isArray(candidate.education) ? candidate.education : (candidate.resumeData?.educationEntries || []));

    const experienceEntries = Array.isArray(candidate.experienceEntries) && candidate.experienceEntries.length > 0
      ? candidate.experienceEntries
      : (candidate.resumeData?.experienceEntries || []);

    const rawText = candidate.rawText || candidate.resumeData?.rawText || "";
    const resumeFileName = candidate.resumeFileName || candidate.resumeData?.fileName || "";

    const keyPoints = candidate.keyPoints || {
      strengths: allSkills.length > 0 ? [`Proficient in: ${allSkills.slice(0, 3).join(", ")}.`] : ["Meets core criteria"],
      missingSkills: candidate.missingSkills || [],
      experienceMatch: candidate.experience ? `Experience: ${candidate.experience}` : "",
      verdict: status === "Shortlisted" 
        ? "High ATS compatibility. Shortlisted for screening round." 
        : status === "Review" 
        ? "Candidate profile under evaluation for potential match." 
        : "Application processed."
    };

    const aiAnalysis = candidate.aiAnalysis || {
      summary: candidate.summary || (candidate.name ? `${candidate.name} candidate profile.` : ""),
      keyPoints,
      breakdown: candidate.breakdown || null,
      matchedSkills: candidate.matchedSkills || allSkills.slice(0, 3),
      missingSkills: candidate.missingSkills || [],
      missingRequiredSkills: candidate.missingRequiredSkills || [],
      missingPreferredSkills: candidate.missingPreferredSkills || [],
      atsScore,
      matchScore,
      skillsMatchPct,
      status
    };

    const resumeData = candidate.resumeData || {
      fileName: resumeFileName,
      rawText,
      education: typeof candidate.education === "string" ? candidate.education : "Bachelor's Degree",
      educationEntries,
      experienceEntries,
      projects: candidate.projects || [],
      certifications: candidate.certifications || [],
      resumeQuality: candidate.resumeQuality || null
    };

    return {
      ...candidate,
      field,
      domain: field,
      secondaryDomains: candidate.secondaryDomains || candidate.secondary_domains || [],
      status,
      location: candidate.location || "Remote",
      score: atsScore,
      atsScore,
      matchScore,
      skillsMatchPct,
      skills: skills.length > 0 ? skills.slice(0, 3) : allSkills.slice(0, 3),
      allSkills,
      jobId: candidate.jobId || candidate.targetJobId || null,
      targetJobId: candidate.targetJobId || candidate.jobId || null,
      targetJobTitle: candidate.targetJobTitle || null,
      currentRole: candidate.currentRole || candidate.role || "",
      education: typeof candidate.education === "string" ? candidate.education : (educationEntries[0]?.degree || "Bachelor's Degree"),
      educationEntries,
      experienceEntries,
      rawText,
      resumeFileName,
      summary: candidate.summary || aiAnalysis.summary || (candidate.name ? `${candidate.name} profile.` : ""),
      matchedSkills: candidate.matchedSkills || allSkills.slice(0, 3),
      missingSkills: candidate.missingSkills || [],
      missingRequiredSkills: candidate.missingRequiredSkills || [],
      missingPreferredSkills: candidate.missingPreferredSkills || [],
      breakdown: candidate.breakdown || null,
      resumeQuality: candidate.resumeQuality || candidate.resume_quality || null,
      keyPoints,
      aiAnalysis,
      resumeData
    };
  }

  getAll(filters = {}) {
    let list = readData(COLLECTION, []);
    // Exclude any legacy sample candidate resumes
    list = list.filter(r => r && r.id && !r.id.startsWith("c-100") && !r.email?.endsWith("@example.com"));
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
    const id = resumeData.id || `c-${Date.now()}`;
    const skills = Array.isArray(resumeData.skills) ? resumeData.skills : (resumeData.skills ? resumeData.skills.split(",").map(s => s.trim()) : []);
    const allSkills = Array.isArray(resumeData.allSkills) && resumeData.allSkills.length > 0 ? resumeData.allSkills : skills;
    const field = resumeData.field || resumeData.domain || this.classifyDomain({ ...resumeData, allSkills });
    const atsScore = Number(resumeData.atsScore ?? resumeData.score ?? 0);
    const matchScore = Number(resumeData.matchScore ?? resumeData.score ?? 0);
    const skillsMatchPct = Number(resumeData.skillsMatchPct ?? 80);
    const status = resumeData.status === "Under Review" ? "Review" : (resumeData.status || "Review");

    const educationEntries = Array.isArray(resumeData.educationEntries) && resumeData.educationEntries.length > 0
      ? resumeData.educationEntries
      : (Array.isArray(resumeData.education) ? resumeData.education : (resumeData.resumeData?.educationEntries || []));

    const experienceEntries = Array.isArray(resumeData.experienceEntries) && resumeData.experienceEntries.length > 0
      ? resumeData.experienceEntries
      : (resumeData.resumeData?.experienceEntries || []);

    const rawText = resumeData.rawText || resumeData.resumeData?.rawText || "";
    const resumeFileName = resumeData.resumeFileName || resumeData.resumeData?.fileName || "";

    const keyPoints = resumeData.keyPoints || {
      strengths: allSkills.length > 0 ? [`Proficient in: ${allSkills.slice(0, 3).join(", ")}.`] : ["Meets core criteria"],
      missingSkills: resumeData.missingSkills || [],
      experienceMatch: resumeData.experience ? `Experience: ${resumeData.experience}` : "",
      verdict: status === "Shortlisted" 
        ? "High ATS compatibility. Shortlisted for screening round." 
        : status === "Review" 
        ? "Candidate profile under evaluation for potential match." 
        : "Application processed."
    };

    const aiAnalysis = resumeData.aiAnalysis || {
      summary: resumeData.summary || (resumeData.name ? `${resumeData.name} candidate profile.` : ""),
      keyPoints,
      breakdown: resumeData.breakdown || null,
      matchedSkills: resumeData.matchedSkills || allSkills.slice(0, 3),
      missingSkills: resumeData.missingSkills || [],
      missingRequiredSkills: resumeData.missingRequiredSkills || [],
      missingPreferredSkills: resumeData.missingPreferredSkills || [],
      atsScore,
      matchScore,
      skillsMatchPct,
      status
    };

    const structuredResumeData = resumeData.resumeData || {
      fileName: resumeFileName,
      rawText,
      education: typeof resumeData.education === "string" ? resumeData.education : "Bachelor's Degree",
      educationEntries,
      experienceEntries,
      projects: resumeData.projects || [],
      certifications: resumeData.certifications || [],
      resumeQuality: resumeData.resumeQuality || null
    };

    const newCandidate = {
      id,
      name: resumeData.name || "Candidate",
      email: resumeData.email || "",
      phone: resumeData.phone || "",
      location: resumeData.location || "Remote",
      avatar: resumeData.avatar || "",
      role: resumeData.role || "",
      field,
      domain: field,
      secondaryDomains: resumeData.secondaryDomains || resumeData.secondary_domains || [],
      experience: resumeData.experience || "0 Years",
      expYears: resumeData.expYears !== undefined ? resumeData.expYears : 0,
      skills: skills.length > 0 ? skills.slice(0, 3) : allSkills.slice(0, 3),
      extraSkillsCount: Math.max(0, allSkills.length - 3),
      allSkills,
      all_normalized_skills: resumeData.all_normalized_skills || [],
      education: typeof resumeData.education === "string" ? resumeData.education : (educationEntries[0]?.degree || "Bachelor's Degree"),
      educationEntries,
      experienceEntries,
      score: atsScore,
      atsScore,
      matchScore,
      skillsMatchPct,
      status,
      breakdown: resumeData.breakdown || null,
      resumeQuality: resumeData.resumeQuality || resumeData.resume_quality || null,
      matchedSkills: resumeData.matchedSkills || allSkills.slice(0, 3),
      missingSkills: resumeData.missingSkills || [],
      missingRequiredSkills: resumeData.missingRequiredSkills || [],
      missingPreferredSkills: resumeData.missingPreferredSkills || [],
      keyPoints,
      summary: resumeData.summary || aiAnalysis.summary || (resumeData.name ? `${resumeData.name} profile.` : ""),
      aiAnalysis,
      resumeData: structuredResumeData,
      uploadedDate: resumeData.uploadedDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      jobId: resumeData.jobId || resumeData.targetJobId || null,
      targetJobId: resumeData.targetJobId || resumeData.jobId || null,
      targetJobTitle: resumeData.targetJobTitle || null,
      resumeFileName,
      rawText: rawText ? rawText.slice(0, 10000) : "",
      storageProvider: resumeData.storageProvider || "Local",
      s3Url: resumeData.s3Url || null,
      s3Key: resumeData.s3Key || null,
      s3Bucket: resumeData.s3Bucket || null,
      createdAt: resumeData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newCandidate);
    writeData(COLLECTION, list);

    // Persist to PostgreSQL public.resumes with ALL columns
    try {
      const pool = getPool();
      pool.query(`
        INSERT INTO public.resumes (
          id, candidate_id, name, email, phone, location, role,
          target_job_id, target_job_title, field, domain, score,
          ats_score, match_score, skills_match_pct, status, skills,
          all_skills, secondary_domains, matched_skills, missing_skills,
          missing_required_skills, missing_preferred_skills, experience,
          exp_years, experience_entries, education, education_entries,
          summary, breakdown, ai_analysis, resume_data, key_points,
          raw_text, resume_file_name, file_url, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34, $35, $36, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          location = EXCLUDED.location,
          role = EXCLUDED.role,
          target_job_id = EXCLUDED.target_job_id,
          target_job_title = EXCLUDED.target_job_title,
          field = EXCLUDED.field,
          domain = EXCLUDED.domain,
          score = EXCLUDED.score,
          ats_score = EXCLUDED.ats_score,
          match_score = EXCLUDED.match_score,
          skills_match_pct = EXCLUDED.skills_match_pct,
          status = EXCLUDED.status,
          skills = EXCLUDED.skills,
          all_skills = EXCLUDED.all_skills,
          secondary_domains = EXCLUDED.secondary_domains,
          matched_skills = EXCLUDED.matched_skills,
          missing_skills = EXCLUDED.missing_skills,
          missing_required_skills = EXCLUDED.missing_required_skills,
          missing_preferred_skills = EXCLUDED.missing_preferred_skills,
          experience = EXCLUDED.experience,
          exp_years = EXCLUDED.exp_years,
          experience_entries = EXCLUDED.experience_entries,
          education = EXCLUDED.education,
          education_entries = EXCLUDED.education_entries,
          summary = EXCLUDED.summary,
          breakdown = EXCLUDED.breakdown,
          ai_analysis = EXCLUDED.ai_analysis,
          resume_data = EXCLUDED.resume_data,
          key_points = EXCLUDED.key_points,
          raw_text = EXCLUDED.raw_text,
          resume_file_name = EXCLUDED.resume_file_name,
          file_url = EXCLUDED.file_url,
          updated_at = NOW();
      `, [
        newCandidate.id,
        newCandidate.id,
        newCandidate.name,
        newCandidate.email,
        newCandidate.phone,
        newCandidate.location,
        newCandidate.role,
        newCandidate.jobId,
        newCandidate.targetJobTitle,
        newCandidate.field,
        newCandidate.domain,
        newCandidate.atsScore,
        newCandidate.atsScore,
        newCandidate.matchScore,
        newCandidate.skillsMatchPct,
        newCandidate.status,
        JSON.stringify(newCandidate.skills),
        JSON.stringify(newCandidate.allSkills),
        JSON.stringify(newCandidate.secondaryDomains),
        JSON.stringify(newCandidate.matchedSkills),
        JSON.stringify(newCandidate.missingSkills),
        JSON.stringify(newCandidate.missingRequiredSkills),
        JSON.stringify(newCandidate.missingPreferredSkills),
        newCandidate.experience,
        newCandidate.expYears,
        JSON.stringify(newCandidate.experienceEntries),
        newCandidate.education,
        JSON.stringify(newCandidate.educationEntries),
        newCandidate.summary,
        JSON.stringify(newCandidate.breakdown || {}),
        JSON.stringify(newCandidate.aiAnalysis || {}),
        JSON.stringify(newCandidate.resumeData || {}),
        JSON.stringify(newCandidate.keyPoints || {}),
        newCandidate.rawText,
        newCandidate.resumeFileName,
        newCandidate.fileUrl || newCandidate.s3Url || null
      ]).catch(err => console.warn("PostgreSQL resume insert warning:", err.message));
    } catch (e) {}

    return newCandidate;
  }

  update(id, updates) {
    const list = readData(COLLECTION, []);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const merged = this.ensureFields({
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    });

    list[idx] = merged;
    writeData(COLLECTION, list);

    // Update in PostgreSQL public.resumes
    try {
      const pool = getPool();
      pool.query(`
        UPDATE public.resumes SET
          name = COALESCE($2, name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          location = COALESCE($5, location),
          role = COALESCE($6, role),
          status = COALESCE($7, status),
          score = COALESCE($8, score),
          ats_score = COALESCE($9, ats_score),
          match_score = COALESCE($10, match_score),
          target_job_id = COALESCE($11, target_job_id),
          target_job_title = COALESCE($12, target_job_title),
          skills = COALESCE($13::jsonb, skills),
          all_skills = COALESCE($14::jsonb, all_skills),
          breakdown = COALESCE($15::jsonb, breakdown),
          ai_analysis = COALESCE($16::jsonb, ai_analysis),
          resume_data = COALESCE($17::jsonb, resume_data),
          key_points = COALESCE($18::jsonb, key_points),
          updated_at = NOW()
        WHERE id = $1
      `, [
        id,
        updates.name || null,
        updates.email || null,
        updates.phone || null,
        updates.location || null,
        updates.role || null,
        updates.status || null,
        updates.atsScore !== undefined ? updates.atsScore : (updates.score !== undefined ? updates.score : null),
        updates.atsScore !== undefined ? updates.atsScore : null,
        updates.matchScore !== undefined ? updates.matchScore : null,
        updates.jobId || updates.targetJobId || null,
        updates.targetJobTitle || null,
        updates.skills ? JSON.stringify(updates.skills) : null,
        updates.allSkills ? JSON.stringify(updates.allSkills) : null,
        updates.breakdown ? JSON.stringify(updates.breakdown) : null,
        updates.aiAnalysis ? JSON.stringify(updates.aiAnalysis) : null,
        updates.resumeData ? JSON.stringify(updates.resumeData) : null,
        updates.keyPoints ? JSON.stringify(updates.keyPoints) : null
      ])
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
