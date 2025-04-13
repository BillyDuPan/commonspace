import { User } from '../types';

export const isVenue = (user: User | null): boolean => {
  return user?.role === 'venue';
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'superadmin';
};

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === 'superadmin';
};

export const canManageVenues = (user: User | null): boolean => {
  return isAdmin(user) || isVenue(user);
};

export const canManageBookings = (user: User | null, venueId?: string): boolean => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isVenue(user) && venueId) {
    // Check if the user is the owner of the venue
    // This should be implemented based on your data structure
    return true; // Placeholder - implement actual check
  }
  return false;
}; 