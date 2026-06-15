import React, { useState } from 'react';
import { FaLock, FaCreditCard, FaCheckCircle, FaSpinner, FaShieldAlt, FaTimes, FaRupeeSign } from 'react-icons/fa';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Razorpay Payment Button Component
 *
 * Props:
 * - bookingId: string (required)
 * - amount: number (in INR, e.g. 499)
 * - salonName: string
 * - serviceName: string
 * - customerName: string
 * - customerEmail: string (optional)
 * - onSuccess: (paymentData) => void
 * - onError: (error) => void
 */
const PaymentButton = ({
  bookingId,
  amount,
  salonName,
  serviceName,
  customerName,
  customerEmail = '',
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoOrder, setDemoOrder] = useState(null);
  const [processingDemo, setProcessingDemo] = useState(false);
  const [demoStep, setDemoStep] = useState('confirm'); // 'confirm' | 'processing' | 'done'

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Create order on backend
      const { data: order } = await axios.post(
        `${API_BASE}/api/payments/create-order`,
        { booking_id: bookingId, amount, currency: 'INR', description: `${serviceName} at ${salonName}` },
        { headers }
      );

      // If backend is in demo mode (no Razorpay keys configured)
      if (order.is_mock || order.is_demo) {
        setDemoOrder(order);
        setDemoStep('confirm');
        setShowDemoModal(true);
        setLoading(false);
        return;
      }

      // 2. Load Razorpay script for real payments
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
      }

      // 3. Open Razorpay checkout
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'AI Beauty Platform',
        description: `${serviceName} at ${salonName}`,
        order_id: order.order_id,
        prefill: {
          name: customerName || order.prefill?.name,
          email: customerEmail || order.prefill?.email,
        },
        theme: {
          color: '#9333ea',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onError?.({ message: 'Payment cancelled by user' });
          },
        },
        handler: async (response) => {
          try {
            const { data: verified } = await axios.post(
              `${API_BASE}/api/payments/verify`,
              {
                booking_id: bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers }
            );
            onSuccess?.(verified);
          } catch (verifyError) {
            onError?.(verifyError);
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setLoading(false);
      onError?.(err);
    }
  };

  const handleDemoConfirm = async () => {
    setDemoStep('processing');
    setProcessingDemo(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Simulate processing delay for UX
      await new Promise(r => setTimeout(r, 1800));

      const { data: verified } = await axios.post(
        `${API_BASE}/api/payments/verify`,
        {
          booking_id: bookingId,
          razorpay_order_id: demoOrder.order_id,
          razorpay_payment_id: 'demo_pay_' + Date.now(),
          razorpay_signature: 'demo_signature',
        },
        { headers }
      );

      setDemoStep('done');
      await new Promise(r => setTimeout(r, 1200));
      setShowDemoModal(false);
      onSuccess?.({ ...verified, isMock: true });
    } catch (err) {
      setShowDemoModal(false);
      onError?.(err);
    } finally {
      setProcessingDemo(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
          loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl hover:scale-[1.01]'
        }`}
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin" />
            Connecting to Payment...
          </>
        ) : (
          <>
            <FaLock className="text-white/80" />
            Pay ₹{Number(amount).toLocaleString('en-IN')} — Confirm Booking
            <FaCreditCard className="text-white/80" />
          </>
        )}
      </button>

      {/* Demo Payment Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.3s_ease]">

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 text-white relative">
              {demoStep === 'confirm' && (
                <button
                  onClick={() => { setShowDemoModal(false); setLoading(false); }}
                  className="absolute top-4 right-4 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <FaShieldAlt className="text-lg" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">AI Beauty Pay</p>
                  <p className="font-bold text-lg leading-tight">Secure Payment</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {demoStep === 'confirm' && (
                <>
                  {/* Amount */}
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount to Pay</p>
                    <div className="flex items-center justify-center gap-1">
                      <FaRupeeSign className="text-2xl font-bold text-gray-800" />
                      <span className="text-4xl font-black text-gray-900">{Number(amount).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">INR</p>
                  </div>

                  {/* Details */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service</span>
                      <span className="font-semibold text-gray-800">{serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Salon</span>
                      <span className="font-semibold text-gray-800">{salonName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-semibold text-gray-800">{customerName}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-gray-500">Booking Ref</span>
                      <span className="font-mono font-bold text-purple-700 text-xs">{bookingId}</span>
                    </div>
                  </div>

                  {/* Demo notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 flex gap-2">
                    <span className="text-base">🔧</span>
                    <span><strong>Demo Mode:</strong> No real money will be charged. Add your Razorpay API keys in <code className="bg-amber-100 px-1 rounded">.env</code> for live payments.</span>
                  </div>

                  <button
                    onClick={handleDemoConfirm}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <FaLock className="text-sm" />
                    Confirm & Pay ₹{Number(amount).toLocaleString('en-IN')}
                  </button>

                  <button
                    onClick={() => { setShowDemoModal(false); }}
                    className="w-full py-2 mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {demoStep === 'processing' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaSpinner className="text-purple-600 text-2xl animate-spin" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">Processing Payment...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait, do not close this window.</p>
                </div>
              )}

              {demoStep === 'done' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <FaCheckCircle className="text-green-500 text-3xl" />
                  </div>
                  <p className="font-bold text-green-800 text-lg">Payment Successful! 🎉</p>
                  <p className="text-sm text-gray-500 mt-1">Your booking is confirmed!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentButton;
