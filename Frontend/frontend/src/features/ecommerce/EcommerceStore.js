import React, { useState, useEffect, useCallback } from 'react';
import { FiShoppingBag, FiShoppingCart, FiX, FiCheckCircle, FiMinus, FiPlus, FiMapPin, FiCreditCard, FiSearch, FiFilter, FiStar } from 'react-icons/fi';
import { getProducts, getCart, addToCart, removeFromCart, checkoutCart, getMyOrders } from '../../services/ecommerceApi';
import { toast } from 'react-toastify';

export default function EcommerceStore() {
  const [activeTab, setActiveTab] = useState('shop'); // shop | orders
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  // Cart state
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');

  const loadData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      
      const [prodRes, cartRes, orderRes] = await Promise.all([
        getProducts({ page, limit: 12, search, sort_by: sortBy }),
        getCart(), 
        getMyOrders()
      ]);
      
      // Handle the new paginated response format
      if (prodRes && prodRes.products) {
        setProducts(prodRes.products);
        setTotalPages(prodRes.pages);
      } else if (Array.isArray(prodRes)) {
        // Fallback if backend isn't updated yet
        setProducts(prodRes);
      }
      
      setCart(cartRes);
      setOrders(orderRes);
    } catch (e) { 
      if (!isBackground) toast.error('Failed to load store data'); 
    } finally { 
      setLoading(false); 
      setRefreshing(false);
    }
  }, [page, search, sortBy]);

  // Initial load & dependency changes
  useEffect(() => { loadData(false); }, [loadData]);

  // Real-time polling & window focus
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 60000);
    
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
      const newCart = await getCart();
      setCart(newCart);
      setShowCart(true);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      setCart(await getCart());
    } catch (e) { toast.error('Failed to remove item'); }
  };

  const handleCheckout = async () => {
    if (!shippingAddress) return toast.warning('Shipping address is required');
    if (cart.items.length === 0) return toast.warning('Cart is empty');
    
    setCheckingOut(true);
    try {
      await checkoutCart(shippingAddress);
      toast.success('Order placed successfully!');
      setShowCart(false);
      setShippingAddress('');
      loadData();
      setActiveTab('orders');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const totalItems = cart.items?.reduce((sum, item) => sum + item.cart_quantity, 0) || 0;

  // Mock a stable rating based on product ID
  const getMockRating = (id) => {
    const seed = id.charCodeAt(id.length - 1) || 5;
    return (4.0 + (seed % 10) / 10).toFixed(1);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FiShoppingBag className="text-purple-600" /> Beauty Store
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            Premium products from top salons delivered to you. 
            {refreshing && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full animate-pulse">Syncing...</span>}
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('shop')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'shop' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Marketplace</button>
            <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>My Orders</button>
          </div>
          <button 
            onClick={() => setShowCart(true)}
            className="relative flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors"
          >
            <FiShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{totalItems}</span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'shop' && (
        <div className="space-y-6">
          {/* Filters & Sorting */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 w-full md:w-auto">
                <FiFilter className="text-purple-500" /> Sort By:
                <select 
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="bg-transparent border-none outline-none font-black text-slate-900 cursor-pointer"
                >
                  <option value="latest">New Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Skeletons
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
                  <div className="aspect-square bg-slate-100 animate-pulse"></div>
                  <div className="p-5 flex-1 flex flex-col space-y-3">
                    <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                    <div className="h-5 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse mt-auto"></div>
                    <div className="h-10 bg-slate-100 rounded-full w-full animate-pulse mt-2"></div>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <FiShoppingBag className="text-4xl text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-600">No products found</h3>
                <p className="text-sm text-slate-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col relative">
                  {/* Vendor Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full text-slate-700 shadow-sm border border-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {p.vendor_name}
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 z-10 bg-slate-900 text-white text-[10px] font-black tracking-widest px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <FiStar className="fill-amber-400 text-amber-400" size={10} /> {getMockRating(p.id)}
                  </div>

                  <div className="aspect-square bg-slate-50 flex items-center justify-center relative p-6 overflow-hidden">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.item_name)}&background=f8fafc&color=6366f1&size=256`} 
                      alt={p.item_name} 
                      className="w-full h-full object-contain rounded-xl mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                    />
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">{p.category}</div>
                    <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 line-clamp-2">{p.item_name}</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mb-4 flex-1">SKU: {p.sku}</div>
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Price</div>
                        <div className="text-xl font-black text-slate-900">₹{p.unit_price}</div>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(p)}
                        disabled={p.quantity_in_stock <= 0}
                        className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-md"
                      >
                        <FiPlus className="group-hover/btn:scale-125 transition-transform" />
                      </button>
                    </div>
                    {p.quantity_in_stock <= 5 && p.quantity_in_stock > 0 && (
                      <div className="text-[10px] font-bold text-rose-500 mt-2 text-right">Only {p.quantity_in_stock} left!</div>
                    )}
                    {p.quantity_in_stock <= 0 && (
                      <div className="text-[10px] font-bold text-slate-400 mt-2 text-right">Out of Stock</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-slate-100">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <div className="text-sm font-bold text-slate-400">
                Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab & Cart modal logic remain essentially identical with stylistic fixes */}
      {activeTab === 'orders' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {orders.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <FiShoppingBag className="text-4xl text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-600">No orders yet</h3>
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div>
                    <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Order ID</div>
                    <div className="font-mono text-sm font-bold text-slate-900">{o.id}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">{o.status}</span>
                    <div className="text-xl font-black text-slate-900 mt-2">₹{o.total_amount}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{item.item_name}</div>
                        <div className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.unit_price}</div>
                      </div>
                      <div className="font-black text-slate-900">₹{item.subtotal}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 flex items-start gap-2 text-sm text-slate-600">
                  <FiMapPin className="text-slate-400 shrink-0 mt-1" />
                  <p><span className="font-bold block text-slate-800">Delivery Address:</span> {o.shipping_address}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cart Sidebar Modal */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowCart(false)}></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><FiShoppingCart className="text-purple-600" /> Your Cart</h2>
              <button onClick={() => setShowCart(false)} aria-label="Close cart" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"><FiX /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {cart.items?.length === 0 ? (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                  <FiShoppingCart className="text-4xl text-slate-300 mb-3" />
                  <p className="font-bold">Your cart is empty.</p>
                </div>
              ) : (
                cart.items?.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 shadow-sm relative pr-10 group">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2 border border-slate-100">
                       <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.item_name)}&background=fff&color=6366f1`} alt="img" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{item.item_name}</h4>
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-1">{item.vendor_name}</div>
                      <div className="text-sm font-black text-slate-900 mt-2">₹{item.unit_price} <span className="text-xs text-slate-400 font-medium ml-1">x {item.cart_quantity}</span></div>
                    </div>
                    <button onClick={() => handleRemove(item.id)} aria-label="Remove item" className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors p-1 opacity-0 group-hover:opacity-100"><FiX size={16}/></button>
                  </div>
                ))
              )}

              {(cart.items?.length || 0) > 0 && (
                <div className="mt-8 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FiMapPin /> Delivery Address</label>
                    <textarea 
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      placeholder="Enter full shipping address with pincode..."
                      className="w-full p-4 text-sm bg-white border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500 outline-none h-24 shadow-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FiCreditCard /> Payment Method</label>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-sm shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-slate-700"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Secure Checkout</div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Card / UPI</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-3xl font-black text-slate-900">₹{cart.total}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={(cart.items?.length || 0) === 0 || checkingOut}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black tracking-wide hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
              >
                {checkingOut ? 'Processing securely...' : 'Complete Order'} <FiCheckCircle className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
