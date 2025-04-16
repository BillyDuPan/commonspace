import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    getDocs,
    getFirestore,
     } from 'firebase/firestore';import { User, Venue, Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatsCards } from './components/StatsCards';
import { UsersList } from './components/UsersList';
import { VenuesList } from './components/VenuesList';
import { BookingsManagement } from './components/BookingsManagement';
import { filterUsers, filterVenues } from './helpers';
import { useFirestore } from '../../hooks/useFirestore';
import { app } from '../../services/firebase';

export default function SuperadminDashboard() {
  const { impersonateUser, isImpersonating, stopImpersonating } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'venues' | 'bookings' | 'analytics'>('users');
  const [searchTerm, setSearchTerm] = useState('');


  // --- Refactoring Start ---

  // 1. Call Hooks at Top Level (Corrected hook name)
  const { data: usersData, loading: loadingUsers } = useFirestore<User>('users');
  const { data: venuesData, loading: loadingVenues } = useFirestore<Venue>('venues');

  const [users, setUsers] = useState<User[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]); // Use defined Booking type if available
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [overallLoading, setOverallLoading] = useState(true); // Combined loading state

  // 2. Fetch Bookings Separately using useEffect
  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const db = getFirestore(app);
        const bookingsCol = collection(db, 'bookings');
        const bookingSnapshot = await getDocs(bookingsCol);
        const bookingsList = bookingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(bookingsList);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        // Handle error appropriately
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, []); // Fetch bookings only once on mount

  useEffect(() => {
    setUsers(usersData);
  }, [usersData]);

  useEffect(() => {
    setVenues(venuesData);
  }, [venuesData]);


  // 2. Manage Overall Loading State
  useEffect(() => {
    setOverallLoading(loadingUsers || loadingVenues || loadingBookings);
  }, [loadingUsers, loadingVenues, loadingBookings]);



  // --- Refactoring End ---


  const stats = {
    totalUsers: users.length, // Use accumulated users length
    totalVenues: venues.length, // Use accumulated venues length
    totalBookings: bookings.length,
    activeVenues: venues.filter(v => v.status === 'active').length
  };

  const filteredUsers = filterUsers(users, searchTerm);
  const filteredVenues = filterVenues(venues, searchTerm);


  return (
    <div className="space-y-8">
      <header className="bg-surface shadow-md py-4 px-6 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <Link to="/" className="btn btn-secondary">
            ← Back to Site
          </Link>
        </div>
      </header>

      {isImpersonating && (
        <div className="bg-warning text-warning-content p-4 rounded-lg flex justify-between items-center max-w-screen-lg mx-auto sticky top-[76px] z-10"> {/* Adjust top based on header height */}
          <span>You are currently impersonating user ID: {localStorage.getItem('impersonatingUserId')}</span>
          <button
            onClick={stopImpersonating}
            className="btn btn-sm btn-warning"
          >
            Stop Impersonating
          </button>
        </div>
      )}
       {/* Added fixed height and overflow for the scroll container */}
      <div className="content overflow-y-auto bg-background max-w-screen-lg mx-auto" style={{ height: `calc(100vh - ${isImpersonating ? '140px' : '80px'})` }}> {/* Adjust height dynamically */}
        <div className="container mx-auto space-y-8 p-6"> {/* Added padding here */}
          <StatsCards stats={stats} />

          <div className="sticky top-[76px] bg-background py-4 z-5"> {/* Make controls sticky */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex space-x-2 sm:space-x-4 flex-wrap">
                 <button
                    onClick={() => setActiveTab('users')}
                    className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
                 >
                    Users
                 </button>
                 <button
                    onClick={() => setActiveTab('venues')}
                    className={`btn ${activeTab === 'venues' ? 'btn-primary' : 'btn-ghost'}`}
                 >
                    Venues
                 </button>
                 <button
                    onClick={() => setActiveTab('bookings')}
                    className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-ghost'}`}
                 >
                    Bookings
                 </button>
                 <button
                    onClick={() => setActiveTab('analytics')}
                    className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Analytics
                  </button>
                </div>

                {(activeTab === 'users' || activeTab === 'venues') && (
                 <div className="w-full md:w-auto">
                    <input
                     type="text"
                     placeholder={`Search ${activeTab}...`}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="input input-bordered w-full md:w-64" // Added input-bordered
                    />
                 </div>
                )}
             </div>
          </div>


          {overallLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeTab === 'users' && (
                <UsersList users={filteredUsers} onImpersonate={impersonateUser} />
              )}
              {activeTab === 'venues' && (
                <VenuesList venues={filteredVenues} />
              )}
            </>
          )}
          {activeTab === 'bookings' && (
            loadingBookings ? <LoadingSpinner /> : <BookingsManagement bookings={bookings} setBookings={setBookings} />
          )}
          {activeTab === 'analytics' && (
            <div className="card bg-base-100 shadow-xl"> {/* Improved card styling */}
                <div className="card-body">
                 <h2 className="card-title">Analytics Dashboard</h2>
                 <p className="text-text-secondary">Coming soon: Detailed analytics and insights about platform usage.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
