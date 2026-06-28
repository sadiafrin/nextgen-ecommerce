// src/Components/Dashboard.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import SearchBar from './searchbar';
import ProductGrid from './ProductGrid';
import { Link } from 'react-router-dom';

// ✅ ক্যাটাগরি ডেটা (প্রতিটি ক্যাটাগরির জন্য ৪টি আলাদা ইমেজ)
const categoriesData = [
  { 
    id: 'electronics', 
    name: '📱 Electronics', 
    icon: '📱',
    images: [
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Smartphones, Laptops, Cameras, TVs, Headphones' 
  },
  { 
    id: 'fashion', 
    name: '👗 Fashion', 
    icon: '👗',
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Clothing, Shoes, Bags, Watches, Jewelry' 
  },
  { 
    id: 'home-living', 
    name: '🏠 Home & Living', 
    icon: '🏠',
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Furniture, Bedding, Curtains, Lighting, Decor' 
  },
  { 
    id: 'kitchen', 
    name: '🍳 Kitchen', 
    icon: '🍳',
    images: [
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1585543805890-6051f7823f7c?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Blenders, Ovens, Refrigerators, Cookware' 
  },
  { 
    id: 'groceries', 
    name: '🛒 Groceries', 
    icon: '🛒',
    images: [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1561043433-aaf687c4cf5f?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1543362906-acf16b3bb18d?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Rice, Pulses, Oils, Snacks, Spices, Toiletries' 
  },
  { 
    id: 'beauty', 
    name: '💄 Beauty', 
    icon: '💄',
    images: [
      "https://images.unsplash.com/photo-1596462502278-5a07e0b9fbc5?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1556228578-0c85b1d34910?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1559599238-308793637427?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Makeup, Skincare, Haircare, Perfumes, Grooming' 
  },
  { 
    id: 'baby', 
    name: '👶 Baby', 
    icon: '👶',
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Diapers, Baby Food, Toys, Baby Clothing, Strollers' 
  },
  { 
    id: 'sports', 
    name: '⚽ Sports', 
    icon: '⚽',
    images: [
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Fitness Equipment, Bicycles, Sports Gear, Bags' 
  },
  { 
    id: 'books', 
    name: '📚 Books', 
    icon: '📚',
    images: [
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Fiction, Non-fiction, Notebooks, Pens, Art Supplies' 
  },
  { 
    id: 'automotive', 
    name: '🚗 Automotive', 
    icon: '🚗',
    images: [
      "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop&auto=format"
    ],
    description: 'Helmets, Car/Bike Parts, Engine Oils, Accessories' 
  }
];

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const productsPerPage = 12;

  // ✅ ক্যাটাগরি অনুযায়ী প্রোডাক্ট তৈরি
  const categories = ['shoes', 'watch', 'handbag', 'laptop', 'camera', 'perfume', 'sneakers'];
  
  const productImages = {
    shoes: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=300&h=300&fit=crop&auto=format"
    ],
    watch: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300&h=300&fit=crop&auto=format"
    ],
    handbag: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=300&h=300&fit=crop&auto=format"
    ],
    laptop: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&h=300&fit=crop&auto=format"
    ],
    camera: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop&auto=format"
    ],
    perfume: [
      "https://images.unsplash.com/photo-1523293182086-76515894d078?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1523293182086-76515894d078?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop&auto=format"
    ],
    sneakers: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=300&fit=crop&auto=format"
    ],
    // ✅ নতুন ক্যাটাগরি ইমেজ
    electronics: [
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&h=300&fit=crop&auto=format"
    ],
    fashion: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop&auto=format"
    ],
    'home-living': [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1618220179428-22790b461013?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=300&h=300&fit=crop&auto=format"
    ],
    kitchen: [
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1585543805890-6051f7823f7c?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=300&h=300&fit=crop&auto=format"
    ],
    groceries: [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1561043433-aaf687c4cf5f?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1543362906-acf16b3bb18d?w=300&h=300&fit=crop&auto=format"
    ],
    beauty: [
      "https://images.unsplash.com/photo-1596462502278-5a07e0b9fbc5?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1556228578-0c85b1d34910?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1559599238-308793637427?w=300&h=300&fit=crop&auto=format"
    ],
    baby: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300&h=300&fit=crop&auto=format"
    ],
    sports: [
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=300&h=300&fit=crop&auto=format"
    ],
    books: [
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=300&h=300&fit=crop&auto=format"
    ],
    automotive: [
      "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=300&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=300&h=300&fit=crop&auto=format"
    ]
  };

  // ✅ সব ক্যাটাগরি আইডি
  const allCategoryIds = ['shoes', 'watch', 'handbag', 'laptop', 'camera', 'perfume', 'sneakers', 
    'electronics', 'fashion', 'home-living', 'kitchen', 'groceries', 'beauty', 'baby', 'sports', 'books', 'automotive'];

  // ✅ সব প্রোডাক্ট তৈরি - useMemo দিয়ে memoized
  const allProducts = useMemo(() => {
    const products = [];
    allCategoryIds.forEach(category => {
      const images = productImages[category] || [];
      for (let i = 0; i < 4; i++) {
        products.push({
          id: `${category}-${i + 1}`,
          name: `${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')} Style ${i + 1}`,
          price: `৳${Math.floor(Math.random() * 5000) + 500}`,
          stock: i % 2 === 0 ? "In Stock" : "Out of Stock",
          image: images[i % images.length] || 'https://via.placeholder.com/300x300?text=No+Image',
          category: category,
          rating: (Math.random() * 2 + 3).toFixed(1),
          reviews: Math.floor(Math.random() * 500) + 10,
          discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 10 : 0
        });
      }
    });
    return products;
  }, []);

  // ✅ Online/Offline Status Track
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Loading State
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // ✅ ফিল্টার প্রোডাক্ট - সার্চ + ক্যাটাগরি
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    
    // Search Filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(query);
        const categoryMatch = product.category.toLowerCase().includes(query);
        return nameMatch || categoryMatch;
      });
    }
    
    // ✅ Category Filter
    if (selectedCategory) {
      result = result.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    return result;
  }, [allProducts, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  // ✅ Current Page Products - useMemo
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage, productsPerPage]);

  // ✅ Page Change Handler - useCallback
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ✅ Category Select Handler
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setCurrentPage(1);
  };

  // ✅ Offline Status Badge
  const OfflineBadge = () => {
    if (isOnline) return null;
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 animate-pulse">
        <span className="text-xs sm:text-sm">📡</span>
        <span className="text-xs sm:text-sm font-medium">Offline Mode</span>
      </div>
    );
  };

  // ✅ Get category image
  const getCategoryImage = (categoryId) => {
    const cat = categoriesData.find(c => c.id === categoryId);
    return cat?.images?.[0] || 'https://via.placeholder.com/400x300?text=Category';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* ✅ MODERN HERO SECTION - Fully Responsive */}
      <div className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50/30 overflow-hidden py-12 sm:py-16 md:py-20 lg:py-28">
        
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-100/80 backdrop-blur-sm rounded-full text-orange-700 text-xs sm:text-sm font-medium">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-orange-500"></span>
            </span>
            🚀 Welcome to QuickBuy
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mt-3 sm:mt-4">
            <span className="text-gray-800">Your Premium</span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Shopping Experience
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mt-3 sm:mt-4 leading-relaxed">
            Fast & smart shopping. Discover amazing products at best prices. 
            Secure checkout and quick delivery.
          </p>

          {/* ✅ ONLINE + OFFLINE FEATURES - Fully Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 max-w-2xl mx-auto mt-6 sm:mt-8">
            
            {/* Online Feature Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border-2 border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all duration-300">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0 group-hover:scale-110 transition duration-300">
                    🌐
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800">Online Mode</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Real-time shopping, instant orders</p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                      </span>
                      <span className="text-gray-300 text-[10px] sm:text-xs">|</span>
                      <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Auto Sync
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Feature Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border-2 border-orange-200 shadow-lg hover:shadow-xl hover:border-orange-400 transition-all duration-300">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0 group-hover:scale-110 transition duration-300">
                    📡
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800">Offline Mode</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Shop without internet connection</p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                        Offline
                      </span>
                      <span className="text-gray-300 text-[10px] sm:text-xs">|</span>
                      <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Auto Sync
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Key Features - 3 Columns - Fully Responsive */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto mt-5 sm:mt-6 md:mt-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-base sm:text-lg group-hover:scale-110 transition">
                🚀
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-[11px] sm:text-xs md:text-sm">Fast Delivery</p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">2-3 days</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-base sm:text-lg group-hover:scale-110 transition">
                🔒
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-[11px] sm:text-xs md:text-sm">Secure Checkout</p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">100% safe</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white text-base sm:text-lg group-hover:scale-110 transition">
                💳
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-[11px] sm:text-xs md:text-sm">Easy Returns</p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">30 days policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CATEGORIES SECTION ===== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800">📂 Shop by Category</h2>
            <p className="text-xs sm:text-sm text-gray-500">Browse products by category</p>
          </div>
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-xs sm:text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              ✕ Clear Filter
            </button>
          )}
        </div>

        {/* Categories Grid - 4 Images per category */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {categoriesData.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`group relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ${
                selectedCategory === cat.id 
                  ? 'ring-2 ring-orange-500 ring-offset-2' 
                  : ''
              }`}
            >
              <div className="relative h-32 sm:h-36 md:h-40">
                <img 
                  src={cat.images[0]} 
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-sm sm:text-base font-bold">{cat.icon} {cat.name}</p>
                  <p className="text-[10px] sm:text-xs text-white/80 truncate">{cat.description}</p>
                </div>
                {selectedCategory === cat.id && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full">
                    Selected
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800">
              {selectedCategory 
                ? `📦 ${categoriesData.find(c => c.id === selectedCategory)?.name || 'Products'}`
                : '🔥 All Products'
              }
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {searchQuery 
                ? `Showing results for "${searchQuery}"` 
                : selectedCategory 
                  ? `Showing ${filteredProducts.length} products`
                  : `Showing ${filteredProducts.length} products`
              }
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
            />
          </div>
        </div>

        <ProductGrid key={currentPage} products={currentProducts} loading={loading} />

        {/* Pagination - Fully Responsive */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 md:mt-10 flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-0.5 sm:gap-1 shadow-sm"
              disabled={currentPage === 1}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">Prev</span>
            </button>

            <div className="flex gap-0.5 sm:gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                const pageNumber = currentPage + idx;
                if (pageNumber > totalPages) return null;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm ${
                      currentPage === pageNumber
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-0.5 sm:gap-1 shadow-sm"
              disabled={currentPage === totalPages}
            >
              <span className="hidden xs:inline">Next</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ✅ Offline Mode Badge */}
      <OfflineBadge />
    </div>
  );
}