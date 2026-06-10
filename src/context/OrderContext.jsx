import { createContext, useState, useEffect } from 'react';

// ১. কনটেক্সট তৈরি করা
export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  // ২. localStorage থেকে অর্ডার লোড করা
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch (err) {
      console.error("Error parsing saved orders:", err);
      return [];
    }
  });

  // ৩. অর্ডার পরিবর্তিত হলে localStorage-এ সেভ করা
  useEffect(() => {
    try {
      localStorage.setItem('orders', JSON.stringify(orders));
    } catch (err) {
      console.error("Error saving orders:", err);
    }
  }, [orders]);

  // ৪. নতুন অর্ডার যোগ করার ফাংশন
  const placeOrder = (newOrder) => {
    setOrders((prev) => [
      ...prev,
      {
        ...newOrder,
        id: Date.now(), // unique id
        date: new Date().toLocaleDateString(), // order date
      },
    ]);
  };

  // ৫. সব অর্ডার clear করার ফাংশন
  const clearOrders = () => {
    setOrders([]);
    localStorage.removeItem('orders');
  };

  // ৬. নির্দিষ্ট অর্ডার remove করার ফাংশন (extra সুবিধা)
  const removeOrder = (id) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, clearOrders, removeOrder }}>
      {children}
    </OrderContext.Provider>
  );
};
export default OrderProvider;
