// src/Components/SyncStatus.jsx
import React, { useState, useEffect } from 'react';
import offlineSync from '../services/OfflineSyncService';

export default function SyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ✅ পেন্ডিং কাউন্ট আপডেট
  const updateStatus = () => {
    try {
      // ✅ offlineSync থেকে পেন্ডিং অর্ডার কাউন্ট
      const pendingOrders = offlineSync.getPendingOrders ? offlineSync.getPendingOrders() : [];
      const count = pendingOrders.length;
      setPendingCount(count);
    } catch (error) {
      console.warn('Error getting pending count:', error);
      setPendingCount(0);
    }
  };

  // ✅ সিঙ্কিং স্ট্যাটাস চেক
  const checkSyncStatus = () => {
    try {
      if (offlineSync.isSyncing !== undefined) {
        setIsSyncing(offlineSync.isSyncing);
      }
    } catch (error) {
      console.warn('Error checking sync status:', error);
    }
  };

  // ✅ ম্যানুয়াল সিঙ্ক
  const handleSync = async () => {
    if (!isOnline) {
      alert('You are offline. Please connect to internet to sync.');
      return;
    }

    try {
      if (offlineSync.syncPendingOrders) {
        await offlineSync.syncPendingOrders();
        updateStatus();
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please try again.');
    }
  };

  // ✅ অনলাইন/অফলাইন ইভেন্ট
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ প্রতি 5 সেকেন্ডে স্ট্যাটাস চেক
  useEffect(() => {
    updateStatus();
    checkSyncStatus();

    const interval = setInterval(() => {
      updateStatus();
      checkSyncStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg shadow-lg flex items-center gap-3 ${
      isSyncing ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <span>📡</span>
        )}
        <span className="text-sm font-medium">
          {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
        </span>
      </div>
      
      {!isSyncing && isOnline && pendingCount > 0 && (
        <button
          onClick={handleSync}
          className="ml-2 px-3 py-1 bg-white text-gray-800 rounded-lg text-xs font-medium hover:bg-gray-100 transition"
        >
          Sync Now
        </button>
      )}
      
      {!isOnline && pendingCount > 0 && (
        <span className="ml-2 text-xs text-gray-200">(Offline)</span>
      )}
    </div>
  );
}