import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthStore } from './store/authStore';
import { authApi, userApi } from './lib/api';
import { 
  isTokenExpired, 
  shouldRefreshImmediately, 
  getOptimalRefreshTime,
  getTokenInfo
} from './lib/tokenUtils';

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
  const refreshTimeoutRef = useRef<number | null>(null);

  // Initialize authentication on app start - HANDLES PAGE REFRESH
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      console.debug('🚀 Initializing auth on page load...', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken,
        hasUser: !!user 
      });

      // No tokens at all - user is not logged in
      if (!accessToken && !refreshToken) {
        console.debug('📝 No tokens found - user not logged in');
        setUser(null);
        return;
      }

      // We have refresh token - this means user was logged in
      if (refreshToken) {
        setLoading(true);
        
        try {
          // Check if access token is valid
          if (accessToken && !isTokenExpired(accessToken, 60)) {
            console.debug('✅ Access token is still valid');
            
            // Load user profile if we don't have it
            if (!user) {
              console.debug('👤 Loading user profile...');
              const profileResponse = await userApi.getProfile();
              setUser(profileResponse.data);
              localStorage.setItem('user_profile', JSON.stringify(profileResponse.data));
              console.debug('✅ User profile loaded from valid token');
            }
          } else {
            // Access token is missing or expired - refresh it
            console.debug('🔄 Access token expired/missing - refreshing...');
            const response = await authApi.refreshToken(refreshToken);
            
            if (response.data.access_token) {
              localStorage.setItem('access_token', response.data.access_token);
              
              // Handle refresh token rotation
              if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
              }
              
              // Load user profile
              const profileResponse = await userApi.getProfile();
              setUser(profileResponse.data);
              localStorage.setItem('user_profile', JSON.stringify(profileResponse.data));
              
              console.debug('✅ Token refreshed and user profile loaded');
            }
          }
        } catch (error: any) {
          console.debug('❌ Auth initialization failed:', error.message);
          
          // Only clear on actual auth failures (invalid refresh token)
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.debug('🚪 Invalid refresh token - clearing auth data');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_profile');
            setUser(null);
          } else {
            // Network error or temporary issue - keep tokens and try again later
            console.debug('🌐 Network error during initialization - keeping tokens');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, []); // Run only once on mount

  // Proactive token refresh system - THE MAIN STRATEGY
  useEffect(() => {
    const scheduleProactiveRefresh = () => {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (!accessToken || !refreshToken || !user) {
        console.debug('⏸️ No tokens or user - skipping refresh scheduling');
        return;
      }

      // Check if token should be refreshed immediately
      if (shouldRefreshImmediately(accessToken)) {
        console.debug('⚡ Token expires soon - refreshing immediately');
        performProactiveRefresh();
        return;
      }

      // Calculate optimal refresh time (14m40s for 15min tokens)
      const refreshTimeMs = getOptimalRefreshTime(accessToken);
      
      if (refreshTimeMs === null) {
        console.debug('⚠️ Cannot calculate refresh time');
        return;
      }

      const refreshTimeMinutes = Math.round(refreshTimeMs / 1000 / 60);
      console.debug(`⏰ Scheduling proactive refresh in ${refreshTimeMinutes} minutes`);
      console.debug(`📊 Token info: ${getTokenInfo(accessToken)}`);

      refreshTimeoutRef.current = window.setTimeout(() => {
        console.debug('🔄 Executing scheduled proactive refresh');
        performProactiveRefresh();
      }, refreshTimeMs);
    };

    const performProactiveRefresh = async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.debug('❌ No refresh token for proactive refresh');
        return;
      }

      try {
        console.debug('🔄 Performing proactive token refresh...');
        const response = await authApi.refreshToken(refreshToken);
        
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token);
          
          // Handle refresh token rotation
          if (response.data.refresh_token) {
            localStorage.setItem('refresh_token', response.data.refresh_token);
          }
          
          console.debug('✅ Proactive refresh successful');
          console.debug(`📊 New token info: ${getTokenInfo(response.data.access_token)}`);
          
          // Schedule the next refresh
          scheduleProactiveRefresh();
        }
      } catch (error: any) {
        console.debug('❌ Proactive refresh failed:', error.message);
        
        // Don't clear tokens here - let the fallback interceptor handle it
        // Retry in 1 minute as fallback
        refreshTimeoutRef.current = window.setTimeout(() => {
          console.debug('🔄 Retrying proactive refresh after failure');
          scheduleProactiveRefresh();
        }, 60 * 1000);
      }
    };

    // Start proactive refresh scheduling when user is authenticated
    if (user && isAuthenticated) {
      console.debug('🎯 Starting proactive refresh system');
      scheduleProactiveRefresh();
    }

    // Cleanup on unmount or user change
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
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
