// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
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
import './App.css';

function App() {
  const [toast, setToast] = useState(null);

  // ✅ Toast দেখানোর ফাংশন (global)
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ✅ Toast বন্ধ করা
  const hideToast = () => {
    setToast(null);
  };

  // ✅ Global Toast Listener (যেকোনো জায়গা থেকে কল করা যাবে)
  useEffect(() => {
    window.showToast = showToast;
    return () => { delete window.showToast; };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Navbar />
              <main className="flex-grow container mx-auto px-4 py-6">
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
                  <Route path="*" element={
                    <div className="flex items-center justify-center min-h-[60vh]">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-300">404</h1>
                        <p className="text-xl text-gray-500 mt-4">Page not found</p>
                        <a href="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
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