import React, { useState, useEffect } from 'react';
import { getFeaturedProducts } from '../services/api';
import { FaShoppingCart, FaStar, FaExternalLinkAlt, FaFilter, FaSearch, FaChevronLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';

const ProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                setLoading(true);
                // Fetch the full list of products for the catalog
                const data = await getFeaturedProducts();
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllProducts();
    }, []);

    const categories = ['All', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Exfoliant'];

    const filteredProducts = products.filter(p => {
        const matchesCategory = filter === 'All' || p.category === filter;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="p-6 md:p-10 space-y-10 animate-fade-in bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <Link to="/dashboard" className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-4 hover:gap-3 transition-all">
                        <FaChevronLeft /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic underline decoration-indigo-500 decoration-8 underline-offset-8">
                        Product<span className="text-indigo-600">Curations</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium">Browse professional-grade skincare endorsed by our AI diagnostics.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search brands or products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-64 outline-none font-medium text-slate-700 dark:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} height={400} borderRadius={30} />)}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group border-b-8 border-b-transparent hover:border-b-indigo-500">
                            <div className="relative h-56 bg-white overflow-hidden flex items-center justify-center p-8">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400";
                                    }}
                                />
                                <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black text-amber-500 shadow-md flex items-center gap-1 border border-amber-100 dark:border-amber-900/30">
                                    <FaStar /> {product.rating}
                                </div>
                                <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg">
                                    {product.category.toUpperCase()}
                                </div>
                            </div>

                            <div className="p-8">
                                <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{product.brand}</p>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 line-clamp-2 leading-tight h-14 italic">{product.name}</h4>

                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        ₹{product.price}
                                    </div>
                                    <a
                                        href={product.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                                    >
                                        <FaExternalLinkAlt size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🔎</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">No products found for "{searchQuery}"</h3>
                    <p className="text-slate-500 mt-2 font-medium">Try adjusting your filters or search keywords.</p>
                </div>
            )}
        </div>
    );
};

export default ProductCatalog;
