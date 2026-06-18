import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

const CartProvider = ({ children }) => {
  // ✅ cart state initialize হবে localStorage থেকে
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      console.error("Error parsing cart data:", err);
      return [];
    }
  });

  // ✅ cart পরিবর্তন হলে localStorage এ save হবে
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Error saving cart data:", err);
    }
  }, [cart]);

  // ✅ cart functions
  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      const priceValue = Number(item.price?.toString().replace(/[^0-9.-]+/g, "")); // ✅ সবসময় number

      if (exists) {
        // যদি item আগে থাকে → quantity বাড়াও
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: (i.quantity || 1) + 1, price: priceValue }
            : i
        );
      }
      // নতুন item হলে → quantity = 1 দিয়ে add করো
      return [...prev, { ...item, quantity: 1, price: priceValue }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: quantity > 0 ? quantity : 1 } : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart"); // ✅ localStorage থেকেও clear হবে
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
