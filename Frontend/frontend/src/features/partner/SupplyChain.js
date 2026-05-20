import React, { useState, useEffect, useCallback } from 'react';
import { FiBox, FiTruck, FiCreditCard, FiCheckCircle, FiShoppingCart, FiRefreshCw } from 'react-icons/fi';
import { getB2BCatalog, getB2BOrders, placeB2BOrder } from '../../services/supplyChainApi';
import { toast } from 'react-toastify';

export default function SupplyChain() {
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState({}); // { product_id: quantity }
  const [useFinancing, setUseFinancing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, ordRes] = await Promise.all([getB2BCatalog(), getB2BOrders()]);
      setCatalog(catRes);
      setOrders(ordRes);
    } catch (e) {
      toast.error('Failed to load supply chain data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const prod = catalog.find(p => p.id === id);
    return total + (prod ? prod.price * qty : 0);
  }, 0);

  const handleCheckout = async () => {
    const items = Object.entries(cart).map(([id, qty]) => ({ product_id: id, quantity: qty }));
    if (items.length === 0) return toast.warning("Cart is empty");

    try {
      await placeB2BOrder({ items, use_invoice_financing: useFinancing });
      toast.success("B2B Order placed successfully!");
      setCart({});
      setUseFinancing(false);
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to place order");
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up p-2">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FiBox className="text-indigo-500" /> B2B Supply Chain
          </h2>
          <p className="text-slate-500 text-sm mt-1">Wholesale ordering, auto-replenishment, and Net-30 invoice financing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Wholesale Catalog</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalog.map(prod => (
              <div key={prod.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="h-40 bg-slate-100 overflow-hidden relative">
                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                  {prod.auto_replenish_eligible && (
                    <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg flex items-center gap-1">
                      <FiRefreshCw /> Auto-Restock
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{prod.category} • {prod.supplier}</div>
                  <h4 className="font-bold text-slate-900 leading-tight mb-2">{prod.name}</h4>
                  <div className="text-lg font-black text-slate-900 mt-auto">₹{prod.price.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mb-4">MOQ: {prod.moq} • In Stock: {prod.in_stock}</div>
                  
                  <div className="flex items-center gap-2">
                    {cart[prod.id] ? (
                      <div className="flex items-center justify-between w-full bg-slate-100 rounded-xl p-1">
                        <button onClick={() => removeFromCart(prod.id)} className="w-8 h-8 flex justify-center items-center bg-white rounded-lg font-bold shadow-sm">-</button>
                        <span className="font-bold text-sm">{cart[prod.id]}</span>
                        <button onClick={() => addToCart(prod)} className="w-8 h-8 flex justify-center items-center bg-white rounded-lg font-bold shadow-sm">+</button>
                      </div>
                    ) : (
                      <button onClick={() => {
                        for(let i=0; i<prod.moq; i++) addToCart(prod); // auto add MOQ
                      }} className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
                        Add to Order (MOQ {prod.moq})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Cart & Orders */}
        <div className="space-y-6">
          {/* Cart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"><FiShoppingCart /> Current Order</h3>
            
            {Object.keys(cart).length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">Cart is empty</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(cart).map(([id, qty]) => {
                  const p = catalog.find(x => x.id === id);
                  if (!p) return null;
                  return (
                    <div key={id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <div className="truncate pr-4 flex-1">
                        <span className="font-bold text-slate-900">{qty}x</span> <span className="text-slate-600">{p.name}</span>
                      </div>
                      <div className="font-bold text-slate-900 shrink-0">₹{(p.price * qty).toLocaleString()}</div>
                    </div>
                  );
                })}
                
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 text-sm">Subtotal</span>
                    <span className="font-bold text-slate-900">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  
                  {useFinancing && (
                    <div className="flex justify-between items-center text-indigo-600 mb-1">
                      <span className="text-sm">Financing Fee (2%)</span>
                      <span className="font-bold">₹{Math.floor(cartTotal * 0.02).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                    <span className="font-black text-slate-900 text-lg">Total</span>
                    <span className="font-black text-slate-900 text-lg">
                      ₹{(cartTotal + (useFinancing ? Math.floor(cartTotal * 0.02) : 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useFinancing} 
                      onChange={e => setUseFinancing(e.target.checked)}
                      disabled={cartTotal < 20000}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded"
                    />
                    <div>
                      <div className={`font-bold text-sm ${cartTotal < 20000 ? 'text-slate-400' : 'text-slate-900'}`}>Use Invoice Financing (Net-30)</div>
                      <div className="text-xs text-slate-500 mt-0.5">Pay 30 days later. 2% fee. Orders over ₹20k only.</div>
                    </div>
                  </label>
                </div>

                <button onClick={handleCheckout} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 mt-2">
                  <FiCheckCircle /> Place Order
                </button>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"><FiTruck /> Past Orders</h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900 text-sm">₹{o.grand_total.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs font-bold">
                    <span className={o.status === 'Processing' ? 'text-amber-500' : 'text-emerald-500'}>{o.status}</span>
                    <span className={o.financed ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded' : 'text-slate-500'}>
                      {o.payment_status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div className="text-sm text-slate-400 text-center py-4">No past orders.</div>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
