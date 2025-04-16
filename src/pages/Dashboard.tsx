import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { Venue, Booking } from '../types';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch venues owned by the admin
        const venuesQuery = query(
          collection(db, 'venues'),
          where('adminId', '==', user.uid)
        );
        const venuesSnapshot = await getDocs(venuesQuery);
        const venuesData = venuesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Venue[];
        setVenues(venuesData);

        // Fetch bookings for all venues
        const venueIds = venuesData.map((venue) => venue.id);
        if (venueIds.length > 0) {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('venueId', 'in', venueIds)
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          const bookingsData = bookingsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Booking[];
          setBookings(bookingsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="page-header">Venue Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Link to="/superadmin/venue/new" className="btn btn-primary">
            Add New Venue
          </Link>
          <Cog6ToothIcon className="h-6 w-6 text-secondary" aria-hidden="true" />
        </div>


      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-text-secondary text-sm font-medium mb-1">Total Venues</div>
          <div className="text-3xl font-bold text-primary">{venues.length}</div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm font-medium mb-1">Active Venues</div>
          <div className="text-3xl font-bold text-primary">
            {venues.filter(v => v.status === 'active').length}
          </div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm font-medium mb-1">Total Bookings</div>
          <div className="text-3xl font-bold text-primary">{bookings.length}</div>
        </div>
      </div>

      {/* Venues Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-header mb-0">Your Venues</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Venue</th>
                <th>Location</th>
                <th>Status</th>
                <th>Bookings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => (
                <tr key={venue.id} className="hover:bg-background">
                  <td className="flex items-center space-x-3">
                    <img
                      className="h-10 w-10 rounded-lg object-cover"
                      src={venue.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name)}`}
                      alt=""
                    />
                    <div className="font-medium text-text-primary">{venue.name}</div>
                  </td>
                  <td className="text-text-secondary">{venue.location}</td>
                  <td>
                    <span className={`badge ${venue.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {venue.status}
                    </span>
                  </td>
                  <td className="text-text-secondary">
                    {bookings.filter(b => b.venueId === venue.id).length} bookings
                  </td>
                  <td>
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/venue/${venue.id}`}
                        className="text-primary hover:text-primary-dark"
                      >
                        View
                      </Link>
                      <div className="flex items-center space-x-1">
                        <Link to={`/superadmin/venue/${venue.id}/edit`} className="text-primary hover:text-primary-dark">
                          Edit
                        </Link>
                        <Cog6ToothIcon className="h-4 w-4 text-secondary" aria-hidden="true" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <h2 className="section-header">Recent Bookings</h2>
        <div className="space-y-4">
          {bookings.slice(0, 5).map((booking) => {
            const venue = venues.find((v) => v.id === booking.venueId);
            return (
              <div
                key={booking.id}
                className="flex justify-between items-center p-4 border border-border rounded-lg hover:bg-background"
              >
                <div>
                  <div className="font-medium text-text-primary">{venue?.name}</div>
                  <div className="text-sm text-text-secondary">
                    {new Date(booking.date.seconds * 1000).toLocaleDateString()} • {booking.time}
                  </div>
                </div>
                <span className={`badge ${
                  booking.status === 'confirmed' 
                    ? 'badge-success' 
                    : booking.status === 'pending'
                    ? 'badge-warning'
                    : 'badge-error'
                }`}>
                  {booking.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 