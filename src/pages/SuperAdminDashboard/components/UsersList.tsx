import React, { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import 'react-virtualized/styles.css'; // Import styles
import { List, AutoSizer, ListRowProps } from 'react-virtualized';
import { User } from '../../../types';

interface UsersListProps {
  users: User[];
  onImpersonate: (uid: string) => void; // Add impersonation callback
}

// Corrected export: Use named export
export const UsersList: React.FC<UsersListProps> = ({ users, onImpersonate }) => {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const handleUpdateUserRole = async (uid: string, newRole: 'admin' | 'user') => {
    // Prevent demoting the last admin/superadmin (add safety check if needed)
    try {
      setUpdatingUser(uid);
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      // Note: Parent component should handle the state update via refetching
    } catch (error) {
      console.error('Error updating user role:', error instanceof Error ? error.message : error);
      // Add user feedback (e.g., toast notification)
    } finally {
      setUpdatingUser(null);
    }
  };

  const rowRenderer = useCallback(({ index, key, style }: ListRowProps) => {
    const user = users[index];
    if (!user) return null;

    const roleDisplay = user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User';
    const roleBadgeClass = user.role === 'superadmin' ? 'badge-accent' : user.role === 'admin' ? 'badge-secondary' : 'badge-primary';

    return (
      <div key={key} style={style} className="flex items-center border-b border-base-300 hover:bg-base-200 px-4 py-2">
        <img
          className="h-10 w-10 rounded-full mr-4 flex-shrink-0"
          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'U')}&background=random`}
          alt={user.name || user.email}
          loading="lazy"
        />
        <div className="flex-grow min-w-0 mr-4">
          <div className="font-medium text-text-primary truncate" title={user.name || 'N/A'}>{user.name || 'No Name Provided'}</div>
          <div className="text-sm text-text-secondary truncate" title={user.email}>{user.email}</div>
        </div>
        <div className="flex-shrink-0 w-32 text-center mr-4"> {/* Fixed width */}
          <span className={`badge badge-sm ${roleBadgeClass}`}>
            {roleDisplay}
          </span>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {user.role !== 'superadmin' && ( // Only show role toggle for non-superadmins
            <button
              onClick={() => handleUpdateUserRole(user.uid, user.role === 'admin' ? 'user' : 'admin')}
              disabled={updatingUser === user.uid}
              className="btn btn-xs btn-ghost text-info"
              title={`Make ${user.role === 'admin' ? 'User' : 'Admin'}`}
            >
              {updatingUser === user.uid
                ? <span className="loading loading-spinner loading-xs"></span>
                : `Make ${user.role === 'admin' ? 'User' : 'Admin'}`
              }
            </button>
          )}
           <button
              onClick={() => onImpersonate(user.uid)}
              className="btn btn-xs btn-ghost text-warning"
              title={`Impersonate ${user.name || user.email}`}
           >
               Impersonate
           </button>
           {/* Add Delete button if necessary, similar to VenuesList */}
        </div>
      </div>
    );
  }, [users, updatingUser, onImpersonate]); // Include onImpersonate in dependencies

  return (
      <div className="card bg-base-100 shadow border border-base-300" style={{ height: '600px', width: '100%' }}>
        {/* Header Row */}
        <div className="flex items-center border-b border-base-300 px-4 py-2 bg-base-200 text-sm font-semibold text-text-secondary sticky top-0 z-10">
            <div className="mr-4 flex-shrink-0" style={{ width: '56px' }}>{/* Corresponds to image + margin */}</div>
            <div className="flex-grow min-w-0 mr-4">User</div>
            <div className="flex-shrink-0 w-32 text-center mr-4">Role</div>
            <div className="flex-shrink-0" style={{ width: '180px' }}>Actions</div> {/* Adjust width based on buttons */}
        </div>
        {/* Virtualized List */}
        <AutoSizer>
            {({ height, width }) => (
                <List
                    height={height - 40} // Adjust for header
                    rowCount={users.length}
                    rowHeight={60} // Adjust row height
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

// Removed memoized export for now, can be added later if needed
// export const MemoizedUsersList = React.memo(UsersList);
