// src/Components/AdminDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where,
  onSnapshot 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const { user, isAdmin, loadAllUsers } = useAuth();
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
  const [realTimeStatus, setRealTimeStatus] = useState('🟢 Live');
  const [isStatsSyncing, setIsStatsSyncing] = useState(false);

  // ✅ Offline Logs State
  const [offlineLogCounts, setOfflineLogCounts] = useState({
    registered: 0,
    logins: 0,
    orders: 0
  });
  
  // ✅ Firebase Stats
  const [firebaseStats, setFirebaseStats] = useState({
    newCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalLogins: 0,
    monthlySales: 0,
    lastUpdated: null
  });

  // ✅ Offline Stats
  const [offlineStats, setOfflineStats] = useState({
    pendingUsers: 0,
    offlineLogins: 0,
    offlineOrders: 0,
    offlineRevenue: 0
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

  // ✅ Offline Data Load from localStorage
  const loadOfflineData = useCallback(() => {
    try {
      const p = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
      setPendingUsers(p);
      
      const l = JSON.parse(localStorage.getItem('offlineLogins') || '[]');
      setOfflineLogins(l);
      
      const o = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      setOfflineOrders(o);
      
      const m = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      setContactMessages(m);
      
      const offlineRevenue = o.reduce((sum, order) => {
        const totalPrice = order.totalPrice || order.total || 0;
        return sum + (typeof totalPrice === 'number' ? totalPrice : 0);
      }, 0);
      
      setOfflineStats({
        pendingUsers: p.length,
        offlineLogins: l.length,
        offlineOrders: o.length,
        offlineRevenue: offlineRevenue
      });

      const logs = JSON.parse(localStorage.getItem('offlineLogs') || '{"registered":0,"logins":0,"orders":0}');
      setOfflineLogCounts(logs);
      
      console.log('📦 Offline Data Loaded:', { p: p.length, l: l.length, o: o.length });
    } catch (e) {
      console.error('Error loading offline data:', e);
    }
  }, []);

  // ✅ Offline Data Sync Function
  const syncOfflineData = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      let syncedCount = 0;
      let syncedUsers = 0;
      let syncedLogins = 0;
      let syncedOrdersCount = 0;

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
              syncedUsers++;
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
            syncedOrdersCount++;
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
              syncedLogins++;
            }
          } catch (err) {
            console.error(`❌ Failed to sync login ${login.email}:`, err);
          }
        }
        localStorage.removeItem('offlineLogins');
      }

      localStorage.setItem('offlineLogs', JSON.stringify({ registered: 0, logins: 0, orders: 0 }));
      setOfflineLogCounts({ registered: 0, logins: 0, orders: 0 });

      loadOfflineData();
      
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
      
      if (syncedCount > 0) {
        alert(`✅ ${syncedCount} offline items synced successfully!\n\n📦 Users: ${syncedUsers}\n📱 Logins: ${syncedLogins}\n📋 Orders: ${syncedOrdersCount}`);
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

  // ✅ Manual Stats Sync Function
  const syncStatsManually = async () => {
    if (isStatsSyncing) return;
    
    setIsStatsSyncing(true);
    setRealTimeStatus('🔄 Syncing Stats...');
    
    try {
      console.log('📊 Starting manual stats sync...');
      
      const ordersQuery = query(collection(db, "orders"));
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalOrders = allOrders.length;
      const revenue = allOrders.reduce((sum, order) => {
        const totalPrice = order.totalPrice || order.total || 0;
        return sum + (typeof totalPrice === 'number' ? totalPrice : 0);
      }, 0);
      const pending = allOrders.filter(o => o.status === 'pending' || o.status === 'Pending').length;
      const completed = allOrders.filter(o => o.status === 'completed' || o.status === 'Completed' || o.status === 'delivered' || o.status === 'Delivered').length;
      
      const usersSnapshot = await getDocs(collection(db, "users"));
      const newCustomers = usersSnapshot.docs.length;
      
      console.log('📊 Calculated Stats:', { totalOrders, revenue, pending, completed, newCustomers });
      
      const statsRef = doc(db, "adminStats", "stats");
      const currentDate = new Date().toISOString();
      
      await updateDoc(statsRef, {
        totalOrders: totalOrders,
        monthlySales: revenue,
        newCustomers: newCustomers,
        totalLogins: totalOrders,
        lastUpdated: currentDate,
        pendingOrders: pending,
        completedOrders: completed
      });
      
      console.log('✅ Stats updated in Firebase at:', currentDate);
      
      setFirebaseStats(prev => ({
        ...prev,
        totalOrders: totalOrders,
        totalRevenue: revenue,
        pendingOrders: pending,
        completedOrders: completed,
        newCustomers: newCustomers,
        monthlySales: revenue,
        lastUpdated: currentDate
      }));
      
      loadOfflineData();
      
      setRealTimeStatus('🟢 Live');
      alert(`✅ Stats synced successfully!\n\nTotal Orders: ${totalOrders}\nTotal Revenue: ৳${revenue.toLocaleString()}\nPending Orders: ${pending}\nNew Customers: ${newCustomers}`);
      
    } catch (error) {
      console.error('❌ Error syncing stats:', error);
      setRealTimeStatus('🔴 Error');
      alert('❌ Failed to sync stats: ' + error.message);
    } finally {
      setIsStatsSyncing(false);
    }
  };

  // ✅ Complete All Pending Orders
  const completeAllPendingOrders = async () => {
    if (!confirm('Are you sure you want to complete all pending orders?')) return;
    
    setIsStatsSyncing(true);
    setRealTimeStatus('🔄 Completing orders...');
    
    try {
      let count = 0;
      
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('✅ No pending orders found!');
        setRealTimeStatus('🟢 Live');
        setIsStatsSyncing(false);
        return;
      }
      
      for (const docSnap of snapshot.docs) {
        const orderRef = doc(db, 'orders', docSnap.id);
        await updateDoc(orderRef, { 
          status: 'completed',
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
        count++;
        console.log(`✅ Completed order: ${docSnap.id}`);
      }
      
      setOrders(prev => prev.map(order => {
        if (order.status === 'pending' || order.status === 'Pending') {
          return { ...order, status: 'completed' };
        }
        return order;
      }));
      
      setFirebaseStats(prev => ({
        ...prev,
        pendingOrders: 0,
        completedOrders: prev.completedOrders + count
      }));
      
      try {
        const pendingOrdersLocal = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
        const updatedPending = pendingOrdersLocal.filter(o => 
          o.status !== 'pending' && o.status !== 'Pending'
        );
        localStorage.setItem('pendingOrders', JSON.stringify(updatedPending));
        console.log('✅ Cleared pending orders from localStorage');
      } catch (e) {
        console.warn('⚠️ Error clearing localStorage:', e);
      }
      
      loadOfflineData();
      
      setRealTimeStatus('🟢 Live');
      alert(`✅ ${count} pending orders completed successfully!`);
      
    } catch (error) {
      console.error('❌ Error completing orders:', error);
      setRealTimeStatus('🔴 Error');
      alert('❌ Failed to complete orders: ' + error.message);
    } finally {
      setIsStatsSyncing(false);
    }
  };

  // ✅ Firebase Real-time Data Load
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setRealTimeStatus('🔄 Connecting...');

    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      console.log('🔄 Products updated:', productsData.length);
    }, (error) => {
      console.error('❌ Products error:', error);
    });

    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      setSyncedOrders(ordersData);
      
      const totalOrders = ordersData.length;
      const pending = ordersData.filter(o => o.status === 'pending' || o.status === 'Pending').length;
      const completed = ordersData.filter(o => o.status === 'completed' || o.status === 'Completed' || o.status === 'delivered' || o.status === 'Delivered').length;
      const revenue = ordersData.reduce((sum, order) => {
        const totalPrice = order.totalPrice || order.total || 0;
        return sum + (typeof totalPrice === 'number' ? totalPrice : 0);
      }, 0);

      setFirebaseStats(prev => ({
        ...prev,
        totalOrders: totalOrders,
        totalRevenue: revenue,
        pendingOrders: pending,
        completedOrders: completed
      }));
      
      console.log('🔄 Firebase Orders updated:', { totalOrders, pending, completed, revenue });
      setRealTimeStatus('🟢 Live');
    }, (error) => {
      console.error('❌ Orders error:', error);
      setRealTimeStatus('🔴 Offline');
    });

    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribeUsers = onSnapshot(usersQuery, async (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      
      const newCustomers = usersData.filter(u => u.isNewCustomer === true || u.createdAt).length;
      setFirebaseStats(prev => ({
        ...prev,
        newCustomers: newCustomers
      }));
      
      console.log('🔄 Users updated:', usersData.length);
    }, (error) => {
      console.error('❌ Users error:', error);
    });

    const statsRef = doc(db, "adminStats", "stats");
    const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
        const now = new Date();
        const diffMs = lastUpdated ? now - lastUpdated : Infinity;
        const diffSec = diffMs / 1000;
        
        if (diffSec < 2 && isStatsSyncing) {
          console.log('⏳ Skipping recent update (manual sync in progress)');
          return;
        }
        
        setFirebaseStats(prev => ({
          ...prev,
          monthlySales: data.monthlySales || 0,
          totalLogins: data.totalLogins || 0,
          newCustomers: data.newCustomers || prev.newCustomers,
          totalOrders: data.totalOrders || prev.totalOrders,
          totalRevenue: data.monthlySales || prev.totalRevenue,
          pendingOrders: data.pendingOrders || prev.pendingOrders,
          completedOrders: data.completedOrders || prev.completedOrders,
          lastUpdated: data.lastUpdated || null
        }));
        console.log('🔄 Firebase Stats updated from listener:', data);
      }
    }, (error) => {
      console.error('❌ Stats error:', error);
    });

    loadOfflineData();

    setLoading(false);
    setRealTimeStatus('🟢 Live');

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribeStats();
      console.log('🔄 All real-time listeners cleaned up');
    };
  }, [isAdmin, loadOfflineData, isStatsSyncing]);

  // ✅ Auto Sync on Online
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) {
        console.log('🌐 Online detected!');
        setRealTimeStatus('🟢 Live');
        const totalOffline = 
          JSON.parse(localStorage.getItem('pendingUsers') || '[]').length +
          JSON.parse(localStorage.getItem('pendingOrders') || '[]').length +
          JSON.parse(localStorage.getItem('offlineLogins') || '[]').length;
        
        if (totalOffline > 0) {
          syncOfflineData();
        }
      } else {
        setRealTimeStatus('🔴 Offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setRealTimeStatus('🔴 Offline'));
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => setRealTimeStatus('🔴 Offline'));
    };
  }, []);

  // ✅ Manual Refresh
  const handleRefresh = useCallback(() => {
    setRealTimeStatus('🔄 Refreshing...');
    loadOfflineData();
    setTimeout(() => setRealTimeStatus('🟢 Live'), 1000);
  }, [loadOfflineData]);

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
      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: new Date()
      });
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

  // ✅ Offline Stats Cards Component
  const OfflineStatsCards = () => {
    const totalOffline = offlineStats.pendingUsers + offlineStats.offlineLogins + offlineStats.offlineOrders;

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
                <p className="text-[10px] sm:text-xs text-gray-500">Total offline registrations</p>
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-sm sm:text-lg font-bold ${
                offlineLogCounts.registered > 0 ? "bg-yellow-500 text-white animate-pulse" : "bg-green-100 text-green-700"
              }`}>
                {offlineLogCounts.registered}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">📱</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Offline Logins</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Total offline logins</p>
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-sm sm:text-lg font-bold ${
                offlineLogCounts.logins > 0 ? "bg-blue-500 text-white animate-pulse" : "bg-green-100 text-green-700"
              }`}>
                {offlineLogCounts.logins}
              </span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">📋</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Offline Orders</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Total offline orders</p>
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-sm sm:text-lg font-bold ${
                offlineLogCounts.orders > 0 ? "bg-purple-500 text-white animate-pulse" : "bg-green-100 text-green-700"
              }`}>
                {offlineLogCounts.orders}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Stats Cards - Firebase Stats ONLY
  const StatsCards = () => {
    const totalRevenue = firebaseStats.totalRevenue || 0;
    const totalLogins = firebaseStats.totalLogins || 0;
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">New Customers</p>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mt-1">{firebaseStats.newCustomers}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">👤</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mt-1">{firebaseStats.totalOrders}</p>
              {offlineStats.offlineOrders > 0 && (
                <p className="text-xs text-yellow-600 mt-0.5">+ {offlineStats.offlineOrders} offline pending</p>
              )}
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">📋</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-600 mt-1">৳{totalRevenue.toLocaleString()}</p>
              {offlineStats.offlineRevenue > 0 && (
                <p className="text-xs text-yellow-600 mt-0.5">+ ৳{offlineStats.offlineRevenue.toLocaleString()} offline</p>
              )}
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-orange-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Orders</p>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-orange-600 mt-1">{firebaseStats.pendingOrders}</p>
              {firebaseStats.pendingOrders === 0 && (
                <p className="text-[10px] text-green-500 mt-0.5">✅ All completed</p>
              )}
              {offlineStats.offlineOrders > 0 && (
                <p className="text-xs text-yellow-600 mt-0.5">+ {offlineStats.offlineOrders} offline pending</p>
              )}
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">⏳</div>
          </div>
        </div>

        {/* ✅ Total Logins - NEW */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border-l-4 border-teal-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total Logins</p>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-teal-600 mt-1">{totalLogins}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">🔑</div>
          </div>
        </div>

      </div>
    );
  };

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
            <p className="text-xs sm:text-sm text-gray-500">
              Welcome back, {user?.name || "Admin"}! 
              <span className={`ml-2 inline-flex items-center gap-1 ${
                realTimeStatus === '🟢 Live' ? 'text-green-600' : 
                realTimeStatus === '🔴 Offline' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full inline-block bg-current animate-pulse"></span>
                {realTimeStatus}
              </span>
            </p>
            {firebaseStats.lastUpdated && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Last Updated: {new Date(firebaseStats.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button 
              onClick={syncStatsManually}
              disabled={isStatsSyncing}
              className="w-full sm:w-auto bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition text-xs sm:text-sm flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {isStatsSyncing ? '⏳ Syncing...' : '📊 Sync Stats'}
            </button>
            <button 
              onClick={completeAllPendingOrders}
              className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-xs sm:text-sm flex items-center justify-center gap-1"
            >
              ✅ Complete All Pending
            </button>
            <button 
              onClick={handleRefresh} 
              className="w-full sm:w-auto bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-xs sm:text-sm flex items-center justify-center gap-1"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <OfflineStatsCards />
        <StatsCards />

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
          <button onClick={() => setActiveTab("overview")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "overview" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>📊 Overview</button>
          <button onClick={() => setActiveTab("products")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "products" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>📦 Products</button>
          <button onClick={() => setActiveTab("orders")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "orders" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>📋 Orders</button>
          <button onClick={() => setActiveTab("users")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "users" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>👥 Users</button>
          <button onClick={() => setActiveTab("offline-users")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "offline-users" ? "bg-yellow-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>📦 Offline Users</button>
          <button onClick={() => setActiveTab("offline-logins")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "offline-logins" ? "bg-blue-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>📱 Offline Logins</button>
          <button onClick={() => setActiveTab("offline-orders")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "offline-orders" ? "bg-purple-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>📋 Offline Orders</button>
          <button onClick={() => setActiveTab("synced-orders")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "synced-orders" ? "bg-green-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>✅ Synced Orders</button>
          <button onClick={() => setActiveTab("messages")} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm ${activeTab === "messages" ? "bg-blue-500 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm"}`}>📩 Messages</button>
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

        {/* ===== OFFLINE USERS TAB - DETAILED LIST (FIXED) ===== */}
        {activeTab === "offline-users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800">📦 Offline Registered Users</h2>
                <p className="text-sm text-gray-500">Users who registered offline</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                  {pendingUsers.length} users
                </span>
                <button onClick={loadOfflineData} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-base font-medium">No offline registered users</p>
                <p className="text-sm text-gray-400 mt-1">Offline registrations will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Registered At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingUsers.map((user, index) => (
                      <tr key={index} className="hover:bg-yellow-50 transition duration-150">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-bold">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-gray-800">{user.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                          {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                            Pending
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== OFFLINE LOGINS TAB - DETAILED LIST (FIXED) ===== */}
        {activeTab === "offline-logins" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800">📱 Offline Logins</h2>
                <p className="text-sm text-gray-500">Users who logged in offline</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {offlineLogins.length} logins
                </span>
                <button onClick={loadOfflineData} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            {offlineLogins.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-base font-medium">No offline logins recorded</p>
                <p className="text-sm text-gray-400 mt-1">Offline logins will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">First Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {offlineLogins.map((login, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition duration-150">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                              {login.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-gray-800">{login.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{login.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {login.firstLogin ? new Date(login.firstLogin).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                          {login.lastLogin ? new Date(login.lastLogin).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium min-w-[30px]">
                            {login.count || 1}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== OFFLINE ORDERS TAB - DETAILED LIST (FIXED) ===== */}
        {activeTab === "offline-orders" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800">📋 Offline Orders</h2>
                <p className="text-sm text-gray-500">Orders placed offline</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {offlineOrders.length} orders
                </span>
                <button onClick={loadOfflineData} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            {offlineOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-base font-medium">No offline orders found</p>
                <p className="text-sm text-gray-400 mt-1">Offline orders will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {offlineOrders.map((order, index) => (
                      <tr key={index} className="hover:bg-purple-50 transition duration-150">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                          {order.id?.slice(0, 8) || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">
                              {order.customerName?.charAt(0).toUpperCase() || 'G'}
                            </div>
                            <span className="font-medium text-gray-800">{order.customerName || 'Guest'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                            {order.items?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">৳{order.totalPrice?.toFixed(2) || '0.00'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                            Pending
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== SYNCED ORDERS TAB ===== */}
        {activeTab === "synced-orders" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold">✅ Synced Orders</h2>
                <p className="text-xs sm:text-sm text-gray-500">Orders synced to Firebase</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {syncedOrders.length} synced
                </span>
                <button onClick={handleRefresh} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading orders...</div>
            ) : syncedOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-base font-medium">No synced orders yet</p>
                <p className="text-sm text-gray-400 mt-1">Orders will appear here after sync</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Order ID</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium hidden sm:table-cell">Customer</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Items</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Total</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium hidden md:table-cell">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {syncedOrders.slice(0, 20).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-[10px] sm:text-xs">{order.id?.slice(0, 8)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell truncate max-w-[80px]">{order.customerEmail || "Guest"}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{order.items?.length || 0}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">৳{order.totalPrice || 0}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-[10px] sm:text-xs text-gray-500">
                          {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${
                            order.status === 'delivered' || order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
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