import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Wifi, 
  WifiOff,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime } from '../lib/utils';
import { Notification } from '../types';
import { wsApi } from '../lib/api';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    try {
      const ws = wsApi.connectNotifications();
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Notification WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received notification:', data);
          
          if (data.type === 'notification') {
            const notification: Notification = {
              id: data.id || Date.now(),
              user_id: data.user_id,
              type: data.notification_type || 'info',
              title: data.title,
              message: data.message,
              read: false,
              metadata: data.metadata,
              created_at: data.created_at || new Date().toISOString()
            };
            
            setNotifications(prev => [notification, ...prev]);
          } else if (data.type === 'history') {
            // Load notification history
            setNotifications(data.notifications || []);
          }
        } catch (error) {
          console.error('Error parsing notification message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Notification WebSocket disconnected');
        setIsConnected(false);
        setConnectionError('Connection lost. Notification service unavailable.');
        
        // Don't attempt to reconnect automatically to prevent infinite loops
        // when backend is not running
      };

      ws.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
        setConnectionError('Notification service unavailable. Backend may not be running.');
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect notification WebSocket:', error);
      setConnectionError('Failed to connect to notification service.');
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center text-green-600">
          <Wifi className="h-4 w-4 mr-1" />
          <span className="text-xs">Connected</span>
        </div>
      );
    } else if (connectionError) {
      return (
        <div className="flex items-center text-red-600">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs">Disconnected</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-600">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs">Connecting...</span>
        </div>
      );
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-full">
                  <Bell className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getConnectionStatus()}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Connection Error */}
            {connectionError && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                <div className="flex items-center text-red-700">
                  <WifiOff className="h-4 w-4 mr-2" />
                  <span className="text-sm">{connectionError}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {/* <MarkAsRead className="h-4 w-4" /> */}
                      <span>Mark all read</span>
                    </button>
                  </div>
                  <button
                    onClick={clearAllNotifications}
                    className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear all</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No notifications yet
                  </h4>
                  <p className="text-gray-600">
                    You'll receive notifications about your escrow transactions here.
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        notification.read 
                          ? 'bg-white border-gray-200' 
                          : getNotificationColor(notification.type)
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-gray-900' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(notification.created_at)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${
                            notification.read ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-3">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-primary-600 hover:text-primary-700"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
