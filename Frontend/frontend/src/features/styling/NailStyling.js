import React, { useState, useEffect } from 'react';
import { getHistory } from '../../services/api';
import {
    FaSpinner, FaHistory, FaPalette, FaGem, FaCalendarAlt, FaCheck,
    FaArrowRight, FaFingerprint, FaMagic
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const NAIL_CURRICULUM = {
    Light: [
        {
            name: "Lavender Dream",
            tags: ["Daily", "Luminous", "Daylight"],
            colors: [{ hex: "#F3E8FF", finish: "Creme" }, { hex: "#E9D5FF", finish: "Jelly" }, { hex: "#D8B4FE", finish: "Shimmer" }],
            desc: "A soft, ethereal lavender sequence designed to neutralize cool undertones while providing a luminous, high-gloss finish.",
            img: "/lavender_dream_nails.png",
            specs: { shape: "Almond", durability: "High", complexity: "Level 1" }
        },
        {
            name: "Crimson Precision",
            tags: ["Work", "Classic", "High-Key"],
            colors: [{ hex: "#DC2626", finish: "Matte" }, { hex: "#B91C1C", finish: "Luxe" }],
            desc: "A sophisticated blue-based crimson designed for maximum contrast. Perfect for formal architectures and high-key environments.",
            img: "/classic_crimson_nails.png",
            specs: { shape: "Square", durability: "Medium", complexity: "Level 2" }
        }
    ],
    Medium: [
        {
            name: "Warm Nude Aura",
            tags: ["Daily", "Minimal", "Clinical"],
            colors: [{ hex: "#FDE68A", finish: "Nude" }, { hex: "#FCD34D", finish: "Cream" }],
            desc: "Minimalist beige tones that align with the skin's natural melanin profile, creating a seamless, elongated look for everyday wear.",
            img: "/warm_nude_nails.png",
            specs: { shape: "Almond", durability: "High", complexity: "Level 1" }
        },
        {
            name: "Metallic Copper",
            tags: ["Party", "Reflective", "Night"],
            colors: [{ hex: "#B45309", finish: "Chrome" }, { hex: "#D97706", finish: "Metalic" }],
            desc: "High-reflective copper and bronze pigments that amplify the warmth in medium skin tones. Engineered for high-impact visual presence.",
            img: "/metallic_aura_nails.png",
            specs: { shape: "Stiletto", durability: "Medium", complexity: "Level 3" }
        }
    ],
    Dark: [
        {
            name: "Electric Pop",
            tags: ["Party", "Vibrant", "Contrast"],
            colors: [{ hex: "#22C55E", finish: "Neon" }, { hex: "#EC4899", finish: "Vivid" }],
            desc: "Saturated neon green and magenta architectures that create extreme contrast against deep skin tones. Bold, edgy, and trend-forward.",
            img: "/neon_electric_nails.png",
            specs: { shape: "Coffin", durability: "High", complexity: "Level 3" }
        },
        {
            name: "Emerald Jewel",
            tags: ["Work", "Regal", "Matte"],
            colors: [{ hex: "#064E3B", finish: "Velvet" }, { hex: "#1E3A8A", finish: "Gloss" }],
            desc: "Deep, saturated jewel tones including forest emerald and navy sapphire. Blends multi-finish textures for a regal aesthetic.",
            img: "/royal_emerald_nails.png",
            specs: { shape: "Oval", durability: "High", complexity: "Level 2" }
        }
    ]
};

const SHAPE_DEEP_DIVE = {
    "Almond": {
        desc: "Elongates the fingers and adds a feminine touch. Best for weak nails as it maintains structural integrity.",
        img: "/almond_custom_ref.png",
        suitability: "Short to Medium Fingers",
        strength: "High",
        maintenance: "Low - Bi-weekly",
        idealLength: "Medium",
        vibe: "Sophisticated / Timeless"
    },
    "Coffin": {
        desc: "A bold, avant-garde silhouette that requires length. High visual impact for trend-setting environments.",
        img: "/coffin_custom_ref.png",
        suitability: "Narrow Nail Beds",
        strength: "Medium",
        maintenance: "High - Precision Filing",
        idealLength: "Long",
        vibe: "Edgy / High-Fashion"
    },
    "Square": {
        desc: "A powerful, classic formation. Excellent for wide nail beds and providing maximum surface area for art.",
        img: "/square_custom_ref.png",
        suitability: "Long Fingers",
        strength: "Maximum",
        maintenance: "Medium - Corner Care",
        idealLength: "Short to Medium",
        vibe: "Bold / Authoritative"
    },
    "Stiletto": {
        desc: "An aggressive, dramatic peak. Engineered for high-fashion contexts and extreme length enthusiasts.",
        img: "/stiletto_custom_ref.png",
        suitability: "Short Fingers",
        strength: "Low",
        maintenance: "Extreme - Professional Only",
        idealLength: "Extra Long",
        vibe: "Dramatic / Avant-Garde"
    },
    "Oval": {
        desc: "A natural, high-performance shape that mirrors the cuticle. Offers the most versatile and durable daily wear.",
        img: "/oval_custom_ref.png",
        suitability: "All Hand Types",
        strength: "High",
        maintenance: "Very Low",
        idealLength: "Short to medium",
        vibe: "Clean / Miminalist"
    },
    "Squoval": {
        desc: "The hybrid of square and oval. Provides the strength of a square with the soft elegance of an oval curve.",
        img: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800",
        suitability: "Wide/Short Beds",
        strength: "High",
        maintenance: "Low",
        idealLength: "Short",
        vibe: "Practical / Modern"
    },
    "Ballerina": {
        desc: "A refined variation of the coffin shape, tapering more steeply. Best for adding a sophisticated edge to long nails.",
        img: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=800",
        suitability: "Petite Hands",
        strength: "Medium",
        maintenance: "High",
        idealLength: "Long",
        vibe: "Elegant / Precise"
    }
};

const NailStyling = () => {
    const [skinTone, setSkinTone] = useState("Medium");
    const [occasion, setOccasion] = useState("All");
    const [loading, setLoading] = useState(true);
    const [hasAnalysis, setHasAnalysis] = useState(false);
    const [activeShape, setActiveShape] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistory();
                if (history && history.length > 0) {
                    const latest = history[0];
                    if (latest.skin_tone) {
                        const toneMap = {
                            "Fair": "Light", "Light": "Light",
                            "Medium": "Medium", "Tan": "Medium",
                            "Brown": "Dark", "Dark": "Dark", "Deep": "Dark"
                        };
                        setSkinTone(toneMap[latest.skin_tone] || "Medium");
                        setHasAnalysis(true);
                    }
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchHistory();
    }, []);

    const currentTrends = NAIL_CURRICULUM[skinTone].filter(t =>
        occasion === "All" || t.tags.some(tag => tag.toLowerCase().includes(occasion.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden font-sans selection:bg-teal-500/30">
            {/* ATMOSPHERIC BACKGROUND */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-50/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-100/50 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 p-4 md:p-12">
                {/* HEADER SECTION */}
                <header className="mb-16 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-teal-600 text-white text-[10px] font-black rounded uppercase tracking-[0.2em]">Studio Module</span>
                            <span className="text-teal-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div> Artistry Engine
                            </span>
                        </div>
                        <h1 className="text-7xl font-black tracking-tighter uppercase leading-none italic text-slate-900">
                            Nail Art<span className="text-teal-600">Studio</span> <span className="text-slate-200">PRO</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm max-w-xl leading-relaxed">
                            Precision-mapped color palettes and architectural designs tailored to your biometric profile. Validating the intersection of pigment science and aesthetic form.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-3 rounded-[2.5rem] shadow-2xl border border-slate-100">
                        {hasAnalysis && (
                            <div className="px-6 py-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center gap-4">
                                <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg"><FaFingerprint /></div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Biometric Sync</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase italic">{skinTone} Profile Active</p>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* CONTROLS SIDEBAR */}
                    <aside className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <FaPalette /> Biometric Profile
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {["Light", "Medium", "Dark"].map(tone => (
                                        <button
                                            key={tone}
                                            onClick={() => setSkinTone(tone)}
                                            className={`group relative flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${skinTone === tone ? 'border-teal-600 bg-teal-50/50' : 'border-slate-50 bg-slate-50/30 hover:border-slate-200'}`}
                                        >
                                            <div
                                                className={`w-12 h-12 rounded-2xl shadow-inner transition-transform group-hover:scale-110 ${skinTone === tone ? 'ring-4 ring-white shadow-xl' : ''}`}
                                                style={{ backgroundColor: tone === "Light" ? "#F9EBDF" : tone === "Medium" ? "#EAC096" : "#825334" }}
                                            />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${skinTone === tone ? 'text-teal-600' : 'text-slate-400'}`}>{tone}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <FaCalendarAlt /> Ambience Filter
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {["All", "Daily", "Party", "Work"].map(occ => (
                                        <button
                                            key={occ}
                                            onClick={() => setOccasion(occ)}
                                            className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${occasion === occ ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"}`}
                                        >
                                            {occ}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SHAPE GUIDE MINI */}
                        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-8 shadow-3xl">
                            <h3 className="text-xs font-black text-teal-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <FaMagic /> Architectural Guide
                            </h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.keys(SHAPE_DEEP_DIVE).map(shape => (
                                    <button
                                        key={shape}
                                        onClick={() => setActiveShape(shape)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${activeShape === shape ? 'bg-teal-600/20 border-teal-500/50 text-teal-400' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">{shape}</span>
                                        <FaArrowRight className={`transition-transform ${activeShape === shape ? 'translate-x-1 text-teal-400' : 'text-white/20'}`} size={10} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* RECOMMENDATIONS GRID */}
                    <main className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {activeShape ? (
                                <motion.div
                                    key="shape-detail"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="h-full bg-white rounded-[4rem] shadow-3xl border border-slate-100 p-8 md:p-12 flex flex-col lg:flex-row gap-12 items-center relative group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-slate-50/20 pointer-events-none" />

                                    <button
                                        onClick={() => setActiveShape(null)}
                                        className="absolute top-8 right-8 z-20 p-4 bg-white/80 backdrop-blur-md rounded-full text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-xl border border-slate-100"
                                    >
                                        <FaPalette />
                                    </button>

                                    {/* VISUAL SHOWCASE */}
                                    <div className="w-full lg:w-1/2 relative group/img shrink-0">
                                        <div className="aspect-[4/5] w-full bg-slate-50 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative">
                                            <img
                                                src={SHAPE_DEEP_DIVE[activeShape].img}
                                                alt={activeShape}
                                                className="w-full h-full object-cover transition-all duration-1000"
                                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1604654894610-6364177d61b6?q=80&w=800&auto=format&fit=crop"; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />

                                            {/* VISION OVERLAY */}
                                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">Analysis Active</span>
                                                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-teal-600 text-white rounded-[2.5rem] flex items-center justify-center text-3xl shadow-2xl border-8 border-white transform rotate-12 hover:rotate-0 transition-transform cursor-pointer">
                                            <FaGem />
                                        </div>
                                    </div>

                                    {/* TECHNICAL INTELLIGENCE */}
                                    <div className="flex-1 space-y-8 relative z-10 w-full text-left">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-[1px] bg-teal-500/30" />
                                                <span className="text-teal-600 font-black text-[10px] uppercase tracking-[0.3em]">Architectural Profile</span>
                                            </div>
                                            <h2 className="text-7xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{activeShape}</h2>
                                        </div>

                                        <p className="text-slate-500 text-lg font-medium leading-relaxed italic border-l-4 border-teal-500/20 pl-6 py-2">
                                            "{SHAPE_DEEP_DIVE[activeShape].desc}"
                                        </p>

                                        {/* PRECISION SPECS GRID */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Suitability</p>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase">{SHAPE_DEEP_DIVE[activeShape].suitability}</p>
                                            </div>
                                            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Strength Grade</p>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase">{SHAPE_DEEP_DIVE[activeShape].strength}</p>
                                            </div>
                                            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Maintenance</p>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase">{SHAPE_DEEP_DIVE[activeShape].maintenance}</p>
                                            </div>
                                            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ideal Length</p>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase">{SHAPE_DEEP_DIVE[activeShape].idealLength}</p>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Visual Vibe</span>
                                                <span className="text-sm font-black text-slate-900 italic uppercase">{SHAPE_DEEP_DIVE[activeShape].vibe}</span>
                                            </div>
                                            <button
                                                onClick={() => setActiveShape(null)}
                                                className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                                            >
                                                <FaArrowRight className="rotate-180" /> Back to Trends
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="curriculum-grid"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-10"
                                >
                                    {currentTrends.length > 0 ? currentTrends.map((trend, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ y: -10 }}
                                            className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
                                        >
                                            <div className="relative h-72 overflow-hidden">
                                                <img
                                                    src={trend.img}
                                                    alt={trend.name}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                                <div className="absolute top-8 left-8 flex gap-2">
                                                    {trend.tags.map(tag => (
                                                        <span key={tag} className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-10 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{trend.name}</h3>
                                                        <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-1">Recommended Architecture: {trend.specs.shape}</p>
                                                    </div>
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300"><FaGem size={14} /></div>
                                                </div>

                                                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                                    {trend.desc}
                                                </p>

                                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                                    <div className="flex gap-4">
                                                        {trend.colors.map((c, i) => (
                                                            <div key={i} className="group relative">
                                                                <div
                                                                    className="w-10 h-10 rounded-2xl border-4 border-white shadow-xl transition-transform group-hover:scale-125"
                                                                    style={{ backgroundColor: c.hex }}
                                                                />
                                                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-slate-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                    {c.finish}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black text-slate-300 uppercase">Grade</p>
                                                        <p className="text-[10px] font-black text-slate-900 uppercase">{trend.specs.complexity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="col-span-2 py-20 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center gap-6 text-center px-10">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-2xl">
                                                <FaPalette />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Niche Filtering Conflict</h4>
                                                <p className="text-slate-400 text-xs font-medium max-w-sm">
                                                    Our neural engine found no curriculum matching this exact combination of <b>{skinTone}</b> tone and <b>{occasion}</b> ambience.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setOccasion('All')}
                                                className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest shadow-xl"
                                            >
                                                Reset Filter
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default NailStyling;
