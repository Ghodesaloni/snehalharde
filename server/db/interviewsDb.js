const { readData, writeData } = require("./dbEngine");

const COLLECTION = "interviews";

const seedInterviews = [
  {
    id: "iv-1",
    candidateId: "c1",
    name: "Snehal Harde",
    email: "snehal@email.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    role: "Frontend Developer",
    company: "AvaHire Technologies Pvt. Ltd.",
    date: "02 September 2026",
    dayOfWeek: "Tuesday",
    time: "11:00 AM",
    timeZone: "IST",
    duration: "45 Minutes",
    durationMins: 45,
    linkCode: "akc123",
    status: "Active",
    expiry: "04:56 Remaining",
    expiryTime: "02 September 2026, 11:56 AM",
    isExpired: false,
    score: 88,
    createdAt: new Date("2026-09-01").toISOString()
  },
  {
    id: "iv-2",
    candidateId: "c2",
    name: "Rohan Verma",
    email: "rohanv@email.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    role: "Backend Developer",
    company: "AvaHire Technologies Pvt. Ltd.",
    date: "03 September 2026",
    dayOfWeek: "Wednesday",
    time: "02:00 PM",
    timeZone: "IST",
    duration: "45 Minutes",
    durationMins: 45,
    linkCode: "def456",
    status: "Active",
    expiry: "04:55 Remaining",
    expiryTime: "03 September 2026, 02:55 PM",
    isExpired: false,
    score: null,
    createdAt: new Date("2026-09-02").toISOString()
  },
  {
    id: "iv-3",
    candidateId: "c3",
    name: "Aisha Khan",
    email: "aisha.k@email.com",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
    role: "Full Stack Developer",
    company: "AvaHire Technologies Pvt. Ltd.",
    date: "04 September 2026",
    dayOfWeek: "Thursday",
    time: "10:00 AM",
    timeZone: "IST",
    duration: "60 Minutes",
    durationMins: 60,
    linkCode: "ghi789",
    status: "Active",
    expiry: "04:50 Remaining",
    expiryTime: "04 September 2026, 11:00 AM",
    isExpired: false,
    score: null,
    createdAt: new Date("2026-09-02").toISOString()
  },
  {
    id: "iv-4",
    candidateId: "c4",
    name: "Vikram Malhotra",
    email: "vikram.m@email.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    role: "DevOps Engineer",
    company: "AvaHire Technologies Pvt. Ltd.",
    date: "05 September 2026",
    dayOfWeek: "Friday",
    time: "04:30 PM",
    timeZone: "IST",
    duration: "45 Minutes",
    durationMins: 45,
    linkCode: "jkl012",
    status: "Completed",
    expiry: "Expired",
    expiryTime: "05 September 2026, 05:15 PM",
    isExpired: false,
    score: 92,
    createdAt: new Date("2026-09-01").toISOString()
  }
];

class InterviewsDatabase {
  getAll(filters = {}) {
    let list = readData(COLLECTION, seedInterviews);
    if (filters.status && filters.status !== "All") {
      list = list.filter(iv => iv.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(iv =>
        iv.name.toLowerCase().includes(q) ||
        iv.role.toLowerCase().includes(q) ||
        iv.email.toLowerCase().includes(q) ||
        iv.linkCode.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getById(id) {
    const list = readData(COLLECTION, seedInterviews);
    return list.find(iv => iv.id === id) || null;
  }

  getByLinkCode(linkCode) {
    if (!linkCode) return null;
    const list = readData(COLLECTION, seedInterviews);
    const cleaned = linkCode.toLowerCase().trim();
    return list.find(iv => (iv.linkCode && iv.linkCode.toLowerCase() === cleaned) || iv.id === linkCode) || null;
  }

  create(data) {
    const list = readData(COLLECTION, seedInterviews);
    const id = `iv-${Date.now()}`;
    const randomCode = Math.random().toString(36).substring(2, 8);
    const newInterview = {
      id,
      candidateId: data.candidateId || `cand-${Date.now()}`,
      name: data.name || "Candidate Name",
      email: data.email || "",
      avatar: data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      role: data.role || "Software Engineer",
      company: data.company || "AvaHire Technologies Pvt. Ltd.",
      date: data.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
      dayOfWeek: data.dayOfWeek || "Monday",
      time: data.time || "11:00 AM",
      timeZone: data.timeZone || "IST",
      duration: data.duration || "45 Minutes",
      durationMins: data.durationMins || 45,
      linkCode: data.linkCode || randomCode,
      status: data.status || "Active",
      expiry: "04:59 Remaining",
      expiryTime: data.expiryTime || "4 hours from schedule",
      isExpired: false,
      score: data.score || null,
      createdAt: new Date().toISOString()
    };

    list.unshift(newInterview);
    writeData(COLLECTION, list);
    return newInterview;
  }

  update(id, updates) {
    const list = readData(COLLECTION, seedInterviews);
    const idx = list.findIndex(iv => iv.id === id || iv.linkCode === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    writeData(COLLECTION, list);
    return list[idx];
  }

  delete(id) {
    const list = readData(COLLECTION, seedInterviews);
    const filtered = list.filter(iv => iv.id !== id && iv.linkCode !== id);
    if (filtered.length === list.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }
}

module.exports = new InterviewsDatabase();
