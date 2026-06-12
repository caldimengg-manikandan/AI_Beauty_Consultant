import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiMapPin, FiTrendingUp, FiUsers, FiStar, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const BRANCHES = [
  { id: 1, name: 'Koramangala Flagship', city: 'Bangalore', mgr: 'Priya Nair',    revenue: 182000, rating: 4.8, staff: 12, bookings: 340, trend: +12, color: 'from-violet-500 to-purple-600' },
  { id: 2, name: 'Indiranagar',          city: 'Bangalore', mgr: 'Rohit Sharma',  revenue: 124000, rating: 4.5, staff: 8,  bookings: 218, trend: +5,  color: 'from-teal-500 to-emerald-600' },
  { id: 3, name: 'Whitefield',           city: 'Bangalore', mgr: 'Divya Menon',   revenue: 98000,  rating: 4.3, staff: 6,  bookings: 176, trend: -3,  color: 'from-amber-500 to-orange-600' },
  { id: 4, name: 'MG Road',              city: 'Bangalore', mgr: 'Anil Kumar',    revenue: 156000, rating: 4.6, staff: 10, bookings: 295, trend: +9,  color: 'from-rose-500 to-pink-600'    },
  { id: 5, name: 'HSR Layout',           city: 'Bangalore', mgr: 'Sneha Patil',   revenue: 87000,  rating: 4.2, staff: 5,  bookings: 149, trend: +2,  color: 'from-blue-500 to-indigo-600'  },
];

const REVENUE_CHART = BRANCHES.map(b => ({ name: b.name.split(' ')[0], revenue: b.revenue }));

const METRICS = [
  { label: 'Total Revenue', value: `₹${(BRANCHES.reduce((s,b)=>s+b.revenue,0)/1000).toFixed(0)}k`, icon: <FiTrendingUp/>, color: 'from-violet-500 to-purple-600' },
  { label: 'Total Staff',   value: BRANCHES.reduce((s,b)=>s+b.staff,0),                             icon: <FiUsers/>,      color: 'from-teal-500 to-emerald-600' },
  { label: 'Avg Rating',    value: (BRANCHES.reduce((s,b)=>s+b.rating,0)/BRANCHES.length).toFixed(1), icon: <FiStar/>,     color: 'from-amber-500 to-orange-600' },
  { label: 'Branches',      value: BRANCHES.length,                                                  icon: <FiMapPin/>,     color: 'from-rose-500 to-pink-600'    },
];

export default function FranchiseHQ() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map(m => (
          <motion.div key={m.label} whileHover={{ y: -3 }}
            className={`bg-gradient-to-br ${m.color} text-white rounded-2xl p-4 shadow-lg`}>
            <div className="text-xl mb-2 opacity-80">{m.icon}</div>
            <div className="text-2xl font-black">{m.value}</div>
            <div className="text-[11px] font-semibold opacity-75 mt-0.5">{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-800 mb-1">Revenue by Branch</h3>
        <p className="text-[11px] text-slate-400 mb-4">This month's performance</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={REVENUE_CHART} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
            <Tooltip formatter={v=>[`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
            <Bar dataKey="revenue" fill="#7c3aed" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Branch Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-800">All Locations</h3>
        {BRANCHES.map((branch, idx) => (
          <motion.div key={branch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header row */}
            <button className="w-full text-left p-4 flex items-center gap-4" onClick={() => setExpanded(expanded === branch.id ? null : branch.id)}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${branch.color} flex items-center justify-center text-white text-sm font-black shrink-0`}>
                {branch.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{branch.name}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1"><FiMapPin size={10}/>{branch.city} · {branch.mgr}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-800">₹{(branch.revenue/1000).toFixed(0)}k</p>
                <p className={`text-[11px] font-bold ${branch.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {branch.trend >= 0 ? '▲' : '▼'} {Math.abs(branch.trend)}%
                </p>
              </div>
              <div className="ml-2 text-slate-400">
                {expanded === branch.id ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === branch.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-slate-100 px-4 pb-4">
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: 'Staff',     value: branch.staff    },
                    { label: 'Bookings',  value: branch.bookings },
                    { label: 'Rating',    value: `⭐ ${branch.rating}` },
                  ].map(d => (
                    <div key={d.label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-base font-black text-slate-800">{d.value}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{d.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 text-xs font-black bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100">View Report</button>
                  <button className="flex-1 py-2 text-xs font-black bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">Message Manager</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
