// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// ✅ সরাসরি কনফিগারেশন (আপনার Firebase কনসোল থেকে কপি করা)
const firebaseConfig = {
  apiKey: "AIzaSyADmbbqZVps45VRyw7JH4wMxLfkvuL_7Sc",
  authDomain: "nextgen-ecommerce-4f5ac.firebaseapp.com",
  projectId: "nextgen-ecommerce-4f5ac",
  storageBucket: "nextgen-ecommerce-4f5ac.firebasestorage.app",
  messagingSenderId: "33457406940",
  appId: "1:33457406940:web:d5cde534338bac6592c519",
  measurementId: "G-NGL5HL4KSL"
};

// ✅ Firebase Initialize
const app = initializeApp(firebaseConfig);

// ✅ Services Export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

console.log('✅ Firebase initialized successfully');

export default app;