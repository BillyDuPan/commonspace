import { collection, getDocs, doc, updateDoc, query, where, Timestamp, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Booking } from '../../types';
import { emailService } from '../emailService';
import { venueService } from './venues';
import { userService } from './users';

export const bookingService = {
  async getBookings(filters?: { 
    venueId?: string;
    userId?: string;
    status?: 'pending' | 'confirmed' | 'cancelled';
    date?: string;
  }): Promise<Booking[]> {
    const constraints = [];
    
    if (filters?.venueId) {
      constraints.push(where('venueId', '==', filters.venueId));
    }
    if (filters?.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.date) {
      constraints.push(where('date', '==', filters.date));
    }

    const q = query(collection(db, 'bookings'), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Booking[];
  },

  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const booking = {
      ...bookingData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const bookingRef = await addDoc(collection(db, 'bookings'), booking);
    
    try {
      // Send booking confirmation email
      const user = await userService.getUserById(booking.userId);
      const venue = await venueService.getVenueById(booking.venueId);
      
      // Find the package info
      const packageInfo = venue?.packages.find(p => p.id === booking.packageId);
      
      if (user && venue && packageInfo) {
        // Add the ID to the booking object for the email
        const bookingWithId = { ...booking, id: bookingRef.id } as Booking;
        await emailService.sendBookingConfirmation(bookingWithId, user, venue, packageInfo);
      }
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      // We don't throw here to prevent the booking creation from failing
    }
    
    return bookingRef.id;
  },

  async updateBookingStatus(
    bookingId: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress' | 'no_show'
  ): Promise<void> {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status,
      statusUpdatedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    try {
      // Send booking status update email
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (bookingDoc.exists()) {
        const booking = { id: bookingId, ...bookingDoc.data() } as Booking;
        const user = await userService.getUserById(booking.userId);
        const venue = await venueService.getVenueById(booking.venueId);
        
        if (user && venue) {
          await emailService.sendBookingStatusUpdate(booking, user, venue);
        }
      }
    } catch (error) {
      console.error('Failed to send booking status update email:', error);
    }
  },

  async checkAndUpdateBookingStatuses(): Promise<void> {
    const now = new Date();
    const bookings = await this.getBookings();
    
    // Get bookings with dates in the next 24 hours for reminders
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];
    
    // Get all bookings for tomorrow that are confirmed
    const tomorrowBookings = bookings.filter(b => 
      new Date(b.date.seconds * 1000).toLocaleDateString() === tomorrowDateString && 
      b.status === 'confirmed'
    );
    
    // Send booking reminders for tomorrow's bookings
    for (const booking of tomorrowBookings) {
      try {
        const user = await userService.getUserById(booking.userId);
        const venue = await venueService.getVenueById(booking.venueId);
        
        if (user && venue) {
          await emailService.sendBookingReminder(booking, user, venue);
        }
      } catch (error) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, error);
      }
    }
    
    // Send feedback requests for completed bookings
    const justCompletedBookings = bookings.filter(booking => {
      // Only send feedback for bookings that were completed in the last hour
      if (booking.status !== 'completed') return false;
      
      // Skip if statusUpdatedAt is undefined
      if (!booking.statusUpdatedAt) return false;
      
      const statusUpdatedAt = new Date(booking.statusUpdatedAt.seconds * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      return statusUpdatedAt >= oneHourAgo && statusUpdatedAt <= now;
    });
    
    for (const booking of justCompletedBookings) {
      try {
        const user = await userService.getUserById(booking.userId);
        const venue = await venueService.getVenueById(booking.venueId);
        
        if (user && venue) {
          await emailService.sendFeedbackRequest(booking, user, venue);
        }
      } catch (error) {
        console.error(`Failed to send feedback request for booking ${booking.id}:`, error);
      }
    }
    
    // Continue with existing status updates
    for (const booking of bookings) {
      const bookingStartTime = new Date(`${booking.date}T${booking.time}`);
      const bookingEndTime = new Date(bookingStartTime.getTime() + booking.duration * 60 * 60 * 1000);
      
      // Convert booking times to timestamps for comparison
      const startTimestamp = bookingStartTime.getTime();
      const endTimestamp = bookingEndTime.getTime();
      const currentTimestamp = now.getTime();
      
      // Define grace periods (in milliseconds)
      const NO_SHOW_GRACE_PERIOD = 30 * 60 * 1000; // 30 minutes
      
      switch (booking.status) {
        case 'confirmed':
          // Check if booking should be marked as in_progress
          if (currentTimestamp >= startTimestamp && currentTimestamp < endTimestamp) {
            await this.updateBookingStatus(booking.id, 'in_progress');
          }
          // Check if booking should be marked as no_show
          else if (currentTimestamp >= startTimestamp + NO_SHOW_GRACE_PERIOD && currentTimestamp < endTimestamp) {
            await this.updateBookingStatus(booking.id, 'no_show');
          }
          break;
          
        case 'in_progress':
          // Check if booking should be marked as completed
          if (currentTimestamp >= endTimestamp) {
            await this.updateBookingStatus(booking.id, 'completed');
          }
          break;
      }
    }
  },

  async isTimeSlotAvailable(
    venueId: string,
    date: string,
    time: string,
    duration: number,
    venueCapacity: number
  ): Promise<boolean> {
    const bookings = await this.getBookings({
      venueId,
      date
    });

    // Only consider confirmed and in_progress bookings when checking availability
    const activeBookings = bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'in_progress'
    );

    const requestedStartTime = new Date(`${date}T${time}`);
    const requestedEndTime = new Date(requestedStartTime.getTime() + duration * 60 * 60 * 1000);

    let maxOverlap = 0;
    for (let currentTime = requestedStartTime; currentTime < requestedEndTime; currentTime.setMinutes(currentTime.getMinutes() + 30)) {
      let currentOverlap = 0;
      
      activeBookings.forEach(booking => {
        const bookingStart = new Date(`${booking.date}T${booking.time}`);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60 * 60 * 1000);
        
        if (currentTime >= bookingStart && currentTime < bookingEnd) {
          currentOverlap++;
        }
      });

      maxOverlap = Math.max(maxOverlap, currentOverlap);
    }

    return maxOverlap < venueCapacity;
  }
}; 