// src/Components/productCard.jsx
import { memo, useState } from 'react';
import { useCart } from '../context/CartContext';
// ✅ Wishlist ইম্পোর্ট সরিয়ে ফেলুন

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!product || typeof product !== 'object') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 text-center text-gray-400 border border-gray-100">
        <p>Product data unavailable</p>
      </div>
    );
  }

  const stockStatus = {
    'In Stock': { color: 'bg-green-500', text: 'In Stock' },
    'Out of Stock': { color: 'bg-red-500', text: 'Out of Stock' },
    'Low Stock': { color: 'bg-yellow-500', text: 'Low Stock' }
  };

  const stockInfo = stockStatus[product.stock] || stockStatus['Out of Stock'];

  const formatPrice = (price) => {
    if (typeof price === 'string' && price.startsWith('৳')) return price;
    return `৳${Number(price).toLocaleString()}`;
  };

  const categoryEmoji = {
    shoes: '👟', watch: '⌚', handbag: '👜', laptop: '💻',
    camera: '📷', perfume: '🌸', sneakers: '👟', electronics: '📱',
    clothing: '👕', books: '📚', home: '🏠', beauty: '💄',
    sports: '⚽', food: '🍔'
  };

  const emoji = categoryEmoji[product.category?.toLowerCase()] || '📦';

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (product.stock !== 'In Stock') {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { 
          message: 'Sorry! This product is out of stock 😞', 
          type: 'error' 
        }
      }));
      return;
    }

    try {
      await addToCart(product);
      setIsAdded(true);
      
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { 
          message: `${product.name} added to cart! 🛒`, 
          type: 'success' 
        }
      }));
      
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Add to cart error:', error);
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { 
          message: 'Failed to add to cart. Please try again.', 
          type: 'error' 
        }
      }));
    }
  };

  return (
    <div
      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={product.image || 'https://via.placeholder.com/300x300?text=No+Image'}
          alt={product.name || 'Product'}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={`${stockInfo.color} text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm backdrop-blur-sm bg-opacity-90`}>
            {stockInfo.text}
          </span>
        </div>

        {product.discount && product.discount > 0 && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm animate-pulse">
            🔥 -{product.discount}%
          </div>
        )}

        {/* ✅ Wishlist বাটন সরিয়ে ফেলুন */}

        <div className="absolute bottom-2 right-2">
          <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>{emoji}</span>
            <span className="capitalize">{product.category}</span>
          </span>
        </div>

        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button 
            onClick={() => window.location.href = `/product/${product.id}`}
            className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            👁️ Quick View
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <span>{emoji}</span>
            <span className="capitalize">{product.category}</span>
          </span>

          {product.rating > 0 && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 ${
                    i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'
                  }`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500">({product.reviews || 0})</span>
            </div>
          )}
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-1 mt-0.5 sm:mt-1 group-hover:text-orange-500 transition-colors">
          {product.name || 'Unnamed Product'}
        </h3>

        <div className="flex items-center justify-between mt-1 sm:mt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base md:text-xl font-bold text-orange-500">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {product.stock === 'In Stock' && (
            <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span>🚚</span>
              <span>{Math.floor(Math.random() * 5) + 2}d</span>
            </span>
          )}
        </div>

        {Number(String(product.price).replace(/[^0-9]/g, '') || 0) > 1000 && (
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-green-600 font-medium flex items-center gap-1">
            <span>🆓</span>
            <span>Free Delivery</span>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={product.stock !== 'In Stock'}
          className={`w-full mt-2 sm:mt-3 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
            product.stock === 'In Stock'
              ? isAdded
                ? 'bg-green-600 text-white scale-95'
                : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg active:scale-95'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAdded ? (
            <span className="flex items-center justify-center gap-1 sm:gap-2">
              <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Added
            </span>
          ) : product.stock === 'In Stock' ? (
            <span className="flex items-center justify-center gap-1 sm:gap-2">
              <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Add to Cart
            </span>
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(ProductCard);