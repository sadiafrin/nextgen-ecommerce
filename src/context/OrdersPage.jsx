// src/context/OrdersPage.jsx
import { useEffect, useState } from 'react';
import { useOrder } from './OrderContext';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import Invoice from '../Components/Invoice';

export default function OrdersPage() {
  const { user } = useAuth();
  const { orders, loading, loadUserOrders } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserOrders();
    }
  }, [user]);

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
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
          <p className="text-gray-500 text-sm">Total {orders.length} orders</p>
        </div>
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Continue Shopping →
        </Link>
      </div>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-6">
            {/* ✅ Order Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  Order ID: <span className="font-mono text-gray-700">{order.id}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.status || 'pending'}
              </span>
            </div>

            {/* ✅ Order Items */}
            <div className="border-t pt-4">
              {order.items && order.items.length > 0 ? (
                order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-2">
                    <img 
                      src={item.image || '/no-image.png'} 
                      alt={item.name} 
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => e.target.src = '/no-image.png'}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-800">৳{item.price}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No items found</p>
              )}
              {order.items && order.items.length > 3 && (
                <p className="text-sm text-gray-400 text-center mt-2">
                  +{order.items.length - 3} more items
                </p>
              )}
            </div>

            {/* ✅ Order Footer */}
            <div className="border-t pt-4 flex justify-between items-center">
              <p className="text-xl font-bold text-gray-800">
                Total: <span className="text-blue-600">৳{order.totalPrice}</span>
              </p>
              <button
                onClick={() => handleViewInvoice(order)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                📄 View Invoice
              </button>
            </div>
          </div>
        ))}
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