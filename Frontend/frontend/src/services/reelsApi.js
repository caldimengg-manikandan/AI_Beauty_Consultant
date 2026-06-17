import api from './api';

export const getReelsFeed = async (category, page = 1, limit = 20) => {
  const params = { page, limit, ...(category ? { category } : {}) };
  const res = await api.get('/api/reels/feed', { params });
  // Backend returns paginated envelope { reels, total, page, pages }
  // Extract the array so callers don't have to unwrap it
  return Array.isArray(res.data) ? res.data : (res.data.reels ?? []);
};

export const getOwnerReels = async () => {
  const res = await api.get('/api/reels/owner/my-reels');
  return res.data;
};

export const toggleReelLike = async (reelId) => {
  const res = await api.post(`/api/reels/${reelId}/like`);
  return res.data;
};

export const toggleReelSave = async (reelId) => {
  const res = await api.post(`/api/reels/${reelId}/save`);
  return res.data;
};

export const incrementReelView = async (reelId) => {
  try {
    await api.post(`/api/reels/${reelId}/view`);
  } catch { /* silent — view tracking should never break UX */ }
};

export const deleteReel = async (reelId) => {
  const res = await api.delete(`/api/reels/${reelId}`);
  return res.data;
};

export const uploadReel = async (formData) => {
  const res = await api.post('/api/reels/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
