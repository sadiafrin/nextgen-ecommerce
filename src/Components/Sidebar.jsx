// src/Components/Sidebar.jsx
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const [showOfflineMenu, setShowOfflineMenu] = useState(false);
  const [offlineCounts, setOfflineCounts] = useState({ 
    pendingUsers: 0, 
    offlineLogins: 0, 
    pendingOrders: 0,
    total: 0 
  });

  // ✅ Offline Data কাউন্ট
  const getOfflineCounts = () => {
    try {
      const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
      const offlineLogins = JSON.parse(localStorage.getItem('offlineLogins') || '[]');
      const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      return {
        pendingUsers: pendingUsers.length,
        offlineLogins: offlineLogins.length,
        pendingOrders: pendingOrders.length,
        total: pendingUsers.length + offlineLogins.length + pendingOrders.length
      };
    } catch {
      return { pendingUsers: 0, offlineLogins: 0, pendingOrders: 0, total: 0 };
    }
  };

  useEffect(() => {
    if (isOpen) {
      setOfflineCounts(getOfflineCounts());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
              Q
            </div>
            <span className="text-lg font-bold text-gray-800">
              Quick<span className="text-blue-600">Buy</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-gray-50">
          {user ? (
            <div>
              <p className="font-semibold text-gray-800">Hi, {user.name || 'User'} 👋</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              {isAdmin && (
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600">Welcome to QuickBuy!</p>
              <Link 
                to="/login" 
                onClick={onClose}
                className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Login / Register
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {/* Home */}
          <Link 
            to="/" 
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>

          {/* Cart */}
          <Link 
            to="/cart" 
            onClick={onClose}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Cart
            </span>
            {totalItems > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Orders */}
          <Link 
            to="/orders" 
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            My Orders
          </Link>

          {/* Admin Dashboard */}
          {isAdmin && (
            <Link 
              to="/admin" 
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Admin Dashboard
            </Link>
          )}

          {/* ✅ Offline Data Dropdown (শুধু অ্যাডমিন) */}
          {isAdmin && (
            <div>
              <button
                onClick={() => setShowOfflineMenu(!showOfflineMenu)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">📡</span>
                  Offline Data
                  {offlineCounts.total > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      {offlineCounts.total}
                    </span>
                  )}
                </span>
                <svg className={`w-4 h-4 transition-transform ${showOfflineMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* ✅ Offline Sub-menu */}
              {showOfflineMenu && (
                <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-3">
                  <Link
                    to="/admin?tab=offline-users"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm text-gray-600"
                  >
                    <span>📦 Offline Registered</span>
                    <span className={`text-xs font-bold ${offlineCounts.pendingUsers > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {offlineCounts.pendingUsers}
                    </span>
                  </Link>

                  <Link
                    to="/admin?tab=offline-logins"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm text-gray-600"
                  >
                    <span>📱 Offline Logins</span>
                    <span className={`text-xs font-bold ${offlineCounts.offlineLogins > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                      {offlineCounts.offlineLogins}
                    </span>
                  </Link>

                  <Link
                    to="/admin?tab=offline-orders"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm text-gray-600"
                  >
                    <span>📋 Offline Orders</span>
                    <span className={`text-xs font-bold ${offlineCounts.pendingOrders > 0 ? 'text-purple-600' : 'text-green-600'}`}>
                      {offlineCounts.pendingOrders}
                    </span>
                  </Link>

                  {/* Sync All Button */}
                  <button
                    onClick={() => {
                      alert('🔄 Syncing all offline data...');
                    }}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 mt-1 border-t border-gray-100 pt-2"
                  >
                    🔄 Sync All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          <Link 
            to="/contact" 
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact
          </Link>
        </nav>

        {/* Footer (Logout) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          {user ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          ) : (
            <Link 
              to="/login" 
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </Link>
          )}
        </div>
      </div>
    </>
  );
}