import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE,
});

// ✅ Add Interceptor to automatically add Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// SIGNUP
export const signup = async (data) => {
  const res = await api.post("/api/auth/signup", data);
  return res.data;
};

// LOGIN
export const login = async (data) => {
  const res = await api.post("/api/auth/login", data);
  return res.data;
};

// ANALYZE
// We don't need to pass token explicitly anymore
export const analyzeImage = async (formData) => {
  const res = await api.post("/analyze", formData);
  return res.data;
};

// HISTORY
export const getHistory = async () => {
  const res = await api.get("/history");
  return res.data;
};

// CHAT
export const sendChat = async (message) => {
  const res = await api.post("/chat", { message });
  return res.data;
};

// SETTINGS
export const getSettings = async () => {
  const res = await api.get("/api/settings/");
  return res.data;
};

export const updateSettings = async (settings) => {
  const res = await api.post("/api/settings/", settings);
  return res.data;
};

export const resetSettings = async () => {
  const res = await api.delete("/api/settings/");
  return res.data;
};

// SECURITY
export const changePassword = async (passwordData) => {
  const res = await api.post("/api/auth/change-password", passwordData);
  return res.data;
};

export const deleteAccount = async () => {
  const res = await api.delete("/api/auth/delete-account");
  return res.data;
};

// 2FA
export const enable2FA = async () => {
  const res = await api.post("/api/auth/2fa/enable");
  return res.data;
};

export const verify2FA = async (code) => {
  const res = await api.post("/api/auth/2fa/verify", { code });
  return res.data;
};

export const disable2FA = async (code) => {
  const res = await api.post("/api/auth/2fa/disable", { code });
  return res.data;
};

export const get2FAStatus = async () => {
  const res = await api.get("/api/auth/2fa/status");
  return res.data;
};

// --- ADMIN ENDPOINTS ---
export const getAdminStats = async () => {
  const res = await api.get("/api/admin/stats");
  return res.data;
};

export const getAllUsers = async () => {
  const res = await api.get("/api/admin/users");
  return res.data;
};

export const updateUserRole = async (email, role) => {
  const res = await api.post(`/api/admin/update-role?target_email=${encodeURIComponent(email)}&new_role=${role}`);
  return res.data;
};

export const updateUserStatus = async (email, status) => {
  const res = await api.post(`/api/admin/update-status?target_email=${encodeURIComponent(email)}&status=${status}`);
  return res.data;
};

export const getAuditLogs = async () => {
  const res = await api.get("/api/admin/audit-logs");
  return res.data;
};

export const broadcastAnnouncement = async (message) => {
  const res = await api.post(`/api/admin/broadcast?message=${encodeURIComponent(message)}`);
  return res.data;
};

// --- EXPERT ENDPOINTS ---
export const getReviewQueue = async () => {
  const res = await api.get("/api/expert/review-queue");
  return res.data;
};

export const submitExpertReview = async (reviewData) => {
  const res = await api.post("/api/expert/submit-review", reviewData);
  return res.data;
};

export default api;
