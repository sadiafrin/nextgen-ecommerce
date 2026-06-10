import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CartProvider from './context/CartContext';   // ✅ default import
import OrderProvider from './context/OrderContext'; // ✅ default import
import AuthProvider from './context/AuthContext';   // ✅ default import
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

// ⚠️ CartPage, OrdersPage, LoginPage → সাধারণত `pages` ফোল্ডারে রাখা হয়
import CartPage from './context/CartPage'; 
import OrdersPage from './context/OrdersPage'; 
import LoginPage from './context/LoginPage'; 
import RegisterPage from './context/RegisterPage'; // ✅ নতুন signup page

import localforage from 'localforage'; 
import productsData from './products.json';
import './App.css';

function App() {
  useEffect(() => {
    // ✅ Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(() => console.log('Service Worker Registered!'))
          .catch((err) => console.log('Registration Failed:', err));
      });
    }

    // ✅ IndexedDB Initialization with localforage
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
    <AuthProvider>   {/* ✅ default import দিয়ে wrap */}
      <CartProvider>
        <OrderProvider>
          <Router>
            <div className="flex min-h-screen bg-gray-100">
              <Sidebar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/login" element={<LoginPage />} /> {/* ✅ Login route */}
                  <Route path="/register" element={<RegisterPage />} /> {/* ✅ Register route */}
                </Routes>
              </main>
            </div>
          </Router>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
