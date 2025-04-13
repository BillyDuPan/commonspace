import { useAuth } from '../context/AuthContext';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Booking {
  id: string;
  venueName: string;
  packageName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentBookings() {
      if (!user) return;

      try {
        console.log('Fetching bookings for user:', user.uid);
        
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookings: Booking[] = [];
        
        bookingsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Found booking:', { id: doc.id, ...data });
          bookings.push({ 
            id: doc.id, 
            venueName: data.venueName,
            packageName: data.packageName,
            date: data.date,
            time: data.time,
            status: data.status,
            createdAt: data.createdAt
          });
        });

        bookings.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

        console.log('Total bookings found:', bookings.length);
        setRecentBookings(bookings.slice(0, 3)); // Get only the 3 most recent bookings
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentBookings();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {location.state?.bookingSuccess && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p>Booking created successfully! You'll receive a confirmation email shortly.</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="card mb-8">
            <div className="flex items-center space-x-6 mb-6">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-surface shadow-md"
              />
              <div>
                <h1 className="page-header mb-1">{user.name}</h1>
                <p className="text-text-secondary">{user.email}</p>
                <span className="badge badge-warning mt-2">{user.role}</span>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="section-header mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <div>
                    <h3 className="font-medium text-text-primary">Email</h3>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                  </div>
                  <button className="btn btn-secondary">Change</button>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <div>
                    <h3 className="font-medium text-text-primary">Password</h3>
                    <p className="text-sm text-text-secondary">Last changed 3 months ago</p>
                  </div>
                  <button className="btn btn-secondary">Change</button>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="section-header">Recent Bookings</h2>
                <Link
                  to="/bookings"
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  View All →
                </Link>
              </div>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="text-text-secondary">Loading bookings...</div>
                </div>
              ) : recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-text-primary">{booking.venueName}</h3>
                          <p className="text-sm text-text-secondary">{booking.packageName}</p>
                          <p className="text-sm text-text-secondary mt-1">
                            {new Date(booking.date).toLocaleDateString()} at {booking.time}
                          </p>
                        </div>
                        <span className={`badge ${
                          booking.status === 'confirmed' ? 'badge-success' : 
                          booking.status === 'pending' ? 'badge-warning' : 
                          'badge-error'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border border-border rounded-lg">
                  <p className="text-text-secondary">No recent bookings</p>
                  <Link to="/" className="text-primary hover:text-primary-dark mt-2 inline-block">
                    Browse Venues
                  </Link>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <button
                onClick={() => signOut()}
                className="btn btn-primary w-full bg-accent hover:bg-accent-dark"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 