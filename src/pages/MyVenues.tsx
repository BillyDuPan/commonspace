import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  type: 'cafe' | 'cowork';
  status: 'active' | 'inactive';
  photos?: string[];
  priceRange?: string;
}

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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-header">My Venues</h1>
        <Link
          to="/venue/new"
          className="btn btn-primary"
        >
          Add New Venue
        </Link>
      </div>

      {error && (
        <div className="alert alert-error mb-8">
          {error}
        </div>
      )}

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
              {venues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <p className="text-text-secondary mb-4">You haven't added any venues yet.</p>
                    <Link
                      to="/venue/new"
                      className="text-primary hover:text-primary-dark"
                    >
                      Create your first venue
                    </Link>
                  </td>
                </tr>
              ) : (
                venues.map((venue) => (
                  <tr key={venue.id} className="hover:bg-background">
                    <td className="flex items-center space-x-3">
                      <img
                        className="h-10 w-10 rounded-lg object-cover"
                        src={venue.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name)}`}
                        alt={venue.name}
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
                          to={`/venue/${venue.id}/edit`}
                          className="text-primary hover:text-primary-dark"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/venue/${venue.id}/spaces`}
                          className="text-primary hover:text-primary-dark"
                        >
                          Manage Spaces
                        </Link>
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