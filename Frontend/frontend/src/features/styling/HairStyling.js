import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getHistory } from "../../services/api";
import {
    FaCut, FaPalette, FaShapes, FaMagic,
    FaCheckCircle, FaChevronRight, FaStar,
    FaInfoCircle, FaWind, FaCrown, FaCamera,
    FaDownload, FaSyncAlt, FaExclamationTriangle
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
            },
            {
                style: "Side Swept Undercut",
                desc: "Sharp contrast that highlights your strong cheekbone structure.",
                match: 92,
                tags: ["Bold", "Sharp"],
                img: "https://images.unsplash.com/photo-1521146764736-56c929d59c83?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Diagonal flow for dynamic balance.", color: "High contrast dark/light.", growth: "3-4 weeks for fade." }
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
                match: 97, tags: ["Softening", "Modern"], img: "/assets/hairstyles/faded_textured_crop.png",
                specs: { symmetry: "Rounded volume to counter jaw.", color: "Matte clay finish.", growth: "4 weeks." }
            },
            {
                style: "Buzz Cut with Fade",
                desc: "A bold, low-maintenance look that highlights structural strength.",
                match: 94, tags: ["Masculine", "Sharp"], img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
                specs: { symmetry: "Uniform minimalist shell.", color: "Natural scalp blend.", growth: "2 weeks." }
            },
            {
                style: "Classic Crew Cut",
                desc: "Proportional height that elongates the square facial structure.",
                match: 92, tags: ["Professional", "Tidy"], img: "/assets/hairstyles/classic_crew_cut.png",
                specs: { symmetry: "Tapered side transition.", color: "Standard espresso.", growth: "4 weeks." }
            },
            {
                style: "Side Part Slick",
                desc: "Adds horizontal flow to break the rigid symmetry of square traits.",
                match: 90, tags: ["Classic", "Formal"], img: "/assets/hairstyles/side_part_slick.png",
                specs: { symmetry: "Diagonal parting assist.", color: "High-shine pomade.", growth: "5 weeks." }
            }
        ],
        Female: [
            {
                style: "Voluminous Curls",
                desc: "Soft circular movement to counteract a sharp jawline.",
                match: 98, tags: ["Softening", "Volume"], img: "/assets/hairstyles/square_curls.png",
                specs: { symmetry: "Circular diffusion.", color: "Champagne gloss.", growth: "12 weeks." }
            },
            {
                style: "Face-Framing Waves",
                desc: "Long, fluid layers that slim the facial perimeter.",
                match: 96, tags: ["Elegant", "Slimming"], img: "/assets/hairstyles/square_waves.png",
                specs: { symmetry: "Vertical flow layers.", color: "Roasted mocha.", growth: "10 weeks." }
            },
            {
                style: "Side-Swept Glam",
                desc: "Asymmetric volume that draws focus away from angular jawlines.",
                match: 95, tags: ["Asymmetric", "Glamorous"], img: "/assets/hairstyles/square_sideswept.png",
                specs: { symmetry: "One-sided weight shift.", color: "Golden honey glaze.", growth: "8 weeks." }
            },
            {
                style: "Layered Long Bob",
                desc: "Soft wispy bangs and layers to frame and soften angular faces.",
                match: 93, tags: ["Framing", "Soothing"], img: "/assets/hairstyles/square_bob.png",
                specs: { symmetry: "Interrupted jawline weight.", color: "Ash blonde melt.", growth: "6 weeks." }
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
                match: 97, tags: ["Slimming", "Sharp"], img: "/assets/hairstyles/asymmetrical_bob.png",
                specs: { symmetry: "Length variation.", color: "Midnight jet.", growth: "6 weeks." }
            },
            {
                style: "Pixie with Height",
                desc: "Vertical edges provide much-needed contrast to round traits.",
                match: 95, tags: ["Contrast", "Bold"], img: "/assets/hairstyles/pixie_cut.png",
                specs: { symmetry: "Top-heavy volume.", color: "Ruby red glaze.", growth: "4 weeks." }
            },
            {
                style: "Sleek Straight Layers",
                desc: "Elongates the visage by drawing the eye downward vertically.",
                match: 94, tags: ["Slimming", "Sleek"], img: "/assets/hairstyles/sleek_layers.png",
                specs: { symmetry: "Strict verticals.", color: "Cool ash brown.", growth: "10 weeks." }
            },
            {
                style: "High Ballerina Bun",
                desc: "Adds instant vertical length and highlights your neck and jaw.",
                match: 90, tags: ["Vertical", "Classic"], img: "/assets/hairstyles/ballerina_bun.png",
                specs: { symmetry: "Central top point.", color: "Uniform black.", growth: "N/A (Style)" }
            }
        ]
    },
    Heart: {
        Male: [{ style: "Mid-Length Layered", desc: "Balances a narrow angular chin.", match: 96, tags: ["Balanced"], img: "https://images.unsplash.com/photo-1514222709107-a180c68d72b4?auto=format&fit=crop&w=600&q=80", specs: { symmetry: "Lower volume.", color: "Golden wheat.", growth: "8 weeks." } }],
        Female: [{ style: "Chin Length Bob", desc: "Adds width near the jaw.", match: 97, tags: ["Structuring"], img: "https://images.unsplash.com/photo-1502479532585-618a5948f98d?auto=format&fit=crop&w=600&q=80", specs: { symmetry: "Jaw widening.", color: "Soft blonde.", growth: "6 weeks." } }]
    },
    Long: {
        Male: [{ style: "Classic Side Part", desc: "Adds horizontal width.", match: 95, tags: ["Width"], img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=600&q=80", specs: { symmetry: "Horizontal balance.", color: "Matte tobacco.", growth: "6 weeks." } }],
        Female: [{ style: "Shoulder Length Waves", desc: "Adds volume to sides.", match: 98, tags: ["Voluminous"], img: "https://images.unsplash.com/photo-1580618672591-eb1c96b5007e?auto=format&fit=crop&w=600&q=80", specs: { symmetry: "Mid-level width.", color: "Caramel swirl.", growth: "12 weeks." } }]
    },
    Diamond: {
        Male: [{ style: "Messy Fringe", desc: "Softens sharp cheekbones.", match: 94, tags: ["Softening"], img: "https://images.unsplash.com/photo-1593702295094-ada75ec38835?auto=format&fit=crop&w=800&q=80", specs: { symmetry: "Temple widening.", color: "Sun-bleached.", growth: "5 weeks." } }],
        Female: [{ style: "Face-Framing Layers", desc: "Softens prominent cheekbones.", match: 96, tags: ["Framing"], img: "https://images.unsplash.com/photo-1534030347209-7147fd9e7f1a?auto=format&fit=crop&w=800&q=80", specs: { symmetry: "Jawline widening.", color: "Warm toffee.", growth: "10 weeks." } }]
    }
};

const HairStyling = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeRec, setActiveRec] = useState(0);
    const [isArActive, setIsArActive] = useState(false);
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
            console.error(err);
            setError("Failed to synchronize with clinical database. Please verify your connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
            >
                <div className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="text-indigo-600 w-10 h-10 animate-pulse" />
                </div>
            </motion.div>
            <div className="mt-8 text-center">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Accessing Vision Studio</h3>
                <p className="text-slate-500 text-sm mt-2">Computing morphological compatibility matrix...</p>
                <div className="w-64 h-1.5 bg-slate-200 mt-6 rounded-full overflow-hidden mx-auto">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-full bg-indigo-600 w-full"
                    />
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-red-100 shadow-sm">
                <FaExclamationTriangle />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Synchronization Error</h2>
            <p className="text-slate-500 max-w-md mb-8">{error}</p>
            <button
                onClick={fetchData}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto"
            >
                <FaSyncAlt /> Retry Synchronization
            </button>
        </div>
    );

    if (!userData) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 text-5xl mb-8 shadow-xl"
                >
                    <FaShapes />
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">ANALYSIS REQUIRED</h2>
                <p className="text-slate-500 max-w-sm mb-10 font-medium">To provide high-fidelity hair recommendations, we first need to map your unique facial architecture.</p>
                <button
                    onClick={() => window.location.href = '/dashboard/analyze'}
                    className="group px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                >
                    Start Biometric Scan
                </button>
            </div>
        );
    }

    const { face_shape, gender } = userData;
    const recommendations = (HAIR_ASSETS[face_shape] || HAIR_ASSETS.Oval)[gender || "Female"] || [];
    const currentStyle = recommendations[activeRec] || recommendations[0];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#FDFDFF] text-slate-800"
        >
            {/* TOP HEADER STUDIO BAR */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-600 rounded-lg text-white">
                            <Zap size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vision Studio <span className="text-indigo-600">v2.0</span></h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase truncate">Mode: {face_shape || 'Generic'} Facial Mapping</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200">
                            <FaDownload /> Export Dossier
                        </button>
                        <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 ring-1 ring-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    {i}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* LEFT PANEL: RECOMMENDATIONS ENGINE */}
                    <div className="lg:col-span-4 space-y-8">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Neural Picks</h4>
                                <span className="text-[10px] font-bold text-slate-400">Total: {recommendations.length}</span>
                            </div>

                            <div className="space-y-4">
                                {recommendations.map((item, idx) => (
                                    <motion.button
                                        key={idx}
                                        variants={itemVariants}
                                        onClick={() => setActiveRec(idx)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border
                                        ${activeRec === idx
                                                ? 'bg-indigo-50 border-indigo-100 shadow-md ring-1 ring-indigo-200'
                                                : 'bg-white border-slate-100 hover:border-indigo-100'
                                            }`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl overflow-hidden shadow-sm flex-shrink-0 transition-transform ${activeRec === idx ? 'scale-110' : 'opacity-80'}`}>
                                            <img
                                                src={item.img}
                                                alt="Hair"
                                                className="w-full h-full object-cover"
                                                onError={(e) => handleImageError(e, item.style)}
                                            />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{item.style}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.match}%` }}
                                                        className={`h-full ${item.match > 95 ? 'bg-indigo-500' : 'bg-slate-400'}`}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-600">{item.match}%</span>
                                            </div>
                                        </div>
                                        {activeRec === idx && <FaStar className="text-yellow-500 text-sm animate-bounce" />}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                            <Sparkles className="text-indigo-200 mb-6" size={32} />
                            <h5 className="text-lg font-black uppercase italic mb-3">Vision AR Launch</h5>
                            <p className="text-xs text-indigo-100 leading-relaxed mb-8 opacity-90">Real-time neural projection onto your biometric blueprint.</p>
                            <button
                                onClick={() => navigate("/dashboard/virtual-studio")}
                                className="w-full py-4 bg-white text-indigo-700 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                            >
                                <FaCamera /> Launch Virtual Studio
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: CLINICAL VISUALIZER */}
                    <div className="lg:col-span-8 space-y-10">

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeRec}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                {/* HERO DISPLAY */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                                    <div className="relative group p-2 bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                                        <div className="relative aspect-square rounded-[2.5rem] overflow-hidden">
                                            <motion.img
                                                src={currentStyle.img}
                                                alt="Selected Style"
                                                className="w-full h-full object-cover"
                                                onError={(e) => handleImageError(e, currentStyle.style)}
                                                animate={{ scale: isArActive ? 1.1 : 1 }}
                                            />
                                            {isArActive && (
                                                <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] flex items-center justify-center">
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-white/50 animate-scan"></div>
                                                    <div className="px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/20">
                                                        AR Vision Sync Active
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
                                            {currentStyle.tags.map(tag => (
                                                <span key={tag} className="px-4 py-2 bg-white/90 backdrop-blur-xl text-indigo-600 text-[10px] font-black uppercase rounded-full shadow-sm border border-slate-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                <Award size={12} /> Pro-Clinical Selection
                                            </div>
                                            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[0.9] uppercase tracking-tighter">
                                                {currentStyle.style.split(' ')[0]} <br />
                                                <span className="text-indigo-600">{currentStyle.style.split(' ').slice(1).join(' ')}</span>
                                            </h1>
                                            <p className="text-slate-500 text-lg font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-6 py-2">
                                                "{currentStyle.desc}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                        <FaWind size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Low to Moderate</p>
                                            </div>
                                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-purple-200 transition-all">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                        <FaShapes size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Shell</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">{face_shape} Geometry</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TECHNICAL SPECIFICATIONS SECTION */}
                                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <Layout size={20} />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Clinical Morphological Data</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-indigo-500">
                                                <FaInfoCircle size={20} />
                                                <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Symmetry Assist</h6>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{currentStyle.specs?.symmetry}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-purple-500">
                                                <FaPalette size={20} />
                                                <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Chromatic Harmony</h6>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{currentStyle.specs?.color}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-emerald-500">
                                                <ShieldCheck size={20} />
                                                <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Growth Matrix</h6>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{currentStyle.specs?.growth || "Optimized for follicle distribution."}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    position: absolute;
                    animation: scan 2s linear infinite;
                    box-shadow: 0 0 15px 2px rgba(99, 102, 241, 0.5);
                }
            `}</style>

        </motion.div>
    );
};

export default HairStyling;
