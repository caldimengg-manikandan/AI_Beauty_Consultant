import api from './api';

export const sendChatMessage = async (message, context) => {
  const res = await api.post('/api/chat/message', { message, context });
  return res.data;
};
