import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthStore } from './store/authStore';
import { authApi, userApi } from './lib/api';
import { isTokenExpired, getTimeUntilExpiration } from './lib/tokenUtils';

// Components
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateEscrow from './pages/CreateEscrow';
import EscrowDetails from './pages/EscrowDetails';
import AllEscrows from './pages/AllEscrows';
import TransactionHistory from './pages/TransactionHistory';
import UserSearch from './pages/UserSearch';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
// import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, setUser, setLoading, isAuthenticated } = useAuthStore();
  const refreshIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      // If we have a user in store but no tokens, clear the user
      if (user && (!accessToken || !refreshToken)) {
        console.log('User in store but no tokens found, clearing user');
        setUser(null);
        return;
      }

      // If we have tokens but no user, or if access token is expired/expiring
      if (refreshToken && (!user || (accessToken && isTokenExpired(accessToken)))) {
        setLoading(true);
        
        try {
          console.log('Refreshing token on app initialization...');
          const response = await authApi.refreshToken(refreshToken);
          
          if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            
            // Also update refresh token if provided
            if (response.data.refresh_token) {
              localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            
            console.log('Token refreshed successfully, fetching user profile...');
            
            // Get user profile if we don't have one or need to refresh it
            if (!user) {
              const profileResponse = await userApi.getProfile();
              setUser(profileResponse.data);
              try { 
                localStorage.setItem('user_profile', JSON.stringify(profileResponse.data)); 
              } catch {}
              console.log('User profile loaded successfully');
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          // Clear all auth data on failure
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          try { localStorage.removeItem('user_profile'); } catch {}
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else if (accessToken && !isTokenExpired(accessToken) && !user) {
        // We have a valid access token but no user in store, fetch profile
        setLoading(true);
        try {
          console.log('Valid token found, fetching user profile...');
          const profileResponse = await userApi.getProfile();
          setUser(profileResponse.data);
          try { 
            localStorage.setItem('user_profile', JSON.stringify(profileResponse.data)); 
          } catch {}
          console.log('User profile loaded successfully');
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Token might be invalid, clear auth data
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          try { localStorage.removeItem('user_profile'); } catch {}
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    };

    initAuth();
  }, [user, setUser, setLoading]);

  // Proactive token refresh - check every 5 minutes
  useEffect(() => {
    const startTokenRefreshInterval = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = window.setInterval(async () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (accessToken && refreshToken && user && isTokenExpired(accessToken, 5)) {
          console.log('Proactively refreshing token...');
          try {
            const response = await authApi.refreshToken(refreshToken);
            if (response.data.access_token) {
              localStorage.setItem('access_token', response.data.access_token);
              if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
              }
              console.log('Token proactively refreshed successfully');
            }
          } catch (error) {
            console.error('Proactive token refresh failed:', error);
            // Don't clear tokens here, let the API interceptor handle it
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
    };

    if (user && isAuthenticated) {
      startTokenRefreshInterval();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, isAuthenticated]);

  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage/>} 
        />


        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/create-escrow" element={
          <ProtectedRoute>
            <CreateEscrow />
          </ProtectedRoute>
        } />
        <Route path="/escrow/:id" element={
          <ProtectedRoute>
            <EscrowDetails />
          </ProtectedRoute>
        } />
        <Route path="/escrows" element={
          <ProtectedRoute>
            <AllEscrows />
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <TransactionHistory />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <UserSearch />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
