import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin, isVenue, isSuperAdmin } from '../utils/auth';

type Role = 'admin' | 'superadmin' | 'venue';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    // Superadmins can access everything
    if (isSuperAdmin(user)) {
      return <>{children}</>;
    }

    // Check specific role requirements
    switch (requiredRole) {
      case 'admin':
        if (!isAdmin(user)) {
          return <Navigate to="/" />;
        }
        break;
      case 'venue':
        if (!isVenue(user)) {
          return <Navigate to="/" />;
        }
        break;
      case 'superadmin':
        if (!isSuperAdmin(user)) {
          return <Navigate to="/" />;
        }
        break;
    }
  }

  return <>{children}</>;
} 