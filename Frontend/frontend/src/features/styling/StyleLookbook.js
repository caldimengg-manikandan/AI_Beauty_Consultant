import React, { useState, useEffect } from 'react';
import { FaPalette, FaGem, FaTshirt, FaShoppingBag, FaMagic, FaCheckCircle, FaStar, FaLeaf, FaSpa, FaHeart, FaDownload } from 'react-icons/fa';
import { getHistory } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { id: 'palette',   icon: <FaPalette />,    label: 'Color Palette'   },
    { id: 'clothing',  icon: <FaTshirt />,     label: 'Wardrobe Guide'  },
    { id: 'jewelry',   icon: <FaGem />,        label: 'Jewelry & Metals'},
    { id: 'makeup',    icon: <FaSpa />,        label: 'Makeup Palette'  },
    { id: 'hair',      icon: <FaLeaf />,       label: 'Hair & Nails'    },
    { id: 'shop',      icon: <FaShoppingBag />,label: 'Shop the Look'   },
];

const StyleLookbook = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('palette');
    const [savedPalette, setSavedPalette] = useState(false);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const history = await getHistory();
                if (history && history.length > 0) {
                    setAnalysis(history[0]);
                }
            } catch (err) {
                console.error("Failed to fetch analysis for lookbook", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatest();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
            <div className="space-y-4 text-center">
                <div className="w-14 h-14 border-[5px] border-rose-100 border-t-rose-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] animate-pulse">Generating Your Lookbook</p>
            </div>
        </div>
    );



    // Use defaults if no analysis available so the lookbook always renders
    const season    = analysis?.season     || 'Winter';
    const skin_tone = analysis?.skin_tone  || 'Medium';
    const undertone = analysis?.undertone  || 'Cool';
    const eye_color = analysis?.eye_color  || 'Brown';
    const face_shape = analysis?.face_shape || 'Oval';
    const isDefault = !analysis;

    return (
        <div className="min-h-screen bg-[#fafaf9] p-6 lg:p-12 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* BANNER: prompt analysis if using defaults */}
                {isDefault && (
                    <div className="bg-rose-50 border border-rose-200 rounded-3xl px-8 py-5 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                                <FaMagic />
                            </div>
                            <div>
                                <p className="text-xs font-black text-rose-700 uppercase tracking-widest">Sample Lookbook — Winter Profile</p>
                                <p className="text-[11px] text-rose-500 font-medium">Do a Face Analysis to get your personalised seasonal lookbook.</p>
                            </div>
                        </div>
                        <a href="/dashboard/analyze" className="shrink-0 px-6 py-2.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all">
                            Analyse Now
                        </a>
                    </div>
                )}

                <header className="relative bg-slate-900 rounded-[4rem] p-12 md:p-16 overflow-hidden shadow-2xl">
                    {/* Background Blobs */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                        {/* Season color accent strip */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${getSeasonGradient(season)}`} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full uppercase tracking-[0.25em] shadow-lg shadow-rose-900/30">
                                    AI Seasonal Profile
                                </span>
                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.25em] flex items-center gap-2">
                                    <FaMagic className="text-rose-400 animate-pulse" /> Master Stylist Grade
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none italic uppercase">
                                Your <span className="text-rose-500">{season || 'Custom'}</span><br />Lookbook
                            </h1>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <MetaBadge label="Undertone" value={undertone} />
                                <MetaBadge label="Skin Tone" value={skin_tone} />
                                <MetaBadge label="Eye Color" value={eye_color} />
                                <MetaBadge label="Face Shape" value={face_shape} />
                            </div>
                        </div>

                        {/* Season Trait Cards */}
                        <div className="grid grid-cols-2 gap-3 shrink-0">
                            {getSeasonTraits(season).map((trait, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl text-center min-w-[100px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{trait.label}</p>
                                    <p className="text-xs font-black text-white uppercase">{trait.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* SIDEBAR TABS */}
                    <nav className="lg:col-span-3 space-y-2">
                        {TABS.map(tab => (
                            <TabButton
                                key={tab.id}
                                active={activeSection === tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                icon={tab.icon}
                                label={tab.label}
                            />
                        ))}

                        {/* Save button */}
                        <button
                            onClick={() => { setSavedPalette(true); setTimeout(() => setSavedPalette(false), 2500); }}
                            className="w-full mt-4 p-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-rose-200"
                        >
                            {savedPalette ? <><FaCheckCircle /> Saved!</> : <><FaHeart /> Save Lookbook</>}
                        </button>
                    </nav>

                    {/* CONTENT AREA */}
                    <main className="lg:col-span-9">
                        <AnimatePresence mode="wait">

                            {/* ── COLOR PALETTE ── */}
                            {activeSection === 'palette' && (
                                <motion.div key="palette" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                    <SectionHeading
                                        title="Scientific Color Harmony"
                                        description={`Based on your ${season || 'seasonal'} profile and skin's unique reflectance spectrum.`}
                                    />

                                    {/* Primary Palette */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                        {getPaletteColors(season).map((color, i) => (
                                            <ColorCard key={i} color={color.hex} name={color.name} subtitle={color.desc} />
                                        ))}
                                    </div>

                                    {/* Avoid Colors */}
                                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6 shadow-sm">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Colors to Avoid</p>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">The No-Fly Zone</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {getAvoidColors(season).map((c, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                                                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c.hex }} />
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{c.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-slate-400 italic font-medium">These shades clash with your undertone and can make your complexion appear dull.</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── WARDROBE ── */}
                            {activeSection === 'clothing' && (
                                <motion.div key="clothing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                    <SectionHeading title="Your Power Capsule Wardrobe" description="A curated guide to building a wardrobe that flatters your natural coloring." />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <StyleTip title="Best Base Colors" items={getBaseColors(season)} color="slate" />
                                        <StyleTip title="Best Accent Colors" items={getAccentColors(season)} color="rose" />
                                        <StyleTip title="Best Patterns" items={getPatterns(season)} color="indigo" />
                                        <StyleTip title="Fabrics to Try" items={getFabrics(season)} color="emerald" />
                                    </div>
                                    <div className="bg-slate-900 p-10 rounded-[3rem] flex items-start gap-8">
                                        <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl shrink-0">
                                            <FaTshirt />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Stylist Note</p>
                                            <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
                                                {undertone === 'Warm'
                                                    ? `As a ${season} type with warm undertones, lean into golden creams, rich browns, and earthy oranges. Avoid stark whites and icy blues — they'll wash you out.`
                                                    : `Your cool ${season} undertones shine in crisp whites, deep navy, and jewel tones like sapphire and amethyst. Steer clear of muddy yellows and warm terracottas.`}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── JEWELRY ── */}
                            {activeSection === 'jewelry' && (
                                <motion.div key="jewelry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                    <SectionHeading title="Gems & Precious Metals" description="Brilliance curated to complement your complexion and coloring." />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getJewelryRecommendations(undertone).map((item, i) => (
                                            <JewelryCard key={i} item={item} />
                                        ))}
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Gemstone Color Guide</p>
                                        <div className="flex flex-wrap gap-3">
                                            {getGemstones(season).map((gem, i) => (
                                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gem.color }} />
                                                    <span className="text-[10px] font-bold text-slate-600">{gem.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── MAKEUP ── */}
                            {activeSection === 'makeup' && (
                                <motion.div key="makeup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                    <SectionHeading title="Your Makeup Palette" description="Formula-matched shades for foundation, blush, lips and eyes." />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getMakeupPalette(season, undertone).map((cat, i) => (
                                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat.category}</p>
                                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{cat.title}</h3>
                                                </div>
                                                <div className="flex gap-2">
                                                    {cat.shades.map((shade, j) => (
                                                        <div key={j} className="group flex flex-col items-center gap-1">
                                                            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform" style={{ backgroundColor: shade.hex }} />
                                                            <span className="text-[8px] font-bold text-slate-400 text-center">{shade.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed">{cat.tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-8 rounded-[2.5rem] border border-rose-100">
                                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">Pro Tip</p>
                                        <p className="text-sm text-rose-700 font-medium italic leading-relaxed">
                                            {season === 'Winter' ? 'Bold lips paired with minimal eye makeup creates the dramatic contrast that Winter complexions carry so elegantly.' :
                                             season === 'Summer' ? 'Stick to soft, blended looks — heavy pigment can overpower your naturally delicate Summer coloring.' :
                                             season === 'Autumn' ? 'Warm, terracotta-toned blushes and bronzers are your secret weapon. Skip shimmer in favour of earthy mattes.' :
                                             'Peachy-pink tones illuminate your Spring radiance. Light shimmer on the high points of your face will look natural and dewy.'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── HAIR & NAILS ── */}
                            {activeSection === 'hair' && (
                                <motion.div key="hair" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                    <SectionHeading title="Hair & Nail Guide" description="Color suggestions that harmonize with your seasonal profile." />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Hair Coloring</p>
                                                <h3 className="text-sm font-black text-slate-900 uppercase">Best Hair Shades</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {getHairColors(season).map((h, i) => (
                                                    <div key={i} className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-xl border-2 border-white shadow-md shrink-0" style={{ backgroundColor: h.hex }} />
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-800 uppercase">{h.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-medium">{h.note}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nail Colors</p>
                                                <h3 className="text-sm font-black text-slate-900 uppercase">Best Nail Shades</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {getNailColors(season).map((n, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-1.5">
                                                        <div className="w-10 h-14 rounded-b-full rounded-t-lg border-2 border-white shadow-md" style={{ backgroundColor: n.hex }} />
                                                        <span className="text-[8px] font-bold text-slate-400 text-center w-12">{n.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 bg-slate-900 p-10 rounded-[3rem] space-y-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hair Highlights to Avoid</p>
                                            <div className="flex flex-wrap gap-3">
                                                {getAvoidHairColors(season).map((h, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: h.hex }} />
                                                        <span className="text-[10px] font-bold text-slate-300">{h.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── SHOP ── */}
                            {activeSection === 'shop' && (
                                <motion.div key="shop" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                    <SectionHeading title="Curated Seasonal Essentials" description={`Products handpicked for your ${season || 'custom'} color profile.`} />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {getShopItems(season, undertone).map((item, i) => (
                                            <ShopItem key={i} {...item} />
                                        ))}
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex items-center gap-6">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 text-xl shrink-0">
                                            <FaShoppingBag />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">AI Shopping Assistant</p>
                                            <p className="text-xs text-indigo-600 font-medium leading-relaxed">
                                                These products are curated based on your seasonal analysis. Look for the shade range that matches your undertone when shopping.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </main>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
            `}</style>
        </div>
    );
};

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

const MetaBadge = ({ label, value }) => (
    <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 rounded-2xl">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-[11px] font-black text-white uppercase">{value || '—'}</p>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full px-6 py-4 rounded-[1.5rem] border-2 transition-all flex items-center gap-4 text-left ${active
            ? 'bg-white border-rose-400 shadow-lg shadow-rose-100 text-slate-900'
            : 'bg-transparent border-transparent text-slate-400 hover:text-slate-700 hover:bg-white/50'}`}
    >
        <div className={`text-base shrink-0 ${active ? 'text-rose-500' : ''}`}>{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const SectionHeading = ({ title, description }) => (
    <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{title}</h2>
        <p className="text-sm text-slate-400 font-medium">{description}</p>
    </div>
);

const ColorCard = ({ color, name, subtitle }) => (
    <div className="group space-y-3">
        <div className="aspect-[3/4] rounded-[2.5rem] shadow-lg group-hover:scale-[1.03] transition-transform duration-300 border-4 border-white/60" style={{ backgroundColor: color }} />
        <div className="px-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">{name}</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">{subtitle}</p>
            <p className="text-[8px] font-mono text-slate-300 mt-0.5">{color}</p>
        </div>
    </div>
);

const StyleTip = ({ title, items, color }) => {
    const accent = { rose: 'bg-rose-500', slate: 'bg-slate-900', indigo: 'bg-indigo-500', emerald: 'bg-emerald-500' };
    const chip = { rose: 'bg-rose-50 text-rose-700 border-rose-100', slate: 'bg-slate-50 text-slate-700 border-slate-100', indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${accent[color]}`} /> {title}
            </h3>
            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${chip[color]}`}>{item}</span>
                ))}
            </div>
        </div>
    );
};

const JewelryCard = ({ item }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl border-4 border-white shadow-lg" style={{ backgroundColor: item.bg, color: item.fg }}>
            <FaGem />
        </div>
        <div>
            <h3 className="text-lg font-black text-slate-900 uppercase italic mb-1">{item.name}</h3>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${item.recommended ? 'text-emerald-500' : 'text-slate-300'}`}>
                {item.recommended ? 'Highly Recommended' : 'Use Sparingly'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
        </div>
    </div>
);

const ShopItem = ({ name, brand, price, color, category }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
        <div className="aspect-square rounded-[2rem] mb-5 flex items-center justify-center bg-slate-50 relative overflow-hidden">
            <div className="w-20 h-20 rounded-2xl shadow-xl" style={{ backgroundColor: color }} />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all" />
        </div>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{brand} · {category}</p>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{name}</h4>
        <p className="text-sm font-black text-rose-500 mt-2">{price}</p>
        <button className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-100">
            View Product
        </button>
    </div>
);

// ─── DATA HELPERS ─────────────────────────────────────────────────────────────

const getSeasonGradient = (s) => ({
    Winter: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500',
    Summer: 'bg-gradient-to-r from-pink-300 via-rose-300 to-lavender-300',
    Autumn: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600',
    Spring: 'bg-gradient-to-r from-yellow-400 via-orange-300 to-pink-400',
}[s] || 'bg-gradient-to-r from-rose-400 to-indigo-500');

const getSeasonTraits = (s) => ({
    Winter: [{ label: 'Contrast', value: 'High' }, { label: 'Saturation', value: 'Deep' }, { label: 'Value', value: 'Cool Light' }, { label: 'Best Vibe', value: 'Dramatic' }],
    Summer: [{ label: 'Contrast', value: 'Low–Med' }, { label: 'Saturation', value: 'Muted' }, { label: 'Value', value: 'Cool Light' }, { label: 'Best Vibe', value: 'Soft & Chic' }],
    Autumn: [{ label: 'Contrast', value: 'Medium' }, { label: 'Saturation', value: 'Rich' }, { label: 'Value', value: 'Warm Dark' }, { label: 'Best Vibe', value: 'Earthy' }],
    Spring: [{ label: 'Contrast', value: 'Low' }, { label: 'Saturation', value: 'Bright' }, { label: 'Value', value: 'Warm Light' }, { label: 'Best Vibe', value: 'Fresh & Fun' }],
}[s] || [{ label: 'Profile', value: 'Custom' }, { label: 'Style', value: 'Unique' }, { label: 'Vibe', value: 'Versatile' }, { label: 'Tone', value: 'Balanced' }]);

const getPaletteColors = (s) => ({
    Winter: [{ name: 'Midnight', hex: '#0F172A', desc: 'True Base' }, { name: 'Royal Blue', hex: '#1D4ED8', desc: 'Primary' }, { name: 'Crimson', hex: '#B91C1C', desc: 'Accent' }, { name: 'Arctic White', hex: '#F1F5F9', desc: 'Light' }, { name: 'Emerald', hex: '#065F46', desc: 'Rich' }, { name: 'Magenta', hex: '#9D174D', desc: 'Bold' }, { name: 'Cobalt', hex: '#1E40AF', desc: 'Cool' }, { name: 'Onyx', hex: '#1C1917', desc: 'Deep' }],
    Summer: [{ name: 'Dusty Rose', hex: '#FB7185', desc: 'Accent' }, { name: 'Powder Blue', hex: '#7DD3FC', desc: 'Primary' }, { name: 'Lavender', hex: '#DDD6FE', desc: 'Soft' }, { name: 'Mist', hex: '#E2E8F0', desc: 'Neutral' }, { name: 'Mauve', hex: '#C4B5FD', desc: 'Cool' }, { name: 'Sage', hex: '#86EFAC', desc: 'Muted' }, { name: 'Periwinkle', hex: '#818CF8', desc: 'Dreamy' }, { name: 'Blush', hex: '#FBCFE8', desc: 'Delicate' }],
    Autumn: [{ name: 'Rust', hex: '#9A3412', desc: 'Primary' }, { name: 'Olive', hex: '#3F6212', desc: 'Core' }, { name: 'Mustard', hex: '#D97706', desc: 'Accent' }, { name: 'Cream', hex: '#FFFBEB', desc: 'Base' }, { name: 'Terracotta', hex: '#C2410C', desc: 'Warm' }, { name: 'Forest', hex: '#14532D', desc: 'Deep' }, { name: 'Copper', hex: '#B45309', desc: 'Rich' }, { name: 'Camel', hex: '#D4A843', desc: 'Neutral' }],
    Spring: [{ name: 'Peach', hex: '#FB923C', desc: 'Primary' }, { name: 'Coral', hex: '#F43F5E', desc: 'Accent' }, { name: 'Sunny', hex: '#FDE047', desc: 'Bright' }, { name: 'Ivory', hex: '#FFFBEB', desc: 'Base' }, { name: 'Mint', hex: '#6EE7B7', desc: 'Fresh' }, { name: 'Sky', hex: '#38BDF8', desc: 'Clean' }, { name: 'Flamingo', hex: '#F9A8D4', desc: 'Soft' }, { name: 'Butter', hex: '#FEF08A', desc: 'Warm' }],
}[s] || getPaletteColors('Winter'));

const getAvoidColors = (s) => ({
    Winter: [{ name: 'Beige', hex: '#D4B483' }, { name: 'Mustard', hex: '#CA8A04' }, { name: 'Terracotta', hex: '#C2410C' }, { name: 'Warm Brown', hex: '#92400E' }],
    Summer: [{ name: 'Black', hex: '#0F172A' }, { name: 'Orange', hex: '#F97316' }, { name: 'Mustard', hex: '#CA8A04' }, { name: 'Brick Red', hex: '#B91C1C' }],
    Autumn: [{ name: 'Hot Pink', hex: '#DB2777' }, { name: 'Icy Blue', hex: '#BAE6FD' }, { name: 'Pure White', hex: '#FFFFFF' }, { name: 'Electric Blue', hex: '#1D4ED8' }],
    Spring: [{ name: 'Black', hex: '#0F172A' }, { name: 'Burgundy', hex: '#881337' }, { name: 'Cool Grey', hex: '#6B7280' }, { name: 'Navy', hex: '#1E3A5F' }],
}[s] || []);

const getBaseColors = (s) => ({ Winter: ['Charcoal', 'Navy', 'Pure White', 'Icy Grey'], Summer: ['Soft Navy', 'Muted Grey', 'Off-White', 'Dove Blue'], Autumn: ['Camel', 'Olive', 'Espresso', 'Terracotta'], Spring: ['Golden Beige', 'Warm Sand', 'Ivory', 'Peach'] }[s] || []);
const getAccentColors = (s) => ({ Winter: ['Ruby Red', 'Emerald', 'Electric Blue', 'Hot Pink'], Summer: ['Pastel Pink', 'Soft Mint', 'Lavender', 'Periwinkle'], Autumn: ['Burnt Orange', 'Deep Forest', 'Mustard', 'Aubergine'], Spring: ['Peach', 'Salmon', 'Coral', 'Bright Yellow'] }[s] || []);
const getPatterns = (s) => ({ Winter: ['Bold Geometric', 'High Contrast Stripes', 'Abstract Print', 'Color Block'], Summer: ['Delicate Florals', 'Watercolour', 'Tonal Paisley', 'Soft Plaid'], Autumn: ['Tartan', 'Animal Print', 'Earthy Paisley', 'Vintage Floral'], Spring: ['Small Florals', 'Polka Dots', 'Pastel Gingham', 'Ditsy Print'] }[s] || []);
const getFabrics = (s) => ({ Winter: ['Silk', 'Velvet', 'Cashmere', 'Faux Leather'], Summer: ['Chiffon', 'Linen', 'Soft Cotton', 'Jersey'], Autumn: ['Wool', 'Suede', 'Corduroy', 'Knit'], Spring: ['Cotton', 'Lace', 'Light Denim', 'Rayon'] }[s] || []);

const getJewelryRecommendations = (undertone) => [
    { name: 'Gold & Warm Metals', bg: '#FEF3C7', fg: '#D97706', recommended: undertone === 'Warm', desc: 'Yellow gold, rose gold, and bronze complement warm undertones beautifully by adding a luminous glow.' },
    { name: 'Silver & Platinum', bg: '#F1F5F9', fg: '#64748B', recommended: undertone === 'Cool', desc: 'Sterling silver and white gold create a crisp contrast that flatters cool undertones with elegance.' },
    { name: 'Copper & Bronze', bg: '#FEF3C7', fg: '#B45309', recommended: undertone === 'Warm', desc: 'Earthy metals add depth and warmth, ideal for Autumn and warm Spring types.' },
    { name: 'Oxidised & Dark', bg: '#1C1917', fg: '#A8A29E', recommended: undertone === 'Cool', desc: 'Gunmetal and blackened silver provide dramatic contrast that suits Winter cool tones perfectly.' },
];

const getGemstones = (s) => ({
    Winter: [{ name: 'Sapphire', color: '#1D4ED8' }, { name: 'Ruby', color: '#B91C1C' }, { name: 'Diamond', color: '#F8FAFC' }, { name: 'Amethyst', color: '#7C3AED' }, { name: 'Onyx', color: '#1C1917' }],
    Summer: [{ name: 'Aquamarine', color: '#7DD3FC' }, { name: 'Rose Quartz', color: '#FBCFE8' }, { name: 'Lavender Jade', color: '#DDD6FE' }, { name: 'Moonstone', color: '#E2E8F0' }, { name: 'Pearl', color: '#FEFCE8' }],
    Autumn: [{ name: 'Amber', color: '#D97706' }, { name: 'Tiger Eye', color: '#B45309' }, { name: 'Garnet', color: '#9F1239' }, { name: 'Citrine', color: '#EAB308' }, { name: 'Malachite', color: '#166534' }],
    Spring: [{ name: 'Peridot', color: '#84CC16' }, { name: 'Coral', color: '#FB923C' }, { name: 'Tourmaline', color: '#F43F5E' }, { name: 'Emerald', color: '#15803D' }, { name: 'Topaz', color: '#FDE68A' }],
}[s] || []);

const getMakeupPalette = (s, undertone) => [
    {
        category: 'Foundation & Concealer',
        title: 'Your Base Formula',
        shades: s === 'Winter' ? [{ name: 'C10', hex: '#F3E0CC' }, { name: 'C20', hex: '#E8CBA8' }, { name: 'C30', hex: '#D4A87A' }] :
                s === 'Summer' ? [{ name: 'N10', hex: '#F5E6D8' }, { name: 'N20', hex: '#EDD5B9' }, { name: 'N30', hex: '#DFC09A' }] :
                s === 'Autumn' ? [{ name: 'W10', hex: '#F0CDAA' }, { name: 'W20', hex: '#E2B585' }, { name: 'W30', hex: '#C89060' }] :
                [{ name: 'P10', hex: '#FDEBD6' }, { name: 'P20', hex: '#F3D5B5' }, { name: 'P30', hex: '#E6BF95' }],
        tip: 'Match your foundation to your neck, not your face. Test in natural daylight for the truest match.'
    },
    {
        category: 'Blush',
        title: 'Cheek Colours',
        shades: undertone === 'Warm' ? [{ name: 'Peach', hex: '#FDBA74' }, { name: 'Coral', hex: '#F97316' }, { name: 'Terra', hex: '#C2410C' }] :
                                        [{ name: 'Rose', hex: '#FDA4AF' }, { name: 'Mauve', hex: '#E879A0' }, { name: 'Berry', hex: '#9D174D' }],
        tip: 'Smile and apply to the apple of your cheek, blending upward toward the temple for a natural flush.'
    },
    {
        category: 'Lip Color',
        title: 'Lip Palette',
        shades: s === 'Winter' ? [{ name: 'Red', hex: '#B91C1C' }, { name: 'Berry', hex: '#881337' }, { name: 'Plum', hex: '#6B21A8' }] :
                s === 'Summer' ? [{ name: 'Pink', hex: '#FB7185' }, { name: 'Nude Rose', hex: '#F43F5E' }, { name: 'Mauve', hex: '#9D174D' }] :
                s === 'Autumn' ? [{ name: 'Brick', hex: '#C2410C' }, { name: 'Caramel', hex: '#B45309' }, { name: 'Rust', hex: '#9A3412' }] :
                [{ name: 'Peach', hex: '#FB923C' }, { name: 'Coral', hex: '#F43F5E' }, { name: 'Salmon', hex: '#FCA5A5' }],
        tip: 'Your Skin tone works beautifully with both bold and nude formulas — the key is finish. Matte for drama, gloss for daywear.'
    },
    {
        category: 'Eye Shadow',
        title: 'Eye Palette',
        shades: s === 'Winter' ? [{ name: 'Smoke', hex: '#374151' }, { name: 'Silver', hex: '#CBD5E1' }, { name: 'Slate', hex: '#1E293B' }, { name: 'Navy', hex: '#1E3A5F' }] :
                s === 'Summer' ? [{ name: 'Lilac', hex: '#DDD6FE' }, { name: 'Peach', hex: '#FDBA74' }, { name: 'Pink', hex: '#FBCFE8' }, { name: 'Taupe', hex: '#A8947A' }] :
                s === 'Autumn' ? [{ name: 'Bronze', hex: '#B45309' }, { name: 'Forest', hex: '#14532D' }, { name: 'Rust', hex: '#9A3412' }, { name: 'Gold', hex: '#D97706' }] :
                [{ name: 'Peach', hex: '#FB923C' }, { name: 'Gold', hex: '#FDE047' }, { name: 'Champagne', hex: '#FEF9C3' }, { name: 'Coral', hex: '#FCA5A5' }],
        tip: 'Use the lightest shade on the brow bone, mid-tone on the lid, and the deepest shade in the crease for natural dimension.'
    }
];

const getHairColors = (s) => ({
    Winter: [{ name: 'Jet Black', hex: '#0F172A', note: 'Striking high-contrast base' }, { name: 'Ash Brown', hex: '#6B7280', note: 'Cool-toned depth' }, { name: 'Cool Espresso', hex: '#292524', note: 'Rich, dark intensity' }],
    Summer: [{ name: 'Ash Blonde', hex: '#D4C5A9', note: 'Muted, cool blonde' }, { name: 'Dove Grey', hex: '#9CA3AF', note: 'Sophisticated silver' }, { name: 'Sandy Brown', hex: '#B5976B', note: 'Natural soft warmth' }],
    Autumn: [{ name: 'Auburn', hex: '#9A3412', note: 'Rich warm red-brown' }, { name: 'Golden Brown', hex: '#B45309', note: 'Honey warmth' }, { name: 'Copper', hex: '#C2410C', note: 'Vibrant earthy red' }],
    Spring: [{ name: 'Golden Blonde', hex: '#D4A847', note: 'Warm, sunny golden' }, { name: 'Strawberry Blonde', hex: '#F97316', note: 'Peachy-gold warmth' }, { name: 'Light Caramel', hex: '#D4A843', note: 'Delicate warm brown' }],
}[s] || []);

const getNailColors = (s) => ({
    Winter: [{ name: 'Classic Red', hex: '#B91C1C' }, { name: 'Deep Berry', hex: '#7C3AED' }, { name: 'Onyx', hex: '#0F172A' }, { name: 'Icy Pink', hex: '#FCE7F3' }],
    Summer: [{ name: 'Blush Pink', hex: '#FBCFE8' }, { name: 'Lavender', hex: '#DDD6FE' }, { name: 'Soft Rose', hex: '#FDA4AF' }, { name: 'Petal', hex: '#FDE8DC' }],
    Autumn: [{ name: 'Burnt Orange', hex: '#C2410C' }, { name: 'Rust', hex: '#9A3412' }, { name: 'Deep Olive', hex: '#3F6212' }, { name: 'Cognac', hex: '#B45309' }],
    Spring: [{ name: 'Coral', hex: '#FB923C' }, { name: 'Peach', hex: '#FDBA74' }, { name: 'Mint', hex: '#6EE7B7' }, { name: 'Lemon', hex: '#FEF08A' }],
}[s] || []);

const getAvoidHairColors = (s) => ({
    Winter: [{ name: 'Warm Copper', hex: '#C2410C' }, { name: 'Golden Honey', hex: '#D97706' }, { name: 'Caramel', hex: '#D4A843' }],
    Summer: [{ name: 'Warm Gold', hex: '#EAB308' }, { name: 'Copper Red', hex: '#DC2626' }, { name: 'Ash Black', hex: '#0F172A' }],
    Autumn: [{ name: 'Ash Blonde', hex: '#D1D5DB' }, { name: 'Platinum', hex: '#F3F4F6' }, { name: 'Jet Black', hex: '#0F172A' }],
    Spring: [{ name: 'Cool Ash', hex: '#9CA3AF' }, { name: 'Jet Black', hex: '#0F172A' }, { name: 'Plum', hex: '#6B21A8' }],
}[s] || []);

const getShopItems = (s, undertone) => [
    { name: 'Velvet Lip Stain', brand: 'Sculpt Beauty', price: '$28', color: s === 'Winter' ? '#B91C1C' : s === 'Summer' ? '#FB7185' : s === 'Autumn' ? '#C2410C' : '#FB923C', category: 'Lips' },
    { name: 'Silk Blouse', brand: 'EditFor', price: '$95', color: undertone === 'Warm' ? '#D97706' : '#1D4ED8', category: 'Apparel' },
    { name: 'Precision Blush', brand: 'Aura Lab', price: '$34', color: undertone === 'Warm' ? '#F97316' : '#FDA4AF', category: 'Blush' },
    { name: 'Cashmere Scarf', brand: 'Lumière', price: '$120', color: s === 'Winter' ? '#0F172A' : s === 'Summer' ? '#DDD6FE' : s === 'Autumn' ? '#9A3412' : '#FDE047', category: 'Accessories' },
    { name: 'Foundation Serum', brand: 'Dermatech', price: '$54', color: undertone === 'Warm' ? '#E2B585' : '#EDD5B9', category: 'Foundation' },
    { name: 'Statement Earrings', brand: 'Mercer Atelier', price: '$68', color: undertone === 'Warm' ? '#D97706' : '#94A3B8', category: 'Jewelry' },
];

export default StyleLookbook;
