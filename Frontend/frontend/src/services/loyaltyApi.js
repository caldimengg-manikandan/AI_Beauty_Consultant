/**
 * loyaltyApi.js — Customer Loyalty & Wallet API Service
 * Maps to /api/loyalty endpoints
 */
import api from './api';

export const getWallet = () =>
  api.get('/api/loyalty/wallet').then(r => r.data);

export const earnPoints = (bookingId, amountPaid) =>
  api.post('/api/loyalty/earn', null, {
    params: { booking_id: bookingId, amount_paid: amountPaid }
  }).then(r => r.data);

export const redeemPoints = (pointsToRedeem, bookingId = null) =>
  api.post('/api/loyalty/redeem', null, {
    params: { points_to_redeem: pointsToRedeem, ...(bookingId && { booking_id: bookingId }) }
  }).then(r => r.data);

export const getLoyaltyTransactions = (limit = 20) =>
  api.get('/api/loyalty/transactions', { params: { limit } }).then(r => r.data);

export const getTierInfo = () =>
  api.get('/api/loyalty/tiers').then(r => r.data);

export const applyReferral = (referralCode) =>
  api.post('/api/loyalty/referral/apply', null, {
    params: { referral_code: referralCode }
  }).then(r => r.data);
