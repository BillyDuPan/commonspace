import { User, Venue } from '../../types';

export function filterUsers(users: User[], searchTerm: string): User[] {
  if (!searchTerm) {
    return users;
  }
  const lowerSearchTerm = searchTerm.toLowerCase();
  return users.filter(user =>
    (user.name?.toLowerCase() || '').includes(lowerSearchTerm) ||
    (user.email?.toLowerCase() || '').includes(lowerSearchTerm)
  );
}

export function filterVenues(venues: Venue[], searchTerm: string): Venue[] {
  if (!searchTerm) {
    return venues;
  }
  const lowerSearchTerm = searchTerm.toLowerCase();
  return venues.filter(venue =>
    (venue.name?.toLowerCase() || '').includes(lowerSearchTerm) ||
    (venue.location?.toLowerCase() || '').includes(lowerSearchTerm)
  );
}