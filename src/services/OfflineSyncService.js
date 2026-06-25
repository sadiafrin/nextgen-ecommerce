// src/services/OfflineSyncService.js
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

class OfflineSyncService {
  constructor() {
    this.pendingKey = 'pendingOrders';
    this.isOnline = navigator.onLine;
    this.syncInterval = null;

    // ✅ Online/Offline ইভেন্ট লিসেনার
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOrders();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // ✅ প্রতি ৩০ সেকেন্ড পর পর সিঙ্ক চেক
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingOrders();
      }
    }, 30000);
  }

  // ✅ অর্ডার সেভ করুন (অফলাইন সাপোর্ট সহ)
  async saveOrder(orderData) {
    if (this.isOnline) {
      // ✅ অনলাইন → সরাসরি Firebase-এ সেভ
      try {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          status: 'confirmed',
          syncedAt: new Date().toISOString()
        });
        return { id: docRef.id, status: 'confirmed' };
      } catch (error) {
        console.error('Error saving order online:', error);
        // ❌ অনলাইনে ফেইল হলে অফলাইনে সেভ
        return this.saveOrderOffline(orderData);
      }
    } else {
      // ❌ অফলাইন → localStorage-এ সেভ
      return this.saveOrderOffline(orderData);
    }
  }

  // ✅ অর্ডার অফলাইনে সেভ করুন
  saveOrderOffline(orderData) {
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
    return { id: newOrder.id, status: 'pending' };
  }

  // ✅ পেন্ডিং অর্ডার লিস্ট নিন
  getPendingOrders() {
    try {
      const data = localStorage.getItem(this.pendingKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // ✅ সব পেন্ডিং অর্ডার Firebase-এ সিঙ্ক করুন
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
        // ✅ Firebase-এ অর্ডার সেভ করুন
        const docRef = await addDoc(collection(db, 'orders'), {
          customerId: order.customerId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          items: order.items,
          totalPrice: order.totalPrice,
          status: 'confirmed',
          syncedAt: new Date().toISOString(),
          createdAt: order.createdAt || new Date().toISOString()
        });

        // ✅ অর্ডার সফলভাবে সিঙ্ক হয়েছে
        order.synced = true;
        order.firebaseId = docRef.id;
        order.status = 'synced';

        console.log(`✅ Order ${order.id} synced to Firebase: ${docRef.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync order ${order.id}:`, error);
      }
    }

    // ✅ সিঙ্ককৃত অর্ডারগুলো localStorage-এ আপডেট করুন
    const updatedOrders = pendingOrders.filter(order => !order.synced);
    localStorage.setItem(this.pendingKey, JSON.stringify(updatedOrders));

    // ✅ যদি সব অর্ডার সিঙ্ক হয়ে যায়, localStorage ক্লিয়ার করুন
    if (updatedOrders.length === 0) {
      localStorage.removeItem(this.pendingKey);
      console.log('🎉 All orders synced!');
    }
  }

  // ✅ পেন্ডিং অর্ডার কাউন্ট
  getPendingCount() {
    return this.getPendingOrders().filter(order => !order.synced).length;
  }

  // ✅ সিঙ্ক ইন্টারভাল ক্লিয়ার করুন (কম্পোনেন্ট আনমাউন্টে)
  clearSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// ✅ Singleton Instance
const offlineSync = new OfflineSyncService();
export default offlineSync;