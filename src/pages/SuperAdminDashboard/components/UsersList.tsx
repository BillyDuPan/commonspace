import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { User } from '../../../types';

interface UsersListProps {
  users: User[];
}

export const UsersList: React.FC<UsersListProps> = ({ users }) => {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const handleUpdateUserRole = async (uid: string, newRole: 'admin' | 'user') => {
    try {
      setUpdatingUser(uid);
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setUpdatingUser(null);
    }
  };

  return (
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
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-background">
                <td className="flex items-center space-x-3">
                  {user.name ? (
                    <>
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                        alt=""
                      />
                      <div>
                        <div className="font-medium text-text-primary">{user.name}</div>
                      </div>
                    </>
                  ) : (
                    <div>No Name</div>
                  )}
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
                      disabled={updatingUser === user.uid}
                      className="btn btn-secondary"
                    >
                      {updatingUser === user.uid 
                        ? 'Updating...' 
                        : `Make ${user.role === 'admin' ? 'User' : 'Admin'}`
                      }
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 