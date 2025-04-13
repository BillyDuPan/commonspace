import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Venue from '../pages/Venue';
import Booking from '../pages/Booking';
import Profile from '../pages/Profile';
import SuperadminDashboard from '../pages/SuperadminDashboard';
import EditVenue from '../pages/EditVenue';
import { ProtectedRoute } from '../components/ProtectedRoute';
import MyVenues from '../pages/MyVenues';
import VenueDashboard from '../pages/VenueDashboard';
import UserBookings from '../pages/UserBookings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Home /></Layout>
  },
  {
    path: '/login',
    element: <Layout><Login /></Layout>
  },
  {
    path: '/signup',
    element: <Layout><Login /></Layout>,
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="admin">
          <Dashboard />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/superadmin',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="superadmin">
          <SuperadminDashboard />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/superadmin/venue/new',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="superadmin">
          <EditVenue />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/superadmin/venue/:id/edit',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="superadmin">
          <EditVenue />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/venue-dashboard',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="venue">
          <VenueDashboard />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/my-venues',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="venue">
          <MyVenues />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/venue/spaces',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="venue">
          <MyVenues />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/venue/new',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="venue">
          <EditVenue />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/venue/:id/edit',
    element: (
      <Layout>
        <ProtectedRoute requiredRole="venue">
          <EditVenue />
        </ProtectedRoute>
      </Layout>
    )
  },
  {
    path: '/profile',
    element: (
      <Layout>
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Layout>
    )
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
  {
    path: '/bookings',
    element: (
      <Layout>
        <ProtectedRoute>
          <UserBookings />
        </ProtectedRoute>
      </Layout>
    )
  },
]); 