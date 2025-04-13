import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRef, useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading, isImpersonating, stopImpersonating, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Impersonation Bar */}
      {isImpersonating && (
        <div className="bg-warning text-warning-content py-2 px-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="font-medium">⚠️ Impersonating: {user?.name}</span>
              <span className="text-sm">({user?.role})</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/superadmin"
                className="btn btn-sm btn-warning"
                onClick={() => {
                  stopImpersonating();
                  navigate('/superadmin');
                }}
              >
                Return to Admin Dashboard
              </Link>
              <button
                onClick={() => stopImpersonating()}
                className="btn btn-sm btn-warning"
              >
                Stop Impersonating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Header */}
      <nav className="bg-surface text-text-primary border-b border-border shadow-sm sticky top-0 w-full z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl md:text-2xl font-bold tracking-wider text-primary">
              COMMONSPACE
            </Link>

            {/* Profile Menu Button */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 rounded-lg hover:bg-background transition-colors"
                aria-label={user ? "Open profile menu" : "Login"}
              >
                {user ? (
                  <>
                    <span className="hidden md:inline font-medium text-text-primary">{user.name}</span>
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-primary"
                    />
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Login</span>
                  </>
                )}
              </button>

              {/* Enhanced Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-lg overflow-hidden border border-border z-20">
                  {!user ? (
                    // Login section for non-authenticated users
                    <div>
                      <Link
                        to="/login"
                        className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="mr-3">🔑</span>
                        <span className="text-sm md:text-base">Sign In</span>
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background border-t border-border"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="mr-3">✨</span>
                        <span className="text-sm md:text-base">Create Account</span>
                      </Link>
                    </div>
                  ) : (
                    // Menu for authenticated users
                    <div>
                      {/* Common Navigation Section */}
                      <div className="px-4 py-2 text-xs text-text-secondary uppercase tracking-wider bg-background">
                        Navigation
                      </div>
                      <Link
                        to="/"
                        className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="mr-3">🏠</span>
                        <span className="text-sm md:text-base">Home</span>
                      </Link>
                      <Link
                        to="/explore"
                        className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background border-t border-border"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="mr-3">🔍</span>
                        <span className="text-sm md:text-base">Explore Spaces</span>
                      </Link>

                      {/* Regular User Section */}
                      {user.role === 'user' && (
                        <>
                          <div className="px-4 py-2 text-xs text-text-secondary uppercase tracking-wider bg-background border-t border-border">
                            Your Account
                          </div>
                          <Link
                            to="/profile"
                            className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span className="mr-3">👤</span>
                            <span className="text-sm md:text-base">My Profile</span>
                          </Link>
                          <Link
                            to="/bookings"
                            className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background border-t border-border"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span className="mr-3">📅</span>
                            <span className="text-sm md:text-base">My Bookings</span>
                          </Link>
                          <Link
                            to="/favorites"
                            className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background border-t border-border"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span className="mr-3">⭐</span>
                            <span className="text-sm md:text-base">Favorites</span>
                          </Link>
                        </>
                      )}

                      {/* Venue Manager Section */}
                      {user.role === 'venue' && (
                        <>
                          <div className="px-4 py-2 text-xs text-text-secondary uppercase tracking-wider bg-background border-t border-border">
                            Venue Management
                          </div>
                          <Link
                            to="/venue-dashboard"
                            className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span className="mr-3">📊</span>
                            <span className="text-sm md:text-base">Booking Dashboard</span>
                          </Link>
                          <Link
                            to="/my-venues"
                            className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background border-t border-border"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span className="mr-3">🏢</span>
                            <span className="text-sm md:text-base">My Venues</span>
                          </Link>
                        </>
                      )}

                      {/* Admin Section */}
                      {(user.role === 'admin' || user.role === 'superadmin') && (
                        <>
                          <div className="px-4 py-2 text-xs text-text-secondary uppercase tracking-wider bg-background border-t border-border">
                            Administration
                          </div>
                          {user.role === 'superadmin' ? (
                            <>
                              <Link
                                to="/superadmin"
                                className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background"
                                onClick={() => setShowProfileMenu(false)}
                              >
                                <span className="mr-3">⚡</span>
                                <span className="text-sm md:text-base">Admin Dashboard</span>
                              </Link>
                              <Link
                                to="/superadmin/analytics"
                                className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background border-t border-border"
                                onClick={() => setShowProfileMenu(false)}
                              >
                                <span className="mr-3">📈</span>
                                <span className="text-sm md:text-base">Analytics</span>
                              </Link>
                              <Link
                                to="/superadmin/settings"
                                className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background border-t border-border"
                                onClick={() => setShowProfileMenu(false)}
                              >
                                <span className="mr-3">🛠️</span>
                                <span className="text-sm md:text-base">System Settings</span>
                              </Link>
                            </>
                          ) : (
                            <Link
                              to="/dashboard"
                              className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background"
                              onClick={() => setShowProfileMenu(false)}
                            >
                              <span className="mr-3">📊</span>
                              <span className="text-sm md:text-base">Admin Dashboard</span>
                            </Link>
                          )}
                        </>
                      )}

                      {/* Profile & Settings Section - Common for all users */}
                      <div className="px-4 py-2 text-xs text-text-secondary uppercase tracking-wider bg-background border-t border-border">
                        Settings
                      </div>
                      <Link
                        to="/profile/settings"
                        className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-background"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="mr-3">⚙️</span>
                        <span className="text-sm md:text-base">Account Settings</span>
                      </Link>

                      {/* Sign Out Section */}
                      <div className="border-t border-border mt-2">
                        <button
                          onClick={() => {
                            signOut();
                            setShowProfileMenu(false);
                          }}
                          className="flex items-center w-full px-4 py-3 text-accent hover:bg-background"
                        >
                          <span className="mr-3">🚪</span>
                          <span className="text-sm md:text-base">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-text-secondary text-sm md:text-base">
              © {new Date().getFullYear()} CommonSpace. All rights reserved.
            </div>
            <div className="flex space-x-4 md:space-x-6">
              <a href="#" className="text-text-secondary hover:text-primary text-sm md:text-base">Terms</a>
              <a href="#" className="text-text-secondary hover:text-primary text-sm md:text-base">Privacy</a>
              <a href="#" className="text-text-secondary hover:text-primary text-sm md:text-base">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 