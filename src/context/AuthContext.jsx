import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, role, isAdmin }

  // LocalStorage থেকে users লোড করা
  const getUsers = () => {
    return JSON.parse(localStorage.getItem("users")) || [];
  };

  // ✅ Refresh হলে LocalStorage থেকে currentUser লোড করা
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const login = (email, password) => {
    const users = getUsers();
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const loggedInUser = {
        email: foundUser.email,
        role: foundUser.role,
        isAdmin: foundUser.role === "admin" // ✅ role check
      };
      setUser(loggedInUser);

      // ✅ LocalStorage এ currentUser save করা
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
      return true; // login success
    }
    return false; // login failed
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser"); // ✅ clear on logout
  };

  // ✅ Register function: নতুন user যোগ করবে localStorage এ
  const register = (email, password, role = "customer") => {
    const users = getUsers();
    const exists = users.find((u) => u.email === email);
    if (exists) {
      return false; // already exists
    }
    const newUser = {
      email,
      password,
      role,
      isAdmin: role === "admin" // ✅ consistency
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
