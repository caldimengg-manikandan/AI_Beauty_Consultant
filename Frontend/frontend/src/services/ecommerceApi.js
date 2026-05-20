import api from './api';

export const getProducts = async () => {
  const res = await api.get('/api/ecommerce/products');
  return res.data;
};

export const getCart = async () => {
  const res = await api.get('/api/ecommerce/cart');
  return res.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const res = await api.post('/api/ecommerce/cart', { product_id: productId, quantity });
  return res.data;
};

export const removeFromCart = async (productId) => {
  const res = await api.delete(`/api/ecommerce/cart/${productId}`);
  return res.data;
};

export const checkoutCart = async (shippingAddress, paymentMethod = 'card') => {
  const res = await api.post('/api/ecommerce/checkout', { shipping_address: shippingAddress, payment_method: paymentMethod });
  return res.data;
};

export const getMyOrders = async () => {
  const res = await api.get('/api/ecommerce/orders');
  return res.data;
};
