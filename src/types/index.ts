export interface User {
  id: string;
  uid: string; // Required for Firebase auth
  email: string;
  name: string;
  role: 'user' | 'venue' | 'admin' | 'superadmin';
  photoURL?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  description: string;
  price: number;
  duration: number;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  location: string;
  type: 'cafe' | 'cowork';
  status: 'active' | 'inactive';
  photos?: string[];
  rating?: number;
  priceRange: '$' | '$$' | '$$$';
  capacity: number;
  openingHours: OpeningHours;
  packages: Package[];
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  venueId: string;
  venueName: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  date: { // Changed to Timestamp
    seconds: number;
    nanoseconds: number;
  };
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress' | 'no_show';
  statusUpdatedAt: { // Made required
    seconds: number;
    nanoseconds: number;
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
} 