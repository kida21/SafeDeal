import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { wsApi } from '../lib/api';
import { Notification } from '../types';
import { formatRelativeTime } from '../lib/utils';

interface NotificationToastProps {
  isEnabled?: boolean;
}

const NotificationToast = ({ isEnabled = true }: NotificationToastProps) => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!isEnabled || !user) return;

    // Connect to notification WebSocket
    try {
      const ws = wsApi.connectNotifications();
      setWsConnection(ws);

      ws.onopen = () => {
        // Connected
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            const notificationData = data.data || data;
            const notification: Notification = {
              id: notificationData.id || Date.now(),
              user_id: notificationData.user_id || user?.id || 0,
              type: notificationData.type || 'info',
              title: notificationData.title || 'New Notification',
              message: notificationData.message || 'You have a new notification.',
              read: false,
              metadata: notificationData.metadata,
              created_at: notificationData.created_at || new Date().toISOString()
            };
            
            // Add notification to toast queue
            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (exists) return prev;
              
              // Add new notification and limit to 3 visible at once
              const updated = [notification, ...prev];
              return updated.slice(0, 3);
            });

            // Auto-remove after 5 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 5000);
          }
        } catch (error) {
          // Handle parsing errors silently
        }
      };

      ws.onclose = () => {
        setWsConnection(null);
      };

      ws.onerror = () => {
        // Handle WebSocket errors silently
      };

    } catch (error) {
      // Handle connection errors silently
    }

    return () => {
      if (wsConnection) {
        wsConnection.close();
        setWsConnection(null);
      }
    };
  }, [isEnabled, user]);

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
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`max-w-sm w-full border rounded-lg shadow-lg pointer-events-auto ${getNotificationColor(notification.type)}`}
          >
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold truncate">
                      {notification.title}
                    </h4>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm opacity-90 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
