import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFirestore } from '../../hooks/useFirestore';
import { User, Venue } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatsCards } from './components/StatsCards';
import { UsersList } from './components/UsersList';
import { VenuesList } from './components/VenuesList';
import BookingsManagement from '../SuperAdminDashboard/BookingsManagement';

export default function SuperadminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'venues' | 'bookings' | 'analytics'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
    data: users, 
    loading: usersLoading 
  } = useFirestore<User>('users');
  
  const { 
    data: venues, 
    loading: venuesLoading 
  } = useFirestore<Venue>('venues');

  const { 
    data: bookings, 
    loading: bookingsLoading 
  } = useFirestore('bookings');

  const stats = {
    totalUsers: users.length,
    totalVenues: venues.length,
    totalBookings: bookings.length,
    activeVenues: venues.filter(v => v.status === 'active').length
  };

  if (usersLoading || venuesLoading || bookingsLoading) {
    return <LoadingSpinner />;
  }

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredVenues = venues.filter(venue =>
    (venue.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (venue.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="page-header">Admin Dashboard</h1>
        <Link to="/" className="btn btn-secondary">
          ← Back to Site
        </Link>
      </div>

      <StatsCards stats={stats} />

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

      {activeTab === 'users' && <UsersList users={filteredUsers} />}
      {activeTab === 'venues' && <VenuesList venues={filteredVenues} />}
      {activeTab === 'bookings' && <BookingsManagement />}
      {activeTab === 'analytics' && (
        <div className="card">
          <h2 className="section-header">Analytics Dashboard</h2>
          <p className="text-text-secondary">Coming soon: Detailed analytics and insights about platform usage.</p>
        </div>
      )}
    </div>
  );
} 