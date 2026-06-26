// src/context/OrderContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // ✅ অফলাইন অর্ডার সেভ
  const saveOrderOffline = (orderData) => {
    try {
      const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      const newOrder = {
        id: `offline_${Date.now()}`,
        ...orderData,
        status: 'pending',
        synced: false,
        createdAt: new Date().toISOString()
      };
      pendingOrders.push(newOrder);
      localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
      console.log('📦 Order saved offline:', newOrder);
      return newOrder;
    } catch (error) {
      console.error('Error saving order offline:', error);
      return null;
    }
  };

  // ✅ পেন্ডিং অর্ডার লোড
  const loadPendingOrders = () => {
    try {
      const data = localStorage.getItem('pendingOrders');
      const orders = data ? JSON.parse(data) : [];
      console.log('📋 Pending Orders loaded:', orders);
      return orders;
    } catch {
      return [];
    }
  };

  // ✅ অর্ডার প্লেস করুন (অফলাইন সাপোর্ট সহ)
  const placeOrder = async (items, totalPrice) => {
    if (!user) {
      throw new Error('Please login to place order');
    }

    if (!user.uid) {
      throw new Error('User ID not found. Please login again.');
    }

    if (!items || items.length === 0) {
      throw new Error('No items in cart');
    }

    try {
      const orderData = {
        customerId: user.uid,
        customerEmail: user.email || 'guest@example.com',
        customerName: user.name || user.email?.split('@')[0] || 'Guest',
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: typeof item.price === 'string' 
            ? parseFloat(item.price.replace(/[^0-9.]/g, '')) 
            : item.price,
          quantity: item.quantity || 1,
          image: item.image || '/no-image.png'
        })),
        totalPrice: typeof totalPrice === 'string' 
          ? parseFloat(totalPrice.replace(/[^0-9.]/g, '')) 
          : totalPrice,
      };

      const isOnline = navigator.onLine;

      if (isOnline) {
        // ✅ অনলাইন অর্ডার
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          status: 'confirmed',
          createdAt: new Date()
        });

        // ✅ Stats আপডেট
        try {
          const statsRef = doc(db, 'adminStats', 'stats');
          const statsSnap = await getDoc(statsRef);
          if (statsSnap.exists()) {
            await updateDoc(statsRef, {
              totalOrders: increment(1),
              monthlySales: increment(orderData.totalPrice)
            });
          }
        } catch (statsError) {
          console.error('Stats update error:', statsError);
        }

        const newOrder = { id: docRef.id, ...orderData, status: 'confirmed' };
        setOrders(prev => [newOrder, ...prev]);
        setCurrentOrder(newOrder);

        if (window.showToast) {
          window.showToast('🎉 Order placed successfully!', 'success');
        }
        return docRef.id;
      } else {
        // ✅ অফলাইন অর্ডার
        const offlineOrder = saveOrderOffline(orderData);
        if (offlineOrder) {
          setOrders(prev => [offlineOrder, ...prev]);
          setCurrentOrder(offlineOrder);
          
          if (window.showToast) {
            window.showToast('📦 Order saved offline! Will sync when online.', 'offline');
          }
          return offlineOrder.id;
        }
        throw new Error('Failed to save order offline');
      }
    } catch (error) {
      console.error('❌ Error placing order:', error);
      throw error;
    }
  };

  // ✅ ইউজারের অর্ডার লোড করুন
  const loadUserOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    
    setLoading(true);
    try {
      // Firebase থেকে অর্ডার
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const firebaseOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // লোকাল পেন্ডিং অর্ডার
      const pendingOrders = loadPendingOrders();
      const userPending = pendingOrders.filter(order => order.customerId === user.uid);

      const allOrders = [...userPending, ...firebaseOrders];
      setOrders(allOrders);
      console.log('📋 Loaded orders:', allOrders.length);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
    setLoading(false);
  };

  // ✅ সব অর্ডার লোড করুন (অ্যাডমিন)
  const loadAllOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
    } catch (error) {
      console.error('Error loading all orders:', error);
    }
    setLoading(false);
  };

  // ✅ অর্ডার ডিটেইল
  const getOrderById = async (orderId) => {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  };

  // ✅ অর্ডার স্ট্যাটাস আপডেট
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  const value = {
    orders,
    loading,
    currentOrder,
    placeOrder,
    loadUserOrders,
    loadAllOrders,
    getOrderById,
    updateOrderStatus
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;

  
};

export default OrderContext;