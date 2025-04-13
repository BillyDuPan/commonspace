import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  },

  async getUserById(id: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', id));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() } as User;
  },

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    await updateDoc(doc(db, 'users', userId), { 
      role,
      updatedAt: new Date().toISOString()
    });
  },

  async updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }
}; 