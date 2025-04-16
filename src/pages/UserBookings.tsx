import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/api/bookings';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function UserBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userBookings = await bookingService.getBookings({ userId: user.uid });
      
      // Sort bookings by date and time
      userBookings.sort((a, b) => {
        const dateCompare = new Date(b.date.seconds * 1000).getTime() - new Date(a.date.seconds * 1000).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      });
      
      setBookings(userBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'cancelled');
      toast.success('Booking cancelled successfully');
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
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
      case 'completed':
        return 'badge-info';
      case 'in_progress':
        return 'badge-success';
      case 'no_show':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="page-header">My Bookings</h1>

          {loading ? (
            <div className="card">
              <div className="text-center py-8">
                <div className="text-text-secondary">Loading bookings...</div>
              </div>
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="card">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-text-primary">
                          {booking.venueName}
                        </h3>
                        <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-text-secondary">
                        <p><span className="font-medium">Package:</span> {booking.packageName}</p>
                        <p><span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString()}</p>
                        <p><span className="font-medium">Time:</span> {booking.time} ({booking.duration} hour{booking.duration !== 1 ? 's' : ''})</p>
                        <p><span className="font-medium">Price:</span> ${booking.packagePrice}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="btn btn-error"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="btn btn-error"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-text-secondary mb-4">You haven't made any bookings yet</p>
              <a href="/" className="btn btn-primary">
                Browse Venues
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 