import api from './api';

export const requestLeave = async (data) => {
  const res = await api.post('/api/hr/leaves', data);
  return res.data;
};

export const getLeavesList = async () => {
  const res = await api.get('/api/hr/leaves');
  return res.data;
};

export const updateLeaveStatus = async (leaveId, status) => {
  const res = await api.put(`/api/hr/leaves/${leaveId}`, { status });
  return res.data;
};

export const calculatePayroll = async (month) => {
  const res = await api.post('/api/hr/payroll/calculate', { month });
  return res.data;
};
