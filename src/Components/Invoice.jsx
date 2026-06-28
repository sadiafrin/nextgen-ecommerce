// src/Components/Invoice.jsx
import React, { useState } from 'react';
import generateInvoicePDF from '../context/Invoice';

export default function Invoice({ order, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!order) return null;

  // টোটাল ক্যালকুলেট
  const subtotal = order.items?.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + (price * qty);
  }, 0) || 0;

  const tax = subtotal * 0.05;
  const shipping = 60;
  const total = subtotal + tax + shipping;

  const handleDownload = async () => {
    console.log('📥 Download button clicked for order:', order.id);
    setIsDownloading(true);
    
    try {
      if (typeof generateInvoicePDF !== 'function') {
        throw new Error('generateInvoicePDF function is not available');
      }
      
      console.log('📄 Generating PDF for order:', order.id);
      const result = generateInvoicePDF(order);
      
      if (result) {
        console.log('✅ PDF downloaded successfully');
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again. Error: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-500">🧾 Invoice</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6" id="invoice-content">
          
          {/* Company Info - QuickBuy */}
          <div className="text-center border-b pb-4 mb-4">
            <h3 className="text-2xl font-bold text-orange-500">🛍️ QuickBuy</h3>
            <p className="text-gray-600 text-sm">QuickBuy Online Store</p>
            <p className="text-gray-500 text-sm">Dhaka, Bangladesh | 📞 +880 1234-567890</p>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-gray-500 text-xs uppercase font-semibold">Order Details</p>
              <p className="mt-1"><span className="text-gray-500">Order ID:</span> <span className="font-mono">{order.id?.slice(0, 12)}</span></p>
              <p><span className="text-gray-500">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
              <p><span className="text-gray-500">Status:</span> 
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  order.status === 'completed' || order.status === 'delivered' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {order.status || 'Pending'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-semibold">Payment</p>
              <p className="mt-1 font-medium">{order.paymentMethod || 'Cash on Delivery'}</p>
              <p className="text-gray-500 text-xs uppercase font-semibold mt-2">Bill To</p>
              <p className="font-medium">{order.customerName || 'Guest Customer'}</p>
              <p className="text-gray-600 text-sm">{order.customerEmail || 'guest@email.com'}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Item</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-600">Qty</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600">Price</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, index) => {
                  const price = parseFloat(item.price) || 0;
                  const qty = parseInt(item.quantity) || 1;
                  return (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-3">{qty}</td>
                      <td className="text-right p-3">৳{price.toFixed(2)}</td>
                      <td className="text-right p-3 font-medium">৳{(price * qty).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr><td colSpan="3" className="text-right p-3 font-medium">Subtotal</td><td className="text-right p-3">৳{subtotal.toFixed(2)}</td></tr>
                <tr><td colSpan="3" className="text-right p-3">Tax (5%)</td><td className="text-right p-3">৳{tax.toFixed(2)}</td></tr>
                <tr><td colSpan="3" className="text-right p-3">Shipping</td><td className="text-right p-3">৳{shipping.toFixed(2)}</td></tr>
                <tr className="bg-orange-50">
                  <td colSpan="3" className="text-right p-3 text-lg font-bold text-gray-800">Total</td>
                  <td className="text-right p-3 text-lg font-bold text-orange-500">৳{total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>Thank you for shopping with QuickBuy! 🛍️</p>
            <p className="text-xs">Visit us: www.quickbuy.com</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              isDownloading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                ⬇️ Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .fixed { position: static !important; }
          .inset-0 { inset: auto !important; }
          .bg-black { background: white !important; }
          .bg-opacity-50 { background: white !important; }
          .sticky { position: static !important; }
          .max-h-[90vh] { max-height: none !important; }
          .overflow-y-auto { overflow: visible !important; }
          .bg-orange-50 { background: #fff7ed !important; -webkit-print-color-adjust: exact !important; }
          .bg-orange-500 { background: #f97316 !important; -webkit-print-color-adjust: exact !important; }
          .text-orange-500 { color: #f97316 !important; }
        }
      `}</style>
    </div>
  );
}