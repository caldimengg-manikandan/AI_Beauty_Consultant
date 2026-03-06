import React, { useState, useMemo } from 'react';
import {
    FaFemale, FaMale, FaSpa, FaLeaf, FaGem, FaTint,
    FaCalendarAlt, FaClock, FaUser, FaTimes, FaCheckCircle,
    FaExclamationCircle, FaStar, FaFire, FaFlask, FaSearch,
    FaFilter, FaChevronRight, FaTag, FaRegClock, FaShieldAlt
} from 'react-icons/fa';
import { bookAppointment } from '../../services/appointmentApi';

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────
const SERVICE_DATA = {
    Female: {
        'Signature Combos': [
            { name: 'Total Radiance Package',       price: 2999, mrp: 3499, desc: 'Pearl Facial + Hair Spa + Threading. Save ₹500.',                        duration: '3 hr',    rating: 4.9, tag: 'Best Seller', hot: true  },
            { name: 'Bridal Glow Essentials',       price: 5500, mrp: 6500, desc: 'Gold Facial + Body Polishing + Premium Mani-Pedi + HD Brows.',           duration: '4 hr',    rating: 4.9, tag: 'Bridal',     hot: true  },
            { name: 'Glass Skin Ritual',            price: 4200, mrp: 4800, desc: 'Double Cleanse + Hydra Facial + Sheet Mask + LED Therapy.',              duration: '2.5 hr',  rating: 4.8, tag: 'Premium'              },
            { name: 'Weekend Glow Escape',          price: 3500, mrp: 4200, desc: 'Aromatherapy Massage + Brightening Facial + Scalp Treatment + Mani.',    duration: '3.5 hr',  rating: 4.7, tag: 'New'                 },
            { name: 'Anti-Aging Power Hour',        price: 6800, mrp: 8000, desc: 'Microneedling + Collagen Infusion + Eye Therapy + Firming Mask.',        duration: '2 hr',    rating: 5.0, tag: 'Clinical',  hot: true  },
            { name: 'Monsoon Skin Shield',          price: 2800, mrp: 3200, desc: 'Deep Cleanse + Anti-Fungal Pedi + Scalp Detox + Nourishing Peel.',       duration: '2 hr',    rating: 4.6, tag: 'Seasonal'             },
        ],
        'Glow & Brightening': [
            { name: 'Oxygen Facial',                price: 1500, mrp: 1800, desc: 'Pure oxygen infusion for an instant, red-carpet radiance.',              duration: '60 min',  rating: 4.8                               },
            { name: 'Pearl Whitening Facial',       price: 2200, mrp: 2500, desc: 'Marine pearl extracts polish skin to a porcelain finish.',               duration: '75 min',  rating: 4.7                               },
            { name: '24K Gold Facial',              price: 3200, mrp: 3800, desc: 'Luxury gold-leaf anti-aging treatment for visible elasticity.',          duration: '90 min',  rating: 4.9, tag: 'Luxury',   hot: true  },
            { name: 'Vitamin C Radiance Boost',     price: 1800, mrp: 2100, desc: 'High-potency antioxidant cocktail for sun-damaged, dull skin.',           duration: '60 min',  rating: 4.6                               },
            { name: 'Kojic Brightening Peel',       price: 2500, mrp: 2900, desc: 'Kojic acid + Arbutin peel to visibly reduce dark spots.',                duration: '45 min',  rating: 4.8, tag: 'Popular'              },
            { name: 'Glutathione Glow Infusion',    price: 4500, mrp: 5200, desc: 'IV-strength topical Glutathione + brightening serum treatment.',         duration: '80 min',  rating: 4.9, tag: 'Premium'              },
            { name: 'Pink Champagne Facial',        price: 3800, mrp: 4500, desc: 'Resveratrol + Pink Clay + AHA for luminous, wine-kissed radiance.',      duration: '85 min',  rating: 4.7, tag: 'New'                 },
        ],
        'Acne & Detox': [
            { name: 'Herbal Face Cleanup',          price:  655, mrp:  800, desc: 'Neem + Tulsi antiseptic cleanup targeting active breakouts.',            duration: '45 min',  rating: 4.5                               },
            { name: 'Advanced Acne Repair Facial',  price: 1800, mrp: 2200, desc: 'Clinical salicylic + BHA treatment for persistent acne.',                duration: '60 min',  rating: 4.7, tag: 'Clinical'             },
            { name: 'Mattifying Deep Clean',        price:  600, mrp:  750, desc: 'Clay mask + pore vacuuming + pore-tightening toner.',                    duration: '30 min',  rating: 4.4                               },
            { name: 'Urban Defense Facial',         price: 2100, mrp: 2500, desc: 'Anti-pollution shield removes deep-seated environmental grime.',          duration: '75 min',  rating: 4.6                               },
            { name: 'Mud Volcano Detox',            price: 1600, mrp: 1900, desc: 'Volcanic mud + activated charcoal for heavy-duty skin detoxification.',  duration: '60 min',  rating: 4.7, tag: 'Popular'              },
            { name: 'Probiotic Skin Reset',         price: 2800, mrp: 3200, desc: 'Balances skin microbiome for reduced redness and fewer breakouts.',      duration: '70 min',  rating: 4.8, tag: 'New'                 },
        ],
        'Hydration & Rejuvenation': [
            { name: 'Honey & Milk Hydration',       price: 1600, mrp: 1900, desc: 'Ayurvedic moisture therapy for silky, supple skin.',                     duration: '60 min',  rating: 4.7                               },
            { name: 'Choco-Divine Facial',          price: 2200, mrp: 2600, desc: 'Cocoa butter antioxidant treatment for deep moisturisation.',            duration: '75 min',  rating: 4.8                               },
            { name: 'Collagen Infusion Boost',      price: 3500, mrp: 4200, desc: 'Marine collagen + peptide serum lifts and firms sagging skin.',          duration: '90 min',  rating: 4.9, tag: 'Luxury',   hot: true  },
            { name: 'Hyaluronic Deep Sea',          price: 2800, mrp: 3300, desc: 'Ultra-hydrating marine facial for dehydrated, tight, stressed skin.',    duration: '80 min',  rating: 4.7                               },
            { name: 'Cactus Moisture Lock',         price: 2400, mrp: 2800, desc: 'Prickly pear ceramides seal moisture for 72-hour hydration.',            duration: '65 min',  rating: 4.6, tag: 'New'                 },
            { name: 'AquaPeel HydraFacial',         price: 4800, mrp: 5500, desc: '4-step HydraFacial — cleanse, peel, extract, hydrate.',                 duration: '60 min',  rating: 5.0, tag: 'Best Seller', hot: true },
        ],
        'Clinical & Advanced': [
            { name: 'Retinol Renewal Facial',       price: 3800, mrp: 4500, desc: 'Targeted retinoid treatment for fine lines and enlarged pores.',         duration: '75 min',  rating: 4.9, tag: 'Clinical'             },
            { name: 'Blue Light Protection',        price: 1400, mrp: 1700, desc: 'Neutralises digital screen (HEV) damage; revives fatigued skin.',        duration: '45 min',  rating: 4.5                               },
            { name: 'Derma-Peel Expert',            price: 2500, mrp: 3000, desc: 'TCA + Mandelic chemical peel for deep pigmentation and scarring.',       duration: '45 min',  rating: 4.8, tag: 'Clinical'             },
            { name: 'RF Skin Tightening',           price: 5500, mrp: 6500, desc: 'Radiofrequency therapy stimulates deep-dermis collagen remodelling.',    duration: '60 min',  rating: 4.9, tag: 'Premium',  hot: true  },
            { name: 'LED Photon Therapy',           price: 2200, mrp: 2600, desc: 'Red + blue + near-IR light wavelengths for healing and rejuvenation.',   duration: '30 min',  rating: 4.7, tag: 'Popular'              },
            { name: 'Microneedling (CIT)',          price: 6000, mrp: 7200, desc: 'Controlled micro-channels maximise active serum absorption.',            duration: '90 min',  rating: 4.9, tag: 'Clinical',  hot: true  },
        ],
        'Body & Wellness': [
            { name: 'Full Body Aromatherapy',       price: 3200, mrp: 3800, desc: 'Bespoke essential-oil massage for complete stress release.',             duration: '90 min',  rating: 4.9                               },
            { name: 'Swedish Relaxation Massage',   price: 2500, mrp: 2900, desc: 'Long gliding strokes ease muscle tension and improve circulation.',      duration: '60 min',  rating: 4.8, tag: 'Popular'              },
            { name: 'Hot Stone Therapy',            price: 3800, mrp: 4500, desc: 'Warmed basalt stones dissolve deep back and shoulder stress.',           duration: '75 min',  rating: 4.9, tag: 'Luxury',   hot: true  },
            { name: 'Body Polishing Ritual',        price: 2800, mrp: 3300, desc: 'Sugar + coffee exfoliation followed by shea butter wrap.',               duration: '60 min',  rating: 4.7                               },
            { name: 'Keratin Hair Spa',             price: 1720, mrp: 2000, desc: 'Keratin deep-conditioning treatment smooths frizz and adds shine.',      duration: '45 min',  rating: 4.6                               },
            { name: 'Foot Reflexology',             price: 1200, mrp: 1500, desc: 'Pressure-point sole therapy for organ detox and energy alignment.',      duration: '45 min',  rating: 4.8, tag: 'Popular'              },
        ],
        'Nail & Hand Studio': [
            { name: 'Gel Nail Art (Both Hands)',    price:  800, mrp: 1000, desc: 'Long-lasting gel with custom nail art, chip-free for up to 3 weeks.',    duration: '60 min',  rating: 4.8                               },
            { name: 'Ice Cream Manicure',           price:  440, mrp:  550, desc: 'Fruit-scented soak, sugar scrub, and paraffin dip for silky hands.',     duration: '30 min',  rating: 4.5                               },
            { name: 'Paraffin Pedicure',            price:  795, mrp:  950, desc: 'Deep-heat paraffin treatment for cracked heels and dry cuticles.',       duration: '45 min',  rating: 4.6                               },
            { name: 'Japanese Gel Nail Extension',  price: 2200, mrp: 2800, desc: 'Ultra-thin Japanese gel extensions — glossy, strong, long-wear.',        duration: '90 min',  rating: 4.9, tag: 'Premium',  hot: true  },
            { name: 'Luxury Spa Mani-Pedi',         price: 1600, mrp: 2000, desc: 'Heated mitts, full exfoliation, callus removal, and gel finish.',        duration: '75 min',  rating: 4.8, tag: 'Best Seller'           },
        ],
    },
    Male: {
        'Executive Combos': [
            { name: "Gentleman's Detox",            price:  999, mrp: 1300, desc: 'Haircut + Charcoal De-Tan + Beard Trim + Eyebrow Grooming.',             duration: '1.5 hr',  rating: 4.8, tag: 'Best Seller', hot: true },
            { name: 'Wedding Ready Groom',          price: 4500, mrp: 5500, desc: 'Gold Facial + Manicure + Pedicure + Hair Spa + Beard Styling.',          duration: '4 hr',    rating: 4.9, tag: 'Bridal',     hot: true },
            { name: 'Boardroom Prep Package',       price: 1800, mrp: 2200, desc: 'Express Cleanup + Eyebrow Grooming + Relaxing Head Massage.',            duration: '1.5 hr',  rating: 4.7, tag: 'Popular'              },
            { name: 'Weekend Warrior Reset',        price: 2800, mrp: 3400, desc: 'Sports Massage + De-Tan Facial + Hair Spa + Foot Reflexology.',          duration: '3 hr',    rating: 4.8, tag: 'New'                 },
            { name: "Men's Skin Revival Combo",     price: 3500, mrp: 4200, desc: 'Microderm + Oxygen Facial + Scalp Revitalise + Beard Moisturise.',       duration: '2.5 hr',  rating: 4.9, tag: 'Premium',  hot: true  },
        ],
        'Detox & Oil Control': [
            { name: 'Herbal Face Cleanup',          price:  655, mrp:  800, desc: 'Antiseptic neem + tulsi treatment to clear active acne and excess oil.', duration: '45 min',  rating: 4.5                               },
            { name: 'Charcoal De-Tan Facial',       price:  500, mrp:  650, desc: 'Activated charcoal mask absorbs excess oil, lifts tan, tightens pores.', duration: '30 min',  rating: 4.6                               },
            { name: 'Oil Control Deep Clean',       price:  545, mrp:  700, desc: 'Pore-vacuuming extraction + clay mask for stubborn sebum buildup.',      duration: '30 min',  rating: 4.4                               },
            { name: 'Volcanic Ash Detox',           price: 1200, mrp: 1500, desc: 'Intense volcanic mineral treatment for deep-seated blackheads.',         duration: '45 min',  rating: 4.7, tag: 'Popular'              },
            { name: 'Mud Detox & Peel',             price: 1500, mrp: 1800, desc: 'White + Black Clay fusion peels pollution and sweat residue.',           duration: '60 min',  rating: 4.7, tag: 'New'                 },
            { name: 'Probiotic Reset Cleanup',      price: 1800, mrp: 2200, desc: 'Microbiome-balancing gel reduces post-shave redness and flaking.',      duration: '60 min',  rating: 4.8, tag: 'New'                 },
        ],
        'Skin Recovery': [
            { name: 'Sports Recovery Facial',       price: 1400, mrp: 1700, desc: 'Deep cooling + cryo-gel for skin exposed to heat, sweat, and UV.',      duration: '60 min',  rating: 4.7                               },
            { name: 'Sun Damage Repair',            price: 1600, mrp: 1900, desc: 'Reverses intense tanning and repairs UV-damaged surface cells.',         duration: '60 min',  rating: 4.8, tag: 'Popular'              },
            { name: 'Anti-Fatigue Therapy',         price: 1100, mrp: 1400, desc: 'Restores glow to stressed, sleep-deprived, and caffeine-tired skin.',    duration: '45 min',  rating: 4.6                               },
            { name: 'Post-Workout Skin Flush',      price:  900, mrp: 1100, desc: 'Enzyme peel clears sweat-blocked pores + cooling green tea masque.',     duration: '30 min',  rating: 4.5                               },
            { name: 'Cryo-Therapy Cool Down',       price: 2800, mrp: 3400, desc: 'Cryo-facial minimises pores, reduces inflammation, adds firmness.',      duration: '45 min',  rating: 4.9, tag: 'Premium',  hot: true  },
        ],
        'Grooming & Beard Studio': [
            { name: 'Oxygen Skin Facial',           price: 1500, mrp: 1800, desc: 'Pure oxygen infusion brightens and refreshes dull skin.',                duration: '60 min',  rating: 4.8                               },
            { name: 'Global Gold Facial',           price: 3000, mrp: 3600, desc: 'Premium gold-leaf anti-aging radiance treatment.',                       duration: '90 min',  rating: 4.9, tag: 'Luxury'               },
            { name: 'Skin Lightening Cleanup',      price:  730, mrp:  900, desc: 'Kojic + Alpha Arbutin blend evens tone and fades marks.',                duration: '45 min',  rating: 4.5                               },
            { name: 'Royal Beard Spa',              price: 1200, mrp: 1500, desc: 'Hot towel + argan oil conditioning + shape + moisturiser finish.',       duration: '45 min',  rating: 4.9, tag: 'Best Seller', hot: true },
            { name: 'Beard & Skin Therapy',         price:  850, mrp: 1050, desc: 'Under-beard skin care to prevent itch and folliculitis.',                duration: '30 min',  rating: 4.7                               },
            { name: 'Classic Hot Shave Ritual',     price:  650, mrp:  800, desc: 'Hot lather + straight-razor shave + cold towel + aftershave balm.',      duration: '30 min',  rating: 4.9, tag: 'Popular'              },
        ],
        'Clinical & Texture': [
            { name: 'Anti-Dandruff Treatment',      price: 1210, mrp: 1500, desc: 'Clinical scalp analysis + medicated solution for persistent buildup.',   duration: '45 min',  rating: 4.6, tag: 'Clinical'             },
            { name: 'Crystal Microdermabrasion',    price: 2500, mrp: 3000, desc: 'Diamond-tip resurfacing for acne scars, rough texture, and dullness.',   duration: '60 min',  rating: 4.8, tag: 'Clinical'             },
            { name: 'Digital Detox Facial',         price: 1200, mrp: 1500, desc: 'Neutralises HEV blue-light skin damage from prolonged screen usage.',    duration: '45 min',  rating: 4.5                               },
            { name: 'RF Skin Firming',              price: 4000, mrp: 5000, desc: 'Radiofrequency heat therapy for jawline definition and skin lift.',       duration: '60 min',  rating: 4.9, tag: 'Premium',  hot: true  },
            { name: 'LED Acne Phototherapy',        price: 1800, mrp: 2200, desc: 'Blue LED eliminates P.acnes bacteria with zero downtime.',               duration: '30 min',  rating: 4.7                               },
        ],
        'Body & Massage': [
            { name: 'Deep Tissue Massage',          price: 2800, mrp: 3400, desc: 'Firm therapeutic pressure targets muscle knots and chronic back tension.', duration: '60 min', rating: 4.9, tag: 'Popular', hot: true },
            { name: 'Thai Stretch Therapy',         price: 3200, mrp: 3800, desc: 'Passive yoga stretching + acupressure for full-body flexibility.',        duration: '90 min',  rating: 4.8                               },
            { name: 'Hot Stone Back & Shoulder',    price: 2500, mrp: 3000, desc: 'Warmed basalt stones dissolve desk-induced spine and shoulder stiffness.', duration: '60 min', rating: 4.9, tag: 'Luxury'               },
            { name: 'Foot Reflexology',             price: 1200, mrp: 1500, desc: 'Pressure-point foot therapy for internal organ detox and energy flow.',   duration: '45 min',  rating: 4.8                               },
            { name: "Men's Mani-Pedi Combo",        price: 1200, mrp: 1500, desc: 'Cut, buff, cuticle care, and callus removal for hands and feet.',          duration: '60 min',  rating: 4.6                               },
        ],
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// TAG CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TAG_CONFIG = {
    'Best Seller': { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
    'Bridal':      { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'  },
    'Premium':     { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200'},
    'Luxury':      { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200'},
    'Clinical':    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200'   },
    'Popular':     { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200'  },
    'New':         { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200'},
    'Seasonal':    { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200'},
};

const CATEGORY_ICONS = {
    'Signature': <FaGem className="text-amber-500" />,
    'Combo':     <FaGem className="text-amber-500" />,
    'Glow':      <FaSpa className="text-yellow-500" />,
    'Brightening': <FaSpa className="text-yellow-500" />,
    'Acne':      <FaLeaf className="text-emerald-600" />,
    'Detox':     <FaLeaf className="text-emerald-600" />,
    'Hydration': <FaTint className="text-blue-500" />,
    'Clinical':  <FaFlask className="text-sky-600" />,
    'Advanced':  <FaFlask className="text-sky-600" />,
    'Body':      <FaSpa className="text-teal-600" />,
    'Wellness':  <FaSpa className="text-teal-600" />,
    'Nail':      <FaShieldAlt className="text-pink-500" />,
    'Grooming':  <FaUser className="text-indigo-500" />,
    'Beard':     <FaUser className="text-indigo-500" />,
    'Recovery':  <FaFire className="text-orange-500" />,
    'Massage':   <FaTint className="text-teal-500" />,
    'Executive': <FaShieldAlt className="text-slate-600" />,
};

const getCategoryIcon = (cat) => {
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (cat.includes(key)) return icon;
    }
    return <FaSpa className="text-slate-400" />;
};

const fmt = (n) => '₹' + n.toLocaleString('en-IN');
const discount = (p, m) => Math.round(((m - p) / m) * 100);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ServicesPage = () => {
    const [gender, setGender]         = useState('Female');
    const [activeCat, setActiveCat]   = useState('All');
    const [search, setSearch]         = useState('');
    const [selectedSvc, setSelectedSvc] = useState(null);
    const [modalOpen, setModalOpen]   = useState(false);
    const [bookingRef, setBookingRef] = useState(null);
    const [form, setForm]             = useState({ name: '', date: '', time: '' });
    const [error, setError]           = useState('');
    const [submitting, setSubmitting] = useState(false);

    const categories = useMemo(() => ['All', ...Object.keys(SERVICE_DATA[gender])], [gender]);

    const visibleData = useMemo(() => {
        const q = search.toLowerCase();
        return Object.entries(SERVICE_DATA[gender])
            .filter(([cat]) => activeCat === 'All' || cat === activeCat)
            .map(([cat, svcs]) => ({
                cat,
                svcs: svcs.filter(s =>
                    s.name.toLowerCase().includes(q) ||
                    s.desc.toLowerCase().includes(q)
                ),
            }))
            .filter(({ svcs }) => svcs.length > 0);
    }, [gender, activeCat, search]);

    const totalCount = Object.values(SERVICE_DATA[gender]).flat().length;

    const openModal = (cat, svc) => {
        setSelectedSvc({ ...svc, category: cat });
        setForm({ name: '', date: '', time: '' });
        setError('');
        setBookingRef(null);
        setModalOpen(true);
    };

    const handleBook = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const result = await bookAppointment({
                service_name: selectedSvc.name,
                customer_name: form.name,
                appointment_date: form.date,
                appointment_time: form.time,
                category: selectedSvc.category,
                gender,
            });
            setBookingRef(result.booking_ref);
            setTimeout(() => { setModalOpen(false); }, 5000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
                                GlowAI Beauty Studio
                            </p>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Spa &amp; Skin Services
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {totalCount} professional treatments — select a service to book an appointment.
                            </p>
                        </div>

                        {/* Gender switch */}
                        <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                            {['Female', 'Male'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => { setGender(g); setActiveCat('All'); setSearch(''); }}
                                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-colors
                                        ${gender === g
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {g === 'Female' ? <FaFemale /> : <FaMale />}
                                    {g === 'Female' ? 'For Her' : 'For Him'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TOOLBAR: search + category tabs ────────────────────────── */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">

                        {/* Search */}
                        <div className="relative w-full sm:w-72 shrink-0">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                type="text"
                                placeholder="Search services..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50
                                           placeholder:text-gray-400 text-gray-700"
                            />
                        </div>

                        {/* Category tabs */}
                        <div className="flex gap-1 flex-wrap">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCat(cat)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap
                                        ${activeCat === cat
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SERVICE SECTIONS ────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
                {visibleData.length === 0 ? (
                    <div className="py-20 text-center bg-white border border-gray-200 rounded-xl">
                        <FaSearch className="mx-auto text-gray-300 text-4xl mb-4" />
                        <p className="text-base font-semibold text-gray-700">No services match your search</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different keyword or clear the search field.</p>
                        <button
                            onClick={() => setSearch('')}
                            className="mt-5 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    visibleData.map(({ cat, svcs }) => (
                        <section key={cat}>
                            {/* Category heading */}
                            <div className="flex items-center gap-3 mb-5">
                                <span className="flex items-center justify-center w-8 h-8 bg-indigo-50 rounded-lg">
                                    {getCategoryIcon(cat)}
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">{cat}</h2>
                                    <p className="text-xs text-gray-400">{svcs.length} {svcs.length === 1 ? 'service' : 'services'}</p>
                                </div>
                                <div className="flex-1 h-px bg-gray-200 ml-2" />
                            </div>

                            {/* Cards grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {svcs.map((svc, i) => {
                                    const tagCfg = svc.tag ? TAG_CONFIG[svc.tag] : null;
                                    const disc   = discount(svc.price, svc.mrp);

                                    return (
                                        <div
                                            key={i}
                                            className="bg-white border border-gray-200 rounded-xl overflow-hidden
                                                       flex flex-col hover:border-indigo-300 hover:shadow-md
                                                       transition-all duration-200 group"
                                        >
                                            {/* Hot indicator strip */}
                                            {svc.hot && (
                                                <div className="h-0.5 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
                                            )}

                                            <div className="p-5 flex flex-col flex-1 gap-3">

                                                {/* Row 1: Name */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors">
                                                        {svc.name}
                                                    </h3>
                                                    {svc.hot && (
                                                        <FaFire className="text-orange-400 shrink-0 mt-0.5" />
                                                    )}
                                                </div>

                                                {/* Row 2: Badges */}
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {tagCfg && (
                                                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border
                                                                         ${tagCfg.bg} ${tagCfg.text} ${tagCfg.border}`}>
                                                            {svc.tag}
                                                        </span>
                                                    )}
                                                    {/* Rating */}
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                                        <FaStar className="text-amber-400 text-[9px]" />
                                                        {svc.rating.toFixed(1)}
                                                    </span>
                                                    {/* Duration */}
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                                        <FaRegClock className="text-[9px]" />
                                                        {svc.duration}
                                                    </span>
                                                </div>

                                                {/* Row 3: Description */}
                                                <p className="text-xs text-gray-500 leading-relaxed flex-1">
                                                    {svc.desc}
                                                </p>

                                                {/* Row 4: Price + CTA */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-base font-bold text-gray-900">{fmt(svc.price)}</span>
                                                        {disc > 0 && (
                                                            <>
                                                                <span className="text-xs text-gray-400 line-through">{fmt(svc.mrp)}</span>
                                                                <span className="text-[10px] font-semibold text-emerald-600">{disc}% off</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => openModal(cat, svc)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white
                                                                   text-xs font-semibold rounded-md hover:bg-indigo-700
                                                                   transition-colors shadow-sm"
                                                    >
                                                        Book <FaChevronRight className="text-[9px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))
                )}
            </div>

            {/* ── BOOKING MODAL ───────────────────────────────────────────── */}
            {modalOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
                >
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

                        {/* Modal header */}
                        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
                            <div>
                                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">
                                    Book Appointment
                                </p>
                                <h3 className="text-sm font-bold text-gray-900 leading-snug">
                                    {selectedSvc?.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-base font-bold text-gray-900">{fmt(selectedSvc?.price)}</span>
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <FaRegClock className="text-[10px]" /> {selectedSvc?.duration}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-6">
                            {error && (
                                <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    <FaExclamationCircle className="shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {!bookingRef ? (
                                <form onSubmit={handleBook} className="space-y-5">

                                    {/* Full name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="Enter your full name"
                                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md
                                                       focus:outline-none focus:ring-2 focus:ring-indigo-500
                                                       placeholder:text-gray-400 text-gray-800"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Date */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="date"
                                                value={form.date}
                                                onChange={e => setForm({ ...form, date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md
                                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                            />
                                        </div>

                                        {/* Time */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Time Slot <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={form.time}
                                                onChange={e => setForm({ ...form, time: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md
                                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 bg-white"
                                            >
                                                <option value="">Select</option>
                                                {['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM',
                                                  '2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Summary row */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Service</span>
                                            <span className="font-semibold text-gray-800">{selectedSvc?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Category</span>
                                            <span className="font-semibold text-gray-800">{selectedSvc?.category}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Amount</span>
                                            <span className="font-bold text-indigo-700">{fmt(selectedSvc?.price)}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`w-full py-3 bg-indigo-600 text-white text-sm font-semibold
                                                    rounded-md hover:bg-indigo-700 transition-colors shadow-sm
                                                    flex items-center justify-center gap-2
                                                    ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Submitting...
                                            </>
                                        ) : 'Confirm Appointment'}
                                    </button>
                                </form>
                            ) : (
                                /* Booking confirmed */
                                <div className="py-6 text-center space-y-4">
                                    <div className="flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mx-auto">
                                        <FaCheckCircle className="text-green-500 text-2xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-gray-900">Appointment Confirmed</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {form.date} at {form.time}
                                        </p>
                                    </div>
                                    <div className="border border-dashed border-gray-300 rounded-lg px-5 py-4 bg-gray-50">
                                        <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Booking Reference</p>
                                        <p className="font-mono text-lg font-bold text-indigo-700">{bookingRef}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">This window will close automatically.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;
