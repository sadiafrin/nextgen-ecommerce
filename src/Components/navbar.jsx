// src/Components/navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showOfflineDropdown, setShowOfflineDropdown] = useState(false);
  
  const navigate = useNavigate();
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

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* ✅ Left: Logo + Home */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 transition md:hidden"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-800">Quick<span className="text-blue-600">Buy</span></span>
              </Link>

              <Link to="/" className="hidden md:block text-sm text-gray-600 hover:text-blue-600 transition">
                Home
              </Link>
            </div>

            {/* ✅ Center: Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/orders" className="text-sm text-gray-600 hover:text-blue-600 transition">
                Orders
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin" className="text-sm text-gray-600 hover:text-blue-600 transition">
                    Admin
                  </Link>
                  
                  {/* Offline Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowOfflineDropdown(!showOfflineDropdown)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition"
                    >
                      Offline
                      {offlineCounts.total > 0 && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {offlineCounts.total}
                        </span>
                      )}
                      <svg className={`w-3 h-3 transition-transform ${showOfflineDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showOfflineDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-1 z-50">
                        <Link
                          to="/admin?tab=offline-users"
                          onClick={() => setShowOfflineDropdown(false)}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          <span>📦 Offline Registered</span>
                          <span className="font-medium">{offlineCounts.pendingUsers}</span>
                        </Link>
                        <Link
                          to="/admin?tab=offline-logins"
                          onClick={() => setShowOfflineDropdown(false)}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          <span>📱 Offline Logins</span>
                          <span className="font-medium">{offlineCounts.offlineLogins}</span>
                        </Link>
                        <Link
                          to="/admin?tab=offline-orders"
                          onClick={() => setShowOfflineDropdown(false)}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          <span>📋 Offline Orders</span>
                          <span className="font-medium">{offlineCounts.pendingOrders}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
              <Link to="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition">
                Contact
              </Link>
            </div>

            {/* ✅ Right Side: শুধু Cart + Auth (SearchBox নেই) */}
            <div className="flex items-center gap-4">
              <Link to="/cart" className="relative p-1.5 hover:bg-gray-100 rounded-md transition">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 hidden sm:block">Hi, {user.name || 'User'}</span>
                  <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 transition">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 transition">
                    Login
                  </Link>
                  <Link to="/register" className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition">
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