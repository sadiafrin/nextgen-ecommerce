// src/context/WishlistContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        setWishlist(Array.isArray(parsed) ? parsed : []);
        console.log('✅ Wishlist loaded:', parsed.length, 'items');
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error('❌ Error loading wishlist:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, loading]);

  const addToWishlist = useCallback((product) => {
    if (!product || !product.id) return;
    setWishlist(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      console.log('✅ Added to wishlist:', product.name);
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    if (!productId) return;
    setWishlist(prev => {
      const newList = prev.filter(item => item.id !== productId);
      console.log('🗑️ Removed from wishlist');
      return newList;
    });
  }, []);

  const toggleWishlist = useCallback((product) => {
    if (!product || !product.id) return;
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        console.log('🗑️ Removed from wishlist:', product.name);
        return prev.filter(item => item.id !== product.id);
      } else {
        console.log('✅ Added to wishlist:', product.name);
        return [...prev, product];
      }
    });
  }, []);

  const isInWishlist = useCallback((productId) => {
    if (!productId) return false;
    return wishlist.some(item => item.id === productId);
  }, [wishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    localStorage.removeItem('wishlist');
    console.log('🗑️ Wishlist cleared');
  }, []);

  const value = useMemo(() => ({
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    wishlistCount: wishlist.length
  }), [wishlist, loading, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('❌ useWishlist must be used within WishlistProvider');
  }
  return context;
};

export default WishlistContext;