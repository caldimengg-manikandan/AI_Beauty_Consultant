import React, { useState, useEffect, useRef } from 'react';
import {
    FaShoppingCart, FaStar, FaExternalLinkAlt, FaSearch,
    FaHeart, FaRegHeart, FaShieldAlt, FaBalanceScale,
    FaLeaf, FaBoxOpen, FaFilter, FaTimes, FaCheckCircle,
    FaChevronDown, FaBell, FaTag, FaGift, FaCrown
} from 'react-icons/fa';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import CartDrawer from '../features/ecommerce/CartDrawer';

// ─── PRODUCT DATA ─────────────────────────────────────────────────────────────
const ALL_PRODUCTS = [
    // Cleansers
    { id: 1, name: 'CeraVe Hydrating Facial Cleanser', brand: 'CeraVe', category: 'Cleanser', price: 799, mrp: 1099, rating: 4.8, reviews: 12400, safetyScore: 9.2, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80', tags: ['gentle', 'fragrance-free', 'dermatologist-tested'], links: { amazon: 'https://amazon.in/s?k=cerave+cleanser', nykaa: 'https://nykaa.com/search/?q=cerave+cleanser', sephora: 'https://sephora.com/search?keyword=cerave' }, ingredients: ['ceramides', 'hyaluronic acid', 'glycerin'], concern: ['dryness', 'sensitivity'] },
    { id: 2, name: 'La Roche-Posay Gel Cleanser', brand: 'La Roche-Posay', category: 'Cleanser', price: 1200, mrp: 1400, rating: 4.7, reviews: 8900, safetyScore: 9.5, image: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=300&q=80', tags: ['oily-skin', 'paraben-free', 'allergy-tested'], links: { amazon: 'https://amazon.in/s?k=la+roche+posay+cleanser', nykaa: 'https://nykaa.com/search/?q=la+roche+posay', sephora: '#' }, ingredients: ['zinc', 'niacinamide', 'thermal water'], concern: ['acne', 'oiliness'] },
    // Serums
    { id: 3, name: 'The Ordinary Niacinamide 10%', brand: 'The Ordinary', category: 'Serum', price: 650, mrp: 750, rating: 4.6, reviews: 25600, safetyScore: 8.8, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&q=80', tags: ['vegan', 'cruelty-free', 'fragrance-free'], links: { amazon: 'https://amazon.in/s?k=the+ordinary+niacinamide', nykaa: 'https://nykaa.com/search/?q=the+ordinary+niacinamide', sephora: 'https://sephora.com/search?keyword=ordinary+niacinamide' }, ingredients: ['niacinamide', 'zinc pca'], concern: ['pores', 'oiliness', 'dark-spots'] },
    { id: 4, name: 'Minimalist Vitamin C 10%', brand: 'Minimalist', category: 'Serum', price: 599, mrp: 699, rating: 4.5, reviews: 18200, safetyScore: 8.6, image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=300&q=80', tags: ['vegan', 'cruelty-free', 'fragrance-free'], links: { amazon: 'https://amazon.in/s?k=minimalist+vitamin+c', nykaa: 'https://nykaa.com/search/?q=minimalist+vitamin+c', sephora: '#' }, ingredients: ['ascorbic acid', 'ferulic acid', 'vitamin e'], concern: ['dark-spots', 'brightening', 'anti-aging'] },
    { id: 5, name: 'Paula\'s Choice BHA Exfoliant', brand: 'Paula\'s Choice', category: 'Serum', price: 2800, mrp: 3200, rating: 4.9, reviews: 31000, safetyScore: 9.1, image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&q=80', tags: ['fragrance-free', 'paraben-free', 'dermatologist-tested'], links: { amazon: 'https://amazon.in/s?k=paulas+choice+bha', nykaa: 'https://nykaa.com/search/?q=paulas+choice', sephora: 'https://sephora.com/search?keyword=paulas+choice' }, ingredients: ['salicylic acid 2%', 'green tea', 'methylpropanediol'], concern: ['acne', 'pores', 'oiliness'] },
    // Moisturizers
    { id: 6, name: 'Neutrogena Hydro Boost Gel', brand: 'Neutrogena', category: 'Moisturizer', price: 950, mrp: 1100, rating: 4.7, reviews: 19800, safetyScore: 8.9, image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=300&q=80', tags: ['oil-free', 'hypoallergenic', 'dermatologist-tested'], links: { amazon: 'https://amazon.in/s?k=neutrogena+hydro+boost', nykaa: 'https://nykaa.com/search/?q=neutrogena+hydro+boost', sephora: '#' }, ingredients: ['hyaluronic acid', 'dimethicone', 'glycerin'], concern: ['hydration', 'oiliness'] },
    { id: 7, name: 'Cetaphil Moisturising Lotion', brand: 'Cetaphil', category: 'Moisturizer', price: 520, mrp: 650, rating: 4.6, reviews: 22100, safetyScore: 9.3, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80', tags: ['gentle', 'fragrance-free', 'non-comedogenic'], links: { amazon: 'https://amazon.in/s?k=cetaphil+moisturiser', nykaa: 'https://nykaa.com/search/?q=cetaphil', sephora: '#' }, ingredients: ['glycerin', 'panthenol', 'niacinamide'], concern: ['dryness', 'sensitivity'] },
    // Sunscreens
    { id: 8, name: 'Re\'equil Ultra-Matte SPF 50', brand: "Re'equil", category: 'Sunscreen', price: 495, mrp: 595, rating: 4.8, reviews: 14300, safetyScore: 9.4, image: 'https://images.unsplash.com/photo-1556228841-a3c527ebefe5?w=300&q=80', tags: ['matte-finish', 'PA++++', 'water-resistant'], links: { amazon: 'https://amazon.in/s?k=reequil+sunscreen', nykaa: 'https://nykaa.com/search/?q=reequil+sunscreen', sephora: '#' }, ingredients: ['octinoxate', 'titanium dioxide', 'avobenzone'], concern: ['oiliness', 'acne'] },
    { id: 9, name: 'Dot & Key SPF 50 Sunscreen Serum', brand: 'Dot & Key', category: 'Sunscreen', price: 699, mrp: 799, rating: 4.5, reviews: 9800, safetyScore: 8.7, image: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=300&q=80', tags: ['lightweight', 'vegan', 'with-skincare'], links: { amazon: 'https://amazon.in/s?k=dot+key+sunscreen', nykaa: 'https://nykaa.com/search/?q=dot+and+key+sunscreen', sephora: '#' }, ingredients: ['niacinamide', 'hyaluronic acid', 'zinc oxide'], concern: ['dark-spots', 'hydration'] },
    // Exfoliants
    { id: 10, name: 'Plum 1% Salicylic Acid Face Wash', brand: 'Plum', category: 'Exfoliant', price: 349, mrp: 399, rating: 4.4, reviews: 11200, safetyScore: 8.5, image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&q=80', tags: ['vegan', 'cruelty-free', 'natural'], links: { amazon: 'https://amazon.in/s?k=plum+salicylic+acid', nykaa: 'https://nykaa.com/search/?q=plum+salicylic', sephora: '#' }, ingredients: ['salicylic acid', 'green tea', 'neem'], concern: ['acne', 'pores'] },
];

// ─── SUBSCRIPTION BOXES ───────────────────────────────────────────────────────
const SUBSCRIPTION_BOXES = [
    { id: 1, name: 'GlowBox Monthly', brand: 'GlowBox', price: 999, description: '5-6 full-size K-beauty & Indian skincare products curated by AI for your skin type.', idealFor: ['dryness', 'hydration', 'brightening'], rating: 4.7, badge: 'Best Seller', color: '#F43F5E', emoji: '✨' },
    { id: 2, name: 'The Derma Edit', brand: 'Derma Edit', price: 1499, description: 'Dermatologist-curated box of clinical-grade actives with personalized routine cards.', idealFor: ['acne', 'dark-spots', 'anti-aging', 'pores'], rating: 4.9, badge: 'Premium', color: '#6366F1', emoji: '🔬' },
    { id: 3, name: 'Purplle Beauty Bag', brand: 'Purplle', price: 599, description: '6-8 trial-size bestsellers across cleansers, serums and sunscreen — great for exploring.', idealFor: ['sensitivity', 'oiliness', 'clear-skin'], rating: 4.4, badge: 'Budget Pick', color: '#8B5CF6', emoji: '💜' },
    { id: 4, name: 'Nykaa Beauty Box', brand: 'Nykaa', price: 799, description: '4-5 expertly chosen products across makeup and skincare with a custom skincare guide.', idealFor: ['brightening', 'even-tone', 'minimize-pores'], rating: 4.6, badge: 'Popular', color: '#EC4899', emoji: '🌸' },
];

// ─── SAFETY SCORE HELPERS ─────────────────────────────────────────────────────
const getSafetyColor = (score) => {
    if (score >= 9) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excellent' };
    if (score >= 7.5) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Good' };
    if (score >= 6) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Moderate' };
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Caution' };
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ProductCatalog = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [wishlist, setWishlist] = useState(() => {
        try { return JSON.parse(localStorage.getItem('beauty_wishlist') || '[]'); } catch { return []; }
    });
    const [compareList, setCompareList] = useState([]);
    const [showCompare, setShowCompare] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [notification, setNotification] = useState('');
    const [showBeforeAfter, setShowBeforeAfter] = useState(false);
    const [beforeImg, setBeforeImg] = useState(null);
    const [afterImg, setAfterImg] = useState(null);
    const beforeRef = useRef(null);
    const afterRef = useRef(null);

    const categories = ['All', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Exfoliant'];
    const { addToCart, cartCount } = useCart();
    const [cartOpen, setCartOpen] = useState(false);

    const filtered = ALL_PRODUCTS.filter(p => {
        const matchCat = filter === 'All' || p.category === filter;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    // Save wishlist to localStorage
    useEffect(() => {
        localStorage.setItem('beauty_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = (id) => {
        setWishlist(prev => {
            const isIn = prev.includes(id);
            showNotif(isIn ? 'Removed from Wishlist' : 'Added to Wishlist!');
            return isIn ? prev.filter(x => x !== id) : [...prev, id];
        });
    };

    const toggleCompare = (product) => {
        setCompareList(prev => {
            const isIn = prev.find(p => p.id === product.id);
            if (isIn) return prev.filter(p => p.id !== product.id);
            if (prev.length >= 3) { showNotif('Max 3 products for comparison'); return prev; }
            return [...prev, product];
        });
    };

    const showNotif = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 2500);
    };

    const handleBeforeImg = (e) => {
        const file = e.target.files[0];
        if (file) setBeforeImg(URL.createObjectURL(file));
    };

    const handleAfterImg = (e) => {
        const file = e.target.files[0];
        if (file) setAfterImg(URL.createObjectURL(file));
    };

    const TABS = [
        { id: 'products', label: 'Product Catalog', icon: '🛍️' },
        { id: 'wishlist', label: `Wishlist (${wishlist.length})`, icon: '❤️' },
        { id: 'compare', label: `Compare (${compareList.length})`, icon: '⚖️' },
        { id: 'subscriptions', label: 'Subscription Boxes', icon: '📦' },
        { id: 'before-after', label: 'Before & After', icon: '✨' },
    ];

    return (
        <>
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">

            {/* Floating notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3"
                    >
                        <FaCheckCircle className="text-emerald-400" /> {notification}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic">
                        Product<span className="text-indigo-600">Curations</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium text-sm">AI-matched skincare with safety scores, wishlist &amp; price comparison.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products or brands..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                        />
                    </div>
                    {/* Cart Icon */}
                    <button onClick={() => setCartOpen(true)}
                        className="relative w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md flex-shrink-0">
                        <FaShoppingCart size={18} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeTab === tab.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* ── PRODUCTS TAB ── */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setFilter(cat)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map(product => {
                            const safety = getSafetyColor(product.safetyScore);
                            const inWish = wishlist.includes(product.id);
                            const inComp = compareList.find(p => p.id === product.id);
                            const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

                            return (
                                <div key={product.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                                    {/* Image */}
                                    <div className="relative h-52 bg-slate-50 flex items-center justify-center p-6">
                                        <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80'; }} />
                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg">{product.category}</span>
                                            {discount > 0 && <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-lg">{discount}% OFF</span>}
                                        </div>
                                        {/* Wishlist */}
                                        <button onClick={() => toggleWishlist(product.id)}
                                            className="absolute top-3 right-3 w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500 hover:scale-110 transition-all border border-slate-100">
                                            {inWish ? <FaHeart /> : <FaRegHeart />}
                                        </button>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{product.brand}</p>
                                            <h4 className="text-sm font-black text-slate-900 mt-0.5 line-clamp-2 leading-snug">{product.name}</h4>
                                        </div>

                                        {/* Safety Score */}
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${safety.bg} ${safety.border}`}>
                                            <FaShieldAlt className={`text-xs ${safety.text}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-wide ${safety.text}`}>Safety {safety.label}</span>
                                            <span className={`ml-auto text-sm font-black ${safety.text}`}>{product.safetyScore}/10</span>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xl font-black text-slate-900">₹{product.price}</span>
                                                {product.mrp > product.price && (
                                                    <span className="text-xs text-slate-400 line-through ml-2">₹{product.mrp}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                                                <FaStar /> {product.rating}
                                            </div>
                                        </div>

                                        {/* Buy Links */}
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {[['Amazon', product.links.amazon, '#FF9900'], ['Nykaa', product.links.nykaa, '#FC2779'], ['Sephora', product.links.sephora, '#000']].map(([store, link, color]) => (
                                                <a key={store} href={link} target="_blank" rel="noopener noreferrer"
                                                    className="px-2 py-2 rounded-xl text-[9px] font-black text-center text-white hover:opacity-90 transition-all"
                                                    style={{ backgroundColor: color }}>
                                                    {store}
                                                </a>
                                            ))}
                                        </div>

                                        {/* Compare toggle */}
                                        <button onClick={() => toggleCompare(product)}
                                            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${inComp ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}>
                                            {inComp ? '✓ Added to Compare' : '+ Add to Compare'}
                                        </button>
                                        {/* Add to Cart */}
                                        <button onClick={() => addToCart({ id: String(product.id), name: product.name, price: product.price, image_url: product.image })}
                                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5">
                                            <FaShoppingCart size={11} /> Add to Cart
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── WISHLIST TAB ── */}
            {activeTab === 'wishlist' && (
                <div className="space-y-6">
                    {wishlist.length === 0 ? (
                        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 py-20 text-center">
                            <div className="text-5xl mb-4">❤️</div>
                            <h3 className="text-xl font-black text-slate-700 uppercase">Your Wishlist is Empty</h3>
                            <p className="text-slate-400 mt-2 font-medium">Go to Product Catalog and heart the products you love!</p>
                            <button onClick={() => setActiveTab('products')} className="mt-6 px-8 py-3 bg-indigo-600 text-white text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-indigo-700 transition-all">
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ALL_PRODUCTS.filter(p => wishlist.includes(p.id)).map(product => {
                                const safety = getSafetyColor(product.safetyScore);
                                return (
                                    <div key={product.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4 flex flex-col">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{product.brand}</p>
                                                <h4 className="text-sm font-black text-slate-900 mt-0.5 line-clamp-2 leading-snug">{product.name}</h4>
                                            </div>
                                            <button onClick={() => toggleWishlist(product.id)} className="text-rose-500 hover:scale-110 transition-all shrink-0">
                                                <FaHeart />
                                            </button>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${safety.bg} ${safety.border}`}>
                                            <FaShieldAlt className={`text-xs ${safety.text}`} />
                                            <span className={`text-[10px] font-black ${safety.text}`}>Safety {safety.label}</span>
                                            <span className={`ml-auto text-sm font-black ${safety.text}`}>{product.safetyScore}/10</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xl font-black text-slate-900">₹{product.price}</span>
                                            <div className="flex gap-1">
                                                {[['Amazon', product.links.amazon, '#FF9900'], ['Nykaa', product.links.nykaa, '#FC2779']].map(([store, link, color]) => (
                                                    <a key={store} href={link} target="_blank" rel="noopener noreferrer"
                                                        className="px-3 py-1.5 rounded-xl text-[9px] font-black text-white"
                                                        style={{ backgroundColor: color }}>{store}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── COMPARE TAB ── */}
            {activeTab === 'compare' && (
                <div className="space-y-6">
                    {compareList.length < 2 ? (
                        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 py-20 text-center">
                            <div className="text-5xl mb-4">⚖️</div>
                            <h3 className="text-xl font-black text-slate-700 uppercase">Add 2–3 Products to Compare</h3>
                            <p className="text-slate-400 mt-2 font-medium">Click "Add to Compare" on any product card to start comparing.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">Feature</th>
                                        {compareList.map(p => (
                                            <th key={p.id} className="p-6 text-center">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-indigo-500 uppercase">{p.brand}</p>
                                                    <p className="text-sm font-black text-slate-900 line-clamp-2">{p.name}</p>
                                                    <button onClick={() => toggleCompare(p)} aria-label="Remove from comparison" className="text-slate-300 hover:text-rose-400 transition-all text-xs"><FaTimes /></button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        { label: 'Price', render: p => `₹${p.price}` },
                                        { label: 'MRP', render: p => `₹${p.mrp}` },
                                        { label: 'Rating', render: p => `⭐ ${p.rating}` },
                                        { label: 'Reviews', render: p => `${(p.reviews / 1000).toFixed(1)}K` },
                                        { label: 'Safety Score', render: p => { const s = getSafetyColor(p.safetyScore); return <span className={`font-black ${s.text}`}>{p.safetyScore}/10 ({s.label})</span>; } },
                                        { label: 'Key Ingredients', render: p => p.ingredients.join(', ') },
                                        { label: 'Best For', render: p => p.concern.join(', ') },
                                        { label: 'Category', render: p => p.category },
                                        { label: 'Tags', render: p => p.tags.join(', ') },
                                    ].map(row => (
                                        <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</td>
                                            {compareList.map(p => (
                                                <td key={p.id} className="p-5 text-center text-xs font-medium text-slate-700">
                                                    {row.render(p)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buy Now</td>
                                        {compareList.map(p => (
                                            <td key={p.id} className="p-5">
                                                <div className="flex flex-col gap-1.5 items-center">
                                                    {[['Amazon', p.links.amazon, '#FF9900'], ['Nykaa', p.links.nykaa, '#FC2779']].map(([store, link, color]) => (
                                                        <a key={store} href={link} target="_blank" rel="noopener noreferrer"
                                                            className="px-4 py-1.5 rounded-xl text-[9px] font-black text-white hover:opacity-90 transition-all w-24 text-center"
                                                            style={{ backgroundColor: color }}>{store}
                                                        </a>
                                                    ))}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── SUBSCRIPTION BOXES TAB ── */}
            {activeTab === 'subscriptions' && (
                <div className="space-y-8">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[3rem] p-10 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2">AI Curated</p>
                            <h2 className="text-3xl font-black uppercase italic mb-3">Beauty Subscription Boxes</h2>
                            <p className="text-indigo-100 font-medium max-w-lg">Receive personalized skincare products matched to your skin type, concerns, and seasonal profile every month.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SUBSCRIPTION_BOXES.map(box => (
                            <div key={box.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                <div className="h-4" style={{ backgroundColor: box.color }} />
                                <div className="p-8 space-y-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-3xl">{box.emoji}</span>
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full text-white" style={{ backgroundColor: box.color }}>{box.badge}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{box.brand}</p>
                                            <h3 className="text-lg font-black text-slate-900 italic">{box.name}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-900">₹{box.price}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">/month</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{box.description}</p>

                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ideal For</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {box.idealFor.map(c => (
                                                <span key={c} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 capitalize">{c.replace('-', ' ')}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                                            <FaStar /> {box.rating} / 5
                                        </div>
                                        <button
                                            onClick={() => showNotif(`Subscribed to ${box.name}!`)}
                                            className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white hover:opacity-90 transition-all shadow-lg"
                                            style={{ backgroundColor: box.color }}
                                        >
                                            Subscribe Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── BEFORE & AFTER TAB ── */}
            {activeTab === 'before-after' && (
                <div className="space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic">Before & After Comparison</h2>
                            <p className="text-slate-400 font-medium text-sm mt-1">Upload two photos and drag the slider to compare your skin progress.</p>
                        </div>

                        {beforeImg && afterImg ? (
                            <div className="space-y-6">
                                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
                                    <ReactCompareSlider
                                        itemOne={<ReactCompareSliderImage src={beforeImg} alt="Before" style={{ objectFit: 'cover' }} />}
                                        itemTwo={<ReactCompareSliderImage src={afterImg} alt="After" style={{ objectFit: 'cover' }} />}
                                        style={{ height: '400px', width: '100%' }}
                                    />
                                </div>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => { setBeforeImg(null); setAfterImg(null); }}
                                        className="px-6 py-2.5 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wide rounded-2xl hover:bg-slate-200 transition-all">
                                        Reset Photos
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Before Upload */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Before Photo</p>
                                    <label className={`flex flex-col items-center justify-center h-64 rounded-[2.5rem] border-2 border-dashed cursor-pointer transition-all ${beforeImg ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
                                        {beforeImg ? (
                                            <img src={beforeImg} alt="Before" className="w-full h-full object-cover rounded-[2.5rem]" />
                                        ) : (
                                            <div className="text-center space-y-3">
                                                <div className="text-4xl">📸</div>
                                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Upload Before</p>
                                                <p className="text-xs text-slate-400">Click to select photo</p>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" ref={beforeRef} onChange={handleBeforeImg} className="hidden" />
                                    </label>
                                </div>
                                {/* After Upload */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">After Photo</p>
                                    <label className={`flex flex-col items-center justify-center h-64 rounded-[2.5rem] border-2 border-dashed cursor-pointer transition-all ${afterImg ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}>
                                        {afterImg ? (
                                            <img src={afterImg} alt="After" className="w-full h-full object-cover rounded-[2.5rem]" />
                                        ) : (
                                            <div className="text-center space-y-3">
                                                <div className="text-4xl">🌟</div>
                                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Upload After</p>
                                                <p className="text-xs text-slate-400">Click to select photo</p>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" ref={afterRef} onChange={handleAfterImg} className="hidden" />
                                    </label>
                                </div>
                                {(beforeImg || afterImg) && (
                                    <div className="md:col-span-2 flex justify-center">
                                        <p className="text-sm text-slate-400 font-medium">Upload both photos to activate the comparison slider.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        <button onClick={() => setCartOpen(true)} className="fixed bottom-8 right-8 p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-transform">
            <FaShoppingCart size={24} />
        </button>
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
};

export default ProductCatalog;
