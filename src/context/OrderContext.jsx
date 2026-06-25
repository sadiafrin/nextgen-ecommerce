// src/context/OrderContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import offlineSync from '../services/OfflineSyncService';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // ✅ অর্ডার প্লেস করুন (অফলাইন সাপোর্ট সহ)
  const placeOrder = async (items, totalPrice) => {
    // 1. ইউজার চেক
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
      // 2. অর্ডার ডেটা তৈরি করুন
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

      // 3. OfflineSyncService ব্যবহার করুন
      const result = await offlineSync.saveOrder(orderData);
      console.log('✅ Order result:', result);

      // 4. ✅✅✅ STATS আপডেট করুন (অনলাইনে থাকলে) ✅✅✅
      if (result.status === 'confirmed' || result.status === 'synced') {
        try {
          const statsRef = doc(db, 'adminStats', 'stats');
          const statsSnap = await getDoc(statsRef);
          
          if (statsSnap.exists()) {
            // Stats আপডেট করুন
            await updateDoc(statsRef, {
              totalOrders: increment(1),
              monthlySales: increment(orderData.totalPrice)
            });
            console.log('✅ Stats updated! Total Orders increased.');
          } else {
            // Stats না থাকলে তৈরি করুন
            await setDoc(statsRef, {
              totalOrders: 1,
              monthlySales: orderData.totalPrice,
              newCustomers: 0,
              totalLogins: 0,
              lastUpdated: new Date()
            });
            console.log('✅ Stats document created!');
          }
        } catch (statsError) {
          console.error('❌ Stats update error:', statsError);
        }
      } else {
        console.log('⏳ Order saved offline. Stats will update when synced.');
      }

      // 5. লোকাল স্টেট আপডেট
      const newOrder = {
        id: result.id,
        ...orderData,
        status: result.status,
        orderDate: new Date().toISOString()
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder(newOrder);

      // 6. অফলাইনে থাকলে মেসেজ
      if (result.status === 'pending') {
        alert('📦 Order saved offline! It will be synced when you are online.');
      }

      return result.id;
    } catch (error) {
      console.error('❌ Error placing order:', error);
      throw error;
    }
  };

  // ✅ ইউজারের অর্ডার লোড করুন (অনলাইন + অফলাইন)
  const loadUserOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    
    setLoading(true);
    try {
      // 1. Firebase থেকে অর্ডার লোড করুন
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

      // 2. লোকাল পেন্ডিং অর্ডার লোড করুন
      const pendingOrders = offlineSync.getPendingOrders();
      const userPending = pendingOrders.filter(order => order.customerId === user.uid);

      // 3. সব অর্ডার একত্রিত করুন (পেন্ডিং আগে দেখাবে)
      const allOrders = [...userPending, ...firebaseOrders];
      setOrders(allOrders);
      console.log('📋 Loaded orders:', allOrders.length);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
    setLoading(false);
  };

  // ✅ সব অর্ডার লোড করুন (অ্যাডমিনের জন্য)
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

  // ✅ একটি অর্ডারের ডিটেইল লোড করুন
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

  // ✅ অর্ডার স্ট্যাটাস আপডেট করুন (অ্যাডমিন)
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