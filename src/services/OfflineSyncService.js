// src/services/OfflineSyncService.js
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

class OfflineSyncService {
  constructor() {
    this.pendingOrders = [];
    this.isSyncing = false;
    this.syncInterval = null;
    this.init();
  }

  init() {
    // ✅ পেন্ডিং অর্ডার লোড
    this.loadPendingOrders();
    
    // ✅ প্রতি 30 সেকেন্ডে সিঙ্ক চেক
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPendingOrders();
      }
    }, 30000);

    // ✅ অনলাইন হলে সাথে সাথে সিঙ্ক
    window.addEventListener('online', () => {
      console.log('🌐 Online detected, syncing pending orders...');
      this.syncPendingOrders();
    });
  }

  // ✅ পেন্ডিং অর্ডার লোড
  loadPendingOrders() {
    try {
      const data = localStorage.getItem('pendingOrders');
      this.pendingOrders = data ? JSON.parse(data) : [];
      console.log(`📋 Loaded ${this.pendingOrders.length} pending orders`);
    } catch (error) {
      console.error('Error loading pending orders:', error);
      this.pendingOrders = [];
    }
    return this.pendingOrders;
  }

  // ✅ পেন্ডিং অর্ডার সেভ
  savePendingOrders() {
    try {
      localStorage.setItem('pendingOrders', JSON.stringify(this.pendingOrders));
    } catch (error) {
      console.error('Error saving pending orders:', error);
    }
  }

  // ✅ পেন্ডিং অর্ডার কাউন্ট (✅ নতুন ফাংশন)
  getPendingCount() {
    this.loadPendingOrders();
    return this.pendingOrders.filter(order => !order.synced).length;
  }

  // ✅ পেন্ডিং অর্ডার পেতে (✅ নতুন ফাংশন)
  getPendingOrders() {
    this.loadPendingOrders();
    return this.pendingOrders.filter(order => !order.synced);
  }

  // ✅ সব অর্ডার পেতে
  getAllOrders() {
    this.loadPendingOrders();
    return this.pendingOrders;
  }

  // ✅ অর্ডার অফলাইনে সেভ
  saveOrderOffline(orderData) {
    try {
      const order = {
        ...orderData,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
        createdAt: new Date().toISOString()
      };
      
      this.pendingOrders.push(order);
      this.savePendingOrders();
      console.log('📦 Order saved offline:', order.id);
      return order.id;
    } catch (error) {
      console.error('Error saving order offline:', error);
      throw error;
    }
  }

  // ✅ পেন্ডিং অর্ডার সিঙ্ক
  async syncPendingOrders() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return;
    }

    if (!navigator.onLine) {
      console.log('📡 Offline, skipping sync');
      return;
    }

    this.loadPendingOrders();
    const pending = this.pendingOrders.filter(order => !order.synced);

    if (pending.length === 0) {
      console.log('✅ No pending orders to sync');
      return;
    }

    console.log(`🔄 Syncing ${pending.length} pending orders...`);
    this.isSyncing = true;

    for (const order of pending) {
      try {
        console.log(`📤 Syncing order: ${order.id}`);
        
        // ✅ Firestore-এ অর্ডার সেভ
        const orderData = {
          userId: order.customerId || order.userId,
          userEmail: order.customerEmail || order.userEmail,
          userName: order.customerName || order.userName,
          items: order.items || [],
          totalAmount: order.totalPrice || order.totalAmount || 0,
          status: order.status || 'pending',
          createdAt: new Date(order.createdAt),
          syncedAt: new Date().toISOString(),
          isOffline: true
        };

        const docRef = await addDoc(collection(db, 'orders'), orderData);
        console.log(`✅ Order synced with ID: ${docRef.id}`);
        
        // ✅ সিঙ্ক成功后 পেন্ডিং থেকে রিমুভ
        order.synced = true;
        order.firebaseId = docRef.id;
        this.savePendingOrders();
        
      } catch (error) {
        console.error(`❌ Failed to sync order ${order.id}:`, error);
        console.error('Error details:', error.message);
        
        // ✅ যদি পারমিশন error হয়, ইউজারকে জানান
        if (error.message.includes('permissions')) {
          console.warn('⚠️ Permission error, order will retry later');
        }
      }
    }

    this.isSyncing = false;
    console.log('✅ Sync completed');
  }

  // ✅ নির্দিষ্ট অর্ডার রিমুভ
  removeOrder(orderId) {
    this.loadPendingOrders();
    this.pendingOrders = this.pendingOrders.filter(order => order.id !== orderId);
    this.savePendingOrders();
  }

  // ✅ সিঙ্ক ইন্ডিকেটর রিসেট
  resetSyncStatus() {
    this.loadPendingOrders();
    this.pendingOrders = this.pendingOrders.map(order => ({
      ...order,
      synced: false
    }));
    this.savePendingOrders();
  }
}

// ✅ Singleton instance
const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;