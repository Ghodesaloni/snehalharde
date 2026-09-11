const { readData, writeData } = require("./dbEngine");

const COLLECTION = "interviews";

class InterviewsDatabase {
  getAll(filters = {}) {
    let list = readData(COLLECTION, []);
    if (filters.userEmail) {
      const emailLower = filters.userEmail.toLowerCase().trim();
      list = list.filter(iv =>
        (iv.createdBy && iv.createdBy.toLowerCase() === emailLower) ||
        (iv.userEmail && iv.userEmail.toLowerCase() === emailLower)
      );
    }
    if (filters.status && filters.status !== "All") {
      list = list.filter(iv => iv.status.toLowerCase() === filters.status.toLowerCase());
    }
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

  getById(id) {
    const list = readData(COLLECTION, []);
    return list.find(iv => iv.id === id) || null;
  }

  getByLinkCode(linkCode) {
    if (!linkCode) return null;
    const list = readData(COLLECTION, []);
    const cleaned = linkCode.toLowerCase().trim();
    return list.find(iv => (iv.linkCode && iv.linkCode.toLowerCase() === cleaned) || iv.id === linkCode) || null;
  }

  create(data) {
    const list = readData(COLLECTION, []);
    const id = `iv-${Date.now()}`;
    const randomCode = Math.random().toString(36).substring(2, 8);
    const newInterview = {
      id,
      candidateId: data.candidateId || `cand-${Date.now()}`,
      name: data.name || "Candidate",
      email: data.email || "",
      avatar: data.avatar || "",
      role: data.role || "",
      company: data.company || "",
      date: data.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
      dayOfWeek: data.dayOfWeek || "",
      time: data.time || "",
      timeZone: data.timeZone || "IST",
      duration: data.duration || "45 Minutes",
      durationMins: data.durationMins || 45,
      linkCode: data.linkCode || randomCode,
      status: data.status || "Active",
      expiry: "04:59 Remaining",
      expiryTime: data.expiryTime || "",
      isExpired: false,
      score: data.score !== undefined ? data.score : null,
      createdBy: data.createdBy || data.userEmail || "",
      userEmail: data.userEmail || data.createdBy || "",
      createdAt: new Date().toISOString()
    };

    list.unshift(newInterview);
    writeData(COLLECTION, list);
    return newInterview;
  }

  update(id, updates) {
    const list = readData(COLLECTION, []);
    const idx = list.findIndex(iv => iv.id === id || iv.linkCode === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    writeData(COLLECTION, list);
    return list[idx];
  }

  delete(id) {
    const list = readData(COLLECTION, []);
    const filtered = list.filter(iv => iv.id !== id && iv.linkCode !== id);
    if (filtered.length === list.length) return false;
    writeData(COLLECTION, filtered);
    return true;
  }
}

module.exports = new InterviewsDatabase();
