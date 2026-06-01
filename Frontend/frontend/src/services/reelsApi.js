import api from './api';

export const getReelsFeed = async () => {
  const res = await api.get('/api/reels/feed');
  return res.data;
};

export const toggleReelLike = async (reelId) => {
  const res = await api.post(`/api/reels/${reelId}/like`);
  return res.data;
};

export const uploadReel = async (formData) => {
  const res = await api.post('/api/reels/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
