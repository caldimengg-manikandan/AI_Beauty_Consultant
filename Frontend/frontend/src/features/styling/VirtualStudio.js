import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
    FaCamera, FaUpload, FaMagic, FaSyncAlt, FaDownload,
    FaPalette, FaHistory, FaCheck, FaEye, FaWind, FaSun, FaAdjust,
    FaFingerprint, FaBan, FaMoon, FaBolt, FaMicrophone,
    FaRegLightbulb, FaLayerGroup
} from 'react-icons/fa';
import { getHistory } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const VIRTUAL_STUDIO_API = `${API_BASE}/tryon`;
const MATCH_API = `${API_BASE}/tryon/foundation-match`;

const COLOR_PRESETS = {
    lipstick: ["#FF0000", "#DC2626", "#BE123C", "#831843", "#DB2777", "#F472B6", "#FB7185", "#E11D48"],
    blush: ["#FDA4AF", "#FCA5A5", "#FDBA74", "#F9A8D4", "#F472B6", "#E879F9"],
    eyeshadow: ["#451A03", "#78350F", "#92400E", "#312E81", "#4C1D95", "#374151", "#064E3B", "#1E3A8A"],
    hair: ["#451A03", "#78350F", "#92400E", "#F59E0B", "#D97706", "#111827", "#312E81", "#4C1D95"],
    foundation: ["#F9EBDF", "#F6E5D6", "#F3D8C1", "#EBC0A4", "#E1AD89", "#D29871", "#C1845C", "#A36B46", "#825334"]
};

const VirtualStudio = () => {
    const [image, setImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState('lipstick');
    const [matchData, setMatchData] = useState(null);

    // Advanced Composition State
    const [effects, setEffects] = useState({
        lipstick: { color: '#FF0000', intensity: 0.6, finish: 'Satin', active: false },
        blush: { color: '#FCA5A5', intensity: 0.3, active: false },
        eyeshadow: { color: '#451A03', intensity: 0.4, active: false },
        hair: { color: '#451A03', intensity: 0.4, active: false },
        foundation: { color: '#F3D8C1', intensity: 0.5, active: false }
    });
    const [smoothing, setSmoothing] = useState(0.3);
    const [lighting, setLighting] = useState(0.2);
    const [backgroundType, setBackgroundType] = useState('None');
    const [compareMode, setCompareMode] = useState(false);
    const [overlayMode, setOverlayMode] = useState(false);
    const [tutorialMode, setTutorialMode] = useState('none'); // 'none', 'contour', 'highlight', 'blush'

    const ENVIRONMENTS = [
        { id: 'None', label: 'Raw', icon: <FaBan />, color: 'bg-slate-100', desc: 'No processing' },
        { id: 'Midnight', label: 'Midnight', icon: <FaMoon />, color: 'bg-slate-900', desc: 'Deep studio' },
        { id: 'Atelier', label: 'Atelier', icon: <FaPalette />, color: 'bg-stone-50', desc: 'Soft gallery' },
        { id: 'Cyber', label: 'Cyber', icon: <FaBolt />, color: 'bg-purple-900', desc: 'Neon future' }
    ];

    const [userData, setUserData] = useState(null);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [isListening, setIsListening] = useState(false);

    const handleVoiceCommand = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            if (process.env.NODE_ENV === "development") console.log("Voice Command:", command);

            if (command.includes('lips') || command.includes('lipstick')) setCurrentTab('lipstick');
            if (command.includes('blush')) setCurrentTab('blush');
            if (command.includes('shadow')) setCurrentTab('eyeshadow');
            if (command.includes('hair')) setCurrentTab('hair');
            if (command.includes('skin') || command.includes('foundation')) setCurrentTab('foundation');

            if (command.includes('red')) updateEffect(currentTab, 'color', '#FF0000');
            if (command.includes('pink')) updateEffect(currentTab, 'color', '#FB7185');

            if (command.includes('capture') || command.includes('photo')) captureImage();
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    useEffect(() => {
        const checkAnalysis = async () => {
            try {
                const res = await getHistory();
                if (res.data && res.data.length > 0) setUserData(res.data[0]);
            } catch (err) { console.error(err); }
        };
        checkAnalysis();

        // Cleanup: Ensure camera is turned off if user leaves page
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    const updateEffect = (type, key, value) => {
        setEffects(prev => ({
            ...prev,
            [type]: { ...prev[type], [key]: value, active: true }
        }));
    };

    const toggleEffect = (type) => {
        setEffects(prev => ({
            ...prev,
            [type]: { ...prev[type], active: !prev[type].active }
        }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setProcessedImage(null);
                setMatchData(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const runAutoMatch = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const res = await axios.post(MATCH_API, { image });
            if (res.data.status === 'success') {
                const data = res.data.data;
                setMatchData(data);
                updateEffect('foundation', 'color', data.hex);
                updateEffect('foundation', 'intensity', 0.6);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fix: Attach stream to video ref once the element is rendered in DOM
    useEffect(() => {
        if (isCameraActive && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [isCameraActive, cameraStream]);

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("🔒 Secure Context Required: Your browser has blocked camera access either because the connection is not secure (HTTPS) or the browser is out of date.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setCameraStream(stream);
            setIsCameraActive(true);
        } catch (err) {
            console.error("Camera Error:", err);
            if (err.name === 'NotAllowedError') {
                toast.error("🚫 Camera Access Denied: Please check your browser's site settings and click 'Allow' for the camera.");
            } else if (err.name === 'NotFoundError') {
                toast.error("📷 No Camera Found: We couldn't detect a camera device connected to your system.");
            } else if (err.name === 'NotReadableError') {
                toast.error("⚠️ Camera Busy: Another application (like Zoom or Teams) is currently using your camera. Please close it and try again.");
            } else {
                toast.error(`❌ Imaging Error: ${err.message}`);
            }
        }
    };

    const captureImage = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const data = canvas.toDataURL('image/jpeg');
        setImage(data);
        setIsCameraActive(false);
        const stream = video.srcObject;
        stream.getTracks().forEach(track => track.stop());
    };

    const applyProStudio = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const activeItems = Object.entries(effects)
                .filter(([_, data]) => data.active)
                .map(([type, data]) => ({
                    type,
                    color: data.color,
                    intensity: data.intensity,
                    finish: data.finish || "Satin"
                }));

            const res = await axios.post(VIRTUAL_STUDIO_API, {
                image,
                effects: activeItems,
                smoothing,
                lighting,
                background_type: backgroundType
            });
            if (res.data.status === 'success') {
                setProcessedImage(res.data.image);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-apply debounced
    useEffect(() => {
        if (image && !isCameraActive) {
            const timer = setTimeout(() => applyProStudio(), 500);
            return () => clearTimeout(timer);
        }
    }, [effects, smoothing, lighting, backgroundType, image]);

    const getUITheme = () => {
        if (backgroundType === 'Cyber') return 'bg-[#fdf2f8]';
        if (backgroundType === 'Atelier') return 'bg-[#f8fafc]';
        return 'bg-white';
    };

    // --- HUD & TUTORIAL RENDERER ---
    const renderHUD = () => {
        if (!userData || !userData.landmarks) return null;

        // This is a simplified representation. In a real app, we'd scale landmarks to current image size.
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[4.5rem]">
                <AnimatePresence>
                    {overlayMode && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-full h-full relative"
                        >
                            {/* Floating Biometric Labels */}
                            <div className="absolute top-[20%] left-[15%] p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Hydration</p>
                                <p className="text-xs font-black text-white">82% <span className="text-[8px] text-emerald-400">OPTIMAL</span></p>
                            </div>
                            <div className="absolute top-[40%] right-[10%] p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                                <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Sensitivity</p>
                                <p className="text-xs font-black text-white">LOW</p>
                            </div>
                            <div className="absolute bottom-[20%] left-[30%] p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Texture</p>
                                <p className="text-xs font-black text-white">94/100</p>
                            </div>
                        </motion.div>
                    )}

                    {tutorialMode !== 'none' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            {/* SVG Guides anchored to face regions */}
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                {tutorialMode === 'contour' && (
                                    <path d="M25,45 Q20,55 25,65 M75,45 Q80,55 75,65" fill="none" stroke="#451A03" strokeWidth="2" strokeDasharray="2,2" className="animate-pulse" />
                                )}
                                {tutorialMode === 'highlight' && (
                                    <path d="M40,35 Q50,30 60,35 M50,45 Q50,60 50,75" fill="none" stroke="#FEF9C3" strokeWidth="2" strokeDasharray="2,2" className="animate-pulse" />
                                )}
                                {tutorialMode === 'blush' && (
                                    <>
                                        <circle cx="28" cy="55" r="5" fill="rgba(251, 113, 133, 0.2)" />
                                        <circle cx="72" cy="55" r="5" fill="rgba(251, 113, 133, 0.2)" />
                                    </>
                                )}
                            </svg>
                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                                {tutorialMode === 'contour' && "Apply Contour along the hollows of your cheeks"}
                                {tutorialMode === 'highlight' && "Apply Highlight to the high points of cheekbones & bridge of nose"}
                                {tutorialMode === 'blush' && "Apply Blush to the apples of your cheeks"}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${getUITheme()} text-slate-900 transition-colors duration-1000 p-4 md:p-10 font-sans selection:bg-indigo-500/30`}>
            <div className="max-w-[1600px] mx-auto">
                {/* HIGH-END NAV */}
                <header className="mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded uppercase tracking-[0.2em]">Live Prototype</span>
                            <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div> Precision AR Engine
                            </span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase leading-none italic text-slate-900">
                            Vision<span className="text-indigo-600">Studio</span> <span className="text-slate-300">PRO</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl shadow-lg border border-slate-100">
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-2xl transition-all flex items-center gap-3 text-xs uppercase tracking-widest"
                        >
                            <FaUpload /> Source
                        </button>
                        <button
                            onClick={startCamera}
                            className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-100 text-xs uppercase tracking-widest"
                        >
                            <FaCamera /> {isCameraActive ? "Syncing..." : "Live Feed"}
                        </button>
                        <button
                            onClick={handleVoiceCommand}
                            className={`px-8 py-4 ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'} text-white font-black rounded-2xl flex items-center gap-3 transition-all shadow-xl text-xs uppercase tracking-widest`}
                        >
                            <FaMicrophone /> {isListening ? "Listening..." : "Voice Control"}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* STUDIO CONTROLS */}
                    <aside className="xl:col-span-4 space-y-8 h-fit">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl space-y-10 transition-all">

                            {/* CATEGORY TABS */}
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto">
                                {['lipstick', 'blush', 'eyeshadow', 'foundation', 'hair'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCurrentTab(cat)}
                                        className={`flex-1 min-w-[80px] py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${currentTab === cat ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {effects[cat].active && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                                        {cat === 'lipstick' ? 'Lips' : cat}
                                    </button>
                                ))}
                            </div>

                            {/* ACTIVE TAB SHADER */}
                            <div className="space-y-8 animate-fade-in">
                                <div className="flex justify-between items-end">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Precision Palette</h3>
                                    <button
                                        onClick={() => toggleEffect(currentTab)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${effects[currentTab].active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        {effects[currentTab].active ? 'Active' : 'Disabled'}
                                    </button>
                                </div>

                                {currentTab === 'foundation' && (
                                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Intelligent Match</p>
                                                <p className="text-[11px] text-slate-500 font-medium">Auto-detect biometric tone.</p>
                                            </div>
                                            <button
                                                onClick={runAutoMatch}
                                                className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-all active:scale-95"
                                            >
                                                <FaFingerprint />
                                            </button>
                                        </div>

                                        {matchData && (
                                            <div className="grid grid-cols-2 gap-4 animate-reveal">
                                                <div className="bg-white p-3 rounded-2xl border border-indigo-100 flex flex-col items-center gap-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Undertone</span>
                                                    <span className={`text-[10px] font-black uppercase ${matchData.undertone === 'Warm' ? 'text-amber-500' : matchData.undertone === 'Cool' ? 'text-rose-400' : 'text-slate-600'}`}>{matchData.undertone}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-indigo-100 flex flex-col items-center gap-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Category</span>
                                                    <span className="text-[10px] font-black uppercase text-indigo-600">{matchData.shade_category}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-5 gap-4">
                                    {COLOR_PRESETS[currentTab].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => updateEffect(currentTab, 'color', c)}
                                            className={`aspect-square rounded-2xl border-2 transition-all hover:scale-110 flex items-center justify-center ${effects[currentTab].color === c ? 'border-indigo-600 shadow-lg' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        >
                                            {effects[currentTab].color === c && <FaCheck className="text-[10px] text-white" />}
                                        </button>
                                    ))}
                                    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-slate-400 transition-all cursor-pointer">
                                        <input
                                            type="color" value={effects[currentTab].color}
                                            onChange={(e) => updateEffect(currentTab, 'color', e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <FaPalette className="text-slate-300" />
                                    </div>
                                </div>

                                {currentTab === 'lipstick' && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Finish Texture</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Matte', 'Satin', 'Glossy'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => updateEffect('lipstick', 'finish', f)}
                                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${effects.lipstick.finish === f ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Formula Intensity</span>
                                        <span className="text-indigo-600">{Math.round(effects[currentTab].intensity * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="1" step="0.05"
                                        value={effects[currentTab].intensity}
                                        onChange={(e) => updateEffect(currentTab, 'intensity', parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            </div>

                            {/* GLOBAL ENHANCEMENTS */}
                            <div className="pt-10 border-t border-slate-100 space-y-10">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Studio Finishing</h3>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="flex items-center gap-2 text-slate-600"><FaWind /> Skin Smoothing</span>
                                            <span className="text-indigo-600">{Math.round(smoothing * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.1"
                                            value={smoothing} onChange={(e) => setSmoothing(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="flex items-center gap-2 text-slate-600"><FaSun /> Pro Lighting</span>
                                            <span className="text-indigo-600">{Math.round(lighting * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.1"
                                            value={lighting} onChange={(e) => setLighting(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>

                                    <div className="space-y-5">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 bg-indigo-500 rounded-full"></div> Studio Ambient
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {ENVIRONMENTS.map(env => (
                                                <button
                                                    key={env.id}
                                                    onClick={() => setBackgroundType(env.id)}
                                                    className={`group relative flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${backgroundType === env.id ? 'border-indigo-600 bg-indigo-50/60 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm transition-all ${backgroundType === env.id ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:scale-110'}`}>
                                                        {env.icon}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${backgroundType === env.id ? 'text-indigo-600' : 'text-slate-600'}`}>{env.label}</p>
                                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{env.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 bg-indigo-500 rounded-full"></div> AR Smart Guides
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setOverlayMode(!overlayMode)}
                                                className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${overlayMode ? 'border-indigo-600 bg-indigo-50/60 shadow-lg' : 'border-slate-100 bg-white shadow-sm'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${overlayMode ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                    <FaAdjust />
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-widest">Smart HUD</p>
                                            </button>
                                            <div className="relative group/tutorial">
                                                <button
                                                    className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${tutorialMode !== 'none' ? 'border-amber-600 bg-amber-50/60 shadow-lg' : 'border-slate-100 bg-white shadow-sm'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${tutorialMode !== 'none' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                        <FaRegLightbulb />
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest">Tutorials</p>
                                                </button>
                                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 hidden group-hover/tutorial:block z-50">
                                                    {['none', 'contour', 'highlight', 'blush'].map(m => (
                                                        <button
                                                            key={m} onClick={() => setTutorialMode(m)}
                                                            className={`w-full text-left p-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 ${tutorialMode === m ? 'text-indigo-600' : 'text-slate-400'}`}
                                                        >
                                                            {m}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!processedImage}
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = processedImage;
                                link.download = `studio_render_pro.jpg`;
                                link.click();
                            }}
                            className="w-full py-6 bg-slate-900 text-white font-black rounded-[2.5rem] uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl disabled:opacity-20 translate-y-2"
                        >
                            <FaDownload /> Export Render
                        </button>
                    </aside>

                    {/* STUDIO PREVIEW */}
                    <main className="xl:col-span-8 flex flex-col items-center">
                        <div className="w-full h-full min-h-[700px] relative group flex items-center justify-center">

                            {/* PREVIEW CONTAINER */}
                            <div className="relative w-full aspect-[14/9] xl:aspect-[16/10] bg-white rounded-[4.5rem] shadow-3xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                {isCameraActive ? (
                                    <div className="w-full h-full relative">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                                        <div className="absolute inset-x-0 bottom-12 flex justify-center">
                                            <button
                                                onClick={captureImage}
                                                className="w-24 h-24 bg-white rounded-full border-[10px] border-indigo-600/20 flex items-center justify-center shadow-3xl hover:scale-110 active:scale-95 transition-all"
                                            >
                                                <div className="w-14 h-14 bg-indigo-600 rounded-full animate-pulse"></div>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {processedImage && compareMode ? (
                                            <div className="w-full h-full flex">
                                                <div className="w-1/2 h-full border-r border-slate-100 relative overflow-hidden bg-slate-900 flex items-center justify-center">
                                                    <img src={image} className="max-w-full max-h-full object-contain opacity-50" alt="Before" />
                                                    <span className="absolute top-8 left-8 text-[10px] font-black uppercase bg-slate-100 px-3 py-1 rounded text-slate-600">Subject A (Raw)</span>
                                                </div>
                                                <div className="w-1/2 h-full relative overflow-hidden bg-slate-900 flex items-center justify-center">
                                                    <img src={processedImage} className="max-w-full max-h-full object-contain" alt="After" />
                                                    <span className="absolute top-8 right-8 text-[10px] font-black uppercase bg-indigo-600 px-3 py-1 rounded text-white">Rendered Pro</span>
                                                </div>
                                            </div>
                                        ) : processedImage ? (
                                            <img src={processedImage} className="max-w-full max-h-full object-contain animate-reveal" alt="Preview" />
                                        ) : image ? (
                                            <img src={image} className="max-w-full max-h-full object-contain" alt="Base" />
                                        ) : (
                                            <div className="text-center space-y-8 max-w-sm px-10">
                                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center text-indigo-500 text-4xl shadow-md border border-slate-100">
                                                    <FaMagic />
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-slate-900 font-black uppercase tracking-[0.4em] text-xs">Awaiting Morphological Input</p>
                                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Studio is currently idle. Connect your live feed or upload a subject profile to initialize AR mapping.</p>
                                                </div>
                                            </div>
                                        )}

                                        {renderHUD()}

                                        {loading && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
                                                <div className="w-16 h-16 border-[6px] border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                                                <div className="text-center space-y-2">
                                                    <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] animate-pulse">Neural Pathing...</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-Layer Composite Render in Progress</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute bottom-10 right-10 flex gap-4">
                                            <button
                                                onClick={() => setCompareMode(!compareMode)}
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${compareMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/80 backdrop-blur-md border-slate-200 text-slate-400 hover:text-slate-600 shadow-lg'}`}
                                                title="Compare View"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => { setProcessedImage(null); setCompareMode(false); }}
                                                className="w-14 h-14 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-lg transition-all"
                                                title="Reset Studio"
                                            >
                                                <FaSyncAlt />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* STATUS BAR */}
                        <div className="mt-8 px-10 py-5 bg-white border border-slate-200 shadow-xl rounded-3xl flex gap-10 items-center overflow-x-auto w-full">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Face Mesh: Active</span>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Landmarks: 468 Cached</span>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">VRAM: Optimized</span>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            <canvas ref={canvasRef} className="hidden" />

            <style>{`
                .mirror { transform: scaleX(-1); }
                @keyframes reveal { from { opacity: 0; filter: blur(20px); transform: scale(0.95); } to { opacity: 1; filter: blur(0); transform: scale(1); } }
                .animate-reveal { animation: reveal 0.8s cubic-bezier(0.23, 1, 0.32, 1); }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #6366f1;
                    box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
                    cursor: pointer;
                    border: 2px solid white;
                }
            `}</style>
        </div>
    );
};

export default VirtualStudio;
