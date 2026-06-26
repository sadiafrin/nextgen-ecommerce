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
import offlineTracker from '../services/OfflineTrackerService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUsers, setPendingUsers] = useState([]);

  // ✅ পেন্ডিং ইউজার লোড
  const loadPendingUsers = () => {
    try {
      const data = localStorage.getItem('pendingUsers');
      console.log('📋 loadPendingUsers called, data:', data);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error loading pending users:', error);
      return [];
    }
  };

  // ✅ পেন্ডিং ইউজার সেভ
  const savePendingUser = (userData) => {
    try {
      console.log('💾 savePendingUser called with:', userData);
      const pending = loadPendingUsers();
      pending.push(userData);
      localStorage.setItem('pendingUsers', JSON.stringify(pending));
      console.log('✅ Pending user saved successfully!');
      console.log('📋 Current pending users:', pending);
      return true;
    } catch (error) {
      console.error('❌ Error saving pending user:', error);
      return false;
    }
  };

  // ✅ ইউজার ডেটা ফায়ারস্টোরে সেভ
  const saveUserToFirestore = async (uid, email, name, isAdmin = false) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
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
        
        const statsRef = doc(db, 'adminStats', 'stats');
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          await updateDoc(statsRef, {
            newCustomers: increment(1),
            totalLogins: increment(1)
          });
        }
      } else {
        await updateDoc(userRef, {
          lastLogin: new Date(),
          loginCount: increment(1)
        });
        
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

  // ✅ Offline/Online ইভেন্ট
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Online event triggered');
      setIsOnline(true);
      syncPendingUsers();
    };
    const handleOffline = () => {
      console.log('📡 Offline event triggered');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ পেন্ডিং ইউজার সিঙ্ক (Sync করার পরেও রাখুন)
  const syncPendingUsers = async () => {
    if (!isOnline) return;

    const pending = loadPendingUsers();
    if (pending.length === 0) return;

    console.log(`🔄 Syncing ${pending.length} pending users...`);

    for (const userData of pending) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password
        );
        
        await updateProfile(userCredential.user, {
          displayName: userData.name
        });

        await saveUserToFirestore(
          userCredential.user.uid, 
          userData.email, 
          userData.name, 
          userData.isAdmin || false
        );

        // ✅ Sync করার পরেও pendingUsers-এ রাখুন (সিঙ্ক হলেও দেখাবে)
        // removePendingUser(userData.email); // ❌ এই লাইন কমেন্ট করুন

        console.log(`✅ Synced user: ${userData.email} (kept in pending list)`);
        
        if (window.showToast) {
          window.showToast(`✅ User "${userData.email}" synced successfully!`, 'success');
        }
      } catch (error) {
        console.error(`❌ Failed to sync user ${userData.email}:`, error);
        if (window.showToast) {
          window.showToast(`❌ Failed to sync user "${userData.email}"`, 'error');
        }
      }
    }
  };

  // ✅ পেন্ডিং ইউজার মুছুন (ঐচ্ছিক)
  const removePendingUser = (email) => {
    try {
      const pending = loadPendingUsers();
      const filtered = pending.filter(u => u.email !== email);
      localStorage.setItem('pendingUsers', JSON.stringify(filtered));
      console.log(`🗑️ Removed pending user: ${email}`);
      return true;
    } catch (error) {
      console.error('Error removing pending user:', error);
      return false;
    }
  };

  // ✅ ১. Register (Offline + Online)
  const register = async (name, email, password) => {
    console.log('📝 REGISTER FUNCTION CALLED!');
    console.log('📝 Name:', name, 'Email:', email);
    console.log('📡 Current online status:', navigator.onLine);
    
    try {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        console.log('✅ Online registration flow...');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const msg = '❌ This email is already registered. Please login.';
          if (window.showToast) window.showToast(msg, 'error');
          throw new Error(msg);
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await saveUserToFirestore(userCredential.user.uid, email, name, false);
        
        const msg = '✅ Registration successful! Please login.';
        if (window.showToast) window.showToast(msg, 'success');
        return userCredential.user;
      } else {
        // ✅ অফলাইন রেজিস্টার
        console.log('📦 OFFLINE REGISTRATION FLOW STARTED!');
        console.log('📦 Saving user offline:', { name, email });
        
        // 1. পেন্ডিং ইউজার লোড
        let pendingUsers = [];
        const saved = localStorage.getItem('pendingUsers');
        if (saved) {
          pendingUsers = JSON.parse(saved);
          console.log('📋 Loaded existing pending users:', pendingUsers);
        } else {
          console.log('📋 No existing pending users found.');
        }
        
        // 2. ইমেইল চেক
        const existing = pendingUsers.find(u => u.email === email);
        if (existing) {
          console.log('❌ Email already exists in pending list:', email);
          const msg = '❌ This email is already registered offline. Will sync when online.';
          if (window.showToast) window.showToast(msg, 'error');
          throw new Error(msg);
        }

        // 3. নতুন ইউজার তৈরি
        const userData = {
          name,
          email,
          password,
          isAdmin: false,
          createdAt: new Date().toISOString(),
          synced: false
        };
        console.log('📦 New user data:', userData);
        
        // 4. localStorage-এ সেভ
        pendingUsers.push(userData);
        localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
        console.log('✅ Pending user saved to localStorage!');
        console.log('📋 Updated pending users list:', pendingUsers);
        
        // 5. Offline সেশন তৈরি
        const offlineUser = {
          uid: `offline_${Date.now()}`,
          email: email,
          name: name,
          isAdmin: false,
          isOffline: true
        };
        setUser(offlineUser);
        localStorage.setItem('user', JSON.stringify(offlineUser));
        console.log('✅ Offline session created:', offlineUser);

        const msg = '📦 You are offline. Registration saved. Will sync when online.';
        if (window.showToast) window.showToast(msg, 'offline');
        return offlineUser;
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  };

  // ✅ ২. Login (Offline + Online)
  const login = async (email, password) => {
    console.log('🔑 LOGIN FUNCTION CALLED!');
    console.log('📡 Current online status:', navigator.onLine);
    
    try {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        console.log('✅ Online login flow...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const msg = '✅ Login successful!';
        if (window.showToast) window.showToast(msg, 'success');
        return userCredential.user;
      } else {
        console.log('📡 OFFLINE LOGIN FLOW STARTED!');
        
        // 1. পেন্ডিং ইউজার চেক
        let pendingUsers = [];
        const saved = localStorage.getItem('pendingUsers');
        if (saved) {
          pendingUsers = JSON.parse(saved);
          console.log('📋 Loaded pending users:', pendingUsers);
        }
        
        const pendingUser = pendingUsers.find(u => u.email === email && u.password === password);
        
        if (pendingUser) {
          console.log('✅ Pending user found:', pendingUser);
          const offlineUser = {
            uid: `offline_${Date.now()}`,
            email: pendingUser.email,
            name: pendingUser.name,
            isAdmin: false,
            isOffline: true
          };
          setUser(offlineUser);
          localStorage.setItem('user', JSON.stringify(offlineUser));
          
          // Offline Login রেকর্ড
          offlineTracker.recordOfflineLogin(offlineUser);
          
          const msg = '📡 You are offline. Logged in with saved data.';
          if (window.showToast) window.showToast(msg, 'offline');
          return offlineUser;
        }

        // 2. localStorage-এ সেভ করা ইউজার চেক
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.email === email) {
            console.log('✅ Found user in localStorage:', parsed);
            setUser(parsed);
            offlineTracker.recordOfflineLogin(parsed);
            const msg = '📡 Logged in from saved session.';
            if (window.showToast) window.showToast(msg, 'info');
            return parsed;
          }
        }

        console.log('❌ No offline user found for email:', email);
        const msg = '❌ No offline user found. Please connect to internet to login.';
        if (window.showToast) window.showToast(msg, 'error');
        throw new Error(msg);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  // ✅ ৩. Logout
  const logout = async () => {
    try {
      if (navigator.onLine) {
        await signOut(auth);
      }
      setUser(null);
      localStorage.removeItem('user');
      const msg = '👋 Logged out successfully.';
      if (window.showToast) window.showToast(msg, 'info');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // ✅ ৪. Auth State চেক
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          isAdmin: firebaseUser.email === 'admin@example.com'
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.isOffline) {
            setUser(parsed);
          } else {
            setUser(null);
            localStorage.removeItem('user');
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ ৫. সব ইউজার লোড
  const loadAllUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersList = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return usersList;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  };

  // ✅ ৬. Admin Stats লোড
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
    isOnline,
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