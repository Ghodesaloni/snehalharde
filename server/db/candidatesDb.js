const { readData, writeData } = require("./dbEngine");

const COLLECTION = "candidates";

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
  getAll(filters = {}) {
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

  getById(id) {
    const list = readData(COLLECTION, seedCandidates);
    return list.find(c => c.id === id) || null;
  }

  create(data) {
    const list = readData(COLLECTION, seedCandidates);
    const id = `cand-${Date.now()}`;
    const newCand = {
      id,
      name: data.name || "New Candidate",
      email: data.email || `${id}@example.com`,
      phone: data.phone || "+91 98000 00000",
      role: data.role || "Software Engineer",
      avatar: data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      interviewDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
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
      createdAt: new Date().toISOString()
    };
    list.unshift(newCand);
    writeData(COLLECTION, list);
    return newCand;
  }

  update(id, updates) {
    const list = readData(COLLECTION, seedCandidates);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    writeData(COLLECTION, list);
    return list[idx];
  }

  delete(id) {
    const list = readData(COLLECTION, seedCandidates);
    const filtered = list.filter(c => c.id !== id);
    if (filtered.length === list.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }
}

module.exports = new CandidatesDatabase();
