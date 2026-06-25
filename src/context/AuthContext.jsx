// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, query, where } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  // ✅ ইউজার ডেটা ফায়ারস্টোরে সেভ করুন
  const saveUserToFirestore = async (uid, email, name, isAdmin = false) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // ✅ নতুন ইউজার
        await setDoc(userRef, {
          uid,
          email,
          name: name || email?.split('@')[0] || 'User',
          isAdmin: isAdmin,
          createdAt: new Date(),
          lastLogin: new Date(),
          loginCount: 1,
          isNewCustomer: true
        });
        
        // ✅ Admin Stats-এ newCustomer যোগ করুন
        const statsRef = doc(db, 'adminStats', 'stats');
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          await updateDoc(statsRef, {
            newCustomers: increment(1),
            totalLogins: increment(1)
          });
        } else {
          // ✅ Stats না থাকলে তৈরি করুন
          await setDoc(statsRef, {
            newCustomers: 1,
            totalOrders: 0,
            monthlySales: 0,
            totalLogins: 1,
            lastUpdated: new Date()
          });
        }
      } else {
        // ✅ পুরনো ইউজার → লগইন কাউন্ট বাড়ান
        await updateDoc(userRef, {
          lastLogin: new Date(),
          loginCount: increment(1)
        });
        
        // ✅ Admin Stats-এ totalLogins বাড়ান
        const statsRef = doc(db, 'adminStats', 'stats');
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          await updateDoc(statsRef, {
            totalLogins: increment(1)
          });
        }
      }
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
    }
  };

  // ✅ Admin Stats তৈরি করুন (প্রথমবার)
  const createAdminStats = async () => {
    try {
      const statsRef = doc(db, 'adminStats', 'stats');
      const statsSnap = await getDoc(statsRef);
      if (!statsSnap.exists()) {
        await setDoc(statsRef, {
          newCustomers: 0,
          totalOrders: 0,
          monthlySales: 0,
          totalLogins: 0,
          lastUpdated: new Date()
        });
        console.log('✅ Admin stats created');
      }
    } catch (error) {
      console.error('Error creating admin stats:', error);
    }
  };

  useEffect(() => {
    createAdminStats();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ✅ Firebase ইউজার থেকে ডেটা নিন
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          isAdmin: firebaseUser.email === 'admin@example.com'
        };
        
        // ✅ ফায়ারস্টোরে ইউজার সেভ করুন
        await saveUserToFirestore(
          firebaseUser.uid, 
          firebaseUser.email, 
          userData.name, 
          userData.isAdmin
        );
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Register function (ডুপ্লিকেট চেক সহ)
  const register = async (name, email, password) => {
    try {
      // ✅ ইমেইল ইতিমধ্যে রেজিস্টার্ড কিনা চেক করুন
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('This email is already registered. Please login.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      await saveUserToFirestore(userCredential.user.uid, email, name, false);
      
      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // ✅ Login function
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // ✅ Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // ✅ সব ইউজার লোড করুন (অ্যাডমিনের জন্য)
  const loadAllUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersList = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersList);
      return usersList;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  };

  // ✅ Admin Stats লোড করুন
  const loadAdminStats = async () => {
    try {
      const statsRef = doc(db, 'adminStats', 'stats');
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists()) {
        return statsSnap.data();
      }
      return { newCustomers: 0, totalOrders: 0, monthlySales: 0, totalLogins: 0 };
    } catch (error) {
      console.error('Error loading admin stats:', error);
      return { newCustomers: 0, totalOrders: 0, monthlySales: 0, totalLogins: 0 };
    }
  };

  const value = {
    user,
    loading,
    allUsers,
    register,
    login,
    logout,
    loadAllUsers,
    loadAdminStats,
    isAdmin: user?.isAdmin || false,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;