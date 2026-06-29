import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("http://localhost:8000")) {
    return url.replace("http://localhost:8000", API_BASE);
  }
  if (url.startsWith("/")) {
    if (API_BASE.startsWith("/") && url.startsWith(API_BASE)) {
      return url;
    }
    return `${API_BASE}${url}`;
  }
  return url;
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let accessToken = null;
export const setApiToken = (token) => {
  accessToken = token;
};

// ✅ Add Interceptor to automatically add Token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ✅ Response Interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.access_token;
        setApiToken(newToken);
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
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

// ANALYZE — job queue pattern
// POST /analyze returns HTTP 202 + {job_id}.  We then poll
// GET /analyze/status/{job_id} every 2 seconds until the job is "done" or "error".
// The returned promise resolves with the final result object (same shape as before),
// so callers (AnalyzePage.js, LiveAnalyzePage.js) need no logic changes.
export const pollAnalysisStatus = async (jobId, { intervalMs = 2000, timeoutMs = 120000 } = {}) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await api.get(`/analyze/status/${jobId}`);
    const { status, result, error } = res.data;
    if (status === "done")  return result;
    if (status === "error") throw new Error(error || "Analysis failed on the server.");
    // pending or running — wait then poll again
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error("Analysis timed out. Please try again.");
};

export const analyzeImage = async (formData) => {
  // Submit the image — backend returns 202 + {job_id} immediately
  const submitRes = await api.post("/analyze", formData);
  if (submitRes.status !== 202 || !submitRes.data?.job_id) {
    // Fallback: old synchronous response (should not happen in production)
    return submitRes.data;
  }
  // Poll until the background job finishes
  return await pollAnalysisStatus(submitRes.data.job_id);
};


export const getHistory = async () => {
  const res = await api.get("/history");
  return Array.isArray(res.data) ? res.data : (res.data.history ?? []);
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

// --- SUPPORT (ADMIN) ENDPOINTS ---
export const getSupportTickets = async (status=null) => {
  const params = status ? { status } : {};
  const res = await api.get("/api/support/admin/all", { params });
  return res.data;
};

export const updateTicketStatus = async (ticketId, status) => {
  const res = await api.patch(`/api/support/admin/${ticketId}/status`, null, { params: { status } });
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

// --- REPORT ENDPOINTS ---
export const downloadReport = async (analysisId) => {
  const response = await api.get(`/api/report/download/${analysisId}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadLatestReport = async () => {
  const response = await api.get('/api/report/download/latest', {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadDemoReport = async (analysisData) => {
  const response = await api.post('/api/report/demo', analysisData, {
    responseType: 'blob'
  });
  return response.data;
};

// --- ONBOARDING ENDPOINTS ---
export const saveOnboarding = async (profile) => {
  const res = await api.post("/api/onboarding/save", profile);
  return res.data;
};

export const getOnboardingProfile = async () => {
  const res = await api.get("/api/onboarding/profile");
  return res.data;
};

export const getOnboardingStatus = async () => {
  const res = await api.get("/api/onboarding/status");
  return res.data;
};

// --- AFFILIATE ENDPOINTS ---
export const getProductRecommendations = async (params) => {
  const res = await api.get("/api/affiliate/recommendations", { params });
  return res.data;
};

export const getFeaturedProducts = async () => {
  const res = await api.get("/api/affiliate/featured");
  return res.data;
};

// --- NOTIFICATION ENDPOINTS ---
export const getNotificationSettings = async () => {
  const res = await api.get("/api/notifications/settings");
  return res.data;
};

export const updateNotificationSettings = async (settings) => {
  const res = await api.post("/api/notifications/settings", settings);
  return res.data;
};

export const sendTestEmail = async () => {
  const res = await api.post("/api/notifications/test-email");
  return res.data;
};

// USER DASHBOARD SUMMARY
export const getUserDashboardSummary = async () => {
  const res = await api.get("/api/user-dashboard/summary");
  return res.data;
};

export default api;
