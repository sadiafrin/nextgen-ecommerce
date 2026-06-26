// src/services/OfflineTrackerService.js

class OfflineTrackerService {
  constructor() {
    this.offlineLoginsKey = 'offlineLogins';
    console.log('✅ OfflineTrackerService initialized');
  }

  // ✅ অফলাইন লগইন রেকর্ড
  recordOfflineLogin(user) {
    try {
      console.log('📝 recordOfflineLogin called with:', user);
      
      let logins = [];
      const saved = localStorage.getItem(this.offlineLoginsKey);
      if (saved) {
        logins = JSON.parse(saved);
      }
      
      const existing = logins.find(l => l.email === user.email);
      
      if (existing) {
        existing.lastLogin = new Date().toISOString();
        existing.count = (existing.count || 1) + 1;
      } else {
        logins.push({
          uid: user.uid || `offline_${Date.now()}`,
          email: user.email,
          name: user.name || 'User',
          firstLogin: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          count: 1
        });
      }
      
      localStorage.setItem(this.offlineLoginsKey, JSON.stringify(logins));
      console.log('✅ Offline login recorded. Total:', logins.length);
      console.log('📋 Current offline logins:', logins);
      return true;
    } catch (error) {
      console.error('❌ Error recording offline login:', error);
      return false;
    }
  }

  // ✅ অফলাইন লগইন লিস্ট
  getOfflineLogins() {
    try {
      const data = localStorage.getItem(this.offlineLoginsKey);
      const logins = data ? JSON.parse(data) : [];
      console.log('📋 getOfflineLogins returned:', logins.length, 'items');
      return logins;
    } catch (error) {
      console.error('❌ Error getting offline logins:', error);
      return [];
    }
  }
}

const offlineTracker = new OfflineTrackerService();
export default offlineTracker;