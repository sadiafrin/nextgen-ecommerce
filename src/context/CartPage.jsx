// src/context/CartPage.jsx
import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { 
    cartItems, 
    removeFromCart, 
    increaseQuantity,
    decreaseQuantity,
    totalPrice, 
    totalItems,
    clearCart
  } = useCart();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState('');

  // Cart খালি থাকলে মেসেজ দেখান
  if (cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
          <p className="text-gray-400 mt-2">Looks like you haven't added any items yet.</p>
          <Link 
            to="/" 
            className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Checkout Handler - Payment Page-এ রিডাইরেক্ট
  const handleCheckout = () => {
    // ইউজার চেক
    if (!user) {
      setError('⚠️ Please login to place your order!');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // ইউজার uid চেক
    if (!user.uid) {
      setError('⚠️ User session expired. Please login again.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // কার্ট খালি চেক
    if (cartItems.length === 0) {
      setError('⚠️ Your cart is empty!');
      return;
    }

    // ✅ Payment Page-এ রিডাইরেক্ট
    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Shopping Cart
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </span>
          </h1>
          <button 
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 text-sm font-medium mt-2 sm:mt-0"
          >
            Clear Cart
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Cart Items Grid */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-semibold text-gray-600 text-sm">
            <div className="col-span-5">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-1 text-center">Total</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* Cart Items */}
          {cartItems.map((item) => {
            const price = typeof item.price === 'string' 
              ? parseFloat(item.price.replace(/[^0-9.]/g, '')) 
              : item.price;
            const itemTotal = price * (item.quantity || 1);

            return (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 transition">
                
                {/* Product Info */}
                <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                  <img 
                    src={item.image || '/no-image.png'} 
                    alt={item.name}
                    loading="lazy"
                    className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg shadow-sm"
                    onError={(e) => e.target.src = '/no-image.png'}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 truncate text-sm md:text-base">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase">{item.category || 'General'}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.stock === 'In Stock' || item.stock === 'Available'
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.stock || 'In Stock'}
                    </span>
                  </div>
                </div>

                {/* Price (Desktop) */}
                <div className="col-span-2 hidden md:flex items-center justify-center font-medium text-gray-700">
                  ৳{price}
                </div>

                {/* Quantity Controls */}
                <div className="col-span-1 md:col-span-3 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => decreaseQuantity(item.id)}
                    className="w-8 h-8 rounded-full border hover:bg-gray-100 flex items-center justify-center transition"
                    disabled={(item.quantity || 1) <= 1}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity || 1}</span>
                  <button 
                    onClick={() => increaseQuantity(item.id)}
                    className="w-8 h-8 rounded-full border hover:bg-gray-100 flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>

                {/* Item Total (Desktop) */}
                <div className="col-span-1 hidden md:flex items-center justify-center font-bold text-blue-600">
                  ৳{itemTotal.toFixed(0)}
                </div>

                {/* Remove Button */}
                <div className="col-span-1 flex items-center justify-center">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Mobile: Price & Total */}
                <div className="md:hidden flex justify-between items-center mt-2 pt-2 border-t">
                  <div>
                    <span className="text-sm text-gray-500">Price:</span>
                    <span className="font-medium ml-1">৳{price}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total:</span>
                    <span className="font-bold text-blue-600 ml-1">৳{itemTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
            </div>

            <div className="text-right w-full md:w-auto">
              <div className="flex justify-between md:justify-end gap-8 text-sm text-gray-600">
                <span>Subtotal ({totalItems} items):</span>
                <span>৳{totalPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-8 text-sm text-gray-600 mt-1">
                <span>Shipping:</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between md:justify-end gap-8 text-xl font-bold text-gray-800 mt-2 pt-2 border-t">
                <span>Total:</span>
                <span className="text-blue-600">৳{totalPrice.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* ✅ Checkout Button - Payment Page-এ যাবে */}
          <div className="mt-4 text-right">
            <button 
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className={`px-8 py-3 rounded-lg font-semibold transition w-full md:w-auto ${
                cartItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              Proceed to Payment →
            </button>
            {!user && (
              <p className="text-xs text-gray-400 mt-2">
                ⚠️ You need to login to place your order
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}