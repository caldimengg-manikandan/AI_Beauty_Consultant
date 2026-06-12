import React, { useState, useEffect } from 'react';
import {
  FaStore, FaCalendarAlt, FaStar, FaCheckCircle, FaTimes,
  FaEdit, FaClock, FaUsers, FaChartBar, FaToggleOn, FaToggleOff,
  FaPhone, FaMapMarkerAlt, FaPlus, FaTrash, FaSave
} from 'react-icons/fa';
import { getMySalon, registerSalon, updateMySalon, getOwnerBookings, updateBookingStatus } from '../../services/salonApi';
import { toast } from 'react-toastify';

// ── Core B2B Modules ──────────────────────────────────────────────────────────
import StaffManagement from '../partner/StaffManagement';
import BusinessInsights from '../partner/BusinessInsights';
import LiveWaitlist from '../partner/LiveWaitlist';

// ── Extended Enterprise Modules ───────────────────────────────────────────────
import MarketingTools from '../partner/MarketingTools';
import DeveloperAPI from '../partner/DeveloperAPI';
import ClientIntelligence from '../partner/ClientIntelligence';
import NoShowPredictor from '../partner/NoShowPredictor';

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const SERVICES_LIST = ['Facial', 'Threading', 'Waxing', 'Bridal Makeup', 'Hair Cut', 'Hair Color',
  'Keratin', 'Beard Styling', 'Mani-Pedi', 'Nail Art', 'Head Massage', 'Body Massage',
  'Hot Stone', 'Aromatherapy', 'Hair Spa', 'HydraFacial', 'Anti-Aging', 'Pedicure'];

const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    <input className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" {...props} />
  </div>
);

// ── Registration Form ──────────────────────────────────────────────────────────
const RegisterForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: '', owner_name: '', phone: '', email: '', address: '',
    city: '', pincode: '', salon_type: 'parlour', gender_served: 'Female',
    description: '', services_offered: [], opening_time: '9:00 AM',
    closing_time: '8:00 PM', slot_duration_minutes: 60, max_concurrent_slots: 3,
  });
  const [saving, setSaving] = useState(false);

  const toggleService = (s) => setForm(f => ({
    ...f,
    services_offered: f.services_offered.includes(s)
      ? f.services_offered.filter(x => x !== s)
      : [...f.services_offered, s]
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.services_offered.length === 0) { toast.error('Select at least one service'); return; }
    setSaving(true);
    try {
      await registerSalon(form);
      toast.success('Salon registered successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-500 rounded-xl flex items-center justify-center text-white">
          <FaStore />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Register Your Salon</h2>
          <p className="text-xs text-gray-500">List your business on the marketplace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Salon / Parlour Name *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bliss Beauty Parlour" />
          <Field label="Owner Name *" required value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Your full name" />
          <Field label="Phone *" required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
          <Field label="Email *" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="salon@email.com" />
          <Field label="City *" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Chennai" />
          <Field label="Pincode *" required value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="600001" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Full Address *</label>
          <textarea required rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, Area, Landmark" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Type</label>
            <select value={form.salon_type} onChange={e => setForm(f => ({ ...f, salon_type: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              <option value="parlour">Parlour</option>
              <option value="salon">Salon</option>
              <option value="spa">Spa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Serves</label>
            <select value={form.gender_served} onChange={e => setForm(f => ({ ...f, gender_served: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              <option>Female</option><option>Male</option><option>Unisex</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Opens At</label>
            <select value={form.opening_time} onChange={e => setForm(f => ({ ...f, opening_time: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              {['7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Closes At</label>
            <select value={form.closing_time} onChange={e => setForm(f => ({ ...f, closing_time: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              {['6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Slot Duration (mins)</label>
            <select value={form.slot_duration_minutes} onChange={e => setForm(f => ({ ...f, slot_duration_minutes: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              {[30,45,60,90].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Max Bookings/Slot</label>
            <select value={form.max_concurrent_slots} onChange={e => setForm(f => ({ ...f, max_concurrent_slots: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">Services Offered *</label>
          <div className="flex flex-wrap gap-2">
            {SERVICES_LIST.map(s => (
              <button key={s} type="button" onClick={() => toggleService(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${form.services_offered.includes(s) ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell customers what makes your salon special..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
        </div>

        <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering...</> : <><FaStore /> Register My Salon</>}
        </button>
      </form>
    </div>
  );
};

// ── Owner Dashboard ────────────────────────────────────────────────────────────

// Map URL section names to internal tab keys
const SECTION_TO_TAB = {
  staff: 'staff',
  campaigns: 'marketing',
  coupons: 'marketing',
  insights: 'insights',
  forms: 'forms',
  webhooks: 'developer',
};

const ShopOwnerDashboard = ({ section }) => {
  const [salon, setSalon] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNoSalon, setHasNoSalon] = useState(false);
  // If a section prop is passed (from sidebar nav), use its mapped tab as default
  const [activeTab, setActiveTab] = useState(SECTION_TO_TAB[section] || 'bookings');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await getMySalon();
      setSalon(s);
      const b = await getOwnerBookings();
      setBookings(b);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setHasNoSalon(true);
      } else if (status === 403) {
        toast.error('Access denied. Please log in as a Shop Owner.');
      } else if (status !== 401) {
        // 401 is handled by the global interceptor (auto-redirect to login)
        toast.error('Failed to load salon data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      toast.success(`Booking marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filterDate && b.appointment_date !== filterDate) return false;
    if (filterStatus && b.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: bookings.length,
    today: bookings.filter(b => b.appointment_date === new Date().toISOString().split('T')[0]).length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (hasNoSalon) return <RegisterForm onSuccess={loadData} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-pink-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="absolute right-6 top-4 text-7xl opacity-10">🏪</div>
        <div className="relative z-10">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Shop Owner Portal</p>
          <h1 className="text-2xl font-bold">{salon?.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
            <span className="flex items-center gap-1"><FaMapMarkerAlt /> {salon?.city}</span>
            <span className="flex items-center gap-1"><FaStar className="text-amber-300" /> {(salon?.avg_rating || 0).toFixed(1)} ({salon?.review_count || 0} reviews)</span>
            <span className={`flex items-center gap-1 ${salon?.is_active ? 'text-green-300' : 'text-red-300'}`}>
              {salon?.is_active ? <FaToggleOn /> : <FaToggleOff />} {salon?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings', value: stats.total, icon: <FaCalendarAlt />, color: 'from-purple-500 to-purple-600' },
          { label: "Today's Slots", value: stats.today, icon: <FaClock />, color: 'from-teal-500 to-teal-600' },
          { label: 'Confirmed', value: stats.confirmed, icon: <FaCheckCircle />, color: 'from-green-500 to-green-600' },
          { label: 'Completed', value: stats.completed, icon: <FaChartBar />, color: 'from-blue-500 to-blue-600' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-white/80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {[
          ['bookings',   '📅 Bookings'],
          ['waitlist',   '⏳ Waitlist'],
          ['insights',   '📊 AI Insights'],
          ['staff',      '👥 Staff'],
          ['marketing',  '📣 Marketing'],
          ['developer',  '🔑 Developer API'],
          ['clients',    '🧠 Client Intel'],
          ['noshow',     '🔔 No-Show AI'],
          ['profile',    '🏪 My Profile'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === k ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Bookings tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              <option value="">All Status</option>
              {['pending','confirmed','completed','cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
            {(filterDate || filterStatus) && (
              <button onClick={() => { setFilterDate(''); setFilterStatus(''); }}
                className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors flex items-center gap-1">
                <FaTimes /> Clear
              </button>
            )}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
              <FaCalendarAlt className="text-4xl text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-600">No bookings found</p>
              <p className="text-sm text-gray-400 mt-1">Bookings from customers will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{b.customer_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{b.service_name} · {b.appointment_date} at {b.appointment_time}</p>
                      {b.customer_phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><FaPhone className="text-[9px]" /> {b.customer_phone}</p>}
                      {b.notes && <p className="text-xs text-gray-400 italic mt-1">"{b.notes}"</p>}
                      <p className="text-[10px] text-gray-300 mt-1 font-mono">{b.booking_ref}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {b.status !== 'completed' && (
                        <button onClick={() => handleStatusChange(b.id, 'completed')}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
                          Done
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button onClick={() => handleStatusChange(b.id, 'cancelled')}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === 'profile' && salon && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Salon Profile</h2>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${salon.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {salon.is_verified ? 'Verified ✓' : 'Verification Pending'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Name', salon.name], ['Type', salon.salon_type],
                ['Serves', salon.gender_served], ['City', salon.city],
                ['Hours', `${salon.opening_time} – ${salon.closing_time}`],
                ['Slot', `${salon.slot_duration_minutes} mins`],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{k}</p>
                  <p className="font-semibold text-gray-800 mt-0.5 capitalize">{v}</p>
                </div>
              ))}
            </div>
            
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">About</p>
              <p className="text-sm text-gray-500 leading-relaxed">{salon.description || 'No description provided.'}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {salon.services_offered?.map(s => (
                  <span key={s} className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaEdit className="text-purple-500" /> Update Salon Info
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updates = {
                name: formData.get('name'),
                description: formData.get('description'),
                opening_time: formData.get('opening_time'),
                closing_time: formData.get('closing_time'),
                slot_duration_minutes: Number(formData.get('slot_duration_minutes')),
                max_concurrent_slots: Number(formData.get('max_concurrent_slots')),
              };
              try {
                await updateMySalon(updates);
                toast.success('Salon updated successfully!');
                loadData();
              } catch (err) {
                toast.error('Update failed');
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Salon Name</label>
                  <input name="name" defaultValue={salon.name} className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Slot Duration (mins)</label>
                  <select name="slot_duration_minutes" defaultValue={salon.slot_duration_minutes} className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none">
                    {[30, 45, 60, 90].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Opens At</label>
                  <input name="opening_time" defaultValue={salon.opening_time} className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Closes At</label>
                  <input name="closing_time" defaultValue={salon.closing_time} className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Max Bookings/Slot</label>
                  <input type="number" name="max_concurrent_slots" defaultValue={salon.max_concurrent_slots} className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                <textarea name="description" defaultValue={salon.description} rows={3} className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none resize-none" />
              </div>
              <button type="submit" className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2">
                <FaSave /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Core Tabs */}
      {activeTab === 'waitlist'  && <LiveWaitlist salonId={salon?.id} />}
      {activeTab === 'insights'  && <BusinessInsights />}
      {activeTab === 'staff'     && <StaffManagement />}

      {/* Extended Enterprise Modules */}
      {activeTab === 'marketing' && <MarketingTools />}
      {activeTab === 'developer' && <DeveloperAPI />}
      {activeTab === 'clients'   && <ClientIntelligence />}
      {activeTab === 'noshow'    && <NoShowPredictor />}

    </div>
  );
};

export default ShopOwnerDashboard;
