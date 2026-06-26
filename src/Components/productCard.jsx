// src/Components/productCard.jsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = () => {
    if (product.stock === 'In Stock') {
      addToCart(product);
      setIsAdded(true);
      
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: `${product.name} added to cart! 🛒`, type: 'success' }
      }));
      
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleImageError = (e) => {
    setImageError(true);
    e.target.src = '/no-image.png';
    e.target.alt = 'Image not available';
    setImageLoaded(true);
  };

  return (
    <div
      className="group relative bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ইমেজ কন্টেইনার */}
      <div className="relative overflow-hidden bg-gray-100 aspect-square">
        {product.discount && product.discount > 10 && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full z-10 shadow-lg">
            {product.discount}% OFF
          </span>
        )}

        <span className={`absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full z-10 shadow-md ${
          product.stock === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {product.stock || 'In Stock'}
        </span>

        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width="300"
          height="300"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
        )}

        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Link
            to={`/product/${product.id}`}
            className="bg-white text-gray-800 px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg text-xs sm:text-sm"
          >
            Quick View
          </Link>
        </div>
      </div>

      {/* প্রোডাক্ট ইনফো - রেস্পন্সিভ */}
      <div className="p-2 sm:p-3 md:p-4">
        <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
          {product.category || 'General'}
        </span>

        {/* ✅ প্রোডাক্ট নামের সাথে লিংক যোগ করা হয়েছে */}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base hover:text-blue-600 transition line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {product.rating && (
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
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

        <div className="flex items-center gap-2 mt-1 sm:mt-2">
          <span className="text-sm sm:text-base md:text-xl font-bold text-blue-600">{product.price}</span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock !== 'In Stock'}
          className={`w-full mt-2 sm:mt-3 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
            product.stock === 'In Stock'
              ? isAdded
                ? 'bg-green-600 text-white scale-95'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
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
            '🛒 Add to Cart'
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </div>
  );
}