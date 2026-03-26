import api from './api';

export const gamificationApi = {
    getStatus: async () => {
        const response = await api.get('/api/gamification/status');
        return response.data;
    }
};
