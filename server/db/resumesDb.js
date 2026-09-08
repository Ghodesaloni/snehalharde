const { readData, writeData } = require("./dbEngine");

const COLLECTION = "resumes";

const seedResumes = [
  {
    id: "c1",
    name: "Snehal Harde",
    email: "snehal@email.com",
    phone: "+91 98765 43210",
    location: "Nagpur, Maharashtra, India",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    role: "Python Developer",
    experience: "2 Years",
    expYears: 2,
    skills: ["Python", "Flask", "SQL"],
    extraSkillsCount: 3,
    allSkills: ["Python", "Flask", "SQL", "REST API", "HTML", "CSS"],
    atsScore: 87,
    matchScore: 92,
    skillsMatchPct: 95,
    status: "Shortlisted",
    uploadedDate: "20 May 2025",
    jobId: "job-2",
    createdAt: new Date("2025-05-20").toISOString()
  },
  {
    id: "c2",
    name: "Rohan Verma",
    email: "rohanv@email.com",
    phone: "+91 98123 45678",
    location: "Bangalore, Karnataka, India",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    role: "Full Stack Developer",
    experience: "4 Years",
    expYears: 4,
    skills: ["React", "Node.js", "MongoDB"],
    extraSkillsCount: 2,
    allSkills: ["React", "Node.js", "MongoDB", "TypeScript", "Tailwind"],
    atsScore: 91,
    matchScore: 88,
    skillsMatchPct: 90,
    status: "Shortlisted",
    uploadedDate: "19 May 2025",
    jobId: "job-1",
    createdAt: new Date("2025-05-19").toISOString()
  },
  {
    id: "c3",
    name: "Aisha Khan",
    email: "aisha.k@email.com",
    phone: "+91 97234 56789",
    location: "Mumbai, Maharashtra, India",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
    role: "UI/UX Product Designer",
    experience: "3 Years",
    expYears: 3,
    skills: ["Figma", "Design Systems", "Prototyping"],
    extraSkillsCount: 2,
    allSkills: ["Figma", "Design Systems", "Prototyping", "User Research", "Wireframing"],
    atsScore: 84,
    matchScore: 85,
    skillsMatchPct: 88,
    status: "Under Review",
    uploadedDate: "18 May 2025",
    jobId: "job-3",
    createdAt: new Date("2025-05-18").toISOString()
  },
  {
    id: "c4",
    name: "Vikram Malhotra",
    email: "vikram.m@email.com",
    phone: "+91 96345 67890",
    location: "Hyderabad, Telangana, India",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    role: "DevOps Engineer",
    experience: "5 Years",
    expYears: 5,
    skills: ["Kubernetes", "AWS", "Docker"],
    extraSkillsCount: 3,
    allSkills: ["Kubernetes", "AWS", "Docker", "Terraform", "CI/CD", "Linux"],
    atsScore: 94,
    matchScore: 90,
    skillsMatchPct: 92,
    status: "Shortlisted",
    uploadedDate: "17 May 2025",
    jobId: "job-4",
    createdAt: new Date("2025-05-17").toISOString()
  },
  {
    id: "c5",
    name: "Pooja Hegde",
    email: "pooja.h@email.com",
    phone: "+91 95456 78901",
    location: "Pune, Maharashtra, India",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    role: "HR Talent Acquisition Specialist",
    experience: "2 Years",
    expYears: 2,
    skills: ["Sourcing", "Screening", "ATS"],
    extraSkillsCount: 1,
    allSkills: ["Sourcing", "Screening", "ATS", "Talent Engagement"],
    atsScore: 78,
    matchScore: 80,
    skillsMatchPct: 82,
    status: "New",
    uploadedDate: "16 May 2025",
    jobId: "job-5",
    createdAt: new Date("2025-05-16").toISOString()
  },
  {
    id: "c6",
    name: "Ananya Iyer",
    email: "ananya.i@email.com",
    phone: "+91 94567 89012",
    location: "Chennai, Tamil Nadu, India",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    role: "Senior Software Engineer",
    experience: "6 Years",
    expYears: 6,
    skills: ["Java", "Spring Boot", "Microservices"],
    extraSkillsCount: 4,
    allSkills: ["Java", "Spring Boot", "Microservices", "Kafka", "PostgreSQL", "Docker"],
    atsScore: 92,
    matchScore: 94,
    skillsMatchPct: 96,
    status: "Shortlisted",
    uploadedDate: "15 May 2025",
    jobId: "job-1",
    createdAt: new Date("2025-05-15").toISOString()
  }
];

class ResumesDatabase {
  ensureFields(candidate) {
    if (!candidate) return candidate;
    const skills = candidate.allSkills || candidate.skills || ["JavaScript", "Python"];
    const status = candidate.status === "Under Review" ? "Review" : candidate.status || "Review";
    const expYears = candidate.expYears || 2;
    return {
      ...candidate,
      status,
      currentRole: candidate.currentRole || `${candidate.role} at Tech Corp`,
      education: candidate.education || "B.Tech in Computer Science",
      summary: candidate.summary || `${candidate.name} has demonstrated strong background in ${skills.slice(0, 3).join(", ")} with ${candidate.experience || `${expYears} years`} experience.`,
      matchedSkills: candidate.matchedSkills || skills.slice(0, 3),
      missingSkills: candidate.missingSkills || [],
      keyPoints: candidate.keyPoints || {
        strengths: [
          `Proficient in core technical competencies: ${skills.slice(0, 3).join(", ")}.`,
          `Over ${candidate.experience || `${expYears} years`} of practical domain experience.`,
          "Consistent record of clean code delivery and agile collaboration."
        ],
        missingSkills: candidate.missingSkills && candidate.missingSkills.length > 0 
          ? candidate.missingSkills 
          : ["Advanced cloud deployment automation could be expanded."],
        experienceMatch: `Meets experience criteria with ${candidate.experience || `${expYears} years`}.`,
        verdict: status === "Shortlisted" 
          ? "High ATS compatibility. Shortlisted for screening round." 
          : status === "Review" 
          ? "Strong candidate profile under evaluation for potential match." 
          : "Candidate does not meet baseline ATS threshold."
      }
    };
  }

  getAll(filters = {}) {
    let list = readData(COLLECTION, seedResumes);
    list = list.map(c => this.ensureFields(c));
    if (filters.status && filters.status !== "All") {
      list = list.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.role && filters.role !== "All") {
      list = list.filter(r => r.role.toLowerCase() === filters.role.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        (r.allSkills && r.allSkills.some(s => s.toLowerCase().includes(q)))
      );
    }
    return list;
  }

  getById(id) {
    const list = readData(COLLECTION, seedResumes);
    const item = list.find(r => r.id === id);
    return item ? this.ensureFields(item) : null;
  }

  create(resumeData) {
    const list = readData(COLLECTION, seedResumes);
    const id = `c-${Date.now()}`;
    const skills = Array.isArray(resumeData.skills) ? resumeData.skills : (resumeData.skills ? resumeData.skills.split(",").map(s => s.trim()) : ["JavaScript", "React"]);
    const allSkills = resumeData.allSkills || skills;
    const newCandidate = {
      id,
      name: resumeData.name || "Candidate Name",
      email: resumeData.email || `${id}@example.com`,
      phone: resumeData.phone || "+91 90000 00000",
      location: resumeData.location || "Bangalore, India",
      avatar: resumeData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      role: resumeData.role || "Software Engineer",
      experience: resumeData.experience || "2 Years",
      expYears: resumeData.expYears || 2,
      skills: skills.slice(0, 3),
      extraSkillsCount: Math.max(0, allSkills.length - 3),
      allSkills,
      atsScore: resumeData.atsScore || Math.floor(Math.random() * 20 + 75),
      matchScore: resumeData.matchScore || Math.floor(Math.random() * 20 + 75),
      skillsMatchPct: resumeData.skillsMatchPct || Math.floor(Math.random() * 15 + 80),
      status: resumeData.status || "New",
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      jobId: resumeData.jobId || "job-1",
      resumeFileName: resumeData.resumeFileName || "resume.pdf",
      createdAt: new Date().toISOString()
    };

    list.unshift(newCandidate);
    writeData(COLLECTION, list);
    return newCandidate;
  }

  update(id, updates) {
    const list = readData(COLLECTION, seedResumes);
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
    const list = readData(COLLECTION, seedResumes);
    const filtered = list.filter(r => r.id !== id);
    if (filtered.length === list.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }
}

module.exports = new ResumesDatabase();
