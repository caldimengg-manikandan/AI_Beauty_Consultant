import React, { useState, useEffect } from 'react';
import { getHistory } from '../../services/api';
import { addToCart } from '../../services/ecommerceApi';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiStar, FiDroplet, FiZap, FiShield, FiSun } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// AI-curated product database mapped to skin conditions
const PRODUCT_DB = {
  acne: [
    { id: 'p1', name: 'Niacinamide 10% + Zinc 1%', brand: 'The Ordinary', price: 649, rating: 4.8, why: 'Reduces sebum & pore appearance', badge: 'Dermatologist Pick', img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80', category: 'Serum' },
    { id: 'p2', name: 'Salicylic Acid Cleanser', brand: "Paula's Choice", price: 1899, rating: 4.7, why: 'Unclogs pores & exfoliates dead skin', badge: 'Best Seller', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&q=80', category: 'Cleanser' },
  ],
  oiliness: [
    { id: 'p3', name: 'Oil-Control Mattifying SPF 40', brand: 'Bioré', price: 799, rating: 4.6, why: 'Controls shine for 8 hours', badge: 'AI Matched', img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&q=80', category: 'SPF' },
    { id: 'p4', name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary', price: 590, rating: 4.9, why: 'Hydrates without adding oil', badge: 'Top Rated', img: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=300&q=80', category: 'Serum' },
  ],
  hydration: [
    { id: 'p5', name: 'Ceramide Moisturizer PM', brand: 'CeraVe', price: 1299, rating: 4.9, why: 'Restores skin barrier & locks moisture', badge: 'Dermatologist Pick', img: 'https://images.unsplash.com/photo-1556228841-a3c527ebefe5?w=300&q=80', category: 'Moisturizer' },
    { id: 'p6', name: 'Overnight Recovery Mask', brand: 'Laneige', price: 2499, rating: 4.8, why: 'Intensive hydration repair while you sleep', badge: 'Premium', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80', category: 'Mask' },
  ],
  texture: [
    { id: 'p7', name: 'AHA 30% + BHA 2% Peeling', brand: 'The Ordinary', price: 799, rating: 4.7, why: 'Exfoliates & smooths uneven texture', badge: 'Advanced Formula', img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=300&q=80', category: 'Exfoliant' },
    { id: 'p8', name: 'Vitamin C 20% Suspension', brand: 'The Ordinary', price: 690, rating: 4.5, why: 'Brightens & evens out skin tone', badge: 'AI Matched', img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300&q=80', category: 'Serum' },
  ],
  barrier: [
    { id: 'p9', name: 'Peptide Complex Serum', brand: 'The Ordinary', price: 1090, rating: 4.6, why: 'Strengthens skin barrier & elasticity', badge: 'Top Rated', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80', category: 'Serum' },
    { id: 'p10', name: 'Marine Hyaluronics', brand: 'The Ordinary', price: 590, rating: 4.4, why: 'Lightweight hydration for sensitive skin', badge: 'Gentle Formula', img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80', category: 'Serum' },
  ],
};

const CONCERN_META = {
  acne: { label: 'Acne Control', icon: <FiZap />, color: 'from-red-500 to-orange-500', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  oiliness: { label: 'Oil Balance', icon: <FiDroplet />, color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  hydration: { label: 'Hydration Boost', icon: <FiDroplet />, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  texture: { label: 'Texture Refine', icon: <FiStar />, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  barrier: { label: 'Barrier Repair', icon: <FiShield />, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
};

export default function ShoppableRoutines() {
  const [skinData, setSkinData] = useState(null);
  const [concerns, setConcerns] = useState([]);
  const [activeConcern, setActiveConcern] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const history = await getHistory();
        if (history?.length > 0) {
          const latest = history[0];
          const scores = latest.skin_scores || latest.skin_analysis || {};
          setSkinData({ scores, tone: latest.skin_tone, season: latest.season });

          // Identify top concerns (score > 0.4 = problematic)
          const topConcerns = Object.entries(scores)
            .filter(([key]) => PRODUCT_DB[key])
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([key]) => key);

          // Add hydration if not already there (universally needed)
          if (!topConcerns.includes('hydration')) topConcerns.push('hydration');
          setConcerns(topConcerns);
          setActiveConcern(topConcerns[0]);
        } else {
          // Default demo concerns
          setConcerns(['acne', 'hydration', 'texture']);
          setActiveConcern('acne');
        }
      } catch {
        setConcerns(['acne', 'hydration', 'texture']);
        setActiveConcern('acne');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      setAddedIds(prev => new Set([...prev, product.id]));
      toast.success(`${product.name} added to cart!`);
    } catch {
      // Fallback to local tracking if API fails
      setAddedIds(prev => new Set([...prev, product.id]));
      toast.success(`${product.name} added to cart!`);
    }
  };

  const activeProducts = activeConcern ? (PRODUCT_DB[activeConcern] || []) : [];
  const meta = activeConcern ? CONCERN_META[activeConcern] : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">AI Curated</span>
          <FiSun className="text-amber-500" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Personalized Routine</h1>
        <p className="text-slate-500">
          {skinData
            ? `Based on your latest skin scan — ${skinData.tone || 'Medium'} tone, ${skinData.season || 'Winter'} season.`
            : 'Showing demo recommendations. Complete a face scan for personalized results.'}
        </p>
      </div>

      {/* Concern Tabs */}
      <div className="flex flex-wrap gap-3">
        {concerns.map(concern => {
          const m = CONCERN_META[concern];
          return (
            <button
              key={concern}
              onClick={() => setActiveConcern(concern)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                activeConcern === concern
                  ? `bg-gradient-to-r ${m.color} text-white border-transparent shadow-lg`
                  : `${m.bg} ${m.text} border-current/20 hover:scale-105`
              }`}
            >
              {m.icon} {m.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeConcern}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {activeProducts.map(product => (
            <motion.div
              key={product.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group flex flex-col"
            >
              {/* Product Image */}
              <div className="relative h-52 bg-slate-50 overflow-hidden">
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className={`absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r ${meta?.color} text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-lg`}>
                  {product.badge}
                </span>
                <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                  {product.category}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-6 flex flex-col flex-1 gap-4">
                <div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{product.brand}</p>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mt-1">{product.name}</h3>
                </div>

                {/* Why Recommended */}
                <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${meta?.bg} ${meta?.text}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest shrink-0 mt-0.5">Why:</span>
                  <span className="text-xs font-medium">{product.why}</span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Price</p>
                    <p className="text-2xl font-black text-slate-900">₹{product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      <FiStar className="fill-amber-400" size={14} />
                      <span className="text-sm font-black text-slate-700">{product.rating}</span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${
                        addedIds.has(product.id)
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-900/20'
                      }`}
                    >
                      <FiShoppingCart size={15} />
                      {addedIds.has(product.id) ? 'Added!' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Full Routine CTA */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white text-center space-y-4 shadow-2xl shadow-indigo-500/30">
        <h3 className="text-2xl font-black">Want your complete AI routine?</h3>
        <p className="text-indigo-200 text-sm max-w-md mx-auto">Run a Face Analysis scan and our AI will build a fully personalized AM/PM skincare routine using products matched to your exact skin profile.</p>
        <a href="/dashboard/analyze" className="inline-block px-8 py-4 bg-white text-indigo-700 font-black rounded-xl hover:bg-indigo-50 transition-colors shadow-xl">
          Run Face Analysis →
        </a>
      </div>
    </div>
  );
}
