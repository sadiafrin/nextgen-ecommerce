// src/Components/PaymentSuccess.jsx
import { useLocation, Link } from 'react-router-dom';

export default function PaymentSuccess() {
  const location = useLocation();
  const { orderId, amount, method } = location.state || {};

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800">Payment Successful!</h1>
        <p className="text-gray-500 mt-2">Your order has been confirmed.</p>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-sm space-y-2">
          <p><span className="font-medium">Order ID:</span> {orderId || 'N/A'}</p>
          <p><span className="font-medium">Amount:</span> ৳{amount || 0}</p>
          <p><span className="font-medium">Payment Method:</span> {method || 'N/A'}</p>
        </div>

        <Link to="/orders" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          View My Orders
        </Link>
      </div>
    </div>
  );
}