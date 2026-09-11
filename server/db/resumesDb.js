const { readData, writeData } = require("./dbEngine");

const COLLECTION = "resumes";

class ResumesDatabase {
  classifyDomain(candidate) {
    if (candidate.field && ["Data Science", "Mechanical", "Software Engineer", "Finance", "Analyst"].includes(candidate.field)) {
      return candidate.field;
    }
    if (candidate.domain && ["Data Science", "Mechanical", "Software Engineer", "Finance", "Analyst"].includes(candidate.domain)) {
      return candidate.domain;
    }

    const text = `${candidate.name || ""} ${candidate.role || ""} ${candidate.currentRole || ""} ${(candidate.allSkills || candidate.skills || []).join(" ")} ${candidate.summary || ""} ${candidate.resumeFileName || ""}`.toLowerCase();

    // 1. Data Science
    if (/data scien|machine learning|\bml\b|deep learning|\bnlp\b|computer vision|tensorflow|pytorch|keras|scikit|pandas|numpy|neural network|predictive model|bigquery|generative ai|\bllm\b|\bds\b|eda\b/i.test(text)) {
      return "Data Science";
    }

    // 2. Mechanical
    if (/mechanical|autocad|solidworks|catia|thermodynamics|fluid mechanics|\bfea\b|ansys|gd&t|\bcnc\b|manufacturing|hvac|mechatronics|thermal|creo|machine design|aerospace/i.test(text)) {
      return "Mechanical";
    }

    // 3. Finance
    if (/finance|financial|accounting|accountant|auditing|\baudit\b|taxation|\btax\b|wealth management|corporate finance|equity research|valuation|\bcpa\b|\bcfa\b|quickbooks|tally|sap fico|balance sheet|p&l|financial modeling|investment banking/i.test(text)) {
      return "Finance";
    }

    // 4. Analyst
    if (/data analyst|business analyst|bi analyst|operations analyst|product analyst|market research|tableau|power\s?bi|bi tools|business intelligence|reporting analyst|data analytics|dashboards/i.test(text)) {
      return "Analyst";
    }

    // 5. Software Engineer
    if (/software|developer|frontend|backend|full\s?stack|web dev|react|node|javascript|typescript|angular|vue|next|express|java\b|spring|c\+\+|c#|\.net|golang|\bgo\b|rust|python|django|flask|fastapi|devops|kubernetes|docker|cloud/i.test(text)) {
      return "Software Engineer";
    }

    return "Software Engineer";
  }

  ensureFields(candidate) {
    if (!candidate) return candidate;
    const skills = candidate.allSkills || candidate.skills || [];
    const status = candidate.status === "Under Review" ? "Review" : candidate.status || "Review";
    const expYears = candidate.expYears || 0;
    const field = candidate.field || candidate.domain || this.classifyDomain(candidate);

    return {
      ...candidate,
      field,
      domain: field,
      status,
      jobId: candidate.jobId || candidate.targetJobId || null,
      targetJobTitle: candidate.targetJobTitle || null,
      currentRole: candidate.currentRole || candidate.role || "",
      education: candidate.education || "",
      summary: candidate.summary || (candidate.name ? `${candidate.name} profile.` : ""),
      matchedSkills: candidate.matchedSkills || skills.slice(0, 3),
      missingSkills: candidate.missingSkills || [],
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
    if (filters.domain && filters.domain !== "All" && filters.domain !== "All Fields") {
      list = list.filter(r => (r.domain || r.field || "").toLowerCase() === filters.domain.toLowerCase());
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
        (r.allSkills && r.allSkills.some(s => s.toLowerCase().includes(q)))
      );
    }
    return list;
  }

  getById(id) {
    const list = readData(COLLECTION, []);
    const item = list.find(r => r.id === id);
    return item ? this.ensureFields(item) : null;
  }

  create(resumeData) {
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
      experience: resumeData.experience || "0 Years",
      expYears: resumeData.expYears || 0,
      skills: skills.slice(0, 3),
      extraSkillsCount: Math.max(0, allSkills.length - 3),
      allSkills,
      atsScore: resumeData.atsScore !== undefined ? resumeData.atsScore : 0,
      matchScore: resumeData.matchScore !== undefined ? resumeData.matchScore : 0,
      skillsMatchPct: resumeData.skillsMatchPct !== undefined ? resumeData.skillsMatchPct : 0,
      status: resumeData.status || "New",
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      jobId: resumeData.jobId || resumeData.targetJobId || null,
      targetJobTitle: resumeData.targetJobTitle || null,
      resumeFileName: resumeData.resumeFileName || "",
      createdAt: new Date().toISOString()
    };

    list.unshift(newCandidate);
    writeData(COLLECTION, list);
    return newCandidate;
  }

  update(id, updates) {
    const list = readData(COLLECTION, []);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    writeData(COLLECTION, list);
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
    return true;
  }
}

module.exports = new ResumesDatabase();
