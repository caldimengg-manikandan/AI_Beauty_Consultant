import React, { useState, useEffect } from 'react';
import { FaUsers, FaChartLine, FaExclamationTriangle, FaDollarSign, FaUserPlus, FaCalendarCheck } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // In a real app, this would be a dedicated admin stats endpoint
                const res = await api.get('/api/admin/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
                // Fallback for demo
                setStats({
                    total_users: 1250,
                    active_users: 480,
                    new_users_today: 12,
                    analyses_today: 85,
                    total_revenue: 4250,
                    popular_concern: "Acne",
                    growth_rate: 15.4
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="animate-pulse space-y-4">
        <div className="h-40 bg-slate-100 rounded-3xl"></div>
        <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-slate-100 rounded-2xl"></div>
            <div className="h-32 bg-slate-100 rounded-2xl"></div>
        </div>
    </div>;

    return (
        <div className="space-y-8">
            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<FaUsers />} title="Total Consumers" value={stats.total_users} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard icon={<FaUserPlus />} title="New Acquisitions" value={stats.new_users_today} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard icon={<FaCalendarCheck />} title="Analyses Processed" value={stats.analyses_today} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={<FaDollarSign />} title="Projected Revenue" value={`$${stats.total_revenue}`} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Retention Growth Lifecycle</h3>
                    <div className="h-64 flex items-end gap-2 px-2">
                        {[40, 65, 45, 90, 70, 85, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl hover:from-indigo-600 transition-all cursor-help relative group" style={{ height: `${h}%` }}>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h} Units
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase px-2">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Concern Distribution</h3>
                    <div className="space-y-4">
                        <ConcernRow label="Acne / Inflammation" pct={45} color="bg-rose-500" />
                        <ConcernRow label="Pigmentation / Spots" pct={30} color="bg-amber-500" />
                        <ConcernRow label="Dehydration" pct={15} color="bg-blue-500" />
                        <ConcernRow label="Aging / Lines" pct={10} color="bg-indigo-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, title, value, color, bg }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg hover:translate-y-[-5px] transition-all">
        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color} text-xl mb-4`}>
            {icon}
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</div>
    </div>
);

const ConcernRow = ({ label, pct, color }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>{label}</span>
            <span>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
        </div>
    </div>
);

export default AdminAnalytics;
