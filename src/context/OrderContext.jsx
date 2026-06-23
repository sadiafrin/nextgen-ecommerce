import { createContext, useState, useEffect } from 'react';
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase"; // ✅ সঠিক path

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch (err) {
      console.error("Error parsing saved orders:", err);
      return [];
    }
  });

  // 🔹 যখন orders পরিবর্তিত হবে তখন localStorage এ সেভ + metrics আপডেট
  useEffect(() => {
    try {
      localStorage.setItem('orders', JSON.stringify(orders));

      const totalOrders = orders.length;
      const monthlySales = orders.reduce(
        (sum, order) => sum + Number(order.totalPrice || 0),
        0
      );

      localStorage.setItem('totalOrders', totalOrders);
      localStorage.setItem('monthlySales', monthlySales);
    } catch (err) {
      console.error("Error saving orders:", err);
    }
  }, [orders]);

  // 🔹 নতুন অর্ডার যোগ + Firestore এ save
  const placeOrder = async (newOrder) => {
    const orderData = {
      ...newOrder,
      id: Date.now(),
      date: new Date().toLocaleDateString(),
    };

    // Local state update
    setOrders((prev) => [...prev, orderData]);

    // Firestore এ save
    try {
      await addDoc(collection(db, "orders"), orderData);
      console.log("✅ Order saved to Firestore!", orderData);
    } catch (err) {
      console.error("❌ Error saving order to Firestore:", err);
    }
  };

  // 🔹 সব অর্ডার clear করা
  const clearOrders = () => {
    setOrders([]);
    localStorage.removeItem('orders');
    localStorage.setItem('totalOrders', 0);
    localStorage.setItem('monthlySales', 0);
  };

  // 🔹 নির্দিষ্ট অর্ডার remove করা
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
