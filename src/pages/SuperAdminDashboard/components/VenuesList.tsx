import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Venue } from '../../../types';

interface VenuesListProps {
  venues: Venue[];
}

export const VenuesList: React.FC<VenuesListProps> = ({ venues }) => {
  const [updatingVenue, setUpdatingVenue] = useState<string | null>(null);
  const [deletingVenue, setDeletingVenue] = useState<string | null>(null);

  const handleUpdateVenueStatus = async (venueId: string, newStatus: 'active' | 'inactive') => {
    try {
      setUpdatingVenue(venueId);
      await updateDoc(doc(db, 'venues', venueId), { status: newStatus });
    } catch (error) {
      console.error('Error updating venue status:', error);
    } finally {
      setUpdatingVenue(null);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingVenue(venueId);
      await deleteDoc(doc(db, 'venues', venueId));
    } catch (error) {
      console.error('Error deleting venue:', error);
    } finally {
      setDeletingVenue(null);
    }
  };

  return (
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
                        disabled={updatingVenue === venue.id}
                        className="text-secondary hover:text-secondary-dark"
                      >
                        {updatingVenue === venue.id 
                          ? 'Updating...' 
                          : venue.status === 'active' ? 'Deactivate' : 'Activate'
                        }
                      </button>
                      <button
                        onClick={() => handleDeleteVenue(venue.id)}
                        disabled={deletingVenue === venue.id}
                        className="text-accent hover:text-accent-dark"
                      >
                        {deletingVenue === venue.id ? 'Deleting...' : 'Delete'}
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
  );
}; 