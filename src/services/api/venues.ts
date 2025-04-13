import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Venue } from '../../types';

export const venueService = {
  async getVenues(): Promise<Venue[]> {
    const snapshot = await getDocs(collection(db, 'venues'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Venue[];
  },

  async getVenueById(id: string): Promise<Venue | null> {
    const venueDoc = await getDoc(doc(db, 'venues', id));
    if (!venueDoc.exists()) return null;
    return { id: venueDoc.id, ...venueDoc.data() } as Venue;
  },

  async updateVenueStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
    await updateDoc(doc(db, 'venues', id), { 
      status,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteVenue(id: string): Promise<void> {
    await deleteDoc(doc(db, 'venues', id));
  },

  async createVenue(venue: Omit<Venue, 'id'>): Promise<string> {
    const venueRef = doc(collection(db, 'venues'));
    await setDoc(venueRef, {
      ...venue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return venueRef.id;
  },

  async updateVenue(id: string, venue: Partial<Venue>): Promise<void> {
    await updateDoc(doc(db, 'venues', id), {
      ...venue,
      updatedAt: new Date().toISOString()
    });
  },

  async uploadVenueImage(venueId: string, file: File): Promise<string> {
    const imageRef = ref(storage, `venues/${venueId}/${file.name}`);
    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  }
}; 