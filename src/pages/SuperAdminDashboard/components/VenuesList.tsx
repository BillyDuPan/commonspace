import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Venue } from '../../../types';
// Import react-virtualized styles
import 'react-virtualized/styles.css'; 
import { List, AutoSizer, ListRowProps } from 'react-virtualized'; // Import ListRowProps

interface VenuesListProps {
  venues: Venue[];
  // Removed onScroll prop as it's not used externally and handled internally
}

// Define the VenuesList component directly, React.memo is often applied at export if needed
export const VenuesList: React.FC<VenuesListProps> = ({ venues }) => {
  const [updatingVenue, setUpdatingVenue] = useState<string | null>(null);
  const [deletingVenue, setDeletingVenue] = useState<string | null>(null);
  const listRef = useRef<List>(null);

  const handleUpdateVenueStatus = async (venueId: string, newStatus: 'active' | 'inactive') => {
    try {
      setUpdatingVenue(venueId);
      const venueRef = doc(db, 'venues', venueId);
      await updateDoc(venueRef, { status: newStatus });
      // Note: Local state update is handled by the parent component's re-fetch/update mechanism
    } catch (error) {
      console.error('Error updating venue status:', error instanceof Error ? error.message : error);
    } finally {
      setUpdatingVenue(null);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      try {
        setDeletingVenue(venueId);
        await deleteDoc(doc(db, 'venues', venueId));
         // Note: Local state update (removing the venue) should ideally be handled
         // by the parent component re-fetching or updating its list.
         // For immediate UI feedback, you might filter the local state, but that
         // can lead to inconsistencies if the delete fails. Parent refetch is safer.
      } catch (error) {
        console.error('Error deleting venue:', error instanceof Error ? error.message : error);
      } finally {
        setDeletingVenue(null);
      }
    }
  };

  // Correctly typed rowRenderer using ListRowProps
  const rowRenderer = useCallback(({ index, key, style }: ListRowProps) => {
    const venue = venues[index];
    if (!venue) return null; // Handle case where venue might be undefined briefly

    return (
       // Apply style for positioning by react-virtualized
      <div key={key} style={style} className="flex items-center border-b border-base-300 hover:bg-base-200 px-4 py-2">
         <img
             className="h-10 w-10 rounded-lg object-cover mr-4 flex-shrink-0" // Added flex-shrink-0
             src={venue.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name)}&background=random`}
             alt={venue.name}
             loading="lazy" // Added lazy loading
          />
          <div className="flex-grow min-w-0 mr-4"> {/* Added min-w-0 for truncation */}
            <div className="font-medium text-text-primary truncate" title={venue.name}>{venue.name}</div>
            <div className="text-sm text-text-secondary truncate" title={venue.location}>{venue.location}</div>
          </div>
          <div className="flex-shrink-0 w-24 text-center mr-4">
             <span className={`badge badge-sm ${venue.type === 'cafe' ? 'badge-info' : 'badge-success'}`}>{venue.type}</span>
          </div>
           <div className="flex-shrink-0 w-20 text-center mr-4"> {/* Fixed width */}
             <span
                className={`badge badge-sm ${venue.status === 'active' ? 'badge-success' : 'badge-error'}`}
             >
                {venue.status}
            </span>
           </div>
           <div className="flex items-center space-x-2 flex-shrink-0"> {/* Reduced spacing */}
             <Link
               to={`/venue/${venue.id}`}
               className="btn btn-xs btn-ghost text-primary" // Use button styles for consistency
               title="View Venue Details"
             >
               View
             </Link>
             <Link
               to={`/superadmin/venue/${venue.id}/edit`}
               className="btn btn-xs btn-ghost text-secondary" // Use button styles
               title="Edit Venue"
             >
               Edit
             </Link>
             <button
               onClick={() => handleUpdateVenueStatus(venue.id, venue.status === 'active' ? 'inactive' : 'active')}
               disabled={updatingVenue === venue.id}
               className="btn btn-xs btn-ghost text-warning" // Use button styles
               title={venue.status === 'active' ? 'Deactivate Venue' : 'Activate Venue'}
             >
               {updatingVenue === venue.id
                 ? <span className="loading loading-spinner loading-xs"></span>
                 : venue.status === 'active' ? 'Deactivate' : 'Activate'
               }
             </button>
             <button
               onClick={() => handleDeleteVenue(venue.id)}
               disabled={deletingVenue === venue.id}
               className="btn btn-xs btn-ghost text-error" // Use button styles
               title="Delete Venue"
             >
                {deletingVenue === venue.id ? <span className="loading loading-spinner loading-xs"></span> : 'Delete'}
             </button>
           </div>
      </div>
    );
  }, [venues, updatingVenue, deletingVenue]); // Dependencies for useCallback

 // Removed internal onScroll handler - react-virtualized handles virtualization

  return (
    <div className="space-y-4"> {/* Reduced spacing */}
       {/* Removed Add New Venue button - should likely be in the parent dashboard */}
      <div className="card bg-base-100 shadow border border-base-300" style={{ height: '600px', width: '100%' }}> {/* Set fixed height */}
         {/* Header Row */}
         <div className="flex items-center border-b border-base-300 px-4 py-2 bg-base-200 text-sm font-semibold text-text-secondary sticky top-0 z-10">
             <div className="mr-4 flex-shrink-0" style={{ width: '56px' }}>{/* Corresponds to image + margin */}</div>
             <div className="flex-grow min-w-0 mr-4">Details</div>
             <div className="flex-shrink-0 w-24 text-center mr-4">Type</div>
             <div className="flex-shrink-0 w-20 text-center mr-4">Status</div>
             <div className="flex-shrink-0" style={{ width: '240px' }}>Actions</div> {/* Adjust width based on buttons */}
         </div>
         {/* Virtualized List */}
         <AutoSizer>
           {({ height, width }) => (
             <List
               ref={listRef}
               height={height - 40} // Adjust height for header row
               rowCount={venues.length}
               rowHeight={60} // Adjusted row height
               rowRenderer={rowRenderer}
               width={width}
               overscanRowCount={10}
               className="overflow-y-auto" // Ensure vertical scrollbar shows correctly
             />
           )}
         </AutoSizer>
       </div>
     </div>
   ); // Corrected: Removed semicolon here
 };

 // Apply React.memo here if performance profiling shows it's necessary
 // export const MemoizedVenuesList = React.memo(VenuesList);
