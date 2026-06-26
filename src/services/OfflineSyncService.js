// src/services/OfflineSyncService.js
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

class OfflineSyncService {
  constructor() {
    this.pendingKey = 'pendingOrders';
    this.isOnline = navigator.onLine;
    this.syncInterval = null;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOrders();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingOrders();
      }
    }, 30000);
  }

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

  saveOrderOffline(orderData) {
    try {
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
    } catch (error) {
      console.error('❌ Error saving order offline:', error);
      return { id: `offline_${Date.now()}`, status: 'pending' };
    }
  }

  getPendingOrders() {
    try {
      const data = localStorage.getItem(this.pendingKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // ✅ Sync করার পরেও pendingOrders রাখুন
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
        await addDoc(collection(db, 'orders'), {
          customerId: order.customerId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          items: order.items,
          totalPrice: order.totalPrice,
          status: 'confirmed',
          syncedAt: new Date().toISOString(),
          createdAt: new Date(order.createdAt || Date.now())
        });

        console.log(`✅ Order ${order.id} synced (kept in pending list)`);
      } catch (error) {
        console.error(`❌ Failed to sync order ${order.id}:`, error);
      }
    }

    console.log('📋 Pending orders kept in localStorage for admin view');
  }

  getPendingCount() {
    return this.getPendingOrders().filter(order => !order.synced).length;
  }

  clearSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

const offlineSync = new OfflineSyncService();
export default offlineSync;