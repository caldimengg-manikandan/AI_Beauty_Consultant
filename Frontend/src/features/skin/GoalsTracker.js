import { useState, useEffect, useMemo } from 'react';
import {
  FaCheckCircle, FaRegCircle, FaPlus, FaTimes,
  FaLeaf, FaTint, FaStar, FaShieldAlt, FaSun, FaFire,
  FaFlask, FaArrowRight, FaLock, FaChartLine,
  FaBullseye, FaCalendarAlt, FaRocket, FaExclamationTriangle,
  FaClock, FaChevronDown, FaChevronUp, FaTrophy, FaCheckDouble,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Goal Library ─────────────────────────────────────────────────────── */

const GOAL_LIBRARY = [
  {
    id: 'darks',
    label: 'Reduce Dark Spots',
    icon: <FaSun className="text-amber-500" />,
    emoji: '☀️',
    color: 'amber',
    desc: 'Fade hyperpigmentation and achieve a more even skin tone.',
    keyIngredients: ['Vitamin C 15%','Niacinamide 10%','Kojic Acid','Alpha Arbutin'],
    products: ['Minimalist Vitamin C 10%','The Ordinary Alpha Arbutin 2%','CeraVe AM SPF 50'],
    steps: ['Apply Vitamin C serum every AM', 'Use SPF 50 daily (mandatory)', 'Niacinamide PM 3× weekly', 'Avoid picking or squeezing spots'],
    durationWeeks: [8, 12],
  },
  {
    id: 'hydrate',
    label: 'Achieve Hydrated Skin',
    icon: <FaTint className="text-blue-500" />,
    emoji: '💧',
    color: 'blue',
    desc: 'Build lasting hydration and repair a compromised moisture barrier.',
    keyIngredients: ['Hyaluronic Acid','Ceramide NP','Squalane','Panthenol'],
    products: ['CeraVe Moisturising Cream','The Ordinary HA 2%','Neutrogena Hydro Boost Gel'],
    steps: ['Apply HA serum on damp skin', 'Seal with ceramide moisturiser', 'Avoid hot showers (strip barrier)', 'Drink 2–3L water daily'],
    durationWeeks: [4, 6],
  },
  {
    id: 'acne',
    label: 'Clear Acne',
    icon: <FaLeaf className="text-emerald-500" />,
    emoji: '🌿',
    color: 'emerald',
    desc: 'Reduce active breakouts and prevent future acne.',
    keyIngredients: ['Salicylic Acid 2%','Niacinamide 10%','Adapalene 0.1%','Zinc PCA'],
    products: ["Paula's Choice BHA 2%",'The Ordinary Niacinamide 10%','La Roche-Posay Effaclar'],
    steps: ['Cleanse 2× daily with BHA wash', 'Apply niacinamide AM + PM', 'Use Adapalene (retinoid) 3× weekly at night', 'Never pop pimples'],
    durationWeeks: [6, 10],
  },
  {
    id: 'pores',
    label: 'Minimise Pores',
    icon: <FaFlask className="text-violet-500" />,
    emoji: '🔬',
    color: 'violet',
    desc: 'Refine the appearance of enlarged or congested pores.',
    keyIngredients: ['Niacinamide 10%','BHA 2%','Retinol 0.3%','Clay minerals'],
    products: ['The Ordinary Niacinamide 10%','Cos-De RICE Toner','Innisfree Super Volcanic Mask'],
    steps: ['Use BHA exfoliant 2–3× weekly', 'Niacinamide serum daily', 'Clay mask 1× weekly', 'Avoid thick creams on T-zone'],
    durationWeeks: [8, 10],
  },
  {
    id: 'aging',
    label: 'Anti-Aging & Firmness',
    icon: <FaStar className="text-rose-500" />,
    emoji: '⭐',
    color: 'rose',
    desc: 'Improve skin elasticity and reduce visible fine lines.',
    keyIngredients: ['Retinol 0.3%','Peptide Complex','Vitamin C','Coenzyme Q10'],
    products: ['The Inkey List Retinol Serum','COSRX Snail Mucin 96%','Olay Regenerist Whip SPF 30'],
    steps: ['Retinol 0.3% PM 3× weekly (build up slowly)', 'Peptide serum AM', 'Vitamin C AM + SPF', 'Facial massage 5 min daily'],
    durationWeeks: [12, 16],
  },
  {
    id: 'tone',
    label: 'Even Skin Tone',
    icon: <FaShieldAlt className="text-teal-500" />,
    emoji: '🛡️',
    color: 'teal',
    desc: 'Smooth out redness, blotchiness, and uneven complexion.',
    keyIngredients: ['Azelaic Acid 10%','Tranexamic Acid','Niacinamide','Centella Asiatica'],
    products: ['The Ordinary Azelaic Acid 10%','Cos-De Tranexamic Acid','Cetaphil Redness Relieving SPF'],
    steps: ['Azelaic Acid AM + PM', 'Avoid high-heat (saunas, hot showers)', 'Green tea extract toner', 'SPF 50 daily'],
    durationWeeks: [8, 12],
  },
  {
    id: 'glow',
    label: 'Achieve Glass Skin Glow',
    icon: <FaFire className="text-orange-500" />,
    emoji: '✨',
    color: 'orange',
    desc: 'Achieve the luminous, glass-like skin finish with a layered routine.',
    keyIngredients: ['Vitamin C 15%','Niacinamide','AHA 8%','Sheet Mask Essence'],
    products: ['Minimalist Vitamin C 10%','COSRX AHA 7 Whitehead Toner','Neutrogena Hydro Boost'],
    steps: ['Double cleanse each PM', 'AHA toner 2× weekly', 'Layer — toner → essence → serum → cream', 'Sheet mask 2× weekly for instant glow'],
    durationWeeks: [4, 8],
  },
];

const COLOR_MAP = {
  amber:   { bg:'bg-amber-50',  border:'border-amber-200',  text:'text-amber-700',  badge:'bg-amber-100',   bar:'from-amber-400 to-amber-300',  glow:'shadow-amber-100'  },
  blue:    { bg:'bg-blue-50',   border:'border-blue-200',   text:'text-blue-700',   badge:'bg-blue-100',    bar:'from-blue-500 to-teal-400',     glow:'shadow-blue-100'   },
  emerald: { bg:'bg-emerald-50',border:'border-emerald-200',text:'text-emerald-700',badge:'bg-emerald-100', bar:'from-emerald-500 to-teal-400',  glow:'shadow-emerald-100'},
  violet:  { bg:'bg-violet-50', border:'border-violet-200', text:'text-violet-700', badge:'bg-violet-100',  bar:'from-violet-500 to-indigo-400', glow:'shadow-violet-100' },
  rose:    { bg:'bg-rose-50',   border:'border-rose-200',   text:'text-rose-700',   badge:'bg-rose-100',    bar:'from-rose-500 to-pink-400',     glow:'shadow-rose-100'   },
  teal:    { bg:'bg-teal-50',   border:'border-teal-200',   text:'text-teal-700',   badge:'bg-teal-100',    bar:'from-teal-500 to-cyan-400',     glow:'shadow-teal-100'   },
  orange:  { bg:'bg-orange-50', border:'border-orange-200', text:'text-orange-700', badge:'bg-orange-100',  bar:'from-orange-400 to-amber-300',  glow:'shadow-orange-100' },
};

const MAX_GOALS    = 3;
const STORAGE_KEY  = 'skinGoals';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
  catch { return '—'; }
};

const weeksSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso)) / (7*86400000)));
const daysSince  = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso)) / 86400000));

const estimatedCompletion = (addedAt, durationWeeks) => {
  const midWeeks = Math.round((durationWeeks[0] + durationWeeks[1]) / 2);
  const estDate  = new Date(new Date(addedAt).getTime() + midWeeks * 7 * 86400000);
  return estDate;
};

const daysRemaining = (addedAt, durationWeeks) => {
  const est = estimatedCompletion(addedAt, durationWeeks);
  return Math.max(0, Math.ceil((est - Date.now()) / 86400000));
};

const getStatus = (pct, weeksAgo, durationWeeks) => {
  const expectedPct = Math.min(100, (weeksAgo / durationWeeks[1]) * 100);
  if (pct >= 100)            return { label:'Completed',       icon:<FaTrophy />,             color:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-200' };
  if (pct >= expectedPct+15) return { label:'Ahead of Schedule',icon:<FaRocket />,             color:'text-violet-600', bg:'bg-violet-50', border:'border-violet-200'};
  if (pct >= 40 || pct >= expectedPct-10) return { label:'On Track', icon:<FaCheckDouble />,   color:'text-emerald-600',bg:'bg-emerald-50',border:'border-emerald-200'};
  if (weeksAgo < 1)          return { label:'Just Started',    icon:<FaBullseye />,            color:'text-blue-600',   bg:'bg-blue-50',   border:'border-blue-200'  };
  return                            { label:'Needs Attention',  icon:<FaExclamationTriangle />, color:'text-rose-600',   bg:'bg-rose-50',   border:'border-rose-200'  };
};

/* ─── Sub-components ───────────────────────────────────────────────────── */

function Skeleton({ className }) {
  return <div className={`bg-slate-100 animate-pulse rounded-2xl ${className}`} />;
}

function SummaryCard({ label, value, icon, color = 'text-violet-600', bg = 'bg-violet-50' }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center ${color} text-base shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-800 mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

function ProgressBar({ pct, color, animated = true }) {
  return (
    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
      {/* Milestone marks */}
      {[25, 50, 75].map(m => (
        <div key={m} className="absolute top-0 bottom-0 w-px bg-white/60 z-10" style={{ left:`${m}%` }} />
      ))}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: animated ? 0.9 : 0, ease:'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${color} relative`}
      >
        {pct > 15 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/90 whitespace-nowrap">
            {pct}%
          </span>
        )}
      </motion.div>
    </div>
  );
}

function GoalTimeline({ addedAt, weeksAgo, durationWeeks }) {
  const estDate  = estimatedCompletion(addedAt, durationWeeks);
  const items = [
    { label: 'Goal Created',           date: fmtDate(addedAt),     done: true  },
    { label: 'Routine Started',        date: `Week 1`,              done: true  },
    { label: `Now — Week ${weeksAgo+1}`,date: 'Today',             done: false, active: true },
    { label: 'Expected Completion',    date: fmtDate(estDate),      done: false },
  ];
  return (
    <div className="relative pl-4">
      <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 z-10 ${
              item.active ? 'bg-violet-500 border-violet-500' :
              item.done   ? 'bg-emerald-400 border-emerald-400' :
                            'bg-white border-slate-300'
            }`} />
            <div>
              <p className={`text-[10px] font-black ${item.active ? 'text-violet-700' : item.done ? 'text-slate-600' : 'text-slate-400'}`}>
                {item.label}
              </p>
              <p className="text-[9px] text-slate-400 font-medium">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalCard({ goalData, userGoal, onRemove, onToggleCheck }) {
  const [isOpen, setIsOpen] = useState(false);
  const { id, addedAt, checkmarks } = userGoal;
  const goal   = goalData;
  const c      = COLOR_MAP[goal.color];
  const pct    = Math.round((checkmarks.length / goal.steps.length) * 100);
  const weeks  = weeksSince(addedAt);
  const days   = daysSince(addedAt);
  const status = getStatus(pct, weeks, goal.durationWeeks);
  const daysLeft   = daysRemaining(addedAt, goal.durationWeeks);
  const estDate    = estimatedCompletion(addedAt, goal.durationWeeks);
  const lastActive = checkmarks.length > 0 ? 'Today' : days === 0 ? 'Today' : `${days}d ago`;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8, scale:0.97 }}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isOpen ? `${c.border} ring-1 ring-offset-0 shadow-lg ${c.glow}` : 'border-slate-100 hover:border-slate-200'
      }`}
    >
      {/* Card Header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setIsOpen(o => !o)}
      >
        {/* Icon */}
        <div className={`w-12 h-12 ${c.badge} rounded-2xl flex items-center justify-center text-xl shrink-0 border ${c.border}`}>
          {goal.emoji}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p className="text-sm font-black text-slate-800">{goal.label}</p>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${c.badge} ${c.text} ${c.border}`}>
              Week {weeks + 1}
            </span>
            <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
              <span className="text-[8px]">{status.icon}</span>
              {status.label}
            </span>
          </div>

          <ProgressBar pct={pct} color={c.bar} />

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold">
              {checkmarks.length}/{goal.steps.length} steps · Est. {goal.durationWeeks[0]}–{goal.durationWeeks[1]} weeks
            </span>
            {daysLeft > 0 && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <FaClock size={8} />
                {daysLeft}d remaining
              </span>
            )}
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <FaCalendarAlt size={8} />
              Est. {fmtDate(estDate)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onRemove(id); }}
            className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <FaTimes size={11} />
          </button>
          <div className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <FaChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="detail"
            initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            transition={{ duration:0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 border-t border-slate-100 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                {/* Timeline */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Goal Timeline</p>
                  <GoalTimeline addedAt={addedAt} weeksAgo={weeks} durationWeeks={goal.durationWeeks} />
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Last Activity</p>
                    <p className="text-xs font-black text-slate-700">{lastActive}</p>
                  </div>
                </div>

                {/* Daily Steps */}
                <div className="md:col-span-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Daily Checklist</p>
                  <div className="space-y-2">
                    {goal.steps.map((step, i) => {
                      const done = checkmarks.includes(i);
                      return (
                        <button
                          key={i}
                          onClick={() => onToggleCheck(id, i)}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm ${
                            done ? `${c.bg} ${c.border}` : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {done
                            ? <FaCheckCircle className={`shrink-0 mt-0.5 ${c.text}`} size={13} />
                            : <FaRegCircle className="shrink-0 mt-0.5 text-slate-300" size={13} />
                          }
                          <p className={`text-xs font-semibold leading-snug ${done ? `${c.text} line-through opacity-60` : 'text-slate-600'}`}>
                            {step}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Key Ingredients */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Key Ingredients</p>
                  <div className="space-y-2">
                    {goal.keyIngredients.map(ing => (
                      <div key={ing} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${c.bg} ${c.border}`}>
                        <FaFlask className={`text-xs ${c.text} shrink-0`} />
                        <span className={`text-xs font-bold ${c.text}`}>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Products */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Products</p>
                  <div className="space-y-2">
                    {goal.products.map(prod => (
                      <div key={prod} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                        <FaArrowRight className="text-slate-400 text-xs shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-700">{prod}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-3 flex items-center gap-1 leading-tight">
                    <FaLock size={8} /> Always patch-test new products before full application.
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */

export default function GoalsTracker() {
  const [myGoals, setMyGoals]   = useState([]);
  const [pickMode, setPickMode] = useState(false);
  const [loading, setLoading]   = useState(true);

  /* Persist to localStorage */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMyGoals(JSON.parse(saved));
    } catch {}
    // Brief load delay to show skeleton
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const save = (g) => {
    setMyGoals(g);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(g)); } catch {}
  };

  const addGoal = (id) => {
    if (myGoals.find(g => g.id === id) || myGoals.length >= MAX_GOALS) return;
    save([...myGoals, { id, addedAt: new Date().toISOString(), checkmarks: [] }]);
    setPickMode(false);
  };

  const removeGoal   = (id)              => save(myGoals.filter(g => g.id !== id));
  const toggleCheck  = (goalId, stepIdx) => save(myGoals.map(g => {
    if (g.id !== goalId) return g;
    const checks = g.checkmarks.includes(stepIdx)
      ? g.checkmarks.filter(i => i !== stepIdx)
      : [...g.checkmarks, stepIdx];
    return { ...g, checkmarks: checks };
  }));

  const gdef  = (id) => GOAL_LIBRARY.find(g => g.id === id);
  const added = new Set(myGoals.map(g => g.id));

  /* Computed summary stats */
  const summaryStats = useMemo(() => {
    const active    = myGoals.length;
    const completed = myGoals.filter(({ id, checkmarks }) => {
      const g = gdef(id);
      return g && checkmarks.length === g.steps.length;
    }).length;
    const avgPct = active === 0 ? 0 : Math.round(
      myGoals.reduce((acc, { id, checkmarks }) => {
        const g = gdef(id);
        if (!g) return acc;
        return acc + (checkmarks.length / g.steps.length) * 100;
      }, 0) / active
    );
    const totalSteps   = myGoals.reduce((a, { id }) => { const g = gdef(id); return a + (g?.steps.length || 0); }, 0);
    const doneSteps    = myGoals.reduce((a, { checkmarks }) => a + checkmarks.length, 0);
    const consistency  = totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100);
    return { active, completed, avgPct, consistency };
  }, [myGoals]);

  const slotsUsed = myGoals.length;
  const slotsLeft = MAX_GOALS - slotsUsed;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">Skin Intelligence</p>
            <h1 className="text-2xl font-black text-slate-800 leading-tight">Skin Goals Tracker</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Set up to {MAX_GOALS} personalised skin goals and track daily progress with curated routines.
            </p>
          </div>

          {/* Add Goal button with slot indicator */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={() => setPickMode(p => !p)}
              disabled={slotsLeft === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                slotsLeft === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-teal-500 text-white hover:opacity-90 shadow-violet-200'
              }`}
            >
              <FaPlus size={11} />
              {pickMode ? 'Close' : 'Add Goal'}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${
                slotsLeft === 0 ? 'bg-slate-200 text-slate-500' : 'bg-white/25 text-white'
              }`}>
                {slotsUsed}/{MAX_GOALS}
              </span>
            </button>
            {/* Slot dots */}
            <div className="flex gap-1">
              {Array.from({ length: MAX_GOALS }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < slotsUsed ? 'bg-violet-500' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Summary Stats ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : myGoals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Active Goals"    value={summaryStats.active}              icon={<FaBullseye />}      color="text-violet-600" bg="bg-violet-50" />
            <SummaryCard label="Completed"       value={summaryStats.completed}            icon={<FaTrophy />}        color="text-amber-600"  bg="bg-amber-50"  />
            <SummaryCard label="Avg Progress"    value={`${summaryStats.avgPct}%`}         icon={<FaChartLine />}     color="text-blue-600"   bg="bg-blue-50"   />
            <SummaryCard label="Consistency"     value={`${summaryStats.consistency}%`}   icon={<FaCheckDouble />}   color="text-emerald-600" bg="bg-emerald-50" />
          </div>
        ) : null}

        {/* ── Goal Picker ── */}
        <AnimatePresence>
          {pickMode && (
            <motion.div
              key="picker"
              initial={{ opacity:0, y:-10, scale:0.98 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-10, scale:0.98 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-black text-slate-800">Choose a skin goal</p>
                  <p className="text-xs text-slate-400 mt-0.5">{slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining</p>
                </div>
                <button
                  onClick={() => setPickMode(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <FaTimes size={12} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {GOAL_LIBRARY.map(g => {
                  const isAdded = added.has(g.id);
                  const c = COLOR_MAP[g.color];
                  return (
                    <motion.button
                      key={g.id}
                      onClick={() => addGoal(g.id)}
                      disabled={isAdded}
                      whileHover={!isAdded ? { scale:1.02, y:-2 } : {}}
                      whileTap={!isAdded ? { scale:0.98 } : {}}
                      className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                        isAdded
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                          : `${c.bg} ${c.border} hover:shadow-md`
                      }`}
                    >
                      <span className="text-xl mt-0.5 shrink-0">{g.emoji}</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-black truncate ${isAdded ? 'text-slate-400' : c.text}`}>{g.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{g.desc}</p>
                        <p className={`text-[9px] font-bold mt-1.5 ${isAdded ? 'text-slate-400' : c.text}`}>
                          {isAdded ? '✓ Added' : `Est. ${g.durationWeeks[0]}–${g.durationWeeks[1]} weeks`}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ── */}
        {!loading && !pickMode && myGoals.length === 0 && (
          <motion.div
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            className="py-20 text-center bg-white border border-dashed border-slate-300 rounded-2xl"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-teal-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-violet-100">
              <FaBullseye className="text-violet-400 text-3xl" />
            </div>
            <h3 className="text-base font-black text-slate-700 mb-1">No Active Goals Yet</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto leading-relaxed">
              Start your skincare journey by creating your first personalised goal with a curated routine.
            </p>
            <div className="flex items-center justify-center gap-2 mb-2">
              {Array.from({ length: MAX_GOALS }).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                  <FaPlus size={10} />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mb-5">{MAX_GOALS} goal slots available</p>
            <button
              onClick={() => setPickMode(true)}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-200"
            >
              <FaPlus size={11} /> Create Your First Goal
            </button>
          </motion.div>
        )}

        {/* ── Active Goal Cards ── */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {myGoals.map(userGoal => {
              const goal = gdef(userGoal.id);
              if (!goal) return null;
              return (
                <GoalCard
                  key={userGoal.id}
                  goalData={goal}
                  userGoal={userGoal}
                  onRemove={removeGoal}
                  onToggleCheck={toggleCheck}
                />
              );
            })}
          </AnimatePresence>
        )}

        {/* ── All Slots Full Notice ── */}
        {!loading && myGoals.length === MAX_GOALS && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl"
          >
            <FaLock className="text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-black text-violet-800">All {MAX_GOALS} goal slots used</p>
              <p className="text-xs text-violet-500 mt-0.5">Complete or remove a goal to add a new one.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
