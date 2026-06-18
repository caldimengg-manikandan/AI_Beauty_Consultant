import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    FaFemale, FaMale, FaSpa, FaLeaf, FaGem, FaTint,
    FaCalendarAlt, FaClock, FaUser, FaTimes, FaCheckCircle,
    FaExclamationCircle, FaStar, FaFire, FaFlask, FaSearch,
    FaChevronRight, FaTag, FaRegClock, FaShieldAlt, FaStore,
    FaMapMarkerAlt, FaRedo, FaExclamationTriangle,
} from 'react-icons/fa';
import { bookAppointment } from '../../services/appointmentApi';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
    Hair:    { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200', icon: <FaUser className="text-violet-500" />        },
    Skin:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',   icon: <FaSpa  className="text-pink-500" />           },
    Spa:     { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',   icon: <FaSpa  className="text-teal-500" />           },
    Makeup:  { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',   icon: <FaGem  className="text-rose-500" />           },
    Nail:    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200',icon: <FaShieldAlt className="text-fuchsia-500" />  },
    General: { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',  icon: <FaLeaf className="text-slate-500" />          },
};

const getCategoryStyle = (cat) =>
    CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDuration = (mins) => {
    if (!mins || mins === 0) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON CARD — loading placeholder
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-3 bg-gray-100 rounded-lg w-full mt-1" />
        <div className="h-3 bg-gray-100 rounded-lg w-5/6" />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <div className="h-5 bg-gray-200 rounded-lg w-16" />
            <div className="h-8 bg-gray-200 rounded-xl w-20" />
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE CARD
// ─────────────────────────────────────────────────────────────────────────────
const ServiceCard = ({ svc, onBook }) => {
    const catStyle   = getCategoryStyle(svc.category);
    const duration   = fmtDuration(svc.duration_mins);
    const hasRating  = svc.rating && svc.rating > 0;
    const hasPrice   = svc.price && svc.price > 0;

    return (
        <div
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col
                       hover:border-violet-200 hover:shadow-lg transition-all duration-200 group"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
            {/* Category top strip */}
            <div className={`h-0.5 ${catStyle.bg.replace('50', '300')}`} />

            <div className="p-5 flex flex-col flex-1 gap-2.5">

                {/* ── Row 1: Service Name + Category Badge ── */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-gray-900 leading-snug group-hover:text-violet-700 transition-colors flex-1">
                        {svc.service_name || 'Unnamed Service'}
                    </h3>
                    <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                        {svc.category}
                    </span>
                </div>

                {/* ── Row 2: Parlour Name ── */}
                <div className="flex items-center gap-1.5">
                    <FaStore className="text-[9px] text-violet-400 shrink-0" />
                    <span className="text-[11px] font-medium text-violet-600 truncate">
                        {svc.parlour_name || 'Parlour information unavailable'}
                    </span>
                    {svc.parlour_city && (
                        <>
                            <span className="text-gray-300 text-[10px]">·</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <FaMapMarkerAlt className="text-[8px]" />
                                {svc.parlour_city}
                            </span>
                        </>
                    )}
                </div>

                {/* ── Row 3: Meta badges (rating, duration) ── */}
                <div className="flex flex-wrap items-center gap-2">
                    {hasRating && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            <FaStar className="text-amber-400 text-[8px]" />
                            {Number(svc.rating).toFixed(1)}
                        </span>
                    )}
                    {duration && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                            <FaRegClock className="text-[9px] text-gray-400" />
                            {duration}
                        </span>
                    )}
                </div>

                {/* ── Row 4: Description ── */}
                {svc.description ? (
                    <p className="text-[11px] text-gray-500 leading-relaxed flex-1 line-clamp-2">
                        {svc.description}
                    </p>
                ) : (
                    <p className="text-[11px] text-gray-300 italic flex-1">No description provided.</p>
                )}

                {/* ── Row 5: Price + CTA ── */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 mt-auto">
                    <div>
                        {hasPrice ? (
                            <span className="text-base font-bold text-gray-900">{fmt(svc.price)}</span>
                        ) : (
                            <span className="text-xs text-gray-400 italic">Price on enquiry</span>
                        )}
                    </div>
                    <button
                        onClick={() => onBook(svc)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white
                                   text-[11px] font-semibold rounded-xl hover:bg-violet-700
                                   transition-colors shadow-sm hover:shadow-md active:scale-[0.97]"
                    >
                        Book <FaChevronRight className="text-[8px]" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
const EmptyState = ({ search, onClear }) => (
    <div className="py-20 text-center bg-white border border-gray-100 rounded-2xl">
        <FaSearch className="mx-auto text-gray-200 text-5xl mb-4" />
        <p className="text-sm font-semibold text-gray-700 mb-1">
            {search ? 'No services match your search' : 'No services available yet'}
        </p>
        <p className="text-xs text-gray-400 mb-5">
            {search
                ? 'Try a different keyword, or clear the search field.'
                : 'Registered parlours haven\'t added services yet. Check back soon!'}
        </p>
        {search && (
            <button
                onClick={onClear}
                className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors"
            >
                Clear Search
            </button>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }) => (
    <div className="py-20 text-center bg-red-50 border border-red-100 rounded-2xl">
        <FaExclamationTriangle className="mx-auto text-red-300 text-4xl mb-4" />
        <p className="text-sm font-semibold text-red-700 mb-1">Unable to load services</p>
        <p className="text-xs text-red-400 mb-5">Please check your connection and try again.</p>
        <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors"
        >
            <FaRedo className="text-[10px]" /> Retry
        </button>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING MODAL — preserves existing bookAppointment API flow exactly
// ─────────────────────────────────────────────────────────────────────────────
const BookingModal = ({ svc, onClose }) => {
    const [form, setForm]         = useState({ name: '', date: '', time: '' });
    const [error, setError]       = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [bookingRef, setBookingRef] = useState(null);

    const handleBook = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const result = await bookAppointment({
                service_name:     svc.service_name,
                customer_name:    form.name,
                appointment_date: form.date,
                appointment_time: form.time,
                category:         svc.category,
                parlour_id:       svc.parlour_id,
                parlour_name:     svc.parlour_name,
                gender:           svc.parlour_gender || 'Unisex',
            });
            setBookingRef(result.booking_ref);
            setTimeout(() => onClose(), 5000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-widest mb-0.5">
                            Book Appointment
                        </p>
                        <h3 className="text-sm font-bold text-gray-900 leading-snug">
                            {svc.service_name}
                        </h3>
                        <p className="text-[11px] text-violet-500 mt-0.5 flex items-center gap-1">
                            <FaStore className="text-[9px]" />
                            {svc.parlour_name}
                            {svc.parlour_city && ` · ${svc.parlour_city}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                            {svc.price > 0 && (
                                <span className="text-base font-bold text-gray-900">{fmt(svc.price)}</span>
                            )}
                            {fmtDuration(svc.duration_mins) && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <FaRegClock className="text-[10px]" />
                                    {fmtDuration(svc.duration_mins)}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                        aria-label="Close"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {error && (
                        <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                            <FaExclamationCircle className="shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {!bookingRef ? (
                        <form onSubmit={handleBook} className="space-y-5">
                            {/* Full name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                                               focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
                                               placeholder:text-gray-400 text-gray-800 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                                                   focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
                                                   text-gray-800 transition-all"
                                    />
                                </div>

                                {/* Time */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Time Slot <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={form.time}
                                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
                                                   focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
                                                   text-gray-800 bg-white transition-all"
                                    >
                                        <option value="">Select</option>
                                        {['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM',
                                          '2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM']
                                            .map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-600 space-y-1.5">
                                {[
                                    ['Service',  svc.service_name],
                                    ['Parlour',  svc.parlour_name],
                                    ['Category', svc.category],
                                    svc.price > 0 ? ['Amount', fmt(svc.price)] : null,
                                ].filter(Boolean).map(([label, val]) => (
                                    <div key={label} className="flex justify-between">
                                        <span className="text-gray-400">{label}</span>
                                        <span className={`font-semibold ${label === 'Amount' ? 'text-violet-700' : 'text-gray-800'}`}>
                                            {val}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-3 bg-violet-600 text-white text-sm font-semibold
                                            rounded-xl hover:bg-violet-700 transition-colors shadow-sm
                                            flex items-center justify-center gap-2
                                            ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting…
                                    </>
                                ) : 'Confirm Appointment'}
                            </button>
                        </form>
                    ) : (
                        /* ── Booking Confirmed ── */
                        <div className="py-6 text-center space-y-4">
                            <div className="flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mx-auto">
                                <FaCheckCircle className="text-green-500 text-2xl" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-900">Appointment Confirmed</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    {form.date} at {form.time}
                                </p>
                            </div>
                            <div className="border border-dashed border-gray-200 rounded-xl px-5 py-4 bg-gray-50">
                                <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Booking Reference</p>
                                <p className="font-mono text-lg font-bold text-violet-700">{bookingRef}</p>
                            </div>
                            <p className="text-xs text-gray-400">This window will close automatically.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ServicesPage = () => {
    // ── UI state
    const [gender, setGender]           = useState('Female');
    const [activeCat, setActiveCat]     = useState('All');
    const [search, setSearch]           = useState('');
    const [selectedSvc, setSelectedSvc] = useState(null);

    // ── Data state
    const [allServices, setAllServices] = useState([]);   // raw from API
    const [loading, setLoading]         = useState(true);
    const [apiError, setApiError]       = useState(false);

    // ── Fetch all public services from backend ────────────────────────────────
    const fetchServices = useCallback(async () => {
        setLoading(true);
        setApiError(false);
        try {
            const res = await api.get('/api/salon-services/public/all', {
                params: { limit: 500 },
            });
            setAllServices(res.data?.services || []);
        } catch {
            setApiError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    // ── Derived: unique categories from real data ─────────────────────────────
    const categories = useMemo(() => {
        const cats = [...new Set(allServices.map((s) => s.category).filter(Boolean))].sort();
        return ['All', ...cats];
    }, [allServices]);

    // ── Filtered & grouped services ───────────────────────────────────────────
    const filteredServices = useMemo(() => {
        const q = search.toLowerCase();
        return allServices.filter((svc) => {
            // Gender filter: show services from salons that serve this gender or Unisex
            const pg = svc.parlour_gender || 'Unisex';
            const genderMatch = pg === 'Unisex' || pg === gender;
            if (!genderMatch) return false;

            // Category filter
            if (activeCat !== 'All' && svc.category !== activeCat) return false;

            // Search filter
            if (q) {
                const inName    = (svc.service_name || '').toLowerCase().includes(q);
                const inDesc    = (svc.description  || '').toLowerCase().includes(q);
                const inParlour = (svc.parlour_name || '').toLowerCase().includes(q);
                if (!inName && !inDesc && !inParlour) return false;
            }

            return true;
        });
    }, [allServices, gender, activeCat, search]);

    // Group filtered services by category
    const groupedServices = useMemo(() => {
        const groups = {};
        for (const svc of filteredServices) {
            const cat = svc.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(svc);
        }
        // If a specific category is selected, show only that group
        if (activeCat !== 'All') {
            return groups[activeCat] ? { [activeCat]: groups[activeCat] } : {};
        }
        return groups;
    }, [filteredServices, activeCat]);

    const totalCount = filteredServices.length;

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-base)' }}>

            {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-6 py-7">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">
                                Live Catalogue — From Registered Parlours
                            </p>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                Spa & Skin Services
                            </h1>
                            <p className="text-xs text-gray-400 mt-1">
                                {loading
                                    ? 'Loading services…'
                                    : apiError
                                        ? 'Could not load services.'
                                        : `${totalCount} ${totalCount === 1 ? 'service' : 'services'} available — select one to book.`}
                            </p>
                        </div>


                    </div>
                </div>
            </div>

            {/* ── TOOLBAR ───────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">

                        {/* Search */}
                        <div className="relative w-full sm:w-72 shrink-0">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                type="text"
                                placeholder="Search by service or parlour name…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl
                                           focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
                                           bg-gray-50 placeholder:text-gray-400 text-gray-700 transition-all"
                            />
                        </div>

                        {/* Category tabs — only show real categories from API */}
                        <div className="flex gap-1.5 flex-wrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCat(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap
                                        ${activeCat === cat
                                            ? 'bg-violet-600 text-white shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-100 border border-gray-200 bg-white hover:border-violet-200'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONTENT ───────────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* API error */}
                {!loading && apiError && (
                    <ErrorState onRetry={fetchServices} />
                )}

                {/* No results */}
                {!loading && !apiError && Object.keys(groupedServices).length === 0 && (
                    <EmptyState search={search} onClear={() => setSearch('')} />
                )}

                {/* Service groups */}
                {!loading && !apiError && Object.entries(groupedServices).map(([cat, svcs]) => {
                    const catStyle = getCategoryStyle(cat);
                    return (
                        <section key={cat} className="animate-fade-in-up">
                            {/* Category heading */}
                            <div className="flex items-center gap-3 mb-5">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-xl ${catStyle.bg}`}>
                                    {catStyle.icon}
                                </span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900">{cat}</h2>
                                    <p className="text-[10px] text-gray-400">
                                        {svcs.length} {svcs.length === 1 ? 'service' : 'services'}
                                    </p>
                                </div>
                                <div className="flex-1 h-px bg-gray-100 ml-2" />
                            </div>

                            {/* Cards grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {svcs.map((svc, i) => (
                                    <ServiceCard
                                        key={`${svc.parlour_id}-${svc.service_name}-${i}`}
                                        svc={svc}
                                        onBook={setSelectedSvc}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            {/* ── BOOKING MODAL ──────────────────────────────────────────────── */}
            {selectedSvc && (
                <BookingModal
                    svc={selectedSvc}
                    onClose={() => setSelectedSvc(null)}
                />
            )}
        </div>
    );
};

export default ServicesPage;
