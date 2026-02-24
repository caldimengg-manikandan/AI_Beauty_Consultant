import React, { useState, useEffect } from 'react';
import {
    FaSun, FaMoon, FaCheckCircle, FaExclamationTriangle, FaPlus,
    FaMagic, FaCalendarCheck, FaClinicMedical, FaFlask
} from 'react-icons/fa';
import axios from 'axios';

const RoutineBuilder = () => {
    const [routine, setRoutine] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8000/api/routine";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [routineRes, recRes] = await Promise.all([
                    axios.get(`${API_URL}/`, { headers }),
                    axios.get(`${API_URL}/recommendations`, { headers })
                ]);

                setRoutine(routineRes.data);
                setRecommendations(recRes.data.suggested_routine || []);
            } catch (err) {
                console.error("Failed to fetch routine data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const saveRoutine = async (products) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`${API_URL}/build`, {
                user_email: "", // Handled by backend
                routine_name: "My AI Optimized Routine",
                products: products,
                is_active: true
            }, { headers });
            alert("✅ Routine saved successfully!");
            window.location.reload();
        } catch (err) {
            alert("Failed to save routine.");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const displayedProducts = routine?.products?.length > 0 ? routine.products : recommendations;

    return (
        <div className="min-h-screen bg-[#fafaf9] p-6 lg:p-12 font-sans selection:bg-teal-100">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-teal-600 text-white text-[9px] font-black rounded uppercase tracking-widest">Protocol Engine</span>
                            <span className="text-teal-600 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div> Daily Regimen
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                            Routine<span className="text-teal-600">Architect</span>
                        </h1>
                    </div>

                    {!routine?.products?.length && (
                        <button
                            onClick={() => saveRoutine(recommendations)}
                            className="px-8 py-5 bg-teal-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] hover:bg-teal-500 transition-all shadow-xl shadow-teal-100 active:scale-95 flex items-center gap-4"
                        >
                            <FaMagic /> Activate AI Suggestions
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                    {/* AM ROUTINE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-lg border border-amber-100 shadow-sm">
                                <FaSun />
                            </div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Morning Protocol (AM)</h2>
                        </div>

                        <div className="space-y-4">
                            {displayedProducts.filter(p => p.time === "AM" || p.time === "Both").map((p, i) => (
                                <RoutineCard key={i} product={p} isPM={false} />
                            ))}
                        </div>
                    </div>

                    {/* PM ROUTINE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 text-lg border border-indigo-100 shadow-sm">
                                <FaMoon />
                            </div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Evening Protocol (PM)</h2>
                        </div>

                        <div className="space-y-4">
                            {displayedProducts.filter(p => p.time === "PM" || p.time === "Both").map((p, i) => (
                                <RoutineCard key={i} product={p} isPM={true} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI INSIGHTS FOOTER */}
                <footer className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-teal-50 rounded-[1.5rem] flex items-center justify-center text-teal-600 text-2xl border border-teal-100">
                            <FaFlask />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnosis Based</p>
                            <p className="text-sm font-bold text-slate-800">Customized for {routine?.face_shape || "Balanced"} skin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 text-2xl border border-slate-100">
                            <FaClinicMedical />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Safety Index</p>
                            <p className="text-sm font-bold text-slate-800">100% Non-Comedogenic</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 text-2xl border border-emerald-100">
                            <FaCalendarCheck />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consistency</p>
                            <p className="text-sm font-bold text-slate-800">4 Day Streak</p>
                        </div>
                    </div>
                </footer>
            </div>

            <style>{`
                @keyframes card-reveal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-card { animation: card-reveal 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

const RoutineCard = ({ product, isPM }) => (
    <div className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-500 flex items-center gap-6 animate-card border-l-[6px] hover:border-l-teal-500">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg ${isPM ? 'bg-indigo-50 text-indigo-400' : 'bg-amber-50 text-amber-400'}`}>
            <span className="text-[10px] font-black uppercase tracking-tighter">{product.step.substring(0, 3)}</span>
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{product.product_name}</h4>
                <div className="w-5 h-5 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-[10px]">
                    <FaCheckCircle />
                </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium italic opacity-80">{product.instruction}</p>
        </div>
    </div>
);

export default RoutineBuilder;
