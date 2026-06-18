import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

/**
 * CartProvider — Global cart state for the product catalog.
 * Persists cart to localStorage on every change.
 */
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('glowai_cart') || '[]');
    } catch {
      return [];
    }
  });

  const persist = (newItems) => {
    setItems(newItems);
    localStorage.setItem('glowai_cart', JSON.stringify(newItems));
  };

  const addToCart = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
        toast.success(`${product.name} qty updated`);
      } else {
        updated = [...prev, { ...product, quantity }];
        toast.success(`${product.name} added to cart`);
      }
      localStorage.setItem('glowai_cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== productId);
      localStorage.setItem('glowai_cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev => {
      const updated = prev.map(i => i.id === productId ? { ...i, quantity } : i);
      localStorage.setItem('glowai_cart', JSON.stringify(updated));
      return updated;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('glowai_cart');
  }, []);

  const cartTotal = items.reduce((sum, i) => sum + (i.price || i.selling_price || 0) * i.quantity, 0);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
