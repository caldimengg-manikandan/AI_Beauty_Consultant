import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  FaExclamationTriangle, FaCheckCircle, FaBell, FaUser,
  FaClock, FaChartBar, FaEnvelope, FaSms, FaRedo,
} from "react-icons/fa";

const RISK_LEVELS = {
  high:   { label: "High Risk",   color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    bar: "bg-red-500"    },
  medium: { label: "Medium Risk", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", bar: "bg-orange-400" },
  low:    { label: "Low Risk",    color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  bar: "bg-green-500"  },
};

const getRiskLevel = (score) => {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
};

const BookingRiskCard = ({ booking, onSendReminder }) => {
  const riskLevel = getRiskLevel(booking.noshow_score);
  const cfg       = RISK_LEVELS[riskLevel];
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleReminder = async (channel) => {
    setSending(true);
    try {
      await onSendReminder(booking._id || booking.id, channel);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center">
            <FaUser className={`text-sm ${cfg.color}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {booking.client_name || booking.clientName || "Client"}
            </p>
            <p className="text-[11px] text-slate-500">
              {booking.service || "Service"} · {booking.appointment_time || booking.time || "—"}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-black ${cfg.color}`}>{booking.noshow_score}%</p>
          <p className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</p>
        </div>
      </div>

      {/* Risk bar */}
      <div className="h-1.5 bg-white/60 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
          style={{ width: `${booking.noshow_score}%` }}
        />
      </div>

      {/* Risk factors */}
      {booking.risk_factors && booking.risk_factors.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {booking.risk_factors.map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-slate-600 font-semibold">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Reminder actions — only show for medium/high risk */}
      {riskLevel !== "low" && (
        <div className="flex gap-2 mt-2">
          {sent ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
              <FaCheckCircle size={11} />
              Reminder sent
            </div>
          ) : (
            <>
              <button
                disabled={sending}
                onClick={() => handleReminder("email")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 text-xs font-bold text-slate-700 hover:bg-white transition-colors border border-white/50 disabled:opacity-50"
              >
                <FaEnvelope size={10} />
                Email
              </button>
              <button
                disabled={sending}
                onClick={() => handleReminder("sms")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 text-xs font-bold text-slate-700 hover:bg-white transition-colors border border-white/50 disabled:opacity-50"
              >
                <FaSms size={10} />
                SMS
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function NoShowPredictor() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/appointments/noshow-risk");
      setBookings(res.data?.bookings || []);
      setStats(res.data?.stats || null);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSendReminder = async (bookingId, channel) => {
    await api.post("/api/appointments/send-reminder", { booking_id: bookingId, channel });
  };

  const highRisk   = bookings.filter(b => getRiskLevel(b.noshow_score) === "high");
  const mediumRisk = bookings.filter(b => getRiskLevel(b.noshow_score) === "medium");
  const lowRisk    = bookings.filter(b => getRiskLevel(b.noshow_score) === "low");

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">No-Show Predictor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-predicted risk for upcoming bookings — send reminders before they miss.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FaRedo size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-red-600">{stats.high_risk}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-red-500">High Risk</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-orange-600">{stats.medium_risk}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-orange-500">Medium Risk</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-green-600">{stats.low_risk}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-green-500">Low Risk</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FaCheckCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">No upcoming bookings to analyse</p>
        </div>
      ) : (
        <div className="space-y-5">
          {highRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaExclamationTriangle className="text-red-500 text-xs" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-red-600">
                  High Risk ({highRisk.length})
                </h2>
              </div>
              <div className="space-y-3">
                {highRisk.map((b, i) => (
                  <BookingRiskCard key={b._id || i} booking={b} onSendReminder={handleSendReminder} />
                ))}
              </div>
            </div>
          )}

          {mediumRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaChartBar className="text-orange-500 text-xs" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-orange-600">
                  Medium Risk ({mediumRisk.length})
                </h2>
              </div>
              <div className="space-y-3">
                {mediumRisk.map((b, i) => (
                  <BookingRiskCard key={b._id || i} booking={b} onSendReminder={handleSendReminder} />
                ))}
              </div>
            </div>
          )}

          {lowRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaCheckCircle className="text-green-500 text-xs" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-green-600">
                  Low Risk ({lowRisk.length})
                </h2>
              </div>
              <div className="space-y-3">
                {lowRisk.map((b, i) => (
                  <BookingRiskCard key={b._id || i} booking={b} onSendReminder={handleSendReminder} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI note */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex gap-3">
        <FaBell className="text-violet-500 mt-0.5 flex-shrink-0 text-sm" />
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <strong>How it works:</strong> Our AI analyses past booking behaviour, days since last visit, time of day, day of week, and cancellation history to score each booking's no-show risk. Scores update daily.
        </p>
      </div>
    </div>
  );
}
