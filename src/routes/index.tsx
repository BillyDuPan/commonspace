import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Venue from '../pages/Venue';
import Booking from '../pages/Booking';
import Profile from '../pages/Profile';
import SuperadminDashboard from '../pages/SuperadminDashboard';
import EditVenue from '../pages/EditVenue';

// Protected route wrapper
function ProtectedRoute({ children, requireAdmin = false, requireSuperadmin = false }: { 
  children: React.ReactNode; 
  requireAdmin?: boolean;
  requireSuperadmin?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireSuperadmin && user.role !== 'superadmin') {
    return <Navigate to="/" />;
  }

  if (requireAdmin && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Home /></Layout>,
  },
  {
    path: '/login',
    element: <Layout><Login /></Layout>,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute requireAdmin>
        <Layout><Dashboard /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/superadmin',
    element: (
      <ProtectedRoute requireSuperadmin>
        <Layout><SuperadminDashboard /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/superadmin/venue/new',
    element: (
      <ProtectedRoute requireSuperadmin>
        <Layout><EditVenue /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/superadmin/venue/:id/edit',
    element: (
      <ProtectedRoute requireSuperadmin>
        <Layout><EditVenue /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Layout><Profile /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/venue/:id',
    element: <Layout><Venue /></Layout>,
  },
  {
    path: '/booking/:id',
    element: (
      <ProtectedRoute>
        <Layout><Booking /></Layout>
      </ProtectedRoute>
    ),
  },
]); 