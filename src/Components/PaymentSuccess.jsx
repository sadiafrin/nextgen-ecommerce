// src/Components/PaymentSuccess.jsx
import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import generateInvoicePDF from '../context/Invoice'; // ✅ Invoice Generator ইম্পোর্ট

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getOrderById } = useOrder();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDownloading, setIsDownloading] = useState(false);

  const { orderId, amount, method } = location.state || {};

  // ✅ Online/Offline Status
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

  // ✅ অর্ডার ডেটা লোড
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        if (navigator.onLine) {
          const foundOrder = await getOrderById(orderId);
          if (foundOrder) {
            setOrder(foundOrder);
          }
        }

        const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
        const offlineOrder = pendingOrders.find(o => o.id === orderId);
        if (offlineOrder) {
          setOrder(offlineOrder);
        }

      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, getOrderById]);

  // ✅ Invoice Download Handler
  const handleDownloadInvoice = () => {
    if (!order) {
      alert('❌ Order data not found!');
      return;
    }

    setIsDownloading(true);
    try {
      console.log('📄 Downloading invoice for order:', order.id);
      generateInvoicePDF(order);
      console.log('✅ Invoice downloaded successfully!');
    } catch (error) {
      console.error('❌ Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ✅ অর্ডার না থাকলে হোমে রিডাইরেক্ট
  useEffect(() => {
    if (!loading && !order && !orderId) {
      navigate('/');
    }
  }, [loading, order, orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  const displayAmount = order?.totalPrice || order?.total || amount || 0;
  const displayMethod = order?.paymentMethod || method || 'Cash on Delivery';
  const displayStatus = order?.status || 'Confirmed';

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800">🎉 Payment Successful!</h1>
        <p className="text-gray-500 mt-2">Your order has been confirmed.</p>

        {/* Offline Badge */}
        {!isOnline && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <span className="text-lg">📡</span>
            <span>Offline Mode - Order will sync when online</span>
          </div>
        )}

        {/* Order Details */}
        <div className="mt-6 p-5 bg-gray-50 rounded-xl text-left space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Order ID</span>
            <span className="font-mono font-semibold">{orderId || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Status</span>
            <span className={`font-semibold ${
              displayStatus === 'Confirmed' || displayStatus === 'completed' 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              {displayStatus}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Payment Method</span>
            <span className="font-semibold capitalize">{displayMethod}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Mode</span>
            <span className={`font-semibold ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
              {isOnline ? '🟢 Online' : '📡 Offline'}
            </span>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between py-3 mt-2 border-t-2 border-orange-200">
            <span className="font-bold text-gray-800 text-lg">Total Amount</span>
            <span className="font-bold text-orange-500 text-xl">৳{displayAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Order Items Summary */}
        {order?.items && order.items.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-sm font-medium text-gray-600 mb-2">📦 Items ({order.items.length})</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {order.items.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium">×{item.quantity}</span>
                </div>
              ))}
              {order.items.length > 5 && (
                <p className="text-xs text-gray-400 text-center mt-1">+{order.items.length - 5} more items</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link 
            to="/orders" 
            className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2"
          >
            <span>📦</span> View My Orders
          </Link>
          <Link 
            to="/" 
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium flex items-center justify-center gap-2"
          >
            <span>🏠</span> Continue Shopping
          </Link>
        </div>

        {/* ✅ Invoice Download Button - Now Working */}
        <button 
          onClick={handleDownloadInvoice}
          disabled={isDownloading}
          className={`mt-4 px-6 py-2 rounded-lg transition flex items-center justify-center gap-2 mx-auto ${
            isDownloading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
          }`}
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <span>📄</span> Download Invoice
            </>
          )}
        </button>
      </div>
    </div>
  );
}