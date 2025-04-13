import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  impersonatedUser: User | null;
  impersonateUser: (userId: string) => Promise<void>;
  stopImpersonating: () => void;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  impersonatedUser: null,
  impersonateUser: async () => {},
  stopImpersonating: () => {},
  isImpersonating: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setImpersonatedUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const impersonateUser = async (userId: string) => {
    try {
      // Only allow superadmins to impersonate
      if (user?.role !== 'superadmin') {
        throw new Error('Only superadmins can impersonate users');
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = {
        id: userDoc.id,
        ...userDoc.data()
      } as User;

      // Store original user data in localStorage to persist through refreshes
      localStorage.setItem('originalUser', JSON.stringify(user));
      setImpersonatedUser(userData);

      console.log(`Impersonating user: ${userData.name} (${userData.role})`);
    } catch (error) {
      console.error('Error impersonating user:', error);
      throw error;
    }
  };

  const stopImpersonating = () => {
    const originalUserData = localStorage.getItem('originalUser');
    if (originalUserData) {
      setImpersonatedUser(null);
      localStorage.removeItem('originalUser');
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Check for stored impersonation first
          const originalUserData = localStorage.getItem('originalUser');
          if (originalUserData) {
            const originalUser = JSON.parse(originalUserData) as User;
            setUser(originalUser);
          }

          // Fetch additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          // Initialize user data
          let userData: User = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: 'user', // Default role
            photoURL: firebaseUser.photoURL || undefined
          };

          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            userData = {
              ...userData,
              uid: firebaseUser.uid,
              name: firestoreData.name || userData.name,
              role: firestoreData.role || userData.role,
              photoURL: firestoreData.photoURL || userData.photoURL
            };
          }

          console.log('Setting user data:', userData);

          if (!originalUserData) {
            setUser(userData);
          }
        } else {
          setUser(null);
          setImpersonatedUser(null);
          localStorage.removeItem('originalUser');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
        setImpersonatedUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    user: impersonatedUser || user,
    loading,
    signOut,
    impersonatedUser,
    impersonateUser,
    stopImpersonating,
    isImpersonating: !!impersonatedUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 