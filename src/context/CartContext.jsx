// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // ✅ টোটাল প্রাইস ক্যালকুলেট (সঠিক)
  const calculateTotalPrice = useCallback((items) => {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((sum, item) => {
      let price = 0;
      if (typeof item.price === 'string') {
        const cleaned = item.price.replace(/[^0-9.]/g, '');
        price = parseFloat(cleaned) || 0;
      } else {
        price = Number(item.price) || 0;
      }
      const quantity = Number(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  }, []);

  // ✅ টোটাল আইটেম কাউন্ট
  const calculateTotalItems = useCallback((items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, []);

  // ✅ টোটাল আপডেট (এখনই calculate করে সেট করবে)
  const updateTotals = useCallback((items) => {
    const total = calculateTotalPrice(items);
    const count = calculateTotalItems(items);
    setTotalPrice(total);
    setTotalItems(count);
    
    // ডিবাগ করার জন্য console
    console.log('🛒 Cart Updated:', { items, totalPrice: total, totalItems: count });
    
    return { totalPrice: total, totalItems: count };
  }, [calculateTotalPrice, calculateTotalItems]);

  // ✅ কার্ট লোড (Firebase থেকে)
  const loadCart = useCallback(async () => {
    setLoading(true);
    
    if (!user) {
      // ইউজার না থাকলে localStorage থেকে লোড
      try {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(localCart);
        updateTotals(localCart);
      } catch (error) {
        console.error('Error loading local cart:', error);
        setCartItems([]);
        updateTotals([]);
      }
      setLoading(false);
      return;
    }

    try {
      const cartRef = doc(db, 'carts', user.uid);
      const cartDoc = await getDoc(cartRef);
      
      if (cartDoc.exists()) {
        const items = cartDoc.data().items || [];
        setCartItems(items);
        updateTotals(items);
      } else {
        // ইউজারের কার্ট না থাকলে localStorage থেকে মাইগ্রেট
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (localCart.length > 0) {
          await setDoc(cartRef, { 
            items: localCart,
            updatedAt: new Date().toISOString()
          });
          setCartItems(localCart);
          updateTotals(localCart);
        } else {
          setCartItems([]);
          updateTotals([]);
        }
      }
    } catch (error) {
      console.error('Error loading cart from Firebase:', error);
      // ব্যাকআপ: localStorage থেকে লোড
      try {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(localCart);
        updateTotals(localCart);
      } catch (e) {
        setCartItems([]);
        updateTotals([]);
      }
    }
    setLoading(false);
  }, [user, updateTotals]);

  // ✅ কার্ট সেভ (Firebase + localStorage)
  const saveCart = useCallback(async (items) => {
    // লোকাল স্টোরেজে সেভ (অফলাইন ব্যাকআপ)
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
    updateTotals(items);

    // Firebase-এ সেভ (অনলাইনে থাকলে)
    if (user && navigator.onLine) {
      try {
        const cartRef = doc(db, 'carts', user.uid);
        await setDoc(cartRef, { 
          items: items,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Cart saved to Firebase');
      } catch (error) {
        console.error('Error saving cart to Firebase:', error);
      }
    }
  }, [user, updateTotals]);

  // ✅ কার্টে যোগ করুন
  const addToCart = useCallback(async (product) => {
    if (!product) {
      console.error('❌ Product is undefined');
      return;
    }

    setLoading(true);
    try {
      const currentItems = [...cartItems];
      const existingIndex = currentItems.findIndex(item => item.id === product.id);

      if (existingIndex >= 0) {
        // প্রোডাক্ট থাকলে কোয়ান্টিটি বাড়ান
        currentItems[existingIndex].quantity = (currentItems[existingIndex].quantity || 1) + 1;
      } else {
        // ✅ নতুন প্রোডাক্ট যোগ করুন (প্রাইস সঠিকভাবে পার্স)
        let productPrice = 0;
        if (typeof product.price === 'string') {
          const cleaned = product.price.replace(/[^0-9.]/g, '');
          productPrice = parseFloat(cleaned) || 0;
        } else {
          productPrice = Number(product.price) || 0;
        }

        currentItems.push({
          id: product.id,
          name: product.name || 'Unknown Product',
          price: productPrice,
          image: product.image || 'https://via.placeholder.com/100',
          quantity: 1,
          category: product.category || 'General',
          stock: product.stock || 'In Stock'
        });
      }

      await saveCart(currentItems);
      console.log('✅ Product added to cart:', product.name);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cartItems, saveCart]);

  // ✅ কোয়ান্টিটি বাড়ান
  const increaseQuantity = useCallback(async (productId) => {
    setLoading(true);
    try {
      const currentItems = [...cartItems];
      const existingIndex = currentItems.findIndex(item => item.id === productId);
      
      if (existingIndex >= 0) {
        currentItems[existingIndex].quantity = (currentItems[existingIndex].quantity || 1) + 1;
        await saveCart(currentItems);
      }
    } catch (error) {
      console.error('❌ Error increasing quantity:', error);
    } finally {
      setLoading(false);
    }
  }, [cartItems, saveCart]);

  // ✅ কোয়ান্টিটি কমানো
  const decreaseQuantity = useCallback(async (productId) => {
    setLoading(true);
    try {
      const currentItems = [...cartItems];
      const existingIndex = currentItems.findIndex(item => item.id === productId);
      
      if (existingIndex >= 0) {
        const newQuantity = (currentItems[existingIndex].quantity || 1) - 1;
        if (newQuantity <= 0) {
          // কোয়ান্টিটি ০ হলে আইটেম রিমুভ করুন
          const filteredItems = currentItems.filter(item => item.id !== productId);
          await saveCart(filteredItems);
        } else {
          currentItems[existingIndex].quantity = newQuantity;
          await saveCart(currentItems);
        }
      }
    } catch (error) {
      console.error('❌ Error decreasing quantity:', error);
    } finally {
      setLoading(false);
    }
  }, [cartItems, saveCart]);

  // ✅ কার্ট থেকে রিমুভ
  const removeFromCart = useCallback(async (productId) => {
    setLoading(true);
    try {
      const currentItems = cartItems.filter(item => item.id !== productId);
      await saveCart(currentItems);
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  }, [cartItems, saveCart]);

  // ✅ কোয়ান্টিটি আপডেট
  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    setLoading(true);
    try {
      const currentItems = [...cartItems];
      const existingIndex = currentItems.findIndex(item => item.id === productId);
      
      if (existingIndex >= 0) {
        currentItems[existingIndex].quantity = newQuantity;
        await saveCart(currentItems);
      }
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  }, [cartItems, saveCart, removeFromCart]);

  // ✅ কার্ট ক্লিয়ার
  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await saveCart([]);
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  }, [saveCart]);

  // ✅ অফলাইন থেকে অনলাইনে সিঙ্ক
  const syncCart = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (localCart.length === 0) return;

      const cartRef = doc(db, 'carts', user.uid);
      await setDoc(cartRef, { 
        items: localCart,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Cart synced to Firebase');
    } catch (error) {
      console.error('❌ Error syncing cart:', error);
    }
  }, [user]);

  // ✅ ইউজার চেঞ্জ হলে কার্ট লোড
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // ✅ অনলাইন হলে সিঙ্ক
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine && user) {
        syncCart();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, syncCart]);

  // ✅ totalPrice এবং totalItems আপডেট থাকলে console-এ দেখান (ডিবাগিং)
  useEffect(() => {
    console.log('📊 Current Totals - Items:', totalItems, 'Price:', totalPrice);
  }, [totalItems, totalPrice]);

  const value = {
    cartItems,
    loading,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    updateQuantity,
    clearCart,
    loadCart,
    syncCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('❌ useCart must be used within CartProvider');
  }
  return context;
}