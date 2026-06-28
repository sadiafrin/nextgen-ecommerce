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
import { 
  doc, setDoc, getDoc, updateDoc, increment, 
  collection, getDocs, query, where, 
  writeBatch, serverTimestamp 
} from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ✅ পেন্ডিং ইউজার লোড
  const loadPendingUsers = () => {
    try {
      const data = localStorage.getItem('pendingUsers');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error loading pending users:', error);
      return [];
    }
  };

  // ✅ ইউজার ডেটা ফায়ারস্টোরে সেভ (Error Handling সহ)
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
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          loginCount: 1,
          isNewCustomer: true
        });
        
        // ✅ অ্যাডমিন স্ট্যাটস আপডেট (যদি থাকে)
        try {
          const statsRef = doc(db, 'adminStats', 'stats');
          const statsSnap = await getDoc(statsRef);
          if (statsSnap.exists()) {
            await updateDoc(statsRef, {
              newCustomers: increment(1),
              totalLogins: increment(1)
            });
          }
        } catch (statsError) {
          console.warn('⚠️ Admin stats update skipped:', statsError.message);
        }
      } else {
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          loginCount: increment(1)
        });
        
        try {
          const statsRef = doc(db, 'adminStats', 'stats');
          const statsSnap = await getDoc(statsRef);
          if (statsSnap.exists()) {
            await updateDoc(statsRef, {
              totalLogins: increment(1)
            });
          }
        } catch (statsError) {
          console.warn('⚠️ Admin stats update skipped:', statsError.message);
        }
      }
      console.log('✅ User saved to Firestore:', email);
      return true;
    } catch (error) {
      console.error('❌ Error saving user to Firestore:', error);
      
      // 🔥 Permission Error হলে অফলাইন মোডে সেভ
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Permission denied! Saving user offline...');
        // অফলাইন ইউজার হিসেবে সেভ
        const offlineUser = {
          uid: uid,
          email: email,
          name: name,
          isAdmin: isAdmin,
          isOffline: true,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('offlineUser_' + uid, JSON.stringify(offlineUser));
        return false;
      }
      throw error;
    }
  };

  // ✅ Offline/Online ইভেন্ট
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Online event triggered');
      setIsOnline(true);
      syncPendingUsers();
      window.dispatchEvent(new CustomEvent('onlineStatusChanged', { detail: { isOnline: true } }));
    };
    
    const handleOffline = () => {
      console.log('📡 Offline event triggered');
      setIsOnline(false);
      window.dispatchEvent(new CustomEvent('onlineStatusChanged', { detail: { isOnline: false } }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    window.dispatchEvent(new CustomEvent('onlineStatusChanged', { 
      detail: { isOnline: navigator.onLine } 
    }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ পেন্ডিং ইউজার সিঙ্ক (আপডেটেড)
  const syncPendingUsers = async () => {
    if (!isOnline) return;

    const pending = loadPendingUsers();
    if (pending.length === 0) return;

    console.log(`🔄 Syncing ${pending.length} pending users...`);

    for (const userData of pending) {
      try {
        // ✅ চেক করুন ইমেইল আগে থেকে Firebase এ আছে কিনা
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userData.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`⚠️ User ${userData.email} already exists in Firebase, skipping...`);
          const pendingUsers = loadPendingUsers();
          const filtered = pendingUsers.filter(u => u.email !== userData.email);
          localStorage.setItem('pendingUsers', JSON.stringify(filtered));
          continue;
        }

        // ✅ Firebase Auth-এ ইউজার তৈরি করুন
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

        // ✅ সিঙ্ক成功后 পেন্ডিং থেকে রিমুভ
        const pendingUsers = loadPendingUsers();
        const filtered = pendingUsers.filter(u => u.email !== userData.email);
        localStorage.setItem('pendingUsers', JSON.stringify(filtered));

        console.log(`✅ Synced user: ${userData.email}`);
        
        if (window.showToast) {
          window.showToast(`✅ User "${userData.email}" synced successfully!`, 'success');
        }
      } catch (error) {
        console.error(`❌ Failed to sync user ${userData.email}:`, error);
        if (error.code === 'permission-denied') {
          console.warn('⚠️ Permission denied, keeping user in pending list');
        }
        if (window.showToast) {
          window.showToast(`❌ Failed to sync user "${userData.email}"`, 'error');
        }
      }
    }
  };

  // ✅ ১. Register (Offline + Online) - সম্পূর্ণ আপডেটেড
  const register = async (email, password, name) => {
    console.log('📝 REGISTER FUNCTION CALLED!');
    console.log('📝 Name:', name, 'Email:', email);
    console.log('📡 Current online status:', navigator.onLine);
    setAuthError(null);
    
    try {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        console.log('✅ Online registration flow...');
        
        try {
          // ✅ চেক করুন ইমেইল আগে থেকে আছে কিনা
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const msg = '❌ This email is already registered. Please login.';
            if (window.showToast) window.showToast(msg, 'error');
            throw new Error(msg);
          }

          // ✅ Firebase Auth-এ ইউজার তৈরি করুন
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: name });
          
          // ✅ Firestore-এ ইউজার সেভ করুন
          try {
            await saveUserToFirestore(userCredential.user.uid, email, name, false);
          } catch (firestoreError) {
            console.warn('⚠️ Firestore save failed but auth successful:', firestoreError.message);
            // Firestore এ সেভ না হলেও Auth তো কাজ করছে
          }
          
          // ✅ ইউজার সেট করুন
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: name,
            isAdmin: false
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          const msg = '✅ Registration successful! Welcome!';
          if (window.showToast) window.showToast(msg, 'success');
          
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: userData } }));
          
          return userCredential.user;
          
        } catch (authError) {
          console.error('❌ Firebase Auth error:', authError);
          
          // 🔥 Firebase Auth error হলে অফলাইন মোডে ফলব্যাক
          if (authError.code === 'auth/network-request-failed' || 
              authError.code === 'auth/too-many-requests' ||
              authError.code === 'auth/internal-error' ||
              authError.code === 'auth/operation-not-allowed') {
            console.log('📡 Switching to offline mode...');
            
            // অফলাইন রেজিস্টার
            const offlineUser = {
              uid: `offline_${Date.now()}`,
              email: email,
              name: name,
              isAdmin: false,
              isOffline: true
            };
            
            let pendingUsers = loadPendingUsers();
            // চেক করুন ইমেইল আগে থেকে পেন্ডিং লিস্টে আছে কিনা
            const existing = pendingUsers.find(u => u.email === email);
            if (!existing) {
              pendingUsers.push({ name, email, password, isAdmin: false });
              localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
            }
            
            setUser(offlineUser);
            localStorage.setItem('user', JSON.stringify(offlineUser));
            
            const msg = '📦 Network issue. Registration saved offline.';
            if (window.showToast) window.showToast(msg, 'offline');
            
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: offlineUser } }));
            
            return offlineUser;
          }
          
          throw authError;
        }
        
      } else {
        // ✅✅✅ অফলাইন রেজিস্টার
        console.log('📦 OFFLINE REGISTRATION FLOW STARTED!');
        
        let pendingUsers = loadPendingUsers();
        
        // চেক করুন ইমেইল আগে থেকে আছে কিনা
        const existing = pendingUsers.find(u => u.email === email);
        if (existing) {
          console.log('❌ Email already exists in pending list:', email);
          const msg = '❌ This email is already registered offline.';
          if (window.showToast) window.showToast(msg, 'error');
          throw new Error(msg);
        }

        // অফলাইন ইউজার তৈরি করুন
        const userData = {
          name: name,
          email: email,
          password: password,
          isAdmin: false,
          createdAt: new Date().toISOString(),
          synced: false
        };
        console.log('📦 New offline user data:', userData);
        
        // localStorage-এ সেভ করুন
        pendingUsers.push(userData);
        localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
        console.log('✅ Offline user saved to localStorage!');
        
        // Offline সেশন তৈরি করুন
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
        
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: offlineUser } }));
        
        return offlineUser;
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  // ✅ ২. Login (Offline + Online) - সম্পূর্ণ আপডেটেড
  const login = async (email, password) => {
    console.log('🔑 LOGIN FUNCTION CALLED!');
    console.log('📡 Current online status:', navigator.onLine);
    setAuthError(null);
    
    try {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        console.log('✅ Online login flow...');
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // ✅ ইউজার ডেটা সেট করুন
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
            isAdmin: userCredential.user.email === 'admin@example.com'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Firestore আপডেট করার চেষ্টা করুন
          try {
            await saveUserToFirestore(userData.uid, userData.email, userData.name, userData.isAdmin);
          } catch (firestoreError) {
            console.warn('⚠️ Firestore update skipped:', firestoreError.message);
          }
          
          const msg = '✅ Login successful!';
          if (window.showToast) window.showToast(msg, 'success');
          
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: userData } }));
          
          return userCredential.user;
          
        } catch (authError) {
          console.error('❌ Firebase Auth login error:', authError);
          
          // 🔥 Auth error হলে অফলাইন চেক করুন
          if (authError.code === 'auth/user-not-found' || 
              authError.code === 'auth/wrong-password' ||
              authError.code === 'auth/too-many-requests') {
            
            // অফলাইন ইউজার চেক করুন
            const pendingUsers = loadPendingUsers();
            const pendingUser = pendingUsers.find(u => u.email === email && u.password === password);
            
            if (pendingUser) {
              console.log('✅ Found pending user, logging in offline mode');
              const offlineUser = {
                uid: `offline_${Date.now()}`,
                email: pendingUser.email,
                name: pendingUser.name,
                isAdmin: false,
                isOffline: true
              };
              setUser(offlineUser);
              localStorage.setItem('user', JSON.stringify(offlineUser));
              
              const msg = '📡 Logged in with offline account. Please sync when online.';
              if (window.showToast) window.showToast(msg, 'offline');
              
              window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: offlineUser } }));
              
              return offlineUser;
            }
          }
          
          throw authError;
        }
      } else {
        // 📡 অফলাইন লগইন
        console.log('📡 OFFLINE LOGIN FLOW STARTED!');
        
        // 1. পেন্ডিং ইউজার চেক
        const pendingUsers = loadPendingUsers();
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
          
          const msg = '📡 You are offline. Logged in with saved data.';
          if (window.showToast) window.showToast(msg, 'offline');
          
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: offlineUser } }));
          
          return offlineUser;
        }

        // 2. localStorage-এ সেভ করা ইউজার চেক
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.email === email) {
            console.log('✅ Found user in localStorage:', parsed);
            setUser(parsed);
            const msg = '📡 Logged in from saved session.';
            if (window.showToast) window.showToast(msg, 'info');
            
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: parsed } }));
            
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
      setAuthError(error.message);
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
      
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      
      const msg = '👋 Logged out successfully.';
      if (window.showToast) window.showToast(msg, 'info');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // ✅ ৪. Auth State চেক (আপডেটেড)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.email || 'No user');
      
      try {
        if (firebaseUser) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            isAdmin: firebaseUser.email === 'admin@example.com'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setAuthInitialized(true);
          
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: userData } }));
        } else {
          // ✅ অফলাইন ইউজার চেক করুন
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed.isOffline) {
              console.log('📡 Using offline user:', parsed);
              setUser(parsed);
              setAuthInitialized(true);
              window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: parsed } }));
            } else {
              setUser(null);
              localStorage.removeItem('user');
              setAuthInitialized(true);
            }
          } else {
            setUser(null);
            setAuthInitialized(true);
          }
        }
      } catch (error) {
        console.error('❌ Auth state error:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
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

  // ✅ ৭. পেন্ডিং ইউজার পেতে
  const getPendingUsers = () => {
    return loadPendingUsers();
  };

  // ✅ ৮. অফলাইন ইউজার চেক
  const hasOfflineUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.isOffline || false;
    }
    return false;
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
    getPendingUsers,
    isAdmin: user?.isAdmin || false,
    isAuthenticated: !!user,
    authInitialized,
    authError,
    hasOfflineUser,
    syncPendingUsers
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
    throw new Error('❌ useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;