import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaMapMarkerAlt, FaStar, FaRegStar, FaStarHalfAlt,
  FaFilter, FaHeart, FaRegHeart, FaSpa, FaCut, FaLeaf,
  FaClock, FaArrowRight, FaTimes, FaChevronDown, FaStore,
  FaUsers, FaCalendarCheck, FaShieldAlt, FaCheckCircle
} from 'react-icons/fa';
import { listSalons, getNearbySalons } from '../../services/salonApi';

// ─── UTILS & HELPERS ────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  parlour: { label: 'Parlour', icon: <FaLeaf />, color: 'bg-rose-100 text-rose-700' },
  salon:   { label: 'Salon',   icon: <FaCut />,  color: 'bg-purple-100 text-purple-700' },
  spa:     { label: 'Spa',     icon: <FaSpa />,  color: 'bg-teal-100 text-teal-700' },
};

const cities = ['Chennai', 'Bangalore', 'Mumbai', 'Hyderabad', 'Pune', 'Delhi', 'Kolkata'];

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

// ─── PREMIUM SALON CARD ───────────────────────────────────────────────────────
const SalonCard = ({ salon, onBook, onViewDetails }) => {
  const [liked, setLiked] = useState(false);
  
  // Safe Accessors
  const name = salon?.name || 'Unnamed Business';
  const ownerName = salon?.owner_name || 'Owner';
  const salonType = salon?.salon_type?.toLowerCase() || 'salon';
  const typeCfg = TYPE_CONFIG[salonType] || TYPE_CONFIG.salon;
  const rating = Number(salon?.avg_rating || 0);
  const reviewCount = salon?.review_count || 0;
  const address = salon?.address || '';
  const city = salon?.city || '';
  const distance = salon?.distance_km;
  const services = salon?.services_offered || [];
  const minPrice = salon?.avg_service_price;
  
  // Real Cover Image or Gradient Fallback
  const coverUrl = salon?.cover_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=512&font-size=0.33`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group h-full">
      
      {/* ── Image Header ── */}
      <div className="relative h-48 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => onViewDetails(salon)}>
        <img 
          src={coverUrl} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Verification Badge */}
        {salon?.is_active && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-emerald-700 shadow-sm">
            <FaCheckCircle className="text-emerald-500" /> Verified
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          {liked ? <FaHeart className="text-rose-500 text-sm" /> : <FaRegHeart className="text-gray-400 text-sm" />}
        </button>

        {/* Gender Served Badge */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-white/95 text-gray-800 shadow-sm uppercase tracking-wide">
          {salon?.gender_served === 'Female' ? '👩 For Her' : salon?.gender_served === 'Male' ? '👨 For Him' : '👥 Unisex'}
        </span>
        
        {/* Type Icon floating */}
        <div className={`absolute bottom-[-16px] right-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-2 border-white ${typeCfg.color}`}>
          {typeCfg.icon}
        </div>
      </div>

      {/* ── Card Content ── */}
      <div className="p-5 flex flex-col flex-1 gap-3.5">
        
        {/* Title Row */}
        <div>
          <div className="flex justify-between items-start">
            <h3 
              onClick={() => onViewDetails(salon)}
              className="font-extrabold text-gray-900 text-lg leading-tight group-hover:text-purple-700 transition-colors cursor-pointer line-clamp-1"
            >
              {name}
            </h3>
          </div>
          <p className="text-[11px] font-medium text-gray-500 mt-0.5">by {ownerName}</p>
          
          <div className="flex items-center gap-2 mt-1.5">
            {rating > 0 ? (
              <>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <FaStar className="text-[9px]" /> {rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">({reviewCount} reviews)</span>
              </>
            ) : (
              <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                New Business
              </span>
            )}
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-2 mt-1">
          <div className="flex items-start justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-start gap-1.5 line-clamp-1">
              <FaMapMarkerAlt className="text-rose-400 mt-0.5 shrink-0" />
              <span>{address ? `${address}, ${city}` : city}</span>
            </div>
            {distance !== undefined && distance !== null && (
              <span className="font-bold text-rose-600 shrink-0 bg-rose-50 px-1.5 py-0.5 rounded-md text-[10px]">
                📍 {distance} km Away
              </span>
            )}
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <FaStore className="text-purple-400 shrink-0" />
              <span className="font-medium">{services.length} Services</span>
            </div>
            {minPrice > 0 && (
              <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                From ₹{minPrice}
              </div>
            )}
          </div>
        </div>

        {/* Services Tags */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 mt-auto">
            {services.slice(0, 3).map((s, idx) => (
              <span key={idx} className="text-[10px] font-medium bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100">
                {s}
              </span>
            ))}
            {services.length > 3 && (
              <span className="text-[10px] font-medium text-gray-400 px-1 py-1">+{services.length - 3}</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-1">
          <button
            onClick={() => onViewDetails(salon)}
            className="flex-1 py-2.5 text-xs font-bold border-2 border-purple-100 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => onBook(salon)}
            className="flex-1 py-2.5 text-xs font-bold bg-gray-900 text-white rounded-xl hover:bg-purple-600 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            Book Now <FaArrowRight className="text-[10px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 h-[420px] animate-pulse overflow-hidden flex flex-col">
    <div className="h-48 bg-gray-200" />
    <div className="p-5 space-y-4">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
      </div>
      <div className="flex gap-2 pt-4 mt-auto">
        <div className="h-10 bg-gray-200 rounded-xl flex-1" />
        <div className="h-10 bg-gray-200 rounded-xl flex-1" />
      </div>
    </div>
  </div>
);

// ─── MAIN MARKETPLACE COMPONENT ───────────────────────────────────────────────
const SalonMarketplace = () => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Geolocation & Nearby
  const [nearbySalons, setNearbySalons] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ city: '', salon_type: '', gender_served: '', price_range: '', min_rating: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLocationAndNearby = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });
          setLocationError(null);
          try {
            const res = await getNearbySalons(latitude, longitude, { radius_km: 25, limit: 10 });
            if (res && res.salons) setNearbySalons(res.salons);
          } catch (err) {
            console.error("Failed to load nearby salons", err);
          }
        },
        (err) => {
          console.warn(err);
          setLocationError("Enable location to discover nearby salons.");
        }
      );
    }
  }, []);

  // Default Load (No Geolocation dependency for main list)
  const fetchSalons = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = { page, limit: 12 };
      if (filters.city) params.city = filters.city;
      if (filters.salon_type) params.salon_type = filters.salon_type;
      if (filters.gender_served) params.gender_served = filters.gender_served;
      if (filters.price_range) params.price_range = filters.price_range;
      if (filters.min_rating) params.min_rating = parseFloat(filters.min_rating);

      const data = await listSalons(params);
      
      if (data && Array.isArray(data.salons)) {
        setSalons(data.salons);
        setTotalPages(data.pages || 1);
      } else {
        setSalons([]);
      }
    } catch (err) {
      console.error("Failed to load salons:", err);
      setError(true);
      setSalons([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  useEffect(() => {
    fetchLocationAndNearby();
  }, [fetchLocationAndNearby]);

  const handleBook = (salon) => navigate(`/dashboard/salon/${salon.id}`, { state: { salon, activeTab: 'book' } });
  const handleViewDetails = (salon) => navigate(`/dashboard/salon/${salon.id}`, { state: { salon, activeTab: 'overview' } });

  // ── Smart Local Search (Fuzzy Logic + Nearby interpretation) ──
  const filteredSalons = useMemo(() => {
    if (!searchTerm.trim()) return salons;
    const term = searchTerm.toLowerCase().trim();
    const isNearbySearch = term.includes('near me') || term.includes('nearby');
    const cleanTerm = term.replace(/near me|nearby/g, '').trim();
    
    // Use nearbySalons if it's a nearby search, otherwise use the main list
    let sourceList = isNearbySearch && userLocation ? nearbySalons : salons;
    // If they said nearby but we don't have location, just fall back to standard filtering
    if (isNearbySearch && !userLocation && sourceList.length === 0) sourceList = salons;

    return sourceList.filter(s => {
      if (!cleanTerm) return true; // If they just typed "nearby"
      const nameMatch = s?.name?.toLowerCase().includes(cleanTerm);
      const ownerMatch = s?.owner_name?.toLowerCase().includes(cleanTerm);
      const addressMatch = s?.address?.toLowerCase().includes(cleanTerm);
      const cityMatch = s?.city?.toLowerCase().includes(cleanTerm);
      const servicesMatch = s?.services_offered?.some(service => service.toLowerCase().includes(cleanTerm));
      
      return nameMatch || ownerMatch || addressMatch || cityMatch || servicesMatch;
    });
  }, [salons, nearbySalons, searchTerm, userLocation]);

  // Ranking Priority: Verified -> Rating -> Review Count (if not actively sorting by something else)
  const sortedSalons = useMemo(() => {
    return [...filteredSalons].sort((a, b) => {
      // 1. Prioritize active/verified
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      // 2. Rating
      const ratingA = Number(a.avg_rating || 0);
      const ratingB = Number(b.avg_rating || 0);
      if (ratingA !== ratingB) return ratingB - ratingA;
      // 3. Review Count
      return (b.review_count || 0) - (a.review_count || 0);
    });
  }, [filteredSalons]);

  return (
    <div className="min-h-full pb-10">
      
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 rounded-2xl mb-8 p-10 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-10 text-8xl">✂️</div>
          <div className="absolute top-8 right-20 text-7xl">💆‍♀️</div>
          <div className="absolute bottom-4 left-1/3 text-6xl">🌿</div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4 border border-white/20">
            <FaShieldAlt className="text-emerald-400" /> Premium Marketplace
          </div>
          <h1 className="text-4xl font-extrabold mb-3 leading-tight">Find & Book Your <br/><span className="text-purple-400">Perfect Beauty Experience</span></h1>
          <p className="text-white/80 text-sm max-w-lg leading-relaxed">
            Discover top-rated, verified parlours, salons & spas near you. View portfolios, explore services, and book a slot instantly.
          </p>
          <div className="flex gap-5 mt-6 text-sm font-medium">
            <div className="flex items-center gap-2"><FaStore className="text-purple-400" /> Verified Shops</div>
            <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-rose-400" /> Location Discovery</div>
            <div className="flex items-center gap-2"><FaCalendarCheck className="text-teal-400" /> Instant Booking</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Smart Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search salons, owners, or services (e.g., 'Bridal Makeup nearby')..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50/50 transition-all font-medium"
            />
          </div>

          {/* City Select */}
          <div className="relative md:w-48">
            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
            <select
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
              className="w-full pl-10 pr-8 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50 appearance-none font-medium cursor-pointer"
            >
              <option value="">All Locations</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-sm font-bold transition-colors ${showFilters || Object.values(filters).some(v => v !== '') ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <FaFilter /> Filters
            {Object.values(filters).filter(v => v !== '').length > 0 && (
              <span className="w-5 h-5 flex items-center justify-center bg-purple-600 text-white rounded-full text-[10px]">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Type */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Business Type</label>
                <select
                  value={filters.salon_type}
                  onChange={e => setFilters(f => ({ ...f, salon_type: e.target.value }))}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                >
                  <option value="">Any Type</option>
                  <option value="parlour">Parlours</option>
                  <option value="salon">Salons</option>
                  <option value="spa">Spas</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Serves</label>
                <select
                  value={filters.gender_served}
                  onChange={e => setFilters(f => ({ ...f, gender_served: e.target.value }))}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                >
                  <option value="">Everyone</option>
                  <option value="Female">Female (For Her)</option>
                  <option value="Male">Male (For Him)</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Price Range</label>
                <select
                  value={filters.price_range}
                  onChange={e => setFilters(f => ({ ...f, price_range: e.target.value }))}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                >
                  <option value="">Any Price</option>
                  <option value="budget">Budget (₹0 - ₹500)</option>
                  <option value="mid">Standard (₹500 - ₹2000)</option>
                  <option value="premium">Premium (₹2000+)</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Minimum Rating</label>
                <select
                  value={filters.min_rating}
                  onChange={e => setFilters(f => ({ ...f, min_rating: e.target.value }))}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                >
                  <option value="">Any Rating</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
            </div>
            
            {/* Clear Filters */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setFilters({ city: '', salon_type: '', gender_served: '', price_range: '', min_rating: '' })}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── LOCATION PROMPT ERROR ── */}
      {locationError && !searchTerm && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-amber-500 text-xl" />
            <p className="text-sm font-bold text-amber-800">{locationError}</p>
          </div>
          <button onClick={fetchLocationAndNearby} className="text-xs font-bold bg-amber-200 text-amber-900 px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors shadow-sm">
            Allow Access
          </button>
        </div>
      )}

      {/* ── NEARBY SECTION (Only shows if no search term and location exists) ── */}
      {userLocation && nearbySalons.length > 0 && !searchTerm && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <FaMapMarkerAlt className="text-rose-500" /> Salons Near You
            </h2>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar snap-x">
            {nearbySalons.map(salon => (
              <div key={`nearby-${salon.id}`} className="min-w-[280px] sm:min-w-[320px] snap-start">
                <SalonCard salon={salon} onBook={handleBook} onViewDetails={handleViewDetails} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ALL RESULTS AREA ── */}
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-gray-900">
          {loading ? 'Discovering shops...' : searchTerm ? 'Search Results' : 'Explore All Salons'}
        </h2>
        {searchTerm && <p className="text-xs text-gray-500 mt-1">Results matching "{searchTerm}"</p>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="py-20 text-center bg-red-50 rounded-2xl border border-red-100">
          <FaStore className="text-4xl text-red-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-800">Unable to Load Salons</h3>
          <p className="text-sm text-red-600 mt-1">There was a problem connecting to the marketplace.</p>
          <button onClick={fetchSalons} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">Try Again</button>
        </div>
      ) : sortedSalons.length === 0 ? (
        <div className="py-24 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <FaSearch className="text-3xl text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {searchTerm && (searchTerm.includes('near') || searchTerm.includes('nearby')) 
              ? 'No nearby salons found.' 
              : 'No matching shops found'}
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm">We couldn't find any businesses that match your current search and filters. Try broadening your criteria or exploring all salons.</p>
          <button
            onClick={() => { setSearchTerm(''); setFilters({ city: '', salon_type: '', gender_served: '', price_range: '', min_rating: '' }); }}
            className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition-colors shadow-md"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedSalons.map(salon => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onBook={handleBook}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !searchTerm && (
            <div className="flex justify-center gap-2 mt-10">
              {Array(totalPages).fill(0).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-extrabold transition-all ${page === i + 1 ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
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
