import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';
import { bookingStatusUpdater } from './services/bookingStatusUpdater';
import { emailScheduler } from './services/emailScheduler';
import './styles/theme.css';
import { Toaster } from 'react-hot-toast';

export default function App() {
  // Start the services when the app loads
  bookingStatusUpdater.start();
  emailScheduler.start();

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}
