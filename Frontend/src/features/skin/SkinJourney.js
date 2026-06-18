import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FaCalendarAlt, FaStar, FaArrowUp, FaArrowDown,
  FaMinus, FaTrophy, FaCameraRetro, FaCheckCircle,
  FaDownload, FaRedo, FaChevronDown, FaChevronUp,
  FaFire, FaMedal, FaGem, FaBolt, FaShieldAlt,
  FaLeaf, FaFilter,
} from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getHistory } from '../../services/api';
import generateBeautyReport from '../../utils/generateBeautyReport';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const SEASON_COLORS = {
  Winter: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: '#6366F1' },
  Summer: { bg: 'bg-rose-100',   text: 'text-rose-700',   dot: '#F43F5E' },
  Autumn: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: '#F59E0B' },
  Spring: { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: '#10B981' },
};

const computeScore = (skin_scores = {}) => {
  const { acne=0, oiliness=0, texture=0, pores=0,
          hydration=0.6, barrier=0.6, evenness=0.6, elasticity=0.6 } = skin_scores;
  const bad  = ((1-acne) + (1-oiliness) + (1-texture) + (1-pores)) / 4 * 100;
  const good = (hydration + barrier + evenness + elasticity) / 4 * 100;
  return Math.round((bad + good) / 2);
};

const scoreColor = s => s>=80?'text-emerald-600':s>=65?'text-blue-600':s>=45?'text-amber-500':'text-rose-500';
const scoreBg    = s => s>=80?'bg-emerald-50 border-emerald-200':s>=65?'bg-blue-50 border-blue-200':s>=45?'bg-amber-50 border-amber-200':'bg-rose-50 border-rose-200';
const scoreGrad  = s => s>=80?'#10B981':s>=65?'#3B82F6':s>=45?'#F59E0B':'#F43F5E';

const fmtDate = d => {
  try { return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
  catch { return d; }
};
const fmtShort = d => {
  try { return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }
  catch { return d; }
};

/* ─── Milestones config ────────────────────────────────────────────────── */

const MILESTONES = [
  { id:'first',     label:'First Scan',    icon:'🎉', emoji:<FaStar />,   rarity:'common',    desc:'Completed your first face analysis.',   req:s=>s.length>=1  },
  { id:'three',     label:'Committed',     icon:'🔥', emoji:<FaFire />,   rarity:'common',    desc:'Scanned 3 times — building a habit!',   req:s=>s.length>=3  },
  { id:'five',      label:'Skin Explorer', icon:'🔭', emoji:<FaMedal />,  rarity:'rare',      desc:'Completed 5 facial scans.',              req:s=>s.length>=5  },
  { id:'ten',       label:'Glow Veteran',  icon:'🏆', emoji:<FaTrophy />, rarity:'epic',      desc:'10 scans — a true skincare devotee!',   req:s=>s.length>=10 },
  { id:'improve5',  label:'+5 Points',     icon:'📈', emoji:<FaBolt />,   rarity:'rare',      desc:'Improved skin score by 5+ points.',      req:s=>s.length>=2&&(s[0].score-s[s.length-1].score)>=5  },
  { id:'improve10', label:'+10 Points',    icon:'🌟', emoji:<FaGem />,    rarity:'epic',      desc:'Improved skin score by 10+ points!',    req:s=>s.length>=2&&(s[0].score-s[s.length-1].score)>=10 },
  { id:'score80',   label:'Excellent Skin',icon:'💎', emoji:<FaShieldAlt/>,rarity:'legendary',desc:'Achieved a skin score of 80+.',          req:s=>s.some(x=>x.score>=80) },
];

const RARITY = {
  common:    { label:'Common',    bg:'bg-slate-100',  text:'text-slate-600', border:'border-slate-200', glow:'' },
  rare:      { label:'Rare',      bg:'bg-blue-50',    text:'text-blue-700',  border:'border-blue-200',  glow:'shadow-blue-100' },
  epic:      { label:'Epic',      bg:'bg-violet-50',  text:'text-violet-700',border:'border-violet-200',glow:'shadow-violet-100' },
  legendary: { label:'Legendary', bg:'bg-amber-50',   text:'text-amber-700', border:'border-amber-200', glow:'shadow-amber-100' },
};

const PERIODS = [
  { key:'7d',  label:'7 Days' },
  { key:'30d', label:'30 Days' },
  { key:'all', label:'All Time' },
];

/* ─── Sub-components ───────────────────────────────────────────────────── */

function Skeleton({ className }) {
  return <div className={`bg-slate-100 animate-pulse rounded-xl ${className}`} />;
}

function StatCard({ label, value, icon, sub, loading, trend }) {
  if (loading) return <Skeleton className="h-24" />;
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-50 to-teal-50 border border-violet-100 flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
        <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
      {trend !== undefined && trend !== null && (
        <div className={`ml-auto text-xs font-bold flex items-center gap-0.5 shrink-0 ${trend>0?'text-emerald-600':trend<0?'text-rose-500':'text-slate-400'}`}>
          {trend>0?<FaArrowUp size={9}/>:trend<0?<FaArrowDown size={9}/>:<FaMinus size={9}/>}
          {Math.abs(trend)}
        </div>
      )}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      <p className={`text-base font-black ${scoreColor(score)}`}>{score}<span className="text-slate-400 font-normal text-xs">/100</span></p>
      {payload[0]?.payload?.delta != null && (
        <p className={`text-[10px] font-bold mt-1 ${payload[0].payload.delta>0?'text-emerald-600':payload[0].payload.delta<0?'text-rose-500':'text-slate-400'}`}>
          {payload[0].payload.delta>0?'+':''}{payload[0].payload.delta} from previous
        </p>
      )}
    </div>
  );
}

function AchievementCard({ milestone, unlocked, scanCount, loading }) {
  if (loading) return <Skeleton className="h-36" />;
  const r = RARITY[milestone.rarity] || RARITY.common;
  return (
    <motion.div
      initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      whileHover={unlocked ? { y:-2 } : {}}
      className={`relative p-4 rounded-2xl border text-center transition-all ${
        unlocked
          ? `${r.bg} ${r.border} shadow-sm ${r.glow}`
          : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
      }`}
    >
      {unlocked && (
        <div className={`absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${r.bg} ${r.text} border ${r.border}`}>
          {milestone.rarity}
        </div>
      )}
      <div className="text-2xl mb-2">{unlocked ? milestone.icon : '🔒'}</div>
      <p className={`text-xs font-black leading-tight ${unlocked ? r.text : 'text-slate-500'}`}>{milestone.label}</p>
      <p className="text-[9px] text-slate-400 mt-1 leading-tight">{milestone.desc}</p>
      {unlocked ? (
        <div className="mt-2 flex items-center justify-center gap-1">
          <FaCheckCircle className="text-emerald-500" size={10} />
          <span className="text-[9px] font-bold text-emerald-600">Unlocked</span>
        </div>
      ) : (
        <div className="mt-2 w-full bg-slate-200 rounded-full h-1">
          <div
            className="bg-violet-400 h-1 rounded-full transition-all"
            style={{ width:`${Math.min(100,(scanCount / (milestone.id==='ten'?10:milestone.id==='five'?5:milestone.id==='three'?3:1))*100)}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

function TimelineCard({ scan, idx, isLatest, prev, expanded, onToggle }) {
  const delta = prev ? scan.score - prev.score : null;
  const seasonCfg = SEASON_COLORS[scan.season] || SEASON_COLORS.Winter;
  const skinScores = scan.skin_scores || {};

  return (
    <motion.div
      initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay: idx*0.04 }}
      className="flex gap-4 relative"
    >
      {/* Dot */}
      <div className={`w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center shrink-0 z-10 mt-1 ${
        isLatest ? 'bg-gradient-to-br from-violet-600 to-teal-500' : 'bg-white border-slate-200'
      }`}>
        {isLatest
          ? <FaStar className="text-white text-sm" />
          : <FaCameraRetro className="text-slate-400 text-sm" />
        }
      </div>

      {/* Card */}
      <div className={`flex-1 bg-white rounded-2xl border shadow-sm transition-all ${
        isLatest ? 'border-violet-300 ring-1 ring-violet-100 shadow-violet-50' : 'border-slate-100 hover:shadow-md'
      }`}>
        {/* Main row */}
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            {/* Left */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <FaCalendarAlt className="text-slate-400" size={10} />
                  {fmtDate(scan.date)}
                </span>
                {isLatest && (
                  <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full border border-violet-200">
                    Most Recent
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${seasonCfg.bg} ${seasonCfg.text}`}>
                  {scan.season}
                </span>
                {scan.skin_tone && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {scan.skin_tone}
                  </span>
                )}
                {scan.face_shape && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {scan.face_shape} face
                  </span>
                )}
                {scan.confidence != null && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                    {Math.round(scan.confidence * 100 > 1 ? scan.confidence : scan.confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </div>

            {/* Score badge */}
            <div className={`flex flex-col items-center justify-center w-20 h-16 rounded-2xl border-2 ${scoreBg(scan.score)} shrink-0`}>
              <span className={`text-2xl font-black leading-none ${scoreColor(scan.score)}`}>{scan.score}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Score</span>
              {delta !== null && (
                <div className={`flex items-center gap-0.5 text-[9px] font-black mt-0.5 ${delta>0?'text-emerald-600':delta<0?'text-rose-500':'text-slate-400'}`}>
                  {delta>0?<FaArrowUp size={7}/>:delta<0?<FaArrowDown size={7}/>:<FaMinus size={7}/>}
                  {delta>0?'+':''}{delta}
                </div>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          {Object.keys(skinScores).length > 0 && (
            <button
              onClick={onToggle}
              className="mt-3 flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-colors"
            >
              {expanded ? <FaChevronUp size={9}/> : <FaChevronDown size={9}/>}
              {expanded ? 'Hide details' : 'View skin details'}
            </button>
          )}
        </div>

        {/* Expanded skin scores */}
        <AnimatePresence>
          {expanded && Object.keys(skinScores).length > 0 && (
            <motion.div
              initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key:'hydration', label:'Hydration', good:true },
                  { key:'barrier',   label:'Barrier',   good:true },
                  { key:'evenness',  label:'Evenness',  good:true },
                  { key:'elasticity',label:'Elasticity',good:true },
                  { key:'acne',      label:'Acne',      good:false },
                  { key:'oiliness',  label:'Oiliness',  good:false },
                  { key:'texture',   label:'Texture',   good:false },
                  { key:'pores',     label:'Pores',     good:false },
                ].map(({ key, label, good }) => {
                  const raw = skinScores[key];
                  if (raw == null) return null;
                  const pct = Math.round(raw * 100);
                  const displayPct = good ? pct : 100 - pct;
                  const barColor = displayPct >= 70 ? 'bg-emerald-400' : displayPct >= 45 ? 'bg-amber-400' : 'bg-rose-400';
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                        <span>{label}</span>
                        <span className="font-black text-slate-700">{displayPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width:`${displayPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */

export default function SkinJourney() {
  const { user, profile } = useAuth();
  const [scans, setScans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [period, setPeriod]     = useState('all');
  const [expanded, setExpanded] = useState({});
  const [exporting, setExporting] = useState(false);
  const retryRef = useRef(0);

  const userName = profile?.name || user?.name || user?.sub?.split('@')[0] || 'User';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const historyRes = await getHistory();
      const history = Array.isArray(historyRes) ? historyRes : (historyRes.analyses || []);
      if (!Array.isArray(history)) throw new Error('Invalid response');

      const entries = history.map((h, i) => ({
        id: h.id || h._id || i,
        date: h.created_at || h.date || new Date().toISOString(),
        season: h.season || 'Winter',
        skin_tone: h.skin_tone || null,
        face_shape: h.face_shape || null,
        confidence: h.confidence ?? h.face_shape_conf ?? null,
        skin_scores: h.skin_scores || {},
        score: computeScore(h.skin_scores || {}),
        raw: h,
      }));

      // Sort newest first
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      setScans(entries);
    } catch (e) {
      setError(e.message || 'Failed to load your skin journey.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter scans by period
  const filteredScans = useMemo(() => {
    if (period === 'all') return scans;
    const days = period === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return scans.filter(s => new Date(s.date) >= cutoff);
  }, [scans, period]);

  // Chart data — chronological (oldest first)
  const chartData = useMemo(() => {
    const chronological = [...filteredScans].reverse();
    return chronological.map((s, i) => ({
      date: fmtShort(s.date),
      score: s.score,
      delta: i > 0 ? s.score - chronological[i-1].score : null,
    }));
  }, [filteredScans]);

  const avgScore = useMemo(() => {
    if (!filteredScans.length) return 0;
    return Math.round(filteredScans.reduce((a, s) => a + s.score, 0) / filteredScans.length);
  }, [filteredScans]);

  const latestScore  = filteredScans[0]?.score ?? 0;
  const oldestScore  = filteredScans[filteredScans.length - 1]?.score ?? 0;
  const improvement  = filteredScans.length >= 2 ? latestScore - oldestScore : 0;
  const unlockedMilestones = MILESTONES.filter(m => m.req(scans)); // milestones always use all scans

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleExport = async () => {
    setExporting(true);
    try { generateBeautyReport(scans[0]?.raw || null, userName); }
    finally { setTimeout(() => setExporting(false), 1200); }
  };

  /* ── Error state ── */
  if (error && !loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-rose-200 p-8 max-w-sm text-center shadow-sm">
        <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <FaArrowDown className="text-rose-400" size={18} />
        </div>
        <h3 className="text-base font-black text-slate-800 mb-1">Couldn't load your journey</h3>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors"
        >
          <FaRedo size={11} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">Skin Intelligence</p>
            <h1 className="text-2xl font-black text-slate-800 leading-tight">My Skin Journey</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading ? 'Loading your progress…' : `${scans.length} scan${scans.length !== 1 ? 's' : ''} tracked · ${userName}`}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading || !scans.length || exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <FaDownload size={11} />
            {exporting ? 'Generating…' : 'Export Report'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Scans"       value={loading ? '—' : scans.length}                                       icon={<FaCameraRetro className="text-violet-500" />}  loading={loading} />
          <StatCard label="Latest Score"      value={loading ? '—' : `${latestScore}/100`}                               icon={<FaStar className="text-amber-500" />}           loading={loading} sub={loading?null:`Avg ${avgScore}/100`} />
          <StatCard label="Total Improvement" value={loading ? '—' : `${improvement>=0?'+':''}${improvement} pts`}       icon={improvement>=0?<FaArrowUp className="text-emerald-500"/>:<FaArrowDown className="text-rose-400"/>} loading={loading} trend={improvement||undefined} />
          <StatCard label="Milestones"        value={loading ? '—' : `${unlockedMilestones.length}/${MILESTONES.length}`} icon={<FaTrophy className="text-amber-500" />}         loading={loading} />
        </div>

        {/* ── Score Progression Chart ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Score Progression</p>
              {!loading && filteredScans.length > 0 && (
                <p className="text-sm text-slate-500 mt-0.5">
                  Average: <span className={`font-black ${scoreColor(avgScore)}`}>{avgScore}</span>/100
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    period === p.key
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-48" />
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No scans in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={avgScore} stroke="#8B5CF6" strokeDasharray="4 2" strokeWidth={1.5}
                  label={{ value:`Avg ${avgScore}`, position:'right', fontSize:9, fill:'#8B5CF6', fontWeight:700 }} />
                <Area
                  type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2.5}
                  fill="url(#scoreGrad)" dot={{ r:4, fill:'#8B5CF6', strokeWidth:2, stroke:'#fff' }}
                  activeDot={{ r:6, fill:'#8B5CF6', strokeWidth:2, stroke:'#fff' }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Achievements ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Achievements</p>
              {!loading && (
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-black text-violet-700">{unlockedMilestones.length}</span>
                  <span className="text-slate-400">/{MILESTONES.length} unlocked</span>
                </p>
              )}
            </div>
            {!loading && (
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-teal-400 rounded-full transition-all"
                  style={{ width:`${(unlockedMilestones.length/MILESTONES.length)*100}%` }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MILESTONES.map((m, i) => (
              <AchievementCard
                key={m.id}
                milestone={m}
                unlocked={m.req(scans)}
                scanCount={scans.length}
                loading={loading}
              />
            ))}
          </div>
        </div>

        {/* ── Timeline ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scan Timeline</p>
            {!loading && filteredScans.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <FaFilter size={9} />
                <span className="font-semibold">{filteredScans.length} scan{filteredScans.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <FaCameraRetro className="text-slate-300 text-4xl mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">No scans yet</p>
              <p className="text-xs text-slate-400 mt-1">Run a Face Analysis to start your skin journey</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-5 bottom-0 w-0.5 bg-gradient-to-b from-violet-200 via-slate-200 to-transparent" />

              <div className="space-y-5">
                {filteredScans.map((scan, idx) => (
                  <TimelineCard
                    key={scan.id}
                    scan={scan}
                    idx={idx}
                    isLatest={idx === 0}
                    prev={filteredScans[idx + 1] || null}
                    expanded={!!expanded[scan.id]}
                    onToggle={() => toggleExpand(scan.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Nudge ── */}
        {!loading && scans.length > 0 && scans.length < 3 && (
          <motion.div
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl"
          >
            <FaLeaf className="text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-black text-violet-800">Keep scanning to build your journey!</p>
              <p className="text-xs text-violet-500 mt-0.5">Scan every 2 weeks to track real improvements and unlock all milestones.</p>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
