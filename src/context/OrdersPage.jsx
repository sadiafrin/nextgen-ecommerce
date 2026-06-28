// src/pages/OrdersPage.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Invoice from '../Components/Invoice';

export default function OrdersPage() {
  const { user } = useAuth();
  const { orders, loading, loadUserOrders, loadOfflineOrders } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // ✅ লোড অর্ডার - শুধু একবার কল হবে
  const loadOrders = useCallback(async () => {
    if (!user || isLoading || hasLoaded) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await loadUserOrders();
      setHasLoaded(true);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadUserOrders, isLoading, hasLoaded]);

  // ✅ শুধু মাউন্ট হলে লোড (ইউজার থাকলে)
  useEffect(() => {
    if (user && !hasLoaded && !isLoading) {
      loadOrders();
    }
  }, [user, hasLoaded, isLoading, loadOrders]);

  // ✅ অনলাইন হলে অফলাইন অর্ডার সিঙ্ক
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine && user && hasLoaded) {
        setSyncStatus('syncing');
        loadUserOrders().then(() => {
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 3000);
        });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, hasLoaded, loadUserOrders]);

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  // ✅ অফলাইন অর্ডার কাউন্ট - মেমোয়াইজড
  const offlineOrders = useMemo(() => loadOfflineOrders(), [loadOfflineOrders]);
  const pendingOfflineCount = useMemo(() => {
    return offlineOrders.filter(o => !o.synced).length;
  }, [offlineOrders]);

  // ✅ টোটাল প্রাইস ক্যালকুলেট - ফিক্সড
  const calculateTotal = useCallback((items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      // ✅ স্ট্রিং থেকে সংখ্যা বের করা
      let price = 0;
      if (typeof item.price === 'string') {
        // "৳1200" থেকে 1200 বের করা
        const cleaned = item.price.replace(/[^0-9.]/g, '');
        price = parseFloat(cleaned) || 0;
      } else {
        price = Number(item.price) || 0;
      }
      const quantity = Number(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  }, []);

  // ✅ প্রাইস ফরম্যাট
  const formatPrice = useCallback((price) => {
    return `৳${Number(price).toFixed(2)}`;
  }, []);

  // ✅ অর্ডার লিস্ট - মেমোয়াইজড
  const orderList = useMemo(() => {
    return orders.map((order) => {
      // ✅ অর্ডারের টোটাল রিক্যালকুলেট
      const calculatedTotal = calculateTotal(order.items);
      const orderTotal = order.totalPrice || order.totalAmount || 0;
      const displayTotal = calculatedTotal > 0 ? calculatedTotal : orderTotal;
      
      return {
        ...order,
        displayTotal: displayTotal,
        items: order.items || []
      };
    });
  }, [orders, calculateTotal]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-700">Please Login</h2>
          <p className="text-gray-400 mt-2">Login to view your orders</p>
          <Link to="/login" className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
            Login
          </Link>
        </div>
      </div>
    );
  }

  // ✅ লোডিং স্টেট
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600">Error Loading Orders</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => {
              setHasLoaded(false);
              loadOrders();
            }}
            className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (orderList.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-700">No Orders Yet</h2>
          <p className="text-gray-400 mt-2">Start shopping to place your first order!</p>
          <Link to="/" className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* ✅ Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📋 My Orders</h1>
          <p className="text-gray-500 text-sm">
            Total {orderList.length} orders
            {pendingOfflineCount > 0 && (
              <span className="ml-2 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-xs">
                {pendingOfflineCount} pending sync
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncStatus === 'syncing' && (
            <span className="text-sm text-blue-600 animate-pulse">🔄 Syncing...</span>
          )}
          {syncStatus === 'synced' && (
            <span className="text-sm text-green-600">✅ Synced</span>
          )}
          <button 
            onClick={() => {
              setHasLoaded(false);
              loadOrders();
            }}
            disabled={isLoading}
            className="text-gray-500 hover:text-blue-600 text-sm font-medium disabled:opacity-50"
          >
            🔄 Refresh
          </button>
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Continue Shopping →
          </Link>
        </div>
      </div>
      
      <div className="space-y-4">
        {orderList.map((order) => {
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-6">
              {/* ✅ Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID: <span className="font-mono text-gray-700">{order.id}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                  {order.isOffline && !order.synced && (
                    <p className="text-xs text-yellow-600 mt-1">📡 Offline - Pending sync</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {order.isOffline && !order.synced && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">📡 Offline</span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status || 'pending'}
                  </span>
                </div>
              </div>

              {/* ✅ Order Items */}
              <div className="border-t pt-4">
                {order.items && order.items.length > 0 ? (
                  order.items.slice(0, 3).map((item, index) => {
                    // ✅ প্রতিটি আইটেমের প্রাইস ক্যালকুলেট
                    let itemPrice = 0;
                    if (typeof item.price === 'string') {
                      const cleaned = item.price.replace(/[^0-9.]/g, '');
                      itemPrice = parseFloat(cleaned) || 0;
                    } else {
                      itemPrice = Number(item.price) || 0;
                    }
                    const itemQuantity = Number(item.quantity) || 1;
                    const itemTotal = itemPrice * itemQuantity;
                    
                    return (
                      <div key={item.id || index} className="flex items-center gap-4 py-2">
                        <img 
                          src={item.image || '/no-image.png'} 
                          alt={item.name} 
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => e.target.src = '/no-image.png'}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {itemQuantity}</p>
                        </div>
                        <p className="font-medium text-gray-800">{formatPrice(itemTotal)}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm">No items found</p>
                )}
                {order.items && order.items.length > 3 && (
                  <p className="text-sm text-gray-400 text-center mt-2">
                    +{order.items.length - 3} more items
                  </p>
                )}
              </div>

              {/* ✅ Order Footer - টোটাল দেখানো হচ্ছে */}
              <div className="border-t pt-4 flex justify-between items-center">
                <div>
                  <p className="text-xl font-bold text-gray-800">
                    Total: <span className="text-blue-600">{formatPrice(order.displayTotal)}</span>
                  </p>
                  {order.isOffline && !order.synced && (
                    <p className="text-xs text-gray-400 mt-1">⚠️ Will sync when online</p>
                  )}
                </div>
                <button
                  onClick={() => handleViewInvoice(order)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  📄 View Invoice
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Invoice Modal */}
      {showInvoice && selectedOrder && (
        <Invoice
          order={selectedOrder}
          onClose={() => {
            setShowInvoice(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}