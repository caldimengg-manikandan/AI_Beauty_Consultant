import api from './api';

export const getMyTemplates = async () => {
  const res = await api.get('/api/forms/templates');
  return res.data;
};

export const createTemplate = async (data) => {
  const res = await api.post('/api/forms/templates', data);
  return res.data;
};

export const deleteTemplate = async (templateId) => {
  const res = await api.delete(`/api/forms/templates/${templateId}`);
  return res.data;
};

export const submitFormResponses = async (data) => {
  const res = await api.post('/api/forms/submit', data);
  return res.data;
};

export const getMySubmissions = async () => {
  const res = await api.get('/api/forms/submissions');
  return res.data;
};
