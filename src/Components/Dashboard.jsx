// src/Components/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import SearchBar from './searchbar';
import ProductGrid from './ProductGrid';

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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

  // ✅ সব প্রোডাক্ট তৈরি - প্রতি ক্যাটাগরিতে ৪টি (মোট ২৮টি)
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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // ✅ ফিল্টার প্রোডাক্ট (সার্চ অনুযায়ী)
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
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage, productsPerPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-10 sm:py-14 md:py-18 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
            Welcome to <span className="text-yellow-300">QuickBuy</span>! 👋
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto px-2">
            Fast & smart shopping. Discover amazing products at best prices.
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
              🚀 Fast Delivery
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
              🔒 Secure Checkout
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
              💳 Easy Returns
            </span>
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

        <ProductGrid products={currentProducts} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 sm:mt-10 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition shadow-sm ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
    </div>
  );
}