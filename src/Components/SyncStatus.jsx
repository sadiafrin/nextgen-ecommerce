// src/Components/SyncStatus.jsx
import { useState, useEffect } from 'react';
import offlineSync from '../services/OfflineSyncService';

export default function SyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => {
      setPendingCount(offlineSync.getPendingCount());
      setIsOnline(navigator.onLine);
    };

    updateStatus();

    // ✅ প্রতি ৫ সেকেন্ড পর পর স্ট্যাটাস চেক
    const interval = setInterval(updateStatus, 5000);

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (pendingCount === 0 && isOnline) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
      !isOnline 
        ? 'bg-yellow-500 text-white' 
        : pendingCount > 0 
          ? 'bg-blue-600 text-white animate-pulse' 
          : 'bg-green-500 text-white'
    }`}>
      {!isOnline ? (
        <span>📡 Offline Mode</span>
      ) : pendingCount > 0 ? (
        <span>🔄 Syncing {pendingCount} orders...</span>
      ) : (
        <span>✅ All synced</span>
      )}
    </div>
  );
}