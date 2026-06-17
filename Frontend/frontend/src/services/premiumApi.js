import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/user`;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const getUserRole = async () => {
    const response = await axios.get(`${API_URL}/role`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const getUserStats = async () => {
    const response = await axios.get(`${API_URL}/stats`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const getAvailableFeatures = async () => {
    const response = await axios.get(`${API_URL}/features`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const upgradeToPremium = async (durationDays = 30) => {
    const response = await axios.post(`${API_URL}/upgrade`, {
        duration_days: durationDays,
        payment_method: 'demo'
    }, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const checkUsage = async () => {
    const response = await axios.get(`${API_URL}/usage`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const getPricing = async () => {
    const response = await axios.get(`${API_URL}/pricing`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const cancelSubscription = async () => {
    const response = await axios.post(`${API_URL}/downgrade`, {}, {
        headers: getAuthHeader()
    });
    return response.data;
};
