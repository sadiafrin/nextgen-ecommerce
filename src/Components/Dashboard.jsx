// src/Components/Dashboard.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import SearchBar from './searchbar';
import ProductGrid from './ProductGrid';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const productsPerPage = 12;

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
    ]
  };

  // ✅ সব প্রোডাক্ট তৈরি - useMemo দিয়ে memoized
  const allProducts = useMemo(() => {
    const products = [];
    categories.forEach(category => {
      const images = productImages[category] || [];
      for (let i = 0; i < 4; i++) {
        products.push({
          id: `${category}-${i + 1}`,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Style ${i + 1}`,
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

  // ✅ ফিল্টার প্রোডাক্ট - useMemo দিয়ে memoized
  const filteredProducts = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return allProducts;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return allProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const categoryMatch = product.category.toLowerCase().includes(query);
      return nameMatch || categoryMatch;
    });
  }, [allProducts, searchQuery]);

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

  // ✅ Offline Status Badge
  const OfflineBadge = () => {
    if (isOnline) return null;
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
        <span className="text-sm">📡</span>
        <span className="text-sm font-medium">Offline Mode</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* ✅ MODERN HERO SECTION */}
      <div className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50/30 overflow-hidden">
        
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Text Content */}
            <div className="space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100/80 backdrop-blur-sm rounded-full text-orange-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                🚀 Welcome to QuickBuy
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gray-800">Your Premium</span>
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Shopping Experience
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Fast & smart shopping. Discover amazing products at best prices. 
                Secure checkout and quick delivery.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center justify-center lg:justify-start gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-lg group-hover:scale-110 transition">
                    🚀
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Fast Delivery</p>
                    <p className="text-xs text-gray-500">2-3 days</p>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-lg group-hover:scale-110 transition">
                    🔒
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Secure Checkout</p>
                    <p className="text-xs text-gray-500">100% safe</p>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white text-lg group-hover:scale-110 transition">
                    💳
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Easy Returns</p>
                    <p className="text-xs text-gray-500">30 days policy</p>
                  </div>
                </div>
              </div>

              {/* ✅ CTA Buttons - সরিয়ে ফেলা হয়েছে */}
            </div>

            {/* Right Side - Hero Image/Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Image Card */}
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1557821552-17105176677c?w=600&h=400&fit=crop&auto=format" 
                    alt="Shopping"
                    className="w-full h-80 object-cover"
                    loading="lazy"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  
                  {/* Floating Badge 1 - Top Right */}
                  <div className="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg p-3 animate-bounce-slow">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <p className="font-bold text-sm">4.9 Rating</p>
                        <p className="text-xs text-gray-500">1.2k reviews</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Badge 2 - Bottom Left */}
                  <div className="absolute -bottom-3 -left-3 bg-white rounded-xl shadow-lg p-3 animate-bounce-slow-delay">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <p className="font-bold text-sm">50% Off</p>
                        <p className="text-xs text-gray-500">Limited time</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Floating Cards */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-4 hidden xl:block">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">10K+</p>
                    <p className="text-xs text-gray-500">Happy Customers</p>
                  </div>
                </div>
                <div className="absolute -left-6 bottom-10 bg-white rounded-xl shadow-lg p-4 hidden xl:block">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">500+</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">🔥 Trending Products</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {searchQuery ? `Showing results for "${searchQuery}"` : 'Browse our most popular items'}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 sm:mt-10 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1 shadow-sm"
              disabled={currentPage === 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                const pageNumber = currentPage + idx;
                if (pageNumber > totalPages) return null;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition shadow-sm ${
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
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1 shadow-sm"
              disabled={currentPage === totalPages}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ✅ Offline Mode Badge */}
      <OfflineBadge />

      {/* ✅ CSS Animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-bounce-slow-delay {
          animation: bounce-slow 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </div>
  );
}