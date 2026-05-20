import api from './api';

export const getB2BCatalog = async () => {
  const res = await api.get('/api/supply-chain/catalog');
  return res.data;
};

export const getB2BOrders = async () => {
  const res = await api.get('/api/supply-chain/orders');
  return res.data;
};

export const placeB2BOrder = async (orderData) => {
  const res = await api.post('/api/supply-chain/order', orderData);
  return res.data;
};
