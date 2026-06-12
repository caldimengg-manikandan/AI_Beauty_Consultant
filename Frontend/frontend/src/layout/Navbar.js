import { useState, useEffect, useRef, useCallback } from 'react';
import { FaBell, FaCog, FaSignOutAlt, FaCircle, FaInfoCircle, FaMagic,
         FaUserAstronaut, FaSpa, FaCalendarCheck, FaSpinner } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import api from '../services/api';

// ── Icon map for notification types ──────────────────────────────────────────
const TYPE_ICON = {
    scan:        <FaUserAstronaut className="text-blue-500" />,
    appointment: <FaCalendarCheck  className="text-emerald-500" />,
    booking:     <FaSpa            className="text-pink-500" />,
    default:     <FaInfoCircle     className="text-indigo-500" />,
};

const Navbar = ({ onMenuClick }) => {
    const [currentTime, setCurrentTime]           = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications]       = useState([]);
    const [unreadCount, setUnreadCount]           = useState(0);
    const [loadingNotifs, setLoadingNotifs]        = useState(false);
    const notificationRef = useRef(null);
    const location        = useLocation();
    const navigate        = useNavigate();
    const { user, logout, role } = useAuth();
    const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.user;

    // ── Fetch real notifications from backend ─────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        setLoadingNotifs(true);
        try {
            const res = await api.get('/api/notifications/in-app?limit=10');
            setNotifications(res.data?.notifications || []);
            setUnreadCount(res.data?.unread_count   || 0);
        } catch {
            // Silent fail — don't break the navbar if API is down
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoadingNotifs(false);
        }
    }, []);

    // Fetch on first render
    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    // Re-fetch when dropdown opens
    const handleBellClick = () => {
        const next = !showNotifications;
        setShowNotifications(next);
        if (next && user) fetchNotifications();
    };

    // ── Clear all ─────────────────────────────────────────────────────────────
    const handleClearAll = async () => {
        try {
            await api.delete('/api/notifications/in-app/clear');
            setNotifications([]);
            setUnreadCount(0);
        } catch {
            // ignore
        }
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const username = user?.name || user?.sub?.split('@')[0] || 'User';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleSettings = () => navigate('/dashboard/settings');

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/analyze')) return 'Neural VisionCore';
        if (path.includes('/live'))    return 'Live AI Scan';
        if (path.includes('/hair'))    return 'Hair Clinic';
        if (path.includes('/nails'))   return 'Nail Studio';
        if (path.includes('/services')) return 'Studio Services';
        if (path.includes('/history')) return 'Diagnostic History';
        if (path.includes('/trends'))  return 'Skin Metrics';
        if (path.includes('/settings')) return 'System Settings';
        return 'Control Center';
    };

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTime = (date) =>
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 md:px-8 py-4 sticky top-0 z-50 shadow-sm flex items-center justify-between gap-4">

            {/* Hamburger — mobile only */}
            <button
                onClick={onMenuClick}
                className="md:hidden p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all shrink-0"
                aria-label="Open menu"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Left - Page Title */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter uppercase truncate">{getPageTitle()}</h1>
                    <span className="animate-pulse w-2 h-2 bg-indigo-500 rounded-full shrink-0"></span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mt-0.5 uppercase hidden sm:block">
                    AI Beauty Consultant / Integrated Vision System
                </p>
            </div>

            {/* Center - Time and User Status */}
            <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-black text-slate-700 tracking-tight">{formatTime(currentTime)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{getGreeting()}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-indigo-600">{username}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${roleInfo.color}`}>
                            {roleInfo.emoji} {roleInfo.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right - Notification Center & Actions */}
            <div className="flex items-center gap-4">

                {/* AI LANGUAGE ENGINE */}
                <LanguageSwitcher />

                {/* NOTIFICATION HUB */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={handleBellClick}
                        className={`p-3 rounded-2xl transition-all duration-300 relative ${showNotifications ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <FaBell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[420px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Notification Center</h3>
                                {loadingNotifs
                                    ? <FaSpinner className="animate-spin text-indigo-400" size={14} />
                                    : <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full">
                                        {unreadCount > 0 ? `${unreadCount} New` : 'All Read'}
                                      </span>
                                }
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {loadingNotifs && notifications.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <FaSpinner className="animate-spin text-indigo-300" size={24} />
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading…</p>
                                    </div>
                                )}

                                {!loadingNotifs && notifications.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <FaBell className="text-slate-200" size={36} />
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No new notifications</p>
                                    </div>
                                )}

                                {notifications.map((n) => (
                                    <div key={n.id} className="p-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 relative cursor-pointer group">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-xl shrink-0">
                                                {TYPE_ICON[n.type] || TYPE_ICON.default}
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="font-black text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{n.title}</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                                                <span className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{n.time}</span>
                                            </div>
                                        </div>
                                        {n.unread && (
                                            <div className="absolute top-6 right-6">
                                                <FaCircle className="text-indigo-500 text-[8px]" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {notifications.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="w-full py-5 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all"
                                >
                                    Clear All Notifications
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Settings Toggle */}
                <button onClick={handleSettings} className="p-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">
                    <FaCog size={18} />
                </button>

                {/* Secure Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                >
                    <FaSignOutAlt size={14} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
