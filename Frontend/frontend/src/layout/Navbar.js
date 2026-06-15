import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaBell, FaCog, FaSignOutAlt, FaCircle, FaInfoCircle, FaMagic,
  FaUserAstronaut, FaSpa, FaCalendarCheck, FaSpinner,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import api from "../services/api";

/* ── Notification type icon map ──────────────────────────────── */
const TYPE_ICON = {
  scan:        <FaUserAstronaut className="text-blue-500"    />,
  appointment: <FaCalendarCheck  className="text-emerald-500" />,
  booking:     <FaSpa            className="text-pink-500"   />,
  default:     <FaInfoCircle     className="text-indigo-400" />,
};

/* ── Page title map ──────────────────────────────────────────── */
const getPageTitle = (path) => {
  if (path.includes("/analyze"))         return "Face Analysis";
  if (path.includes("/live"))            return "Live AI Scan";
  if (path.includes("/hair"))            return "Hair Clinic";
  if (path.includes("/nails"))           return "Nail Studio";
  if (path.includes("/services"))        return "Studio Services";
  if (path.includes("/history"))         return "Analysis History";
  if (path.includes("/trends"))          return "Skin Trends";
  if (path.includes("/settings"))        return "Settings";
  if (path.includes("/marketplace"))     return "Find Salons";
  if (path.includes("/conflict"))        return "Conflict Checker";
  if (path.includes("/shop-owner"))      return "Shop Dashboard";
  if (path.includes("/insights"))        return "Business Insights";
  if (path.includes("/my-bookings"))     return "My Bookings";
  if (path.includes("/store"))           return "Beauty Store";
  if (path.includes("/admin"))           return "Admin Console";
  return "Dashboard";
};

const getGreeting = (h) => {
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};

/* ═══════════════════════════════════════════════════════════════
   NAVBAR — Vercel / Stripe inspired
   ═══════════════════════════════════════════════════════════════ */
const Navbar = ({ onMenuClick }) => {
  const [currentTime, setCurrentTime]             = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications]         = useState([]);
  const [unreadCount, setUnreadCount]             = useState(0);
  const [loadingNotifs, setLoadingNotifs]          = useState(false);
  const notificationRef = useRef(null);
  const location        = useLocation();
  const navigate        = useNavigate();
  const { user, logout, role } = useAuth();
  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.user;

  /* ── Notifications ─────────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get("/api/notifications/in-app?limit=10");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unread_count    || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => { if (user) fetchNotifications(); }, [user, fetchNotifications]);

  const handleBellClick = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next && user) fetchNotifications();
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/api/notifications/in-app/clear");
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Clock ─────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const username = user?.name || user?.sub?.split("@")[0] || "User";
  const pageTitle = getPageTitle(location.pathname);
  const greeting  = getGreeting(currentTime.getHours());
  const timeStr   = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  return (
    <nav
      className="navbar-shell sticky top-0 z-50 flex items-center gap-3 px-4 md:px-6 shrink-0"
      style={{
        height: "var(--navbar-h, 56px)",
        background: "var(--navbar-bg)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* ── Hamburger (mobile) ─────────────────────────── */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06] shrink-0"
        style={{ color: "var(--text-mid)" }}
        aria-label="Open menu"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Page Title ─────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <h1
          className="text-[15px] font-semibold tracking-tight truncate"
          style={{ color: "var(--text-hi)" }}
        >
          {pageTitle}
        </h1>
        {/* Live indicator */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
        </span>
      </div>

      {/* ── Center: greeting + time (desktop) ─────────── */}
      <div className="hidden lg:flex items-center gap-4 shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px]"
          style={{
            background: "var(--surface-overlay)",
            color: "var(--text-mid)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Online dot */}
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold tabular-nums">{timeStr}</span>
        </div>

        <div className="flex flex-col items-end leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--text-lo)" }}>
            {greeting}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-hi)" }}>
              {username}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${roleInfo.color}`}>
              {roleInfo.emoji} {roleInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right actions ──────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleBellClick}
            className={`relative p-2.5 rounded-lg transition-all duration-150 ${
              showNotifications
                ? "bg-violet-600 text-white shadow-md"
                : "hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            }`}
            style={!showNotifications ? { color: "var(--text-mid)" } : undefined}
            aria-label="Notifications"
          >
            <FaBell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-zinc-900" />
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-[340px] rounded-2xl overflow-hidden animate-fade-in-up"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-hi)" }}>
                  Notifications
                </h3>
                {loadingNotifs ? (
                  <FaSpinner className="animate-spin" size={12} style={{ color: "var(--text-lo)" }} />
                ) : (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: unreadCount > 0 ? "rgba(124,58,237,0.1)" : "var(--surface-overlay)",
                      color: unreadCount > 0 ? "#7c3aed" : "var(--text-lo)",
                    }}
                  >
                    {unreadCount > 0 ? `${unreadCount} new` : "All read"}
                  </span>
                )}
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto">
                {loadingNotifs && notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <FaSpinner className="animate-spin" size={18} style={{ color: "var(--text-lo)" }} />
                    <p className="text-[11px] font-medium" style={{ color: "var(--text-lo)" }}>
                      Loading…
                    </p>
                  </div>
                )}

                {!loadingNotifs && notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <FaBell size={24} style={{ color: "var(--text-xlo)" }} />
                    <p className="text-[11px] font-medium" style={{ color: "var(--text-lo)" }}>
                      No new notifications
                    </p>
                  </div>
                )}

                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="group flex gap-3 px-5 py-3.5 cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-overlay)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                      style={{
                        background: "var(--surface-overlay)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {TYPE_ICON[n.type] || TYPE_ICON.default}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold mb-0.5 truncate" style={{ color: "var(--text-hi)" }}>
                        {n.title}
                      </p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-mid)" }}>
                        {n.message}
                      </p>
                      <span className="text-[10px] mt-1 block" style={{ color: "var(--text-lo)" }}>
                        {n.time}
                      </span>
                    </div>
                    {/* Unread indicator */}
                    {n.unread && (
                      <div className="shrink-0 mt-1.5">
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full block" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-full py-3 text-[11px] font-medium transition-colors"
                  style={{
                    borderTop: "1px solid var(--border-subtle)",
                    color: "var(--text-lo)",
                    background: "var(--surface-overlay)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-mid)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-lo)";
                  }}
                >
                  Clear all notifications
                </button>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate("/dashboard/settings")}
          className="p-2.5 rounded-lg transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          style={{ color: "var(--text-mid)" }}
          aria-label="Settings"
        >
          <FaCog size={15} />
        </button>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", boxShadow: "var(--shadow-sm)" }}
        >
          <FaSignOutAlt size={12} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
