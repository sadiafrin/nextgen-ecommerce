// src/components/CartIcon.jsx
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function CartIcon() {
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();

  return (
    <div 
      className="relative cursor-pointer" 
      onClick={() => navigate('/cart')}
    >
      {/* একটি সিম্পল কার্ট আইকন (SVG) */}
      <span>🛒</span>
      
      {/* আইটেম কাউন্ট */}
      {cart.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cart.length}
        </span>
      )}
    </div>
  );
}