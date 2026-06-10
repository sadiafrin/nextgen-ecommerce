import { LayoutDashboard, FileText, Settings, LogOut, ShoppingCart, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { cart } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Cart', path: '/cart', icon: <ShoppingCart size={20} />, badge: cart.length },
    { name: 'Orders', path: '/orders', icon: <FileText size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col justify-between p-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-600 mb-10">NEXGEN E-COMM</h1>
        
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <Link to={item.path} key={item.name}>
              <li 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mt-2 ${
                  location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </div>
                
                {/* ✅ Cart badge */}
                {item.name === 'Cart' && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </li>
            </Link>
          ))}

          {/* ✅ Login option */}
          {!user && (
            <Link to="/login">
              <li 
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mt-2 ${
                  location.pathname === '/login' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LogIn size={20} />
                <span className="font-medium">Login</span>
              </li>
            </Link>
          )}

          {/* ✅ Register option */}
          {!user && (
            <Link to="/register">
              <li 
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mt-2 ${
                  location.pathname === '/register' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LogIn size={20} />
                <span className="font-medium">Register</span>
              </li>
            </Link>
          )}
        </ul>
      </div>

      <div className="border-t pt-6">
        {user ? (
          <button 
            onClick={logout} 
            className="flex items-center gap-3 text-red-500 font-medium hover:text-red-700 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        ) : (
          <p className="text-gray-400 text-sm">Not logged in</p>
        )}
      </div>
    </div>
  );
}
