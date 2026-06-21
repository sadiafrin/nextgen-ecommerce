import { useState } from "react";
import { usersStore } from "../db"; // ✅ db.js থেকে import করো

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    // 🔹 আগে check করো user আছে কিনা
    const allUsers = [];
    await usersStore.iterate((value) => {
      allUsers.push(value);
    });

    const exists = allUsers.find(u => u.email === email);
    if (exists) {
      alert("❌ User already exists!");
      return;
    }

    // 🔹 নতুন user বানানো
    const newUser = {
      email,
      password,
      role: "customer",
      isAdmin: false
    };

    // 🔹 usersStore এ save করা
    const id = `user_${Date.now()}`;
    await usersStore.setItem(id, newUser);

    alert("✅ Registration successful!");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Register</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Register
        </button>
      </form>
    </div>
  );
}
