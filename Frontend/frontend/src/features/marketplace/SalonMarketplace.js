import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaMapMarkerAlt, FaStar, FaRegStar, FaStarHalfAlt,
  FaFilter, FaHeart, FaRegHeart, FaSpa, FaCut, FaLeaf,
  FaClock, FaArrowRight, FaTimes, FaChevronDown, FaStore,
  FaUsers, FaCalendarCheck, FaShieldAlt
} from 'react-icons/fa';
import { listSalons } from '../../services/salonApi';

// ─── Star renderer ────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 'sm' }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const cls = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex gap-0.5 ${cls}`}>
      {Array(full).fill(0).map((_, i) => <FaStar key={`f${i}`} className="text-amber-400" />)}
      {half && <FaStarHalfAlt className="text-amber-400" />}
      {Array(empty).fill(0).map((_, i) => <FaRegStar key={`e${i}`} className="text-gray-300" />)}
    </span>
  );
};

// ─── Salon type config ────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  parlour: { label: 'Parlour', icon: <FaLeaf />, color: 'bg-rose-100 text-rose-700' },
  salon:   { label: 'Salon',   icon: <FaCut />,  color: 'bg-purple-100 text-purple-700' },
  spa:     { label: 'Spa',     icon: <FaSpa />,  color: 'bg-teal-100 text-teal-700' },
};

// ─── Demo seed data (used when backend is not yet seeded) ─────────────────────
const DEMO_SALONS = [
  { id: 'd1', name: 'Bliss Beauty Parlour', salon_type: 'parlour', gender_served: 'Female', city: 'Chennai', address: '12, Anna Salai, Teynampet', avg_rating: 4.8, review_count: 124, is_active: true, description: 'Premium skincare, threading, and bridal packages.', services_offered: ['Facial', 'Threading', 'Waxing', 'Bridal Makeup'], opening_time: '9:00 AM', closing_time: '8:00 PM' },
  { id: 'd2', name: 'Royal Unisex Salon', salon_type: 'salon', gender_served: 'Unisex', city: 'Chennai', address: '45, T. Nagar, Pondy Bazaar', avg_rating: 4.6, review_count: 89, is_active: true, description: 'Hair styling, colouring, and keratin treatments.', services_offered: ['Hair Cut', 'Hair Color', 'Keratin', 'Beard Styling'], opening_time: '10:00 AM', closing_time: '9:00 PM' },
  { id: 'd3', name: 'Serenity Spa & Wellness', salon_type: 'spa', gender_served: 'Unisex', city: 'Bangalore', address: '8, Indiranagar 100ft Road', avg_rating: 4.9, review_count: 213, is_active: true, description: 'Full-body massages, aromatherapy, and detox therapies.', services_offered: ['Swedish Massage', 'Hot Stone', 'Aromatherapy', 'Body Wrap'], opening_time: '9:00 AM', closing_time: '9:00 PM' },
  { id: 'd4', name: "Gentleman's Grooming Studio", salon_type: 'salon', gender_served: 'Male', city: 'Mumbai', address: '22, Bandra West, Linking Road', avg_rating: 4.7, review_count: 156, is_active: true, description: 'Haircuts, beard sculpting, and skin care for men.', services_offered: ['Hair Cut', 'Beard Trim', 'Facial', 'Head Massage'], opening_time: '8:00 AM', closing_time: '9:00 PM' },
  { id: 'd5', name: 'Glow & Glamour Beauty Lounge', salon_type: 'parlour', gender_served: 'Female', city: 'Hyderabad', address: '56, Jubilee Hills Road No 36', avg_rating: 4.5, review_count: 78, is_active: true, description: 'Anti-ageing facials, hydra facials, and nail studio.', services_offered: ['HydraFacial', 'Anti-Aging', 'Nail Art', 'Mani-Pedi'], opening_time: '10:00 AM', closing_time: '8:00 PM' },
  { id: 'd6', name: 'The Lotus Ayurvedic Spa', salon_type: 'spa', gender_served: 'Unisex', city: 'Pune', address: '3, Koregaon Park Lane', avg_rating: 4.9, review_count: 302, is_active: true, description: 'Authentic Ayurvedic treatments, Panchakarma, and herbal therapies.', services_offered: ['Abhyanga', 'Shirodhara', 'Panchakarma', 'Herbal Steam'], opening_time: '7:00 AM', closing_time: '8:00 PM' },
];

// ─── Salon Card ───────────────────────────────────────────────────────────────
const SalonCard = ({ salon, onBook, onViewDetails }) => {
  const [liked, setLiked] = useState(false);
  const typeCfg = TYPE_CONFIG[salon.salon_type] || TYPE_CONFIG.salon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Gradient header band */}
      <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-400 to-teal-400" />

      {/* Card image placeholder with gradient */}
      <div className="relative h-40 bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center overflow-hidden">
        <div className="text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
          {typeCfg.icon}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">
            {salon.salon_type === 'spa' ? '🌿' : salon.salon_type === 'parlour' ? '💆‍♀️' : '✂️'}
          </span>
        </div>

        {/* Like button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          {liked
            ? <FaHeart className="text-rose-500 text-sm" />
            : <FaRegHeart className="text-gray-400 text-sm" />}
        </button>

        {/* Type badge */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${typeCfg.color}`}>
          {typeCfg.icon} {typeCfg.label}
        </span>

        {/* Gender badge */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/90 text-gray-600 shadow-sm">
          {salon.gender_served === 'Female' ? '👩' : salon.gender_served === 'Male' ? '👨' : '👥'} {salon.gender_served}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Name & rating */}
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-purple-700 transition-colors">
            {salon.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={salon.avg_rating || 0} />
            <span className="text-xs font-semibold text-gray-700">{(salon.avg_rating || 0).toFixed(1)}</span>
            <span className="text-xs text-gray-400">({salon.review_count || 0} reviews)</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-1.5 text-xs text-gray-500">
          <FaMapMarkerAlt className="text-rose-400 mt-0.5 shrink-0" />
          <span className="line-clamp-1">{salon.address}, {salon.city}</span>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FaClock className="text-teal-400 shrink-0" />
          <span>{salon.opening_time} – {salon.closing_time}</span>
        </div>

        {/* Services chips */}
        {salon.services_offered?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {salon.services_offered.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                {s}
              </span>
            ))}
            {salon.services_offered.length > 3 && (
              <span className="text-[10px] text-gray-400 px-1 py-0.5">+{salon.services_offered.length - 3} more</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onViewDetails(salon)}
            className="flex-1 py-2 text-xs font-semibold border border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onBook(salon)}
            className="flex-1 py-2 text-xs font-semibold bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-xl hover:shadow-md hover:scale-105 transition-all flex items-center justify-center gap-1"
          >
            Book Slot <FaArrowRight className="text-[9px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Marketplace Page ────────────────────────────────────────────────────
const SalonMarketplace = () => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', salon_type: '', gender_served: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usedDemo, setUsedDemo] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);

  const fetchNearby = async (lat, lon) => {
    setLoading(true);
    try {
      const { getNearbySalons, fetchRealWorldSalons } = await import('../../services/salonApi');
      
      // 1. Try to get registered salons from DB
      const dbData = await getNearbySalons(lat, lon, { radius_km: 15, limit: 10 });
      let finalSalons = dbData.salons || [];
      
      // 2. Scrape real-world salons from OpenStreetMap to augment the list
      const osmSalons = await fetchRealWorldSalons(lat, lon, 10000); // 10km radius
      
      // 3. Merge them, keeping DB salons first
      if (osmSalons.length > 0) {
        finalSalons = [...finalSalons, ...osmSalons];
      }
      
      if (finalSalons.length > 0) {
        setSalons(finalSalons);
        setUsedDemo(false);
      } else {
        setSalons(DEMO_SALONS);
        setUsedDemo(true);
      }
    } catch {
      setSalons(DEMO_SALONS);
      setUsedDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setUserLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setNearMeActive(true);
        setLocationLoading(false);
        fetchNearby(latitude, longitude);
      },
      (err) => {
        setLocationLoading(false);
        alert('Location access denied. Please enable location in your browser settings.');
      }
    );
  };

  const fetchSalons = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filters.city) params.city = filters.city;
      if (filters.salon_type) params.salon_type = filters.salon_type;
      if (filters.gender_served) params.gender_served = filters.gender_served;
      if (filters.search) params.search = filters.search;

      const data = await listSalons(params);
      if (data.salons?.length > 0) {
        setSalons(data.salons);
        setTotalPages(data.pages || 1);
        setUsedDemo(false);
      } else {
        // Fallback to demo data with local filter
        let filtered = DEMO_SALONS;
        if (filters.city) filtered = filtered.filter(s => s.city.toLowerCase().includes(filters.city.toLowerCase()));
        if (filters.salon_type) filtered = filtered.filter(s => s.salon_type === filters.salon_type);
        if (filters.gender_served) filtered = filtered.filter(s => s.gender_served === filters.gender_served || s.gender_served === 'Unisex');
        if (filters.search) filtered = filtered.filter(s => s.name.toLowerCase().includes(filters.search.toLowerCase()) || s.address.toLowerCase().includes(filters.search.toLowerCase()));
        setSalons(filtered);
        setUsedDemo(true);
      }
    } catch {
      // fallback
      setSalons(DEMO_SALONS);
      setUsedDemo(true);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchSalons(); }, [fetchSalons]);

  const handleBook = (salon) => navigate(`/dashboard/salon/${salon.id}/book`);
  const handleViewDetails = (salon) => navigate(`/dashboard/salon/${salon.id}`);

  const cities = ['Chennai', 'Bangalore', 'Mumbai', 'Hyderabad', 'Pune', 'Delhi', 'Kolkata'];

  return (
    <div className="min-h-full">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-pink-600 to-teal-600 rounded-2xl mb-6 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-10 text-8xl">✂️</div>
          <div className="absolute top-8 right-20 text-7xl">💆‍♀️</div>
          <div className="absolute bottom-4 left-1/3 text-6xl">🌿</div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3">
            <FaStore /> Salon & Parlour Marketplace
          </div>
          <h1 className="text-3xl font-bold mb-2">Find & Book Your Perfect Beauty Experience</h1>
          <p className="text-white/80 text-sm">Discover top-rated parlours, salons & spas near you. Book a slot instantly, skip the wait.</p>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5"><FaStore className="text-white/70" /> 500+ Shops</div>
            <div className="flex items-center gap-1.5"><FaUsers className="text-white/70" /> 10K+ Happy Customers</div>
            <div className="flex items-center gap-1.5"><FaCalendarCheck className="text-white/70" /> Instant Booking</div>
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search salons, parlours, spas..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
            />
          </div>

          {/* Near Me Button */}
          <button
            onClick={handleNearMe}
            disabled={locationLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${nearMeActive
              ? 'bg-rose-500 text-white border-rose-500 shadow-md'
              : 'border-rose-200 text-rose-600 hover:bg-rose-50'
            } ${locationLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <FaMapMarkerAlt />
            {locationLoading ? 'Locating...' : nearMeActive ? 'Near Me ✓' : 'Near Me'}
          </button>

          {/* City select — hide when Near Me active */}
          {!nearMeActive && (
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 text-sm" />
              <select
                value={filters.city}
                onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 appearance-none"
              >
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 border border-purple-200 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors"
          >
            <FaFilter /> Filters
            {(filters.salon_type || filters.gender_served) && (
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Type</p>
              <div className="flex gap-1.5">
                {['', 'parlour', 'salon', 'spa'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilters(f => ({ ...f, salon_type: t }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filters.salon_type === t ? 'bg-purple-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t === '' ? 'All' : TYPE_CONFIG[t]?.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Serves</p>
              <div className="flex gap-1.5">
                {['', 'Female', 'Male', 'Unisex'].map(g => (
                  <button
                    key={g}
                    onClick={() => setFilters(f => ({ ...f, gender_served: g }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filters.gender_served === g ? 'bg-teal-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {g === '' ? 'All' : g}
                  </button>
                ))}
              </div>
            </div>
            {(filters.salon_type || filters.gender_served) && (
              <button
                onClick={() => setFilters(f => ({ ...f, salon_type: '', gender_served: '' }))}
                className="self-end flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {usedDemo && (
        <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
          <FaShieldAlt /> Showing demo listings. Register your salon or sign in to see real listings.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-80 animate-pulse">
              <div className="h-2 bg-gray-200 rounded-t-2xl" />
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : salons.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-bold text-gray-700">No salons found</p>
          <p className="text-sm text-gray-400 mt-1">Try different filters or search terms</p>
          <button
            onClick={() => setFilters({ city: '', salon_type: '', gender_served: '', search: '' })}
            className="mt-4 px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{salons.length}</span> results
              {filters.city && <> in <span className="font-semibold text-purple-600">{filters.city}</span></>}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {salons.map(salon => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onBook={handleBook}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          {!usedDemo && totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array(totalPages).fill(0).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${page === i + 1 ? 'bg-purple-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalonMarketplace;
