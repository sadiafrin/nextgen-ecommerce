// src/Components/ProductGrid.jsx
import { memo } from 'react';
import ProductCard from './productCard';
// import WishlistButton from './WishlistButton'; // ✅ ইম্পোর্ট করুন

function ProductGrid({ products, loading = false }) {
  console.log('🛒 ProductGrid received:', products?.length || 0, 'products');

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-7 sm:h-8 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 sm:py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 text-base sm:text-lg font-medium">No products found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
      </div>
    );
  }

  // ✅ শুধু valid প্রোডাক্ট ফিল্টার করুন
  const validProducts = products.filter(product => product && typeof product === 'object' && product.id);

  console.log('✅ Valid products:', validProducts.length);

  if (validProducts.length === 0) {
    return (
      <div className="text-center py-16 sm:py-20">
        <p className="text-gray-500 text-base">No valid products available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {validProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default memo(ProductGrid);