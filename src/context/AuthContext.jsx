import { createContext, useState } from "react";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, role }

  // LocalStorage থেকে users লোড করা
  const getUsers = () => {
    return JSON.parse(localStorage.getItem("users")) || [];
  };

  const login = (email, password) => {
    const users = getUsers();
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      setUser({ email: foundUser.email, role: foundUser.role });
      return true; // login success
    }
    return false; // login failed
  };

  const logout = () => setUser(null);

  // ✅ Register function: নতুন user যোগ করবে localStorage এ
  const register = (email, password) => {
    const users = getUsers();
    const exists = users.find((u) => u.email === email);
    if (exists) {
      return false; // already exists
    }
    users.push({ email, password, role: "customer" });
    localStorage.setItem("users", JSON.stringify(users));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; // ✅ default export যোগ করা হলো
