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
import { useNotificationStore } from '../store/notificationStore';
import { formatRelativeTime } from '../lib/utils';
import { Notification } from '../types';
import { wsApi } from '../lib/api';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const { user } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    setNotifications, 
    addNotification, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotificationStore();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        disconnectWebSocket();
      }
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    try {
      const ws = wsApi.connectNotifications();
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        // Request notification history on connect
        ws.send(JSON.stringify({ type: 'get_history' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('🔔 WebSocket message received:', data);
          
          if (data.type === 'history') {
            // Load notification history - clear existing and load all
            const historyNotifications = (data.data || [])
              .filter((item: any) => item.type !== 'read_updated') // Filter out read_updated notifications
              .map((item: any, index: number) => ({
                id: item.id || `fallback-${Date.now()}-${index}`,
                user_id: item.user_id || user?.id || 0,
                type: item.type || 'info',
                title: item.title || 'No Title',
                message: item.message || 'No message',
                read: item.read || false, // Use actual read status from backend
                metadata: item.metadata,
                created_at: item.created_at && item.created_at !== '0001-01-01T00:00:00Z' ? item.created_at : new Date().toISOString()
              }));
            // Sort by created_at descending (newest first)
            historyNotifications.sort((a: Notification, b: Notification) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setNotifications(historyNotifications);
          // } else if (data.type === 'notification') {
          //   // Handle new real-time notification
          //   const notificationData = data.data || data;
          //   const notification: Notification = {
          //     id: notificationData.id || `realtime-${Date.now()}-${Math.random()}`,
          //     user_id: notificationData.user_id || user?.id || 0,
          //     type: notificationData.type || 'info',
          //     title: notificationData.title || 'Notification',
          //     message: notificationData.message || '',
          //     read: notificationData.read || false, // Use read status from backend
          //     metadata: notificationData.metadata,
          //     created_at: notificationData.created_at && notificationData.created_at !== '0001-01-01T00:00:00Z' ? notificationData.created_at : new Date().toISOString()
          //   };
            
          //   addNotification(notification);
          // } else if (data.type === 'read_updated') {
          //   // Handle read status updates from backend
          //   console.log('🔔 Read status updated from backend:', data);
          //   if (data.id) {
          //     markAsRead(data.id);
          //   }
          } else if (data.type === 'mark_read_response') {
            // Handle mark_read command response from backend
            console.log('🔔 Mark read response from backend:', data);
            if (data.success && data.id) {
              // Backend confirmed the read status was updated
              markAsRead(data.id);
            }
          } else {
            // Log any other message types we might be missing
            console.log('🔔 Unknown WebSocket message type:', data.type, data);
          }
        } catch (error) {
          // Handle parsing errors silently
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionError('Connection lost. Notification service unavailable.');
      };

      ws.onerror = () => {
        setConnectionError('Notification service unavailable. Backend may not be running.');
        setIsConnected(false);
      };
    } catch (error) {
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


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="notification-center-modal"
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
                  {[...notifications]
                    .sort((a, b) => {
                      // First: unread before read
                      if (a.read !== b.read) {
                        return a.read ? 1 : -1; 
                      }
                      // Second: newest first by created_at
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .map((notification, index) => (
                    <motion.div
                      key={`notification-${notification.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                        notification.read 
                          ? 'bg-white border-gray-200' 
                          : getNotificationColor(notification.type)
                      }`}
                      onClick={() => {
                        setSelectedNotification(notification);
                        // Send mark_read command to backend if not already read
                        if (!notification.read && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                          const markReadCommand = {
                            type: 'mark_read',
                            id: notification.id
                          };
                          console.log('🔔 Sending mark_read command:', markReadCommand);
                          wsRef.current.send(JSON.stringify(markReadCommand));
                          // Optimistically mark as read in UI for immediate feedback
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-gray-900' : 'font-bold text-primary-800'
                            }`}>
                              {notification.title || 'No Title'}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(notification.created_at)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 line-clamp-2 ${
                            notification.read ? 'text-gray-600' : 'text-gray-800'
                          }`}>
                            {notification.message || 'No message'}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              Type: {notification.type}
                            </span>
                            <div className="flex items-center space-x-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Send mark_read command to backend
                                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                      const markReadCommand = {
                                        type: 'mark_read',
                                        id: notification.id
                                      };
                                      console.log('🔔 Sending mark_read command (button):', markReadCommand);
                                      wsRef.current.send(JSON.stringify(markReadCommand));
                                    }
                                    // Optimistically mark as read in UI for immediate feedback
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50"
                                >
                                  Mark as read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
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
      
      {/* Notification Details Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            key="notification-details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Notification Details</h3>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">Title:</span>
                    <span className="flex-1 text-gray-900">{selectedNotification.title || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">Message:</span>
                    <span className="flex-1 text-gray-900 break-words">{selectedNotification.message || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">Type:</span>
                    <span className="flex-1 text-gray-900">{selectedNotification.type || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">ID:</span>
                    <span className="flex-1 text-gray-900 font-mono text-sm">{selectedNotification.id || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">Time:</span>
                    <span className="flex-1 text-gray-900">
                      {new Date(selectedNotification.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">Status:</span>
                    <span className={`flex-1 font-medium ${selectedNotification.read ? 'text-gray-600' : 'text-primary-600'}`}>
                      {selectedNotification.read ? 'Read' : 'Unread'}
                    </span>
                  </div>

                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-gray-200 text-right">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default NotificationCenter;
