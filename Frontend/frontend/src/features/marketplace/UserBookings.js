import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaPhone,
  FaTimes, FaCheckCircle, FaExclamationCircle, FaArrowLeft
} from 'react-icons/fa';
import { getMySlotBookings, cancelMyBooking } from '../../services/salonApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const UserBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getMySlotBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelMyBooking(bookingId);
      toast.success('Booking cancelled successfully');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-500">View and manage your salon bookings</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/marketplace')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-md"
        >
          <FaArrowLeft className="text-xs" /> Find More Salons
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarAlt className="text-3xl text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">No bookings yet</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">You haven't booked any slots yet. Find a salon and book your first appointment!</p>
          <button
            onClick={() => navigate('/dashboard/marketplace')}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{booking.salon_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[booking.status] || 'bg-gray-100'}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-purple-600">{booking.service_name}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" /> {booking.appointment_date}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" /> {booking.appointment_time}
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <FaMapMarkerAlt className="text-gray-400 shrink-0" /> {booking.salon_address}, {booking.salon_city}
                      </div>
                      {booking.salon_phone && (
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-gray-400" /> {booking.salon_phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-gray-300 font-mono mb-2">REF: {booking.booking_ref}</p>
                    {['confirmed', 'pending'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Cancel Appointment"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>

                {booking.status === 'confirmed' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-[11px] text-green-700">
                    <FaCheckCircle className="shrink-0" />
                    <span>Your slot is confirmed. Please arrive 10 minutes early.</span>
                  </div>
                )}
                {booking.status === 'cancelled' && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2 text-[11px] text-gray-500">
                    <FaExclamationCircle className="shrink-0" />
                    <span>This appointment was cancelled.</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBookings;
