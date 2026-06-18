import React, { useState, useEffect } from 'react';
import { getProductRecommendations } from '../../services/api';
import { FaExternalLinkAlt, FaStar, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ProductRecommendations = ({ skinType, concern }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getProductRecommendations({ skin_type: skinType, concern });
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch product recommendations", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [skinType, concern]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white h-64 rounded-2xl border border-slate-100"></div>
                ))}
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <FaShoppingCart />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Prescribed Formulations</h3>
                    <p className="text-xs text-slate-500 font-medium">Curated products specifically matched to your profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                        <div className="relative h-48 bg-slate-50 flex items-center justify-center p-6 bg-white overflow-hidden">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400"; // High-quality generic skincare placeholder
                                }}
                            />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-indigo-600 shadow-sm flex items-center gap-1 border border-indigo-50">
                                <FaStar className="text-amber-400" /> {product.rating}
                            </div>
                            {product.match_score && (
                                <div className="absolute top-3 left-3 bg-indigo-600 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-lg">
                                    {product.match_score}% MATCH
                                </div>
                            )}
                        </div>

                        <div className="p-5">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{product.brand}</p>
                            <h4 className="text-sm font-bold text-slate-800 mb-2 line-clamp-2 h-10 leading-tight">{product.name}</h4>

                            <div className="flex items-center justify-between mt-4">
                                <div className="text-lg font-black text-slate-900">
                                    {product.currency === 'INR' ? '₹' : product.currency}{product.price}
                                </div>
                                <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg"
                                >
                                    <FaExternalLinkAlt size={12} />
                                </a>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                                <FaCheckCircle className="text-emerald-500 text-xs" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified for {skinType} skin</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-center">
                <Link
                    to="/dashboard/products"
                    className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline hover:scale-105 transition-all flex items-center gap-2"
                >
                    View all recommendations →
                </Link>
            </div>
        </div>
    );
};

export default ProductRecommendations;
