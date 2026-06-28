// src/Components/navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showOfflineDropdown, setShowOfflineDropdown] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { user, isAdmin, logout } = useAuth();

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

  const [offlineCounts, setOfflineCounts] = useState(getOfflineCounts());

  useEffect(() => {
    const interval = setInterval(() => {
      setOfflineCounts(getOfflineCounts());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-white/80 backdrop-blur-sm shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* ✅ Left: Logo + Brand */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100/80 transition lg:hidden"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-md group-hover:shadow-lg transition">
                  Q
                </div>
                <div>
                  <span className="text-xl lg:text-2xl font-bold text-gray-800">Quick<span className="text-orange-500">Buy</span></span>
                  <span className="hidden lg:block text-[11px] text-gray-400 -mt-0.5">✨ Premium Store</span>
                </div>
              </Link>
            </div>

            {/* ✅ Center: Navigation Links */}
            <div className="hidden lg:flex items-center gap-1.5">
              <Link 
                to="/" 
                className={`px-5 py-2.5 rounded-xl text-base lg:text-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive('/') 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              
              <Link 
                to="/orders" 
                className={`px-5 py-2.5 rounded-xl text-base lg:text-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive('/orders') 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Orders
              </Link>

              {isAdmin && (
                <>
                  <Link 
                    to="/admin" 
                    className={`px-5 py-2.5 rounded-xl text-base lg:text-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive('/admin') 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Admin
                  </Link>
                  
                  {/* Offline Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowOfflineDropdown(!showOfflineDropdown)}
                      className={`px-5 py-2.5 rounded-xl text-base lg:text-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        showOfflineDropdown 
                          ? 'bg-orange-50 text-orange-600' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Offline
                      {offlineCounts.total > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                          {offlineCounts.total}
                        </span>
                      )}
                      <svg className={`w-3.5 h-3.5 transition-transform ${showOfflineDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showOfflineDropdown && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
                        <Link
                          to="/admin?tab=offline-users"
                          onClick={() => setShowOfflineDropdown(false)}
                          className="flex items-center justify-between px-5 py-3 hover:bg-orange-50 text-base transition"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Offline Registered
                          </span>
                          <span className={`font-bold ${offlineCounts.pendingUsers > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {offlineCounts.pendingUsers}
                          </span>
                        </Link>
                        <Link
                          to="/admin?tab=offline-logins"
                          onClick={() => setShowOfflineDropdown(false)}
                          className="flex items-center justify-between px-5 py-3 hover:bg-orange-50 text-base transition"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Offline Logins
                          </span>
                          <span className={`font-bold ${offlineCounts.offlineLogins > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {offlineCounts.offlineLogins}
                          </span>
                        </Link>
                        <Link
                          to="/admin?tab=offline-orders"
                          onClick={() => setShowOfflineDropdown(false)}
                          className="flex items-center justify-between px-5 py-3 hover:bg-orange-50 text-base transition"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Offline Orders
                          </span>
                          <span className={`font-bold ${offlineCounts.pendingOrders > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {offlineCounts.pendingOrders}
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Link 
                to="/contact" 
                className={`px-5 py-2.5 rounded-xl text-base lg:text-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive('/contact') 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </Link>
            </div>

            {/* ✅ Right Side: Cart + Auth */}
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Cart Button */}
              <Link 
                to="/cart" 
                className="relative p-2.5 lg:p-3 rounded-xl hover:bg-gray-100/80 transition group"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600 group-hover:text-orange-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Section */}
              {user ? (
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm lg:text-base font-bold shadow-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm lg:text-base font-medium text-gray-700">Hi, {user.name || 'User'}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 lg:px-5 lg:py-2.5 text-sm lg:text-base font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 lg:gap-3">
                  <Link 
                    to="/login" 
                    className="px-4 py-2 lg:px-5 lg:py-2.5 text-sm lg:text-base font-medium text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-5 py-2 lg:px-6 lg:py-2.5 text-sm lg:text-base font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}