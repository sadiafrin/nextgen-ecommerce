// src/Components/PaymentPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { placeOrder } = useOrder();
  const { cartItems, totalPrice, clearCart } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // ✅ কার্ট খালি থাকলে হোমে রিডাইরেক্ট
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // ✅ পেমেন্ট প্রসেস
  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    
    // ✅ ইউজার চেক
    if (!user) {
      setError('Please login to continue');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // ✅ ফর্ম ভ্যালিডেশন
    if (paymentMethod === 'card') {
      if (cardNumber.length < 16) {
        setError('Please enter a valid card number');
        return;
      }
      if (cardName.length < 3) {
        setError('Please enter card holder name');
        return;
      }
    } else if (paymentMethod === 'bkash') {
      if (bkashNumber.length < 11) {
        setError('Please enter a valid bKash number');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // ✅ ১. অর্ডার প্লেস করুন
      const orderId = await placeOrder(cartItems, totalPrice);
      
      // ✅ ২. পেমেন্ট ডেটা তৈরি করুন
      const paymentData = {
        orderId: orderId,
        amount: totalPrice,
        method: paymentMethod,
        status: 'completed',
        customerId: user.uid,
        customerEmail: user.email,
        paymentDate: new Date().toISOString(),
        isOffline: !navigator.onLine
      };

      // ✅ ৩. পেমেন্ট সেভ করুন (Offline/Online)
      const isOnline = navigator.onLine;
      if (isOnline) {
        // Online → Firebase-এ সেভ
        const { db } = await import('../firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        await addDoc(collection(db, 'payments'), paymentData);
        console.log('✅ Payment saved to Firebase');
      } else {
        // Offline → localStorage-এ সেভ
        const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
        pendingPayments.push({ ...paymentData, synced: false });
        localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
        console.log('📦 Payment saved offline');
      }

      // ✅ ৪. কার্ট ক্লিয়ার করুন
      clearCart();

      // ✅ ৫. সাকসেস পেজে রিডাইরেক্ট
      setTimeout(() => {
        navigate('/payment/success', { 
          state: { 
            orderId: orderId,
            amount: totalPrice,
            method: paymentMethod
          } 
        });
      }, 1500);

    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed: ' + error.message);
      setIsProcessing(false);
    }
  };

  // ✅ ফরম্যাট কার্ড নম্বর
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.slice(0, 19);
  };

  // ✅ ফরম্যাট এক্সপায়ারি
  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ✅ Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">💳 Complete Payment</h1>
          <p className="text-gray-500 mt-2">Total Amount: <span className="font-bold text-blue-600">৳{totalPrice.toFixed(0)}</span></p>
        </div>

        {/* ✅ Payment Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handlePayment}>
            
            {/* ✅ Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border-2 transition ${
                    paymentMethod === 'card' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-3 rounded-lg border-2 transition ${
                    paymentMethod === 'bkash' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📱 bKash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-3 rounded-lg border-2 transition ${
                    paymentMethod === 'nagad' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📱 Nagad
                </button>
              </div>
            </div>

            {/* ✅ Card Payment Form */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="19"
                    required={paymentMethod === 'card'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={paymentMethod === 'card'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength="5"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength="4"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ✅ bKash Payment Form */}
            {paymentMethod === 'bkash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    bKash Number
                  </label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="11"
                    required={paymentMethod === 'bkash'}
                  />
                  <p className="text-xs text-gray-400 mt-1">Demo OTP will be sent to this number</p>
                </div>
              </div>
            )}

            {/* ✅ Nagad Payment Form */}
            {paymentMethod === 'nagad' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nagad Number
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={paymentMethod === 'nagad'}
                  />
                  <p className="text-xs text-gray-400 mt-1">Demo OTP will be sent to this number</p>
                </div>
              </div>
            )}

            {/* ✅ Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* ✅ Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
                isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing Payment...
                </span>
              ) : (
                `Pay ৳${totalPrice.toFixed(0)}`
              )}
            </button>

            {/* ✅ Offline/Online Status */}
            <div className="mt-4 text-center">
              <span className={`text-xs px-3 py-1 rounded-full ${
                navigator.onLine 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {navigator.onLine ? '🔵 Online Mode' : '📡 Offline Mode (Payment will be synced later)'}
              </span>
            </div>
          </form>
        </div>

        {/* ✅ Back to Cart */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/cart')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
}