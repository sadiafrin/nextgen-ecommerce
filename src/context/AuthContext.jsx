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
  writeBatch, serverTimestamp, addDoc, deleteDoc 
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

  // ✅ Offline User Save
  const saveOfflineUser = (email, password, name) => {
    try {
      let pendingUsers = loadPendingUsers();
      
      const existing = pendingUsers.find(u => u.email === email);
      if (existing) {
        throw new Error('This email is already registered offline.');
      }
      
      pendingUsers.push({ name, email, password, isAdmin: false, synced: false });
      localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
      
      const offlineUser = {
        uid: `offline_${Date.now()}`,
        email: email,
        name: name,
        isAdmin: false,
        isOffline: true
      };
      
      localStorage.setItem('user', JSON.stringify(offlineUser));
      console.log('✅ Offline user saved:', email);
      return offlineUser;
    } catch (error) {
      console.error('❌ Offline user save error:', error);
      throw error;
    }
  };

  // ✅ Load Offline User
  const loadOfflineUser = () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.isOffline) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading offline user:', error);
      return null;
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
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          loginCount: 1,
          isNewCustomer: true,
          registeredFrom: 'online'
        });
        
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
      
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Permission denied! Saving user offline...');
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

  // ✅ Sync Offline Users to Firebase (Cross-Device)
  const syncPendingUsers = async () => {
    if (!isOnline) {
      console.log('📡 Offline, skipping user sync');
      return;
    }

    const pending = loadPendingUsers();
    if (pending.length === 0) {
      console.log('📦 No pending users to sync');
      return;
    }

    console.log(`🔄 Syncing ${pending.length} pending users to Firebase...`);

    const pendingToRemove = [];

    for (const userData of pending) {
      try {
        // Check if email already exists in Firebase
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userData.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`⚠️ User ${userData.email} already exists in Firebase, skipping...`);
          pendingToRemove.push(userData.email);
          continue;
        }

        // Create user in Firebase Auth
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

        // ✅ Update stats
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
          console.warn('⚠️ Stats update failed:', statsError.message);
        }

        pendingToRemove.push(userData.email);
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

    // Remove synced users from pending
    if (pendingToRemove.length > 0) {
      const updatedPending = pending.filter(u => !pendingToRemove.includes(u.email));
      localStorage.setItem('pendingUsers', JSON.stringify(updatedPending));
      console.log(`✅ Removed ${pendingToRemove.length} synced users from pending`);
    }
  };

  // ✅ Sync Offline Orders to Firebase (Cross-Device)
  const syncOfflineOrders = async (userId) => {
    if (!isOnline) {
      console.log('📡 Offline, skipping order sync');
      return;
    }

    try {
      const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      if (pendingOrders.length === 0) {
        console.log('📦 No pending orders to sync');
        return;
      }

      console.log(`🔄 Syncing ${pendingOrders.length} pending orders to Firebase...`);

      let syncedCount = 0;
      const ordersToRemove = [];

      for (const order of pendingOrders) {
        try {
          // Check if order already exists in Firebase
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('orderId', '==', order.id));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log(`⚠️ Order ${order.id} already exists in Firebase, skipping...`);
            ordersToRemove.push(order.id);
            continue;
          }

          // Save to Firebase
          const orderData = {
            ...order,
            customerId: userId || order.customerId || 'guest',
            customerEmail: order.customerEmail || 'guest@email.com',
            customerName: order.customerName || 'Guest',
            syncedAt: serverTimestamp(),
            isOffline: true,
            synced: true,
            syncedFrom: 'offline'
          };

          const { id, ...orderWithoutId } = orderData;
          await addDoc(collection(db, 'orders'), orderWithoutId);
          
          ordersToRemove.push(order.id);
          syncedCount++;
          console.log(`✅ Synced order: ${order.id}`);
        } catch (error) {
          console.error(`❌ Failed to sync order ${order.id}:`, error);
        }
      }

      // Remove synced orders from pending
      if (ordersToRemove.length > 0) {
        const updatedOrders = pendingOrders.filter(o => !ordersToRemove.includes(o.id));
        localStorage.setItem('pendingOrders', JSON.stringify(updatedOrders));
        console.log(`✅ Removed ${ordersToRemove.length} synced orders from pending`);
      }

      // Update admin stats
      if (syncedCount > 0) {
        try {
          const statsRef = doc(db, 'adminStats', 'stats');
          const statsSnap = await getDoc(statsRef);
          if (statsSnap.exists()) {
            await updateDoc(statsRef, {
              totalOrders: increment(syncedCount),
              totalLogins: increment(1)
            });
          }
        } catch (statsError) {
          console.warn('⚠️ Stats update failed:', statsError.message);
        }
      }

      if (window.showToast && syncedCount > 0) {
        window.showToast(`✅ ${syncedCount} orders synced successfully!`, 'success');
      }
    } catch (error) {
      console.error('❌ Error syncing offline orders:', error);
    }
  };

  // ✅ ১. Register (Offline + Online + Cross-Device) - Offline Log যোগ করা হয়েছে
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
          // Check if email already exists
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const msg = '❌ This email is already registered. Please login.';
            if (window.showToast) window.showToast(msg, 'error');
            throw new Error(msg);
          }

          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: name });
          
          // Save to Firestore
          try {
            await saveUserToFirestore(userCredential.user.uid, email, name, false);
          } catch (firestoreError) {
            console.warn('⚠️ Firestore save failed but auth successful:', firestoreError.message);
          }
          
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: name,
            isAdmin: false
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // ✅ Sync offline orders from this device
          await syncOfflineOrders(userCredential.user.uid);
          
          const msg = '✅ Registration successful! Welcome!';
          if (window.showToast) window.showToast(msg, 'success');
          
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: userData } }));
          return userCredential.user;
          
        } catch (authError) {
          console.error('❌ Firebase Auth error:', authError);
          
          // Fallback to offline mode
          if (authError.code === 'auth/network-request-failed' || 
              authError.code === 'auth/too-many-requests' ||
              authError.code === 'auth/internal-error' ||
              authError.code === 'auth/operation-not-allowed') {
            console.log('📡 Switching to offline mode...');
            
            const offlineUser = saveOfflineUser(email, password, name);
            setUser(offlineUser);
            
            const msg = '📦 Network issue. Registration saved offline.';
            if (window.showToast) window.showToast(msg, 'offline');
            
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: offlineUser } }));
            return offlineUser;
          }
          
          throw authError;
        }
        
      } else {
        // 📦 Offline Register with Log
        console.log('📦 OFFLINE REGISTRATION FLOW STARTED!');
        
        const offlineUser = saveOfflineUser(email, password, name);
        setUser(offlineUser);
        
        // ✅ Offline Registration Log (NEW)
        try {
          const offlineLogs = JSON.parse(localStorage.getItem('offlineLogs') || '{"registered":0,"logins":0,"orders":0}');
          offlineLogs.registered += 1;
          localStorage.setItem('offlineLogs', JSON.stringify(offlineLogs));
          console.log('📊 Offline Registration Logged:', offlineLogs);
        } catch (logError) {
          console.error('❌ Error logging offline registration:', logError);
        }
        
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

  // ✅ ২. Login (Offline + Online + Cross-Device) - Offline Log যোগ করা হয়েছে
  const login = async (email, password) => {
    console.log('🔑 LOGIN FUNCTION CALLED!');
    console.log('📡 Current online status:', navigator.onLine);
    console.log('📧 Email:', email);
    setAuthError(null);
    
    try {
      const isOnline = navigator.onLine;
      
      // ✅ STEP 1: Always check localStorage first (for any saved user)
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.email === email) {
            console.log('✅ Found user in localStorage:', parsed);
            setUser(parsed);
            const msg = '📡 Logged in from saved session.';
            if (window.showToast) window.showToast(msg, 'info');
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: parsed } }));
            return parsed;
          }
        } catch (e) {
          console.warn('⚠️ Error parsing saved user:', e);
        }
      }
      
      // ✅ STEP 2: Check pending users (offline registered)
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
        
        // ✅ Offline Login Log (NEW)
        try {
          const offlineLogs = JSON.parse(localStorage.getItem('offlineLogs') || '{"registered":0,"logins":0,"orders":0}');
          offlineLogs.logins += 1;
          localStorage.setItem('offlineLogs', JSON.stringify(offlineLogs));
          console.log('📊 Offline Login Logged:', offlineLogs);
        } catch (logError) {
          console.error('❌ Error logging offline login:', logError);
        }
        
        const msg = '📡 Offline login successful! Will sync when online.';
        if (window.showToast) window.showToast(msg, 'offline');
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: offlineUser } }));
        return offlineUser;
      }
      
      // ✅ STEP 3: If offline and no user found
      if (!isOnline) {
        console.log('❌ No offline user found for email:', email);
        const msg = '❌ No offline user found. Please register first or connect to internet.';
        if (window.showToast) window.showToast(msg, 'error');
        throw new Error(msg);
      }
      
      // ✅ STEP 4: Online login attempt
      console.log('✅ Online login flow...');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
          isAdmin: userCredential.user.email === 'admin@example.com'
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // ✅ Update Firestore
        try {
          await saveUserToFirestore(userData.uid, userData.email, userData.name, userData.isAdmin);
        } catch (firestoreError) {
          console.warn('⚠️ Firestore update skipped:', firestoreError.message);
        }
        
        // ✅ Sync offline orders
        await syncOfflineOrders(userData.uid);
        await syncPendingUsers();
        
        const msg = '✅ Login successful!';
        if (window.showToast) window.showToast(msg, 'success');
        
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: userData } }));
        return userCredential.user;
        
      } catch (authError) {
        console.error('❌ Firebase Auth login error:', authError);
        
        // ✅ STEP 5: Fallback - try pending users again (for network error)
        if (authError.code === 'auth/network-request-failed' || 
            authError.code === 'auth/user-not-found' || 
            authError.code === 'auth/wrong-password' ||
            authError.code === 'auth/too-many-requests') {
          
          // Check pending users again
          const pendingUsersRetry = loadPendingUsers();
          const pendingUserRetry = pendingUsersRetry.find(u => u.email === email && u.password === password);
          
          if (pendingUserRetry) {
            console.log('✅ Fallback: Pending user found after auth failure:', pendingUserRetry);
            const offlineUser = {
              uid: `offline_${Date.now()}`,
              email: pendingUserRetry.email,
              name: pendingUserRetry.name,
              isAdmin: false,
              isOffline: true
            };
            setUser(offlineUser);
            localStorage.setItem('user', JSON.stringify(offlineUser));
            
            // ✅ Offline Login Log (NEW)
            try {
              const offlineLogs = JSON.parse(localStorage.getItem('offlineLogs') || '{"registered":0,"logins":0,"orders":0}');
              offlineLogs.logins += 1;
              localStorage.setItem('offlineLogs', JSON.stringify(offlineLogs));
              console.log('📊 Offline Login Logged (fallback):', offlineLogs);
            } catch (logError) {
              console.error('❌ Error logging offline login:', logError);
            }
            
            const msg = '📡 Logged in with offline account (network fallback).';
            if (window.showToast) window.showToast(msg, 'offline');
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: offlineUser } }));
            return offlineUser;
          }
        }
        
        throw authError;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setAuthError(error.message);
      if (window.showToast) {
        window.showToast(error.message, 'error');
      }
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

  // ✅ ৪. Auth State Check
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
          
          // ✅ Sync offline data when auth changes
          if (navigator.onLine) {
            await syncOfflineOrders(userData.uid);
            await syncPendingUsers();
          }
          
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: userData } }));
        } else {
          // ✅ Check for offline user
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed.isOffline) {
                console.log('📡 Using offline user from localStorage:', parsed);
                setUser(parsed);
                setAuthInitialized(true);
                window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user: parsed } }));
              } else {
                setUser(null);
                setAuthInitialized(true);
              }
            } catch (e) {
              console.warn('⚠️ Error parsing user from localStorage:', e);
              setUser(null);
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

  // ✅ ৫. Online/Offline Event Listeners
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Online! Syncing all offline data...');
      setIsOnline(true);
      
      // Sync everything
      await syncPendingUsers();
      if (user) {
        await syncOfflineOrders(user.uid);
      }
      
      window.dispatchEvent(new CustomEvent('onlineStatusChanged', { detail: { isOnline: true } }));
    };
    
    const handleOffline = () => {
      console.log('📡 Offline');
      setIsOnline(false);
      window.dispatchEvent(new CustomEvent('onlineStatusChanged', { detail: { isOnline: false } }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // ✅ ৬. সব ইউজার লোড
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

  // ✅ ৭. Admin Stats লোড
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

  // ✅ ৮. পেন্ডিং ইউজার পেতে
  const getPendingUsers = () => {
    return loadPendingUsers();
  };

  // ✅ ৯. অফলাইন ইউজার চেক
  const hasOfflineUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.isOffline || false;
    }
    return false;
  };

  // ✅ ১০. Clear Pending Users (Admin)
  const clearPendingUsers = () => {
    localStorage.removeItem('pendingUsers');
    console.log('🗑️ Pending users cleared');
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
    clearPendingUsers,
    isAdmin: user?.isAdmin || false,
    isAuthenticated: !!user,
    authInitialized,
    authError,
    hasOfflineUser,
    syncPendingUsers,
    syncOfflineOrders
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