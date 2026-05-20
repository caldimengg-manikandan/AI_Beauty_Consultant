/**
 * partnerApi.js — Salon Partner (B2B) API Service Layer
 * Mirrors backend routes: /api/staff, /api/coupons, /api/inventory,
 * /api/invoices, /api/campaigns
 */
import api from './api';

// ─── Staff Management ─────────────────────────────────────────────────────────

export const getStaffList = () =>
  api.get('/api/staff/').then(r => r.data);

export const addStaff = (staffData) =>
  api.post('/api/staff/', staffData).then(r => r.data);

export const updateStaff = (staffId, updates) =>
  api.put(`/api/staff/${staffId}`, updates).then(r => r.data);

export const deactivateStaff = (staffId) =>
  api.delete(`/api/staff/${staffId}`).then(r => r.data);

export const getStaffAttendance = (staffId, month) =>
  api.get(`/api/staff/${staffId}/attendance`, { params: { month } }).then(r => r.data);

export const markAttendance = (record) =>
  api.post('/api/staff/attendance', record).then(r => r.data);

export const getStaffCommissions = (staffId, month) =>
  api.get(`/api/staff/${staffId}/commissions`, { params: { month } }).then(r => r.data);

export const getStaffAnalytics = () =>
  api.get('/api/staff/analytics/overview').then(r => r.data);

// ─── Coupon Management ────────────────────────────────────────────────────────

export const getOwnerCoupons = () =>
  api.get('/api/coupons/owner/list').then(r => r.data);

export const createCoupon = (couponData) =>
  api.post('/api/coupons/owner/create', couponData).then(r => r.data);

export const toggleCoupon = (couponId) =>
  api.patch(`/api/coupons/owner/${couponId}/toggle`).then(r => r.data);

export const deleteCoupon = (couponId) =>
  api.delete(`/api/coupons/owner/${couponId}`).then(r => r.data);

export const getCouponAnalytics = () =>
  api.get('/api/coupons/owner/analytics').then(r => r.data);

export const validateCoupon = (data) =>
  api.post('/api/coupons/validate', data).then(r => r.data);

export const getSalonCoupons = (salonId) =>
  api.get(`/api/coupons/salon/${salonId}`).then(r => r.data);

// ─── Inventory Management ─────────────────────────────────────────────────────

export const getInventory = (params = {}) =>
  api.get('/api/inventory/', { params }).then(r => r.data);

export const addProduct = (productData) =>
  api.post('/api/inventory/', productData).then(r => r.data);

export const updateProduct = (productId, updates) =>
  api.put(`/api/inventory/${productId}`, updates).then(r => r.data);

export const removeProduct = (productId) =>
  api.delete(`/api/inventory/${productId}`).then(r => r.data);

export const adjustStock = (adjustment) =>
  api.post('/api/inventory/adjust', adjustment).then(r => r.data);

export const getLowStockAlerts = () =>
  api.get('/api/inventory/alerts/low-stock').then(r => r.data);

export const getInventoryAnalytics = () =>
  api.get('/api/inventory/analytics/summary').then(r => r.data);

// ─── Invoice / POS ────────────────────────────────────────────────────────────

export const createInvoice = (invoiceData) =>
  api.post('/api/invoices/create', invoiceData).then(r => r.data);

export const getInvoices = (params = {}) =>
  api.get('/api/invoices/', { params }).then(r => r.data);

export const getInvoice = (invoiceId) =>
  api.get(`/api/invoices/${invoiceId}`).then(r => r.data);

export const updatePaymentStatus = (invoiceId, status) =>
  api.patch(`/api/invoices/${invoiceId}/payment-status`, null, { params: { status } }).then(r => r.data);

export const getRevenueAnalytics = (period = 'month') =>
  api.get('/api/invoices/analytics/revenue', { params: { period } }).then(r => r.data);

// ─── Marketing Campaigns ──────────────────────────────────────────────────────

export const getCampaigns = (status) =>
  api.get('/api/campaigns/', { params: status ? { status } : {} }).then(r => r.data);

export const createCampaign = (campaignData) =>
  api.post('/api/campaigns/create', campaignData).then(r => r.data);

export const updateCampaign = (campaignId, updates) =>
  api.put(`/api/campaigns/${campaignId}`, updates).then(r => r.data);

export const sendCampaign = async (id) => {
  const res = await api.post(`/api/campaigns/${id}/send`);
  return res.data;
};

export const generateCampaignCopy = async (params) => {
  const res = await api.post('/api/campaigns/ai-generate', params);
  return res.data;
};

export const getAutomations = async () => {
  const res = await api.get('/api/campaigns/automations');
  return res.data;
};

export const toggleAutomation = async (autoId) => {
  const res = await api.put(`/api/campaigns/automations/${autoId}/toggle`);
  return res.data;
};

// --- INSIGHTS ---
export const getBusinessInsights = async () => {
  const res = await api.get('/api/insights/dashboard');
  return res.data;
};

export const deleteCampaign = (campaignId) =>
  api.delete(`/api/campaigns/${campaignId}`).then(r => r.data);

export const getCampaignAnalytics = () =>
  api.get('/api/campaigns/analytics/overview').then(r => r.data);

// ─── Support Tickets ──────────────────────────────────────────────────────────

export const createTicket = (ticketData) =>
  api.post('/api/support/create', ticketData).then(r => r.data);

export const getMyTickets = (params = {}) =>
  api.get('/api/support/my-tickets', { params }).then(r => r.data);

export const getTicket = (ticketId) =>
  api.get(`/api/support/${ticketId}`).then(r => r.data);

export const replyToTicket = (ticketId, message) =>
  api.post(`/api/support/${ticketId}/reply`, { message }).then(r => r.data);

// Admin support
export const adminGetAllTickets = (params = {}) =>
  api.get('/api/support/admin/all', { params }).then(r => r.data);

export const adminUpdateTicketStatus = (ticketId, status) =>
  api.patch(`/api/support/admin/${ticketId}/status`, null, { params: { status } }).then(r => r.data);

export const getSupportStats = () =>
  api.get('/api/support/admin/stats').then(r => r.data);
