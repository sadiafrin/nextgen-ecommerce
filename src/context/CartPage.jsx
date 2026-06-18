import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { OrderContext } from '../context/OrderContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const { placeOrder } = useContext(OrderContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ✅ সবসময় number হিসেবে হিসাব করো
  const totalPrice = cart.reduce((total, item) => {
    const priceValue = Number(item.price?.toString().replace(/[^0-9.-]+/g, ""));
    const quantity = item.quantity || 1;
    return total + (isNaN(priceValue) ? 0 : priceValue * quantity);
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      alert("Please login to checkout!");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // ✅ নতুন order বানানো (number হিসেবে totalPrice save)
    const newOrder = {
      id: Date.now(),
      items: cart,
      totalPrice: Number(totalPrice.toFixed(2)), 
      customer: user.email
    };

    // ✅ LocalStorage এ orders save করা
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));

    // ✅ Context এও order পাঠানো
    placeOrder(newOrder);

    // ✅ Invoice তৈরি
    const doc = new jsPDF();
    doc.text("Invoice - NexGen E-Commerce", 20, 20);
    cart.forEach((item, index) => {
      const itemPrice = Number(item.price?.toString().replace(/[^0-9.-]+/g, ""));
      doc.text(
        `${index + 1}. ${item.name} (x${item.quantity || 1}) - ৳${itemPrice}`,
        20,
        40 + (index * 10)
      );
    });
    doc.text(`Total: ৳${totalPrice.toFixed(2)}`, 20, 50 + (cart.length * 10));
    doc.save("invoice.pdf");

    clearCart(); // ✅ cart খালি করা
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
                  <button
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    -
                  </button>

                  <span className="font-bold">{item.quantity || 1}</span>

                  <button
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    +
                  </button>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 ml-4"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right">
            <p className="text-xl font-bold">Total: ৳{totalPrice.toFixed(2)}</p>
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
