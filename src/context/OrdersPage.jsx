import { useContext } from "react";
import { OrderContext } from "../context/OrderContext";

export default function OrdersPage() {
  const { orders, clearOrders } = useContext(OrderContext);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Your Orders</h2>

      {(!orders || orders.length === 0) ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded shadow">
              <p className="font-semibold">Order Date: {order.date || "N/A"}</p>
              <p className="text-blue-600">
                Total: ৳{Number(order.totalPrice || 0).toFixed(2)}
              </p>
              <ul className="mt-2 list-disc list-inside">
                {order.items?.map((item, i) => (
                  <li key={i}>
                    {item.name} (x{item.quantity || 1}) - ৳
                    {Number(item.price?.toString().replace(/[^0-9.-]+/g, ""))}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* ✅ Clear Orders Button */}
          <div className="mt-6">
            <button
              onClick={clearOrders}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Clear All Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
