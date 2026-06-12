import { useState } from "react";
import api from "../../services/api";
import {
  FaMicroscope, FaExclamationTriangle, FaCheckCircle,
  FaTimesCircle, FaFlask, FaLightbulb, FaChevronDown, FaChevronUp,
} from "react-icons/fa";

const RISK_CONFIG = {
  High:   { color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    icon: <FaTimesCircle className="text-red-500" /> },
  Medium: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: <FaExclamationTriangle className="text-orange-500" /> },
  Low:    { color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  icon: <FaCheckCircle className="text-green-500" /> },
  Safe:   { color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200",   icon: <FaCheckCircle className="text-teal-500" /> },
};

const ConflictCard = ({ conflict }) => {
  const cfg = RISK_CONFIG[conflict.risk] || RISK_CONFIG.Medium;
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-base flex-shrink-0">{cfg.icon}</span>
          <div>
            <p className={`text-sm font-bold ${cfg.color}`}>{conflict.pair}</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{conflict.reason}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          {conflict.risk}
        </span>
      </div>
      {conflict.tip && (
        <button
          onClick={() => setExpanded(e => !e)}
          className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${cfg.color} hover:opacity-70`}
        >
          <FaLightbulb size={10} />
          {expanded ? "Hide tip" : "Show tip"}
          {expanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
        </button>
      )}
      {expanded && conflict.tip && (
        <p className="mt-2 text-[11px] text-slate-600 leading-relaxed bg-white/60 rounded-xl px-3 py-2">
          {conflict.tip}
        </p>
      )}
    </div>
  );
};

export default function IngredientConflictChecker() {
  const [productA, setProductA] = useState("");
  const [productB, setProductB] = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleCheck = async () => {
    if (!productA.trim() || !productB.trim()) {
      setError("Paste the ingredient list for both products.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/api/ingredients/conflict", {
        product_a: productA,
        product_b: productB,
      });
      setResult(res.data);
    } catch (e) {
      setError("Could not check compatibility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const overallSafe = result && result.conflicts.filter(c => c.risk === "High" || c.risk === "Medium").length === 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800">Ingredient Conflict Checker</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Paste ingredient lists from two products — our AI checks if they're safe to use together.
        </p>
      </div>

      {/* Input area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
            Product A
          </label>
          <textarea
            value={productA}
            onChange={e => setProductA(e.target.value)}
            placeholder="e.g. Aqua, Niacinamide, Zinc PCA, Retinol..."
            rows={6}
            className="w-full text-xs border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none leading-relaxed"
          />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
            Product B
          </label>
          <textarea
            value={productB}
            onChange={e => setProductB(e.target.value)}
            placeholder="e.g. Aqua, Ascorbic Acid, Vitamin C, AHA, BHA..."
            rows={6}
            className="w-full text-xs border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none leading-relaxed"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
          <FaExclamationTriangle size={11} /> {error}
        </p>
      )}

      <button
        onClick={handleCheck}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Analysing ingredients...
          </>
        ) : (
          <>
            <FaFlask />
            Check Compatibility
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
            overallSafe
              ? "bg-teal-50 border-teal-200"
              : "bg-red-50 border-red-200"
          }`}>
            <span className="text-2xl">
              {overallSafe ? <FaCheckCircle className="text-teal-500" /> : <FaTimesCircle className="text-red-500" />}
            </span>
            <div>
              <p className={`text-sm font-black ${overallSafe ? "text-teal-700" : "text-red-700"}`}>
                {overallSafe ? "Products are compatible" : "Conflicts detected — use with caution"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {result.conflicts.length === 0
                  ? "No known ingredient conflicts found between these two products."
                  : `${result.conflicts.length} conflict${result.conflicts.length > 1 ? "s" : ""} found.`}
              </p>
            </div>
          </div>

          {/* Conflict cards */}
          {result.conflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Conflicts</h3>
              {result.conflicts.map((c, i) => <ConflictCard key={i} conflict={c} />)}
            </div>
          )}

          {/* Safe ingredients summary */}
          {result.safe_combos && result.safe_combos.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Safe Combinations</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.safe_combos.map((c, i) => (
                  <span key={i} className="text-[11px] bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full font-semibold">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* General tip */}
          {result.general_tip && (
            <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4 flex gap-3">
              <FaLightbulb className="text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">{result.general_tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
