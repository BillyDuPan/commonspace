import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase'; 
import { useAuth } from '../context/AuthContext';

export interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  type: 'cafe' | 'cowork';
  status: 'active' | 'inactive';
  photos?: string[] | undefined;
  priceRange?: string;
}
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import MyVenuesList from '../components/MyVenuesList'; // Import the new component

export default function MyVenues() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      if (!user) return;
      
      try {
        // Query venues where the user is the owner
        const venuesQuery = query(
          collection(db, 'venues'),
          where('ownerId', '==', user.id)
        );
        
        const venuesSnapshot = await getDocs(venuesQuery);
        const venuesData = venuesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Venue[];
        
        setVenues(venuesData);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Failed to fetch venues. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  console.log(venues); // Check the venues data

  return (
    <div className="space-y-8">
      <header className="bg-surface shadow-md py-4 px-6 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text-primary">My Venues</h1>
          <Link to="/" className="btn btn-secondary">
            ← Back to Site
          </Link>
        </div>
      </header>
      <div className="content overflow-y-auto bg-background max-w-screen-lg mx-auto">
        <div className="container mx-auto space-y-8 p-6">
          <div className="flex justify-between items-center mb-8">
            <Link to="/venue/new" className="btn btn-primary">Add New Venue</Link>
          </div>
          <div className="max-w-screen-lg mx-auto">
            <div className="card bg-base-100 shadow border border-base-300" style={{ overflow: 'visible' }}>
              <div className="px-4 py-2 bg-base-200 text-sm font-semibold text-text-secondary sticky top-0 z-10 border-b border-base-300">
                <div className="flex items-center">
                  <div className="mr-4 flex-shrink-0" style={{ width: '56px' }}></div>
                  <div className="flex-grow min-w-0 mr-4">Details</div>
                  <div className="flex-shrink-0 w-24 text-center mr-4">Type</div>
                  <div className="flex-shrink-0 w-20 text-center mr-4">Status</div>
                  <div className="flex-shrink-0" style={{ width: '240px' }}>Actions</div>
                </div>
              </div>
              <MyVenuesList venues={venues} /> {/* Render the new component */} {/* Pass the venues data as a prop */}            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}