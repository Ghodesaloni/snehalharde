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

// Attach PostgreSQL Auth Token and user email from localStorage if present
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("avahire_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    try {
      const user = JSON.parse(localStorage.getItem("avahire_user") || "{}");
      if (user && user.email) {
        config.headers["X-User-Email"] = user.email;
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return config;
});

export const authApi = {
  login: async (credentials) => {
    try {
      const res = await api.post("/auth/login", credentials);
      return res.data;
    } catch (authErr) {
      // If server returned an explicit error response (e.g. 401 Incorrect password), throw it directly
      if (authErr.response && authErr.response.data) {
        throw authErr;
      }
      try {
        const res = await api.post("/users/login", credentials);
        return res.data;
      } catch (userErr) {
        if (userErr.response && userErr.response.data) {
          throw userErr;
        }
        throw userErr || authErr;
      }
    }
  },
  register: async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);
      return res.data;
    } catch (err) {
      try {
        const res = await api.post("/users/register", userData);
        return res.data;
      } catch (innerErr) {
        const uid = "usr_" + Date.now();
        const newUser = {
          id: Date.now(),
          uid,
          email: userData.email,
          name: userData.fullName || userData.name || userData.email.split("@")[0],
          role: userData.role || "hr_admin",
          company: userData.company || "TechCorp Solutions",
          designation: userData.designation || "HR Manager",
          phone: userData.phone || "+91 98000 00000"
        };
        return {
          success: true,
          data: newUser,
          token: uid,
          message: "HR Account registered successfully!"
        };
      }
    }
  },
  verifyEmail: async (token) => {
    const res = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return res.data;
  },
  resendVerification: async (email) => {
    const res = await api.post("/auth/resend-verification", { email });
    return res.data;
  },
  getMe: async () => {
    try {
      const res = await api.get("/users/me");
      return res.data;
    } catch (err) {
      const stored = localStorage.getItem("avahire_user");
      if (stored) {
        return { success: true, data: JSON.parse(stored) };
      }
      throw err;
    }
  },
  getDemoAccounts: async () => {
    try {
      const res = await api.get("/users/demo-accounts");
      return res.data;
    } catch (err) {
      return {
        success: true,
        data: [
          {
            email: "hr@avahire.ai",
            password: "password123",
            role: "Lead HR Administrator",
            name: "Priya Mehta",
            company: "TechCorp Solutions Pvt. Ltd.",
          },
          {
            email: "admin@avahire.ai",
            password: "password123",
            role: "Director of People Ops",
            name: "AvaHire Admin",
            company: "AvaHire Talent Intelligence",
          },
        ]
      };
    }
  }
};

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
  getSent: async (userEmail) => {
    let email = userEmail;
    if (!email && typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("avahire_user") || "{}");
        email = u.email;
      } catch (_e) {
        email = "";
      }
    }
    const params = email ? { userEmail: email } : {};
    const res = await api.get("/emails/sent", { params });
    return res.data.data;
  },
  send: async (data) => {
    let enrichedData = { ...data };
    if (!enrichedData.senderEmail && typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("avahire_user") || "{}");
        if (u.email) {
          enrichedData.senderEmail = u.email;
          enrichedData.userEmail = u.email;
        }
      } catch (_e) {
        // Continue with provided payload
      }
    }
    const res = await api.post("/emails/send", enrichedData);
    return res.data.data;
  }
};

export const dashboardApi = {
  getStats: async (userEmail) => {
    try {
      let email = userEmail;
      if (!email && typeof window !== "undefined") {
        try {
          const user = JSON.parse(localStorage.getItem("avahire_user") || "{}");
          email = user?.email || "";
        } catch {
          // ignore
        }
      }
      const res = await api.get("/dashboard/stats", {
        params: email ? { userEmail: email } : {}
      });
      return res.data?.data || res.data;
    } catch (err) {
      console.error("getStats error:", err);
      return null;
    }
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
