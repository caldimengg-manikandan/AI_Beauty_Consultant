import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiShield, FiCreditCard, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * RazorpayCheckout — Universal payment modal
 *
 * Props:
 *   bookingId   : string — The slot booking ID to pay for
 *   amount      : number — Amount in INR
 *   description : string — Payment description (e.g. "Facial at Bliss Salon")
 *   salonName   : string — Displayed in modal
 *   appointmentDate : string
 *   appointmentTime : string
 *   onSuccess   : (paymentId) => void — Called after successful payment
 *   onClose     : () => void — Called when modal is dismissed
 */
export default function RazorpayCheckout({
  bookingId,
  amount,
  description,
  salonName,
  appointmentDate,
  appointmentTime,
  onSuccess,
  onClose,
}) {
  const [step, setStep] = useState('confirm');   // confirm | processing | success | failed
  const [paymentId, setPaymentId] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  // Load Razorpay script dynamically
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handlePayNow = async () => {
    setStep('processing');
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await api.post('/api/payments/create-order', {
        booking_id: bookingId,
        amount: amount,
        currency: 'INR',
        description: description,
      });
      const { order_id, amount: orderAmount, key, is_demo } = orderRes.data;
      setIsDemo(is_demo);

      // 2a. Demo mode — skip Razorpay SDK, go directly to verify
      if (is_demo || key === 'rzp_test_demo') {
        const verifyRes = await api.post('/api/payments/verify', {
          booking_id: bookingId,
          razorpay_order_id: order_id,
          razorpay_payment_id: 'demo_pay_' + Date.now(),
          razorpay_signature: 'demo_signature',
        });
        if (verifyRes.data.status === 'success') {
          setPaymentId('demo_pay_' + Date.now());
          setStep('success');
          onSuccess && onSuccess('demo_payment');
        }
        return;
      }

      // 2b. Real Razorpay checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Razorpay SDK failed to load');

      const configRes = await api.get('/api/payments/config');
      const prefill = orderRes.data.prefill || {};

      const options = {
        key: key || configRes.data.key_id,
        amount: orderAmount,
        currency: 'INR',
        name: salonName || 'GlowAI Beauty',
        description: description || 'Salon Service Booking',
        order_id: order_id,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => {
            setStep('confirm');
          }
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/api/payments/verify', {
              booking_id: bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.status === 'success') {
              setPaymentId(response.razorpay_payment_id);
              setStep('success');
              onSuccess && onSuccess(response.razorpay_payment_id);
            }
          } catch {
            setStep('failed');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setStep('failed'));
      rzp.open();
      setStep('confirm'); // Will be overridden by handler

    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment initiation failed');
      setStep('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Confirm Payment</p>
            <h3 className="text-xl font-black mt-0.5">{salonName || 'Salon Booking'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <FiX size={16} />
          </button>
        </div>

        <div className="p-6">

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="space-y-5">
              {/* Booking Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service</span>
                  <span className="font-semibold text-slate-900">{description}</span>
                </div>
                {appointmentDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-900">{appointmentDate}</span>
                  </div>
                )}
                {appointmentTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Time</span>
                    <span className="font-semibold text-slate-900">{appointmentTime}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-slate-700">Total Amount</span>
                  <span className="text-2xl font-black text-purple-600">₹{amount}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FiShield size={14} className="text-green-500" />
                Secured by Razorpay · UPI, Cards, NetBanking accepted
              </div>

              <button onClick={handlePayNow}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                <FiCreditCard size={18} />
                Pay ₹{amount} Now
              </button>
              <button onClick={onClose}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="py-10 text-center">
              <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h4 className="font-bold text-slate-800 text-lg">Processing Payment...</h4>
              <p className="text-slate-400 text-sm mt-1">Please do not close this window</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck size={32} className="text-green-600" />
              </div>
              <h4 className="font-black text-slate-900 text-xl mb-2">Booking Confirmed! 🎉</h4>
              <p className="text-slate-500 text-sm mb-1">Your appointment is all set.</p>
              {isDemo && (
                <p className="text-xs text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full inline-block mt-2">
                  Demo payment recorded
                </p>
              )}
              {paymentId && !isDemo && (
                <p className="text-xs text-slate-400 mt-2">Payment ID: {paymentId}</p>
              )}
              <button onClick={onClose}
                className="mt-6 w-full py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors">
                Done
              </button>
            </div>
          )}

          {/* Failed Step */}
          {step === 'failed' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle size={32} className="text-red-500" />
              </div>
              <h4 className="font-black text-slate-900 text-xl mb-2">Payment Failed</h4>
              <p className="text-slate-500 text-sm mb-4">Something went wrong. Please try again.</p>
              <button onClick={() => setStep('confirm')}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors">
                Try Again
              </button>
              <button onClick={onClose}
                className="mt-3 w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
