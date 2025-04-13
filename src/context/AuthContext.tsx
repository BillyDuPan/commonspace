import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        let role: UserRole = 'user';
        
        // Check for superadmin email
        if (firebaseUser.email === 'pearsonbilly48@gmail.com') {
          role = 'superadmin';
        } else if (userDoc.exists() && userDoc.data().role === 'admin') {
          role = 'admin';
        }

        if (userDoc.exists()) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            name: userDoc.data().name || firebaseUser.displayName || '',
            role: role,
            favorites: userDoc.data().favorites || [],
          });
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || '',
            role: role,
            favorites: [],
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 