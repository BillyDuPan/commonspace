import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { List, AutoSizer, ListRowProps } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { Venue } from '../pages/MyVenues'; // Assuming the Venue interface is in MyVenues.tsx

interface MyVenuesListProps {
  venues: Venue[];
}

const MyVenuesList: React.FC<MyVenuesListProps> = ({ venues }) => {
  const rowRenderer = useCallback(({ index, key, style }: ListRowProps) => {
    const venue = venues[index];
    if (!venue) return null;

    return (
      <div key={key} style={style} className="flex items-center">
        <img
          className="h-10 w-10 rounded-lg object-cover mr-4 flex-shrink-0"
          src={venue.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name)}&background=random`}
          alt={venue.name}
          loading="lazy"
        />
        <div className="flex-grow min-w-0 mr-4">
          <div className="font-medium text-text-primary truncate" title={venue.name}>{venue.name}</div>
          <div className="text-sm text-text-secondary truncate" title={venue.location}>{venue.location}</div>
        </div>
        <div className="flex-shrink-0 w-24 text-center mr-4">Type</div>
        <div className="flex-shrink-0 w-20 text-center mr-4">Status</div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <Link to={`/venue/${venue.id}`} className="btn btn-xs btn-ghost text-primary" title="View Venue Details">View</Link>
          <Link to={`/venue/${venue.id}/edit`} className="btn btn-xs btn-ghost text-secondary" title="Edit Venue Details">Edit</Link>
        </div>
      </div>
    );
  }, [venues]);

  return (
    <div className="" style={{ height: '600px', width: '100%' }}>
         <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <List
            height={height - 40}
            rowCount={venues.length}
            rowHeight={60}
            rowRenderer={rowRenderer}
            width={width}
            overscanRowCount={10}
            className="overflow-y-auto"
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default MyVenuesList;
