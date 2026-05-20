import api from './api';

export const getWaitlist = async () => {
  const res = await api.get('/api/waitlist');
  return res.data;
};

export const addWalkIn = async (data) => {
  const res = await api.post('/api/waitlist/add', data);
  return res.data;
};

export const updateWaitlistStatus = async (id, status) => {
  const res = await api.put(`/api/waitlist/${id}/status`, { status });
  return res.data;
};
