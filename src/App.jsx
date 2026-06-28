// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
// ✅ WishlistProvider সরিয়ে ফেলুন
import Navbar from './Components/navbar';
import Footer from './Components/Footer';
import Dashboard from './Components/Dashboard';
import LoginPage from './context/LoginPage';
import RegisterPage from './context/RegisterPage';
import OrdersPage from './context/OrdersPage';
import CartPage from './context/CartPage';
import AdminDashboard from './Components/AdminDashboard';
import ContactPage from './Components/ContactPage';
import PaymentPage from './Components/PaymentPage';
import PaymentSuccess from './Components/PaymentSuccess';
import Toast from './Components/Toast';
import SyncStatus from './Components/SyncStatus';
// ✅ WishlistPage ইম্পোর্ট সরিয়ে ফেলুন
import './App.css';

function App() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    window.showToast = showToast;
    return () => { delete window.showToast; };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          {/* ✅ WishlistProvider সরিয়ে ফেলুন */}
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Navbar />
              <main className="flex-1 container mx-auto px-4 py-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  {/* ✅ Wishlist Route সরিয়ে ফেলুন */}
                  <Route path="*" element={
                    <div className="flex items-center justify-center min-h-[60vh]">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-300">404</h1>
                        <p className="text-xl text-gray-500 mt-4">Page not found</p>
                        <a href="/" className="mt-6 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
                          Go Home
                        </a>
                      </div>
                    </div>
                  } />
                </Routes>
              </main>
              <Footer />
              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type || 'success'}
                  onClose={hideToast}
                />
              )}
              <SyncStatus />
            </div>
          </Router>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;