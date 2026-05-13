import React, { useState } from 'react';
import { FaLock, FaCreditCard, FaCheckCircle, FaSpinner } from 'react-icons/fa';
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
        { booking_id: bookingId, amount, currency: 'INR' },
        { headers }
      );

      // If backend is in mock mode (no Razorpay keys configured)
      if (order.is_mock) {
        // Simulate payment success
        const { data: verified } = await axios.post(
          `${API_BASE}/api/payments/verify`,
          {
            booking_id: bookingId,
            razorpay_order_id: order.order_id,
            razorpay_payment_id: 'mock_pay_' + Date.now(),
            razorpay_signature: 'mock_signature',
          },
          { headers }
        );
        onSuccess?.({ ...verified, isMock: true });
        setLoading(false);
        return;
      }

      // 2. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
      }

      // 3. Open Razorpay checkout
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'GlowAI Beauty Platform',
        description: `${serviceName} at ${salonName}`,
        order_id: order.order_id,
        prefill: {
          name: customerName,
          email: customerEmail,
        },
        theme: {
          color: '#9333ea', // Purple to match app theme
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onError?.({ message: 'Payment cancelled by user' });
          },
        },
        handler: async (response) => {
          try {
            // 4. Verify payment on backend
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

  return (
    <button
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
          Processing Payment...
        </>
      ) : (
        <>
          <FaLock className="text-white/80" />
          Pay ₹{amount.toLocaleString('en-IN')} — Confirm Booking
          <FaCreditCard className="text-white/80" />
        </>
      )}
    </button>
  );
};

export default PaymentButton;
