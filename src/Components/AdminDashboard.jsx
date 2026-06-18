import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);

  if (!user || !user.isAdmin) {
    return <div className="p-6 text-red-500 font-bold">Access Denied! Admin only.</div>;
  }

  const [stats, setStats] = useState({
    newCustomers: 0,
    totalOrders: 0,
    monthlySales: 0,
  });

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    // ✅ Customers count
    const newCustomers = users.filter(u => u.role === "customer").length;

    // ✅ Orders count
    const totalOrders = orders.length;

    // ✅ Monthly Sales calculation (সবসময় number conversion)
    const monthlySales = orders.reduce((sum, order) => {
      if (order.totalPrice) {
        return sum + Number(order.totalPrice);
      }
      if (order.items) {
        return sum + order.items.reduce((s, item) => {
          const priceValue = Number(item.price?.toString().replace(/[^0-9.-]+/g, ""));
          const quantity = item.quantity || 1;
          return s + (isNaN(priceValue) ? 0 : priceValue * quantity);
        }, 0);
      }
      return sum;
    }, 0);

    setStats({ newCustomers, totalOrders, monthlySales });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of business performance</p>

      {/* ✅ Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold">New Customers</h2>
          <p className="text-2xl font-bold text-blue-600">{stats.newCustomers}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold">Total Orders</h2>
          <p className="text-2xl font-bold text-green-600">{stats.totalOrders}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold">Monthly Sales</h2>
          <p className="text-2xl font-bold text-purple-600">
            ৳{Number(stats.monthlySales).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ✅ Inventory Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
        <Link to="/inventory">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Go to Inventory
          </button>
        </Link>
      </div>
    </div>
  );
}
