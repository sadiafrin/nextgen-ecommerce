// src/context/OrderContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, addDoc, getDocs, query, where, orderBy, 
  doc, getDoc, updateDoc, setDoc, increment, deleteDoc,
  serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [offlineOrders, setOfflineOrders] = useState([]);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const unsubscribeRef = useRef(null);

  // ✅ Delivery Charge - Fixed
  const DELIVERY_CHARGE = 60;

  // ✅ টোটাল প্রাইস ক্যালকুলেট করার ফাংশন
  const calculateOrderTotal = useCallback((items) => {
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

  // ✅ অফলাইন অর্ডার লোড
  const loadOfflineOrders = useCallback(() => {
    try {
      const data = localStorage.getItem('pendingOrders');
      const orders = data ? JSON.parse(data) : [];
      setOfflineOrders(orders);
      return orders;
    } catch (error) {
      console.error('Error loading offline orders:', error);
      return [];
    }
  }, []);

  // ✅ অফলাইন অর্ডার সেভ
  const saveOfflineOrders = useCallback((orders) => {
    try {
      localStorage.setItem('pendingOrders', JSON.stringify(orders));
      setOfflineOrders(orders);
    } catch (error) {
      console.error('Error saving offline orders:', error);
    }
  }, []);

  // ✅ অফলাইন অর্ডার সেভ (হেল্পার)
  const saveOrderOffline = useCallback((orderData) => {
    try {
      const pendingOrders = loadOfflineOrders();
      const newOrder = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ...orderData,
        status: 'pending',
        synced: false,
        isOffline: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      pendingOrders.push(newOrder);
      saveOfflineOrders(pendingOrders);
      
      return newOrder;
    } catch (error) {
      console.error('Error saving order offline:', error);
      return null;
    }
  }, [loadOfflineOrders, saveOfflineOrders]);

  // ✅ পেন্ডিং অর্ডার লোড
  const loadPendingOrders = useCallback(() => {
    try {
      const data = localStorage.getItem('pendingOrders');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  // ✅ Stats Update Function with lastUpdated
  const updateStats = useCallback(async (totalAmount, isNewCustomer = false) => {
    try {
      const statsRef = doc(db, 'adminStats', 'stats');
      const statsSnap = await getDoc(statsRef);
      
      const currentDate = new Date().toISOString();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      if (statsSnap.exists()) {
        const existingData = statsSnap.data();
        const existingMonth = existingData.lastUpdated 
          ? new Date(existingData.lastUpdated).getMonth() 
          : -1;
        const existingYear = existingData.lastUpdated 
          ? new Date(existingData.lastUpdated).getFullYear() 
          : -1;
        
        let monthlySales = existingData.monthlySales || 0;
        if (existingMonth !== currentMonth || existingYear !== currentYear) {
          monthlySales = 0;
        }
        
        const updates = {
          totalOrders: increment(1),
          monthlySales: increment(totalAmount),
          totalLogins: increment(1),
          lastUpdated: currentDate
        };
        
        if (isNewCustomer) {
          updates.newCustomers = increment(1);
        }
        
        await updateDoc(statsRef, updates);
        console.log('✅ Stats updated with lastUpdated:', currentDate);
      } else {
        await setDoc(statsRef, {
          totalOrders: 1,
          monthlySales: totalAmount,
          newCustomers: isNewCustomer ? 1 : 0,
          totalLogins: 1,
          lastUpdated: currentDate
        });
        console.log('✅ Stats created with lastUpdated:', currentDate);
      }
    } catch (error) {
      console.error('❌ Stats update error:', error);
    }
  }, []);

  // ✅ Cross-Device: Listen to Firebase orders (Real-time)
  const listenToFirebaseOrders = useCallback(() => {
    if (!user || !navigator.onLine) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    console.log('📡 Listening to Firebase orders for user:', user.uid);

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const firebaseOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOffline: false,
        synced: true
      }));

      // ✅ Merge with offline orders
      const pendingOrders = loadPendingOrders();
      const allOrders = [...firebaseOrders, ...pendingOrders];

      // Sort by date
      allOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setOrders(allOrders);
      setSyncedOrders(firebaseOrders);
      console.log('🔄 Firebase orders updated:', firebaseOrders.length);
      hasLoadedRef.current = true;
    }, (error) => {
      console.error('❌ Error listening to orders:', error);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, loadPendingOrders]);

  // ✅ Cross-Device: Sync offline orders to Firebase
  const syncOfflineOrders = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('📡 Offline, skipping sync');
      return;
    }

    if (!user) {
      console.log('👤 No user, skipping sync');
      return;
    }

    const pendingOrders = loadPendingOrders();
    const pendingSync = pendingOrders.filter(o => !o.synced && o.customerId === user.uid);

    if (pendingSync.length === 0) {
      console.log('✅ No offline orders to sync');
      return;
    }

    console.log(`🔄 Syncing ${pendingSync.length} offline orders to Firebase...`);

    let syncedCount = 0;
    let totalAmount = 0;
    const ordersToRemove = [];

    for (const order of pendingSync) {
      try {
        // Check if order already exists in Firebase
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderId', '==', order.id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`⚠️ Order ${order.id} already exists in Firebase, skipping...`);
          ordersToRemove.push(order.id);
          continue;
        }

        const orderTotal = order.totalPrice || 0;
        totalAmount += orderTotal;
        
        const orderData = {
          ...order,
          customerId: order.customerId || user.uid,
          customerEmail: order.customerEmail || user.email || 'guest@email.com',
          customerName: order.customerName || user.displayName || 'Guest',
          syncedAt: serverTimestamp(),
          isOffline: true,
          synced: true,
          syncedFrom: 'offline'
        };

        // Remove id from data
        const { id, ...orderWithoutId } = orderData;
        await addDoc(collection(db, 'orders'), orderWithoutId);
        
        ordersToRemove.push(order.id);
        syncedCount++;
        console.log(`✅ Synced order: ${order.id}`);
        
      } catch (error) {
        console.error(`❌ Failed to sync order ${order.id}:`, error);
      }
    }

    // Remove synced orders from pending
    if (ordersToRemove.length > 0) {
      const updatedOrders = pendingOrders.filter(o => !ordersToRemove.includes(o.id));
      saveOfflineOrders(updatedOrders);
      console.log(`✅ Removed ${ordersToRemove.length} synced orders from pending`);
    }

    // ✅ Stats Update for synced orders
    if (syncedCount > 0) {
      try {
        const statsRef = doc(db, 'adminStats', 'stats');
        const statsSnap = await getDoc(statsRef);
        const currentDate = new Date().toISOString();
        
        if (statsSnap.exists()) {
          await updateDoc(statsRef, {
            totalOrders: increment(syncedCount),
            monthlySales: increment(totalAmount),
            lastUpdated: currentDate
          });
          console.log(`✅ Stats updated for ${syncedCount} synced orders`);
        }
      } catch (statsError) {
        console.error('❌ Stats update error during sync:', statsError);
      }
    }

    // ✅ Update local orders state
    if (syncedCount > 0) {
      const updatedPending = loadPendingOrders();
      const firebaseOrders = orders.filter(o => !o.isOffline);
      const allOrders = [...firebaseOrders, ...updatedPending];
      allOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setOrders(allOrders);
    }

    return syncedCount;
  }, [user, loadPendingOrders, saveOfflineOrders, orders]);

  // ✅ Cross-Device: Sync Firebase orders to localStorage
  const syncFirebaseOrdersToLocal = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    try {
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
      
      localStorage.setItem('syncedOrders', JSON.stringify(firebaseOrders));
      console.log('🔄 Synced Firebase orders to localStorage:', firebaseOrders.length);
      
      return firebaseOrders;
    } catch (error) {
      console.error('❌ Error syncing orders from Firebase:', error);
      return [];
    }
  }, [user]);

  // ✅ অর্ডার প্লেস করুন
  const placeOrder = useCallback(async (items, totalPrice, deliveryInfo = null) => {
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
      const orderItems = items.map(item => ({
        id: item.id || `item_${Date.now()}`,
        name: item.name || 'Unknown Product',
        price: typeof item.price === 'string' 
          ? parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
          : Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || '/no-image.png',
        category: item.category || 'General'
      }));

      const subtotal = calculateOrderTotal(orderItems);
      const deliveryCharge = DELIVERY_CHARGE;
      const discount = 0;
      const finalTotal = subtotal - discount + deliveryCharge;

      const orderData = {
        customerId: user.uid,
        customerEmail: user.email || 'guest@example.com',
        customerName: user.displayName || user.name || user.email?.split('@')[0] || 'Guest',
        customerPhone: user.phoneNumber || '',
        items: orderItems,
        subtotal: subtotal,
        totalPrice: finalTotal,
        deliveryCharge: deliveryCharge,
        discount: discount,
        deliveryInfo: deliveryInfo || null,
        status: 'pending',
        orderId: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const isOnline = navigator.onLine;

      if (isOnline) {
        // ✅ Online Order
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          isOffline: false,
          synced: true
        });

        await updateStats(finalTotal, true);

        const newOrder = { id: docRef.id, ...orderData, status: 'confirmed', isOffline: false, synced: true };
        setOrders(prev => [newOrder, ...prev]);
        setCurrentOrder(newOrder);

        if (window.showToast) {
          window.showToast('🎉 Order placed successfully!', 'success');
        }
        return docRef.id;
      } else {
        // ✅ Offline Order
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
  }, [user, saveOrderOffline, calculateOrderTotal, updateStats]);

  // ✅ ইউজারের অর্ডার লোড করুন
  const loadUserOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      let allOrders = [];

      // ✅ Firebase থেকে অর্ডার
      if (navigator.onLine) {
        try {
          const q = query(
            collection(db, 'orders'),
            where('customerId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const firebaseOrders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isOffline: false,
            synced: true,
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
          }));
          allOrders = [...allOrders, ...firebaseOrders];
        } catch (error) {
          console.error('Error loading online orders:', error);
          if (error.message.includes('index')) {
            const allOrdersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
            const allSnapshot = await getDocs(allOrdersQuery);
            const allFirebaseOrders = allSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              isOffline: false,
              synced: true,
              createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
            }));
            const userOrders = allFirebaseOrders.filter(o => o.customerId === user.uid);
            allOrders = [...allOrders, ...userOrders];
          }
        }
      }

      // ✅ লোকাল পেন্ডিং অর্ডার
      const pendingOrders = loadPendingOrders();
      const userPending = pendingOrders.filter(order => order.customerId === user.uid);
      
      const processedPending = userPending.map(order => ({
        ...order,
        subtotal: calculateOrderTotal(order.items),
        totalPrice: calculateOrderTotal(order.items) + (order.deliveryCharge || DELIVERY_CHARGE) - (order.discount || 0),
        synced: false
      }));
      
      allOrders = [...allOrders, ...processedPending];

      allOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setOrders(allOrders);
      hasLoadedRef.current = true;
      return allOrders;
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, loading, loadPendingOrders, calculateOrderTotal]);

  // ✅ সব অর্ডার লোড করুন (অ্যাডমিন)
  const loadAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
      return ordersList;
    } catch (error) {
      console.error('Error loading all orders:', error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ অর্ডার ডিটেইল
  const getOrderById = useCallback(async (orderId) => {
    try {
      const pendingOrders = loadPendingOrders();
      const offlineOrder = pendingOrders.find(o => o.id === orderId || o.orderId === orderId);
      if (offlineOrder) {
        return {
          ...offlineOrder,
          subtotal: calculateOrderTotal(offlineOrder.items),
          totalPrice: calculateOrderTotal(offlineOrder.items) + (offlineOrder.deliveryCharge || DELIVERY_CHARGE) - (offlineOrder.discount || 0)
        };
      }

      if (navigator.onLine) {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }, [loadPendingOrders, calculateOrderTotal]);

  // ✅ অর্ডার স্ট্যাটাস আপডেট
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const pendingOrders = loadPendingOrders();
      const offlineOrder = pendingOrders.find(o => o.id === orderId || o.orderId === orderId);
      
      if (offlineOrder) {
        const updatedOrders = pendingOrders.map(o => 
          (o.id === orderId || o.orderId === orderId) ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
        );
        saveOfflineOrders(updatedOrders);
        
        setOrders(prev => prev.map(order => 
          (order.id === orderId || order.orderId === orderId) ? { ...order, status: newStatus } : order
        ));
        return true;
      }

      if (navigator.onLine) {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { 
          status: newStatus,
          updatedAt: new Date()
        });
        
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }, [loadPendingOrders, saveOfflineOrders]);

  // ✅ অর্ডার ডিলিট
  const deleteOrder = useCallback(async (orderId) => {
    try {
      const pendingOrders = loadPendingOrders();
      const offlineOrder = pendingOrders.find(o => o.id === orderId || o.orderId === orderId);
      
      if (offlineOrder) {
        const updatedOrders = pendingOrders.filter(o => o.id !== orderId && o.orderId !== orderId);
        saveOfflineOrders(updatedOrders);
        
        setOrders(prev => prev.filter(order => order.id !== orderId && order.orderId !== orderId));
        return true;
      }

      if (navigator.onLine) {
        await deleteDoc(doc(db, 'orders', orderId));
        setOrders(prev => prev.filter(order => order.id !== orderId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }, [loadPendingOrders, saveOfflineOrders]);

  // ✅ ইনভয়েস জেনারেট
  const generateInvoice = useCallback((order) => {
    if (!order) return null;

    const items = order.items || [];
    const subtotal = calculateOrderTotal(items);
    const deliveryCharge = Number(order.deliveryCharge) || DELIVERY_CHARGE;
    const discount = Number(order.discount) || 0;
    const total = subtotal - discount + deliveryCharge;
    
    return {
      invoiceNumber: `INV-${order.id?.slice(0, 8) || order.orderId?.slice(0, 8) || Date.now()}`,
      date: order.createdAt || new Date().toISOString(),
      customerName: order.customerName || order.customerEmail || 'Guest',
      customerEmail: order.customerEmail || 'N/A',
      customerPhone: order.customerPhone || 'N/A',
      items: items.map(item => ({
        name: item.name || 'Unknown Product',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.price) || 0) * (Number(item.quantity) || 1)
      })),
      subtotal: subtotal,
      discount: discount,
      deliveryCharge: deliveryCharge,
      total: total,
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || 'Cash on Delivery'
    };
  }, [calculateOrderTotal]);

  // ✅ Real-time listener setup
  useEffect(() => {
    const cleanup = listenToFirebaseOrders();
    return () => {
      if (cleanup) cleanup();
    };
  }, [listenToFirebaseOrders]);

  // ✅ ইউজার চেঞ্জ হলে অর্ডার লোড
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      loadUserOrders();
    } else if (!user) {
      setOrders([]);
      hasLoadedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  }, [user, loadUserOrders]);

  // ✅ অনলাইন হলে অফলাইন অর্ডার সিঙ্ক
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine && user) {
        console.log('🌐 Online detected, syncing offline orders...');
        setTimeout(() => {
          syncOfflineOrders();
          syncFirebaseOrdersToLocal();
        }, 1000);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, syncOfflineOrders, syncFirebaseOrdersToLocal]);

  const value = {
    orders,
    loading,
    error,
    currentOrder,
    offlineOrders,
    DELIVERY_CHARGE,
    placeOrder,
    loadUserOrders,
    loadAllOrders,
    loadPendingOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    syncOfflineOrders,
    syncFirebaseOrdersToLocal,
    generateInvoice,
    loadOfflineOrders,
    calculateOrderTotal,
    updateStats
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