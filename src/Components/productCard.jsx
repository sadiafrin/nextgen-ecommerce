import { useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate ইমপোর্ট করুন
import { CartContext } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate(); // useNavigate হুকটি কল করুন

  // Buy Now এর জন্য ফাংশন
  const handleBuyNow = () => {
    addToCart(product); // ১. কার্টে যোগ করুন
    navigate('/cart');  // ২. কার্ট পেজে নিয়ে যান
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-transform hover:shadow-md">
      <img 
        src={product.image} 
        alt={product.name} 
        loading="lazy" 
        className="w-full h-40 object-cover rounded-lg mb-4 bg-gray-200"
        onError={(e) => { 
          e.target.onerror = null; 
          e.target.src = 'https://dummyimage.com/400x300/cccccc/ffffff&text=Image+Not+Found'; 
        }}
      />
      
      <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
      <p className="text-blue-600 font-semibold">{product.price}</p>
      
      <p className={`text-sm mb-4 ${product.stock === "Available" ? "text-green-600" : "text-red-600"}`}>
        {product.stock}
      </p>
      
      <div className="flex gap-2">
        <button 
          onClick={() => addToCart(product)} 
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add to Cart
        </button>
        {/* Buy Now বাটনটি এখন ক্লিক করলে কাজ করবে */}
        <button 
          onClick={handleBuyNow} 
          className="flex-1 bg-white border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}