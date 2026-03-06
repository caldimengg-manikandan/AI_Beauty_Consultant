import React, { useState, useEffect } from 'react';
import {
  FaCheckCircle, FaRegCircle, FaPlus, FaTimes,
  FaLeaf, FaTint, FaStar, FaShieldAlt, FaSun, FaFire,
  FaFlask, FaArrowRight, FaLock, FaChartLine
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// GOAL DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const GOAL_LIBRARY = [
  {
    id: 'darks',
    label: 'Reduce Dark Spots',
    icon: <FaSun className="text-amber-500" />,
    color: 'amber',
    desc: 'Fade hyperpigmentation and achieve a more even skin tone.',
    keyIngredients: ['Vitamin C 15%','Niacinamide 10%','Kojic Acid','Alpha Arbutin'],
    products: ['Minimalist Vitamin C 10%','The Ordinary Alpha Arbutin 2%','CeraVe AM SPF 50'],
    steps: ['Apply Vitamin C serum every AM', 'Use SPF 50 daily (mandatory)', 'Niacinamide PM 3× weekly', 'Avoid picking or squeezing spots'],
    duration: '8–12 weeks',
  },
  {
    id: 'hydrate',
    label: 'Achieve Hydrated Skin',
    icon: <FaTint className="text-blue-500" />,
    color: 'blue',
    desc: 'Build lasting hydration and repair a compromised moisture barrier.',
    keyIngredients: ['Hyaluronic Acid','Ceramide NP','Squalane','Panthenol'],
    products: ['CeraVe Moisturising Cream','The Ordinary HA 2%','Neutrogena Hydro Boost Gel'],
    steps: ['Apply HA serum on damp skin', 'Seal with ceramide moisturiser', 'Avoid hot showers (strip barrier)', 'Drink 2–3L water daily'],
    duration: '4–6 weeks',
  },
  {
    id: 'acne',
    label: 'Clear Acne',
    icon: <FaLeaf className="text-emerald-500" />,
    color: 'emerald',
    desc: 'Reduce active breakouts and prevent future acne.',
    keyIngredients: ['Salicylic Acid 2%','Niacinamide 10%','Adapalene 0.1%','Zinc PCA'],
    products: ['Paula\'s Choice BHA 2%','The Ordinary Niacinamide 10%','La Roche-Posay Effaclar'],
    steps: ['Cleanse 2× daily with BHA wash', 'Apply niacinamide AM + PM', 'Use Adapalene (retinoid) 3× weekly at night', 'Never pop pimples'],
    duration: '6–10 weeks',
  },
  {
    id: 'pores',
    label: 'Minimise Pores',
    icon: <FaFlask className="text-violet-500" />,
    color: 'violet',
    desc: 'Refine the appearance of enlarged or congested pores.',
    keyIngredients: ['Niacinamide 10%','BHA 2%','Retinol 0.3%','Clay minerals'],
    products: ['The Ordinary Niacinamide 10%','Cos-De RICE Toner','Innisfree Super Volcanic Mask'],
    steps: ['Use BHA exfoliant 2–3× weekly', 'Niacinamide serum daily', 'Clay mask 1× weekly', 'Avoid thick creams on T-zone'],
    duration: '8–10 weeks',
  },
  {
    id: 'aging',
    label: 'Anti-Aging & Firmness',
    icon: <FaStar className="text-rose-500" />,
    color: 'rose',
    desc: 'Improve skin elasticity and reduce visible fine lines.',
    keyIngredients: ['Retinol 0.3%','Peptide Complex','Vitamin C','Coenzyme Q10'],
    products: ['The Inkey List Retinol Serum','COSRX Snail Mucin 96%','Olay Regenerist Whip SPF 30'],
    steps: ['Retinol 0.3% PM 3× weekly (build up slowly)', 'Peptide serum AM', 'Vitamin C AM + SPF', 'Facial massage 5 min daily'],
    duration: '12–16 weeks',
  },
  {
    id: 'tone',
    label: 'Even Skin Tone',
    icon: <FaShieldAlt className="text-teal-500" />,
    color: 'teal',
    desc: 'Smooth out redness, blotchiness, and uneven complexion.',
    keyIngredients: ['Azelaic Acid 10%','Tranexamic Acid','Niacinamide','Centella Asiatica'],
    products: ['The Ordinary Azelaic Acid 10%','Cos-De Tranexamic Acid','Cetaphil Redness Relieving SPF'],
    steps: ['Azelaic Acid AM + PM', 'Avoid high-heat (saunas, hot showers)', 'Green tea extract toner', 'SPF 50 daily'],
    duration: '8–12 weeks',
  },
  {
    id: 'glow',
    label: 'Achieve Glass Skin Glow',
    icon: <FaFire className="text-orange-500" />,
    color: 'orange',
    desc: 'Achieve the luminous, glass-like skin finish with a layered routine.',
    keyIngredients: ['Vitamin C 15%','Niacinamide','AHA 8%','Sheet Mask Essence'],
    products: ['Minimalist Vitamin C 10%','COSRX AHA 7 Whitehead Toner','Neutrogena Hydro Boost'],
    steps: ['Double cleanse each PM', 'AHA toner 2× weekly', 'Layer — toner → essence → serum → cream', 'Sheet mask 2× weekly for instant glow'],
    duration: '4–8 weeks',
  },
];

const COLOR_MAP = {
  amber:   { bg:'bg-amber-50',  border:'border-amber-200',  text:'text-amber-700',  badge:'bg-amber-100',  ring:'ring-amber-400',  bar:'bg-amber-400'  },
  blue:    { bg:'bg-blue-50',   border:'border-blue-200',   text:'text-blue-700',   badge:'bg-blue-100',   ring:'ring-blue-400',   bar:'bg-blue-400'   },
  emerald: { bg:'bg-emerald-50',border:'border-emerald-200',text:'text-emerald-700',badge:'bg-emerald-100',ring:'ring-emerald-400',bar:'bg-emerald-400' },
  violet:  { bg:'bg-violet-50', border:'border-violet-200', text:'text-violet-700', badge:'bg-violet-100', ring:'ring-violet-400', bar:'bg-violet-400' },
  rose:    { bg:'bg-rose-50',   border:'border-rose-200',   text:'text-rose-700',   badge:'bg-rose-100',   ring:'ring-rose-400',   bar:'bg-rose-400'   },
  teal:    { bg:'bg-teal-50',   border:'border-teal-200',   text:'text-teal-700',   badge:'bg-teal-100',   ring:'ring-teal-400',   bar:'bg-teal-400'   },
  orange:  { bg:'bg-orange-50', border:'border-orange-200', text:'text-orange-700', badge:'bg-orange-100', ring:'ring-orange-400', bar:'bg-orange-400' },
};

const MAX_GOALS = 3;
const STORAGE_KEY = 'skinGoals';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const GoalsTracker = () => {
  const [myGoals, setMyGoals]     = useState([]);   // [ {id, addedAt, checkmarks:[]} ]
  const [expanded, setExpanded]   = useState(null);
  const [pickMode, setPickMode]   = useState(false);

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setMyGoals(JSON.parse(saved));
  }, []);
  const save = (g) => { setMyGoals(g); localStorage.setItem(STORAGE_KEY, JSON.stringify(g)); };

  const addGoal = (id) => {
    if (myGoals.find(g => g.id === id) || myGoals.length >= MAX_GOALS) return;
    save([...myGoals, { id, addedAt: new Date().toISOString(), checkmarks: [] }]);
    setPickMode(false);
  };

  const removeGoal = (id) => save(myGoals.filter(g => g.id !== id));

  const toggleCheck = (goalId, stepIdx) => {
    save(myGoals.map(g => {
      if (g.id !== goalId) return g;
      const checks = g.checkmarks.includes(stepIdx)
        ? g.checkmarks.filter(i => i !== stepIdx)
        : [...g.checkmarks, stepIdx];
      return { ...g, checkmarks: checks };
    }));
  };

  const gdef  = (id) => GOAL_LIBRARY.find(g => g.id === id);
  const added = new Set(myGoals.map(g => g.id));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Skin Intelligence</p>
            <h1 className="text-2xl font-bold text-gray-900">Skin Goals Tracker</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set up to {MAX_GOALS} personalised skin goals and track daily progress with curated routines.
            </p>
          </div>
          {myGoals.length < MAX_GOALS && (
            <button onClick={() => setPickMode(p => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm shrink-0">
              <FaPlus className="text-xs" /> Add Goal ({myGoals.length}/{MAX_GOALS})
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── GOAL PICKER ──────────────────────────────────── */}
        {pickMode && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">Choose a skin goal</p>
              <button onClick={() => setPickMode(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GOAL_LIBRARY.map(g => {
                const isAdded = added.has(g.id);
                const c = COLOR_MAP[g.color];
                return (
                  <button key={g.id} onClick={() => addGoal(g.id)} disabled={isAdded}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all
                      ${isAdded ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : `${c.bg} ${c.border} hover:shadow-md hover:scale-[1.01]`}`}>
                    <span className="mt-0.5 text-lg">{g.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${isAdded ? 'text-gray-400' : c.text}`}>{g.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{g.desc}</p>
                      {isAdded && <p className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 mt-1"><FaCheckCircle className="text-emerald-400" /> Already added</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ────────────────────────────────── */}
        {!pickMode && myGoals.length === 0 && (
          <div className="py-20 text-center bg-white border border-dashed border-gray-300 rounded-xl">
            <FaChartLine className="mx-auto text-gray-300 text-4xl mb-4" />
            <p className="text-base font-semibold text-gray-700">No goals set yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Add up to {MAX_GOALS} skin goals to start tracking your progress.</p>
            <button onClick={() => setPickMode(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors">
              + Add Your First Goal
            </button>
          </div>
        )}

        {/* ── ACTIVE GOALS ───────────────────────────────── */}
        {myGoals.map(({ id, addedAt, checkmarks }) => {
          const goal = gdef(id);
          if (!goal) return null;
          const c       = COLOR_MAP[goal.color];
          const pct     = Math.round((checkmarks.length / goal.steps.length) * 100);
          const isOpen  = expanded === id;
          const weeksAgo = Math.max(0, Math.floor((Date.now() - new Date(addedAt)) / (7*86400000)));

          return (
            <div key={id} className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isOpen ? `${c.border} ring-1 ring-offset-0` : 'border-gray-200'}`}
                 style={isOpen ? {} : {}}>

              {/* Card header */}
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : id)}>
                <div className={`w-10 h-10 ${c.badge} rounded-xl flex items-center justify-center shrink-0`}>
                  {goal.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{goal.label}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge} ${c.text} border ${c.border}`}>
                      Week {weeksAgo + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${c.text} shrink-0`}>{pct}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{checkmarks.length}/{goal.steps.length} steps completed · Est. {goal.duration}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); removeGoal(id); }}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1">
                  <FaTimes />
                </button>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 pb-6 border-t border-gray-100 pt-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    {/* Daily Steps */}
                    <div className="md:col-span-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily Checklist</p>
                      <div className="space-y-2">
                        {goal.steps.map((step, i) => {
                          const done = checkmarks.includes(i);
                          return (
                            <button key={i} onClick={() => toggleCheck(id, i)}
                              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                                ${done ? `${c.bg} ${c.border}` : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                              {done
                                ? <FaCheckCircle className={`shrink-0 mt-0.5 ${c.text}`} />
                                : <FaRegCircle className="shrink-0 mt-0.5 text-gray-400" />}
                              <p className={`text-xs font-medium leading-snug ${done ? c.text : 'text-gray-600'} ${done ? 'line-through opacity-60' : ''}`}>
                                {step}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Key Ingredients */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Key Ingredients</p>
                      <div className="space-y-2">
                        {goal.keyIngredients.map(ing => (
                          <div key={ing} className={`flex items-center gap-2 p-2.5 rounded-lg border ${c.bg} ${c.border}`}>
                            <FaFlask className={`text-xs ${c.text} shrink-0`} />
                            <span className={`text-xs font-semibold ${c.text}`}>{ing}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Products */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Products</p>
                      <div className="space-y-2">
                        {goal.products.map(prod => (
                          <div key={prod} className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                            <FaArrowRight className="text-gray-400 text-xs shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-gray-700">{prod}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
                        <FaLock className="text-[9px]" /> Always patch-test before full use.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsTracker;
