import api from './api';

// ─── Browse ───────────────────────────────────────────────────────────────────
export const listSalons = async (params = {}) => {
  const res = await api.get('/api/salons/', { params });
  return res.data;
};

export const getSalon = async (salonId) => {
  const res = await api.get(`/api/salons/${salonId}`);
  return res.data;
};

export const getSalonReviews = async (salonId) => {
  const res = await api.get(`/api/salons/${salonId}/reviews`);
  return res.data;
};

export const getAvailableSlots = async (salonId, date) => {
  const res = await api.get(`/api/salons/${salonId}/available-slots`, { params: { date } });
  return res.data;
};

// ─── Customer Booking ─────────────────────────────────────────────────────────
export const bookSalonSlot = async (bookingData) => {
  const res = await api.post('/api/salons/book-slot', bookingData);
  return res.data;
};

export const getMySlotBookings = async () => {
  const res = await api.get('/api/salons/my-slot-bookings');
  return res.data;
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const submitReview = async (reviewData) => {
  const res = await api.post('/api/salons/reviews', reviewData);
  return res.data;
};

// ─── Shop Owner ───────────────────────────────────────────────────────────────
export const registerSalon = async (salonData) => {
  const res = await api.post('/api/salons/register', salonData);
  return res.data;
};

export const getMySalon = async () => {
  const res = await api.get('/api/salons/owner/my-salon');
  return res.data;
};

export const updateMySalon = async (updates) => {
  const res = await api.put('/api/salons/owner/update', updates);
  return res.data;
};

export const getOwnerBookings = async (params = {}) => {
  const res = await api.get('/api/salons/owner/bookings', { params });
  return res.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const res = await api.patch(`/api/salons/owner/bookings/${bookingId}/status`, null, {
    params: { status }
  });
  return res.data;
};
