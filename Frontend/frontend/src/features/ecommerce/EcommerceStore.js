import React, { useState, useEffect, useCallback } from 'react';
import { FiShoppingBag, FiShoppingCart, FiX, FiCheckCircle, FiMinus, FiPlus, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { getProducts, getCart, addToCart, removeFromCart, checkoutCart, getMyOrders } from '../../services/ecommerceApi';
import { toast } from 'react-toastify';

export default function EcommerceStore() {
  const [activeTab, setActiveTab] = useState('shop'); // shop | orders
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cart state
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, cartRes, orderRes] = await Promise.all([
        getProducts(), getCart(), getMyOrders()
      ]);
      setProducts(prodRes);
      setCart(cartRes);
      setOrders(orderRes);
    } catch (e) { toast.error('Failed to load store data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  const totalItems = cart.items.reduce((sum, item) => sum + item.cart_quantity, 0);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FiShoppingBag className="text-purple-600" /> Beauty Store
          </h1>
          <p className="text-sm text-slate-500 mt-1">Premium products from top salons delivered to you.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('shop')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'shop' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Shop</button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-400">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <FiShoppingBag className="text-4xl text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-600">No products available</h3>
              <p className="text-sm text-slate-400">Check back later for new arrivals.</p>
            </div>
          ) : (
            products.map(p => (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                <div className="aspect-square bg-slate-50 flex items-center justify-center relative p-6">
                  {/* Placeholder for Product Image */}
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.item_name)}&background=f3f4f6&color=6366f1&size=200`} alt={p.item_name} className="w-full h-full object-contain rounded-xl mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full text-slate-600 shadow-sm border border-slate-200/50">
                    {p.vendor_name}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">{p.category}</div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 line-clamp-2">{p.item_name}</h3>
                  <div className="text-xs text-slate-400 mb-4 flex-1">SKU: {p.sku}</div>
                  
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Price</div>
                      <div className="text-xl font-black text-slate-900">₹{p.unit_price}</div>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(p)}
                      disabled={p.quantity_in_stock <= 0}
                      className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
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
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest rounded-full">{o.status}</span>
                    <div className="text-xl font-black text-slate-900 mt-2">₹{o.total_amount}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
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
                  <p><span className="font-bold block">Delivery Address:</span> {o.shipping_address}</p>
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
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><FiShoppingCart /> Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"><FiX /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {cart.items.length === 0 ? (
                <div className="text-center py-10 text-slate-400">Your cart is empty.</div>
              ) : (
                cart.items.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 shadow-sm relative pr-10">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2 border border-slate-100">
                       <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.item_name)}&background=fff&color=6366f1`} alt="img" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{item.item_name}</h4>
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-1">{item.vendor_name}</div>
                      <div className="text-sm font-black text-slate-900 mt-2">₹{item.unit_price} <span className="text-xs text-slate-400 font-medium ml-1">x {item.cart_quantity}</span></div>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-1"><FiX size={16}/></button>
                  </div>
                ))
              )}

              {cart.items.length > 0 && (
                <div className="mt-8 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><FiMapPin /> Delivery Address</label>
                    <textarea 
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      placeholder="Enter full shipping address with pincode..."
                      className="w-full p-4 text-sm bg-white border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500 outline-none h-24 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><FiCreditCard /> Payment</label>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-sm shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-slate-700"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Card / UPI</div>
                      <span className="text-xs text-slate-400">At Checkout</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                <span className="text-3xl font-black text-slate-900">₹{cart.total}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.items.length === 0 || checkingOut}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black tracking-wide hover:bg-purple-600 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingOut ? 'Processing...' : 'Secure Checkout'} <FiCheckCircle />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
