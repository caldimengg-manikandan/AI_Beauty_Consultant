import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaPhone,
  FaTimes, FaCheckCircle, FaExclamationCircle, FaArrowRight,
  FaStore, FaRedo,
} from "react-icons/fa";
import { getMySlotBookings, cancelMyBooking } from "../../services/salonApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const STATUS_META = {
  confirmed: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-500" },
  pending:   { label: "Pending",   cls: "bg-amber-50  text-amber-600  border-amber-100",  dot: "bg-amber-500"  },
  cancelled: { label: "Cancelled", cls: "bg-rose-50   text-rose-600   border-rose-100",   dot: "bg-rose-400"   },
  completed: { label: "Completed", cls: "bg-violet-50 text-violet-600 border-violet-100", dot: "bg-violet-500" },
};

const SkeletonBooking = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
    <div className="flex justify-between gap-4 mb-4">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-100 rounded-full w-2/3" />
        <div className="h-3 bg-slate-100 rounded-full w-1/3" />
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[1,2,3,4].map(i => <div key={i} className="h-3 bg-slate-100 rounded-full" />)}
    </div>
  </div>
);

const BookingCard = ({ booking, onCancel }) => {
  const status = STATUS_META[booking.status] || STATUS_META.pending;
  const canCancel = ["confirmed", "pending"].includes(booking.status);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-200 overflow-hidden">
      <div className="p-5">
        {/* header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-sm font-black text-slate-900">{booking.salon_name}</h3>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wide flex items-center gap-1 ${status.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-xs font-bold text-violet-600">{booking.service_name}</p>
          </div>
          {canCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              title="Cancel Appointment"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent hover:border-rose-100 flex-shrink-0"
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>

        {/* detail grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FaCalendarAlt className="text-violet-300 flex-shrink-0" />
            <span>{booking.appointment_date}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FaClock className="text-teal-300 flex-shrink-0" />
            <span>{booking.appointment_time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 sm:col-span-2">
            <FaMapMarkerAlt className="text-rose-300 flex-shrink-0" />
            <span className="truncate">{booking.salon_address}, {booking.salon_city}</span>
          </div>
          {booking.salon_phone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FaPhone className="text-slate-300 flex-shrink-0" />
              <span>{booking.salon_phone}</span>
            </div>
          )}
          {booking.booking_ref && (
            <div className="text-[9px] font-mono text-slate-300 sm:col-span-2 pt-1">
              REF: {booking.booking_ref}
            </div>
          )}
        </div>

        {/* status banners */}
        {booking.status === "confirmed" && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
            <FaCheckCircle className="flex-shrink-0 text-emerald-500" />
            Your slot is confirmed. Please arrive 10 minutes early.
          </div>
        )}
        {booking.status === "cancelled" && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
            <FaExclamationCircle className="flex-shrink-0" />
            This appointment was cancelled.
          </div>
        )}
      </div>
    </div>
  );
};

const UserBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMySlotBookings();
      setBookings(data);
    } catch {
      setError("Could not load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelMyBooking(bookingId);
      toast.success("Booking cancelled successfully");
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel booking");
    }
  };

  const confirmed = bookings.filter(b => b.status === "confirmed").length;
  const pending   = bookings.filter(b => b.status === "pending").length;
  const total     = bookings.length;

  return (
    <div className="min-h-screen bg-[#fafaf9] p-5 lg:p-10 font-sans selection:bg-violet-100">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-violet-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">My Bookings</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse inline-block" /> Live Status
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              My <span className="text-teal-600">Appointments</span>
            </h1>
            {!loading && total > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="text-[11px] font-bold text-slate-600">{total} Total</span>
                {confirmed > 0 && <>
                  <div className="w-px h-4 bg-slate-200 self-center" />
                  <span className="text-[11px] font-bold text-emerald-600">{confirmed} Confirmed</span>
                </>}
                {pending > 0 && <>
                  <div className="w-px h-4 bg-slate-200 self-center" />
                  <span className="text-[11px] font-bold text-amber-600">{pending} Pending</span>
                </>}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/dashboard/marketplace")}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-violet-100 active:scale-95"
          >
            <FaStore /> Book Again <FaArrowRight className="text-[9px]" />
          </button>
        </div>

        {/* error */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button onClick={loadBookings} className="flex items-center gap-2 text-xs font-bold text-rose-600">
              <FaRedo /> Retry
            </button>
          </div>
        )}

        {/* list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonBooking key={i} />)}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} />
            ))}
          </div>
        ) : !error && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-100">
              <FaCalendarAlt className="text-2xl text-violet-400" />
            </div>
            <h2 className="text-base font-black text-slate-800 mb-2">No Appointments Yet</h2>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
              You haven't booked any slots yet. Find a salon and schedule your first visit!
            </p>
            <button
              onClick={() => navigate("/dashboard/marketplace")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-violet-100"
            >
              <FaStore /> Explore Salons
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookings;
