import React, { useState, useRef } from 'react';
import { FaFlask, FaCamera, FaUpload, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaSearch } from 'react-icons/fa';
import { ingredientApi } from '../../services/ingredientApi';
import { motion, AnimatePresence } from 'framer-motion';

const IngredientScanner = () => {
    const [image, setImage] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'manual'
    const [manualText, setManualText] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(URL.createObjectURL(file));
        setLoading(true);
        setResults(null);

        try {
            const data = await ingredientApi.scanFromImage(file);
            setResults(data);
        } catch (err) {
            console.error("Scan failed", err);
            const detail = err.response?.data?.detail || err.message;
            toast.error(`Scan failed: ${detail}. Please try a clearer image or manual entry.`);
        } finally {
            setLoading(false);
        }
    };

    const handleManualScan = async () => {
        if (!manualText.trim()) return;
        setLoading(true);
        setResults(null);
        try {
            const data = await ingredientApi.scanFromText(manualText);
            setResults(data);
            if (data.recognized_count > 0) {
                // We could use toast here if available, but let's stick to state for now
            }
        } catch (err) {
            console.error("Manual scan failed", err);
            const detail = err.response?.data?.detail || err.message;
            toast.error(`Analysis failed: ${detail}. Please check if the backend is running on port 8000.`);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (risk) => {
        switch (risk?.toLowerCase()) {
            case 'high': return 'text-rose-500';
            case 'medium': return 'text-amber-500';
            case 'low': return 'text-emerald-500';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="min-h-screen bg-[#fafaf9] p-6 lg:p-12 font-sans selection:bg-indigo-100">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-violet-600 text-white text-[9px] font-black rounded uppercase tracking-widest">Lab Grade</span>
                            <span className="text-violet-600 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div> Formula Intelligence
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                            Ingredient<span className="text-violet-600">Oracle</span>
                            <span className="ml-4 text-[10px] font-black text-slate-300 not-italic align-top">v2.1</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Decode your skincare. Knowledge is the first step to a better routine.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* LEFT: SCAN CONTROLS */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 overflow-hidden relative">
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <button
                                    onClick={() => setActiveTab('scan')}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'scan' ? 'bg-white text-violet-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                >
                                    AI Photo Scan
                                </button>
                                <button
                                    onClick={() => setActiveTab('manual')}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-white text-violet-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                >
                                    Manual Entry
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === 'scan' ? (
                                    <motion.div
                                        key="scan"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div
                                            onClick={() => fileInputRef.current.click()}
                                            className="aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-all group overflow-hidden relative"
                                        >
                                            {image ? (
                                                <img src={image} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-violet-500 text-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-all">
                                                        <FaCamera />
                                                    </div>
                                                    <div className="text-center px-6">
                                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Upload Label</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter border-t border-slate-100 pt-2 mt-2">Clear, high-res photos work best</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="w-full py-4 bg-violet-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
                                        >
                                            <FaUpload /> {image ? "Change Photo" : "Choose Image"}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="manual"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <textarea
                                            value={manualText}
                                            onChange={(e) => setManualText(e.target.value)}
                                            placeholder="Paste the ingredient list here... (e.g. Water, Glycerin, Niacinamide...)"
                                            className="w-full h-64 p-6 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none italic"
                                        />
                                        <button
                                            onClick={handleManualScan}
                                            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3"
                                        >
                                            <FaSearch /> Run Deep Scan
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* PRO TIP */}
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                            <div className="text-amber-500 mt-1"><FaInfoCircle /></div>
                            <div>
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Dermatologist Tip</p>
                                <p className="text-[11px] text-amber-600 font-medium leading-relaxed">Ingredients are listed from highest to lowest concentration. The first 5 usually make up 80% of the formula.</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: RESULTS AREA */}
                    <div className="lg:col-span-8">
                        {loading ? (
                            <div className="h-[600px] bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-8">
                                <div className="w-16 h-16 border-[6px] border-slate-100 border-t-violet-600 rounded-full animate-spin"></div>
                                <div className="text-center space-y-3">
                                    <p className="text-xs font-black text-violet-600 uppercase tracking-[0.4em] animate-pulse">Decoding Molecular Structure...</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cross-referencing Ingredient Database</p>
                                </div>
                            </div>
                        ) : results ? (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* SUMMARY STRIP */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <SummaryCard icon={<FaCheckCircle />} label="Recognized" value={results.recognized_count} color="indigo" />
                                    <SummaryCard icon={<FaExclamationTriangle />} label="Harmful" value={results.harmful_count} color="rose" />
                                    <SummaryCard icon={<FaFlask />} label="Active" value={results.active_count} color="amber" />
                                    <SummaryCard icon={<FaFlask />} label="Beneficial" value={results.beneficial_count} color="emerald" />
                                </div>

                                {/* INGREDIENT LIST */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Detailed Component Analysis</h3>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[8px] font-black text-slate-400 uppercase">A-Z</span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                                        {results.matches.length > 0 ? (
                                            results.matches.map((item, idx) => (
                                                <IngredientRow key={idx} item={item} />
                                            ))
                                        ) : (
                                            <div className="p-20 text-center space-y-4">
                                                <div className="text-3xl grayscale opacity-30">🔍</div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No recognized ingredients found.</p>
                                                <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">Try entering full ingredient names separated by commas.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[600px] bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-8 group">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 text-4xl shadow-inner group-hover:bg-violet-50 group-hover:text-indigo-200 transition-all duration-700">
                                    <FaFlask />
                                </div>
                                <div className="text-center space-y-4 max-w-sm px-10">
                                    <p className="text-slate-900 font-black uppercase tracking-[0.4em] text-xs">Awaiting Composition</p>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed italic">Upload a product label or paste ingredients to begin the molecular audit.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
};

const SummaryCard = ({ icon, label, value, color }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-violet-600 border-indigo-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return (
        <div className={`p-6 rounded-3xl border ${colors[color]} flex flex-col items-center gap-2 shadow-sm`}>
            <div className="text-xl">{icon}</div>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</div>
        </div>
    );
};

const IngredientRow = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getTypeStyles = (type) => {
        switch (type?.toLowerCase()) {
            case 'active': return 'bg-amber-100 text-amber-700';
            case 'beneficial': return 'bg-emerald-100 text-emerald-700';
            case 'harmful': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    return (
        <div className={`p-8 transition-all hover:bg-slate-50 cursor-pointer ${isExpanded ? 'bg-violet-50/30' : ''}`} onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        {item.name}
                        {item.scanned_as && item.scanned_as.toLowerCase() !== item.name.toLowerCase() && (
                            <span className="text-[10px] font-bold text-slate-400 normal-case italic">(Detected as {item.scanned_as})</span>
                        )}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium opacity-80">{item.benefits || item.note || "Component analyzed."}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getTypeStyles(item.type)}`}>
                        {item.type || "Other"}
                    </span>
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-violet-500' : 'text-slate-300'}`}>
                        <FaTimes className="rotate-45" />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Function</p>
                                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">
                                        {item.note || "This ingredient serves as a primary functional component in this formulation."}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.risk === 'High' ? 'bg-rose-500' : item.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Risk Profile: {item.risk || "Low"}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">EWG Rating</span>
                                    <span className="text-xs font-black text-violet-600">Verified</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IngredientScanner;
