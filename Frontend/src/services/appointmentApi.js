import api from './api';

export const bookAppointment = async (appointmentData) => {
    const response = await api.post(`/api/appointments/book`, appointmentData);
    return response.data;
};

export const getMyBookings = async () => {
    const response = await api.get(`/api/appointments/my-bookings`);
    return response.data;
};
