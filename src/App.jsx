import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CartProvider from './context/CartContext';   // ✅ 그대로
import OrderProvider from './context/OrderContext'; // ✅ 그대로
import AuthProvider from './context/AuthContext';   // ✅ 그대로
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';

// ⚠️ 그대로 context ফোল্ডার থেকে import
import CartPage from './context/CartPage'; 
import OrdersPage from './context/OrdersPage'; 
import LoginPage from './context/LoginPage'; 
import RegisterPage from './context/RegisterPage'; 

import localforage from 'localforage'; 
import productsData from './products.json';
import './App.css';

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(() => console.log('Service Worker Registered!'))
          .catch((err) => console.log('Registration Failed:', err));
      });
    }

    const initDatabase = async () => {
      try {
        const existingData = await localforage.getItem('products');
        if (!existingData) {
          await localforage.setItem('products', productsData);
        }
      } catch (err) {
        console.error('Error initializing IndexedDB:', err);
      }
    };

    initDatabase();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <Router>
            <div className="flex min-h-screen bg-gray-100 flex-col">
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Routes>
                </main>
              </div>
              <Footer /> {/* ✅ Footer সব page এ দেখাবে */}
            </div>
          </Router>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
