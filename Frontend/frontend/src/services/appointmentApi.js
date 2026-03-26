import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/appointments';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const bookAppointment = async (appointmentData) => {
    const response = await axios.post(`${API_URL}/book`, appointmentData, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const getMyBookings = async () => {
    const response = await axios.get(`${API_URL}/my-bookings`, {
        headers: getAuthHeader()
    });
    return response.data;
};
