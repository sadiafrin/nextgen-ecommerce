// src/Components/navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, isAdmin, logout } = useAuth();

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
        isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-md shadow-sm'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* ✅ Left: Logo + Navigation Links */}
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle (Mobile) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition md:hidden"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-lg transition">
                  Q
                </div>
                <span className="font-bold text-xl text-gray-800 group-hover:text-blue-600 transition">
                  Quick<span className="text-blue-600 group-hover:text-gray-800 transition">Buy</span>
                </span>
              </Link>

              {/* ✅ Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-8 ml-4">
                <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
                  Home
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
                  Orders
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
                    Admin
                  </Link>
                )}
                <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
                  Contact
                </Link>
              </div>
            </div>

            {/* ✅ Desktop Right Side - শুধু Cart + Auth (Search Bar সরানো হয়েছে) */}
            <div className="hidden md:flex items-center gap-4">
              {/* ❌ Search Bar সরানো হয়েছে */}

              {/* Cart */}
              <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition group">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hi, {user.name || 'User'}</span>
                  <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium transition">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* ✅ Mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}