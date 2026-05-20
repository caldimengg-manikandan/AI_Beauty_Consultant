import { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiCalendar, FiDollarSign, FiChevronDown, FiX, FiCheck, FiSearch } from 'react-icons/fi';
import { getStaffList, addStaff, updateStaff, deactivateStaff, markAttendance, getStaffAnalytics } from '../../services/partnerApi';
import { toast } from 'react-toastify';

const ROLES = ['stylist', 'receptionist', 'manager', 'assistant'];
const SPECIALIZATIONS = ['hair', 'nails', 'facial', 'makeup', 'waxing', 'massage', 'color'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const initialForm = {
  name: '', phone: '', email: '', role: 'stylist',
  specializations: [], experience_years: 0,
  commission_rate: 10, shift_start: '09:00', shift_end: '18:00', days_off: []
};

export default function StaffManagement() {
  const [staff, setStaff]           = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(initialForm);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [selectedStaff, setSelected] = useState(null);
  const [attendanceModal, setAttModal] = useState(false);
  const [attForm, setAttForm]       = useState({ date: new Date().toISOString().slice(0,10), status: 'present', check_in: '09:00', check_out: '18:00' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([getStaffList(), getStaffAnalytics()]);
      setStaff(s);
      setAnalytics(a);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(initialForm); setEditingId(null); setShowModal(true); };
  const openEdit = (member) => {
    setForm({ ...initialForm, ...member });
    setEditingId(member.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast.warning('Name and phone are required');
    setSaving(true);
    try {
      if (editingId) { await updateStaff(editingId, form); toast.success('Staff updated'); }
      else { await addStaff(form); toast.success('Staff added'); }
      setShowModal(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Remove ${name} from staff?`)) return;
    try { await deactivateStaff(id); toast.success('Staff removed'); load(); }
    catch { toast.error('Failed to remove'); }
  };

  const handleMarkAttendance = async () => {
    if (!selectedStaff) return;
    try {
      await markAttendance({ staff_id: selectedStaff.id, ...attForm });
      toast.success('Attendance marked');
      setAttModal(false);
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const filtered = staff.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSpec = (spec) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter(s => s !== spec)
        : [...f.specializations, spec]
    }));
  };
  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      days_off: f.days_off.includes(day)
        ? f.days_off.filter(d => d !== day)
        : [...f.days_off, day]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Staff Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your team, attendance & commissions</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25">
          <FiPlus /> Add Staff
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Active', value: analytics.total_active, icon: <FiUsers />, color: 'indigo' },
            { label: 'Total Bookings Handled', value: analytics.staff?.reduce((a,s) => a+s.completed_bookings,0) || 0, icon: <FiCalendar />, color: 'teal' },
            { label: 'Total Revenue Generated', value: `₹${(analytics.staff?.reduce((a,s) => a+s.total_revenue,0)||0).toLocaleString()}`, icon: <FiDollarSign />, color: 'emerald' },
            { label: 'Top Performer', value: analytics.staff?.[0]?.name || 'N/A', icon: <FiCheck />, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className={`w-9 h-9 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search staff by name or role..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <FiUsers className="mx-auto text-4xl text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium">No staff found. Add your first team member!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-black">
                    {member.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{member.role} • {member.experience_years}yr exp</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(member)} className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600"><FiEdit2 size={14} /></button>
                  <button onClick={() => handleDeactivate(member.id, member.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><FiTrash2 size={14} /></button>
                </div>
              </div>

              {member.specializations?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {member.specializations.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold capitalize">{s}</span>
                  ))}
                </div>
              )}

              <div className="text-xs text-slate-500 space-y-1">
                <div>📞 {member.phone}</div>
                <div>⏰ {member.shift_start} – {member.shift_end}</div>
                <div>💰 {member.commission_rate}% commission</div>
              </div>

              <button
                onClick={() => { setSelected(member); setAttModal(true); }}
                className="mt-4 w-full py-2 text-xs font-bold text-indigo-600 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                Mark Attendance
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{editingId ? 'Edit Staff' : 'Add New Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><FiX /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'e.g. Priya Sharma' },
                { label: 'Phone *', key: 'phone', type: 'tel', placeholder: '+91 9876543210' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'priya@salon.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.key] || ''} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Experience (years)</label>
                  <input type="number" min={0} value={form.experience_years}
                    onChange={e => setForm(p => ({ ...p, experience_years: +e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Commission Rate (%)</label>
                <input type="number" min={0} max={100} value={form.commission_rate}
                  onChange={e => setForm(p => ({ ...p, commission_rate: +e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['shift_start', 'shift_end'].map(key => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{key === 'shift_start' ? 'Shift Start' : 'Shift End'}</label>
                    <input type="time" value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button key={s} onClick={() => toggleSpec(s)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${form.specializations.includes(s) ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Days Off</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => toggleDay(d)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${form.days_off.includes(d) ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {d.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {saving ? 'Saving...' : (editingId ? 'Update Staff' : 'Add Staff')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {attendanceModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Mark Attendance</h3>
              <button onClick={() => setAttModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><FiX /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Staff: {selectedStaff.name}</div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Date</label>
                <input type="date" value={attForm.date} onChange={e => setAttForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</label>
                <select value={attForm.status} onChange={e => setAttForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['present', 'absent', 'half_day', 'leave'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              {attForm.status !== 'absent' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Check In</label>
                    <input type="time" value={attForm.check_in} onChange={e => setAttForm(f => ({ ...f, check_in: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Check Out</label>
                    <input type="time" value={attForm.check_out} onChange={e => setAttForm(f => ({ ...f, check_out: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setAttModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
              <button onClick={handleMarkAttendance} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
