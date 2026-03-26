import React, { useEffect, useState } from 'react';
import { getHistory } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaChartLine, FaArrowUp, FaArrowDown, FaHistory,
    FaShieldAlt, FaLightbulb, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { TrendingUp, Activity, Shield, Info } from 'lucide-react';

const TrendsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrends();
    }, []);

    const fetchTrends = async () => {
        try {
            const res = await getHistory();
            const historyData = Array.isArray(res) ? [...res] : [];
            // We want chronological order for trends
            const sorted = historyData.reverse();
            setData(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">Computing Longitudinal Trends...</p>
                </div>
            </div>
        );
    }

    if (data.length < 2) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-lg border border-slate-100"
                >
                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
                        <Activity size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Insufficient Data Flow</h2>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">
                        Our neural trend engine requires at least **2 distinct biometric captures** to establish a longitudinal baseline.
                        Perform another analysis to unlock your progress visualization.
                    </p>
                    <button
                        onClick={() => window.location.href = '/dashboard/live-analyze'}
                        className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-900 transition-all"
                    >
                        Initialize Capture
                    </button>
                </motion.div>
            </div>
        );
    }

    const latest = data[data.length - 1];
    const previous = data[0];

    const getChange = (key) => {
        const diff = (latest.skin_scores[key] - previous.skin_scores[key]) * 100;
        return Math.round(diff);
    };

    const getInsight = () => {
        const acneChange = getChange('acne');
        if (acneChange < -5) return {
            icon: <FaCheckCircle className="text-emerald-500" />,
            title: "Remission Phase Detected",
            text: "Inflammation nodes are trending downward. Your current routine is stabilizing the skin barrier successfully."
        };
        if (acneChange > 5) return {
            icon: <FaExclamationTriangle className="text-amber-500" />,
            title: "Inflammation Spike",
            text: "Minor escalation in acne activity. Consider shifting to a soothing, non-comedogenic regimen this week."
        };
        return {
            icon: <FaLightbulb className="text-indigo-500" />,
            title: "Barrier Stability",
            text: "Neural metrics indicate high stability. Maintain current moisture levels to preserve skin homeostasis."
        };
    };

    const insight = getInsight();

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans overflow-hidden">
            <div className="max-w-7xl mx-auto">

                {/* HEADER SECTION */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded uppercase tracking-widest">Neural Metrics</span>
                            <span className="text-indigo-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} /> Biometric Intelligence
                            </span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                            Skin Health <span className="text-indigo-600">Trends</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm max-w-xl">
                            Visualizing your skin's transformation through our longitudinal biometric engine. Validating routine efficacy with clinical precision.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button className="px-6 py-4 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm">
                            <FaHistory /> Export History
                        </button>
                    </div>
                </div>

                {/* KPI DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <KPICard
                        label="Acne Trajectory"
                        value={Math.round(latest.skin_scores.acne * 100)}
                        change={getChange('acne')}
                        inverse={true}
                        theme="rose"
                    />
                    <KPICard
                        label="Lipid Profile"
                        value={Math.round(latest.skin_scores.oiliness * 100)}
                        change={getChange('oiliness')}
                        inverse={true}
                        theme="amber"
                    />
                    <KPICard
                        label="Texture Uniformity"
                        value={Math.round(latest.skin_scores.texture * 100)}
                        change={getChange('texture')}
                        inverse={true}
                        theme="indigo"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* CHART SECTION */}
                    <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 relative group">
                        <div className="flex justify-between items-center mb-12">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Progress Matrix</h3>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                                    <div className="w-2.5 h-2.5 bg-rose-400 rounded-full"></div> Acne
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div> Oil
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full"></div> Texture
                                </div>
                            </div>
                        </div>

                        <div className="h-[400px] flex items-end justify-between gap-6 pb-6 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 pr-2 pt-2">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-slate-900"></div>)}
                            </div>

                            {data.map((item, idx) => (
                                <div key={idx} className="flex-1 flex flex-col justify-end group/bar relative items-center h-full">

                                    {/* Tooltip */}
                                    <div className="absolute bottom-[calc(100%-20px)] mb-4 bg-slate-900 text-white text-[9px] p-3 rounded-2xl opacity-0 group-hover/bar:opacity-100 transition-all z-20 w-32 shadow-2xl pointer-events-none scale-90 group-hover/bar:scale-100">
                                        <div className="font-black border-b border-white/10 pb-2 mb-2 uppercase tracking-widest">{item.date}</div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between"><span>Acne:</span> <span>{Math.round(item.skin_scores.acne * 100)}%</span></div>
                                            <div className="flex justify-between"><span>Oil:</span> <span>{Math.round(item.skin_scores.oiliness * 100)}%</span></div>
                                        </div>
                                    </div>

                                    {/* Advanced Bar Group */}
                                    <div className="w-full flex justify-center items-end h-full max-w-[60px] gap-1.5 px-1 relative">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${item.skin_scores.acne * 100}%` }}
                                            className="w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-full shadow-lg shadow-rose-100/50 hover:scale-110 transition-transform cursor-pointer"
                                        />
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${item.skin_scores.oiliness * 100}%` }}
                                            className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-full shadow-lg shadow-amber-100/50 hover:scale-110 transition-transform cursor-pointer"
                                        />
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${item.skin_scores.texture * 100}%` }}
                                            className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-full shadow-lg shadow-indigo-100/50 hover:scale-110 transition-transform cursor-pointer"
                                        />
                                    </div>

                                    {/* Date Label */}
                                    <div className="text-[10px] font-black text-slate-400 mt-6 uppercase tracking-tighter opacity-60">
                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* INSIGHTS SIDEBAR */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-3xl space-y-8">
                            <div className="flex items-center gap-3 text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">
                                <FaLightbulb /> Intelligence Insight
                            </div>
                            <h4 className="text-3xl font-black tracking-tighter leading-tight italic">{insight.title}</h4>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                {insight.text}
                            </p>
                            <div className="flex items-center gap-4 pt-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 uppercase text-[9px] font-black tracking-widest text-slate-400">
                                    Next Scan Due: Tomorrow
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-8">
                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FaShieldAlt /> Preservation Mode
                            </h5>
                            <div className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-sm"><FaCheckCircle /></div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase">UV Resistance: High</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-sm"><TrendingUp /></div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase">Renewal Cycle: Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const KPICard = ({ label, value, change, inverse, theme }) => {
    const isGood = inverse ? change <= 0 : change >= 0;
    const colorClass = isGood ? "text-emerald-500" : "text-rose-500";
    const bgClass = theme === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-600' : theme === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600';
    const Icon = change >= 0 ? FaArrowUp : FaArrowDown;

    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 transition-all flex flex-col justify-between"
        >
            <div className="flex justify-between items-start mb-6">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${bgClass}`}>
                    {label}
                </span>
                <div className={`flex items-center text-[10px] font-black ${colorClass}`}>
                    <Icon size={10} className="mr-1" />
                    {Math.abs(change)}%
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-6xl font-black text-slate-900 tracking-tighter italic">{value}<span className="text-2xl not-italic ml-1">%</span></div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        className={`h-full ${theme === 'rose' ? 'bg-rose-400' : theme === 'amber' ? 'bg-amber-400' : 'bg-indigo-400'}`}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default TrendsPage;
