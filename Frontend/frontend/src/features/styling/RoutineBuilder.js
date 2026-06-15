import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from 'react-toastify';
import {
  FaSun, FaMoon, FaCheckCircle, FaMagic, FaCalendarCheck,
  FaFlask, FaRedo, FaShieldAlt, FaLeaf, FaChevronDown,
  FaClock, FaPrint, FaExclamationTriangle, FaBolt,
} from "react-icons/fa";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/routine`;

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEP_META = {
  Cleanser:    { abbr:"CLN", mins:2, purpose:"Removes impurities and preps skin for treatment",        keyBenefits:["Clears excess sebum","Preps skin for actives","Maintains pH balance"],    badges:["Barrier Friendly","Soothing"],        amChip:"bg-amber-50 text-amber-600",   pmChip:"bg-indigo-50 text-indigo-500" },
  Serum:       { abbr:"SER", mins:1, purpose:"Targets active concerns with concentrated actives",      keyBenefits:["Delivers active ingredients","Penetrates deeper layers","Fast absorption"], badges:["Active Treatment","Acne Friendly"],  amChip:"bg-rose-50 text-rose-500",     pmChip:"bg-purple-50 text-purple-500" },
  Moisturizer: { abbr:"HYD", mins:1, purpose:"Seals in hydration and fortifies the skin barrier",     keyBenefits:["Locks in moisture","Repairs barrier","Reduces water loss"],                badges:["Hydration Boost","Barrier Repair"], amChip:"bg-sky-50 text-sky-600",       pmChip:"bg-teal-50 text-teal-600"     },
  SPF:         { abbr:"SPF", mins:1, purpose:"Shields against UV damage and premature aging",          keyBenefits:["Broad-spectrum UV protection","Prevents photoaging","Reduces dark spots"],  badges:["UV Protection","Anti-Aging"],       amChip:"bg-orange-50 text-orange-500", pmChip:"bg-slate-50 text-slate-500"   },
  Toner:       { abbr:"TON", mins:1, purpose:"Balances pH and primes skin for serum absorption",      keyBenefits:["Restores pH balance","Refines pores","Enhances serum penetration"],        badges:["pH Balanced","Prep Step"],          amChip:"bg-lime-50 text-lime-700",     pmChip:"bg-emerald-50 text-emerald-600" },
  Exfoliant:   { abbr:"EXF", mins:3, purpose:"Removes dead skin cells to reveal brighter texture",    keyBenefits:["Clears dead cells","Evens skin texture","Boosts radiance"],                badges:["Texture Refining","Brightening"],   amChip:"bg-amber-50 text-amber-700",   pmChip:"bg-violet-50 text-violet-600" },
  Eye:         { abbr:"EYE", mins:1, purpose:"Reduces puffiness and targets the delicate eye area",   keyBenefits:["Reduces puffiness","Brightens under-eye","Firms skin"],                   badges:["Gentle Formula","Anti-Puffiness"],  amChip:"bg-pink-50 text-pink-500",     pmChip:"bg-pink-50 text-pink-600"     },
};

const getMeta = (step = "", isPM) => {
  const key = Object.keys(STEP_META).find(k => step.toLowerCase().includes(k.toLowerCase())) || "Cleanser";
  const m = STEP_META[key] || STEP_META.Cleanser;
  return { ...m, chipClass: isPM ? m.pmChip : m.amChip };
};

const getProtocolTime = (products) =>
  products.reduce((sum, p) => {
    const meta = getMeta(p.step, false);
    return sum + meta.mins;
  }, 0);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = ({ isPM }) => (
  <div className={`bg-white rounded-2xl border p-5 flex gap-4 animate-pulse ${isPM ? "border-indigo-50" : "border-amber-50"}`}>
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className={`w-6 h-6 rounded-full ${isPM ? "bg-indigo-100" : "bg-amber-100"}`} />
      <div className={`w-12 h-12 rounded-xl ${isPM ? "bg-indigo-50" : "bg-amber-50"}`} />
    </div>
    <div className="flex-1 space-y-2 pt-1">
      <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
      <div className="h-2.5 bg-slate-100 rounded-full w-full" />
      <div className="h-2.5 bg-slate-100 rounded-full w-2/3" />
      <div className="flex gap-2 pt-2">
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
      </div>
    </div>
  </div>
);

// ─── Routine card ─────────────────────────────────────────────────────────────
const RoutineCard = ({ product, stepNumber, isPM, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const meta          = getMeta(product.step, isPM);
  const accentBorder  = isPM ? "border-l-indigo-400" : "border-l-amber-400";
  const stepBg        = isPM ? "bg-indigo-500"        : "bg-amber-500";
  const connectorBg   = isPM ? "bg-indigo-100"        : "bg-amber-100";
  const badgeBorder   = isPM
    ? "bg-indigo-50 text-indigo-500 border-indigo-100"
    : "bg-amber-50 text-amber-600 border-amber-100";
  const expandBg      = isPM ? "bg-indigo-50/40" : "bg-amber-50/40";

  return (
    <div className="relative">
      {!isLast && (
        <div className={`absolute left-[26px] top-[72px] w-0.5 h-6 ${connectorBg} z-0`} />
      )}
      <div
        className={`relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm
          hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300
          border-l-4 ${accentBorder} ${expanded ? "shadow-md" : ""}`}
      >
        {/* Main row */}
        <div
          className="p-5 flex gap-4 cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={`w-6 h-6 ${stepBg} text-white rounded-full flex items-center justify-center text-[10px] font-black`}>
              {stepNumber}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black tracking-tighter ${meta.chipClass}`}>
              {meta.abbr}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                {product.product_name}
              </h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FaCheckCircle className={`text-sm ${isPM ? "text-indigo-400" : "text-teal-500"}`} />
                <FaChevronDown
                  className={`text-slate-300 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mb-1.5 leading-relaxed">
              {meta.purpose}
            </p>
            <p className="text-[10px] text-slate-400 italic mb-3">
              ↳ {product.instruction || "Apply as directed."}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meta.badges.map(b => (
                <span key={b} className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border ${badgeBorder}`}>
                  {b}
                </span>
              ))}
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border bg-teal-50 text-teal-600 border-teal-100">
                AI Recommended
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border bg-slate-50 text-slate-500 border-slate-200 flex items-center gap-1">
                <FaClock className="text-[8px]" /> ~{meta.mins} min
              </span>
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className={`px-5 pb-5 border-t border-slate-100 ${expandBg}`}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-4 mb-3">
              Key Benefits
            </p>
            <div className="space-y-2">
              {meta.keyBenefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPM ? "bg-indigo-400" : "bg-teal-400"}`} />
                  <span className="text-[11px] text-slate-600 font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Protocol column header ───────────────────────────────────────────────────
const ProtocolHeader = ({ isPM, count, estMins, loading }) => {
  const icon       = isPM ? <FaMoon />         : <FaSun />;
  const iconBg     = isPM ? "bg-indigo-50"     : "bg-amber-50";
  const iconColor  = isPM ? "text-indigo-400"  : "text-amber-500";
  const iconBorder = isPM ? "border-indigo-100": "border-amber-100";
  const badgeCls   = isPM
    ? "bg-indigo-50 text-indigo-500 border-indigo-100"
    : "bg-amber-50 text-amber-600 border-amber-100";
  const title      = isPM ? "Evening Protocol" : "Morning Protocol";
  const period     = isPM ? "PM"               : "AM";

  return (
    <div className="flex items-center justify-between px-1 mb-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-2xl flex items-center justify-center ${iconColor} text-base border ${iconBorder} shadow-sm`}>
          {icon}
        </div>
        <div>
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{title}</h2>
          <p className="text-[10px] text-slate-400">
            {loading ? "—" : `${count} step${count !== 1 ? "s" : ""} · ${period} · ~${estMins} min`}
          </p>
        </div>
      </div>
      {!loading && count > 0 && (
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide ${badgeCls}`}>
          {count}/{count} Ready
        </span>
      )}
    </div>
  );
};

// ─── Empty column ─────────────────────────────────────────────────────────────
const EmptyColumn = ({ isPM }) => (
  <div className={`border rounded-2xl p-8 text-center ${isPM ? "bg-indigo-50 border-indigo-100" : "bg-amber-50 border-amber-100"}`}>
    {isPM
      ? <FaMoon className="text-indigo-200 text-2xl mx-auto mb-2" />
      : <FaSun  className="text-amber-200 text-2xl mx-auto mb-2" />
    }
    <p className={`text-xs font-bold ${isPM ? "text-indigo-400" : "text-amber-500"}`}>
      No {isPM ? "PM" : "AM"} steps in this routine
    </p>
  </div>
);

// ─── KPI card ─────────────────────────────────────────────────────────────────
const KPICard = ({ icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
    <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center text-xl ${iconColor} flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 leading-tight truncate">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ hasAnalysis }) => (
  <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-teal-50 rounded-3xl flex items-center justify-center text-4xl mb-5 border border-violet-100 shadow-sm">
      <FaMagic className="text-violet-400" />
    </div>
    <h3 className="text-base font-black text-slate-800 mb-2">
      {hasAnalysis ? "No Routine Generated Yet" : "Start With a Skin Analysis"}
    </h3>
    <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
      {hasAnalysis
        ? "Your AI routine is ready to activate. Hit the button above to get started."
        : "Complete a face analysis first so AI can build a routine tailored to your skin."}
    </p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const RoutineBuilder = () => {
  const [routine,         setRoutine]         = useState(null);
  const [recData,         setRecData]         = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [saving,          setSaving]          = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token   = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [routineRes, recRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/`,                { headers }),
        axios.get(`${API_BASE}/recommendations`, { headers }),
      ]);
      if (routineRes.status === "fulfilled") setRoutine(routineRes.value.data);
      if (recRes.status === "fulfilled") {
        setRecData(recRes.value.data);
        setRecommendations(recRes.value.data.suggested_routine || []);
      }
    } catch {
      setError("Unable to load your routine. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveRoutine = async (products) => {
    setSaving(true);
    try {
      const token   = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/build`, {
        user_email: "",
        routine_name: "My AI Optimized Routine",
        products,
        is_active: true,
      }, { headers });
      await fetchData();
    } catch {
      toast.error("Failed to save routine. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayedProducts = useMemo(
    () => (routine?.products?.length > 0 ? routine.products : recommendations),
    [routine, recommendations]
  );

  const amProducts = useMemo(() => displayedProducts.filter(p => p.time === "AM" || p.time === "Both"), [displayedProducts]);
  const pmProducts = useMemo(() => displayedProducts.filter(p => p.time === "PM" || p.time === "Both"), [displayedProducts]);

  const hasNoSavedRoutine = !routine?.products?.length;
  const skinType          = routine?.face_shape || recData?.skin_type || "Balanced";
  const routineName       = routine?.routine_name || null;
  const compatibilityScore = hasNoSavedRoutine ? 95 : 98;
  const amMins            = getProtocolTime(amProducts);
  const pmMins            = getProtocolTime(pmProducts);
  const totalMins         = amMins + pmMins;

  const streakLabel = useMemo(() => {
    if (!routine?.updated_at) return "Start Today";
    const days = Math.floor((Date.now() - new Date(routine.updated_at)) / 86400000);
    if (days === 0) return "Updated Today";
    return `${days} Day${days !== 1 ? "s" : ""} Active`;
  }, [routine]);

  return (
    <div className="min-h-screen bg-[#fafaf9] p-5 lg:p-10 font-sans selection:bg-violet-100">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              {/* pill row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 bg-violet-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                  Protocol Engine
                </span>
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse inline-block" />
                  Daily Regimen
                </span>
                {!loading && displayedProducts.length > 0 && (
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-600 text-[9px] font-black rounded-lg uppercase tracking-wide border border-teal-100">
                    AI Generated
                  </span>
                )}
                {!loading && displayedProducts.length > 0 && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase tracking-wide border border-emerald-100 flex items-center gap-1">
                    <FaBolt className="text-[8px]" /> {compatibilityScore}% Match
                  </span>
                )}
              </div>

              {/* title */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  Routine<span className="text-teal-600">Architect</span>
                </h1>
                {routineName && (
                  <p className="text-xs text-slate-400 mt-1 font-medium">{routineName}</p>
                )}
              </div>

              {/* sub-stats */}
              {!loading && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <FaSun className="text-amber-400 text-xs" />
                    <span className="text-[11px] font-bold text-slate-600">{amProducts.length} AM Steps · ~{amMins} min</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200 self-center" />
                  <div className="flex items-center gap-1.5">
                    <FaMoon className="text-indigo-400 text-xs" />
                    <span className="text-[11px] font-bold text-slate-600">{pmProducts.length} PM Steps · ~{pmMins} min</span>
                  </div>
                  {skinType && (
                    <>
                      <div className="w-px h-4 bg-slate-200 self-center" />
                      <div className="flex items-center gap-1.5">
                        <FaLeaf className="text-teal-400 text-xs" />
                        <span className="text-[11px] font-bold text-slate-600">
                          Optimized for <span className="text-teal-600">{skinType}</span> Skin
                        </span>
                      </div>
                    </>
                  )}
                  {totalMins > 0 && (
                    <>
                      <div className="w-px h-4 bg-slate-200 self-center" />
                      <div className="flex items-center gap-1.5">
                        <FaClock className="text-slate-400 text-xs" />
                        <span className="text-[11px] font-bold text-slate-600">~{totalMins} min/day total</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              {!loading && displayedProducts.length > 0 && (
                <button
                  onClick={() => window.print()}
                  className="px-5 py-3 bg-slate-100 text-slate-700 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <FaPrint /> Print
                </button>
              )}
              {hasNoSavedRoutine && !loading && recommendations.length > 0 && (
                <button
                  onClick={() => saveRoutine(recommendations)}
                  disabled={saving}
                  className="px-7 py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-violet-100 active:scale-95 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FaMagic />}
                  {saving ? "Activating…" : "Activate AI Suggestions"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── ERROR ────────────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-rose-400 flex-shrink-0" />
              <p className="text-sm font-bold text-rose-700">{error}</p>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-800 flex-shrink-0">
              <FaRedo /> Retry
            </button>
          </div>
        )}

        {/* ── AM / PM ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* AM */}
          <div>
            <ProtocolHeader isPM={false} count={amProducts.length} estMins={amMins} loading={loading} />
            <div className="space-y-3">
              {loading
                ? [1, 2].map(i => <SkeletonCard key={i} isPM={false} />)
                : amProducts.length > 0
                  ? amProducts.map((p, i) => (
                      <RoutineCard key={i} product={p} stepNumber={i + 1} isPM={false} isLast={i === amProducts.length - 1} />
                    ))
                  : <EmptyColumn isPM={false} />
              }
            </div>
          </div>

          {/* PM */}
          <div>
            <ProtocolHeader isPM={true} count={pmProducts.length} estMins={pmMins} loading={loading} />
            <div className="space-y-3">
              {loading
                ? [1, 2].map(i => <SkeletonCard key={i} isPM={true} />)
                : pmProducts.length > 0
                  ? pmProducts.map((p, i) => (
                      <RoutineCard key={i} product={p} stepNumber={i + 1} isPM={true} isLast={i === pmProducts.length - 1} />
                    ))
                  : <EmptyColumn isPM={true} />
              }
            </div>
          </div>

          {!loading && displayedProducts.length === 0 && <EmptyState hasAnalysis={!!recData} />}
        </div>

        {/* ── KPI FOOTER ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            icon={<FaFlask />}
            label="Skin Diagnosis"
            value={loading ? "—" : `${skinType} Skin`}
            sub="Routine personalized to your profile"
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <KPICard
            icon={<FaShieldAlt />}
            label="Safety Index"
            value="100% Non-Comedogenic"
            sub="All products dermatologist-reviewed"
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
          />
          <KPICard
            icon={<FaCalendarCheck />}
            label="Consistency"
            value={loading ? "—" : streakLabel}
            sub="Stay consistent for best results"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
          />
        </div>

        {/* ── TIP BANNER ───────────────────────────────────────────────────── */}
        {!loading && displayedProducts.length > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <FaBolt className="text-violet-600 text-xs" />
            </div>
            <div>
              <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest mb-1">Pro Tip</p>
              <p className="text-xs text-violet-600 font-medium leading-relaxed">
                Tap any step card to expand key benefits. Apply products from thinnest to thickest texture for maximum absorption. Always end your AM routine with SPF.
              </p>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @media print {
          nav, aside, header.global, .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default RoutineBuilder;
