import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Booking } from '../../../types'; // Assuming Booking type is in types/index.ts

interface BookingsManagementProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  // Potentially pass down loading state if needed, or manage internally
}

// Corrected export: Use named export and FC type
export const BookingsManagement: React.FC<BookingsManagementProps> = ({ bookings, setBookings }) => {
  // Internal loading states specific to this component's actions
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  // Filters managed internally
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');

  // Fetch venues only once for the filter dropdown
  useEffect(() => {
    const fetchVenues = async () => {
      setLoadingVenues(true);
      try {
        const venuesSnapshot = await getDocs(collection(db, 'venues'));
        const venuesData = venuesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name as string // Assert type if needed
        }));
        setVenues(venuesData);
      } catch (error) {
        console.error('Error fetching venues:', error);
      } finally {
        setLoadingVenues(false);
      }
    };
    fetchVenues();
  }, []);

  // Note: Fetching bookings is now handled by the parent SuperadminDashboard component.
  // This component receives the bookings as a prop.

  const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'pending') => {
    setUpdatingBooking(bookingId);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp() // Use server timestamp
      });

      // Fetch the updated booking
      const updatedBookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (updatedBookingDoc.exists()) {
        const updatedBooking = { id: updatedBookingDoc.id, ...updatedBookingDoc.data() } as Booking;

        // Update local state with the fetched timestamp
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: newStatus, updatedAt: updatedBooking.updatedAt }
              : booking
          )
        );
      }
    } catch (error) {
      console.error('Error updating booking status:', error instanceof Error ? error.message : error);
      // Add user feedback
    } finally {
      setUpdatingBooking(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'confirmed': return 'badge-success';
      case 'cancelled': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  // Filter bookings locally based on state
  const filteredBookings = bookings.filter(booking => {
    const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
    const venueMatch = selectedVenue === 'all' || booking.venueId === selectedVenue;
    return statusMatch && venueMatch;
  });

  // If parent is loading, we might want to show a spinner too
  // Or rely on parent's overall loading state
  // if (parentLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
       {/* Filter Controls */}
      <div className="card bg-base-100 shadow p-4 border border-base-300">
          <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">
             <h3 className="text-lg font-semibold mr-4 mb-2 sm:mb-0">Filter Bookings</h3>
             <select
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value as any)}
               className="select select-bordered select-sm w-full sm:w-auto"
               disabled={loadingVenues}
             >
               <option value="all">All Statuses</option>
               <option value="pending">Pending</option>
               <option value="confirmed">Confirmed</option>
               <option value="cancelled">Cancelled</option>
             </select>

             <select
               value={selectedVenue}
               onChange={(e) => setSelectedVenue(e.target.value)}
               className="select select-bordered select-sm w-full sm:w-auto"
               disabled={loadingVenues}
             >
               <option value="all">All Venues</option>
               {venues.map(venue => (
                 <option key={venue.id} value={venue.id}>
                   {venue.name}
                 </option>
               ))}
             </select>
             {loadingVenues && <span className="loading loading-xs"></span>}
         </div>
      </div>

      {/* Bookings Table */}
      <div className="card bg-base-100 shadow border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full"> {/* Use table-zebra */}
            <thead className="bg-base-200">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Venue</th>
                <th className="px-4 py-2">Package</th>
                <th className="px-4 py-2">Date & Time</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-text-secondary italic">
                    No bookings match the current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover"> {/* DaisyUI hover */}
                    <td className="px-4 py-2 font-mono text-xs" title={booking.id}>{booking.id.slice(0, 6)}...</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate" title={booking.userName || booking.userEmail}>{booking.userName || booking.userEmail}</span>
                        <span className="text-xs text-text-secondary truncate" title={booking.userEmail}>{booking.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm truncate" title={booking.venueName}>{booking.venueName}</td>
                     <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate" title={booking.packageName}>{booking.packageName}</span>
                        <span className="text-xs text-text-secondary">{booking.duration}h</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                           {/* Correctly format date from Timestamp: seconds * 1000 */}
                           {booking.date ? new Date(booking.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {booking.time || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">${booking.packagePrice?.toFixed(2) ?? 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className={`badge badge-sm ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-1">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="btn btn-success btn-xs"
                              disabled={updatingBooking === booking.id}
                              title="Confirm Booking"
                            >
                              {updatingBooking === booking.id ? <span className="loading loading-spinner loading-xs"></span> : 'Confirm'}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              className="btn btn-error btn-xs"
                              disabled={updatingBooking === booking.id}
                              title="Cancel Booking"
                            >
                               {updatingBooking === booking.id ? <span className="loading loading-spinner loading-xs"></span> : 'Cancel'}
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            className="btn btn-error btn-xs"
                            disabled={updatingBooking === booking.id}
                            title="Cancel Booking"
                          >
                             {updatingBooking === booking.id ? <span className="loading loading-spinner loading-xs"></span> : 'Cancel'}
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                           // Optional: Allow re-confirming or re-pending a cancelled booking
                           <button
                             onClick={() => handleStatusUpdate(booking.id, 'pending')} // Or 'confirmed'
                             className="btn btn-warning btn-xs"
                             disabled={updatingBooking === booking.id}
                             title="Mark as Pending" // Or "Reactivate"
                           >
                              {updatingBooking === booking.id ? <span className="loading loading-spinner loading-xs"></span> : 'Re-Pend'}
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
