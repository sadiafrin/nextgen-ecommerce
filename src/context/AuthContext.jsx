import { createContext, useState, useEffect } from "react";
import { usersStore, metricsStore } from "../db"; // ✅ metricsStore import

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // ✅ Metrics initialize (refresh/browser clear হলে default set হবে)
  const initMetrics = async () => {
    const keys = ["newCustomers", "totalOrders", "monthlySales", "totalLogins"];
    for (const key of keys) {
      const existing = await metricsStore.getItem(key);
      if (existing === null || existing === undefined) {
        await metricsStore.setItem(key, 0);
      }
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      await initMetrics(); // ✅ metrics always ready

      const savedUser = await usersStore.getItem("currentUser");
      if (savedUser) setUser(savedUser);

      // 🔹 Ensure default admin exists
      let adminExists = false;
      await usersStore.iterate((value) => {
        if (value.role === "admin") adminExists = true;
      });
      if (!adminExists) {
        const adminUser = {
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
          isAdmin: true
        };
        await usersStore.setItem("admin", adminUser);
      }
    };
    loadUser();
  }, []);

  // ✅ Login function
  const login = async (email, password) => {
    const allUsers = [];
    await usersStore.iterate((value) => {
      allUsers.push(value);
    });

    const foundUser = allUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const loggedInUser = {
        email: foundUser.email,
        role: foundUser.role,
        isAdmin: foundUser.role === "admin"
      };
      setUser(loggedInUser);
      await usersStore.setItem("currentUser", loggedInUser);

      // 🔹 Metrics update: total logins বাড়ানো
      let totalLogins = parseInt(await metricsStore.getItem("totalLogins") || "0");
      await metricsStore.setItem("totalLogins", totalLogins + 1);

      return true;
    }
    return false;
  };

  // ✅ Logout function
  const logout = async () => {
    setUser(null);
    await usersStore.removeItem("currentUser");
  };

  // ✅ Register function
  const register = async (email, password, role = "customer") => {
    const allUsers = [];
    await usersStore.iterate((value) => {
      allUsers.push(value);
    });

    const exists = allUsers.find((u) => u.email === email);
    if (exists) return false;

    const newUser = {
      email,
      password,
      role,
      isAdmin: role === "admin"
    };
    await usersStore.setItem(`user_${Date.now()}`, newUser);

    // 🔹 Metrics update: নতুন customer হলে count বাড়ানো
    let newCustomers = parseInt(await metricsStore.getItem("newCustomers") || "0");
    await metricsStore.setItem("newCustomers", newCustomers + 1);

    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
