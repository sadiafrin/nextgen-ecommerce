import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { metricsStore } from "../db";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);

  // ✅ সবসময় top-level এ useState
  const [stats, setStats] = useState({
    newCustomers: 0,
    totalOrders: 0,
    monthlySales: 0,
    totalLogins: 0,
  });

  const loadStats = async () => {
    const newCustomers = parseInt(await metricsStore.getItem("newCustomers") || "0");
    const totalOrders = parseInt(await metricsStore.getItem("totalOrders") || "0");
    const monthlySales = parseInt(await metricsStore.getItem("monthlySales") || "0");
    const totalLogins = parseInt(await metricsStore.getItem("totalLogins") || "0");
    setStats({ newCustomers, totalOrders, monthlySales, totalLogins });
  };

  useEffect(() => {
    loadStats();
    const handleStorageChange = () => loadStats();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ এখন conditional return safe
  if (!user || !user.isAdmin) {
    return <div className="p-6 text-red-500 font-bold">Access Denied! Admin only.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of business performance</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold">Total Logins</h2>
          <p className="text-2xl font-bold text-orange-600">{stats.totalLogins}</p>
        </div>
      </div>

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
