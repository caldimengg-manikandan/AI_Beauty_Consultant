import api from './api';

export const getMembershipPlans = async () => {
  const res = await api.get('/api/memberships/plans');
  return res.data;
};

export const getMySubscriptions = async () => {
  const res = await api.get('/api/memberships/my-plans');
  return res.data;
};

export const subscribeToPlan = async (planId) => {
  const res = await api.post('/api/memberships/subscribe', { plan_id: planId });
  return res.data;
};

export const cancelSubscription = async (subId) => {
  const res = await api.post(`/api/memberships/${subId}/cancel`);
  return res.data;
};
