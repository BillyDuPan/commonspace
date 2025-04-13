export type UserRole = 'superadmin' | 'admin' | 'user';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  favorites?: string[];
  photoURL?: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  adminId: string;
  status: 'active' | 'inactive';
  type: string;
  priceRange?: string;
  photos: string[];
  packages: Package[];
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  capacity: number; // Maximum number of concurrent bookings
  rating?: number; // Average rating of the venue
}

export interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
  };
}

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: number; // in hours
  description: string;
}

export interface Booking {
  id: string;
  venueId: string;
  userId: string;
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  packageId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
} 