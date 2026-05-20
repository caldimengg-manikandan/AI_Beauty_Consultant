import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiClock, FiStar, FiZap, FiAlertCircle } from 'react-icons/fi';
import { getBusinessInsights } from '../../services/partnerApi';
import { toast } from 'react-toastify';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function BusinessInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBusinessInsights();
      setData(res);
    } catch (e) { toast.error('Failed to load insights data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data || data.error) return (
    <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200">
      <p className="text-slate-500">Insights data is not available yet.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <h3 className="text-indigo-100 font-medium text-sm mb-1 uppercase tracking-widest">Revenue Forecast</h3>
            <div className="text-4xl font-black mb-2 flex items-end gap-2">
              ₹{data.forecast?.next_week_revenue?.toLocaleString()} 
              <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded-lg text-emerald-300">
                 {data.forecast?.expected_growth} Next Week
              </span>
            </div>
            <p className="text-xs text-indigo-200">Based on ML analysis of your recent booking trends</p>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><FiZap className="text-amber-500" /> AI Business Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.ai_recommendations?.map((rec, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border flex items-start gap-3 shadow-sm ${
              rec.type === 'opportunity' ? 'bg-indigo-50 border-indigo-100' :
              rec.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
              rec.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-200'
            }`}>
              <div className={`mt-1 flex-shrink-0 ${
                rec.type === 'opportunity' ? 'text-indigo-500' :
                rec.type === 'success' ? 'text-emerald-500' :
                rec.type === 'warning' ? 'text-amber-500' : 'text-slate-500'
              }`}>
                {rec.type === 'warning' ? <FiAlertCircle size={20} /> : <FiTrendingUp size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-tight">{rec.title}</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{rec.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">7-Day Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Peak Booking Hours</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peak_hours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="bookings" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Stylists List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Top Performing Staff</h3>
        <div className="space-y-3">
          {data.top_stylists?.map((stylist, index) => (
            <div key={stylist.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{stylist.name}</h4>
                  <p className="text-xs text-slate-500">{stylist.role}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-6">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Revenue</div>
                  <div className="font-black text-slate-900">₹{stylist.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Rating</div>
                  <div className="font-black text-emerald-500 flex items-center gap-1 justify-end"><FiStar className="fill-emerald-500" /> {stylist.rating}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
