// src/services/OfflineSyncService.js
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

class OfflineSyncService {
  constructor() {
    this.pendingKey = 'pendingOrders';
    this.isOnline = navigator.onLine;
    this.syncInterval = null;

    // ✅ Online/Offline ইভেন্ট
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOrders();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // ✅ প্রতি ৩০ সেকেন্ড পর সিঙ্ক
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingOrders();
      }
    }, 30000);
  }

  // ✅ অর্ডার সেভ করুন
  async saveOrder(orderData) {
    console.log('💾 saveOrder called. Online:', this.isOnline);
    
    if (this.isOnline) {
      try {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          status: 'confirmed',
          syncedAt: new Date().toISOString(),
          createdAt: new Date()
        });
        console.log('✅ Order saved online:', docRef.id);
        return { id: docRef.id, status: 'confirmed' };
      } catch (error) {
        console.error('❌ Error saving order online:', error);
        return this.saveOrderOffline(orderData);
      }
    } else {
      return this.saveOrderOffline(orderData);
    }
  }

  // ✅ অফলাইনে সেভ
  saveOrderOffline(orderData) {
    try {
      console.log('📦 saveOrderOffline called');
      const pendingOrders = this.getPendingOrders();
      const newOrder = {
        id: `offline_${Date.now()}`,
        ...orderData,
        status: 'pending',
        synced: false,
        createdAt: new Date().toISOString()
      };
      pendingOrders.push(newOrder);
      localStorage.setItem(this.pendingKey, JSON.stringify(pendingOrders));
      console.log('📦 Order saved offline:', newOrder.id);
      console.log('📋 Current pending orders:', pendingOrders);
      return { id: newOrder.id, status: 'pending' };
    } catch (error) {
      console.error('❌ Error saving order offline:', error);
      return { id: `offline_${Date.now()}`, status: 'pending' };
    }
  }

  // ✅ পেন্ডিং অর্ডার লিস্ট
  getPendingOrders() {
    try {
      const data = localStorage.getItem(this.pendingKey);
      const orders = data ? JSON.parse(data) : [];
      console.log('📋 getPendingOrders returned:', orders.length, 'orders');
      return orders;
    } catch {
      return [];
    }
  }

  // ✅ সব পেন্ডিং অর্ডার সিঙ্ক করুন
  async syncPendingOrders() {
    if (!this.isOnline) {
      console.log('⏳ Offline: Sync skipped');
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const unsynced = pendingOrders.filter(order => !order.synced);

    if (unsynced.length === 0) {
      console.log('✅ No pending orders to sync');
      return;
    }

    console.log(`🔄 Syncing ${unsynced.length} orders...`);

    for (const order of unsynced) {
      try {
        // ✅ Order ডেটা সঠিক আছে কিনা চেক করুন
        console.log('📦 Order data:', order);
        
        const docRef = await addDoc(collection(db, 'orders'), {
          customerId: order.customerId || 'guest',
          customerEmail: order.customerEmail || 'guest@example.com',
          customerName: order.customerName || 'Guest',
          items: order.items || [],
          totalPrice: order.totalPrice || 0,
          status: 'confirmed',
          syncedAt: new Date().toISOString(),
          createdAt: new Date(order.createdAt || Date.now())
        });

        order.synced = true;
        console.log(`✅ Order ${order.id} synced successfully! ID: ${docRef.id}`);

      } catch (error) {
        console.error(`❌ Failed to sync order ${order.id}:`, error);
        console.error('Error details:', error.message);
      }
    }

    // ✅ সিঙ্ক করা অর্ডারগুলো আপডেট করুন
    const updatedOrders = pendingOrders.filter(order => !order.synced);
    localStorage.setItem(this.pendingKey, JSON.stringify(updatedOrders));
    
    console.log(`📋 Remaining pending orders: ${updatedOrders.length}`);

    // ✅ Toast notification
    const syncedCount = unsynced.length - updatedOrders.length;
    if (window.showToast && syncedCount > 0) {
      window.showToast(`✅ ${syncedCount} orders synced successfully!`, 'success');
    }
    if (window.showToast && updatedOrders.length > 0) {
      window.showToast(`❌ ${updatedOrders.length} orders failed to sync`, 'error');
    }
  }

  // ✅ পেন্ডিং কাউন্ট
  getPendingCount() {
    return this.getPendingOrders().filter(order => !order.synced).length;
  }

  // ✅ সিঙ্ক ইন্টারভাল ক্লিয়ার
  clearSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// ✅ Singleton
const offlineSync = new OfflineSyncService();
export default offlineSync;