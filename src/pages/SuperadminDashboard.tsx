import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User, Venue } from '../types';
import { Link } from 'react-router-dom';
import BookingsManagement from './SuperAdminDashboard/BookingsManagement';

export default function SuperadminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'venues' | 'bookings' | 'analytics'>('users');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalBookings: 0,
    activeVenues: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [usersSnapshot, venuesSnapshot, bookingsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'venues')),
          getDocs(collection(db, 'bookings'))
        ]);

        const usersData = usersSnapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id,
        })) as User[];

        const venuesData = venuesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Venue[];

        setUsers(usersData);
        setVenues(venuesData);
        setStats({
          totalUsers: usersData.length,
          totalVenues: venuesData.length,
          totalBookings: bookingsSnapshot.size,
          activeVenues: venuesData.filter(v => v.status === 'active').length
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleUpdateUserRole = async (uid: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(users.map(user => 
        user.uid === uid ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'venues', venueId));
        setVenues(venues.filter(venue => venue.id !== venueId));
        setStats(prev => ({
          ...prev,
          totalVenues: prev.totalVenues - 1,
          activeVenues: venues.find(v => v.id === venueId)?.status === 'active' 
            ? prev.activeVenues - 1 
            : prev.activeVenues
        }));
      } catch (error) {
        console.error('Error deleting venue:', error);
      }
    }
  };

  const handleUpdateVenueStatus = async (venueId: string, newStatus: 'active' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'venues', venueId), { status: newStatus });
      setVenues(venues.map(venue =>
        venue.id === venueId ? { ...venue, status: newStatus } : venue
      ));
      setStats(prev => ({
        ...prev,
        activeVenues: newStatus === 'active' 
          ? prev.activeVenues + 1 
          : prev.activeVenues - 1
      }));
    } catch (error) {
      console.error('Error updating venue status:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredVenues = venues.filter(venue =>
    (venue.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (venue.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="page-header">Admin Dashboard</h1>
        <Link to="/" className="btn btn-secondary">
          ← Back to Site
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-text-secondary text-sm font-medium mb-1">Total Users</div>
          <div className="text-3xl font-bold text-primary">{stats.totalUsers}</div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm font-medium mb-1">Total Venues</div>
          <div className="text-3xl font-bold text-primary">{stats.totalVenues}</div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm font-medium mb-1">Active Venues</div>
          <div className="text-3xl font-bold text-primary">{stats.activeVenues}</div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm font-medium mb-1">Total Bookings</div>
          <div className="text-3xl font-bold text-primary">{stats.totalBookings}</div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('venues')}
            className={`btn ${activeTab === 'venues' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Venues
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Analytics
          </button>
        </div>
        {activeTab !== 'bookings' && (
          <div className="w-full md:w-auto">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'users' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-background">
                    <td className="flex items-center space-x-3">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`}
                        alt=""
                      />
                      <div>
                        <div className="font-medium text-text-primary">{user.name}</div>
                      </div>
                    </td>
                    <td className="text-text-secondary">{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role === 'superadmin' 
                          ? 'badge-error' 
                          : user.role === 'admin' 
                            ? 'badge-warning' 
                            : 'badge-success'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.role !== 'superadmin' && (
                        <button
                          onClick={() => handleUpdateUserRole(user.uid, user.role === 'admin' ? 'user' : 'admin')}
                          className="btn btn-secondary"
                        >
                          Make {user.role === 'admin' ? 'User' : 'Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'venues' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Link to="/superadmin/venue/new" className="btn btn-primary">
              Add New Venue
            </Link>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Venue</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-background">
                      <td className="flex items-center space-x-3">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={venue.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name || 'Venue')}`}
                          alt=""
                        />
                        <div className="font-medium text-text-primary">{venue.name}</div>
                      </td>
                      <td className="text-text-secondary">{venue.location}</td>
                      <td>
                        <span className="badge badge-warning">
                          {venue.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${venue.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                          {venue.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/venue/${venue.id}`}
                            className="text-primary hover:text-primary-dark"
                          >
                            View
                          </Link>
                          <Link
                            to={`/superadmin/venue/${venue.id}/edit`}
                            className="text-primary hover:text-primary-dark"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleUpdateVenueStatus(venue.id, venue.status === 'active' ? 'inactive' : 'active')}
                            className="text-secondary hover:text-secondary-dark"
                          >
                            {venue.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteVenue(venue.id)}
                            className="text-accent hover:text-accent-dark"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'bookings' ? (
        <BookingsManagement />
      ) : (
        <div className="card">
          <h2 className="section-header">Analytics Dashboard</h2>
          <p className="text-text-secondary">Coming soon: Detailed analytics and insights about platform usage.</p>
        </div>
      )}
    </div>
  );
} 