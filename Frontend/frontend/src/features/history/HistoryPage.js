import { useEffect, useState } from "react";
import { getHistory } from "../../services/api";
import { FaCalendarAlt, FaMagic, FaRedo, FaTint, FaWind, FaShieldAlt } from "react-icons/fa";

const METRIC_CONFIG = [
  { key: "acne",       label: "Acne",      bad: true,  color: "bg-rose-400"   },
  { key: "oiliness",   label: "Oiliness",  bad: true,  color: "bg-amber-400"  },
  { key: "texture",    label: "Texture",   bad: true,  color: "bg-orange-400" },
  { key: "hydration",  label: "Hydration", bad: false, color: "bg-sky-400"    },
  { key: "barrier",    label: "Barrier",   bad: false, color: "bg-teal-400"   },
];

const computeScore = (s = {}) => {
  const bad  = ((1-(s.acne||0)) + (1-(s.oiliness||0)) + (1-(s.texture||0)) + (1-(s.pores||0))) / 4 * 100;
  const good = ((s.hydration||0.6) + (s.barrier||0.6) + (s.evenness||0.6) + (s.elasticity||0.6)) / 4 * 100;
  return Math.round((bad + good) / 2);
};

const faceLabel = (val) =>
  typeof val === "string" ? val
  : val?.value ?? (Array.isArray(val) ? val[0] : "Unknown");

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-44 bg-slate-100" />
    <div className="p-5 space-y-3">
      <div className="h-3.5 bg-slate-100 rounded-full w-1/2" />
      <div className="h-2.5 bg-slate-100 rounded-full w-3/4" />
      <div className="h-2 bg-slate-100 rounded-full w-full" />
      <div className="h-2 bg-slate-100 rounded-full w-5/6" />
    </div>
  </div>
);

const ScanCard = ({ scan }) => {
  const score = computeScore(scan.skin_scores);
  const face  = faceLabel(scan.face_shape);
  const scoreColor = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";
  const scoreBg    = score >= 75 ? "bg-emerald-50 border-emerald-100" : score >= 50 ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      {/* image */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {(scan.annotated_image_url || scan.image_url) ? (
          <img
            src={scan.annotated_image_url || scan.image_url}
            alt="skin scan"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaMagic className="text-slate-200 text-3xl" />
          </div>
        )}
        {/* date chip */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-700 shadow-sm flex items-center gap-1.5 border border-white/60">
          <FaCalendarAlt className="text-violet-400 text-[9px]" />
          {scan.date}
        </div>
        {/* score chip */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[11px] font-black border shadow-sm ${scoreBg} ${scoreColor}`}>
          {score}/100
        </div>
      </div>

      {/* body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              {face} <span className="text-slate-300 font-normal text-xs">Face</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {scan.recommendations?.[0] && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wide">
                  {scan.recommendations[0].includes(":")
                    ? scan.recommendations[0].split(":")[1].replace("Skin","").trim()
                    : "Analysis"}
                </span>
              )}
              {scan.gender && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">
                  {scan.gender}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* metric bars */}
        <div className="space-y-2">
          {METRIC_CONFIG.map(({ key, label, bad, color }) => {
            const raw = scan.skin_scores?.[key] || 0;
            const pct = bad ? Math.round(raw * 100) : Math.round(raw * 100);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide w-14 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[9px] font-black text-slate-500 w-7 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHistory();
      setHistory(Array.isArray(res) ? res : []);
    } catch {
      setError("Could not load your scan history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const avgScore = history.length
    ? Math.round(history.reduce((s, h) => s + computeScore(h.skin_scores), 0) / history.length)
    : null;

  return (
    <div className="min-h-screen bg-[#fafaf9] p-5 lg:p-10 font-sans selection:bg-violet-100">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-violet-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">Scan Archive</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse inline-block" /> Live History
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Skin <span className="text-teal-600">History</span>
            </h1>
            {!loading && history.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <FaCalendarAlt className="text-violet-400 text-xs" />
                  <span className="text-[11px] font-bold text-slate-600">{history.length} Scan{history.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-px h-4 bg-slate-200 self-center" />
                <div className="flex items-center gap-1.5">
                  <FaShieldAlt className="text-teal-400 text-xs" />
                  <span className="text-[11px] font-bold text-slate-600">Avg Score: <span className="text-teal-600">{avgScore}/100</span></span>
                </div>
              </div>
            )}
          </div>
          {!loading && history.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-600 rounded-xl border border-violet-100 text-[11px] font-black uppercase tracking-wide">
              {history.length} Total Scans
            </div>
          )}
        </div>

        {/* error */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button onClick={fetchData} className="flex items-center gap-2 text-xs font-bold text-rose-600">
              <FaRedo /> Retry
            </button>
          </div>
        )}

        {/* grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : history.map(scan => <ScanCard key={scan.id} scan={scan} />)
          }
        </div>

        {/* empty */}
        {!loading && history.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-teal-50 rounded-3xl flex items-center justify-center mb-5 border border-violet-100 shadow-sm">
              <FaMagic className="text-violet-400 text-3xl" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-2">No Scans Yet</h3>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Perform your first AI face analysis to start building your skin history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
