import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaMapMarkerAlt, FaStar, FaRegStar, FaStarHalfAlt,
  FaClock, FaPhone, FaEnvelope, FaCheckCircle, FaTimes,
  FaCalendarAlt, FaRegClock, FaExclamationCircle, FaRupeeSign,
  FaHeart, FaShare
} from 'react-icons/fa';
import { getSalon, getSalonReviews, getAvailableSlots, bookSalonSlot, submitReview } from '../../services/salonApi';
import PaymentButton from '../../components/PaymentButton';

// ─── Star renderer ─────────────────────────────────────────────────────────────
const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex gap-0.5 text-sm">
      {Array(full).fill(0).map((_, i) => <FaStar key={`f${i}`} className="text-amber-400" />)}
      {half && <FaStarHalfAlt className="text-amber-400" />}
      {Array(empty).fill(0).map((_, i) => <FaRegStar key={`e${i}`} className="text-gray-300" />)}
    </span>
  );
};

// ─── Interactive star picker ───────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}>
        {n <= value
          ? <FaStar className="text-amber-400 text-xl hover:scale-110 transition-transform" />
          : <FaRegStar className="text-gray-300 text-xl hover:text-amber-300 hover:scale-110 transition-all" />}
      </button>
    ))}
  </div>
);

// ─── Demo data fallback ────────────────────────────────────────────────────────
const DEMO_SALON = {
  id: 'd1', name: 'Bliss Beauty Parlour', salon_type: 'parlour', gender_served: 'Female',
  city: 'Chennai', address: '12, Anna Salai, Teynampet, Chennai - 600018',
  phone: '+91 98765 43210', email: 'bliss@beautyapp.com',
  avg_rating: 4.8, review_count: 124, is_active: true,
  description: 'Premium skincare, threading, and bridal packages. Our expert beauticians bring 10+ years of experience. We use only the finest, cruelty-free products to give your skin the care it deserves.',
  services_offered: ['Facial', 'Threading', 'Waxing', 'Bridal Makeup', 'Mani-Pedi', 'Hair Spa'],
  opening_time: '9:00 AM', closing_time: '8:00 PM', slot_duration_minutes: 60, max_concurrent_slots: 3,
};

const DEMO_REVIEWS = [
  { id: 'r1', user_name: 'Priya S.', rating: 5, comment: 'Amazing experience! The staff is super friendly and the facial left my skin glowing. Will definitely come back.', created_at: '2025-04-12T10:00:00Z' },
  { id: 'r2', user_name: 'Nithya K.', rating: 4, comment: 'Good ambience and skilled staff. Loved the bridal package. A bit of wait time but worth it.', created_at: '2025-04-08T14:30:00Z' },
  { id: 'r3', user_name: 'Meera R.', rating: 5, comment: 'Best parlour in Chennai! The owner is so attentive and the prices are very reasonable.', created_at: '2025-03-28T11:00:00Z' },
];

const DEMO_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'].map((time, i) => ({
  time,
  available: i % 3 !== 1,
  spots_left: i % 3 === 0 ? 3 : i % 3 === 1 ? 0 : 1,
}));

// ─── Main Component ────────────────────────────────────────────────────────────
const SalonDetailPage = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [salon, setSalon] = useState(location.state?.salon || null);
  const [reviews, setReviews] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(!location.state?.salon);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview'); // overview | book | reviews

  // Booking state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [bookingForm, setBookingForm] = useState({ customer_name: '', customer_phone: '', notes: '' });
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [booking, setBooking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState(null); // awaiting payment

  // Review state
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewResult, setReviewResult] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isDemo = salonId?.startsWith('d') || salonId?.startsWith('loc') || salonId?.startsWith('osm');

  // Fetch salon + reviews
  useEffect(() => {
    (async () => {
      // If we already have the salon from router state, we don't need to show a big loader or override it with generic demo
      if (!salon) setLoading(true);
      
      if (isDemo) {
        if (!salon) setSalon(DEMO_SALON); // Fallback to generic if accessed directly via URL
        setReviews(DEMO_REVIEWS);
      } else {
        try {
          const [s, r] = await Promise.all([getSalon(salonId), getSalonReviews(salonId)]);
          if (!salon) setSalon(s);
          setReviews(r);
        } catch {
          if (!salon) setSalon(DEMO_SALON);
          setReviews(DEMO_REVIEWS);
        }
      }
      setLoading(false);
    })();
  }, [salonId, isDemo, salon]);

  // Fetch slots when date changes
  const fetchSlots = useCallback(async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedTime('');
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500));
        setSlots(DEMO_SLOTS);
      } else {
        const data = await getAvailableSlots(salonId, date);
        setSlots(data.slots || []);
      }
    } catch {
      setSlots(DEMO_SLOTS);
    } finally {
      setLoadingSlots(false);
    }
  }, [salonId, isDemo]);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedTime || !selectedService) {
      setBookingError('Please select a time slot and service.');
      return;
    }
    setBooking(true);
    setBookingError('');
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800));
        const demoRef = 'SB-DEMO' + Math.random().toString(36).slice(2, 6).toUpperCase();
        setPendingBookingId(demoRef);
      } else {
        const res = await bookSalonSlot({
          salon_id: salonId,
          service_name: selectedService,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          ...bookingForm,
        });
        // After booking creation, go to payment step (prefer UUID id, fall back to booking_ref)
        const bookingIdentifier = res.booking_id || res.data?.id || res.id || res.booking_ref;
        if (!bookingIdentifier) throw new Error('Booking created but no booking ID returned.');
        setPendingBookingId(bookingIdentifier);
      }
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { setReviewError('Please select a rating'); return; }
    setSubmittingReview(true);
    setReviewError('');
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 600));
        setReviewResult('Review submitted! (Demo mode)');
        setReviews(prev => [{ id: 'new', user_name: 'You', ...reviewForm, created_at: new Date().toISOString() }, ...prev]);
      } else {
        await submitReview({ salon_id: salonId, ...reviewForm });
        setReviewResult('Review submitted successfully! Thank you.');
        const updated = await getSalonReviews(salonId);
        setReviews(updated);
      }
      setReviewForm({ rating: 0, comment: '' });
    } catch (err) {
      setReviewError(err.response?.data?.detail || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const typeEmoji = { parlour: '💆‍♀️', salon: '✂️', spa: '🌿' };
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading salon details...</p>
        </div>
      </div>
    );
  }

  if (!salon) return null;

  return (
    <div className="min-h-full max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/marketplace')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors mb-4"
      >
        <FaArrowLeft /> Back to Marketplace
      </button>

      {/* ── Booking confirmed banner */}
      {bookingResult && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
          <FaCheckCircle className="text-green-500 text-xl shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-800">Slot Booked Successfully! 🎉</p>
            <p className="text-sm text-green-700 mt-0.5">
              Booking Ref: <span className="font-mono font-bold">{bookingResult.booking_ref}</span>
            </p>
            <p className="text-xs text-green-600 mt-1">You will receive a confirmation. Show this reference at the salon.</p>
          </div>
        </div>
      )}

      {/* ── Hero card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-pink-600 to-teal-500 rounded-2xl p-6 text-white mb-6">
        <div className="absolute right-6 top-4 text-8xl opacity-20">{typeEmoji[salon.salon_type]}</div>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full mb-2 capitalize">
                {salon.salon_type} · {salon.gender_served}
              </span>
              <h1 className="text-2xl font-bold">{salon.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={Number(salon.avg_rating || 0)} />
                <span className="text-sm font-bold">{Number(salon.avg_rating || 0).toFixed(1)}</span>
                <span className="text-white/70 text-xs">({salon.review_count || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-white/80 text-sm">
                <FaMapMarkerAlt /> {salon.address}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                <FaHeart className="text-sm" />
              </button>
              <button className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                <FaShare className="text-sm" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5"><FaClock /> {salon.opening_time} – {salon.closing_time}</div>
            {salon.phone && <div className="flex items-center gap-1.5"><FaPhone /> {salon.phone}</div>}
            {salon.email && <div className="flex items-center gap-1.5"><FaEnvelope /> {salon.email}</div>}
          </div>
        </div>
      </div>

      {/* ── Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {[['overview', 'Overview'], ['book', 'Book a Slot'], ['reviews', `Reviews (${reviews.length})`]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === key ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {salon.gallery_urls?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">Shop Gallery</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x">
                {salon.gallery_urls.map((url, i) => (
                  <div key={i} className="min-w-[200px] h-32 rounded-xl overflow-hidden shadow-sm snap-start shrink-0 relative group cursor-pointer">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {i === 0 && <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Cover</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{salon.description || "No description provided."}</p>
          </div>

          {(salon.services_with_pricing?.length > 0 || salon.services_offered?.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                {salon.services_with_pricing?.length > 0 ? (
                  salon.services_with_pricing.map(s => (
                    <span key={s.name} className="flex items-center gap-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full">
                      <FaCheckCircle className="text-[10px]" /> {s.name} <span className="opacity-60 ml-1">₹{s.price}</span>
                    </span>
                  ))
                ) : (
                  (salon.services_offered || []).map(s => (
                    <span key={s} className="flex items-center gap-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full">
                      <FaCheckCircle className="text-[10px]" /> {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Quick Info</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Slot Duration', `${salon.slot_duration_minutes || 60} mins`],
                ['Max Concurrent', `${salon.max_concurrent_slots || 3} bookings`],
                ['Working Hours', `${salon.opening_time} – ${salon.closing_time}`],
                ['Serves', salon.gender_served],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{k}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('book')}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-[1.01] transition-all text-sm"
          >
            📅 Book a Slot Now
          </button>
        </div>
      )}

      {/* ── Book tab */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-5">Book Your Slot</h2>
          <form onSubmit={handleBook} className="space-y-5">

            {/* Step 1: Service */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                1. Select Service <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {salon.services_with_pricing?.length > 0 ? (
                  salon.services_with_pricing.map(s => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelectedService(s.name)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${selectedService === s.name ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'}`}
                    >
                      {s.name} <span className="opacity-70 ml-1">₹{s.price}</span>
                    </button>
                  ))
                ) : (
                  (salon.services_offered || []).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedService(s)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${selectedService === s ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'}`}
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Step 2: Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                2. Choose Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 text-sm" />
                <input
                  required
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            {/* Step 3: Slot */}
            {selectedDate && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  3. Pick a Time Slot <span className="text-red-500">*</span>
                </label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    Loading availability...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${!slot.available
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          : selectedTime === slot.time
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105'
                            : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600'}`}
                      >
                        <div>{slot.time}</div>
                        {slot.available
                          ? <div className="text-[9px] text-emerald-500 font-medium">{slot.spots_left} left</div>
                          : <div className="text-[9px] text-red-400">Full</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Details */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">4. Your Details</label>
              <input
                required
                type="text"
                placeholder="Your full name *"
                value={bookingForm.customer_name}
                onChange={e => setBookingForm(f => ({ ...f, customer_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                required
                type="tel"
                placeholder="Mobile number *"
                value={bookingForm.customer_phone}
                onChange={e => setBookingForm(f => ({ ...f, customer_phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <textarea
                placeholder="Any special requests? (optional)"
                value={bookingForm.notes}
                onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            {/* Summary */}
            {selectedService && selectedDate && selectedTime && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm space-y-1.5">
                <p className="font-bold text-purple-800 text-xs uppercase tracking-wide">Booking Summary</p>
                <div className="flex justify-between"><span className="text-gray-500">Salon</span><span className="font-semibold text-gray-800">{salon.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-semibold text-gray-800">{selectedService}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-800">{selectedDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-semibold text-purple-700">{selectedTime}</span></div>
              </div>
            )}

            {bookingError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <FaExclamationCircle className="shrink-0 mt-0.5" /> {bookingError}
              </div>
            )}

            {/* Requirements checklist — visible when form is incomplete */}
            {(!selectedService || !selectedDate || !selectedTime || !bookingForm.customer_name.trim() || !bookingForm.customer_phone.trim()) && (
              <div className="text-xs space-y-1 border-t border-gray-100 pt-3">
                <p className="font-semibold text-gray-500 mb-1.5">Complete all steps to proceed:</p>
                {[
                  [!!selectedService, 'Choose a service'],
                  [!!selectedDate, 'Pick a date'],
                  [!!selectedTime, 'Select a time slot'],
                  [!!bookingForm.customer_name.trim(), 'Enter your name'],
                  [!!bookingForm.customer_phone.trim(), 'Enter your phone number'],
                ].map(([done, label]) => (
                  <div key={label} className={`flex items-center gap-1.5 ${done ? 'text-emerald-600' : 'text-red-400'}`}>
                    {done
                      ? <FaCheckCircle className="text-[10px] shrink-0" />
                      : <FaExclamationCircle className="text-[10px] shrink-0" />}
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Payment Step — shown after booking details filled */}
            {pendingBookingId ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm">
                  <p className="font-bold text-purple-800 mb-1">🎉 Booking Created! Complete Payment to Confirm</p>
                  <p className="text-purple-600 text-xs">Booking Ref: <span className="font-mono font-bold">{pendingBookingId}</span></p>
                </div>
                <PaymentButton
                  bookingId={pendingBookingId}
                  amount={salon.services_with_pricing?.find(s => s.name === selectedService)?.price || 250}
                  salonName={salon.name}
                  serviceName={selectedService}
                  customerName={bookingForm.customer_name}
                  onSuccess={(payData) => {
                    setBookingResult({ booking_ref: pendingBookingId, payment_id: payData.payment_id });
                    setPendingBookingId(null);
                    setActiveTab('overview');
                  }}
                  onError={(err) => setBookingError(err?.message || 'Payment failed. Please try again.')}
                />
                <button
                  type="button"
                  onClick={() => setPendingBookingId(null)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to booking details
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={booking || !selectedService || !selectedDate || !selectedTime || !bookingForm.customer_name.trim() || !bookingForm.customer_phone.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {booking ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Booking...</>
                ) : '📅 Proceed to Payment'}
              </button>
            )}
          </form>
        </div>
      )}

      {/* ── Reviews tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {/* Write review */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Write a Review</h2>
            {reviewResult ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <FaCheckCircle /> {reviewResult}
              </div>
            ) : (
              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Your Rating</label>
                  <StarPicker value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your experience..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
                {reviewError && (
                  <div className="text-sm text-red-600 flex items-center gap-1.5">
                    <FaTimes /> {reviewError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submittingReview || !reviewForm.rating}
                  className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>

          {/* Review list */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <FaRegStar className="text-4xl mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No reviews yet. Be the first!</p>
              </div>
            ) : reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {r.user_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.user_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonDetailPage;
