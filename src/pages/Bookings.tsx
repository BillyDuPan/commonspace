import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Navigate, Link } from 'react-router-dom';

interface Booking {
  id: string;
  venueName: string;
  packageName: string;
  packagePrice: number;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
}

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;

      try {
        console.log('Fetching all bookings for user:', user.uid);
        
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const fetchedBookings: Booking[] = [];
        
        bookingsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Found booking:', { id: doc.id, ...data });
          fetchedBookings.push({ 
            id: doc.id, 
            venueName: data.venueName,
            packageName: data.packageName,
            packagePrice: data.packagePrice,
            date: data.date,
            time: data.time,
            duration: data.duration,
            status: data.status,
            createdAt: data.createdAt
          });
        });

        // Sort bookings by date and time
        fetchedBookings.sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.time.localeCompare(a.time);
        });

        setBookings(fetchedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="page-header">My Bookings</h1>
            <Link to="/" className="btn btn-primary">
              Book New Venue
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-text-secondary">Loading bookings...</div>
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-2">
                        {booking.venueName}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-text-secondary">
                          <span className="font-medium">Package:</span> {booking.packageName}
                        </p>
                        <p className="text-text-secondary">
                          <span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString()}
                        </p>
                        <p className="text-text-secondary">
                          <span className="font-medium">Time:</span> {booking.time} ({booking.duration} hour{booking.duration !== 1 ? 's' : ''})
                        </p>
                        <p className="text-text-secondary">
                          <span className="font-medium">Price:</span> ${booking.packagePrice}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`badge ${
                        booking.status === 'confirmed' ? 'badge-success' : 
                        booking.status === 'pending' ? 'badge-warning' : 
                        'badge-error'
                      }`}>
                        {booking.status}
                      </span>
                      <Link 
                        to={`/venues/${booking.id}`} 
                        className="text-primary hover:text-primary-dark text-sm"
                      >
                        View Venue →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-text-secondary mb-4">You haven't made any bookings yet</p>
              <Link to="/" className="btn btn-primary">
                Browse Venues
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 