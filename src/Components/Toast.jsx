// src/Components/Toast.jsx
import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: '✅',
    error: '❌',
    offline: '📦',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    offline: 'bg-yellow-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500'
  };

  return (
    <div className={`fixed top-20 right-4 md:right-8 z-50 max-w-sm w-full ${bgColors[type] || 'bg-blue-500'} text-white rounded-xl shadow-2xl p-4 transform transition-all duration-500 animate-slide-down`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[type] || 'ℹ️'}</span>
        <span className="font-medium text-sm flex-1">{message}</span>
        <button onClick={() => { setIsVisible(false); if (onClose) setTimeout(onClose, 300); }} className="text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}