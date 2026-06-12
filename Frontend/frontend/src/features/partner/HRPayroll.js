import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUsers, FiDollarSign, FiCheckCircle, FiClock, FiAward, FiX, FiStar } from 'react-icons/fi';

const MOCK_STAFF = [
  { id: 1, name: 'Priya Mehta',    role: 'Senior Stylist',  avatar: 'PM', base: 28000, commission_pct: 12, bookings: 42, attendance: 96, rating: 4.9, joined: '2023-01' },
  { id: 2, name: 'Arjun Singh',    role: 'Colour Expert',   avatar: 'AS', base: 24000, commission_pct: 10, bookings: 38, attendance: 92, rating: 4.7, joined: '2023-06' },
  { id: 3, name: 'Kavya Rao',      role: 'Nail Technician', avatar: 'KR', base: 18000, commission_pct: 15, bookings: 55, attendance: 98, rating: 4.8, joined: '2024-02' },
  { id: 4, name: 'Rahul Sharma',   role: 'Barber',          avatar: 'RS', base: 20000, commission_pct: 10, bookings: 61, attendance: 89, rating: 4.5, joined: '2022-11' },
  { id: 5, name: 'Divya Nair',     role: 'Skin Therapist',  avatar: 'DN', base: 26000, commission_pct: 12, bookings: 29, attendance: 94, rating: 4.8, joined: '2024-05' },
  { id: 6, name: 'Sneha Kulkarni', role: 'Receptionist',    avatar: 'SK', base: 15000, commission_pct: 0,  bookings: 0,  attendance: 99, rating: 4.6, joined: '2023-09' },
];

const AVG_BOOKING_VALUE = 1800;
const COMMISSION_DATA = MOCK_STAFF.map(s => ({
  name: s.name.split(' ')[0],
  commission: Math.round(s.bookings * AVG_BOOKING_VALUE * s.commission_pct / 100),
  base: s.base,
}));

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-teal-500 to-emerald-600',
  'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600',
  'from-blue-500 to-indigo-600', 'from-fuchsia-500 to-violet-600',
];

export default function HRPayroll() {
  const [payrollDone, setPayrollDone]   = useState(false);
  const [running, setRunning]           = useState(false);
  const [selectedStaff, setSelected]    = useState(null);

  const totalBase       = MOCK_STAFF.reduce((s, st) => s + st.base, 0);
  const totalCommission = COMMISSION_DATA.reduce((s, d) => s + d.commission, 0);
  const totalPayroll    = totalBase + totalCommission;

  const handleRunPayroll = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setPayrollDone(true); }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff',      value: MOCK_STAFF.length,              color: 'from-violet-500 to-purple-600', icon: <FiUsers /> },
          { label: 'Base Payroll',     value: `₹${(totalBase/1000).toFixed(1)}k`,       color: 'from-blue-500 to-indigo-600',  icon: <FiDollarSign /> },
          { label: 'Total Commission', value: `₹${(totalCommission/1000).toFixed(1)}k`, color: 'from-teal-500 to-emerald-600', icon: <FiAward /> },
          { label: 'Total Payout',     value: `₹${(totalPayroll/1000).toFixed(1)}k`,    color: 'from-amber-500 to-orange-600', icon: <FiCheckCircle /> },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -3 }}
            className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4 shadow-lg`}>
            <div className="text-xl mb-2 opacity-80">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-[11px] font-semibold opacity-75 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Commission Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-800 mb-1">Commission Breakdown</h3>
        <p className="text-[11px] text-slate-400 mb-4">Base salary vs commission this month</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={COMMISSION_DATA} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
            <Tooltip formatter={(v,n)=>[`₹${v.toLocaleString()}`, n==='base'?'Base':'Commission']} contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
            <Bar dataKey="base"       name="base"       fill="#7c3aed" radius={[6,6,0,0]}/>
            <Bar dataKey="commission" name="commission" fill="#0d9488" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800">Staff & Payroll Details</h3>
          <AnimatePresence mode="wait">
            {payrollDone ? (
              <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                <FiCheckCircle className="text-emerald-500" /> Payroll Processed!
              </motion.div>
            ) : (
              <motion.button key="btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleRunPayroll} disabled={running}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-black rounded-xl shadow-lg disabled:opacity-60">
                {running ? (
                  <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Processing…</>
                ) : (
                  <><FiDollarSign /> Run Payroll — ₹{(totalPayroll/1000).toFixed(1)}k</>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Staff Member', 'Role', 'Bookings', 'Attendance', 'Base Pay', 'Commission', 'Total', 'Rating'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_STAFF.map((staff, idx) => {
                const commission = Math.round(staff.bookings * AVG_BOOKING_VALUE * staff.commission_pct / 100);
                const total = staff.base + commission;
                return (
                  <motion.tr key={staff.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelected(staff)}
                    className="hover:bg-violet-50/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[11px] font-black`}>
                          {staff.avatar}
                        </div>
                        <span className="font-semibold text-slate-800">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{staff.role}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{staff.bookings}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${staff.attendance >= 95 ? 'bg-emerald-500' : staff.attendance >= 85 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${staff.attendance}%` }}/>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{staff.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">₹{staff.base.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-teal-600">₹{commission.toLocaleString()}</td>
                    <td className="px-4 py-3 font-black text-slate-800">₹{total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <FiStar className="text-amber-400"/> {staff.rating}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Detail Drawer */}
      <AnimatePresence>
        {selectedStaff && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}/>
            <motion.div className="relative z-10 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm p-6"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-slate-800">Staff Profile</h2>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"><FiX/></button>
              </div>
              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-black mx-auto mb-3">
                  {selectedStaff.avatar}
                </div>
                <h3 className="text-lg font-black text-slate-800">{selectedStaff.name}</h3>
                <p className="text-sm text-slate-500">{selectedStaff.role}</p>
              </div>
              <div className="space-y-3">
                {[
                  ['Joined', selectedStaff.joined],
                  ['Bookings This Month', selectedStaff.bookings],
                  ['Attendance Rate', `${selectedStaff.attendance}%`],
                  ['Base Pay', `₹${selectedStaff.base.toLocaleString()}`],
                  ['Commission Rate', `${selectedStaff.commission_pct}%`],
                  ['Commission Earned', `₹${Math.round(selectedStaff.bookings * AVG_BOOKING_VALUE * selectedStaff.commission_pct / 100).toLocaleString()}`],
                  ['Client Rating', `⭐ ${selectedStaff.rating}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs text-slate-500 font-semibold">{k}</span>
                    <span className="text-sm font-bold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
