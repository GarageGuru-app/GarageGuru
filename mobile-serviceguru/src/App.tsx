import React, { useState, useEffect } from 'react';
import { Router, Route, Switch, Redirect } from 'wouter';
import { DatabaseManager, User } from './lib/database';

// Pages
import LoginPage from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MechanicDashboard from './pages/MechanicDashboard';
import CustomersPage from './pages/Customers';
import JobCardsPage from './pages/JobCards';
import SparePartsPage from './pages/SpareParts';
import InvoicesPage from './pages/Invoices';
import ProfilePage from './pages/Profile';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import OfflineIndicator from './components/OfflineIndicator';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check for existing authentication
    const user = DatabaseManager.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!currentUser) {
      return <Redirect to="/login" />;
    }
    return <>{children}</>;
  };

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!currentUser || currentUser.role !== 'garage_admin') {
      return <Redirect to="/mechanic-dashboard" />;
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator isOnline={isOnline} />
      
      <Router>
        <Switch>
          {/* Authentication Routes */}
          <Route path="/login">
            {currentUser ? (
              <Redirect to={currentUser.role === 'garage_admin' ? '/admin-dashboard' : '/mechanic-dashboard'} />
            ) : (
              <LoginPage onLogin={setCurrentUser} />
            )}
          </Route>

          <Route path="/register">
            {currentUser ? (
              <Redirect to={currentUser.role === 'garage_admin' ? '/admin-dashboard' : '/mechanic-dashboard'} />
            ) : (
              <RegisterPage />
            )}
          </Route>

          <Route path="/forgot-password">
            {currentUser ? (
              <Redirect to={currentUser.role === 'garage_admin' ? '/admin-dashboard' : '/mechanic-dashboard'} />
            ) : (
              <ForgotPasswordPage />
            )}
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin-dashboard">
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboard user={currentUser!} />
              </AdminRoute>
            </ProtectedRoute>
          </Route>

          {/* Mechanic Dashboard */}
          <Route path="/mechanic-dashboard">
            <ProtectedRoute>
              <MechanicDashboard user={currentUser!} />
            </ProtectedRoute>
          </Route>

          {/* Feature Pages */}
          <Route path="/customers">
            <ProtectedRoute>
              <CustomersPage user={currentUser!} />
            </ProtectedRoute>
          </Route>

          <Route path="/job-cards">
            <ProtectedRoute>
              <JobCardsPage user={currentUser!} />
            </ProtectedRoute>
          </Route>

          <Route path="/spare-parts">
            <ProtectedRoute>
              <SparePartsPage user={currentUser!} />
            </ProtectedRoute>
          </Route>

          <Route path="/invoices">
            <ProtectedRoute>
              <InvoicesPage user={currentUser!} />
            </ProtectedRoute>
          </Route>

          <Route path="/profile">
            <ProtectedRoute>
              <ProfilePage user={currentUser!} onLogout={() => setCurrentUser(null)} />
            </ProtectedRoute>
          </Route>

          {/* Default Route - Direct to login (no homepage) */}
          <Route path="/">
            {currentUser ? (
              <Redirect to={currentUser.role === 'garage_admin' ? '/admin-dashboard' : '/mechanic-dashboard'} />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          {/* 404 Route */}
          <Route>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600">Page not found</p>
              </div>
            </div>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;