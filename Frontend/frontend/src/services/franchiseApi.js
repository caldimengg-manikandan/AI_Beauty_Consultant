/**
 * franchiseApi.js — Franchise HQ API Service Layer
 * Maps to backend /api/franchise routes
 */
import api from './api';

export const getFranchiseDashboard = () =>
  api.get('/api/franchise/dashboard').then(r => r.data);

export const transferStaff = (staffId, fromBranchId, toBranchId) =>
  api.post('/api/franchise/transfer-staff', null, {
    params: { staff_id: staffId, from_branch_id: fromBranchId, to_branch_id: toBranchId }
  }).then(r => r.data);
