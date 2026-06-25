// src/Components/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function AdminDashboard() {
  const { user, isAdmin, loadAdminStats, loadAllUsers } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [stats, setStats] = useState({
    newCustomers: 0,
    totalOrders: 0,
    monthlySales: 0,
    totalLogins: 0
  });

  // ফর্ম ডেটা
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: 'In Stock',
    image: '',
    discount: 0,
    description: ''
  });

  // ✅ সব ডেটা লোড করুন
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Products লোড করুন
      const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);

      // 2. Orders লোড করুন
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersList = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);

      // 3. Stats লোড করুন (AuthContext থেকে)
      const statsData = await loadAdminStats();
      const users = await loadAllUsers();
      
      // ✅ New Customers = মোট ইউজার (যারা অন্তত একবার লগইন করেছে)
      const totalCustomers = users.filter(u => u.isNewCustomer !== false).length;
      
      setStats({
        newCustomers: totalCustomers,
        totalOrders: statsData.totalOrders || 0,
        monthlySales: statsData.monthlySales || 0,
        totalLogins: statsData.totalLogins || 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // ✅ ইমেজ আপলোড ফাংশন
  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
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

      await addDoc(collection(db, 'products'), {
        ...formData,
        price: parseInt(formData.price),
        discount: parseInt(formData.discount) || 0,
        image: imageUrl,
        createdAt: new Date()
      });
      
      resetForm();
      await loadData();
      alert('✅ Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('❌ Failed to add product: ' + error.message);
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

      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        ...formData,
        price: parseInt(formData.price),
        discount: parseInt(formData.discount) || 0,
        image: imageUrl
      });
      
      resetForm();
      await loadData();
      alert('✅ Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('❌ Failed to update product');
    }
  };

  // ✅ প্রোডাক্ট ডিলিট করুন (Storage থেকেও ইমেজ ডিলিট)
  const handleDeleteProduct = async (id, imageUrl) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      if (imageUrl && imageUrl.includes('firebasestorage')) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef).catch(() => {});
      }

      await deleteDoc(doc(db, 'products', id));
      await loadData();
      alert('✅ Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('❌ Failed to delete product');
    }
  };

  // ✅ অর্ডার স্ট্যাটাস আপডেট করুন
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      await loadData();
      alert('✅ Order status updated!');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('❌ Failed to update order');
    }
  };

  // ✅ ফর্ম রিসেট
  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: '',
      stock: 'In Stock',
      image: '',
      discount: 0,
      description: ''
    });
    setImageFile(null);
    setImagePreview('');
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
      name: product.name || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      stock: product.stock || 'In Stock',
      image: product.image || '',
      discount: product.discount || 0,
      description: product.description || ''
    });
  };

  if (!isAdmin) {
    return <div className="p-6 text-red-500 font-bold">Access Denied! Admin only.</div>;
  }

  // ✅ Stats Cards
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
            <p className="text-gray-500">Welcome back, {user?.name || 'Admin'}!</p>
          </div>
          <button 
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'products' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            📦 Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'orders' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Orders
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {/* Add/Edit Form */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">
                {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
              </h2>
              <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Product Name"
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Price (e.g. 1200)"
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Category (e.g. shoes, laptop)"
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                  )}
                  {formData.image && !imagePreview && (
                    <img src={formData.image} alt="Current" className="w-20 h-20 object-cover rounded" />
                  )}
                </div>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  placeholder="Discount % (e.g. 10)"
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <div className="md:col-span-2">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Product description (optional)"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isAdding ? 'Saving...' : editingProduct ? '✏️ Update' : '➕ Add Product'}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Product List */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">📦 Products ({products.length})</h2>
                <span className="text-sm text-gray-400">{loading ? 'Loading...' : ''}</span>
              </div>
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No products yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Image</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Price</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Stock</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-t hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <img 
                              src={product.image || '/no-image.png'} 
                              alt={product.name} 
                              className="w-12 h-12 object-cover rounded"
                              loading="lazy"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3">৳{product.price}</td>
                          <td className="px-4 py-3">{product.category}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              product.stock === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => startEdit(product)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.image)}
                              className="text-red-500 hover:text-red-700"
                            >
                              🗑️
                            </button>
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

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">📋 Orders ({orders.length})</h2>
              <span className="text-sm text-gray-400">{loading ? 'Loading...' : ''}</span>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs">{order.id?.slice(0, 8) || 'N/A'}</td>
                        <td className="px-4 py-3">{order.customerEmail || 'Guest'}</td>
                        <td className="px-4 py-3">{order.items?.length || 0}</td>
                        <td className="px-4 py-3 font-medium">৳{order.totalPrice || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
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
      </div>
    </div>
  );
}