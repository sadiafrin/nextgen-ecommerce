// src/Components/PaymentPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { placeOrder } = useOrder();
  const { cartItems, totalPrice, clearCart } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // ✅ Delivery Info State
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: user?.displayName || user?.name || '',
    phone: '',
    address: '',
    city: 'Dhaka',
    area: '',
    deliveryNote: ''
  });

  const [deliveryErrors, setDeliveryErrors] = useState({});

  // ✅ User থেকে ডেটা আনা
  useEffect(() => {
    if (user) {
      setDeliveryInfo(prev => ({
        ...prev,
        fullName: user.displayName || user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // ✅ কার্ট খালি থাকলে কার্ট পেজে রিডাইরেক্ট
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // ✅ Calculate Total
  const calculateTotal = () => {
    if (cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => {
      let price = 0;
      if (typeof item.price === 'string') {
        const cleaned = item.price.replace(/[^0-9.]/g, '');
        price = parseFloat(cleaned) || 0;
      } else {
        price = Number(item.price) || 0;
      }
      const qty = Number(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);
  };

  const total = calculateTotal();

  // ✅ Delivery Info Validation
  const validateDeliveryInfo = () => {
    const errors = {};
    if (!deliveryInfo.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!deliveryInfo.phone.trim() || deliveryInfo.phone.length < 11) {
      errors.phone = 'Valid phone number is required (11 digits)';
    }
    if (!deliveryInfo.address.trim()) {
      errors.address = 'Delivery address is required';
    }
    if (!deliveryInfo.city.trim()) {
      errors.city = 'City is required';
    }
    if (!deliveryInfo.area.trim()) {
      errors.area = 'Area is required';
    }
    setDeliveryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ পেমেন্ট প্রসেস
  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Delivery Info Validate
    if (!validateDeliveryInfo()) {
      setError('Please fill all delivery information correctly');
      return;
    }
    
    if (!user) {
      setError('Please login to continue');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (total === 0) {
      setError('Your cart is empty!');
      return;
    }

    // ✅ Card Validation
    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 16) {
        setError('Please enter a valid 16-digit card number');
        return;
      }
      if (cardName.length < 3) {
        setError('Please enter card holder name');
        return;
      }
      if (cardExpiry.length < 5) {
        setError('Please enter valid expiry date (MM/YY)');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Please enter valid CVV');
        return;
      }
    } else if (paymentMethod === 'bkash') {
      if (bkashNumber.length < 11) {
        setError('Please enter a valid bKash number (11 digits)');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // ✅ Payment Status based on method
      const paymentStatus = paymentMethod === 'cash' ? 'unpaid' : 'completed';
      
      const orderId = await placeOrder(cartItems, total);
      
      if (!orderId) {
        throw new Error('Failed to create order');
      }

      const paymentData = {
        orderId: orderId,
        amount: total,
        method: paymentMethod,
        status: paymentStatus, // ✅ 'unpaid' for COD, 'completed' for others
        customerId: user.uid,
        customerEmail: user.email,
        customerName: user.displayName || user.email || 'Guest',
        deliveryInfo: deliveryInfo, // ✅ Delivery Info
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        paymentDate: new Date().toISOString(),
        isOffline: !navigator.onLine,
        paymentNote: paymentMethod === 'cash' ? 'Cash on Delivery - Pay upon receipt' : ''
      };

      // ✅ Save to Firebase or localStorage
      if (navigator.onLine) {
        try {
          const docRef = await addDoc(collection(db, 'payments'), paymentData);
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            paymentId: docRef.id,
            paymentStatus: paymentStatus,
            paymentMethod: paymentMethod,
            deliveryInfo: deliveryInfo
          });
        } catch (firebaseError) {
          const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
          pendingPayments.push({ ...paymentData, synced: false });
          localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
        }
      } else {
        const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
        pendingPayments.push({ ...paymentData, synced: false });
        localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
      }

      clearCart();

      setTimeout(() => {
        navigate('/payment/success', { 
          state: { 
            orderId: orderId,
            amount: total,
            method: paymentMethod,
            paymentStatus: paymentStatus,
            deliveryInfo: deliveryInfo
          } 
        });
      }, 1500);

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'bkash': return '📱';
      case 'nagad': return '📱';
      default: return '💰';
    }
  };

  const getPaymentLabel = (method) => {
    switch(method) {
      case 'cash': return 'Cash on Delivery';
      case 'card': return 'Credit/Debit Card';
      case 'bkash': return 'bKash';
      case 'nagad': return 'Nagad';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">💳 Complete Payment</h1>
          <p className="text-gray-500 mt-2">Review your order and complete payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ✅ Delivery Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📍 Delivery Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.fullName}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, fullName: e.target.value})}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      deliveryErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {deliveryErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{deliveryErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={deliveryInfo.phone}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                    placeholder="017XXXXXXXX"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      deliveryErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {deliveryErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{deliveryErrors.phone}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                    placeholder="House #, Road #, Area, District"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      deliveryErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows="2"
                    required
                  />
                  {deliveryErrors.address && (
                    <p className="text-red-500 text-xs mt-1">{deliveryErrors.address}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={deliveryInfo.city}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      deliveryErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barishal">Barishal</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                  {deliveryErrors.city && (
                    <p className="text-red-500 text-xs mt-1">{deliveryErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.area}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, area: e.target.value})}
                    placeholder="Mirpur, Gulshan, Dhanmondi"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      deliveryErrors.area ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {deliveryErrors.area && (
                    <p className="text-red-500 text-xs mt-1">{deliveryErrors.area}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.deliveryNote}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, deliveryNote: e.target.value})}
                    placeholder="Any special instructions for delivery"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* ✅ Payment Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">💳 Payment Method</h2>
              
              <form onSubmit={handlePayment}>
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {['cash', 'card', 'bkash', 'nagad'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-lg border-2 transition ${
                          paymentMethod === method 
                            ? 'border-orange-500 bg-orange-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-2xl">{getPaymentIcon(method)}</div>
                        <p className="text-sm font-medium mt-1">{getPaymentLabel(method)}</p>
                        {method === 'cash' && (
                          <p className="text-xs text-yellow-600 mt-0.5">💵 Pay on delivery</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash on Delivery Info */}
                {paymentMethod === 'cash' && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💵 <strong>Cash on Delivery</strong> - You will pay when you receive the package.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Status: <span className="font-bold">Unpaid</span> (Pay upon delivery)
                    </p>
                  </div>
                )}

                {/* Card Payment Form */}
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
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          maxLength="4"
                          required={paymentMethod === 'card'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* bKash Payment Form */}
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
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        maxLength="11"
                        required={paymentMethod === 'bkash'}
                      />
                      <p className="text-xs text-gray-400 mt-1">📱 Demo OTP will be sent to this number</p>
                    </div>
                  </div>
                )}

                {/* Nagad Payment Form */}
                {paymentMethod === 'nagad' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nagad Number
                      </label>
                      <input
                        type="text"
                        placeholder="017XXXXXXXX"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required={paymentMethod === 'nagad'}
                      />
                      <p className="text-xs text-gray-400 mt-1">📱 Demo OTP will be sent to this number</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-200'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Pay ৳${total.toFixed(0)}`
                  )}
                </button>

                {/* Status */}
                <div className="mt-4 text-center">
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    navigator.onLine 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {navigator.onLine ? '🟢 Online Mode' : '📡 Offline Mode'}
                  </span>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="font-bold text-lg text-gray-800 mb-4">📋 Order Summary</h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cartItems.map((item, index) => {
                  let price = 0;
                  if (typeof item.price === 'string') {
                    const cleaned = item.price.replace(/[^0-9.]/g, '');
                    price = parseFloat(cleaned) || 0;
                  } else {
                    price = Number(item.price) || 0;
                  }
                  const qty = Number(item.quantity) || 1;
                  
                  return (
                    <div key={index} className="flex items-center gap-3 py-2 border-b last:border-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {qty}</p>
                      </div>
                      <p className="font-medium text-sm">৳{(price * qty).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t my-4"></div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">৳{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-orange-500">৳{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* ✅ Payment Status Indicator */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-bold ${
                      paymentMethod === 'cash' 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    }`}>
                      {paymentMethod === 'cash' ? '🟡 Unpaid' : '🟢 Paid'}
                    </span>
                  </div>
                  {paymentMethod === 'cash' && (
                    <p className="text-xs text-yellow-600 mt-1">💵 Pay when you receive</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('/cart')}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                ← Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}