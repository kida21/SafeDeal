import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuthStore } from "./store/authStore";
import { useNotificationStore } from "./store/notificationStore";
import { authApi, userApi, wsApi } from "./lib/api";
import {
  isTokenExpired,
  getOptimalRefreshTime,
  logTokenExpiration,
} from "./lib/tokenUtils";

// Pages & Components
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CreateEscrow from "./pages/CreateEscrow";
import EscrowDetails from "./pages/EscrowDetails";
import AllEscrows from "./pages/AllEscrows";
import TransactionHistory from "./pages/TransactionHistory";
import UserSearch from "./pages/UserSearch";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationToast from "./components/NotificationToast";
import DebugAuth from "./components/DebugAuth";
import Contacts from "./pages/Contacts";

function App() {
  const { user, setUser, setLoading, isAuthenticated } = useAuthStore();
  const { setNotifications, addNotification } = useNotificationStore();
  const refreshTimeoutRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 🧩 Initialize auth on page load
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        console.debug("📝 No token found — user not logged in");
        setUser(null);
        return;
      }

      setLoading(true);

      try {
        // Check if token is valid
        if (!isTokenExpired(accessToken, 60)) {
          console.debug("✅ Access token is valid, loading user profile...");
          const profileResponse = await userApi.getProfile();
          setUser(profileResponse.data);
          localStorage.setItem(
            "user_profile",
            JSON.stringify(profileResponse.data)
          );
          // Initialize notifications after successful auth
          initializeNotifications();
        } else {
          console.debug("🔄 Access token expired — refreshing via cookie...");
          const response = await authApi.refreshToken();
          localStorage.setItem("access_token", response.data.access_token);
          const profileResponse = await userApi.getProfile();
          setUser(profileResponse.data);
          localStorage.setItem(
            "user_profile",
            JSON.stringify(profileResponse.data)
          );
          // Initialize notifications after successful auth
          initializeNotifications();
        }
      } catch (error: any) {
        console.error("❌ Auth initialization failed:", error.message);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_profile");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const initializeNotifications = () => {
      try {
        const ws = wsApi.connectNotifications();
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('🔔 Notification WebSocket connected on app startup');
          // Request notification history on connect
          ws.send(JSON.stringify({ type: 'get_history' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'history') {
              // Load notification history
              const historyNotifications = (data.data || [])
                .filter((item: any) => item.type !== 'read_updated') // Filter out read_updated notifications
                .map((item: any, index: number) => ({
                  id: item.id || `fallback-${Date.now()}-${index}`,
                  user_id: item.user_id || user?.id || 0,
                  type: item.type || 'info',
                  title: item.title || 'No Title',
                  message: item.message || 'No message',
                  read: item.read || false,
                  metadata: item.metadata,
                  created_at: item.created_at || new Date().toISOString()
                }));
              // Sort by created_at descending (newest first)
              historyNotifications.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              setNotifications(historyNotifications);
            } else if (data.type === 'notification') {
              // Handle new real-time notification
              const notificationData = data.data || data;
              
              // Filter out system notifications that users don't need to see
              if (notificationData.type === 'read_updated' || notificationData.type === 'mark_read_response') {
                return;
              }
              
              const notification = {
                id: notificationData.id || `realtime-${Date.now()}-${Math.random()}`,
                user_id: notificationData.user_id || user?.id || 0,
                type: notificationData.type || 'info',
                title: notificationData.title || 'New Notification',
                message: notificationData.message || 'You have a new notification.',
                read: notificationData.read || false,
                metadata: notificationData.metadata,
                created_at: notificationData.created_at || new Date().toISOString()
              };
              
              addNotification(notification);
            }
          } catch (error) {
            console.error('Error parsing notification message:', error);
          }
        };

        ws.onclose = () => {
          console.log('🔔 Notification WebSocket disconnected');
        };

        ws.onerror = (error) => {
          console.error('🔔 Notification WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeAuth();
  }, []);

  // 🕐 Token refresh scheduling
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    // Log expiration time every minute
    const cleanupLogging = logTokenExpiration(accessToken);

    const scheduleRefresh = async () => {
      if (!accessToken) return;

      const timeUntilRefresh = getOptimalRefreshTime(accessToken);
      if (!timeUntilRefresh) {
        console.warn(
          "⚠️ Could not calculate refresh time — token may be expired."
        );
        return;
      }

      console.log(
        `⏳ Next refresh scheduled in ${Math.ceil(
          timeUntilRefresh / 1000 / 60
        )} minutes.`
      );

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          console.log("🔄 Performing scheduled token refresh...");
          const response = await authApi.refreshToken();
          localStorage.setItem("access_token", response.data.access_token);
          console.log("✅ Token refreshed successfully!");
          scheduleRefresh(); // schedule next refresh
        } catch (error: any) {
          console.error("❌ Token refresh failed:", error.message);
        }
      }, timeUntilRefresh);
    };

    scheduleRefresh();

    return () => {
      cleanupLogging();
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [user, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-escrow"
          element={
            <ProtectedRoute>
              <CreateEscrow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/escrow/:id"
          element={
            <ProtectedRoute>
              <EscrowDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/escrows"
          element={
            <ProtectedRoute>
              <AllEscrows />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <UserSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <NotificationToast isEnabled={isAuthenticated} />
      <DebugAuth />
    </div>
  );
}

export default App;
