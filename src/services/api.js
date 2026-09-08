import axios from "axios";

// In browser, relative URL /api goes directly to port 3000 where webpack-dev-server or express server runs
// Ignore stale external domain override from foreign environment variables
const getApiBase = () => {
  if (typeof window !== "undefined") {
    // In browser, always use relative path on current host
    return "";
  }
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl && !envUrl.includes("preview.emergentagent.com")) {
    return envUrl;
  }
  return "";
};

const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  headers: {
    "Content-Type": "application/json"
  }
});

export const jobsApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/jobs", { params });
    return res.data.data;
  },
  getById: async (id) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data.data;
  },
  create: async (jobData) => {
    const res = await api.post("/jobs", jobData);
    return res.data.data;
  },
  update: async (id, jobData) => {
    const res = await api.put(`/jobs/${id}`, jobData);
    return res.data.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  }
};

export const resumesApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/resumes", { params });
    return res.data.data;
  },
  getById: async (id) => {
    const res = await api.get(`/resumes/${id}`);
    return res.data.data;
  },
  create: async (resumeData) => {
    const res = await api.post("/resumes", resumeData);
    return res.data.data;
  },
  update: async (id, resumeData) => {
    const res = await api.put(`/resumes/${id}`, resumeData);
    return res.data.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/resumes/${id}/status`, { status });
    return res.data.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/resumes/${id}`);
    return res.data;
  },
  analyzeCandidate: async (id, { jobId, customJd } = {}) => {
    const res = await api.post(`/resumes/${id}/analyze-jd`, { jobId, customJd });
    return res.data;
  },
  analyzeBatch: async ({ jobId, customJd, candidateIds } = {}) => {
    const res = await api.post("/resumes/analyze-batch-jd", { jobId, customJd, candidateIds });
    return res.data;
  },
  uploadAndScreen: async (formData) => {
    const res = await api.post("/resumes/upload-and-screen", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  }
};

export const interviewsApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/interviews", { params });
    return res.data.data;
  },
  getById: async (id) => {
    const res = await api.get(`/interviews/${id}`);
    return res.data.data;
  },
  getByLinkCode: async (linkCode) => {
    const res = await api.get(`/interviews/code/${linkCode}`);
    return res.data.data;
  },
  create: async (interviewData) => {
    const res = await api.post("/interviews", interviewData);
    return res.data.data;
  },
  update: async (id, interviewData) => {
    const res = await api.put(`/interviews/${id}`, interviewData);
    return res.data.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/interviews/${id}`);
    return res.data;
  }
};

export const candidatesApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/candidates", { params });
    return res.data.data;
  },
  getById: async (id) => {
    const res = await api.get(`/candidates/${id}`);
    return res.data.data;
  },
  create: async (data) => {
    const res = await api.post("/candidates", data);
    return res.data.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/candidates/${id}`, data);
    return res.data.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/candidates/${id}`);
    return res.data;
  }
};

export const emailApi = {
  getTemplates: async () => {
    const res = await api.get("/emails/templates");
    return res.data.data;
  },
  createTemplate: async (data) => {
    const res = await api.post("/emails/templates", data);
    return res.data.data;
  },
  getSent: async () => {
    const res = await api.get("/emails/sent");
    return res.data.data;
  },
  send: async (data) => {
    const res = await api.post("/emails/send", data);
    return res.data.data;
  }
};

export const dashboardApi = {
  getStats: async () => {
    const res = await api.get("/dashboard/stats");
    return res.data.data;
  }
};

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get("/settings");
    return res.data.data;
  },
  updateSettings: async (data) => {
    const res = await api.put("/settings", data);
    return res.data.data;
  },
  getProfile: async () => {
    const res = await api.get("/settings/profile");
    return res.data.data;
  },
  updateProfile: async (data) => {
    const res = await api.put("/settings/profile", data);
    return res.data.data;
  }
};

export default api;
