import { NavLink, Link } from "react-router-dom";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import {
  FaHome, FaCamera, FaChartLine, FaHistory, FaMagic, FaCut,
  FaPaintBrush, FaSpa, FaUserCircle, FaShieldAlt, FaStethoscope,
  FaMicroscope, FaRoute, FaBullseye, FaBuilding, FaStore,
  FaCalendarCheck, FaGift, FaShoppingBag, FaVideo, FaNetworkWired,
  FaCrown, FaMoon, FaSun, FaGlobe, FaUsers, FaFileInvoiceDollar,
  FaChartBar, FaTag, FaBullhorn, FaBoxOpen, FaTruck, FaWpforms,
  FaKey, FaLock, FaChevronDown, FaChevronRight,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

// ── NavItem ───────────────────────────────────────────────────────────────────
const NavItem = ({ to, icon, label, badge, badgeColor }) => (
  <NavLink
    to={to}
    end={to === "/dashboard"}
    className={({ isActive }) =>
      `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden text-sm ${
        isActive
          ? "bg-gradient-to-r from-violet-50 to-teal-50 text-violet-700 font-semibold shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-violet-500 to-teal-500 rounded-r-full" />
        )}
        <span className={`text-base transition-all ${isActive ? "text-violet-600" : "text-slate-400 group-hover:text-violet-500"}`}>
          {icon}
        </span>
        <span className="flex-1 truncate">{label}</span>
        {badge && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${badgeColor || "bg-teal-100 text-teal-700"}`}>
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

// ── Section ───────────────────────────────────────────────────────────────────
const NavSection = ({ title, color = "text-slate-400", children, collapsible = false }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-5">
      <button
        onClick={() => collapsible && setOpen(o => !o)}
        className={`flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest px-3 mb-1.5 ${color} ${collapsible ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
      >
        {title}
        {collapsible && (open ? <FaChevronDown size={8} /> : <FaChevronRight size={8} />)}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, can, role, profile } = useAuth();

  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.user;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
    const googleSelect = document.querySelector(".goog-te-combo");
    if (googleSelect) {
      googleSelect.value = lng;
      googleSelect.dispatchEvent(new Event("change"));
    }
  };

  return (
    <aside className="w-64 h-full bg-white/90 backdrop-blur-xl shadow-2xl flex flex-col z-20 border-r border-slate-100 overflow-hidden">

      {/* ── Logo ── */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-teal-500 p-px">
            <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
              <img src="/logo.png" alt="AI Beauty" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <p className="text-sm font-black bg-gradient-to-r from-violet-600 to-teal-600 bg-clip-text text-transparent leading-none">
              AI Beauty
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">Global SaaS</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Role Badge ── */}
      <div className="px-4 py-2.5 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
            style={{ background: roleInfo.bg, color: roleInfo.color }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: roleInfo.color }} />
            {roleInfo.label}
          </div>
          <span className="text-[11px] text-slate-400 font-medium truncate">
            {user?.name || user?.sub?.split("@")[0] || "User"}
          </span>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto custom-scrollbar">

        {/* Home */}
        <div className="mt-3">
          <NavItem to="/dashboard" icon={<FaHome />} label={t("dashboard")} />
        </div>

        {/* ── ADMIN ONLY ── */}
        {can("admin_console") && (
          <NavSection title="⚙ System" color="text-red-400">
            <NavItem to="/dashboard/admin" icon={<FaShieldAlt />} label="Admin Console" badge="SYS" badgeColor="bg-red-100 text-red-600" />
          </NavSection>
        )}

        {/* ── EXPERT / ADMIN ── */}
        {can("expert_panel") && (
          <NavSection title="🩺 Professional" color="text-blue-500">
            <NavItem to="/dashboard/expert" icon={<FaStethoscope />} label="Expert Review Queue" badge="DOC" badgeColor="bg-blue-100 text-blue-600" />
          </NavSection>
        )}

        {/* ── BEAUTY AI — all roles ── */}
        <NavSection title="✨ Beauty AI" collapsible>
          <NavItem to="/dashboard/analyze" icon={<FaMagic />} label="Face Analysis" badge="AI" badgeColor="bg-violet-100 text-violet-600" />
          <NavItem to="/dashboard/live-analyze" icon={<FaCamera />} label="Live Camera" />
          <NavItem to="/dashboard/scan" icon={<FaMicroscope />} label="Ingredient Scan" badge="NEW" badgeColor="bg-teal-100 text-teal-600" />
          {can("skin_health") && (
            <NavItem to="/dashboard/lookbook" icon={<FaChartLine />} label="Skin Health" />
          )}
          {can("skin_journey") && (
            <NavItem to="/dashboard/journey" icon={<FaRoute />} label="Skin Journey" />
          )}
          {can("goals_tracker") && (
            <NavItem to="/dashboard/goals" icon={<FaBullseye />} label="Goals Tracker" />
          )}
        </NavSection>

        {/* ── STYLING STUDIO — all roles ── */}
        <NavSection title="💅 Styling Studio" collapsible>
          <NavItem to="/dashboard/hair-styling" icon={<FaCut />} label="Hair Styling" />
          {profile?.gender?.toLowerCase() !== 'male' && (
            <NavItem to="/dashboard/nail-styling" icon={<FaPaintBrush />} label="Nail Studio" />
          )}
          <NavItem to="/dashboard/virtual-studio" icon={<FaUserCircle />} label="Vision Studio" badge="AR" badgeColor="bg-indigo-100 text-indigo-600" />
          {can("routine_builder") && (
            <NavItem to="/dashboard/routine" icon={<FaStethoscope />} label="Routine Builder" />
          )}
        </NavSection>

        {/* ── MARKETPLACE — all roles ── */}
        <NavSection title="🏪 Marketplace" collapsible>
          <NavItem to="/dashboard/marketplace" icon={<FaBuilding />} label="Find Salons" />
          <NavItem to="/dashboard/services" icon={<FaSpa />} label="Spa Services" badge="HOT" badgeColor="bg-rose-100 text-rose-600" />
          <NavItem to="/dashboard/reels" icon={<FaVideo />} label="Beauty Reels" />
          <NavItem to="/dashboard/store" icon={<FaShoppingBag />} label="Beauty Store" />
          <NavItem to="/dashboard/routine-shop" icon={<FaMagic />} label="AI Routine Shop" badge="NEW" badgeColor="bg-indigo-100 text-indigo-600" />
          <NavItem to="/dashboard/my-bookings" icon={<FaCalendarCheck />} label={t("my_bookings") || "My Bookings"} />
        </NavSection>

        {/* ── REWARDS ── */}
        <NavSection title="🎁 Rewards" collapsible>
          {can("memberships") && (
            <NavItem to="/dashboard/memberships" icon={<FaCrown />} label="Memberships" badge="PRO" badgeColor="bg-amber-100 text-amber-600" />
          )}
          {can("loyalty_rewards") && (
            <NavItem to="/dashboard/loyalty" icon={<FaGift />} label="Loyalty & Rewards" />
          )}
        </NavSection>

        {/* ── INSIGHTS — premium+ ── */}
        {can("evolution") && (
          <NavSection title="📊 Insights" collapsible>
            <NavItem to="/dashboard/evolution" icon={<FaMagic />} label="Evolution" badge="PRO" badgeColor="bg-purple-100 text-purple-600" />
            <NavItem to="/dashboard/trends" icon={<FaChartLine />} label="Skin Trends" />
            <NavItem to="/dashboard/history" icon={<FaHistory />} label={t("history") || "History"} />
          </NavSection>
        )}

        {/* ── SHOP OWNER / ADMIN ONLY ── */}
        {can("my_shop") && (
          <NavSection title="🏢 Business Hub" color="text-amber-500" collapsible>
            <NavItem to="/dashboard/shop-owner" icon={<FaStore />} label="My Shop Dashboard" badge="B2B" badgeColor="bg-amber-100 text-amber-700" />
            {can("franchise_hq") && (
              <NavItem to="/dashboard/franchise" icon={<FaNetworkWired />} label="Franchise HQ" badge="HQ" badgeColor="bg-amber-100 text-amber-700" />
            )}
            {can("staff_management") && (
              <NavItem to="/dashboard/staff" icon={<FaUsers />} label="Staff Management" />
            )}
            {can("hr_payroll") && (
              <NavItem to="/dashboard/hr" icon={<FaFileInvoiceDollar />} label="HR & Payroll" />
            )}
            {can("inventory") && (
              <NavItem to="/dashboard/inventory" icon={<FaBoxOpen />} label="Inventory" />
            )}
            {can("pos_invoices") && (
              <NavItem to="/dashboard/invoices" icon={<FaFileInvoiceDollar />} label="POS & Invoices" />
            )}
            {can("campaigns") && (
              <NavItem to="/dashboard/campaigns" icon={<FaBullhorn />} label="Campaigns" />
            )}
            {can("coupons") && (
              <NavItem to="/dashboard/coupons" icon={<FaTag />} label="Coupons" />
            )}
            {can("ai_insights") && (
              <NavItem to="/dashboard/insights" icon={<FaChartBar />} label="AI Business Insights" badge="AI" badgeColor="bg-violet-100 text-violet-600" />
            )}
            {can("supply_chain") && (
              <NavItem to="/dashboard/supply-chain" icon={<FaTruck />} label="Supply Chain" />
            )}
            {can("custom_forms") && (
              <NavItem to="/dashboard/forms" icon={<FaWpforms />} label="Custom Forms" />
            )}
            {can("webhooks_api") && (
              <NavItem to="/dashboard/webhooks" icon={<FaKey />} label="Webhooks & API Keys" />
            )}
          </NavSection>
        )}

        {/* ── SETTINGS — always last ── */}
        <NavSection title="⚙ Account">
          <NavItem to="/dashboard/settings" icon={<FaUserCircle />} label="Settings" />
        </NavSection>

        {/* Upgrade Prompt for free users */}
        {role === "user" && (
          <div className="mt-5 mx-1 p-3 rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50 border border-violet-100">
            <div className="flex items-center gap-2 mb-2">
              <FaCrown className="text-amber-500 text-sm" />
              <span className="text-xs font-black text-slate-700">Upgrade to Premium</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
              Unlock unlimited scans, advanced AI insights, and more.
            </p>
            <Link
              to="/premium"
              className="block w-full text-center py-1.5 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-[10px] font-black rounded-xl hover:opacity-90 transition-opacity"
            >
              Explore Plans →
            </Link>
          </div>
        )}
      </nav>

      {/* ── Theme & Language ── */}
      <div className="px-3 py-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {["en", "hi", "ta", "es", "fr", "ar"].map((lng) => (
              <button
                key={lng}
                onClick={() => changeLanguage(lng)}
                className={`w-6 h-6 flex items-center justify-center rounded-lg text-[9px] font-black uppercase transition-all ${
                  i18n.language === lng
                    ? "bg-violet-600 text-white shadow"
                    : "bg-white text-slate-400 hover:bg-slate-100"
                }`}
              >
                {lng}
              </button>
            ))}
          </div>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm border border-slate-100 hover:scale-110 transition-all"
          >
            {theme === "dark" ? <FaSun size={12} /> : <FaMoon size={12} />}
          </button>
        </div>
        <div className="flex items-center gap-1 mt-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
          <FaGlobe size={9} className="animate-spin-slow" />
          Multinational SaaS Platform
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
