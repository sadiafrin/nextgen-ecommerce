import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { OrderContext } from '../context/OrderContext';
import { AuthContext } from '../context/AuthContext'; // ✅ Login context ইমপোর্ট
import { useNavigate } from 'react-router-dom';        // ✅ Redirect করার জন্য
import { jsPDF } from 'jspdf';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, setCart } = useContext(CartContext);
  const { placeOrder } = useContext(OrderContext);
  const { user } = useContext(AuthContext); // ✅ user state নিলাম
  const navigate = useNavigate();

  const totalPrice = cart.reduce((total, item) => {
    const priceValue = parseFloat(item.price.toString().replace(/[^0-9.-]+/g, ""));
    const quantity = item.quantity || 1;
    return total + (isNaN(priceValue) ? 0 : priceValue * quantity);
  }, 0);

  const handleCheckout = () => {
    // ✅ Login check
    if (!user) {
      alert("Please login to checkout!");
      navigate("/login"); // Login না থাকলে /login এ redirect হবে
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // ✅ OrderContext এ পাঠানো
    const newOrder = {
      items: cart,
      totalAmount: totalPrice,
    };
    placeOrder(newOrder);

    // ✅ Invoice তৈরি
    const doc = new jsPDF();
    doc.text("Invoice - NexGen E-Commerce", 20, 20);
    cart.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.name} (x${item.quantity || 1}) - ${item.price}`, 20, 40 + (index * 10));
    });
    doc.text(`Total: ${totalPrice.toFixed(2)}`, 20, 50 + (cart.length * 10));
    doc.save("invoice.pdf");

    // ✅ Cart খালি করা
    setCart([]);
    alert("✅ Order placed successfully! Cart is now empty.");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Your Cart ({cart.length} items)</h2>

      {cart.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">Your cart is empty!</p>
          <p className="text-green-600 mt-2">Your order has been placed successfully.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-blue-600">{item.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 bg-gray-200 rounded">-</button>
                  <span className="font-bold">{item.quantity || 1}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 bg-gray-200 rounded">+</button>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-4">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right">
            <p className="text-xl font-bold">Total: {totalPrice.toFixed(2)}</p>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleCheckout} 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 shadow-lg"
            >
              Buy Now & Download Invoice
            </button>
          </div>
        </>
      )}
    </div>
  );
}
