import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getHistory } from "../../services/api";
import {
    FaCut, FaPalette, FaShapes, FaMagic,
    FaCheckCircle, FaChevronRight, FaStar,
    FaInfoCircle, FaWind, FaCrown, FaCamera,
    FaDownload, FaSyncAlt, FaExclamationTriangle, FaTimes
} from 'react-icons/fa';
import { Sparkles, Brain, Layout, Award, Zap, ShieldCheck } from 'lucide-react';

const HAIR_ASSETS = {
    Oval: {
        Male: [
            {
                style: "Modern Pompadour",
                desc: "Adds vertical height to perfectly balance your symmetric oval profile.",
                match: 98,
                tags: ["Sophisticated", "Voluminous"],
                img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Vertical volume to balance facial height.", color: "Natural tones with subtle highlights.", growth: "6-8 weeks retention." }
            },
            {
                style: "Textured Quiff",
                desc: "A versatile, effortless look that maintains natural facial balance.",
                match: 95,
                tags: ["Casual", "Trending"],
                img: "https://images.unsplash.com/photo-1593702295094-ada75ec38835?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Soft texture to break rigid lines.", color: "Matte finish styling.", growth: "4-5 weeks retention." }
            }
        ],
        Female: [
            {
                style: "Long Silk Layers",
                desc: "Enhances natural movement while maintaining your ideal symmetry.",
                match: 99,
                tags: ["Elegant", "Fluid"],
                img: "https://images.unsplash.com/photo-1492106087820-71f1717878e2?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Soft layers to frame the jaw.", color: "Balayage for depth.", growth: "8-10 weeks." }
            },
            {
                style: "Blunt Glass Bob",
                desc: "A clean, chin-length cut that emphasizes your elegant jawline.",
                match: 96,
                tags: ["Modern", "Minimalist"],
                img: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Horizontal precision.", color: "Solid high-gloss black.", growth: "6 weeks." }
            }
        ]
    },
    Square: {
        Male: [
            {
                style: "Faded Textured Crop",
                desc: "Softens the strong, angular lines of your masculine jaw.",
                match: 97, tags: ["Softening", "Modern"], img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Rounded volume to counter jaw.", color: "Matte clay finish.", growth: "4 weeks." }
            },
            {
                style: "Classic Crew Cut",
                desc: "Proportional height that elongates the square facial structure.",
                match: 92, tags: ["Professional", "Tidy"], img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Tapered side transition.", color: "Standard espresso.", growth: "4 weeks." }
            }
        ],
        Female: [
            {
                style: "Voluminous Curls",
                desc: "Soft circular movement to counteract a sharp jawline.",
                match: 98, tags: ["Softening", "Volume"], img: "https://images.unsplash.com/photo-1580618672591-eb1c96b5007e?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Circular diffusion.", color: "Champagne gloss.", growth: "12 weeks." }
            },
            {
                style: "Side-Swept Glam",
                desc: "Asymmetric volume that draws focus away from angular jawlines.",
                match: 95, tags: ["Asymmetric", "Glamorous"], img: "https://images.unsplash.com/photo-1502479532585-618a5948f98d?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "One-sided weight shift.", color: "Golden honey glaze.", growth: "8 weeks." }
            }
        ]
    },
    Round: {
        Male: [
            {
                style: "High Volume Quiff",
                desc: "Adds vertical height and sharp angles to elongate the profile.",
                match: 98, tags: ["Elongating", "Bold"], img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Vertical peak.", color: "Root smudge blend.", growth: "4 weeks." }
            },
            {
                style: "Angular Faux Hawk",
                desc: "Directly counters roundness by adding sharp, pointed volume.",
                match: 94, tags: ["Geometric", "Edgy"], img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Sharp apex focus.", color: "Platinum Tips.", growth: "3 weeks." }
            }
        ],
        Female: [
            {
                style: "Asymmetrical Bob",
                desc: "Creates diagonal flow and angles to slim the face.",
                match: 97, tags: ["Slimming", "Sharp"], img: "https://images.unsplash.com/photo-1534030347209-7147fd9e7f1a?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Length variation.", color: "Midnight jet.", growth: "6 weeks." }
            },
            {
                style: "Sleek Straight Layers",
                desc: "Elongates the visage by drawing the eye downward vertically.",
                match: 94, tags: ["Slimming", "Sleek"], img: "https://images.unsplash.com/photo-1492106087820-71f1717878e2?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Strict verticals.", color: "Cool ash brown.", growth: "10 weeks." }
            }
        ]
    }
};

const ARSimulationModal = ({ onClose, onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState(0);
    
    const steps = [
        "Calibrating facial matrix...",
        "Applying structural dynamics...",
        "Rendering volumetric strands...",
        "Finalizing chromatic harmony..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 500);
                    return 100;
                }
                const newP = p + (Math.random() * 8 + 2);
                setStep(Math.min(Math.floor(newP / 25), 3));
                return newP > 100 ? 100 : newP;
            });
        }, 300);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_50%)]"></div>
            <div className="relative bg-slate-900 border border-indigo-500/30 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.2)] max-w-md w-full overflow-hidden text-center">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                    <FaTimes size={20} />
                </button>
                <div className="w-24 h-24 mx-auto mb-8 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="46" fill="none" stroke="#6366f1" strokeWidth="4" 
                            strokeDasharray="289" strokeDashoffset={289 - (289 * progress) / 100} 
                            className="transition-all duration-300 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="text-indigo-400 animate-pulse" size={32} />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">AR Initialization</h3>
                <p className="text-indigo-300 text-sm font-medium h-6">{steps[step]}</p>
                <div className="mt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">{Math.round(progress)}% Complete</div>
            </div>
        </motion.div>
    );
};

const HairStyling = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeRec, setActiveRec] = useState(0);
    const [isArActive, setIsArActive] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);
    const navigate = useNavigate();

    const handleImageError = useCallback((e, styleName) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=${styleName.replace(' ', '+')}&size=512&background=6366f1&color=fff`;
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getHistory();
            if (res && res.length > 0) {
                setUserData(res[0]);
            } else {
                setUserData(null);
            }
        } catch (err) {
            setError("Failed to synchronize with clinical database. Please verify your connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                <div className="w-32 h-32 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center"><Brain className="text-indigo-500 w-10 h-10 animate-pulse" /></div>
            </motion.div>
            <div className="mt-8 text-center">
                <h3 className="text-xl font-bold tracking-tight">Accessing Vision Studio</h3>
            </div>
        </div>
    );

    if (!userData) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-32 h-32 bg-indigo-900/50 rounded-[2.5rem] flex items-center justify-center text-indigo-400 text-5xl mb-8 border border-indigo-500/30">
                    <FaShapes />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">ANALYSIS REQUIRED</h2>
                <button onClick={() => window.location.href = '/dashboard/analyze'} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                    Start Biometric Scan
                </button>
            </div>
        );
    }

    const { face_shape, gender } = userData;
    // Default to Oval/Female if not found in simplified dict
    const shapeKey = HAIR_ASSETS[face_shape] ? face_shape : "Oval";
    const genderKey = (gender === "Male" || gender === "Female") ? gender : "Female";
    const recommendations = HAIR_ASSETS[shapeKey][genderKey] || HAIR_ASSETS["Oval"]["Female"];
    const currentStyle = recommendations[activeRec] || recommendations[0];

    const handleArLaunch = () => {
        setShowSimulation(true);
    };

    const handleSimulationComplete = () => {
        setShowSimulation(false);
        navigate("/dashboard/virtual-studio");
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#FDFDFF] text-slate-800 relative overflow-hidden">
            <AnimatePresence>
                {showSimulation && <ARSimulationModal onClose={() => setShowSimulation(false)} onComplete={handleSimulationComplete} />}
            </AnimatePresence>

            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

            {/* TOP HEADER STUDIO BAR */}
            <div className="sticky top-0 z-40 bg-white/60 backdrop-blur-2xl border-b border-white/50 px-8 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <Zap size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vision Studio <span className="text-indigo-600">v2.0</span></h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Mode: {face_shape || 'Generic'} Architecture</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200">
                            <FaDownload /> Export Dossier
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                    {/* LEFT PANEL: RECOMMENDATIONS ENGINE */}
                    <div className="xl:col-span-4 space-y-8 flex flex-col">
                        
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-slate-800 shrink-0">
                            <img src="/assets/premium_hair.png" alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen group-hover:scale-105 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                            <div className="relative z-10">
                                <Sparkles className="text-indigo-400 mb-6" size={32} />
                                <h5 className="text-xl font-black uppercase tracking-tighter mb-2">Vision AR Launch</h5>
                                <p className="text-xs text-slate-400 leading-relaxed mb-8 font-medium">Experience neural projection onto your biometric blueprint in real-time.</p>
                                <button
                                    onClick={handleArLaunch}
                                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 border border-indigo-400"
                                >
                                    <FaCamera /> Launch AR Simulator
                                </button>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white flex-1"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Neural Picks</h4>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{recommendations.length} Matches</span>
                            </div>

                            <div className="space-y-4">
                                {recommendations.map((item, idx) => (
                                    <motion.button
                                        key={idx}
                                        onClick={() => setActiveRec(idx)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full group relative flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 border
                                        ${activeRec === idx
                                                ? 'bg-gradient-to-r from-indigo-50 to-white border-indigo-200 shadow-lg'
                                                : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-14 h-14 rounded-[1rem] overflow-hidden shadow-md flex-shrink-0 transition-transform ${activeRec === idx ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'opacity-80'}`}>
                                            <img src={item.img} alt="Hair" className="w-full h-full object-cover" onError={(e) => handleImageError(e, item.style)} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="text-[11px] font-black text-slate-900 truncate uppercase tracking-widest">{item.style}</div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.match}%` }}
                                                        className={`h-full rounded-full ${item.match > 95 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-400'}`}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-600 w-6 text-right">{item.match}%</span>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT PANEL: CLINICAL VISUALIZER */}
                    <div className="xl:col-span-8 space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeRec}
                                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                transition={{ duration: 0.4 }}
                                className="space-y-8"
                            >
                                {/* HERO DISPLAY */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-slate-200/50 border border-white">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                        <div className="relative group rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[4/5] bg-slate-100">
                                            <img
                                                src={currentStyle.img}
                                                alt="Selected Style"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                onError={(e) => handleImageError(e, currentStyle.style)}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                                            
                                            <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                                                {currentStyle.tags.map(tag => (
                                                    <span key={tag} className="px-4 py-1.5 bg-black/30 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/20">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                    <Award size={12} /> Pro-Clinical Selection
                                                </div>
                                                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[0.9] uppercase tracking-tighter">
                                                    {currentStyle.style.split(' ')[0]} <br />
                                                    <span className="text-indigo-600 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                                        {currentStyle.style.split(' ').slice(1).join(' ')}
                                                    </span>
                                                </h1>
                                                <p className="text-slate-500 text-sm font-medium leading-relaxed italic border-l-4 border-indigo-200 pl-6 py-2">
                                                    "{currentStyle.desc}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-lg">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 bg-white text-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                                                            <FaWind size={14} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Maintenance</span>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Low - Moderate</p>
                                                </div>
                                                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-purple-200 transition-all hover:shadow-lg">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 bg-white text-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                                                            <FaShapes size={14} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Shell</span>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">{face_shape}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TECHNICAL SPECIFICATIONS SECTION */}
                                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-800 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
                                    <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-800">
                                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                                            <Layout size={20} />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest">Clinical Morphological Data</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-indigo-400">
                                                <FaInfoCircle size={20} />
                                                <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Symmetry Assist</h6>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{currentStyle.specs?.symmetry}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-purple-400">
                                                <FaPalette size={20} />
                                                <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Chromatic Harmony</h6>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{currentStyle.specs?.color}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-emerald-400">
                                                <ShieldCheck size={20} />
                                                <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Growth Matrix</h6>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{currentStyle.specs?.growth || "Optimized for follicle distribution."}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </motion.div>
    );
};

export default HairStyling;
