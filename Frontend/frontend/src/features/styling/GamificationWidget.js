import React, { useState, useEffect } from 'react';
import { FaFire, FaMedal, FaChartLine, FaCheckCircle, FaStar, FaBolt } from 'react-icons/fa';
import { gamificationApi } from '../../services/gamificationApi';
import { motion, AnimatePresence } from 'framer-motion';

const GamificationWidget = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await gamificationApi.getStatus();
                setStatus(data);
            } catch (err) {
                console.error("Failed to fetch gamification status", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading) return null;

    return (
        <div className="space-y-8">
            {/* TOP STATS STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* STREAK CARD */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100 transition-colors"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-200">
                            <FaFire className={status.streak > 0 ? 'animate-bounce' : ''} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Scan Streak</p>
                            <h4 className="text-3xl font-black text-slate-900 leading-none">{status.streak} Days</h4>
                        </div>
                    </div>
                </div>

                {/* HEALTH SCORE CARD */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200">
                            <FaBolt />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Health Score</p>
                            <h4 className="text-3xl font-black text-slate-900 leading-none">{status.skin_health_score}/100</h4>
                        </div>
                    </div>
                </div>

                {/* TOTAL SCANS CARD */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-200">
                            <FaChartLine />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Milestones</p>
                            <h4 className="text-3xl font-black text-slate-900 leading-none">{status.total_scans} Scans</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* BADGES SECTION */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-white text-xs font-black uppercase tracking-[0.3em]">Achievement Badges</h3>
                    <span className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">{status.badges.length} Unlocked</span>
                </div>

                <div className="flex flex-wrap gap-6">
                    {status.badges.length === 0 ? (
                        <div className="w-full py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic">Perform your first scan to unlock badges</p>
                        </div>
                    ) : (
                        status.badges.map((badge, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative"
                            >
                                <div className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col items-center justify-center p-2 hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-help">
                                    <span className="text-3xl mb-1 shadow-glow">{badge.icon}</span>
                                    <span className="text-[8px] font-black text-slate-400 text-center uppercase leading-tight">{badge.name}</span>
                                </div>
                                {/* TOOLTIP */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-50">
                                    Unlocked on {new Date(badge.date).toLocaleDateString()}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .shadow-glow { filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5)); }
            `}</style>
        </div>
    );
};

export default GamificationWidget;
