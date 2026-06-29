import api from './api';

export const getUserRole = async () => {
    const response = await api.get(`/api/user/role`);
    return response.data;
};

export const getUserStats = async () => {
    const response = await api.get(`/api/user/stats`);
    return response.data;
};

export const getAvailableFeatures = async () => {
    const response = await api.get(`/api/user/features`);
    return response.data;
};

export const upgradeToPremium = async (durationDays = 30) => {
    const response = await api.post(`/api/user/upgrade`, {
        duration_days: durationDays,
        payment_method: 'demo'
    });
    return response.data;
};

export const checkUsage = async () => {
    const response = await api.get(`/api/user/usage`);
    return response.data;
};

export const getPricing = async () => {
    const response = await api.get(`/api/user/pricing`);
    return response.data;
};

export const cancelSubscription = async () => {
    const response = await api.post(`/api/user/downgrade`, {});
    return response.data;
};
