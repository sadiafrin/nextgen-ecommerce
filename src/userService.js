import { usersStore } from "../db";

// 🔹 নতুন user register করার function
export const registerUser = async (email, password, role = "customer") => {
  const allUsers = [];
  await usersStore.iterate((value) => {
    allUsers.push(value);
  });

  const exists = allUsers.find(u => u.email === email);
  if (exists) {
    return { success: false, message: "User already exists!" };
  }

  const id = `user_${Date.now()}`;
  await usersStore.setItem(id, { email, password, role });

  return { success: true, message: "User registered successfully!" };
};
