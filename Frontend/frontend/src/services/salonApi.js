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

// ─── Nearby (registered salons with coordinates) ─────────────────────────────
export const getNearbySalons = async (lat, lon, params = {}) => {
  const res = await api.get('/api/salons/nearby', { params: { lat, lon, ...params } });
  return res.data;
};

// ─── Google Places Proxy ──────────────────────────────────────────────────────
export const getGooglePlacesNearby = async (lat, lon, params = {}) => {
  const res = await api.get('/api/salons/google-places', { params: { lat, lon, ...params } });
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

export const cancelMyBooking = async (bookingId) => {
  const res = await api.patch(`/api/salons/my-slot-bookings/${bookingId}/cancel`);
  return res.data;
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const submitReview = async (reviewData) => {
  const res = await api.post('/api/salons/reviews', reviewData);
  return res.data;
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const toggleWishlist = async (salonId) => {
  const res = await api.post(`/api/salons/${salonId}/wishlist`);
  return res.data;
};

export const getMyWishlist = async () => {
  const res = await api.get('/api/salons/my-wishlist');
  return res.data;
};

// ─── Shop Owner ───────────────────────────────────────────────────────────────
export const registerSalon = async (salonData) => {
  const res = await api.post('/api/salons/register', salonData);
  return res.data;
};

export const deleteMySalon = async () => {
  const res = await api.delete('/api/salons/owner');
  return res.data;
};

export const uploadGalleryImages = async (formData) => {
  const res = await api.post('/api/salons/upload-gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
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
  // Backend returns paginated envelope { bookings, total, page, pages }
  // Extract the array so callers don't have to unwrap it
  return Array.isArray(res.data) ? res.data : (res.data.bookings ?? []);
};

export const updateBookingStatus = async (bookingId, status) => {
  const res = await api.patch(`/api/salons/owner/bookings/${bookingId}/status`, null, {
    params: { status }
  });
  return res.data;
};

export const getOwnerAnalytics = async () => {
  const res = await api.get('/api/salons/owner/analytics');
  return res.data;
};

// ─── AI Recommendations ───────────────────────────────────────────────────────
export const getAIServiceRecommendations = async (analysisResult) => {
  const res = await api.post('/api/recommend-services', analysisResult);
  return res.data;
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const createPaymentOrder = async (bookingId, amount) => {
  const res = await api.post('/api/payments/create-order', { booking_id: bookingId, amount });
  return res.data;
};

export const verifyPayment = async (verifyData) => {
  const res = await api.post('/api/payments/verify', verifyData);
  return res.data;
};

export const getMyPaymentHistory = async () => {
  const res = await api.get('/api/payments/my-history');
  return res.data;
};

// ─── Real-World Salons Scraper (Overpass API) ────────────────────────────────
export const fetchRealWorldSalons = async (lat, lon, radiusMeters = 5000) => {
  try {
    const query = `
      [out:json][timeout:15];
      (
        node["shop"~"beauty|hairdresser|massage|cosmetics|tattoo"](around:${radiusMeters},${lat},${lon});
        node["leisure"="spa"](around:${radiusMeters},${lat},${lon});
      );
      out body;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from OSM');
    const data = await res.json();
    
    // Haversine distance calculator
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };
    
    return data.elements.filter(el => el.tags && el.tags.name).map(el => {
      const isSpa = el.tags?.leisure === 'spa' || el.tags?.shop === 'massage';
      const isSalon = el.tags?.shop === 'hairdresser' || el.tags?.shop === 'tattoo';
      const dist = getDistanceKm(lat, lon, el.lat, el.lon);
      
      return {
        id: `osm-${el.id}`,
        name: el.tags?.name || (isSpa ? 'Wellness Spa' : isSalon ? 'Hair Salon' : 'Beauty Parlour'),
        salon_type: isSpa ? 'spa' : isSalon ? 'salon' : 'parlour',
        gender_served: el.tags?.female === 'yes' && el.tags?.male !== 'yes' ? 'Female' : 'Unisex',
        city: el.tags?.['addr:city'] || 'Nearby Area',
        address: [el.tags?.['addr:street'], el.tags?.['addr:housenumber']].filter(Boolean).join(', ') || 'Local Location',
        avg_rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1), // mock rating
        review_count: Math.floor(Math.random() * 300) + 20,
        is_active: true,
        description: 'Real-world local salon fetched securely from OpenStreetMap. ' + (el.tags?.description || ''),
        services_offered: isSpa ? ['Swedish Massage', 'Hot Stone', 'Aromatherapy'] : isSalon ? ['Hair Cut', 'Hair Color', 'Keratin'] : ['Facial', 'Threading', 'Waxing'],
        opening_time: el.tags?.opening_hours || '9:00 AM',
        closing_time: '8:00 PM',
        lat: el.lat,
        lon: el.lon,
        distance_km: parseFloat(dist.toFixed(2)),
        isReal: true // Flag to indicate it's real data
      };
    }).sort((a, b) => a.distance_km - b.distance_km); // Sort by distance ascending!
  } catch (error) {
    console.error("Overpass API error:", error);
    return [];
  }
};
