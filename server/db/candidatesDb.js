const { readData, writeData } = require("./dbEngine");

const COLLECTION = "candidates";

class CandidatesDatabase {
  getAll(filters = {}) {
    let list = readData(COLLECTION, []);
    if (filters.userEmail) {
      const emailLower = filters.userEmail.toLowerCase().trim();
      const isDemo = emailLower === "hr@avahire.ai" || emailLower === "admin@avahire.ai";
      if (!isDemo) {
        list = list.filter(c =>
          (c.createdBy && c.createdBy.toLowerCase() === emailLower) ||
          (c.userEmail && c.userEmail.toLowerCase() === emailLower)
        );
      }
    }
    if (filters.status && filters.status !== "All") {
      list = list.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.role && filters.role !== "All") {
      list = list.filter(c => c.role.toLowerCase() === filters.role.toLowerCase());
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

  getById(id) {
    const list = readData(COLLECTION, []);
    return list.find(c => c.id === id) || null;
  }

  create(data) {
    const list = readData(COLLECTION, []);
    const id = `cand-${Date.now()}`;
    const newCand = {
      id,
      name: data.name || "Candidate",
      email: data.email || "",
      phone: data.phone || "",
      role: data.role || "",
      avatar: data.avatar || "",
      interviewDate: data.interviewDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: data.timestamp || Date.now(),
      duration: data.duration || "0m 00s",
      mode: data.mode || "AI Interview",
      score: data.score !== undefined ? data.score : 0,
      status: data.status || "Under Review",
      notes: data.notes || "",
      summaryPoints: data.summaryPoints || [],
      recommendation: data.recommendation || "",
      transcript: data.transcript || [],
      createdBy: data.createdBy || data.userEmail || "",
      userEmail: data.userEmail || data.createdBy || "",
      createdAt: new Date().toISOString()
    };
    list.unshift(newCand);
    writeData(COLLECTION, list);
    return newCand;
  }

  update(id, updates) {
    const list = readData(COLLECTION, []);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    writeData(COLLECTION, list);
    return list[idx];
  }

  delete(id) {
    const list = readData(COLLECTION, []);
    const filtered = list.filter(c => c.id !== id);
    if (filtered.length === list.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }
}

module.exports = new CandidatesDatabase();
