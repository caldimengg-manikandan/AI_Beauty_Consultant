import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getHistory } from "../../services/api";
import {
    FaCut, FaPalette, FaShapes, FaMagic,
    FaCheckCircle, FaChevronRight, FaStar,
    FaInfoCircle, FaWind, FaCrown, FaCamera,
    FaDownload, FaSyncAlt, FaExclamationTriangle, FaTimes, FaPlay
} from 'react-icons/fa';
import { Sparkles, Brain, Layout, Award, Zap, ShieldCheck, Activity } from 'lucide-react';

const HAIR_ASSETS = {
    Oval: {
        Male: [
            {
                style: "Modern Pompadour",
                desc: "Adds vertical height to perfectly balance your symmetric oval profile.",
                match: 98,
                tags: ["Sophisticated", "Voluminous"],
                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Vertical volume to balance facial height.", color: "Natural tones with subtle highlights.", growth: "6-8 weeks retention." }
            },
            {
                style: "Textured Quiff",
                desc: "A versatile, effortless look that maintains natural facial balance.",
                match: 95,
                tags: ["Casual", "Trending"],
                img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Soft texture to break rigid lines.", color: "Matte finish styling.", growth: "4-5 weeks retention." }
            },
            {
                style: "Sleek Undercut",
                desc: "Sharp, clean lines that highlight strong jawlines and cheekbones.",
                match: 92,
                tags: ["Sharp", "Modern"],
                img: "https://images.unsplash.com/photo-1622281566810-75cb66927e1f?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "High contrast sides.", color: "Natural dark base.", growth: "3-4 weeks retention." }
            },
            {
                style: "Classic Side Part",
                desc: "Timeless and elegant, offering a structured look for oval faces.",
                match: 90,
                tags: ["Timeless", "Professional"],
                img: "https://images.unsplash.com/photo-1593726850407-742718e24c7f?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Defined parting line.", color: "Warm chestnut.", growth: "5-6 weeks retention." }
            }
        ],
        Female: [
            {
                style: "Long Silk Layers",
                desc: "Enhances natural movement while maintaining your ideal symmetry.",
                match: 99,
                tags: ["Elegant", "Fluid"],
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Soft layers to frame the jaw.", color: "Balayage for depth.", growth: "8-10 weeks." }
            },
            {
                style: "Blunt Glass Bob",
                desc: "A clean, chin-length cut that emphasizes your elegant jawline.",
                match: 96,
                tags: ["Modern", "Minimalist"],
                img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Horizontal precision.", color: "Solid high-gloss black.", growth: "6 weeks." }
            },
            {
                style: "Wavy Lob",
                desc: "Shoulder-length waves that add volume without overwhelming the face.",
                match: 94,
                tags: ["Voluminous", "Chic"],
                img: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Collarbone length.", color: "Honey blonde highlights.", growth: "8-10 weeks." }
            },
            {
                style: "Curtain Bangs",
                desc: "Face-framing fringe that perfectly complements an oval shape.",
                match: 92,
                tags: ["Trendy", "Framing"],
                img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Center parted sweeping bangs.", color: "Soft brunette.", growth: "4-6 weeks." }
            }
        ]
    },
    Square: {
        Male: [
            {
                style: "Faded Textured Crop",
                desc: "Softens the strong, angular lines of your masculine jaw.",
                match: 97, tags: ["Softening", "Modern"], img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Rounded volume to counter jaw.", color: "Matte clay finish.", growth: "4 weeks." }
            },
            {
                style: "Classic Crew Cut",
                desc: "Proportional height that elongates the square facial structure.",
                match: 92, tags: ["Professional", "Tidy"], img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Tapered side transition.", color: "Standard espresso.", growth: "4 weeks." }
            },
            {
                style: "Buzz Cut Fade",
                desc: "Ultra-short and bold, fully embracing the strong square jawline.",
                match: 90, tags: ["Bold", "Low Maintenance"], img: "https://images.unsplash.com/photo-1595958564177-3e47585b8813?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Uniform length top.", color: "Natural.", growth: "2 weeks." }
            },
            {
                style: "Messy French Crop",
                desc: "Textured fringe that beautifully breaks up angular facial features.",
                match: 88, tags: ["Textured", "Edgy"], img: "https://images.unsplash.com/photo-1623517855075-f269a6c9cc2e?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Forward swept fringe.", color: "Ash brown.", growth: "4-5 weeks." }
            }
        ],
        Female: [
            {
                style: "Voluminous Curls",
                desc: "Soft circular movement to counteract a sharp jawline.",
                match: 98, tags: ["Softening", "Volume"], img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Circular diffusion.", color: "Champagne gloss.", growth: "12 weeks." }
            },
            {
                style: "Side-Swept Glam",
                desc: "Asymmetric volume that draws focus away from angular jawlines.",
                match: 95, tags: ["Asymmetric", "Glamorous"], img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "One-sided weight shift.", color: "Golden honey glaze.", growth: "8 weeks." }
            },
            {
                style: "Soft Shag Cut",
                desc: "Heavy layering with feathered ends to drastically soften sharp angles.",
                match: 92, tags: ["Feathered", "Retro"], img: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Choppy internal layers.", color: "Copper red.", growth: "8 weeks." }
            },
            {
                style: "Wispy Layered Cut",
                desc: "Light, airy layers that cascade to soften the overall facial perimeter.",
                match: 90, tags: ["Airy", "Soft"], img: "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Face-framing wisps.", color: "Platinum blonde.", growth: "6 weeks." }
            }
        ]
    },
    Round: {
        Male: [
            {
                style: "High Volume Quiff",
                desc: "Adds vertical height and sharp angles to elongate the profile.",
                match: 98, tags: ["Elongating", "Bold"], img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Vertical peak.", color: "Root smudge blend.", growth: "4 weeks." }
            },
            {
                style: "Angular Faux Hawk",
                desc: "Directly counters roundness by adding sharp, pointed volume.",
                match: 94, tags: ["Geometric", "Edgy"], img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Sharp apex focus.", color: "Platinum Tips.", growth: "3 weeks." }
            },
            {
                style: "Slicked Back Fade",
                desc: "Keeps sides tight while adding smooth height to the top.",
                match: 91, tags: ["Sleek", "Classic"], img: "https://images.unsplash.com/photo-1618012480603-51b6a3b2b932?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "High skin fade.", color: "Jet black.", growth: "3-4 weeks." }
            },
            {
                style: "Spiky Textured Top",
                desc: "Sharp, upward textures create illusions of height and angles.",
                match: 89, tags: ["Textured", "Angular"], img: "https://images.unsplash.com/photo-1520975867597-0af37a22e31e?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Vertical spikes.", color: "Frosted tips.", growth: "4 weeks." }
            }
        ],
        Female: [
            {
                style: "Asymmetrical Bob",
                desc: "Creates diagonal flow and angles to slim the face.",
                match: 97, tags: ["Slimming", "Sharp"], img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Length variation.", color: "Midnight jet.", growth: "6 weeks." }
            },
            {
                style: "Sleek Straight Layers",
                desc: "Elongates the visage by drawing the eye downward vertically.",
                match: 94, tags: ["Slimming", "Sleek"], img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Strict verticals.", color: "Cool ash brown.", growth: "10 weeks." }
            },
            {
                style: "Textured Pixie Cut",
                desc: "Adds volume at the crown to visually lengthen a round face.",
                match: 91, tags: ["Edgy", "Voluminous"], img: "https://images.unsplash.com/photo-1514626585111-9aa86183ac98?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Heightened crown.", color: "Icy blonde.", growth: "4-6 weeks." }
            },
            {
                style: "Face-Framing Balayage",
                desc: "Strategic color placement draws attention vertically down the hair.",
                match: 88, tags: ["Contouring", "Flowing"], img: "https://images.unsplash.com/photo-1563303644-8d13264c9258?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "V-shaped layers.", color: "Caramel balayage.", growth: "12 weeks." }
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-xl"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_50%)]"></div>
            <div className="relative bg-white border border-slate-200 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(99,102,241,0.15)] max-w-md w-full overflow-hidden text-center">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                    <FaTimes size={20} />
                </button>
                <div className="w-24 h-24 mx-auto mb-8 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="46" fill="none" stroke="#6366f1" strokeWidth="4" 
                            strokeDasharray="289" strokeDashoffset={289 - (289 * progress) / 100} 
                            className="transition-all duration-300 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="text-indigo-500 animate-pulse" size={32} />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">AR Initialization</h3>
                <p className="text-indigo-600 text-sm font-medium h-6">{steps[step]}</p>
                <div className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progress)}% Complete</div>
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
        e.target.src = `https://ui-avatars.com/api/?name=${styleName.replace(' ', '+')}&size=512&background=eef2ff&color=4f46e5`;
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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                <div className="w-32 h-32 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center"><Brain className="text-indigo-500 w-10 h-10 animate-pulse" /></div>
            </motion.div>
            <div className="mt-8 text-center">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Accessing Vision Studio</h3>
            </div>
        </div>
    );

    if (!userData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 text-5xl mb-8 border border-indigo-100">
                    <FaShapes />
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">ANALYSIS REQUIRED</h2>
                <button onClick={() => window.location.href = '/dashboard/analyze'} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    Start Biometric Scan
                </button>
            </div>
        );
    }

    const { face_shape, gender } = userData;
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8FAFC] text-slate-800 relative overflow-hidden font-sans">
            <AnimatePresence>
                {showSimulation && <ARSimulationModal onClose={() => setShowSimulation(false)} onComplete={handleSimulationComplete} />}
            </AnimatePresence>

            {/* Premium Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/10 rounded-full blur-[120px] pointer-events-none" />

            {/* TOP HEADER STUDIO BAR */}
            <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-3xl border-b border-slate-200/50 px-8 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
                            <Zap size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vision Studio <span className="text-indigo-600">v2.0</span></h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Mode: <span className="text-slate-800">{face_shape || 'Generic'}</span> Architecture</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            <FaDownload /> Export Dossier
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">

                    {/* LEFT PANEL: HERO CANVAS (8 Cols) */}
                    <div className="xl:col-span-8 flex flex-col space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeRec}
                                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                transition={{ duration: 0.4 }}
                                className="relative rounded-[3rem] bg-white border border-slate-200 shadow-xl overflow-hidden aspect-[4/3] group"
                            >
                                <img
                                    src={currentStyle.img}
                                    alt="Selected Style"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-95"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => handleImageError(e, currentStyle.style)}
                                />
                                {/* Gradient Overlays */}
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/60 via-transparent to-white/95"></div>
                                
                                {/* Top Badges */}
                                <div className="absolute top-8 left-8 flex flex-wrap gap-3">
                                    <span className="px-4 py-2 bg-white/80 backdrop-blur-md text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-200 shadow-sm flex items-center gap-2">
                                        <Award size={14} /> Neural Match {currentStyle.match}%
                                    </span>
                                    {currentStyle.tags.map(tag => (
                                        <span key={tag} className="px-4 py-2 bg-white/80 backdrop-blur-md text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-200 shadow-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Content Bottom */}
                                <div className="absolute bottom-8 left-8 right-8 z-10">
                                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter mb-4 drop-shadow-sm">
                                        {currentStyle.style.split(' ')[0]} <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                                            {currentStyle.style.split(' ').slice(1).join(' ')}
                                        </span>
                                    </h1>
                                    <p className="text-lg text-slate-600 font-medium max-w-2xl border-l-4 border-indigo-500 pl-4 py-1">
                                        {currentStyle.desc}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* CLINICAL DATA WIDGETS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3 text-cyan-500 mb-4">
                                    <FaInfoCircle size={20} className="group-hover:scale-110 transition-transform" />
                                    <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Symmetry Assist</h6>
                                </div>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{currentStyle.specs?.symmetry}</p>
                            </div>
                            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3 text-indigo-500 mb-4">
                                    <FaPalette size={20} className="group-hover:scale-110 transition-transform" />
                                    <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Chromatic Harmony</h6>
                                </div>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{currentStyle.specs?.color}</p>
                            </div>
                            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3 text-purple-500 mb-4">
                                    <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                                    <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Growth Matrix</h6>
                                </div>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{currentStyle.specs?.growth || "Optimized for follicle distribution."}</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: SIDEBAR (4 Cols) */}
                    <div className="xl:col-span-4 flex flex-col space-y-8">
                        {/* VISION AR LAUNCH (Tesla-like) */}
                        <div className="bg-gradient-to-br from-white to-slate-50 rounded-[3rem] p-8 text-slate-900 shadow-md relative overflow-hidden group border border-slate-200 shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] group-hover:bg-cyan-400/20 transition-colors"></div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-6 relative shadow-sm group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-shadow">
                                    <div className="absolute inset-0 rounded-full border border-indigo-200 animate-[spin_4s_linear_infinite]"></div>
                                    <div className="absolute inset-2 rounded-full border border-cyan-200 animate-[spin_3s_linear_infinite_reverse]"></div>
                                    <FaCamera className="text-indigo-500 text-2xl" />
                                </div>
                                
                                <h5 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">Vision Studio</h5>
                                <p className="text-xs text-slate-500 leading-relaxed mb-8 font-medium">Neural projection via spatial mapping</p>
                                
                                <button
                                    onClick={handleArLaunch}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-md transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:shimmer"></span>
                                    <FaPlay size={10} /> INITIALIZE AR
                                </button>
                            </div>
                        </div>

                        {/* NEURAL PICKS */}
                        <div className="bg-white rounded-[3rem] p-6 shadow-md border border-slate-100 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6 px-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="text-indigo-500" size={16} />
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Picks</h4>
                                </div>
                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                    {recommendations.length} Detected
                                </span>
                            </div>

                            <div className="space-y-3">
                                {recommendations.map((item, idx) => {
                                    const isActive = activeRec === idx;
                                    return (
                                        <motion.button
                                            key={idx}
                                            onClick={() => setActiveRec(idx)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`w-full group flex items-center gap-4 p-3 rounded-[2rem] transition-all duration-300 border
                                            ${isActive
                                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 relative shrink-0 transition-colors ${isActive ? 'border-indigo-500' : 'border-slate-200'}`}>
                                                <img src={item.img} alt="Hair" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" onError={(e) => handleImageError(e, item.style)} />
                                            </div>
                                            
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="text-[11px] font-black text-slate-900 truncate uppercase tracking-widest">{item.style}</div>
                                                <div className="text-[9px] text-indigo-600 mt-1 font-bold uppercase tracking-widest">{item.tags[0]}</div>
                                            </div>
                                            
                                            {/* Circular Progress Ring */}
                                            <div className="w-10 h-10 relative shrink-0 flex items-center justify-center mr-2">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="3" />
                                                    <circle cx="20" cy="20" r="16" fill="none" stroke={isActive ? "#6366f1" : "#cbd5e1"} strokeWidth="3" 
                                                        strokeDasharray="100" strokeDashoffset={100 - item.match} 
                                                        className="transition-all duration-1000 ease-out" />
                                                </svg>
                                                <span className="absolute text-[8px] font-black text-slate-700">{item.match}</span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </motion.div>
    );
};

export default HairStyling;
