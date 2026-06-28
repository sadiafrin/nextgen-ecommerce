// src/Components/Sidebar.jsx
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const { orders } = useOrder();
  const [showOfflineMenu, setShowOfflineMenu] = useState(false);
  const [offlineCounts, setOfflineCounts] = useState({ 
    pendingUsers: 0, 
    offlineLogins: 0, 
    pendingOrders: 0,
    total: 0 
  });
  
  const sidebarRef = useRef(null);
  const orderCount = orders?.length || 0;

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
      // ✅ Sidebar খুললে scroll to top
      if (sidebarRef.current) {
        sidebarRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* ✅ Sidebar with Scroll */}
      <div 
        ref={sidebarRef}
        className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#f97316 #f1f1f1'
        }}
      >
        {/* ✅ Custom Scrollbar Styles */}
        <style>{`
          .fixed::-webkit-scrollbar {
            width: 4px;
          }
          .fixed::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .fixed::-webkit-scrollbar-thumb {
            background: #f97316;
            border-radius: 10px;
          }
          .fixed::-webkit-scrollbar-thumb:hover {
            background: #ea580c;
          }
        `}</style>

        {/* ===== HEADER ===== */}
        <div className="sticky top-0 z-10 p-5 border-b bg-gradient-to-r from-orange-50 to-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                Q
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">Quick<span className="text-orange-500">Buy</span></span>
                <p className="text-[10px] text-gray-400 -mt-0.5">✨ Premium Store</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== USER INFO ===== */}
        <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-white">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">Hi, {user.name || 'User'} 👋</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-0.5 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                    ⚡ Admin
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-600">Welcome to QuickBuy! 🛍️</p>
              <Link 
                to="/login" 
                onClick={onClose}
                className="inline-block mt-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition"
              >
                Login / Register →
              </Link>
            </div>
          )}
        </div>

        {/* ===== NAVIGATION ===== */}
        <div className="p-4 space-y-1 pb-32">
          {/* Home */}
          <Link 
            to="/" 
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-orange-50 transition text-gray-700 group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </Link>

          {/* Cart */}
          <Link 
            to="/cart" 
            onClick={onClose}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-orange-50 transition text-gray-700 group"
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">Cart</span>
            </span>
            {totalItems > 0 && (
              <span className="bg-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md flex-shrink-0">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Orders */}
          <Link 
            to="/orders" 
            onClick={onClose}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-orange-50 transition text-gray-700 group"
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium">My Orders</span>
            </span>
            {orderCount > 0 && (
              <span className="bg-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md flex-shrink-0">
                {orderCount}
              </span>
            )}
          </Link>

          {/* Admin Dashboard */}
          {isAdmin && (
            <Link 
              to="/admin" 
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-orange-50 transition text-gray-700 group"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium">Admin Dashboard</span>
            </Link>
          )}

          {/* Offline Data Dropdown */}
          {isAdmin && (
            <div>
              <button
                onClick={() => setShowOfflineMenu(!showOfflineMenu)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-orange-50 transition text-gray-700 group"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="font-medium">Offline Data</span>
                  {offlineCounts.total > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">
                      {offlineCounts.total}
                    </span>
                  )}
                </span>
                <svg className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${showOfflineMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Offline Sub-menu */}
              {showOfflineMenu && (
                <div className="ml-6 space-y-1 border-l-2 border-orange-200 pl-3">
                  <Link
                    to="/admin?tab=offline-users"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-orange-50 transition text-sm text-gray-600"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">📦</span> Offline Registered
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      offlineCounts.pendingUsers > 0 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {offlineCounts.pendingUsers}
                    </span>
                  </Link>

                  <Link
                    to="/admin?tab=offline-logins"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-orange-50 transition text-sm text-gray-600"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">📱</span> Offline Logins
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      offlineCounts.offlineLogins > 0 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {offlineCounts.offlineLogins}
                    </span>
                  </Link>

                  <Link
                    to="/admin?tab=offline-orders"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-orange-50 transition text-sm text-gray-600"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">📋</span> Offline Orders
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      offlineCounts.pendingOrders > 0 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {offlineCounts.pendingOrders}
                    </span>
                  </Link>

                  {/* Sync All Button */}
                  <button
                    onClick={() => {
                      alert('🔄 Syncing all offline data...');
                    }}
                    className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-medium py-2 mt-1 border-t border-gray-100 pt-2 transition"
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
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-orange-50 transition text-gray-700 group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Contact Us</span>
          </Link>
        </div>

        {/* ===== FOOTER (Sticky) ===== */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t bg-gradient-to-r from-gray-50 to-white shadow-lg">
          {user ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 transition font-medium"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          ) : (
            <Link 
              to="/login" 
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition font-medium"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login / Register
            </Link>

          )}
        </div>
      </div>
    </>
  );
}