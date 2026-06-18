import React, { useState } from 'react';
import { FiX, FiShoppingCart, FiTrash2, FiMinus, FiPlus, FiPackage, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

/**
 * CartDrawer — Slide-in cart panel
 * Usage: <CartDrawer open={open} onClose={() => setOpen(false)} />
 */
export default function CartDrawer({ open, onClose }) {
  const { items, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', pincode: '' });
  const [step, setStep] = useState('cart');   // cart | address | success
  const [orderRef, setOrderRef] = useState('');

  const freeDeliveryThreshold = 499;
  const deliveryFee = cartTotal >= freeDeliveryThreshold ? 0 : 49;
  const grandTotal = cartTotal + deliveryFee;

  const handleCheckout = async () => {
    if (!address.street || !address.city || !address.pincode) {
      toast.error('Please fill in all address fields');
      return;
    }
    setCheckingOut(true);
    try {
      const payload = {
        items: items.map(i => ({
          product_id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price || i.selling_price || 0,
          image_url: i.image_url || i.image || null,
        })),
        delivery_address: address.street,
        delivery_city: address.city,
        delivery_pincode: address.pincode,
        payment_method: 'cod',
      };
      const res = await api.post('/api/orders/create', payload);
      setOrderRef(res.data.order_ref);
      clearCart();
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setCheckingOut(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-600 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            <FiShoppingCart size={20} />
            <div>
              <h3 className="font-black text-lg">Your Cart</h3>
              <p className="text-white/70 text-xs">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <FiX size={16} />
          </button>
        </div>

        {/* ── CART Step ──────────────────────────────────────────────── */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="py-20 text-center">
                  <FiShoppingCart size={48} className="text-slate-200 mx-auto mb-4" />
                  <p className="font-semibold text-slate-500">Your cart is empty</p>
                  <p className="text-sm text-slate-400 mt-1">Add products from the store</p>
                  <button onClick={onClose}
                    className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Free delivery progress */}
                  {cartTotal < freeDeliveryThreshold && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                      <div className="flex justify-between text-xs text-amber-700 font-semibold mb-1.5">
                        <span>Add ₹{freeDeliveryThreshold - cartTotal} more for FREE delivery</span>
                        <span>₹{freeDeliveryThreshold}</span>
                      </div>
                      <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${Math.min((cartTotal / freeDeliveryThreshold) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {cartTotal >= freeDeliveryThreshold && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-xs text-green-700 font-semibold text-center">
                      🎉 You've unlocked FREE delivery!
                    </div>
                  )}

                  {/* Cart Items */}
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                      {item.image_url || item.image ? (
                        <img src={item.image_url || item.image} alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <FiPackage size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                        <p className="text-purple-600 font-black text-sm">
                          ₹{((item.price || item.selling_price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity"
                          className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
                          <FiMinus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity"
                          className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
                          <FiPlus size={12} />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} aria-label="Remove item from cart"
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors ml-1">
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery</span>
                    <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 text-base pt-1 border-t border-slate-100">
                    <span>Total</span><span className="text-purple-600">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setStep('address')}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black rounded-2xl hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                  Proceed to Checkout <FiArrowRight size={16} />
                </button>
                <button onClick={clearCart}
                  className="w-full py-2 text-xs text-red-400 hover:text-red-600 transition-colors">
                  Clear Cart
                </button>
              </div>
            )}
          </>
        )}

        {/* ── ADDRESS Step ────────────────────────────────────────────── */}
        {step === 'address' && (
          <div className="flex-1 flex flex-col p-5 gap-4">
            <div>
              <button onClick={() => setStep('cart')} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
                ← Back to Cart
              </button>
              <h3 className="font-black text-slate-900 text-lg mb-1">Delivery Address</h3>
              <p className="text-sm text-slate-400">Enter where you want your products delivered</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Street Address</label>
                <input type="text" placeholder="House no, Street, Area"
                  value={address.street} onChange={e => setAddress({...address, street: e.target.value})}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">City</label>
                  <input type="text" placeholder="Chennai"
                    value={address.city} onChange={e => setAddress({...address, city: e.target.value})}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pincode</label>
                  <input type="text" placeholder="600001"
                    value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>
            <div className="mt-auto space-y-3">
              <div className="bg-slate-50 rounded-2xl p-3 text-sm">
                <div className="flex justify-between font-black text-slate-900">
                  <span>Total to Pay</span>
                  <span className="text-purple-600">₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Cash on Delivery</div>
              </div>
              <button onClick={handleCheckout} disabled={checkingOut}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black rounded-2xl hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                {checkingOut ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order...</>
                ) : (
                  <>Place Order ₹{grandTotal.toLocaleString()} <FiArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS Step ────────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="font-black text-slate-900 text-2xl mb-2">Order Placed!</h3>
            <p className="text-slate-500 mb-1">Your order has been confirmed.</p>
            <div className="bg-slate-50 px-5 py-3 rounded-xl mt-3 mb-6">
              <p className="text-xs text-slate-400">Order ID</p>
              <p className="font-black text-purple-600 text-lg">{orderRef}</p>
            </div>
            <p className="text-sm text-slate-400 mb-6">Expected delivery: 3–5 business days</p>
            <button onClick={() => { setStep('cart'); onClose(); }}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
