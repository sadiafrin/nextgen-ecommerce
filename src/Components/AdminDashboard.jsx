// src/Components/AdminDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where 
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
  const [syncedOrders, setSyncedOrders] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [stats, setStats] = useState({
    newCustomers: 0,
    totalOrders: 0,
    monthlySales: 0,
    totalLogins: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
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

  // URL থেকে tab প্যারামিটার পড়ুন
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // ✅ পেন্ডিং ইউজার লোড (localStorage)
  const loadPendingUsers = () => {
    try {
      const data = localStorage.getItem('pendingUsers');
      setPendingUsers(data ? JSON.parse(data) : []);
    } catch { setPendingUsers([]); }
  };

  // ✅ অফলাইন লগইন লোড (localStorage)
  const loadOfflineLogins = () => {
    try {
      const data = localStorage.getItem('offlineLogins');
      setOfflineLogins(data ? JSON.parse(data) : []);
    } catch { setOfflineLogins([]); }
  };

  // ✅ অফলাইন অর্ডার লোড (localStorage)
  const loadOfflineOrders = () => {
    try {
      const data = localStorage.getItem('pendingOrders');
      setOfflineOrders(data ? JSON.parse(data) : []);
    } catch { setOfflineOrders([]); }
  };

  // ✅ কন্টাক্ট মেসেজ লোড (localStorage)
  const loadContactMessages = () => {
    try {
      const data = localStorage.getItem('contactMessages');
      setContactMessages(data ? JSON.parse(data) : []);
    } catch { setContactMessages([]); }
  };

  // ✅ Offline Stats Refresh
  const refreshOfflineStats = useCallback(() => {
    try {
      const p = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
      const l = JSON.parse(localStorage.getItem('offlineLogins') || '[]');
      const o = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      setPendingUsers(p);
      setOfflineLogins(l);
      setOfflineOrders(o);
    } catch (e) {
      console.error('Error loading offline stats:', e);
    }
  }, []);

  // ✅ Offline Data Sync Function
  const syncOfflineData = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      let syncedCount = 0;

      const pendingUsersData = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
      if (pendingUsersData.length > 0) {
        for (const userData of pendingUsersData) {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userData.email));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
              await addDoc(collection(db, 'users'), {
                name: userData.name,
                email: userData.email,
                isOffline: true,
                syncedAt: new Date().toISOString(),
                source: 'offline-registration',
                createdAt: new Date()
              });
              syncedCount++;
            }
          } catch (err) {
            console.error(`❌ Failed to sync user ${userData.email}:`, err);
          }
        }
        localStorage.removeItem('pendingUsers');
      }

      const offlineOrdersData = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      if (offlineOrdersData.length > 0) {
        for (const order of offlineOrdersData) {
          try {
            await addDoc(collection(db, 'orders'), {
              ...order,
              isOffline: true,
              syncedAt: new Date().toISOString(),
              status: 'pending'
            });
            syncedCount++;
          } catch (err) {
            console.error(`❌ Failed to sync order ${order.id}:`, err);
          }
        }
        localStorage.removeItem('pendingOrders');
      }

      const offlineLoginsData = JSON.parse(localStorage.getItem('offlineLogins') || '[]');
      if (offlineLoginsData.length > 0) {
        for (const login of offlineLoginsData) {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', login.email));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              const userDoc = snapshot.docs[0];
              await updateDoc(doc(db, 'users', userDoc.id), {
                offlineLogins: login.count || 1,
                lastOfflineLogin: new Date().toISOString()
              });
              syncedCount++;
            }
          } catch (err) {
            console.error(`❌ Failed to sync login ${login.email}:`, err);
          }
        }
        localStorage.removeItem('offlineLogins');
      }

      await loadData();
      refreshOfflineStats();
      
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
      
      if (syncedCount > 0) {
        alert(`✅ ${syncedCount} offline items synced successfully!`);
      } else {
        alert('✅ All offline data already synced!');
      }

    } catch (error) {
      console.error('❌ Sync error:', error);
      alert('❌ Failed to sync offline data: ' + error.message);
      setSyncStatus('idle');
    } finally {
      setIsSyncing(false);
    }
  };

  // ✅ Firebase থেকে সব ডেটা লোড
  const loadData = async () => {
    setLoading(true);
    try {
      const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const productsSnapshot = await getDocs(productsQuery);
      setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(allOrders);
      setSyncedOrders(allOrders);

      const usersList = await loadAllUsers();
      setUsers(usersList);

      const statsData = await loadAdminStats();
      
      const totalOrders = allOrders.length;
      const pending = allOrders.filter(o => o.status === 'pending' || o.status === 'Pending').length;
      const completed = allOrders.filter(o => o.status === 'completed' || o.status === 'Completed' || o.status === 'delivered' || o.status === 'Delivered').length;
      const revenue = allOrders.reduce((sum, order) => {
        const totalPrice = order.totalPrice || order.total || 0;
        return sum + (typeof totalPrice === 'number' ? totalPrice : 0);
      }, 0);

      setStats({
        newCustomers: statsData.newCustomers || 0,
        totalOrders: totalOrders,
        monthlySales: statsData.monthlySales || 0,
        totalLogins: statsData.totalLogins || 0,
        totalRevenue: revenue,
        pendingOrders: pending,
        completedOrders: completed
      });

      refreshOfflineStats();
      loadContactMessages();

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  // ✅ Auto Sync on Online
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) {
        const totalOffline = 
          JSON.parse(localStorage.getItem('pendingUsers') || '[]').length +
          JSON.parse(localStorage.getItem('pendingOrders') || '[]').length +
          JSON.parse(localStorage.getItem('offlineLogins') || '[]').length;
        
        if (totalOffline > 0) {
          syncOfflineData();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  // ✅ ইমেজ আপলোড ফাংশন
  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Image upload failed: ' + error.message);
      return null;
    }
  };

  // ✅ প্রোডাক্ট যোগ করুন
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const productData = {
        ...formData,
        price: parseInt(formData.price),
        discount: parseInt(formData.discount) || 0,
        image: imageUrl,
        createdAt: new Date()
      };

      await addDoc(collection(db, "products"), productData);
      resetForm();
      await loadData();
      alert("✅ Product added successfully!");
    } catch (error) {
      console.error('Error adding product:', error);
      alert("❌ Failed to add product: " + error.message);
    }
    setIsAdding(false);
  };

  // ✅ প্রোডাক্ট আপডেট করুন
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

  // ✅ প্রোডাক্ট ডিলিট করুন
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

  // ✅ অর্ডার স্ট্যাটাস আপডেট করুন
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

  // ✅ অর্ডার ডিলিট করুন
  const deleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
      await loadData();
      alert("✅ Order deleted successfully!");
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("❌ Failed to delete order");
    }
  };

  // ✅ ফর্ম রিসেট
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
    return <div className="p-6 text-red-500 font-bold text-center text-lg">Access Denied! Admin only.</div>;
  }

  // ✅ Offline Stats Cards Component - Fully Responsive
  const OfflineStatsCards = () => {
    const totalOffline = pendingUsers.length + offlineLogins.length + offlineOrders.length;

    return (
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {totalOffline > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3 sm:p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">🔄</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold">{totalOffline} Offline Items Pending</h3>
                <p className="text-xs sm:text-sm text-orange-100">Click Sync to upload to Firebase</p>
              </div>
            </div>
            <button
              onClick={syncOfflineData}
              disabled={isSyncing}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition disabled:opacity-50 text-sm sm:text-base"
            >
              {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
            </button>
          </div>
        )}

        {syncStatus === 'syncing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center text-yellow-700 text-sm">
            <span className="animate-spin inline-block mr-2">⟳</span> Syncing offline data to Firebase...
          </div>
        )}
        {syncStatus === 'synced' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-green-700 text-sm">
            ✅ All offline data synced successfully!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">📦</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Offline Registered</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Users who registered offline</p>
              </div>
              <span className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-lg font-bold ${
                pendingUsers.length > 0 ? "bg-yellow-500 text-white animate-pulse" : "bg-green-100 text-green-700"
              }`}>
                {pendingUsers.length}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">📱</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Offline Logins</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Users who logged in offline</p>
              </div>
              <span className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-lg font-bold ${
                offlineLogins.length > 0 ? "bg-blue-500 text-white animate-pulse" : "bg-green-100 text-green-700"
              }`}>
                {offlineLogins.length}
              </span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">📋</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Offline Orders</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Orders placed offline</p>
              </div>
              <span className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-lg font-bold ${
                offlineOrders.length > 0 ? "bg-purple-500 text-white animate-pulse" : "bg-green-100 text-green-700"
              }`}>
                {offlineOrders.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Stats Cards - বড় + ক্লিয়ার (আপডেটেড)
  const StatsCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      
      {/* New Customers */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">New Customers</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mt-1">{stats.newCustomers}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">👤</div>
        </div>
      </div>

      {/* Total Orders */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mt-1">{stats.totalOrders}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">📋</div>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-600 mt-1">৳{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">💰</div>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-orange-500 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Orders</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-orange-600 mt-1">{stats.pendingOrders}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">⏳</div>
        </div>
      </div>

    </div>
  );

  // ✅ Messages Tab
  const MessagesTab = () => {
    const [messages, setMessages] = useState([]);

    const loadMessages = () => {
      try {
        const data = localStorage.getItem('contactMessages');
        setMessages(data ? JSON.parse(data) : []);
      } catch { setMessages([]); }
    };

    useEffect(() => {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold">📩 Contact Messages ({messages.length})</h2>
          <button onClick={loadMessages} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
        </div>
        {messages.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">✅ No messages yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">#</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Name</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Email</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Message</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.slice(0, 10).map((msg, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition">
                    <td className="px-2 sm:px-4 py-2 sm:py-3">{i + 1}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium truncate max-w-[60px] sm:max-w-none">{msg.name || "N/A"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell truncate max-w-[100px]">{msg.email || "N/A"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[120px] sm:max-w-xs">{msg.message || "N/A"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-[10px] sm:text-xs">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {messages.length > 10 && (
              <div className="p-3 text-center text-xs text-gray-400">Showing 10 of {messages.length} messages</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 px-2 sm:px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">⚡ Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">Welcome back, {user?.name || "Admin"}!</p>
          </div>
          <button onClick={loadData} className="w-full sm:w-auto bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-xs sm:text-sm">
            🔄 Refresh All
          </button>
        </div>

        <OfflineStatsCards />
        <StatsCards />

        {/* Tabs - Fully Responsive */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
          <button onClick={() => setActiveTab("overview")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "overview" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📊 Overview</button>
          <button onClick={() => setActiveTab("products")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "products" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📦 Products</button>
          <button onClick={() => setActiveTab("orders")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "orders" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📋 Orders</button>
          <button onClick={() => setActiveTab("users")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "users" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>👥 Users</button>
          <button onClick={() => setActiveTab("offline-users")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "offline-users" ? "bg-yellow-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📦 Offline Users</button>
          <button onClick={() => setActiveTab("offline-logins")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "offline-logins" ? "bg-blue-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📱 Offline Logins</button>
          <button onClick={() => setActiveTab("offline-orders")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "offline-orders" ? "bg-purple-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📋 Offline Orders</button>
          <button onClick={() => setActiveTab("synced-orders")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "synced-orders" ? "bg-green-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>✅ Synced Orders</button>
          <button onClick={() => setActiveTab("messages")} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-[10px] sm:text-sm ${activeTab === "messages" ? "bg-blue-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}>📩 Messages</button>
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3 sm:p-4 border-b font-semibold text-sm sm:text-base">📋 Recent Orders</div>
              <div className="p-3 sm:p-4 max-h-80 overflow-y-auto">
                {orders.length === 0 ? (
                  <p className="text-gray-400 text-center py-4 text-sm">No recent orders</p>
                ) : (
                  orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 border-b last:border-0 gap-1 sm:gap-0">
                      <div>
                        <p className="text-xs sm:text-sm font-mono">{order.id?.slice(0, 8)}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{order.customerName || order.customerEmail || 'Guest'}</p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-xs sm:text-sm font-medium">৳{order.totalPrice?.toFixed(2) || '0.00'}</p>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'completed' || order.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3 sm:p-4 border-b font-semibold text-sm sm:text-base">🔥 Top Products</div>
              <div className="p-3 sm:p-4 max-h-80 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-gray-400 text-center py-4 text-sm">No products found</p>
                ) : (
                  products.slice(0, 5).map(product => (
                    <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <img src={product.image || '/no-image.png'} alt={product.name} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-medium flex-shrink-0">{product.price}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === "products" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4">{editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}</h2>
              <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" required />
                <input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="Price (e.g. 1200)" className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" required />
                <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category (e.g. shoes, laptop)" className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" required />
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                  <div className="flex gap-2 flex-wrap">
                    {imagePreview && <img src={imagePreview} alt="Preview" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded" />}
                    {formData.image && !imagePreview && <img src={formData.image} alt="Current" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded" />}
                  </div>
                </div>
                <input type="number" name="discount" value={formData.discount} onChange={handleChange} placeholder="Discount % (e.g. 10)" className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                <select name="stock" value={formData.stock} onChange={handleChange} className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <div className="sm:col-span-2">
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Product description (optional)" className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" rows="3" />
                </div>
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button type="submit" disabled={isAdding} className="w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm">{isAdding ? "Saving..." : editingProduct ? "✏️ Update" : "➕ Add Product"}</button>
                  {editingProduct && <button type="button" onClick={resetForm} className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>}
                </div>
              </form>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3 sm:p-4 border-b flex justify-between items-center">
                <h2 className="text-sm sm:text-base md:text-lg font-bold">📦 Products ({products.length})</h2>
              </div>
              {loading ? <div className="p-6 text-center text-gray-500 text-sm">Loading products...</div> : products.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">No products yet.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Image</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Name</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Price</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Category</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell">Stock</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-t hover:bg-gray-50 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3"><img src={product.image || "/no-image.png"} alt={product.name} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded" loading="lazy" /></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium hidden sm:table-cell truncate max-w-[80px] sm:max-w-[120px]">{product.name}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">৳{product.price}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">{product.category}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell"><span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${product.stock === "In Stock" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{product.stock}</span></td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                            <button onClick={() => startEdit(product)} className="text-orange-500 hover:text-orange-700 mr-2 sm:mr-3 text-sm">✏️</button>
                            <button onClick={() => handleDeleteProduct(product.id, product.image)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
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

        {/* ===== ORDERS TAB ===== */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg font-bold">📋 All Orders ({orders.length})</h2>
            </div>
            {loading ? <div className="p-6 text-center text-gray-500 text-sm">Loading orders...</div> : orders.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">No orders yet.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Order ID</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Customer</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Items</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Total</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Status</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-[10px] sm:text-xs">{order.id?.slice(0, 8)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell truncate max-w-[80px]">{order.customerName || order.customerEmail || "Guest"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{order.items?.length || 0}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">৳{order.totalPrice?.toFixed(2) || '0.00'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <select 
                            value={order.status || "pending"} 
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full border ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-[10px] sm:text-xs text-gray-500">
                          {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <button onClick={() => deleteOrder(order.id)} className="text-red-500 hover:text-red-700 text-xs sm:text-sm">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b">
              <h2 className="text-sm sm:text-base md:text-lg font-bold">👥 All Users ({users.length})</h2>
            </div>
            {loading ? <div className="p-6 text-center text-gray-500 text-sm">Loading users...</div> : users.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">No users yet.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">UID</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Name</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Email</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Role</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell">Orders</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden xl:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 20).map((user) => {
                      const userOrders = orders.filter(o => o.customerEmail === user.email);
                      return (
                        <tr key={user.id} className="border-t hover:bg-gray-50 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-[10px] sm:text-xs">{user.uid?.slice(0, 8) || user.id?.slice(0, 8)}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell truncate max-w-[80px]">{user.name || "N/A"}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[100px] sm:max-w-[150px]">{user.email || "N/A"}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                            <span className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-full ${user.isAdmin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                              {user.isAdmin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell text-center">{userOrders.length}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xl:table-cell text-[10px] sm:text-xs text-gray-500">
                            {user.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {users.length > 20 && (
                  <div className="p-3 text-center text-xs text-gray-400">Showing 20 of {users.length} users</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== OFFLINE USERS TAB ===== */}
        {activeTab === "offline-users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg font-bold">📦 Offline Registered Users ({pendingUsers.length})</h2>
              <button onClick={refreshOfflineStats} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {pendingUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">✅ No offline registered users.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">#</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Name</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Email</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Registered At</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.slice(0, 20).map((user, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">{i + 1}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium truncate max-w-[80px]">{user.name}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[100px] sm:max-w-[150px]">{user.email}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell text-[10px] sm:text-xs">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="px-2 py-1 rounded-full text-[10px] sm:text-xs bg-yellow-100 text-yellow-700">⏳ Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingUsers.length > 20 && (
                  <div className="p-3 text-center text-xs text-gray-400">Showing 20 of {pendingUsers.length} users</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== OFFLINE LOGINS TAB ===== */}
        {activeTab === "offline-logins" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg font-bold">📱 Offline Logins ({offlineLogins.length})</h2>
              <button onClick={refreshOfflineStats} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {offlineLogins.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">✅ No offline logins recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">#</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Name</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Email</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">First Login</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell">Last Login</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offlineLogins.slice(0, 20).map((login, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">{i + 1}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell truncate max-w-[80px]">{login.name}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[100px] sm:max-w-[150px]">{login.email}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-[10px] sm:text-xs">{login.firstLogin ? new Date(login.firstLogin).toLocaleString() : "N/A"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell text-[10px] sm:text-xs">{login.lastLogin ? new Date(login.lastLogin).toLocaleString() : "N/A"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center"><span className="px-2 py-1 rounded-full text-[10px] sm:text-xs bg-blue-100 text-blue-700">{login.count}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {offlineLogins.length > 20 && (
                  <div className="p-3 text-center text-xs text-gray-400">Showing 20 of {offlineLogins.length} logins</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== OFFLINE ORDERS TAB ===== */}
        {activeTab === "offline-orders" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg font-bold">📋 Offline Orders ({offlineOrders.length})</h2>
              <button onClick={refreshOfflineStats} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {offlineOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">✅ No offline orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">#</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Order ID</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Customer</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Items</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Total</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offlineOrders.slice(0, 20).map((order, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">{i + 1}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell font-mono text-[10px] sm:text-xs">{order.id?.slice(0, 8)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[80px] sm:max-w-[100px]">{order.customerName || order.customerEmail || "Guest"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{order.items?.length || 0}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">৳{order.totalPrice || 0}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-[10px] sm:text-xs">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="px-2 py-1 rounded-full text-[10px] sm:text-xs bg-yellow-100 text-yellow-700">⏳ Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {offlineOrders.length > 20 && (
                  <div className="p-3 text-center text-xs text-gray-400">Showing 20 of {offlineOrders.length} orders</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== SYNCED ORDERS TAB ===== */}
        {activeTab === "synced-orders" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg font-bold">✅ Synced Orders ({syncedOrders.length})</h2>
              <button onClick={loadData} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">🔄 Refresh</button>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading orders...</div>
            ) : syncedOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No synced orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Order ID</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Customer</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Items</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Total</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncedOrders.slice(0, 20).map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-[10px] sm:text-xs">{order.id?.slice(0, 8)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell truncate max-w-[80px]">{order.customerEmail || "Guest"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{order.items?.length || 0}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">৳{order.totalPrice || 0}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-[10px] sm:text-xs">{order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {syncedOrders.length > 20 && (
                  <div className="p-3 text-center text-xs text-gray-400">Showing 20 of {syncedOrders.length} orders</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== MESSAGES TAB ===== */}
        {activeTab === "messages" && <MessagesTab />}
      </div>
    </div>
  );
}