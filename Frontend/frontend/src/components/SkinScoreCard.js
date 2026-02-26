import React, { useState, useEffect } from 'react';
import { FaFire, FaTrophy, FaChartLine, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';

const SkinScoreCard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/api/gamification/status');
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch gamification status", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="h-48 bg-slate-100 rounded-[2rem]"></div>
            <div className="h-48 bg-slate-100 rounded-[2rem]"></div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Biological Integrity</h3>
                            <p className="text-2xl font-black italic uppercase">Skin Health Score</p>
                        </div>
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/10 group-hover:scale-110 transition-transform">
                            🏆
                        </div>
                    </div>

                    <div className="flex items-end gap-4 mb-6">
                        <span className="text-7xl font-black tracking-tighter leading-none">{data.skin_health_score}</span>
                        <div className="mb-2">
                            <div className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase mb-1 flex items-center gap-1">
                                <FaChartLine /> +4.2%
                            </div>
                            <span className="text-xs font-bold text-slate-400">vs Last Month</span>
                        </div>
                    </div>

                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                            style={{ width: `${data.skin_health_score}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Percentile: Top 15%</p>
                </div>
            </div>

            {/* Glow Journey & Insights */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[3rem] p-4 shadow-xl flex flex-col">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-6 mb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-500/20">
                                <FaFire className="animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter uppercase">{data.streak} Day Glow Streak</h4>
                                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Don't break the magic!</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{data.total_scans}</div>
                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Intelligence Scans</div>
                        </div>
                    </div>

                    {/* Milestone Progress */}
                    <div className="space-y-3 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Level Progress</span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase">Next Milestone: 200 Scans</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-1000"
                                style={{ width: `${Math.min(100, (data.total_scans / 200) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium italic">You are only {200 - data.total_scans} scans away from becoming a "Vision Expert".</p>
                    </div>
                </div>

                <div className="px-6 flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Recent Achievements</h5>
                        <button className="text-[9px] font-bold text-indigo-600 uppercase hover:underline">View All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {data.badges.slice(-6).map((badge, i) => (
                            <div key={i} className="flex-shrink-0 group relative">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl border-2 border-slate-50 dark:border-slate-700 hover:border-indigo-500 hover:scale-110 transition-all cursor-help shadow-sm">
                                    {badge.icon}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white dark:border-slate-900">
                                    ✓
                                </div>
                            </div>
                        ))}
                        {!data.badges.length && (
                            <div className="py-4 text-slate-400 text-[10px] italic font-medium">Your journey starts with your first scan...</div>
                        )}
                    </div>
                </div>

                {/* Intelligence Note */}
                <div className="mt-2 p-5 bg-indigo-600 rounded-[2.2rem] text-white flex gap-4 items-center group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/20">💡</div>
                    <div>
                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">AI Intelligence Insight</p>
                        <p className="text-sm font-bold leading-tight">Users with a {data.streak}+ day streak see 40% more accuracy in skin health predictions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkinScoreCard;
