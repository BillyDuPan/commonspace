import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';

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

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
    fetchVenues();
  }, [statusFilter, selectedVenue]);

  const fetchVenues = async () => {
    try {
      const venuesSnapshot = await getDocs(collection(db, 'venues'));
      const venuesData = venuesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setVenues(venuesData);
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Start with base conditions
      const conditions = [];
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        conditions.push(where('status', '==', statusFilter));
      }
      
      // Add venue filter if not 'all'
      if (selectedVenue !== 'all') {
        conditions.push(where('venueId', '==', selectedVenue));
      }
      
      // Create query with all conditions and order by createdAt
      const bookingsQuery = query(
        collection(db, 'bookings'),
        ...conditions,
        orderBy('createdAt', 'desc')
      );

      console.log('Fetching bookings with filters:', { statusFilter, selectedVenue });

      const bookingsSnapshot = await getDocs(bookingsQuery);

      console.log('Found bookings:', bookingsSnapshot.size);

      const bookingsData = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
        } as Booking;
      });

      console.log('Processed bookings:', bookingsData.length);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
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
    } catch (error) {
      console.error('Error updating booking status:', error);
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
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-lg font-medium text-text-secondary">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
            }}
            className="select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedVenue}
            onChange={(e) => {
              setSelectedVenue(e.target.value);
            }}
            className="select"
          >
            <option value="all">All Venues</option>
            {venues.map(venue => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchBookings()}
          className="btn btn-secondary"
        >
          Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
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
                          {new Date(booking.date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {booking.time}
                        </span>
                      </div>
                    </td>
                    <td>${booking.packagePrice}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="btn btn-success btn-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              className="btn btn-error btn-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            className="btn btn-error btn-sm"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
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
} 