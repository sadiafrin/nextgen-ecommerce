// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// ✅ Context তৈরি করুন (এখানে CartContext export করা হয়েছে)
const CartContext = createContext();

// ✅ Cart Provider কম্পোনেন্ট
export function CartProvider({ children }) {
  // ✅ localStorage থেকে কার্ট ডেটা লোড করুন
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  // ✅ ১. Add to Cart ফাংশন
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  // ✅ ২. Remove from Cart ফাংশন
  const removeFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // ✅ ৩. Quantity আপডেট ফাংশন
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // ✅ ৪. Increase Quantity
  const increaseQuantity = (id) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
      )
    );
  };

  // ✅ ৫. Decrease Quantity
  const decreaseQuantity = (id) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const newQty = (item.quantity || 1) - 1;
          return newQty <= 0 ? null : { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item !== null)
    );
  };

  // ✅ ৬. Clear Cart ফাংশন
  const clearCart = () => {
    setCartItems([]);
  };

  // ✅ ৭. Total Items গণনা
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // ✅ ৮. Total Price গণনা (BDT)
  const totalPrice = cartItems.reduce((sum, item) => {
    const priceString = item.price || '0';
    const price = parseFloat(priceString.replace(/[^0-9.]/g, ''));
    return sum + (price * (item.quantity || 1));
  }, 0);

  // ✅ ৯. Cart Items Count (Badge এর জন্য)
  const cartCount = cartItems.length;

  // ✅ ১০. localStorage-এ সেভ করুন
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  // ✅ ১১. isInCart চেক করুন
  const isInCart = (id) => cartItems.some(item => item.id === id);

  // ✅ ১২. Context Value
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalItems,
    totalPrice,
    cartCount,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ✅ ১৩. Custom Hook - useCart
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// ✅ ১৪. CartContext export (এখানে সঠিকভাবে export করা হয়েছে)
export { CartContext };

// ✅ ১৫. Default Export
export default CartContext;