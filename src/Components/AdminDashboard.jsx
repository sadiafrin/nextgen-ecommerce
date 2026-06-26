// src/Components/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const { user, isAdmin, loadAdminStats, loadAllUsers } = useAuth();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [offlineLogins, setOfflineLogins] = useState([]);
  const [offlineOrders, setOfflineOrders] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [stats, setStats] = useState({
    newCustomers: 0,
    totalOrders: 0,
    monthlySales: 0,
    totalLogins: 0
  });

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "In Stock",
    image: "",
    discount: 0,
    description: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const loadPendingUsers = () => {
    try {
      const data = localStorage.getItem('pendingUsers');
      setPendingUsers(data ? JSON.parse(data) : []);
    } catch { setPendingUsers([]); }
  };

  const loadOfflineLogins = () => {
    try {
      const data = localStorage.getItem('offlineLogins');
      setOfflineLogins(data ? JSON.parse(data) : []);
    } catch { setOfflineLogins([]); }
  };

  const loadOfflineOrders = () => {
    try {
      const data = localStorage.getItem('pendingOrders');
      setOfflineOrders(data ? JSON.parse(data) : []);
    } catch { setOfflineOrders([]); }
  };

  const loadContactMessages = () => {
    try {
      const data = localStorage.getItem('contactMessages');
      setContactMessages(data ? JSON.parse(data) : []);
    } catch { setContactMessages([]); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const productsSnapshot = await getDocs(productsQuery);
      setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const ordersSnapshot = await getDocs(ordersQuery);
      setOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const usersList = await loadAllUsers();
      setUsers(usersList);

      const statsData = await loadAdminStats();
      setStats({
        newCustomers: statsData.newCustomers || 0,
        totalOrders: statsData.totalOrders || 0,
        monthlySales: statsData.monthlySales || 0,
        totalLogins: statsData.totalLogins || 0
      });

      loadPendingUsers();
      loadOfflineLogins();
      loadOfflineOrders();
      loadContactMessages();
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      await addDoc(collection(db, "products"), {
        ...formData,
        price: parseInt(formData.price),
        discount: parseInt(formData.discount) || 0,
        image: imageUrl,
        createdAt: new Date()
      });
      
      resetForm();
      await loadData();
      alert("✅ Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("❌ Failed to add product: " + error.message);
    }
    setIsAdding(false);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const productRef = doc(db, "products", editingProduct.id);
      await updateDoc(productRef, {
        ...formData,
        price: parseInt(formData.price),
        discount: parseInt(formData.discount) || 0,
        image: imageUrl
      });
      
      resetForm();
      await loadData();
      alert("✅ Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("❌ Failed to update product");
    }
  };

  const handleDeleteProduct = async (id, imageUrl) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      if (imageUrl && imageUrl.includes("firebasestorage")) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef).catch(() => {});
      }
      await deleteDoc(doc(db, "products", id));
      await loadData();
      alert("✅ Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("❌ Failed to delete product");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      await loadData();
      alert("✅ Order status updated!");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("❌ Failed to update order");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      category: "",
      stock: "In Stock",
      image: "",
      discount: 0,
      description: ""
    });
    setImageFile(null);
    setImagePreview("");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      price: product.price?.toString() || "",
      category: product.category || "",
      stock: product.stock || "In Stock",
      image: product.image || "",
      discount: product.discount || 0,
      description: product.description || ""
    });
  };

  if (!isAdmin) {
    return <div className="p-6 text-red-500 font-bold">Access Denied! Admin only.</div>;
  }

  // const OfflineStatsCards = () => {
  //   const [counts, setCounts] = useState({ pending: 0, logins: 0, orders: 0 });

  //   const refresh = () => {
  //     try {
  //       const pending = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
  //       const logins = JSON.parse(localStorage.getItem('offlineLogins') || '[]');
  //       const orders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
  //       setCounts({
  //         pending: pending.length,
  //         logins: logins.length,
  //         orders: orders.length
  //       });
  //       setPendingUsers(pending);
  //       setOfflineLogins(logins);
  //       setOfflineOrders(orders);
  //     } catch (e) {}
  //   };

  //   useEffect(() => {
  //     refresh();
  //     const interval = setInterval(refresh, 5000);
  //     return () => clearInterval(interval);
  //   }, []);

  //   return (
  //     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  //       <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
  //         <div className="flex items-center gap-3">
  //           <span className="text-2xl">📦</span>
  //           <div>
  //             <h3 className="font-semibold text-gray-700">Offline Registered</h3>
  //             <p className="text-sm text-gray-500">Users who registered offline</p>
  //           </div>
  //           <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${counts.pending > 0 ? "bg-yellow-500 text-white" : "bg-green-100 text-green-700"}`}>
  //             {counts.pending}
  //           </span>
  //         </div>
  //       </div>
  //       <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
  //         <div className="flex items-center gap-3">
  //           <span className="text-2xl">📱</span>
  //           <div>
  //             <h3 className="font-semibold text-gray-700">Offline Logins</h3>
  //             <p className="text-sm text-gray-500">Users who logged in offline</p>
  //           </div>
  //           <span className="ml-2 px-3 py-1 rounded-full text-sm font-bold bg-blue-500 text-white">{counts.logins}</span>
  //         </div>
  //       </div>
  //       <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
  //         <div className="flex items-center gap-3">
  //           <span className="text-2xl">📋</span>
  //           <div>
  //             <h3 className="font-semibold text-gray-700">Offline Orders</h3>
  //             <p className="text-sm text-gray-500">Orders placed offline</p>
  //           </div>
  //           <span className="ml-2 px-3 py-1 rounded-full text-sm font-bold bg-purple-500 text-white">{counts.orders}</span>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  // ✅ Offline Stats Cards (সরাসরি localStorage থেকে কাউন্ট)
const OfflineStatsCards = () => {
  const [pending, setPending] = useState(0);
  const [logins, setLogins] = useState(0);
  const [orders, setOrders] = useState(0);

  const refresh = () => {
    try {
      const p = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
      const l = JSON.parse(localStorage.getItem('offlineLogins') || '[]');
      const o = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      setPending(p.length);
      setLogins(l.length);
      setOrders(o.length);
    } catch (e) {}
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <h3 className="font-semibold text-gray-700">Offline Registered</h3>
            <p className="text-sm text-gray-500">Users who registered offline</p>
          </div>
          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${pending > 0 ? "bg-yellow-500 text-white" : "bg-green-100 text-green-700"}`}>
            {pending}
          </span>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <h3 className="font-semibold text-gray-700">Offline Logins</h3>
            <p className="text-sm text-gray-500">Users who logged in offline</p>
          </div>
          <span className="ml-2 px-3 py-1 rounded-full text-sm font-bold bg-blue-500 text-white">{logins}</span>
        </div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h3 className="font-semibold text-gray-700">Offline Orders</h3>
            <p className="text-sm text-gray-500">Orders placed offline</p>
          </div>
          <span className="ml-2 px-3 py-1 rounded-full text-sm font-bold bg-purple-500 text-white">{orders}</span>
        </div>
      </div>
    </div>
  );
};
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">👤 New Customers</p>
        <h3 className="text-2xl font-bold text-blue-600">{stats.newCustomers}</h3>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">📋 Total Orders</p>
        <h3 className="text-2xl font-bold text-green-600">{stats.totalOrders}</h3>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">💰 Monthly Sales</p>
        <h3 className="text-2xl font-bold text-purple-600">৳{stats.monthlySales.toLocaleString()}</h3>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">🔑 Total Logins</p>
        <h3 className="text-2xl font-bold text-orange-600">{stats.totalLogins}</h3>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">⚡ Admin Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.name || "Admin"}!</p>
          </div>
          <button onClick={loadData} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            🔄 Refresh All
          </button>
        </div>

        <OfflineStatsCards />
        <StatsCards />

        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setActiveTab("products")} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "products" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📦 Products</button>
          <button onClick={() => setActiveTab("orders")} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "orders" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📋 Orders</button>
          <button onClick={() => setActiveTab("users")} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "users" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>👥 Users</button>
          <button onClick={() => setActiveTab("offline-users")} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "offline-users" ? "bg-yellow-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📦 Offline Users</button>
          <button onClick={() => setActiveTab("offline-logins")} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "offline-logins" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📱 Offline Logins</button>
          <button onClick={() => setActiveTab("offline-orders")} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "offline-orders" ? "bg-purple-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📋 Offline Orders</button>
          <button onClick={() => setActiveTab("messages")} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "messages" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📩 Messages</button>
        </div>

        {activeTab === "offline-users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">📦 Offline Registered Users ({pendingUsers.length})</h2>
              <button onClick={loadPendingUsers} className="text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {pendingUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">✅ No offline registered users.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Registered At</th><th className="px-4 py-3 text-left">Status</th></tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{i+1}</td>
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">⏳ Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "offline-logins" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">📱 Offline Logins ({offlineLogins.length})</h2>
              <button onClick={loadOfflineLogins} className="text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {offlineLogins.length === 0 ? (
              <div className="p-6 text-center text-gray-500">✅ No offline logins recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">First Login</th><th className="px-4 py-3 text-left">Last Login</th><th className="px-4 py-3 text-left">Count</th></tr>
                  </thead>
                  <tbody>
                    {offlineLogins.map((login, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{i+1}</td>
                        <td className="px-4 py-3 font-medium">{login.name}</td>
                        <td className="px-4 py-3">{login.email}</td>
                        <td className="px-4 py-3 text-sm">{login.firstLogin ? new Date(login.firstLogin).toLocaleString() : "N/A"}</td>
                        <td className="px-4 py-3 text-sm">{login.lastLogin ? new Date(login.lastLogin).toLocaleString() : "N/A"}</td>
                        <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{login.count}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "offline-orders" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">📋 Offline Orders ({offlineOrders.length})</h2>
              <button onClick={loadOfflineOrders} className="text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {offlineOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">✅ No offline orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Order ID</th><th className="px-4 py-3 text-left">Customer</th><th className="px-4 py-3 text-left">Items</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Status</th></tr>
                  </thead>
                  <tbody>
                    {offlineOrders.map((order, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{i+1}</td>
                        <td className="px-4 py-3 font-mono text-xs">{order.id?.slice(0,8)}</td>
                        <td className="px-4 py-3">{order.customerName || order.customerEmail || "Guest"}</td>
                        <td className="px-4 py-3">{order.items?.length || 0}</td>
                        <td className="px-4 py-3 font-medium">৳{order.totalPrice || 0}</td>
                        <td className="px-4 py-3 text-sm">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">⏳ Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">📩 Contact Messages ({contactMessages.length})</h2>
              <button onClick={loadContactMessages} className="text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {contactMessages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">✅ No messages yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Message</th><th className="px-4 py-3 text-left">Date</th></tr>
                  </thead>
                  <tbody>
                    {contactMessages.map((msg, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{i+1}</td>
                        <td className="px-4 py-3 font-medium">{msg.name}</td>
                        <td className="px-4 py-3">{msg.email}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{msg.message}</td>
                        <td className="px-4 py-3 text-sm">{new Date(msg.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">{editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}</h2>
              <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="Price (e.g. 1200)" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category (e.g. shoes, laptop)" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />}
                  {formData.image && !imagePreview && <img src={formData.image} alt="Current" className="w-20 h-20 object-cover rounded" />}
                </div>
                <input type="number" name="discount" value={formData.discount} onChange={handleChange} placeholder="Discount % (e.g. 10)" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select name="stock" value={formData.stock} onChange={handleChange} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <div className="md:col-span-2">
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Product description (optional)" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={isAdding} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{isAdding ? "Saving..." : editingProduct ? "✏️ Update" : "➕ Add Product"}</button>
                  {editingProduct && <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>}
                </div>
              </form>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">📦 Products ({products.length})</h2>
              </div>
              {loading ? <div className="p-6 text-center text-gray-500">Loading products...</div> : products.length === 0 ? <div className="p-6 text-center text-gray-500">No products yet.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr><th className="px-4 py-3 text-left">Image</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Price</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Stock</th><th className="px-4 py-3 text-center">Actions</th></tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-t hover:bg-gray-50 transition">
                          <td className="px-4 py-3"><img src={product.image || "/no-image.png"} alt={product.name} className="w-12 h-12 object-cover rounded" loading="lazy" /></td>
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3">৳{product.price}</td>
                          <td className="px-4 py-3">{product.category}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${product.stock === "In Stock" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{product.stock}</span></td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => startEdit(product)} className="text-blue-600 hover:text-blue-800 mr-3">✏️</button>
                            <button onClick={() => handleDeleteProduct(product.id, product.image)} className="text-red-500 hover:text-red-700">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">📋 Orders ({orders.length})</h2>
            </div>
            {loading ? <div className="p-6 text-center text-gray-500">Loading orders...</div> : orders.length === 0 ? <div className="p-6 text-center text-gray-500">No orders yet.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left">Order ID</th><th className="px-4 py-3 text-left">Customer</th><th className="px-4 py-3 text-left">Items</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-center">Action</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs">{order.id?.slice(0,8)}</td>
                        <td className="px-4 py-3">{order.customerEmail || "Guest"}</td>
                        <td className="px-4 py-3">{order.items?.length || 0}</td>
                        <td className="px-4 py-3 font-medium">৳{order.totalPrice || 0}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${order.status === "delivered" ? "bg-green-100 text-green-700" : order.status === "shipped" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{order.status || "pending"}</span></td>
                        <td className="px-4 py-3 text-center">
                          <select value={order.status || "pending"} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">👥 Users ({users.length})</h2>
            </div>
            {loading ? <div className="p-6 text-center text-gray-500">Loading users...</div> : users.length === 0 ? <div className="p-6 text-center text-gray-500">No users yet.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left">UID</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Joined</th></tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs">{user.uid?.slice(0,8)}</td>
                        <td className="px-4 py-3">{user.name || "N/A"}</td>
                        <td className="px-4 py-3">{user.email || "N/A"}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${user.isAdmin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>{user.isAdmin ? "Admin" : "User"}</span></td>
                        <td className="px-4 py-3 text-sm">{user.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}