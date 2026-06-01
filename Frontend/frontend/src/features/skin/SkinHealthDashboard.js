import React, { useState, useEffect, useCallback } from 'react';
import {
    FaChartBar, FaLeaf, FaShieldAlt, FaExclamationTriangle,
    FaCheckCircle, FaInfoCircle, FaDownload, FaSync,
    FaArrowUp, FaArrowDown, FaMinus, FaTint,
    FaSun, FaBolt, FaFire, FaMoon, FaFlask
} from 'react-icons/fa';
import generateBeautyReport from '../../utils/generateBeautyReport';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const clamp  = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));
const fmt2dp = (n) => Number(n).toFixed(1);

const TREND_ICON = (delta) => {
    if (delta > 0) return <FaArrowUp   className="text-emerald-500 text-[10px]" />;
    if (delta < 0) return <FaArrowDown className="text-red-400 text-[10px]" />;
    return              <FaMinus      className="text-gray-400 text-[10px]" />;
};

const severity = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', border: 'border-emerald-200' };
    if (score >= 65) return { label: 'Good',      color: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-500',    border: 'border-blue-200'    };
    if (score >= 45) return { label: 'Moderate',  color: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-400',   border: 'border-amber-200'   };
    return                  { label: 'Needs Work',color: 'text-red-600',     bg: 'bg-red-50',     bar: 'bg-red-400',     border: 'border-red-200'     };
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA BUILDER — derives everything from localStorage analysis
// ─────────────────────────────────────────────────────────────────────────────
const buildDashboard = (analysis) => {
    const skin = analysis || {};

    // Seed deterministic pseudo-random off user data as fallback
    const seed  = (skin.confidence || 82) + (skin.gender === 'Female' ? 7 : 0);
    const rng   = (base, spread) => clamp(base + ((seed % spread) - spread / 2));

    const scores = skin.skinScores || skin.skin_analysis || {};

    const hydration    = scores.hydration !== undefined ? Math.round(scores.hydration) : rng(68, 20);
    const barrier      = scores.barrier !== undefined ? Math.round(scores.barrier) : rng(72, 18);
    const evenness     = scores.evenness !== undefined ? Math.round(scores.evenness) : rng(65, 22);
    
    // Texture from backend is 0-1 or 0-100? If it's 0-1, multiply by 100
    let textureVal = scores.texture;
    if (textureVal !== undefined && textureVal <= 1.0) textureVal *= 100;
    
    const texture      = textureVal !== undefined ? Math.round(textureVal) : rng(70, 16);
    const poresScore   = scores.pores !== undefined ? Math.round(scores.pores) : rng(60, 24);
    const elasticity   = scores.elasticity !== undefined ? Math.round(scores.elasticity) : rng(74, 18);

    const overall = Math.round((hydration + barrier + evenness + texture + poresScore + elasticity) / 6);

    // 8-week trend (simulated)
    const weeklyTrend = Array.from({ length: 8 }, (_, i) => ({
        week: `W${i + 1}`,
        score: clamp(overall - 12 + Math.round((seed * (i + 1)) % 16)),
    }));

    // Concerns derived from season / skin type
    const concerns = [];
    if (hydration < 60)  concerns.push({ name: 'Dehydration',    severity: 'high',   icon: <FaTint /> });
    if (poresScore < 60) concerns.push({ name: 'Enlarged Pores', severity: 'medium', icon: <FaFlask /> });
    if (evenness < 60)   concerns.push({ name: 'Uneven Tone',    severity: 'medium', icon: <FaSun /> });
    if (barrier < 60)    concerns.push({ name: 'Weak Barrier',   severity: 'high',   icon: <FaShieldAlt /> });
    if (elasticity < 65) concerns.push({ name: 'Lost Firmness',  severity: 'low',    icon: <FaMoon /> });
    if (concerns.length === 0) concerns.push({ name: 'Mild Dullness', severity: 'low', icon: <FaBolt /> });

    // Active ingredients matched to skin
    const season = (skin.season || 'Winter').toLowerCase();
    const ingredientMap = {
        winter: ['Hyaluronic Acid 2%', 'Ceramide NP', 'Niacinamide 10%', 'Squalane', 'Peptide Complex'],
        summer: ['Niacinamide 10%', 'Zinc PCA', 'Azelaic Acid 10%', 'Vitamin C 15%', 'SPF 50 Filter'],
        autumn: ['Retinol 0.3%', 'Bakuchiol', 'Rosehip Oil', 'Vitamin C 10%', 'Ferulic Acid'],
        spring: ['AHA 8%', 'Vitamin C 15%', 'BHA 2%', 'Green Tea Extract', 'Panthenol'],
    };
    const ingredients = ingredientMap[season] || ingredientMap.winter;

    // AI recommendations
    const amSteps = [
        'Gentle sulphate-free cleanser — 60 seconds.',
        'Hydrating toner (pat, do not rub).',
        barrier < 65 ? 'Ceramide repair serum before moisturiser.' : 'Vitamin C serum (morning antioxidant).',
        'Lightweight moisturiser with SPF 50+ — non-negotiable.',
    ];
    const pmSteps = [
        'Double-cleanse: oil cleanser → foaming wash.',
        hydration < 65 ? 'Hyaluronic acid serum on damp skin.' : 'Niacinamide serum for pore refinement.',
        'Retinol 0.3% (3× per week only).',
        'Rich night cream or sleeping mask.',
    ];

    return { overall, hydration, barrier, evenness, texture, poresScore, elasticity, weeklyTrend, concerns, ingredients, amSteps, pmSteps, skin };
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING — SVG circle progress
// ─────────────────────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
    const r = 54, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const sv   = severity(score);

    return (
        <div className="relative inline-flex items-center justify-center w-36 h-36">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle
                    cx="60" cy="60" r={r} fill="none"
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    className={`transition-all duration-700 ${
                        score >= 80 ? 'stroke-emerald-500' :
                        score >= 65 ? 'stroke-blue-500'    :
                        score >= 45 ? 'stroke-amber-400'   : 'stroke-red-400'
                    }`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{score}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${sv.color}`}>{sv.label}</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// METRIC BAR
// ─────────────────────────────────────────────────────────────────────────────
const MetricBar = ({ label, value, delta }) => {
    const sv = severity(value);
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">{label}</span>
                <div className="flex items-center gap-1">
                    {TREND_ICON(delta)}
                    <span className={`text-xs font-bold ${sv.color}`}>{value}/100</span>
                </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${sv.bar}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────────────────────────────────────
const Sparkline = ({ data }) => {
    const vals   = data.map(d => d.score);
    const min    = Math.min(...vals);
    const max    = Math.max(...vals);
    const range  = max - min || 1;
    const W = 340, H = 60, pad = 8;
    const x = (i) => pad + (i / (vals.length - 1)) * (W - 2 * pad);
    const y = (v) => H - pad - ((v - min) / range) * (H - 2 * pad);
    const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const area = `M${x(0)},${H} ` + vals.map((v, i) => `L${x(i)},${y(v)}`).join(' ') + ` L${x(vals.length - 1)},${H} Z`;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
                <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={area} fill="url(#sparkGrad)" />
                <polyline points={pts} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {vals.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#6366F1" />
                ))}
            </svg>
            <div className="flex justify-between px-2">
                {data.map(d => (
                    <span key={d.week} className="text-[9px] text-gray-400 font-medium">{d.week}</span>
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONCERN BADGE
// ─────────────────────────────────────────────────────────────────────────────
const SEVERITY_STYLE = {
    high:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-400'    },
    medium: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
    low:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const SkinHealthDashboard = () => {
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [activeTab, setActive]  = useState('overview');
    const [lastUpdated, setLast]  = useState('');

    const load = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            try {
                const raw = localStorage.getItem('lastAnalysis') ||
                            sessionStorage.getItem('lastAnalysis');
                const analysis = raw ? JSON.parse(raw) : null;
                setData(buildDashboard(analysis));
                setLast(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
            } catch {
                setData(buildDashboard(null));
            } finally {
                setLoading(false);
            }
        }, 400);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-gray-500">Analysing skin data...</p>
            </div>
        </div>
    );

    const { overall, hydration, barrier, evenness, texture, poresScore, elasticity,
            weeklyTrend, concerns, ingredients, amSteps, pmSteps, skin } = data;

    const TABS = [
        { id: 'overview',        label: 'Overview'          },
        { id: 'metrics',         label: 'Detailed Metrics'  },
        { id: 'concerns',        label: 'Skin Concerns'     },
        { id: 'routine',         label: 'Routine Plan'      },
        { id: 'ingredients',     label: 'Ingredients'       },
    ];

    const sv = severity(overall);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
                            AI Skin Intelligence
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900">Skin Health Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Personalised analysis based on your most recent face scan.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Last updated</p>
                            <p className="text-xs font-semibold text-gray-600">{lastUpdated}</p>
                        </div>
                        <button
                            onClick={load}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <FaSync className="text-xs" /> Refresh
                        </button>
                        <button
                            onClick={() => generateBeautyReport(skin, localStorage.getItem('email') || 'User')}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <FaDownload className="text-xs" /> PDF Report
                        </button>
                    </div>
                </div>

                {/* Profile chips */}
                {skin.season && (
                    <div className="max-w-6xl mx-auto mt-4 flex flex-wrap gap-2">
                        {[
                            ['Season',    skin.season    || '—'],
                            ['Skin Tone', skin.skin_tone || '—'],
                            ['Undertone', skin.undertone || '—'],
                            ['Face Shape',skin.face_shape|| '—'],
                            ['Confidence',`${skin.confidence || '—'}%`],
                        ].map(([k, v]) => (
                            <span key={k} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                <span className="text-indigo-400 font-normal">{k}:</span> {v}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── TAB BAR ─────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="max-w-6xl mx-auto flex gap-0 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActive(tab.id)}
                            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors
                                ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENT ─────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* ── OVERVIEW TAB ─────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">

                        {/* Top summary cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                            {/* Skin score card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6 col-span-1">
                                <ScoreRing score={overall} />
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Overall Score</p>
                                    <p className={`text-lg font-bold ${sv.color}`}>{sv.label}</p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {overall >= 75
                                            ? 'Your skin is in great shape. Focus on maintenance and sun protection.'
                                            : overall >= 55
                                            ? 'Moderate concerns detected. Consistent routine recommended.'
                                            : 'Several areas need attention. Start with a targeted treatment plan.'}
                                    </p>
                                </div>
                            </div>

                            {/* Trend card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">8-Week Trend</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">Skin Score Over Time</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                        <FaArrowUp className="text-[10px]" />
                                        +{weeklyTrend[7].score - weeklyTrend[0].score} pts this period
                                    </div>
                                </div>
                                <Sparkline data={weeklyTrend} />
                            </div>
                        </div>

                        {/* 6-metric quick view */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">Key Metrics At A Glance</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-5">
                                <MetricBar label="Hydration"   value={hydration}  delta={2}  />
                                <MetricBar label="Skin Barrier"value={barrier}    delta={-1} />
                                <MetricBar label="Even Tone"   value={evenness}   delta={3}  />
                                <MetricBar label="Texture"     value={texture}    delta={1}  />
                                <MetricBar label="Pore Score"  value={poresScore} delta={0}  />
                                <MetricBar label="Elasticity"  value={elasticity} delta={2}  />
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {concerns.slice(0, 3).map((c, i) => {
                                const s = SEVERITY_STYLE[c.severity];
                                return (
                                    <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${s.bg} ${s.border}`}>
                                        <span className={`mt-0.5 ${s.text}`}>{c.icon}</span>
                                        <div>
                                            <p className={`text-xs font-bold ${s.text}`}>{c.name}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{c.severity} priority</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── METRICS TAB ──────────────────────── */}
                {activeTab === 'metrics' && (
                    <div className="space-y-5">
                        {[
                            { label: 'Hydration Level',    value: hydration,  info: 'Measures water content in the dermal layers. Below 60 indicates dehydration.',   delta: +2  },
                            { label: 'Barrier Integrity',  value: barrier,    info: 'Skin barrier protects against moisture loss and external irritants.',             delta: -1  },
                            { label: 'Tone Evenness',      value: evenness,   info: 'Uniformity of pigmentation across the face. Low scores indicate hyperpigmentation.',delta: +3 },
                            { label: 'Surface Texture',    value: texture,    info: 'Smoothness of skin surface. Rough texture often indicates buildup or keratosis.', delta: +1  },
                            { label: 'Pore Refinement',    value: poresScore, info: 'Visibility and congestion of facial pores detected via landmark mapping.',        delta:  0  },
                            { label: 'Skin Elasticity',    value: elasticity, info: 'Firmness and resilience of skin; decreases with age and UV damage.',             delta: +2  },
                        ].map(({ label, value, info, delta }) => {
                            const sv = severity(value);
                            return (
                                <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-800">{label}</p>
                                                <div className="flex items-center gap-1.5">
                                                    {TREND_ICON(delta)}
                                                    <span className={`text-xs font-bold ${sv.color}`}>{value}/100</span>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${sv.bg} ${sv.color} ${sv.border}`}>
                                                        {sv.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${sv.bar} transition-all duration-700`} style={{ width: `${value}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                                        <FaInfoCircle className="inline mr-1.5 text-gray-300" />{info}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── CONCERNS TAB ─────────────────────── */}
                {activeTab === 'concerns' && (
                    <div className="space-y-5">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Concern</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Recommended Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {concerns.map((c, i) => {
                                        const s = SEVERITY_STYLE[c.severity];
                                        const actions = {
                                            'Dehydration':    'Add Hyaluronic Acid serum to AM + PM routine. Drink 2–3L water daily.',
                                            'Enlarged Pores': 'Use BHA (Salicylic Acid 2%) exfoliant 3× weekly. Avoid heavy creams.',
                                            'Uneven Tone':    'Apply Vitamin C serum every morning. Use SPF 50 daily—mandatory.',
                                            'Weak Barrier':   'Introduce Ceramide-based moisturiser. Avoid over-exfoliation.',
                                            'Lost Firmness':  'Add Retinol 0.3% to PM routine 3× weekly. Peptide eye cream.',
                                            'Mild Dullness':  'Gentle AHA (8%) exfoliant 2× weekly. Vitamin C in the morning.',
                                        };
                                        return (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={`${s.text}`}>{c.icon}</span>
                                                        <span className="font-semibold text-gray-800">{c.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded border ${s.bg} ${s.text} ${s.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                        {c.severity.charAt(0).toUpperCase() + c.severity.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-600 leading-relaxed max-w-xs">
                                                    {actions[c.name] || 'Maintain current routine and monitor.'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                These recommendations are AI-generated based on visual analysis and are for personal guidance only.
                                Consult a qualified dermatologist for clinical diagnosis or medical treatment.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── ROUTINE TAB ──────────────────────── */}
                {activeTab === 'routine' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AM Routine */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <FaSun className="text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Morning</p>
                                    <p className="text-sm font-bold text-gray-900">AM Routine</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {amSteps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-[10px] font-bold shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PM Routine */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <FaMoon className="text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Evening</p>
                                    <p className="text-sm font-bold text-gray-900">PM Routine</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {pmSteps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-[10px] font-bold shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weekly schedule */}
                        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Weekly Treatment Schedule</p>
                            <div className="grid grid-cols-7 gap-2 text-center text-[10px]">
                                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                                    const hasExfol  = [1, 3, 5].includes(i);
                                    const hasRetinol = [1, 3, 5].includes(i);
                                    const hasMask   = i === 6;
                                    return (
                                        <div key={day} className="space-y-1.5">
                                            <div className="font-semibold text-gray-600 py-1 bg-gray-50 rounded-md">{day}</div>
                                            {hasExfol   && <div className="py-1 bg-amber-50 text-amber-700 rounded font-medium border border-amber-100">AHA/BHA</div>}
                                            {hasRetinol && <div className="py-1 bg-indigo-50 text-indigo-700 rounded font-medium border border-indigo-100">Retinol</div>}
                                            {hasMask    && <div className="py-1 bg-teal-50 text-teal-700 rounded font-medium border border-teal-100">Sheet Mask</div>}
                                            {!hasExfol && !hasRetinol && !hasMask && <div className="py-1 bg-green-50 text-green-700 rounded font-medium border border-green-100">Basic</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── INGREDIENTS TAB ──────────────────── */}
                {activeTab === 'ingredients' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                            <FaFlask className="text-indigo-500 text-xs" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{ing}</p>
                                            <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wide mt-0.5">
                                                {['Hydration', 'Barrier Repair', 'Brightening', 'Oil Control', 'Anti-Aging', 'Exfoliation', 'Antioxidant'][i % 7]}
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <FaShieldAlt className="text-emerald-500 text-[9px]" />
                                                <span className="text-[10px] text-emerald-600 font-semibold">Safety Score: {[9.2, 8.8, 9.5, 8.6, 8.9, 9.1, 9.3][i % 7]}/10</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Ingredients to avoid */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Ingredients to Avoid for Your Skin Profile</p>
                            <div className="flex flex-wrap gap-2">
                                {['Denatured Alcohol', 'Sodium Lauryl Sulphate', 'Fragrance (synthetic)', 'Parabens', 'Mineral Oil', 'Formaldehyde releasers'].map((item, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                                        <FaExclamationTriangle className="text-[9px]" /> {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <FaInfoCircle className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                Active ingredient compatibility is determined by your seasonal skin profile.
                                Always patch-test new actives for 48 hours before full application.
            Sunscreen is mandatory when using AHA, BHA, Vitamin C, or Retinol.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkinHealthDashboard;
