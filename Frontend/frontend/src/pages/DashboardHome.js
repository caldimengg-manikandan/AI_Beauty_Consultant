import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaMagic, FaCamera, FaMicroscope, FaCut, FaUserCircle,
  FaStore, FaCalendarCheck, FaUsers, FaBoxOpen, FaChartBar,
  FaFileInvoiceDollar, FaBullhorn, FaTag, FaTruck,
  FaWarehouse, FaShieldAlt, FaUsersCog, FaLayerGroup,
  FaStethoscope, FaChartLine, FaUserCircle as FaUserCircle2,
  FaShoppingBag, FaGift, FaSpa, FaChevronRight, FaPlayCircle,
  FaBullseye
} from "react-icons/fa";
import api from "../services/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* ─────────────────────────────────────────────
   Shared: Quick-action card grid
───────────────────────────────────────────── */
const QuickActionsGrid = ({ actions }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {actions.map(({ to, icon, label, badge, color }, index) => {
      const delayClass = `animation-delay-${(index % 8) * 100}`;
      return (
        <Link
          key={to}
          to={to}
          className={`group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl glass-card border border-white/40 dark:border-slate-700/50 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-center animate-fade-in-up ${delayClass} overflow-hidden`}
        >
          {/* Subtle background glow effect on hover */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${color}`} />
          
          <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 group-hover:animate-pulse-glow transition-transform duration-300 ${color} z-10`}>
            {icon}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight z-10">{label}</span>
          {badge && (
            <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-violet-600 dark:text-violet-400 shadow-sm border border-white/50 z-10">
              {badge}
            </span>
          )}
        </Link>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────
   SHOP OWNER HOME — Live API Data
───────────────────────────────────────────── */

/* Tiny sparkline — reused per KPI card */
const Spark = ({ data, positive, uid }) => (
  <ResponsiveContainer width="100%" height={38}>
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity={0.18}/>
          <stop offset="95%" stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={positive ? '#10b981' : '#ef4444'}
        strokeWidth={1.5} fill={`url(#${uid})`} dot={false}/>
    </AreaChart>
  </ResponsiveContainer>
);

/* KPI card with loading skeleton + trend */
const KPICard = ({ label, value, trend, prefix = '', suffix = '', chart = [], loading, error }) => {
  const pos = trend >= 0;
  const uid = `spk-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const display = (() => {
    if (error) return '—';
    if (prefix) {
      if (value >= 100000) return `${prefix}${(value / 1000).toFixed(0)}k`;
      if (value >= 1000)   return `${prefix}${(value / 1000).toFixed(1)}k`;
      return `${prefix}${value}`;
    }
    return `${value}${suffix}`;
  })();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 leading-none">{label}</p>
      {loading
        ? <div className="h-6 w-20 bg-slate-100 rounded-lg animate-pulse" />
        : <p className="text-xl font-black text-slate-900 leading-none">{display}</p>}
      {!loading && !error && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className={`text-[11px] font-black ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
            {pos ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400">vs prev</span>
        </div>
      )}
      {chart.length > 0 && !loading && (
        <div className="mt-2 -mx-1">
          <Spark data={chart} positive={pos} uid={uid} />
        </div>
      )}
    </div>
  );
};

const HEALTH_DIMS_STATIC = [
  { label: 'Revenue',   bar: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-700', status: 'Healthy',   key: 'revenue' },
  { label: 'Inventory', bar: 'bg-amber-500',   cls: 'bg-amber-100 text-amber-700',     status: 'Attention', key: 'inventory' },
  { label: 'Retention', bar: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-700', status: 'Excellent', key: 'retention' },
  { label: 'Staff',     bar: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-700', status: 'Good',      key: 'staff' },
];

const SCHED_STATUS = {
  confirmed: { dot: 'bg-emerald-400', text: 'text-emerald-600', label: 'Confirmed' },
  completed: { dot: 'bg-blue-400',    text: 'text-blue-600',    label: 'Done'      },
  pending:   { dot: 'bg-amber-400',   text: 'text-amber-600',   label: 'Pending'   },
  cancelled: { dot: 'bg-red-400',     text: 'text-red-500',     label: 'Cancelled' },
};

const URGENCY_CFG = {
  out_of_stock: { cls: 'bg-red-50 border-red-200',     dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       label: 'Out of Stock' },
  low:          { cls: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700',   label: 'Low Stock'    },
};

const SERVICE_COLORS = [
  'bg-violet-500','bg-blue-500','bg-rose-500','bg-amber-500',
  'bg-teal-500','bg-indigo-500','bg-pink-500','bg-slate-300',
];

const ShopOwnerHome = () => {
  /* ── API state buckets ─────────────────────── */
  const [loading, setLoading]       = useState(true);
  const [updated, setUpdated]       = useState(null);

  // KPI data
  const [revData,  setRevData]      = useState(null);   // /api/invoices/analytics/revenue
  const [salData,  setSalData]      = useState(null);   // /api/salons/owner/analytics
  const [retData,  setRetData]      = useState(null);   // /api/insights/customer-retention
  const [invSum,   setInvSum]       = useState(null);   // /api/inventory/analytics/summary
  const [staffAna, setStaffAna]     = useState(null);   // /api/staff/analytics/overview

  // Widget data
  const [trend7,   setTrend7]       = useState([]);     // /api/insights/dashboard?days=7
  const [services, setServices]     = useState([]);     // /api/insights/services-breakdown
  const [bookings, setBookings]     = useState([]);     // /api/salons/owner/bookings (today)
  const [lowStock, setLowStock]     = useState([]);     // /api/inventory/alerts/low-stock

  const [errors,   setErrors]       = useState({});

  const setErr = (key) => setErrors(prev => ({ ...prev, [key]: true }));

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    const safeGet = async (url, onSuccess, errKey, params = {}) => {
      try {
        const res = await api.get(url, { params });
        onSuccess(res.data);
      } catch {
        setErr(errKey);
      }
    };

    Promise.allSettled([
      safeGet('/api/invoices/analytics/revenue',       setRevData,  'rev'),
      safeGet('/api/salons/owner/analytics',           setSalData,  'sal'),
      safeGet('/api/insights/customer-retention',      setRetData,  'ret', { days: 30 }),
      safeGet('/api/inventory/analytics/summary',      setInvSum,   'inv'),
      safeGet('/api/staff/analytics/overview',         setStaffAna, 'staff'),
      safeGet('/api/insights/dashboard',               d => setTrend7(d.revenue_trends || []), 'trend', { days: 7 }),
      safeGet('/api/insights/services-breakdown',      d => setServices(d.services || []),     'svc',   { days: 30 }),
      safeGet('/api/salons/owner/bookings',            d => {
        const list = Array.isArray(d) ? d : d.bookings || [];
        setBookings(list.filter(b => b.appointment_date === today).slice(0, 6));
      }, 'bk'),
      safeGet('/api/inventory/alerts/low-stock',       d => setLowStock(d.alerts || []), 'ls'),
    ]).finally(() => {
      setLoading(false);
      setUpdated(new Date());
    });
  }, []);

  /* ── Derived KPI values ────────────────────── */
  const todayBookings   = salData?.total_bookings ?? 0;  // approximation; use salData for now
  const retentionPct    = retData?.retention_rate_pct ?? 0;
  const invHealthPct    = invSum
    ? Math.max(0, Math.round(100 - ((invSum.low_stock_count / Math.max(invSum.total_products, 1)) * 100)))
    : 0;
  const staffCount      = staffAna?.total_active ?? 0;
  const revToday        = revData?.total_revenue ?? 0;
  const totalInvoices   = revData?.total_invoices ?? 0;

  const healthScores = {
    revenue:   Math.min(100, Math.round((revToday / 20000) * 100)) || 50,
    inventory: invHealthPct || 50,
    retention: retentionPct || 50,
    staff:     staffCount > 0 ? Math.min(100, staffCount * 10) : 50,
  };
  const healthOverall = Math.round(Object.values(healthScores).reduce((a, b) => a + b, 0) / 4);

  /* ── Revenue trend chart data ──────────────── */
  const trendChartData = trend7.length > 0
    ? trend7.map(d => ({
        day: d.date ? new Date(d.date).toLocaleDateString('en', { weekday: 'short' }) : d.date,
        actual: d.revenue,
        target: revToday > 0 ? Math.round(revToday / 7) : 15000,
      }))
    : [];

  /* ── Staff leaderboard ─────────────────────── */
  const staffList = (staffAna?.staff || [])
    .slice(0, 4)
    .map((s, i) => ({
      ...s,
      avatar: s.name?.[0] ?? '?',
      color: ['from-violet-500 to-purple-600','from-blue-500 to-indigo-600',
              'from-teal-500 to-emerald-600','from-rose-500 to-pink-600'][i] || 'from-slate-400 to-slate-600',
    }));

  /* ── Helpers ───────────────────────────────── */
  const fmt = (d) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const kpiList = [
    { label: 'Revenue (Total)', value: revToday,      trend: 0,               prefix: '₹', loading, error: !!errors.rev,   chart: trendChartData.map(d => ({ v: d.actual })) },
    { label: 'Total Invoices',  value: totalInvoices, trend: 0,               suffix: '',  loading, error: !!errors.rev,   chart: [] },
    { label: 'Bookings',        value: todayBookings, trend: 0,               suffix: '',  loading, error: !!errors.sal,   chart: [] },
    { label: 'Client Retention',value: retentionPct,  trend: 0,               suffix: '%', loading, error: !!errors.ret,   chart: [] },
    { label: 'Active Staff',    value: staffCount,    trend: 0,               suffix: '',  loading, error: !!errors.staff, chart: [] },
    { label: 'Inventory Health',value: invHealthPct,  trend: invHealthPct > 80 ? 2 : -5, suffix: '%', loading, error: !!errors.inv, chart: [] },
  ];

  return (
    <div className="space-y-5">

      {/* ── Row 1: Welcome / Health + AI Copilot ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Health Score Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dashboard Overview</p>
              <h1 className="text-2xl font-black text-slate-900">Business Command Center</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? 'Loading live data…' : updated ? `Updated ${fmt(updated)}` : ''}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-right">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Business Health</p>
              {loading
                ? <div className="h-8 w-16 bg-emerald-100 rounded-lg animate-pulse mt-1 ml-auto"/>
                : <p className="text-3xl font-black text-emerald-700 leading-none mt-0.5">
                    {healthOverall}<span className="text-sm font-semibold text-emerald-400">/100</span>
                  </p>
              }
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HEALTH_DIMS_STATIC.map(d => {
              const score = healthScores[d.key] ?? 0;
              const statusLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Attention' : 'Critical';
              const statusCls   = score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-blue-100 text-blue-700' : score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
              return (
                <div key={d.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{d.label}</p>
                    {loading
                      ? <div className="h-4 w-14 bg-slate-200 rounded animate-pulse"/>
                      : <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${statusCls}`}>{statusLabel}</span>
                    }
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                    <div className={`h-1.5 rounded-full ${d.bar} transition-all duration-700`}
                      style={{ width: loading ? '0%' : `${score}%` }}/>
                  </div>
                  <p className="text-xs font-black text-slate-700">{loading ? '…' : `${score}%`}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Copilot */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-black">AI</span>
            </div>
            <div>
              <p className="text-xs font-black text-white leading-none">AI Business Assistant</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Live insights from your data</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 mb-4">
            {loading
              ? <div className="space-y-1.5"><div className="h-3 bg-slate-700 rounded animate-pulse"/><div className="h-3 bg-slate-700 rounded animate-pulse w-3/4"/></div>
              : <p className="text-sm text-slate-200 font-medium leading-relaxed">
                  {retentionPct > 60
                    ? <>Client retention at <span className="text-emerald-400 font-black">{retentionPct}%</span> — strong repeat base. Focus on upsells.</>
                    : <>Retention at <span className="text-amber-400 font-black">{retentionPct}%</span> — launch a win-back campaign to recover clients.</>
                  }
                </p>
            }
          </div>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Recommended Actions</p>
          <div className="space-y-2.5 flex-1">
            {loading
              ? [1,2,3].map(i => (
                  <div key={i} className="flex gap-2">
                    <div className="w-5 h-5 bg-slate-800 rounded-md animate-pulse shrink-0"/>
                    <div className="flex-1 h-3 bg-slate-800 rounded animate-pulse mt-1"/>
                  </div>
                ))
              : [
                  lowStock.length > 0 ? `Reorder ${lowStock.length} low-stock item${lowStock.length > 1 ? 's' : ''} before the weekend rush.` : 'Inventory levels look healthy — no urgent reorders.',
                  retentionPct < 60  ? `${retData?.new_customers ?? 0} new clients this month — send welcome offers to convert them.` : `${retData?.returning_customers ?? 0} returning clients this month — great loyalty!`,
                  staffList.length > 0 ? `${staffList[0]?.name} leads with ₹${((staffList[0]?.total_revenue || 0)/1000).toFixed(0)}k revenue — consider promoting their peak slots.` : 'Add staff to start tracking performance.',
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 group cursor-default">
                    <div className="w-5 h-5 rounded-md bg-violet-600/20 border border-violet-600/30 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-violet-400 text-[9px] font-black">{i + 1}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{a}</p>
                  </div>
                ))
            }
          </div>
          <button className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black hover:bg-violet-500 transition-colors">
            Open Full AI Report →
          </button>
        </div>
      </div>

      {/* ── Row 2: 6 Live KPI Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiList.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      {/* ── Row 3: Revenue Trend + Top Services ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900">Revenue Trend</h3>
              <p className="text-[11px] text-slate-400">Last 7 days — actual vs daily target</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-600 inline-block rounded-full"/>Actual</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-slate-300 inline-block"/>Target</span>
            </div>
          </div>
          {loading ? (
            <div className="h-48 bg-slate-50 rounded-xl animate-pulse"/>
          ) : trendChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={trendChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revActualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
                  formatter={v => [`₹${Number(v).toLocaleString()}`, '']}/>
                <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={1.5}
                  fill="none" strokeDasharray="4 3" dot={false}/>
                <Area type="monotone" dataKey="actual" stroke="#7c3aed" strokeWidth={2}
                  fill="url(#revActualGrad)" dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-black text-slate-900 mb-0.5">Top Services</h3>
          <p className="text-[11px] text-slate-400 mb-4">By booking share (last 30 days)</p>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-7 bg-slate-50 rounded-lg animate-pulse"/>)}
            </div>
          ) : services.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No bookings data yet</p>
          ) : (
            <div className="space-y-3">
              {services.slice(0, 6).map((s, i) => (
                <div key={s.service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-700 truncate flex-1 mr-2">{s.service}</span>
                    <span className="text-[11px] font-black text-slate-500 shrink-0">{s.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${SERVICE_COLORS[i] || 'bg-slate-400'} transition-all duration-500`}
                      style={{ width: `${s.percentage}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Schedule + Staff Leaderboard + Low Stock ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">Today's Schedule</h3>
            <Link to="/dashboard/shop-owner" className="text-[10px] font-black text-violet-600 hover:text-violet-700 tracking-wide">View All →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse"/>)}</div>
          ) : bookings.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-xs text-slate-400 font-medium">No appointments today</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {bookings.map((b, i) => {
                const st = SCHED_STATUS[b.status] || SCHED_STATUS.pending;
                return (
                  <div key={b.id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-default">
                    <p className="text-[10px] font-black text-slate-400 w-12 shrink-0 tabular-nums">{b.appointment_time}</p>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{b.customer_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{b.service_name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>
                      <span className={`text-[9px] font-black ${st.text}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Staff Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">Staff Leaderboard</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">All Time</span>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse"/>)}</div>
          ) : staffList.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">👥</p>
              <p className="text-xs text-slate-400 font-medium">No staff data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staffList.map((s, i) => (
                <div key={s.id || s.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">#{i + 1}</span>
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm`}>
                    {s.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">₹{((s.total_revenue || 0) / 1000).toFixed(0)}k</p>
                    <p className="text-[10px] text-slate-400">{s.completed_bookings} done</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">Stock Alerts</h3>
            <Link to="/dashboard/inventory" className="text-[10px] font-black text-violet-600 hover:text-violet-700 tracking-wide">Reorder →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"/>)}</div>
          ) : lowStock.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-xs text-slate-400 font-medium">All stock levels healthy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 4).map(item => {
                const u = URGENCY_CFG[item.status] || URGENCY_CFG.low;
                const pct = Math.round(((item.quantity || 0) / Math.max(item.threshold || 1, 1)) * 100);
                return (
                  <div key={item.id} className={`p-3 rounded-xl border ${u.cls}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold truncate flex-1 mr-2">{item.name}</p>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${u.badge} shrink-0`}>{u.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/10 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${u.dot}`} style={{ width: `${Math.min(pct, 100)}%` }}/>
                      </div>
                      <p className="text-[10px] font-black tabular-nums shrink-0">{item.quantity}/{item.threshold}</p>
                    </div>
                  </div>
                );
              })}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  💡 {lowStock.length} item{lowStock.length > 1 ? 's' : ''} need restocking. Order early to avoid weekend gaps.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 5: AI Insight Cards (live data) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            type: 'Revenue Opportunity', icon: '💰', borderColor: 'border-l-emerald-500',
            headline: loading ? '…' : `₹${((revData?.total_revenue || 0) / 1000).toFixed(0)}k total revenue collected`,
            body: loading ? '…' : `${revData?.total_invoices || 0} invoices processed. Avg invoice value ₹${Math.round(revData?.avg_invoice_value || 0).toLocaleString()}.`,
            action: 'View Invoices', color: 'text-emerald-700', to: '/dashboard/invoices',
          },
          {
            type: 'Client Retention', icon: '🔄', borderColor: 'border-l-blue-500',
            headline: loading ? '…' : `${retData?.returning_customers || 0} returning clients this month`,
            body: loading ? '…' : `${retData?.new_customers || 0} new clients acquired. ${retData?.retention_rate_pct || 0}% retention rate over the last 30 days.`,
            action: 'View Clients', color: 'text-blue-700', to: '/dashboard/client-intelligence',
          },
          {
            type: 'Inventory Alert', icon: '📦', borderColor: 'border-l-amber-500',
            headline: loading ? '…' : lowStock.length > 0 ? `${lowStock.length} item${lowStock.length > 1 ? 's' : ''} running low` : 'Inventory levels healthy',
            body: loading ? '…' : invSum ? `${invSum.total_products} products tracked. ${invSum.out_of_stock_count} out of stock, ${invSum.low_stock_count} low.` : 'No inventory data.',
            action: 'Manage Stock', color: 'text-amber-700', to: '/dashboard/inventory',
          },
        ].map(ins => (
          <div key={ins.type}
            className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${ins.borderColor} shadow-sm p-5 hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{ins.icon}</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ins.type}</p>
            </div>
            {loading
              ? <><div className="h-4 bg-slate-100 rounded animate-pulse mb-1"/><div className="h-3 bg-slate-100 rounded animate-pulse w-4/5"/></>
              : <>
                  <p className={`text-sm font-black ${ins.color} mb-1.5`}>{ins.headline}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{ins.body}</p>
                  <Link to={ins.to} className={`text-[11px] font-black ${ins.color} hover:underline`}>{ins.action} →</Link>
                </>
            }
          </div>
        ))}
      </div>

    </div>
  );
};

/* ─────────────────────────────────────────────
   ADMIN HOME
───────────────────────────────────────────── */
const adminQuickActions = [
  { to: "/dashboard/admin",       icon: <FaShieldAlt />,        label: "Admin Console",    color: "bg-gradient-to-br from-red-500 to-rose-700",    badge: "SYS" },
  { to: "/dashboard/staff",       icon: <FaUsers />,            label: "User Management",  color: "bg-gradient-to-br from-blue-500 to-indigo-700"  },
  { to: "/dashboard/shop-owner",  icon: <FaStore />,            label: "Shop Management",  color: "bg-gradient-to-br from-amber-400 to-orange-600" },
  { to: "/dashboard/insights",    icon: <FaChartBar />,         label: "Platform Stats",   color: "bg-gradient-to-br from-violet-500 to-purple-700", badge: "AI" },
  { to: "/dashboard/expert",      icon: <FaStethoscope />,      label: "Expert Queue",     color: "bg-gradient-to-br from-teal-400 to-emerald-600"  },
  { to: "/dashboard/campaigns",   icon: <FaBullhorn />,         label: "Campaigns",        color: "bg-gradient-to-br from-rose-400 to-pink-600"  },
];

const AdminHome = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Animated Banner */}
    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl p-8">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-rose-900 to-red-900 bg-[length:200%_200%] animate-scan" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
      
      <div className="relative z-10 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FaShieldAlt className="text-3xl float-animation drop-shadow-lg text-rose-300" />
          <h1 className="text-3xl font-black tracking-tight drop-shadow-md">System Command Center</h1>
        </div>
        <p className="text-rose-100 text-sm md:text-base opacity-90 max-w-xl font-medium">Full platform oversight—monitor operations, manage businesses, and control the AI ecosystem.</p>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Users",    value: "—", color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50/50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30"   },
        { label: "Active Shops",   value: "—", color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50/50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30"  },
        { label: "AI Scans Today", value: "—", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50/50 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800/30" },
        { label: "Platform MRR",   value: "—", color: "text-green-600 dark:text-green-400",  bg: "bg-green-50/50 border-green-100 dark:bg-green-900/20 dark:border-green-800/30"  },
      ].map(({ label, value, color, bg }, idx) => (
        <div key={label} className={`rounded-2xl p-5 border backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02] duration-300 animate-fade-in-up animation-delay-${idx*100} ${bg}`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
        </div>
      ))}
    </div>

    {/* Quick Actions */}
    <div>
      <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        Administrative Tools
      </h2>
      <QuickActionsGrid actions={adminQuickActions} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   USER / PREMIUM HOME
───────────────────────────────────────────── */
// Data Models
const aiRecommendations = [
  { title: "Suggested Routine", desc: "Hydration Focus for upcoming dry weather", confidence: 94, icon: <FaMicroscope className="text-teal-500" />, action: "View Routine" },
  { title: "Recommended Style", desc: "Layered Bob to complement your face shape", confidence: 88, icon: <FaCut className="text-pink-500" />, action: "Try on AR" },
  { title: "Expert Consult", desc: "Review your recent skin health drop", confidence: 91, icon: <FaStethoscope className="text-violet-500" />, action: "Book Now" },
];

const beautyGoals = [
  { label: "Skin Brightening", progress: 65, color: "bg-amber-400" },
  { label: "Acne Reduction", progress: 82, color: "bg-emerald-400" },
  { label: "Hair Volume", progress: 40, color: "bg-violet-400" },
];

const beautyFeed = [
  { type: "Tip", content: "Switch to a lighter moisturizer. Humidity is rising this week in your area.", date: "Today" },
  { type: "Product", content: "Your favorite Vitamin C serum is on sale. Perfect for your 'Skin Brightening' goal.", date: "Yesterday" },
  { type: "Insight", content: "You've been consistent with sunscreen for 14 days. Your barrier score is improving!", date: "2 days ago" },
];

const CircularProgress = ({ value, label, color, subColor }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative w-20 h-20 mb-2">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * value) / 100} className={`transition-all duration-1000 ${color}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black text-slate-800 dark:text-slate-100">{value}</span>
      </div>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${subColor}`}>{label}</span>
  </div>
);

const UserHome = ({ role, profile, can }) => {
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    api.get("/api/analyze/history?limit=3")
      .then(r => setAnalyses(r.data?.analyses || []))
      .catch(() => {});
  }, []);

  const isMale = profile?.gender?.toLowerCase() === "male" || analyses[0]?.gender?.toLowerCase() === "male";

  const userQuickActions = [
    { to: "/dashboard/analyze",       icon: <FaMagic size={24} />,       label: "Face Analysis",   desc: "Decode your skin health", color: "from-violet-500 to-purple-700", badge: "AI" },
    { to: "/dashboard/virtual-studio",icon: <FaUserCircle2 size={24} />, label: "Vision Studio",   desc: "Try looks in real-time", color: "from-fuchsia-500 to-pink-600", badge: "AR" },
    { to: "/dashboard/hair-styling",  icon: <FaCut size={24} />,         label: "Hair Styling",    desc: "Discover your perfect cut", color: "from-pink-400 to-rose-500"   },
    { to: "/dashboard/expert",        icon: <FaStethoscope size={24} />, label: "Expert Consult",  desc: "Speak to a professional", color: "from-teal-400 to-emerald-600"   },
    { to: "/dashboard/live-analyze",  icon: <FaCamera size={24} />,      label: "Live Camera",     desc: "Instant skin check", color: "from-indigo-400 to-blue-600" },
    ...(!isMale ? [{ to: "/dashboard/nail-styling",  icon: <FaSpa size={24} />,         label: "Nail Studio",     desc: "Custom color palettes", color: "from-rose-400 to-red-500" }] : []),
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans selection:bg-violet-500/30">
      
      {/* SECTION 1: AI BEAUTY ASSISTANT HERO */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(108,76,241,0.15)] p-10 border border-violet-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-[80px] translate-y-1/4 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-black rounded-lg uppercase tracking-widest shadow-sm border border-violet-200 dark:border-violet-700/50">Beauty OS Active</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Good Morning, {profile?.name || "Beautiful"} ✨
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg max-w-2xl font-medium leading-relaxed">
              Your Beauty Profile is <strong className="text-violet-600 dark:text-violet-400">92% optimized</strong>. Our neural engine has prepared 3 new personalized recommendations for you today.
            </p>
          </div>
          
          <div className="shrink-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-5 rounded-3xl border border-white dark:border-slate-700 shadow-xl flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Global Beauty Score</p>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">88</p>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Active Goals</p>
              <p className="text-4xl font-black text-slate-800 dark:text-white">3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* SECTION 2: AI INSIGHTS PANEL */}
        <div className="xl:col-span-1 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-8 flex items-center gap-2">
              <FaChartLine className="text-violet-500" /> Health Diagnostics
            </h3>
            <div className="flex justify-between items-end px-2">
              <CircularProgress value={82} label="Skin" color="text-teal-500" subColor="text-teal-600" />
              <CircularProgress value={76} label="Hair" color="text-pink-500" subColor="text-pink-600" />
              <CircularProgress value={91} label="Nails" color="text-amber-500" subColor="text-amber-600" />
            </div>
          </div>

          {/* SECTION 4: BEAUTY JOURNEY PROGRESS */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <FaBullseye className="text-fuchsia-500" /> Active Goals
              </h3>
              <span className="text-[10px] text-violet-600 font-bold hover:underline cursor-pointer">Manage</span>
            </div>
            <div className="space-y-5">
              {beautyGoals.map((goal, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{goal.label}</span>
                    <span className="text-[10px] font-black text-slate-500">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className={`${goal.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: QUICK ACTIONS REDESIGN */}
        <div className="xl:col-span-2">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FaMagic className="text-violet-500" /> Core Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {userQuickActions.map((action, idx) => (
              <Link
                key={idx}
                to={action.to}
                className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {action.icon}
                    </div>
                    {action.badge && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-widest">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">{action.label}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* SECTION 5: SMART RECOMMENDATIONS */}
          <div className="mt-8">
             <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
              <FaLayerGroup className="text-indigo-500" /> Smart Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {aiRecommendations.map((rec, idx) => (
                <div key={idx} className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                      {rec.icon}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence</span>
                      <span className="text-sm font-black text-emerald-500">{rec.confidence}%</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">{rec.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 h-8">{rec.desc}</p>
                  <button className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-colors">
                    {rec.action}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 6: AI BEAUTY FEED */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <FaGift className="text-pink-500" /> AI Beauty Feed
          </h3>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {beautyFeed.map((feed, idx) => (
            <div key={idx} className="min-w-[280px] w-[280px] bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between hover:border-violet-200 dark:hover:border-violet-800 transition-colors cursor-default">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                    {feed.type}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">{feed.date}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {feed.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
const DashboardHome = () => {
  const { role, profile, can } = useAuth();
  if (role === "shop_owner") return <ShopOwnerHome />;
  if (role === "admin")      return <AdminHome />;
  return <UserHome role={role} profile={profile} can={can} />;
};

export default DashboardHome;
