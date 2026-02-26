import { NavLink, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  FaHome,
  FaCamera,
  FaChartLine,
  FaHistory,
  FaMagic,
  FaCut,
  FaPaintBrush,
  FaSpa,
  FaUserCircle,
  FaShieldAlt,
  FaStethoscope,
  FaMicroscope,
  FaMoon,
  FaSun,
  FaGlobe
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-toastify";
import { translationService } from "../services/translationService";

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useContext(AuthContext);
  const role = user?.role || "user";

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);

    // Map code to full name for AI engine
    const langNames = {
      'en': 'english',
      'hi': 'hindi',
      'ta': 'tamil',
      'es': 'spanish',
      'fr': 'french'
    };

    const fullName = langNames[lng] || 'english';

    try {
      toast.info(`AI is translating the entire page to ${fullName}...`, { autoClose: 2000 });
      await translationService.translateWholePage(fullName);
      toast.success(`Page translated to ${fullName} successfully!`);
    } catch (err) {
      console.error("AI Translation failed:", err);
      // Fallback: Static translation is already handled by i18n
    }
  };

  return (
    <aside className="w-72 bg-white/80 backdrop-blur-xl shadow-2xl hidden md:flex flex-col z-20 font-sans border-r border-white/50 animate-slide-in-left">

      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            {/* Logo Image with Gradient Border */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 p-0.5 group-hover:scale-110 transition-transform duration-300">
              <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="AI Beauty Consultant"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Pulse Animation */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 opacity-0 group-hover:opacity-20 group-hover:animate-ping"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
              AI Beauty
            </h1>
            <p className="text-xs text-gray-500">Consultant</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {/* Featured Dashboard Home Card */}
        <div className="animate-fade-in-up animation-delay-100 mb-6">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `relative flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group overflow-hidden ${isActive
                ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-xl scale-105"
                : "bg-gradient-to-r from-purple-50 to-teal-50 text-purple-700 hover:shadow-lg hover:scale-105"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Background Shimmer Effect */}
                {!isActive && (
                  <div className="absolute inset-0 shimmer opacity-50"></div>
                )}

                {/* Icon */}
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-purple-600 group-hover:scale-110'
                  }`}>
                  <FaHome className="text-xl" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className={`font-bold text-base ${isActive ? 'text-white' : 'text-purple-700'}`}>
                    {t('dashboard')}
                  </div>
                  <div className={`text-xs ${isActive ? 'text-white/80' : 'text-purple-500'}`}>
                    Home & Overview
                  </div>
                </div>

                {/* Arrow */}
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-white translate-x-0' : 'text-purple-600 -translate-x-1 group-hover:translate-x-0'
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </NavLink>
        </div>

        {/* --- SYSTEM ADMINISTRATION (Admin Only) --- */}
        {role === "admin" && (
          <>
            <div className="text-xs font-semibold text-red-500 uppercase tracking-wider px-4 mb-2 mt-6 animate-fade-in-up">
              Management
            </div>
            <div className="animate-fade-in-up">
              <NavItem to="/dashboard/admin" icon={<FaShieldAlt />} label="Admin Console" badge="SYS" />
            </div>
          </>
        )}

        {/* --- EXPERT PANEL (Expert & Admin) --- */}
        {(role === "expert" || role === "admin") && (
          <>
            <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider px-4 mb-2 mt-6 animate-fade-in-up">
              Professional Panel
            </div>
            <div className="animate-fade-in-up">
              <NavItem to="/dashboard/expert" icon={<FaStethoscope />} label="Review Queue" badge="DOC" />
            </div>
          </>
        )}

        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-6 animate-fade-in-up">
          Analysis
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/analyze" icon={<FaMagic />} label="Face Analysis" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/live-analyze" icon={<FaCamera />} label="Live Camera" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/scan" icon={<FaMicroscope />} label="Ingredient Scan" badge="NEW" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/services" icon={<FaSpa />} label="Spa Services" badge="HOT" />
        </div>

        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-6 animate-fade-in-up">
          Styling Studio
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/hair-styling" icon={<FaCut />} label="Hair Styling" badge="NEW" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/nail-styling" icon={<FaPaintBrush />} label="Nail Studio" badge="NEW" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/virtual-studio" icon={<FaUserCircle />} label="Vision Studio" badge="AR" />
        </div>

        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-6 animate-fade-in-up">
          Insights
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/trends" icon={<FaChartLine />} label="Skin Trends" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/evolution" icon={<FaMagic />} label="Evolution" badge="PRO" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/routine" icon={<FaStethoscope />} label="Routine" badge="AI" />
        </div>
        <div className="animate-fade-in-up">
          <NavItem to="/dashboard/history" icon={<FaHistory />} label={t('history')} />
        </div>
      </nav>

      {/* Theme & Language Controls */}
      <div className="p-4 mx-4 mb-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-3 dark:border dark:border-white/5 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {['en', 'hi', 'ta', 'es', 'fr'].map(lng => (
              <button
                key={lng}
                onClick={() => changeLanguage(lng)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black uppercase transition-all ${i18n.language === lng ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {lng}
              </button>
            ))}
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1">
          <FaGlobe className="animate-spin-slow" /> {t('language')} Mode
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ to, icon, label, badge, isHome }) => (
  <NavLink
    to={to}
    end={isHome}
    className={({ isActive }) =>
      `relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
        ? "bg-gradient-to-r from-purple-50 to-teal-50 text-purple-700 font-bold shadow-md translate-x-1 scale-105"
        : "text-gray-500 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-teal-50/50 hover:text-gray-900 hover:translate-x-1 hover:scale-105"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Ripple Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-teal-400/10 to-teal-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Active Indicator Line */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-purple-500 to-teal-500 rounded-r-lg animate-pulse-glow" />
        )}

        <span className={`text-lg transition-all duration-300 group-hover:animate-bounce-subtle ${isActive
          ? 'text-purple-600 scale-110'
          : 'text-gray-400 group-hover:text-purple-500 group-hover:scale-125'
          }`}>
          {icon}
        </span>

        <span className="flex-1 transition-all duration-300 group-hover:translate-x-1">{label}</span>

        {/* Badge */}
        {badge && (
          <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse group-hover:scale-110 transition-transform">
            {badge}
          </span>
        )}

        {/* Animated Arrow */}
        <svg
          className={`w-4 h-4 transition-all duration-300 ${isActive
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:animate-pulse'
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </>
    )}
  </NavLink>
);

export default Sidebar;
