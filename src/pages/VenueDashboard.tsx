import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  venueId: string;
  venueName: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: { seconds: number };
  updatedAt: { seconds: number };
}

const VenueDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const venuesQuery = query(
          collection(db, 'venues'),
          where('ownerId', '==', user?.uid)
        );
        const venuesSnapshot = await getDocs(venuesQuery);
        const venuesData = venuesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setVenues(venuesData);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Failed to load venues. Please try again later.');
      }
    };

    if (user) {
      fetchVenues();
    }
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Start with base conditions
        const conditions = [];
        
        // Add status filter if not 'all'
        if (statusFilter !== 'all') {
          conditions.push(where('status', '==', statusFilter));
        }
        
        // Add venue filter if not 'all'
        if (selectedVenue !== 'all') {
          conditions.push(where('venueId', '==', selectedVenue));
        } else {
          // If no specific venue is selected, get bookings for all user's venues
          const venueIds = venues.map(venue => venue.id);
          if (venueIds.length === 0) {
            setBookings([]);
            return;
          }
          conditions.push(where('venueId', 'in', venueIds));
        }

        // Create query with all conditions and order by date and time
        const bookingsQuery = query(
          collection(db, 'bookings'),
          ...conditions,
          orderBy('date', 'desc'),
          orderBy('time', 'asc')
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];

        setBookings(bookingsData);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user && venues.length > 0) {
      fetchBookings();
    }
  }, [user, venues, statusFilter, selectedVenue]);

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      );

      toast.success(`Booking ${newStatus} successfully`);
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error('Failed to update booking status. Please try again.');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'confirmed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Booking Dashboard</h1>
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {venues.length > 1 && (
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="select"
            >
              <option value="all">All Venues</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Venue</th>
                <th>Package</th>
                <th>Date & Time</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-text-secondary">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-background">
                    <td className="font-mono text-sm">{booking.id.slice(0, 8)}...</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.userName}</span>
                        <span className="text-xs text-text-secondary">{booking.userEmail}</span>
                      </div>
                    </td>
                    <td>{booking.venueName}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.packageName}</span>
                        <span className="text-xs text-text-secondary">{booking.duration}h</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {format(new Date(booking.date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {booking.time}
                        </span>
                      </div>
                    </td>
                    <td>${booking.packagePrice}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              className="btn btn-success btn-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="btn btn-error btn-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            className="btn btn-error btn-sm"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="btn btn-success btn-sm"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VenueDashboard; 