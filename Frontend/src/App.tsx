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
import NotificationToast from './components/NotificationToast';
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
      if (refreshToken && (!user || (accessToken && isTokenExpired(accessToken, 1)))) {
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
        } catch (error: any) {
          console.error('Auth initialization failed:', error);
          // Only clear auth data if refresh token is actually invalid
          // Don't clear on network errors or temporary server issues
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Refresh token is invalid, clearing auth data');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            try { localStorage.removeItem('user_profile'); } catch {}
            setUser(null);
          } else {
            console.log('Temporary auth error, keeping user logged in');
            // Keep user logged in, the proactive refresh will handle it
          }
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

  // Proactive token refresh - schedule refresh before expiration
  useEffect(() => {
    const scheduleTokenRefresh = () => {
      // Clear any existing timeout
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }

      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken && user) {
        const timeUntilExpiration = getTimeUntilExpiration(accessToken);
        
        if (timeUntilExpiration !== null && timeUntilExpiration > 2) {
          // Schedule refresh 2 minutes before expiration (at 14m40s for 15min token)
          const refreshTime = (timeUntilExpiration - 2) * 60 * 1000;
          
          console.log(`Scheduling token refresh in ${Math.round(refreshTime / 1000 / 60)} minutes`);
          
          refreshIntervalRef.current = window.setTimeout(async () => {
            console.log('Proactively refreshing token before expiration...');
            try {
              const response = await authApi.refreshToken(refreshToken);
              if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                if (response.data.refresh_token) {
                  localStorage.setItem('refresh_token', response.data.refresh_token);
                }
                console.log('Token proactively refreshed successfully');
                
                // Schedule the next refresh
                scheduleTokenRefresh();
              }
            } catch (error) {
              console.error('Proactive token refresh failed:', error);
              // Don't clear tokens here, let the API interceptor handle it
              // Try again in 1 minute as fallback
              refreshIntervalRef.current = window.setTimeout(scheduleTokenRefresh, 60 * 1000);
            }
          }, refreshTime);
        } else if (timeUntilExpiration !== null && timeUntilExpiration <= 2) {
          // Token expires very soon, refresh immediately
          console.log('Token expires very soon, refreshing immediately...');
          authApi.refreshToken(refreshToken)
            .then(response => {
              if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                if (response.data.refresh_token) {
                  localStorage.setItem('refresh_token', response.data.refresh_token);
                }
                console.log('Token refreshed immediately');
                scheduleTokenRefresh();
              }
            })
            .catch(error => {
              console.error('Immediate token refresh failed:', error);
            });
        }
      }
    };

    if (user && isAuthenticated) {
      scheduleTokenRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
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
      
      {/* Global Notification Toast */}
      <NotificationToast isEnabled={isAuthenticated} />
    </div>
  );
};

export default App;
