// src/Components/Dashboard.jsx
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import SearchBar from './searchbar';

const ProductGrid = lazy(() => import('./ProductGrid'));

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const productsPerPage = 12;

  const categories = ['shoes', 'watch', 'handbag', 'laptop', 'camera', 'perfume', 'sneakers'];
  
  const productImages = {
    shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop",
    watch: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop",
    handbag: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop",
    laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop",
    camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop",
    perfume: "https://images.unsplash.com/photo-1523293182086-76515894d078?w=300&h=300&fit=crop",
    sneakers: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop"
  };

  const allProducts = useMemo(() => {
    return Array.from({ length: 5000 }, (_, i) => {
      const category = categories[i % categories.length];
      return {
        id: i + 1,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} - Item ${i + 1}`,
        price: `৳${Math.floor(Math.random() * 5000) + 500}`,
        stock: i % 2 === 0 ? "In Stock" : "Out of Stock",
        image: productImages[category],
        category: category,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 500) + 10
      };
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 sm:py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Welcome to <span className="text-yellow-300">QuickBuy</span>! 👋
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto px-2">
            Fast & smart shopping. Discover amazing products at best prices.
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
              🚀 Fast Delivery
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
              🔒 Secure Checkout
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
              💳 Easy Returns
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Products Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">🔥 Trending Products</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {searchQuery ? `Showing results for "${searchQuery}"` : 'Browse our most popular items'}
            </p>
          </div>
          {/* ✅ Search Bar এখানে থাকবে */}
          <div className="w-full sm:w-auto">
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
            />
          </div>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <ProductGrid products={currentProducts} loading={loading} />
        </Suspense>

        {/* ✅ Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 sm:mt-10 flex justify-center items-center gap-1 sm:gap-2 flex-wrap pb-8 sm:pb-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
              disabled={currentPage === 1}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              const pageNumber = currentPage + idx;
              if (pageNumber > totalPages) return null;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg transition ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {totalPages > 5 && <span className="px-1 sm:px-2 text-gray-400">...</span>}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 transition"
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}