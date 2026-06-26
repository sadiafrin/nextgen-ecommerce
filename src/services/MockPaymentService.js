// src/services/MockPaymentService.js
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

class MockPaymentService {
  constructor() {
    this.pendingKey = 'pendingPayments';
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingPayments();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // ✅ পেমেন্ট সেভ করুন
  async savePayment(paymentData) {
    if (this.isOnline) {
      try {
        const docRef = await addDoc(collection(db, 'payments'), {
          ...paymentData,
          syncedAt: new Date().toISOString()
        });
        return { id: docRef.id, status: 'synced' };
      } catch (error) {
        console.error('Error saving payment online:', error);
        return this.savePaymentOffline(paymentData);
      }
    } else {
      return this.savePaymentOffline(paymentData);
    }
  }

  // ✅ অফলাইনে সেভ
  savePaymentOffline(paymentData) {
    const pending = this.getPendingPayments();
    pending.push({ ...paymentData, synced: false });
    localStorage.setItem(this.pendingKey, JSON.stringify(pending));
    return { id: 'offline_' + Date.now(), status: 'pending' };
  }

  // ✅ পেন্ডিং পেমেন্ট লোড
  getPendingPayments() {
    try {
      const data = localStorage.getItem(this.pendingKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // ✅ পেন্ডিং পেমেন্ট সিঙ্ক
  async syncPendingPayments() {
    if (!this.isOnline) return;

    const pending = this.getPendingPayments();
    const unsynced = pending.filter(p => !p.synced);

    if (unsynced.length === 0) return;

    for (const payment of unsynced) {
      try {
        await addDoc(collection(db, 'payments'), {
          ...payment,
          syncedAt: new Date().toISOString()
        });
        payment.synced = true;
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    const updated = pending.filter(p => !p.synced);
    localStorage.setItem(this.pendingKey, JSON.stringify(updated));
  }
}

export default new MockPaymentService();