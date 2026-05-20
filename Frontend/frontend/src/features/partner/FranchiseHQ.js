import React, { useState, useEffect, useCallback } from 'react';
import { FiGrid, FiTrendingUp, FiUsers, FiMapPin, FiRepeat, FiAward } from 'react-icons/fi';
import { getFranchiseDashboard } from '../../services/franchiseApi';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FranchiseHQ() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFranchiseDashboard();
      setData(res);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load Franchise HQ data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 min-h-screen">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
      <p className="text-slate-500">Franchise data unavailable.</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiGrid className="text-slate-900" /> Franchise HQ
          </h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise Dashboard for Multi-Branch Management</p>
        </div>
      </div>

      {/* Aggregate Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><FiMapPin /> Total Branches</h3>
          <div className="text-4xl font-black">{data.overview.total_branches}</div>
        </div>
        <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <h3 className="text-indigo-200 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><FiTrendingUp /> Network Revenue (30d)</h3>
          <div className="text-3xl font-black">₹{data.overview.network_revenue.toLocaleString()}</div>
          <p className="text-xs text-indigo-200 mt-1">{data.overview.yoy_growth} vs last year</p>
        </div>
        <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
           <h3 className="text-emerald-100 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><FiGrid /> Network Bookings</h3>
          <div className="text-3xl font-black">{data.overview.network_bookings.toLocaleString()}</div>
        </div>
        <div className="bg-amber-500 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
           <h3 className="text-amber-100 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><FiUsers /> Total Staff</h3>
          <div className="text-3xl font-black">{data.overview.network_staff}</div>
        </div>
      </div>

      {/* Multi-Branch Comparison Chart */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Branch Revenue Comparison (6 Months)</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthly_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', paddingTop: '20px'}} />
              
              {/* Dynamically create lines for each branch */}
              {data.branches.map((branch, idx) => {
                const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'];
                return (
                  <Line 
                    key={branch.id} 
                    type="monotone" 
                    dataKey={branch.name} 
                    stroke={colors[idx % colors.length]} 
                    strokeWidth={4}
                    dot={{r: 4, strokeWidth: 2}}
                    activeDot={{r: 6, strokeWidth: 0}}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Directory */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Branch Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Branch Name</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue (30d)</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Bookings</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Staff</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map(branch => (
                <tr key={branch.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{branch.name}</div>
                    <div className="text-xs text-slate-500 max-w-[200px] truncate">{branch.address}</div>
                  </td>
                  <td className="p-4 font-black text-slate-900">₹{branch.revenue.toLocaleString()}</td>
                  <td className="p-4 font-bold text-slate-700">{branch.bookings_30d}</td>
                  <td className="p-4 font-bold text-slate-700">{branch.staff_count}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                      branch.status === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                      branch.status === 'Average' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {branch.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => toast.info('Staff transfer modal would open here in full prod')} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1">
                      <FiRepeat /> Transfer Staff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
