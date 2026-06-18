import React, { useState, useEffect } from 'react';
import {
    FaChartLine, FaArrowUp, FaArrowDown,
    FaStar, FaShieldAlt, FaMagic
} from 'react-icons/fa';
import axios from 'axios';
import ComparisonSlider from './ComparisonSlider';

const ProgressDashboard = () => {
    const [progress, setProgress] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/progress`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token} ` };

                const [progRes, timeRes] = await Promise.all([
                    axios.get(`${API_URL}/comparison`, { headers }),
                    axios.get(`${API_URL}/timeline`, { headers })
                ]);

                setProgress(progRes.data);
                setTimeline(timeRes.data);
            } catch (err) {
                console.error("Failed to fetch progress data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafaf9] p-6 lg:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-violet-100 text-violet-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Analytics Beta</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
                            Skin<span className="text-violet-600">Evolution</span> Tracker
                        </h1>
                        <p className="text-slate-500 font-medium">Monitoring your journey to clinical-grade skin health.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* SUMMARY CARDS */}
                    <div className="lg:col-span-2 space-y-8">

                        {!progress?.can_compare ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-6">
                                <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center text-violet-600 text-3xl mx-auto border border-violet-100">
                                    <FaChartLine />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Need More Data</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        You need at least two AI scans to begin tracking your skin evolution. Perform another scan in the dashboard!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(progress.metrics).map(([key, data]) => (
                                    <div key={key} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key} Score</span>
                                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${data.status === 'improved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {data.status}
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-slate-900">{data.current}%</span>
                                            {data.improvement !== 0 && (
                                                <span className={`text-xs font-bold flex items-center gap-1 ${data.improvement > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {data.improvement > 0 ? <FaArrowDown /> : <FaArrowUp />}
                                                    {Math.abs(data.improvement)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${data.status === 'improved' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                style={{ width: `${data.current}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* VISUAL EVOLUTION SLIDER */}
                        <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm">
                            <ComparisonSlider />
                        </div>

                        {/* TIMELINE CHART PLACEHOLDER (PREMIUM LOOK) */}
                        <div className="bg-slate-900 p-10 rounded-2xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <FaMagic className="text-8xl text-white" />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-white text-xs font-black uppercase tracking-[0.3em]">Historical Timeline (30 Days)</h3>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Acne</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Texture</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[250px] w-full flex items-end justify-between gap-1">
                                    {timeline.length === 0 ? (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No scans in this period</div>
                                    ) : (
                                        timeline.map((entry, idx) => (
                                            <div key={idx} className="flex-1 group/bar relative">
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-slate-900 text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none">
                                                    {entry.date}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div
                                                        className="w-full bg-emerald-500/40 rounded-t-sm transition-all hover:bg-emerald-400"
                                                        style={{ height: `${entry.scores.texture * 150}px` }}
                                                    ></div>
                                                    <div
                                                        className="w-full bg-violet-500/40 transition-all hover:bg-indigo-400"
                                                        style={{ height: `${entry.scores.acne * 100}px` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR - ACTION & INSIGHTS */}
                    <aside className="space-y-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-xl border border-amber-100">
                                    <FaStar />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Health Score</h4>
                                    <p className="text-xl font-black text-slate-800">Excellent 92/100</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Your skin texture has improved by <span className="text-emerald-500 font-bold">12%</span> since your first scan on {progress?.first_scan_date?.split('T')[0]}. Your current routine is proving effective.
                            </p>
                        </div>

                        <div className="bg-violet-600 p-8 rounded-2xl shadow-xl shadow-violet-100 space-y-6 text-white overflow-hidden relative">
                            <div className="absolute -bottom-4 -right-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">AI Next Steps</h4>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black">1</div>
                                    <p className="text-[11px] font-bold">Maintain hydration levels during the PM routine.</p>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black">2</div>
                                    <p className="text-[11px] font-bold">Schedule an expert checkup in 14 days.</p>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-white text-violet-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#fafaf9] transition-all active:scale-95 shadow-lg">
                                View Detailed Report
                            </button>
                        </div>
                    </aside>
                </div>
            </div>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ProgressDashboard;
