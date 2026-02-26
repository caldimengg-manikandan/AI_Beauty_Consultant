import { useState, useEffect, useRef } from 'react';
import { FaBell, FaCog, FaSignOutAlt, FaCircle, FaInfoCircle, FaMagic, FaUserAstronaut } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Navbar = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    const notifications = [
        {
            id: 1,
            title: "Neural VisionCore Update",
            message: "Morphology analysis accuracy improved for round face profiles.",
            time: "Just now",
            icon: <FaUserAstronaut className="text-blue-500" />,
            unread: true
        },
        {
            id: 2,
            title: "Aesthetic Insight",
            message: "Your hydration levels are peaking! High radiance detected in your last scan.",
            time: "2 hours ago",
            icon: <FaMagic className="text-purple-500" />,
            unread: true
        },
        {
            id: 3,
            title: "Studio Recommendation",
            message: "New 'Obsidian' hair color tone now available in your styling report.",
            time: "5 hours ago",
            icon: <FaInfoCircle className="text-indigo-500" />,
            unread: false
        }
    ];

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extract username from email
    const getUsername = () => {
        const email = localStorage.getItem('email') || localStorage.getItem('username') || '';
        if (email.includes('@')) {
            return email.split('@')[0];
        }
        return email || 'User';
    };

    const username = getUsername();

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleSettings = () => {
        navigate('/dashboard/settings');
    };

    // Get page title from route
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/analyze')) return 'Neural VisionCore';
        if (path.includes('/live')) return 'Live AI Scan';
        if (path.includes('/hair')) return 'Hair Clinic';
        if (path.includes('/nails')) return 'Nail Studio';
        if (path.includes('/services')) return 'Studio Services';
        if (path.includes('/history')) return 'Diagnostic History';
        if (path.includes('/trends')) return 'Skin Metrics';
        if (path.includes('/settings')) return 'System Settings';
        return 'Control Center';
    };

    // Get greeting based on time
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Format time as HH:MM AM/PM
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">

            {/* Left - Page Title & Brand Identity */}
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{getPageTitle()}</h1>
                    <span className="animate-pulse w-2 h-2 bg-indigo-500 rounded-full"></span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mt-1 uppercase">
                    AI Beauty Consultant / Integrated Vision System
                </p>
            </div>

            {/* Center - Time and User Status */}
            <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-black text-slate-700 tracking-tight">{formatTime(currentTime)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{getGreeting()}</span>
                    <span className="text-sm font-black text-indigo-600">{username}</span>
                </div>
            </div>

            {/* Right - Notification Center & Actions */}
            <div className="flex items-center gap-4">

                {/* AI LANGUAGE ENGINE */}
                <LanguageSwitcher />

                {/* NOTIFICATION HUB */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-3 rounded-2xl transition-all duration-300 relative ${showNotifications ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <FaBell size={18} />
                        {notifications.some(n => n.unread) && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-4 w-[380px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Notification Center</h3>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full">3 Messages</span>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.map((n) => (
                                    <div key={n.id} className={`p-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 relative cursor-pointer group`}>
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-xl shrink-0">
                                                {n.icon}
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

                            <button className="w-full py-5 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all">
                                Clear All Notifications
                            </button>
                        </div>
                    )}
                </div>

                {/* Settings Toggle */}
                <button
                    onClick={handleSettings}
                    className="p-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                >
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
