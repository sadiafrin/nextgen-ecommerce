// src/Components/Invoice.jsx
import React from 'react';

export default function Invoice({ order, onClose }) {
  if (!order) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `৳${price}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🧾 Invoice</h2>
              <p className="text-blue-100 text-sm">Order #{order.id?.slice(0, 8) || 'N/A'}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 text-2xl transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6">
          {/* Customer Info */}
          <div className="border-b pb-4 mb-4">
            <h3 className="font-semibold text-gray-700">Customer Details</h3>
            <p className="text-sm text-gray-600">Name: {order.customerName || 'Guest'}</p>
            <p className="text-sm text-gray-600">Email: {order.customerEmail || 'N/A'}</p>
            <p className="text-sm text-gray-600">Date: {formatDate(order.orderDate || order.createdAt)}</p>
          </div>

          {/* Items */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 border-b pb-2">
                  <img 
                    src={item.image || '/no-image.png'} 
                    alt={item.name} 
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => e.target.src = '/no-image.png'}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-blue-600">{formatPrice(order.totalPrice)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Status: {order.status || 'pending'}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              🖨️ Print Invoice
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}