import api from './api';

export const getApiKeys = async () => {
  const res = await api.get('/api/developers/keys');
  return res.data;
};

export const generateApiKey = async () => {
  const res = await api.post('/api/developers/keys/generate');
  return res.data;
};

export const deleteApiKey = async (id) => {
  const res = await api.delete(`/api/developers/keys/${id}`);
  return res.data;
};

export const getWebhooks = async () => {
  const res = await api.get('/api/developers/webhooks');
  return res.data;
};

export const registerWebhook = async (data) => {
  const res = await api.post('/api/developers/webhooks/register', data);
  return res.data;
};

export const deleteWebhook = async (id) => {
  const res = await api.delete(`/api/developers/webhooks/${id}`);
  return res.data;
};

export const testWebhook = async (id) => {
  const res = await api.post(`/api/developers/webhooks/${id}/test`);
  return res.data;
};
