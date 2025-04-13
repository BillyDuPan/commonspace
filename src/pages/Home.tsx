import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { Venue } from '../types';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjxwYXRoIGQ9Ik0zMjAgMTYwaDI0MHYxNjBIMzIweiIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gaW1hZ2UgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    async function fetchVenues() {
      try {
        const venuesSnapshot = await getDocs(collection(db, 'venues'));
        const venuesData = venuesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Venue[];
        setVenues(venuesData);
        setFilteredVenues(venuesData);
      } catch (error) {
        console.error('Error fetching venues:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVenues();
  }, []);

  useEffect(() => {
    let filtered = [...venues]; 

    if (searchQuery) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(venue => venue.type === selectedFilter);
    }
    setFilteredVenues(filtered); 
  }, [searchQuery, selectedFilter, venues]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section - Clean Modern Style */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8 py-12 md:py-20">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary">
              Find Your Workspace
            </h1>
            <p className="text-lg md:text-xl text-text-secondary font-medium">
              Discover the perfect space for your productivity ✨
            </p>
            
            {/* Search Bar - Mobile Optimized */}
            <div className="relative mt-6 md:mt-8">
              <input
                type="text"
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 md:px-6 py-3 md:py-4 rounded-lg text-text-primary bg-surface border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-text-secondary text-base md:text-lg"
              />
              <svg
                className="absolute right-4 top-3 md:top-4 h-6 w-6 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Venue Categories and Grid */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-wrap gap-3 md:gap-4 mb-6 md:mb-8 justify-center">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-base md:text-lg transition-all ${
              selectedFilter === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface text-text-primary border-2 border-border hover:border-primary hover:text-primary'
            }`}
          >
            🏢 ALL
          </button>
          <button
            onClick={() => setSelectedFilter('cafe')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-base md:text-lg transition-all ${
              selectedFilter === 'cafe'
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface text-text-primary border-2 border-border hover:border-primary hover:text-primary'
            }`}
          >
            ☕️ CAFES
          </button>
          <button
            onClick={() => setSelectedFilter('cowork')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-base md:text-lg transition-all ${
              selectedFilter === 'cowork'
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface text-text-primary border-2 border-border hover:border-primary hover:text-primary'
            }`}
          >
            💼 COWORKING
          </button>
        </div>

        {/* Venues Grid - Gate Information Displays */}
        {filteredVenues.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-xl text-text-secondary">No venues found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <Link
                key={venue.id}
                to={`/venue/${venue.id}`}
                className="group"
              >
                <div className="card hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative aspect-w-16 aspect-h-9 -mx-6 -mt-6 mb-4">
                    <img
                      src={venue.photos?.[0] || PLACEHOLDER_IMAGE}
                      alt={venue.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = PLACEHOLDER_IMAGE;
                        target.onerror = null;
                      }}
                      className="object-cover w-full h-48"
                    />
                    {venue.status === 'active' && (
                      <div className="absolute top-4 right-4">
                        <span className="badge badge-success">OPEN</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
                        {venue.name}
                      </h3>
                      {venue.rating && (
                        <span className="badge">⭐️ {venue.rating}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-text-secondary">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {venue.location}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="badge badge-warning">
                        {venue.type === 'cafe' ? '☕️ CAFE' : '💼 COWORKING'}
                      </span>
                      <span className="text-primary font-medium">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 