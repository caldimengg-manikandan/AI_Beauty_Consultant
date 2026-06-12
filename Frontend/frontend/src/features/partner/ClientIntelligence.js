import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  FaUserCircle, FaShieldAlt, FaExclamationTriangle, FaBullseye,
  FaTint, FaStar, FaChevronDown, FaChevronUp, FaLeaf,
} from "react-icons/fa";

const SKIN_COLOR = {
  Oily:        "bg-yellow-100 text-yellow-700",
  Dry:         "bg-orange-100 text-orange-700",
  Combination: "bg-blue-100 text-blue-700",
  Normal:      "bg-green-100 text-green-700",
  Sensitive:   "bg-rose-100 text-rose-700",
};

const Chip = ({ label, color = "bg-slate-100 text-slate-600" }) => (
  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
    {label}
  </span>
);

/* ── Single client card (collapsed by default) ── */
const ClientCard = ({ booking }) => {
  const [expanded, setExpanded] = useState(false);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading]   = useState(false);

  const loadPassport = async () => {
    if (passport || loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/passport/client/${booking._id || booking.id}`);
      setPassport(res.data?.passport || null);
    } catch {
      setPassport({});
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (!expanded) loadPassport();
    setExpanded(e => !e);
  };

  const skinType  = passport?.current_skin_type || passport?.skin_type;
  const concerns  = passport?.skin_concerns  || [];
  const allergies = passport?.allergies       || [];
  const goals     = passport?.beauty_goals    || [];
  const hasData   = skinType || concerns.length || allergies.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Booking row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-teal-100 flex items-center justify-center">
            <FaUserCircle className="text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {booking.client_name || booking.clientName || "Client"}
            </p>
            <p className="text-[11px] text-slate-400">
              {booking.service || "Service"} · {booking.time || booking.appointment_time || "—"}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:opacity-70 px-3 py-1.5 rounded-xl bg-violet-50"
        >
          <FaShieldAlt size={10} />
          {expanded ? "Hide" : "View Profile"}
          {expanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
        </button>
      </div>

      {/* Expanded passport panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-4 h-4 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              Loading client profile...
            </div>
          ) : !hasData ? (
            <p className="text-xs text-slate-400 italic">
              This client hasn't completed their beauty profile yet.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Skin type */}
              {skinType && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Skin Type</p>
                  <Chip label={skinType} color={SKIN_COLOR[skinType] || "bg-slate-100 text-slate-600"} />
                </div>
              )}

              {/* Allergies — most critical */}
              {allergies.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <FaExclamationTriangle className="text-orange-500 text-[10px]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Allergies & Sensitivities</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {allergies.map(a => <Chip key={a} label={a} color="bg-orange-100 text-orange-700" />)}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {concerns.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Skin Concerns</p>
                  <div className="flex flex-wrap gap-1">
                    {concerns.map(c => <Chip key={c} label={c} color="bg-rose-100 text-rose-700" />)}
                  </div>
                </div>
              )}

              {/* Goals */}
              {goals.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Beauty Goals</p>
                  <div className="flex flex-wrap gap-1">
                    {goals.map(g => <Chip key={g} label={g} color="bg-teal-100 text-teal-700" />)}
                  </div>
                </div>
              )}

              {/* Tip banner */}
              {allergies.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex gap-2">
                  <FaExclamationTriangle className="text-orange-500 mt-0.5 flex-shrink-0 text-xs" />
                  <p className="text-[11px] text-orange-700 leading-relaxed">
                    <strong>Heads up:</strong> This client is sensitive to {allergies.slice(0,3).join(", ")}{allergies.length > 3 ? " and more" : ""}. Avoid products containing these ingredients.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main component ── */
export default function ClientIntelligence() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("today");

  useEffect(() => {
    setLoading(true);
    api.get(`/api/appointments/upcoming?filter=${filter}`)
      .then(r => setBookings(r.data?.appointments || r.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800">Client Intelligence</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          See each client's skin type, allergies and beauty goals before they arrive.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["today", "tomorrow", "week"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === f
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {f === "week" ? "This Week" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FaUserCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">No bookings for {filter}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => <ClientCard key={b._id || b.id || i} booking={b} />)}
        </div>
      )}
    </div>
  );
}
