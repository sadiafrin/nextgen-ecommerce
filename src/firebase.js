// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWPQ5ZAQWZnY_k8HkWfQJD4s3icL0pTB4",
  authDomain: "nextgen-ecommerce-4f5ac.firebaseapp.com",
  projectId: "nextgen-ecommerce-4f5ac",
  storageBucket: "nextgen-ecommerce-4f5ac.appspot.com", // ✅ ঠিক করা হয়েছে
  messagingSenderId: "33457406940",
  appId: "1:33457406940:web:d5cde534338bac6592c519",
  measurementId: "G-NGL5HL4KSL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
