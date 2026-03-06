import React, { useState } from 'react';
import { FaFemale, FaMale, FaSpa, FaLeaf, FaGem, FaTint, FaCalendarAlt, FaClock, FaUser, FaTimes, FaCheckCircle, FaExclamationCircle, FaStar, FaFire, FaFlask, FaHeart, FaMagic, FaSnowflake, FaSun, FaWind, FaShieldAlt, FaRegClock } from 'react-icons/fa';
import { bookAppointment } from '../../services/appointmentApi';
import { motion, AnimatePresence } from 'framer-motion';

// ── SERVICE DATA ──────────────────────────────────────────────────────────────
const SERVICE_DATA = {
    Female: {
        "✨ Signature Combos": [
            { name: "Total Radiance Package", price: "₹2,999", mrp: "₹3,499", desc: "Pearl Facial + Hair Spa + Threading. Glow from head to toe.", duration: "3h", rating: 4.9, badge: "Best Seller", hot: true },
            { name: "Bridal Glow Essentials", price: "₹5,500", mrp: "₹6,500", desc: "Gold Facial + Body Polishing + Premium Mani-Pedi + HD Brow.", duration: "4h", rating: 4.9, badge: "Bridal", hot: true },
            { name: "Glass Skin Ritual", price: "₹4,200", mrp: "₹4,800", desc: "Double Cleanse + Hydra Facial + Sheet Mask + LED Therapy.", duration: "2.5h", rating: 4.8, badge: "Premium" },
            { name: "Weekend Glow Escape", price: "₹3,500", mrp: "₹4,200", desc: "Aromatic Massage + Brightening Facial + Scalp Treatment + Mani.", duration: "3.5h", rating: 4.7, badge: "NEW" },
            { name: "Anti-Aging Power Hour", price: "₹6,800", mrp: "₹8,000", desc: "Microneedling + Collagen Infusion + Eye Therapy + Firming Mask.", duration: "2h", rating: 5.0, badge: "Clinical", hot: true },
            { name: "Monsoon Skin Shield", price: "₹2,800", mrp: "₹3,200", desc: "Deep Cleanse + Anti-Fungal Pedi + Scalp Detox + Nourishing Peel.", duration: "2h", rating: 4.6, badge: "Seasonal" },
        ],
        "🌟 Glow & Brightening": [
            { name: "Oxygen Facial", price: "₹1,500", mrp: "₹1,800", desc: "Pure oxygen infusion for an instant red-carpet radiance.", duration: "60 min", rating: 4.8 },
            { name: "Pearl Whitening Facial", price: "₹2,200", mrp: "₹2,500", desc: "Marine pearl extracts polish skin for a porcelain finish.", duration: "75 min", rating: 4.7 },
            { name: "24K Gold Facial", price: "₹3,200", mrp: "₹3,800", desc: "Luxury anti-aging gold leaf treatment for visible elasticity.", duration: "90 min", rating: 4.9, badge: "Luxury", hot: true },
            { name: "Vitamin C Radiance Boost", price: "₹1,800", mrp: "₹2,100", desc: "High-potency antioxidant cocktail for sun-damaged, dull skin.", duration: "60 min", rating: 4.6 },
            { name: "Kojic Brightening Peel", price: "₹2,500", mrp: "₹2,900", desc: "Kojic acid + Arbutin peel reduces dark spots by 40% in 4 sessions.", duration: "45 min", rating: 4.8, badge: "Popular" },
            { name: "Glutathione Glow Drip", price: "₹4,500", mrp: "₹5,200", desc: "IV-strength topical Glutathione + skin-brightening serum infusion.", duration: "80 min", rating: 4.9, badge: "Premium" },
            { name: "Pink Champagne Facial", price: "₹3,800", mrp: "₹4,500", desc: "Resveratrol + Pink Clay + AHA for luminous, wine-kissed radiance.", duration: "85 min", rating: 4.7, badge: "NEW" },
        ],
        "🌿 Acne & Detox": [
            { name: "Herbal Face Cleanup", price: "₹655", mrp: "₹800", desc: "Neem + Tulsi fast-acting cleanup targeting active breakouts.", duration: "45 min", rating: 4.5 },
            { name: "Advanced Acne Repair Facial", price: "₹1,800", mrp: "₹2,200", desc: "Clinical salicylic + BHA treatment for persistent acne.", duration: "60 min", rating: 4.7, badge: "Clinical" },
            { name: "Mattifying Deep Clean", price: "₹600", mrp: "₹750", desc: "Oil-absorbing clay mask, pore vacuuming, and toner application.", duration: "30 min", rating: 4.4 },
            { name: "Urban Defense Facial", price: "₹2,100", mrp: "₹2,500", desc: "Shields skin from pollutants and removes deep-seated grime.", duration: "75 min", rating: 4.6 },
            { name: "Mud Volcano Detox", price: "₹1,600", mrp: "₹1,900", desc: "Volcanic mud + activated charcoal fusion for heavy-duty detox.", duration: "60 min", rating: 4.7, badge: "Popular" },
            { name: "Probiotic Skin Reset", price: "₹2,800", mrp: "₹3,200", desc: "Balances skin microbiome for reduced redness and fewer breakouts.", duration: "70 min", rating: 4.8, badge: "NEW" },
        ],
        "💧 Hydration & Rejuvenation": [
            { name: "Honey & Milk Hydration", price: "₹1,600", mrp: "₹1,900", desc: "Classical Ayurvedic hydration for silky, supple, plump skin.", duration: "60 min", rating: 4.7 },
            { name: "Choco-Divine Facial", price: "₹2,200", mrp: "₹2,600", desc: "Antioxidant-rich cocoa butter treatment for deep moisturisation.", duration: "75 min", rating: 4.8 },
            { name: "Collagen Infusion Boost", price: "₹3,500", mrp: "₹4,200", desc: "Marine collagen + peptide serum firms sagging, crepey skin.", duration: "90 min", rating: 4.9, badge: "Luxury", hot: true },
            { name: "Hyaluronic Deep Sea", price: "₹2,800", mrp: "₹3,300", desc: "Ultra-hydrating marine extract facial for dehydrated, tight skin.", duration: "80 min", rating: 4.7 },
            { name: "Cactus Moisture Lock", price: "₹2,400", mrp: "₹2,800", desc: "Prickly pear cactus ceramides seal moisture for 72-hour hydration.", duration: "65 min", rating: 4.6, badge: "NEW" },
            { name: "Aqua Peel With HydraFacial", price: "₹4,800", mrp: "₹5,500", desc: "Patented 4-step HydraFacial — cleanse, peel, extract, hydrate.", duration: "60 min", rating: 5.0, badge: "Best Seller", hot: true },
        ],
        "🔬 Clinical & Advanced": [
            { name: "Retinol Renewal Facial", price: "₹3,800", mrp: "₹4,500", desc: "Targeted retinoid experience for fine lines and enlarged pores.", duration: "75 min", rating: 4.9, badge: "Clinical" },
            { name: "Blue Light Protection", price: "₹1,400", mrp: "₹1,700", desc: "Neutralises digital screen damage and revives fatigue-stressed skin.", duration: "45 min", rating: 4.5 },
            { name: "Derma-Peel Expert", price: "₹2,500", mrp: "₹3,000", desc: "TCA + Mandelic peel for deep pigmentation, scars, and texture.", duration: "45 min", rating: 4.8, badge: "Clinical" },
            { name: "RF Skin Tightening", price: "₹5,500", mrp: "₹6,500", desc: "Radiofrequency therapy heats deep dermis to trigger collagen.", duration: "60 min", rating: 4.9, badge: "Premium", hot: true },
            { name: "LED Photon Therapy", price: "₹2,200", mrp: "₹2,600", desc: "Red + blue + near-IR light wavelengths for healing and rejuvenation.", duration: "30 min", rating: 4.7, badge: "Popular" },
            { name: "Microneedling Collagen Induction", price: "₹6,000", mrp: "₹7,200", desc: "Creates controlled micro-channels to maximise product absorption.", duration: "90 min", rating: 4.9, badge: "Clinical", hot: true },
        ],
        "💆 Body & Wellness": [
            { name: "Full Body Aromatherapy", price: "₹3,200", mrp: "₹3,800", desc: "Custom-blended essential oil massage for deep stress release.", duration: "90 min", rating: 4.9 },
            { name: "Swedish Relaxation Massage", price: "₹2,500", mrp: "₹2,900", desc: "Long, gliding strokes to ease muscle tension and improve circulation.", duration: "60 min", rating: 4.8, badge: "Popular" },
            { name: "Hot Stone Therapy", price: "₹3,800", mrp: "₹4,500", desc: "Warmed basalt stones melt away deep-seated back and shoulder stress.", duration: "75 min", rating: 4.9, badge: "Luxury", hot: true },
            { name: "Body Polishing Ritual", price: "₹2,800", mrp: "₹3,300", desc: "Sugar + coffee scrub exfoliation followed by shea butter wrap.", duration: "60 min", rating: 4.7 },
            { name: "Keratin Protect Hair Spa", price: "₹1,720", mrp: "₹2,000", desc: "Keratin-infused deep conditioning smooths frizz and adds shine.", duration: "45 min", rating: 4.6 },
            { name: "Foot Reflexology", price: "₹1,200", mrp: "₹1,500", desc: "Pressure-point therapy aligning organs through sole nerve-map.", duration: "45 min", rating: 4.8, badge: "Popular" },
        ],
        "💅 Nail & Hand Studio": [
            { name: "Gel Nail Art (Both Hands)", price: "₹800", mrp: "₹1,000", desc: "Long-lasting gel with custom nail art design, chip-free for 3 weeks.", duration: "60 min", rating: 4.8 },
            { name: "Ice Cream Manicure", price: "₹440", mrp: "₹550", desc: "Flavored fruit soak, sugar scrub, and paraffin dip for silky hands.", duration: "30 min", rating: 4.5 },
            { name: "Paraffin Pedicure", price: "₹795", mrp: "₹950", desc: "Deep heat paraffin treatment for cracked heels and dry cuticles.", duration: "45 min", rating: 4.6 },
            { name: "Japanese Nail Gel Extension", price: "₹2,200", mrp: "₹2,800", desc: "Nail extension with Japanese gel — ultra-thin, glossy, long wear.", duration: "90 min", rating: 4.9, badge: "Premium", hot: true },
            { name: "Luxury Spa Mani-Pedi Combo", price: "₹1,600", mrp: "₹2,000", desc: "Heated mitts, exfoliation, callus removal, and gel finish.", duration: "75 min", rating: 4.8, badge: "Best Seller" },
        ],
    },
    Male: {
        "🎩 Executive Combos": [
            { name: "The Gentleman's Detox", price: "₹999", mrp: "₹1,300", desc: "Haircut + Charcoal De-Tan + Beard Trim + Eyebrow Grooming.", duration: "1.5h", rating: 4.8, badge: "Best Seller", hot: true },
            { name: "Wedding Ready Groom", price: "₹4,500", mrp: "₹5,500", desc: "Gold Facial + Manicure + Pedicure + Hair Spa + Beard Styling.", duration: "4h", rating: 4.9, badge: "Bridal", hot: true },
            { name: "Boardroom Prep Package", price: "₹1,800", mrp: "₹2,200", desc: "Express Cleanup + Eyebrow Grooming + Relaxing Head Massage.", duration: "1.5h", rating: 4.7, badge: "Popular" },
            { name: "Weekend Warrior Reset", price: "₹2,800", mrp: "₹3,400", desc: "Sports Massage + De-Tan Facial + Hair Spa + Foot Reflexology.", duration: "3h", rating: 4.8, badge: "NEW" },
            { name: "Men's Skin Revival Combo", price: "₹3,500", mrp: "₹4,200", desc: "Microderm + Oxygen Facial + Scalp Revitalise + Beard Moisturise.", duration: "2.5h", rating: 4.9, badge: "Premium", hot: true },
        ],
        "🌑 Detox & Oil Control": [
            { name: "Herbal Face Cleanup", price: "₹655", mrp: "₹800", desc: "Antiseptic neem & tulsi treatment to clear active acne and oil.", duration: "45 min", rating: 4.5 },
            { name: "Charcoal De-Tan Facial", price: "₹500", mrp: "₹650", desc: "Activated charcoal mask dominates oil, tightens pores, lifts tan.", duration: "30 min", rating: 4.6 },
            { name: "Oil Control Deep Clean", price: "₹545", mrp: "₹700", desc: "High-suction pore vacuuming + clay mask for stubborn sebum.", duration: "30 min", rating: 4.4 },
            { name: "Volcanic Ash Detox", price: "₹1,200", mrp: "₹1,500", desc: "Intense volcanic mineral treatment for deep-seated blackheads.", duration: "45 min", rating: 4.7, badge: "Popular" },
            { name: "Mud Detox & Peel", price: "₹1,500", mrp: "₹1,800", desc: "White + Black Clay fusion peels away pollution and sweat residue.", duration: "60 min", rating: 4.7, badge: "NEW" },
            { name: "Probiotic Reset Cleanup", price: "₹1,800", mrp: "₹2,200", desc: "Microbiome-balancing gel reduces post-shave redness and flaking.", duration: "60 min", rating: 4.8, badge: "New" },
        ],
        "🏋️ Skin Recovery": [
            { name: "Sports Recovery Facial", price: "₹1,400", mrp: "₹1,700", desc: "Deep cooling + cryo-gel for skin exposed to heat, sun, and sweat.", duration: "60 min", rating: 4.7 },
            { name: "Sun Damage Repair", price: "₹1,600", mrp: "₹1,900", desc: "Reverses intense tanning and repairs UV-damaged surface cells.", duration: "60 min", rating: 4.8, badge: "Popular" },
            { name: "Anti-Fatigue Therapy", price: "₹1,100", mrp: "₹1,400", desc: "Restores glow in stressed, dull, sleep-deprived and tired skin.", duration: "45 min", rating: 4.6 },
            { name: "Post-Workout Skin Flush", price: "₹900", mrp: "₹1,100", desc: "Enzyme peel clears sweat pores + cooling green tea masque.", duration: "30 min", rating: 4.5 },
            { name: "Cryotherapy Cool Down", price: "₹2,800", mrp: "₹3,400", desc: "Cryo-facial minimises pores, reduces inflammation, adds firmness.", duration: "45 min", rating: 4.9, badge: "Premium", hot: true },
        ],
        "✂️ Grooming & Beard Studio": [
            { name: "Oxygen Skin Facial", price: "₹1,500", mrp: "₹1,800", desc: "Pure oxygen infusion brightens dull skin in 60 minutes.", duration: "60 min", rating: 4.8 },
            { name: "Global Gold Facial", price: "₹3,000", mrp: "₹3,600", desc: "Premium gold-leaf anti-aging treatment for radiant skin.", duration: "90 min", rating: 4.9, badge: "Luxury" },
            { name: "Skin Lightening Cleanup", price: "₹730", mrp: "₹900", desc: "Kojic + Alpha Arbutin blend evens tone and reduces marks.", duration: "45 min", rating: 4.5 },
            { name: "Royal Beard Spa", price: "₹1,200", mrp: "₹1,500", desc: "Hot towel + argan oil conditioning + styling + beard moisturiser.", duration: "45 min", rating: 4.9, badge: "Best Seller", hot: true },
            { name: "Beard & Skin Therapy", price: "₹850", mrp: "₹1,050", desc: "Specialised care for under-beard skin to prevent itch and folliculitis.", duration: "30 min", rating: 4.7 },
            { name: "Classic Shave Ritual", price: "₹650", mrp: "₹800", desc: "Hot lather + straight-razor shave + cold towel + aftershave balm.", duration: "30 min", rating: 4.9, badge: "Popular" },
        ],
        "🔬 Clinical & Texture": [
            { name: "Anti-Dandruff Treatment", price: "₹1,210", mrp: "₹1,500", desc: "Clinical scalp analysis + medicated treatment to clear buildup.", duration: "45 min", rating: 4.6, badge: "Clinical" },
            { name: "Crystal Microdermabrasion", price: "₹2,500", mrp: "₹3,000", desc: "Diamond-tip resurfacing for deep acne scars and rough texture.", duration: "60 min", rating: 4.8, badge: "Clinical" },
            { name: "Digital Detox Facial", price: "₹1,200", mrp: "₹1,500", desc: "Blocks HEV blue-light skin damage from prolonged screen time.", duration: "45 min", rating: 4.5 },
            { name: "RF Skin Firming", price: "₹4,000", mrp: "₹5,000", desc: "Radiofrequency heat therapy deep in the dermis for jawline lift.", duration: "60 min", rating: 4.9, badge: "Premium", hot: true },
            { name: "LED Acne Phototherapy", price: "₹1,800", mrp: "₹2,200", desc: "Blue LED destroys P.acnes bacteria without irritation or downtime.", duration: "30 min", rating: 4.7 },
        ],
        "🤲 Body & Massage": [
            { name: "Deep Tissue Massage", price: "₹2,800", mrp: "₹3,400", desc: "Firm pressure targets muscle knots and chronic back tension.", duration: "60 min", rating: 4.9, badge: "Popular", hot: true },
            { name: "Thai Stretch Therapy", price: "₹3,200", mrp: "₹3,800", desc: "Passive yoga stretching + acupressure for full body flexibility.", duration: "90 min", rating: 4.8 },
            { name: "Hot Stone Shoulder & Back", price: "₹2,500", mrp: "₹3,000", desc: "Heated basalt stones melt desk-job stiffness in shoulders & spine.", duration: "60 min", rating: 4.9, badge: "Luxury" },
            { name: "Foot Reflexology", price: "₹1,200", mrp: "₹1,500", desc: "Pressure-point massage on soles for organ detox and energy flow.", duration: "45 min", rating: 4.8 },
            { name: "Men's Mani-Pedi Combo", price: "₹1,200", mrp: "₹1,500", desc: "Clean cut, buff, cuticle care, and callus removal for hands & feet.", duration: "60 min", rating: 4.6 },
        ],
    },
};

// ── CATEGORY ICONS ─────────────────────────────────────────────────────────
const CategoryIcon = ({ category }) => {
    const icons = {
        'Combo': <span className="text-2xl">⭐</span>,
        'Glow': <FaGem className="text-amber-400 text-xl" />,
        'Brightening': <FaSun className="text-amber-400 text-xl" />,
        'Acne': <FaLeaf className="text-emerald-500 text-xl" />,
        'Detox': <FaLeaf className="text-emerald-500 text-xl" />,
        'Hydration': <FaTint className="text-blue-400 text-xl" />,
        'Rejuvenation': <FaHeart className="text-rose-400 text-xl" />,
        'Clinical': <FaFlask className="text-indigo-500 text-xl" />,
        'Advanced': <FaShieldAlt className="text-indigo-500 text-xl" />,
        'Body': <FaWind className="text-teal-400 text-xl" />,
        'Wellness': <FaSpa className="text-teal-400 text-xl" />,
        'Nail': <span className="text-xl">💅</span>,
        'Hand': <span className="text-xl">✋</span>,
        'Grooming': <span className="text-xl">✂️</span>,
        'Beard': <span className="text-xl">🪒</span>,
        'Recovery': <FaFire className="text-orange-500 text-xl" />,
        'Massage': <FaHeart className="text-rose-400 text-xl" />,
    };
    for (const [key, icon] of Object.entries(icons)) {
        if (category.includes(key)) return icon;
    }
    return <FaSpa className="text-purple-500 text-xl" />;
};

const BADGE_STYLES = {
    'Best Seller': 'bg-amber-100 text-amber-700 border-amber-200',
    'Bridal':      'bg-rose-100 text-rose-700 border-rose-200',
    'Premium':     'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Luxury':      'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Clinical':    'bg-blue-100 text-blue-700 border-blue-200',
    'Popular':     'bg-teal-100 text-teal-700 border-teal-200',
    'NEW':         'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Seasonal':    'bg-orange-100 text-orange-700 border-orange-200',
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
const ServicesPage = () => {
    const [activeTab, setActiveTab] = useState("Female");
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedService, setSelectedService] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingRef, setBookingRef] = useState(null);
    const [bookingData, setBookingData] = useState({ name: '', date: '', time: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleBook = (category, service) => {
        setSelectedService({ ...service, category });
        setIsBookingModalOpen(true);
        setBookingRef(null);
        setError(null);
    };

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await bookAppointment({
                service_name: selectedService.name,
                customer_name: bookingData.name,
                appointment_date: bookingData.date,
                appointment_time: bookingData.time,
                category: selectedService.category,
                gender: activeTab,
            });
            setBookingRef(result.booking_ref);
            setTimeout(() => {
                setIsBookingModalOpen(false);
                setBookingData({ name: '', date: '', time: '' });
                setBookingRef(null);
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const categories = Object.keys(SERVICE_DATA[activeTab]);
    const allServices = Object.entries(SERVICE_DATA[activeTab]).flatMap(([cat, svcs]) => svcs.map(s => ({ ...s, _cat: cat })));

    const filteredData = activeCategory === 'all'
        ? Object.fromEntries(
            Object.entries(SERVICE_DATA[activeTab]).map(([cat, svcs]) => [
                cat,
                svcs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))
            ]).filter(([, svcs]) => svcs.length > 0)
        )
        : Object.fromEntries(
            Object.entries(SERVICE_DATA[activeTab])
                .filter(([cat]) => cat === activeCategory)
                .map(([cat, svcs]) => [
                    cat,
                    svcs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))
                ])
        );

    const totalServices = allServices.length;
    const hotCount = allServices.filter(s => s.hot).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-teal-50 pb-16">

            {/* ── HERO HEADER ── */}
            <div className="relative bg-slate-900 overflow-hidden mb-0">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 text-center">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] mb-3">GlowAI Beauty Studio</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic mb-4">
                        Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400">Spa Services</span>
                    </h1>
                    <p className="text-slate-400 text-base max-w-xl mx-auto font-medium mb-8">
                        Expertly curated treatments, clinical facials & relaxing therapies — all bookable in one place.
                    </p>

                    {/* Stats bar */}
                    <div className="flex justify-center gap-8 flex-wrap">
                        {[
                            { label: 'Services', value: totalServices + '+' },
                            { label: 'Hot Picks', value: hotCount },
                            { label: 'Avg. Rating', value: '4.8 ⭐' },
                            { label: 'Categories', value: categories.length },
                        ].map(stat => (
                            <div key={stat.label} className="text-center">
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── GENDER TOGGLE ── */}
            <div className="flex justify-center py-8 px-6">
                <div className="bg-white p-1.5 rounded-full shadow-xl border border-slate-100 flex gap-1">
                    {[
                        { id: 'Female', label: 'For Her', icon: '👩', grad: 'from-rose-500 to-purple-500' },
                        { id: 'Male', label: 'For Him', icon: '👨', grad: 'from-blue-600 to-teal-500' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setActiveCategory('all'); }}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-black transition-all duration-300 uppercase tracking-wide ${activeTab === tab.id
                                ? `bg-gradient-to-r ${tab.grad} text-white shadow-lg scale-105`
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 space-y-8">

                {/* ── SEARCH + FILTER BAR ── */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setActiveCategory('all')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                            All
                        </button>
                        {categories.map(cat => {
                            const label = cat.split(' ').slice(1).join(' ') || cat;
                            return (
                                <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? 'all' : cat)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeCategory === cat ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── SERVICES ── */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab + activeCategory}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-14">

                        {Object.entries(filteredData).map(([category, services]) => services.length === 0 ? null : (
                            <div key={category}>
                                {/* Category Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <CategoryIcon category={category} />
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{category.replace(/^[^\s]+\s/, '')}</h2>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{services.length} services</span>
                                    <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1" />
                                </div>

                                {/* Service Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {services.map((svc, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col"
                                        >
                                            {/* Hot banner */}
                                            {svc.hot && (
                                                <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-[0.2em] text-center py-1.5 flex items-center justify-center gap-1.5">
                                                    <FaFire className="text-yellow-200" /> Trending Hot Pick
                                                </div>
                                            )}

                                            <div className="p-6 flex flex-col flex-1 space-y-4">
                                                {/* Top: name + price */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <h4 className="font-black text-slate-900 text-base leading-snug group-hover:text-teal-600 transition-colors flex-1">
                                                        {svc.name}
                                                    </h4>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-lg font-black text-slate-900">{svc.price}</p>
                                                        {svc.mrp && svc.mrp !== svc.price && (
                                                            <p className="text-[10px] text-slate-400 line-through">{svc.mrp}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Badges row */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {svc.badge && (
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${BADGE_STYLES[svc.badge] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                            {svc.badge}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                                                        <FaStar className="text-[10px]" /> {svc.rating}
                                                    </div>
                                                    {svc.duration && (
                                                        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                                                            <FaRegClock className="text-[10px]" /> {svc.duration}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                <p className="text-slate-500 text-sm leading-relaxed font-medium flex-1">{svc.desc}</p>

                                                {/* Book button */}
                                                <button
                                                    onClick={() => handleBook(category, svc)}
                                                    className="w-full py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all group-hover:bg-teal-600 shadow-sm hover:shadow-teal-200 hover:shadow-lg"
                                                >
                                                    Book Now →
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Empty state */}
                        {Object.values(filteredData).every(s => s.length === 0) && (
                            <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                                <div className="text-5xl mb-4">🔍</div>
                                <h3 className="text-xl font-black text-slate-700 uppercase">No services found</h3>
                                <p className="text-slate-400 mt-2">Try a different search term.</p>
                                <button onClick={() => setSearch('')} className="mt-4 px-6 py-2.5 bg-teal-600 text-white text-xs font-black uppercase rounded-xl">Clear Search</button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── BOOKING MODAL ── */}
            <AnimatePresence>
                {isBookingModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden">

                            {/* Modal header */}
                            <div className="bg-gradient-to-r from-teal-600 to-purple-600 p-7 text-white relative">
                                <button onClick={() => setIsBookingModalOpen(false)}
                                    className="absolute top-4 right-4 text-white hover:bg-white/20 p-2.5 rounded-full transition-all">
                                    <FaTimes />
                                </button>
                                <p className="text-[9px] font-black text-teal-200 uppercase tracking-[0.3em] mb-1">GlowAI Beauty Studio</p>
                                <h3 className="text-2xl font-black uppercase italic mb-1">Book Appointment</h3>
                                <p className="text-teal-100 text-sm font-medium truncate">{selectedService?.name}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="text-white font-black text-xl">{selectedService?.price}</span>
                                    {selectedService?.duration && (
                                        <span className="flex items-center gap-1.5 text-teal-200 text-xs font-bold">
                                            <FaClock /> {selectedService.duration}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-8">
                                {error && (
                                    <div className="mb-5 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
                                        <FaExclamationCircle className="mt-0.5 shrink-0" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                {!bookingRef ? (
                                    <form onSubmit={handleConfirmBooking} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                                                <FaUser className="inline mr-2 text-teal-500" /> Full Name
                                            </label>
                                            <input required type="text"
                                                value={bookingData.name}
                                                onChange={e => setBookingData({ ...bookingData, name: e.target.value })}
                                                placeholder="Enter your full name"
                                                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-sm font-medium text-slate-700 transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                                                    <FaCalendarAlt className="inline mr-1.5 text-teal-500" /> Date
                                                </label>
                                                <input required type="date"
                                                    value={bookingData.date}
                                                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-sm font-medium transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                                                    <FaClock className="inline mr-1.5 text-teal-500" /> Time
                                                </label>
                                                <select required
                                                    value={bookingData.time}
                                                    onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                                    className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-sm font-medium transition-all">
                                                    <option value="">Select</option>
                                                    {['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'].map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={loading}
                                            className={`w-full py-4 bg-gradient-to-r from-teal-600 to-purple-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-teal-200 hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                            {loading
                                                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</>
                                                : 'Confirm Appointment →'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center py-8 space-y-5">
                                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                            <FaCheckCircle className="text-emerald-500 text-4xl" />
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase italic">Booking Confirmed!</h4>
                                        <div className="bg-slate-50 border border-dashed border-slate-300 p-5 rounded-2xl">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Booking Reference</p>
                                            <p className="font-mono text-2xl font-black text-teal-600">{bookingRef}</p>
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">
                                            Your spot is reserved for <span className="font-black text-slate-700">{bookingData.time}</span> on <span className="font-black text-slate-700">{bookingData.date}</span>.
                                        </p>
                                        <p className="text-[10px] text-slate-400">This modal will close automatically in a few seconds.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ServicesPage;
