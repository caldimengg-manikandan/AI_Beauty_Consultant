import React, { useState, useEffect, useCallback } from 'react';
import {
  FiTrendingUp, FiTrendingDown, FiClock, FiStar, FiZap,
  FiAlertCircle, FiUsers, FiPackage, FiRefreshCw, FiCalendar, FiTarget
} from 'react-icons/fi';
import { getBusinessInsights, getChurnRisk } from '../../services/partnerApi';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f97316'];

const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
];

// Stat card component
function StatCard({ label, value, sub, icon, color, growth }) {
  const isPositive = growth >= 0;
  return (
    <div className={`bg-gradient-to-br ${color} rounded-3xl p-5 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10">
        <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
          {icon} {label}
        </div>
        <div className="text-3xl font-black mb-1">{value}</div>
        {sub && <div className="text-white/60 text-xs">{sub}</div>}
        {growth !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
            {isPositive ? '+' : ''}{growth}% vs last period
          </div>
        )}
      </div>
    </div>
  );
}

// AI recommendation card
function RecoCard({ rec }) {
  const styles = {
    opportunity: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-500', icon: <FiTrendingUp size={18}/> },
    success:     { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-500', icon: <FiStar size={18}/> },
    warning:     { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-500', icon: <FiAlertCircle size={18}/> },
    trend:       { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-500', icon: <FiTrendingUp size={18}/> },
    ai:          { bg: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200', text: 'text-indigo-600', icon: <FiZap size={18}/> },
  };
  const s = styles[rec.type] || styles.trend;
  return (
    <div className={`p-5 rounded-2xl border flex items-start gap-3 shadow-sm ${s.bg}`}>
      <div className={`mt-0.5 flex-shrink-0 ${s.text}`}>{s.icon}</div>
      <div>
        <h4 className="font-bold text-slate-900 leading-tight text-sm">{rec.title}</h4>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{rec.message}</p>
      </div>
    </div>
  );
}

export default function BusinessInsights() {
  const [data, setData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Pass period as query param; partnerApi will forward it
      const [res, churnRes] = await Promise.all([
        getBusinessInsights(period),
        getChurnRisk()
      ]);
      setData(res);
      setChurnData(churnRes);
    } catch (e) {
      toast.error('Failed to load insights data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 rounded-3xl" />
      ))}
    </div>
  );

  if (!data || data.error) return (
    <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
      <FiZap className="text-4xl text-slate-300 mx-auto mb-3" />
      <p className="font-semibold text-slate-600">No insights data yet</p>
      <p className="text-sm text-slate-400 mt-1">Insights appear once you have bookings and invoices</p>
    </div>
  );

  const hasRevenue = data.total_revenue_30d > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Header + Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Business Insights</h2>
          <p className="text-sm text-slate-500 mt-0.5">Real-time analytics powered by AI</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <FiCalendar className="text-slate-400 ml-2" size={14} />
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === opt.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {opt.label}
            </button>
          ))}
          <button onClick={loadData} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors mr-1">
            <FiRefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Revenue"
          value={`₹${(data.total_revenue_30d || 0).toLocaleString()}`}
          sub={`Last ${period} days`}
          icon={<FiTrendingUp size={12} />}
          color="from-indigo-600 to-purple-700"
          growth={data.revenue_growth_vs_last_month}
        />
        <StatCard
          label="Bookings"
          value={data.total_bookings_30d || 0}
          sub={`Last ${period} days`}
          icon={<FiCalendar size={12} />}
          color="from-teal-500 to-emerald-600"
          growth={data.booking_growth_vs_last_month}
        />
        <StatCard
          label="Customers"
          value={data.unique_customers || 0}
          sub={`${data.repeat_customer_pct || 0}% returning`}
          icon={<FiUsers size={12} />}
          color="from-pink-500 to-rose-600"
        />
        <StatCard
          label="Stock Alerts"
          value={data.low_stock_alerts || 0}
          sub="Items need reorder"
          icon={<FiPackage size={12} />}
          color={data.low_stock_alerts > 0 ? "from-amber-500 to-orange-600" : "from-slate-400 to-slate-500"}
        />
      </div>

      {/* Forecast Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-8 top-0 text-8xl opacity-10">📈</div>
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">AI Revenue Forecast</p>
          <div className="text-4xl font-black mb-1">
            ₹{(data.forecast?.next_week_revenue || 0).toLocaleString()}
          </div>
          <p className="text-indigo-200 text-sm">
            Projected next 7 days
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-emerald-300 font-bold">
              {data.forecast?.expected_growth} growth
            </span>
          </p>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
          <FiZap className="text-amber-500" /> AI Business Recommendations
          <span className="text-xs font-normal text-slate-400 ml-1">— based on your real data</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data.ai_recommendations || []).map((rec, idx) => (
            <RecoCard key={idx} rec={rec} />
          ))}
          {(!data.ai_recommendations || data.ai_recommendations.length === 0) && (
            <div className="col-span-3 p-6 text-center bg-slate-50 rounded-2xl text-slate-400">
              No recommendations yet — add more bookings to unlock AI insights
            </div>
          )}
        </div>
      </div>

      {/* Retention Center (Churn Prediction) */}
      {churnData && churnData.at_risk_customers?.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 p-6 rounded-3xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-black text-rose-600 flex items-center gap-2">
                <FiTarget /> Retention Center
              </h3>
              <p className="text-sm text-rose-500 mt-1">
                AI identified <span className="font-bold">{churnData.total_at_risk} regular customers</span> who haven't visited in over 30 days.
              </p>
            </div>
            <button 
              onClick={() => {
                // For a fully integrated UX, we could dispatch to MarketingTools here, 
                // but since they have a dedicated tab for automations, let's just hint it.
                toast.info("Go to 'Marketing > Automations' to launch the Win-Back Campaign!");
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors whitespace-nowrap"
            >
              Launch Win-Back Campaign
            </button>
          </div>
          
          <div className="bg-white rounded-2xl overflow-hidden border border-rose-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-rose-50/50 text-rose-700 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total Visits</th>
                  <th className="px-4 py-3 text-right">Days Since Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                {churnData.at_risk_customers.slice(0, 5).map(c => (
                  <tr key={c.user_id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{c.total_visits}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-500">{c.days_since_last_visit} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {churnData.total_at_risk > 5 && (
              <div className="text-center py-2 text-xs font-bold text-rose-400 bg-rose-50/20">
                + {churnData.total_at_risk - 5} more customers
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
            {period === 7 ? '7-Day' : period === 30 ? 'Monthly' : `${period}-Day`} Revenue Trend
            {!hasRevenue && <span className="ml-2 text-amber-500 normal-case">(No invoices yet)</span>}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_trends} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}}
                  tickFormatter={v => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}}
                  tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={v => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Peak Booking Hours</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peak_hours} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false}
                  tick={{fill: '#94a3b8', fontSize: 9}} interval={1} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} />
                <Tooltip cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="bookings" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services Breakdown (Pie) */}
        {data.services_breakdown && data.services_breakdown.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Services Breakdown</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.services_breakdown} dataKey="bookings" nameKey="service"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {data.services_breakdown.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Day of Week Heatmap */}
        {data.day_of_week && data.day_of_week.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Bookings by Day</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.day_of_week} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false}
                    tick={{fill: '#94a3b8', fontSize: 9}}
                    tickFormatter={v => v.slice(0, 3)} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                  <Bar dataKey="bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top Stylists */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top Performing Staff</h3>
        {data.top_stylists && data.top_stylists.length > 0 ? (
          <div className="space-y-3">
            {data.top_stylists.map((stylist, index) => (
              <div key={stylist.id || index} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{stylist.name}</h4>
                    <p className="text-xs text-slate-500">{stylist.role} · {stylist.completed_bookings || 0} bookings</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Revenue</div>
                    <div className="font-black text-slate-900 text-sm">
                      {stylist.revenue > 0 ? `₹${stylist.revenue.toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Rating</div>
                    <div className="font-black text-emerald-500 flex items-center gap-1 justify-end text-sm">
                      <FiStar className="fill-emerald-500" size={12}/> {stylist.rating?.toFixed(1) || '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-6 text-sm">No staff data yet. Add staff members to see performance.</p>
        )}
      </div>

      {/* Customer Retention */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Unique Customers', value: data.unique_customers || 0, emoji: '👥' },
          { label: 'Returning Customers', value: data.repeat_customers || 0, emoji: '🔁' },
          { label: 'Retention Rate', value: `${data.repeat_customer_pct || 0}%`, emoji: '📌' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="text-3xl">{stat.emoji}</div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
