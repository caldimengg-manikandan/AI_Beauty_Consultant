import { NavLink, Link } from "react-router-dom";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import {
  FaHome, FaCamera, FaChartLine, FaHistory, FaMagic, FaCut,
  FaPaintBrush, FaSpa, FaUserCircle, FaShieldAlt, FaStethoscope,
  FaMicroscope, FaRoute, FaBullseye, FaBuilding, FaStore,
  FaCalendarCheck, FaGift, FaShoppingBag, FaVideo,
  FaCrown, FaMoon, FaSun, FaGlobe, FaUsers, FaFileInvoiceDollar,
  FaChartBar, FaTag, FaBullhorn, FaBoxOpen, FaTruck, FaWpforms,
  FaChevronDown, FaChevronRight, FaWarehouse, FaNetworkWired,
  FaUsersCog, FaLayerGroup, FaConciergeBell, FaPassport,
  FaFlask, FaBrain, FaExclamationTriangle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   NavItem — Linear-inspired minimal nav link
   ═══════════════════════════════════════════════════════════════ */
const NavItem = ({ to, icon, label, badge, badgeColor }) => (
  <NavLink
    to={to}
    end={to === "/dashboard"}
    className={({ isActive }) =>
      `relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-100 group select-none ${
        isActive
          ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
          : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/[0.05]"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Active indicator pill */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-600 rounded-r-full" />
        )}
        {/* Icon */}
        <span
          className={`text-[13px] shrink-0 transition-colors ${
            isActive
              ? "text-violet-600 dark:text-violet-400"
              : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
          }`}
        >
          {icon}
        </span>
        {/* Label */}
        <span className="flex-1 truncate tracking-[-0.01em]">{label}</span>
        {/* Badge */}
        {badge && (
          <span
            className={`shrink-0 text-[9px] font-bold px-1.5 py-[2px] rounded-full leading-none ${
              badgeColor || "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
            }`}
          >
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

/* ═══════════════════════════════════════════════════════════════
   NavSection — collapsible section with label
   ═══════════════════════════════════════════════════════════════ */
const NavSection = ({ title, color = "text-zinc-400", children, collapsible = false }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-4">
      <button
        onClick={() => collapsible && setOpen((o) => !o)}
        className={`flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-[0.08em] px-3 mb-1 ${color} ${
          collapsible ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"
        }`}
      >
        <span>{title}</span>
        {collapsible && (
          <span className="opacity-60">
            {open ? <FaChevronDown size={7} /> : <FaChevronRight size={7} />}
          </span>
        )}
      </button>
      {open && <div className="space-y-[1px]">{children}</div>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Role-specific nav trees
   ═══════════════════════════════════════════════════════════════ */
const UserNav = ({ can, profile, role, t }) => {
  const [latestGender, setLatestGender] = useState(null);

  useEffect(() => {
    import("../services/api").then((module) => {
      module.default
        .get("/history?limit=1")
        .then((r) => {
          if (r.data?.analyses?.length > 0) setLatestGender(r.data.analyses[0].gender);
          else if (r.data?.length > 0) setLatestGender(r.data[0].gender);
        })
        .catch(() => {});
    });
  }, []);

  return (
    <>
      <NavSection title="Beauty AI" collapsible>
        <NavItem to="/dashboard/analyze"      icon={<FaMagic />}      label="Face Analysis"    badge="AI"  badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
        <NavItem to="/dashboard/live-analyze" icon={<FaCamera />}     label="Live Camera" />
        <NavItem to="/dashboard/scan"         icon={<FaMicroscope />} label="Ingredient Scan"  badge="NEW" badgeColor="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" />
        {can("skin_journey")  && <NavItem to="/dashboard/journey"  icon={<FaRoute />}     label="Skin Journey" />}
        {can("goals_tracker") && <NavItem to="/dashboard/goals"    icon={<FaBullseye />}  label="Goals Tracker" />}
      </NavSection>

      <NavSection title="Smart Tools" collapsible>
        {can("ingredient_conflict") && (
          <NavItem to="/dashboard/conflict-checker" icon={<FaFlask />} label="Conflict Checker" badge="AI" badgeColor="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        )}
      </NavSection>

      <NavSection title="Marketplace" collapsible>
        <NavItem to="/dashboard/marketplace" icon={<FaBuilding />}    label="Find Salons" />
        <NavItem to="/dashboard/services"    icon={<FaSpa />}         label="Spa Services"   badge="HOT" badgeColor="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        <NavItem to="/dashboard/reels"       icon={<FaVideo />}       label="Beauty Reels" />
        <NavItem to="/dashboard/store"       icon={<FaShoppingBag />} label="Beauty Store" />
        {can("routine_shop") && (
          <NavItem to="/dashboard/routine-shop" icon={<FaMagic />} label="AI Routine Shop" badge="NEW" badgeColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        )}
        <NavItem to="/dashboard/my-bookings" icon={<FaCalendarCheck />} label={t("my_bookings") || "My Bookings"} />
      </NavSection>

      <NavSection title="Rewards" collapsible>
        {can("memberships")    && <NavItem to="/dashboard/memberships" icon={<FaCrown />} label="Memberships"       badge="PRO" badgeColor="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />}
        {can("loyalty_rewards") && <NavItem to="/dashboard/loyalty"   icon={<FaGift />}  label="Loyalty & Rewards" />}
      </NavSection>

      {can("evolution") ? (
        <NavSection title="Insights" collapsible>
          <NavItem to="/dashboard/evolution" icon={<FaMagic />}      label="Evolution"   badge="PRO" badgeColor="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
          <NavItem to="/dashboard/trends"    icon={<FaChartLine />}  label="Skin Trends" />
          <NavItem to="/dashboard/history"   icon={<FaHistory />}    label={t("history") || "History"} />
          <NavItem to="/dashboard/products"  icon={<FaShoppingBag />} label="Products" />
        </NavSection>
      ) : (
        <NavSection title="My Activity" collapsible>
          <NavItem to="/dashboard/history"  icon={<FaHistory />}     label={t("history") || "History"} />
          <NavItem to="/dashboard/products" icon={<FaShoppingBag />} label="Products" />
        </NavSection>
      )}

      {/* Upgrade Banner — only for free users */}
      {role === "user" && (
        <div className="mt-4 mx-1 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-teal-500/10 border border-violet-200/40 dark:border-violet-500/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FaCrown className="text-amber-500 text-xs" />
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Upgrade to Premium</span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2.5 leading-relaxed">
            Unlock unlimited scans, advanced AI insights, and more.
          </p>
          <Link
            to="/premium"
            className="block w-full text-center py-1.5 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-[10px] font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Explore Plans →
          </Link>
        </div>
      )}
    </>
  );
};

const ShopOwnerNav = ({ can }) => (
  <>
    <NavSection title="My Business" collapsible color="text-amber-500">
      <NavItem to="/dashboard/shop-owner" icon={<FaStore />}    label="Shop Dashboard"       badge="B2B" badgeColor="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
      {can("ai_insights") && <NavItem to="/dashboard/insights"  icon={<FaChartBar />}   label="AI Business Insights" badge="AI" badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />}
    </NavSection>

    <NavSection title="Smart Tools" collapsible color="text-violet-500">
      {can("client_intelligence") && <NavItem to="/dashboard/client-intelligence" icon={<FaBrain />}              label="Client Intelligence" badge="NEW" badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />}
      {can("noshow_predictor")    && <NavItem to="/dashboard/noshow-predictor"    icon={<FaExclamationTriangle />} label="No-Show Predictor"   badge="AI"  badgeColor="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />}
    </NavSection>

    <NavSection title="Operations" collapsible color="text-amber-400">
      {can("shop_appointments") && <NavItem to="/dashboard/shop-owner"    icon={<FaCalendarCheck />}  label="Appointments" />}
      {can("shop_services")     && <NavItem to="/dashboard/shop-services" icon={<FaConciergeBell />}  label="Services" />}
      {can("shop_products")     && <NavItem to="/dashboard/shop-products" icon={<FaBoxOpen />}        label="Products" />}
    </NavSection>

    <NavSection title="People" collapsible color="text-blue-400">
      {can("staff_management") && <NavItem to="/dashboard/staff" icon={<FaUsers />} label="Staff Management" />}
    </NavSection>

    <NavSection title="Marketing" collapsible color="text-rose-400">
      {can("campaigns") && <NavItem to="/dashboard/campaigns" icon={<FaBullhorn />} label="Campaigns" />}
      {can("coupons")   && <NavItem to="/dashboard/coupons"   icon={<FaTag />}      label="Coupons & Offers" />}
      {can("beauty_reels") && <NavItem to="/dashboard/reels"  icon={<FaVideo />}    label="Beauty Reels" badge="NEW" badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />}
    </NavSection>

    <NavSection title="Developer" collapsible color="text-zinc-400">
      {can("custom_forms") && <NavItem to="/dashboard/forms"    icon={<FaWpforms />}     label="Custom Forms" />}
      {can("webhooks_api") && <NavItem to="/dashboard/webhooks" icon={<FaNetworkWired />} label="Webhooks & API" />}
    </NavSection>
  </>
);

const AdminNav = ({ can, t }) => (
  <>
    <NavSection title="System Control" color="text-red-400">
      <NavItem to="/dashboard/admin" icon={<FaShieldAlt />} label="Admin Console" badge="SYS" badgeColor="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
    </NavSection>

    {can("expert_panel") && (
      <NavSection title="Expert Tools" color="text-blue-500">
        <NavItem to="/dashboard/expert" icon={<FaStethoscope />} label="Expert Review Queue" badge="DOC" badgeColor="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
      </NavSection>
    )}

    <NavSection title="Platform Analytics" collapsible color="text-violet-500">
      {can("ai_insights") && <NavItem to="/dashboard/insights" icon={<FaChartBar />}  label="AI Business Insights" badge="AI" badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />}
      <NavItem to="/dashboard/trends" icon={<FaChartLine />} label="Platform Trends" />
    </NavSection>

    <NavSection title="Users & Shops" collapsible color="text-teal-500">
      <NavItem to="/dashboard/shop-owner" icon={<FaStore />}  label="Shop Management" />
      <NavItem to="/dashboard/staff"      icon={<FaUsers />}  label="User Management" />
    </NavSection>

    <NavSection title="Smart Tools" collapsible color="text-violet-500">
      <NavItem to="/dashboard/client-intelligence" icon={<FaBrain />}              label="Client Intelligence" badge="AI" badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
      <NavItem to="/dashboard/noshow-predictor"    icon={<FaExclamationTriangle />} label="No-Show Predictor"   badge="AI" badgeColor="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
      <NavItem to="/dashboard/conflict-checker"    icon={<FaFlask />}               label="Conflict Checker"    badge="AI" badgeColor="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
    </NavSection>

    <NavSection title="Operations" collapsible color="text-amber-400">
      <NavItem to="/dashboard/inventory"    icon={<FaWarehouse />}        label="Inventory" />
      <NavItem to="/dashboard/invoices"     icon={<FaFileInvoiceDollar />} label="POS & Invoices" />
      <NavItem to="/dashboard/supply-chain" icon={<FaTruck />}            label="Supply Chain" />
    </NavSection>

    <NavSection title="Marketing" collapsible color="text-rose-400">
      <NavItem to="/dashboard/campaigns" icon={<FaBullhorn />} label="Campaigns" />
      <NavItem to="/dashboard/coupons"   icon={<FaTag />}      label="Coupons & Offers" />
    </NavSection>

    <NavSection title="Beauty AI" collapsible>
      <NavItem to="/dashboard/analyze"      icon={<FaMagic />}       label="Face Analysis"  badge="AI" badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
      <NavItem to="/dashboard/live-analyze" icon={<FaCamera />}      label="Live Camera" />
      <NavItem to="/dashboard/scan"         icon={<FaMicroscope />}  label="Ingredient Scan" />
      <NavItem to="/dashboard/marketplace"  icon={<FaBuilding />}    label="Marketplace" />
      <NavItem to="/dashboard/store"        icon={<FaShoppingBag />} label="Beauty Store" />
    </NavSection>

    <NavSection title="Developer" collapsible color="text-zinc-400">
      <NavItem to="/dashboard/forms"    icon={<FaWpforms />}     label="Custom Forms" />
      <NavItem to="/dashboard/webhooks" icon={<FaNetworkWired />} label="Webhooks & API" />
    </NavSection>
  </>
);

const ExpertNav = ({ can, profile, t }) => (
  <>
    <NavSection title="Professional" color="text-blue-500">
      <NavItem to="/dashboard/expert" icon={<FaStethoscope />} label="Expert Review Queue" badge="DOC" badgeColor="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
    </NavSection>

    <NavSection title="Smart Tools" collapsible color="text-violet-500">
      {can("ingredient_conflict") && (
        <NavItem to="/dashboard/conflict-checker" icon={<FaFlask />} label="Conflict Checker" badge="AI" badgeColor="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
      )}
    </NavSection>

    <NavSection title="Beauty AI" collapsible>
      <NavItem to="/dashboard/analyze"      icon={<FaMagic />}       label="Face Analysis"  badge="AI" badgeColor="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
      <NavItem to="/dashboard/live-analyze" icon={<FaCamera />}      label="Live Camera" />
      <NavItem to="/dashboard/scan"         icon={<FaMicroscope />}  label="Ingredient Scan" />
      {can("skin_journey")  && <NavItem to="/dashboard/journey"  icon={<FaRoute />}      label="Skin Journey" />}
      {can("goals_tracker") && <NavItem to="/dashboard/goals"    icon={<FaBullseye />}   label="Goals Tracker" />}
    </NavSection>

    {can("evolution") && (
      <NavSection title="Insights" collapsible>
        <NavItem to="/dashboard/evolution" icon={<FaMagic />}      label="Evolution"   badge="PRO" badgeColor="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <NavItem to="/dashboard/trends"    icon={<FaChartLine />}  label="Skin Trends" />
        <NavItem to="/dashboard/history"   icon={<FaHistory />}    label={t("history") || "History"} />
      </NavSection>
    )}

    <NavSection title="Marketplace" collapsible>
      <NavItem to="/dashboard/marketplace" icon={<FaBuilding />}    label="Find Salons" />
      <NavItem to="/dashboard/services"    icon={<FaSpa />}         label="Spa Services" />
      <NavItem to="/dashboard/store"       icon={<FaShoppingBag />} label="Beauty Store" />
    </NavSection>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
const Sidebar = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, can, role, profile } = useAuth();
  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.user;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir  = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
    const googleSelect = document.querySelector(".goog-te-combo");
    if (googleSelect) {
      googleSelect.value = lng;
      googleSelect.dispatchEvent(new Event("change"));
    }
  };

  return (
    <aside
      className="w-60 h-full flex flex-col z-20 overflow-hidden"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* ── Logo / Brand ─────────────────────────────────── */}
      <div
        className="px-4 py-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 group">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-teal-500 flex items-center justify-center shadow-md shrink-0">
            <img
              src="/logo.png"
              alt="AI Beauty"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `<span style="font-size:14px;font-weight:900;color:white;font-family:Outfit,sans-serif">AB</span>`;
              }}
            />
          </div>
          <div>
            <p
              className="text-[13px] font-bold leading-tight tracking-tight"
              style={{
                background: "linear-gradient(90deg,#7c3aed,#0d9488)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI Beauty
            </p>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-lo)" }}>
              Global SaaS
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
          style={{ color: "var(--text-mid)" }}
          aria-label="Close menu"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── User Identity ─────────────────────────────────── */}
      <div
        className="px-3 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 px-1">
          {/* Avatar placeholder */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #0d9488)" }}
          >
            {(user?.name || user?.sub || "U")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[12px] font-semibold truncate leading-tight"
              style={{ color: "var(--text-hi)" }}
            >
              {user?.name || user?.sub?.split("@")[0] || "User"}
            </p>
          </div>
          {/* Role badge */}
          <span
            className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${roleInfo.color}`}
          >
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-2 pb-3 overflow-y-auto custom-scrollbar">
        {/* Dashboard home */}
        <div className="mt-3">
          <NavItem to="/dashboard" icon={<FaHome />} label={t("dashboard") || "Dashboard"} />
        </div>

        {/* Role-based nav */}
        {role === "admin"      && <AdminNav      can={can} t={t} />}
        {role === "expert"     && <ExpertNav     can={can} profile={profile} t={t} />}
        {role === "shop_owner" && <ShopOwnerNav  can={can} />}
        {(role === "user" || role === "premium") && (
          <UserNav can={can} profile={profile} role={role} t={t} />
        )}

        {/* Account — always visible */}
        <NavSection title="Account">
          <NavItem to="/dashboard/settings" icon={<FaUserCircle />} label="Settings" />
        </NavSection>
      </nav>

      {/* ── Footer — Language & Theme ─────────────────────── */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        {/* Language switcher */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {["en", "hi", "ta", "es", "fr", "ar"].map((lng) => (
            <button
              key={lng}
              onClick={() => changeLanguage(lng)}
              className={`w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-semibold uppercase transition-all ${
                i18n.language === lng
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              {lng}
            </button>
          ))}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            style={{ color: "var(--text-mid)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <FaSun size={11} /> : <FaMoon size={11} />}
          </button>
        </div>

        {/* Platform label */}
        <div
          className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-widest"
          style={{ color: "var(--text-xlo)" }}
        >
          <FaGlobe size={8} className="animate-spin-slow" />
          Multinational SaaS
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
