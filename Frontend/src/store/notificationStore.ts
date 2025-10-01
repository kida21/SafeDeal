import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '../types';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number | string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number | string) => void;
  clearAllNotifications: () => void;
  updateNotificationReadStatus: (id: number | string, read: boolean) => void;
}

// ✅ Helper function to sort: unread first, then newest first
const sortNotifications = (notifications: Notification[]) => {
  return [...notifications].sort((a, b) => {
    // unread first
    if (a.read !== b.read) return a.read ? 1 : -1;
    // newest first by created_at
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      setNotifications: (notifications) => {
        const sorted = sortNotifications(notifications);
        const unreadCount = sorted.filter((n) => !n.read).length;
        set({ notifications: sorted, unreadCount });
      },

      addNotification: (notification) => {
        const { notifications } = get();
        // prevent duplicates
        const exists = notifications.some((n) => n.id === notification.id);
        if (exists) return;

        const updated = [notification, ...notifications];
        const sorted = sortNotifications(updated);
        const unreadCount = sorted.filter((n) => !n.read).length;

        set({ notifications: sorted, unreadCount });
      },

      markAsRead: (id) => {
        const { notifications } = get();
        const updated = notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        const sorted = sortNotifications(updated);
        const unreadCount = sorted.filter((n) => !n.read).length;

        set({ notifications: sorted, unreadCount });
      },

      markAllAsRead: () => {
        const { notifications } = get();
        const updated = notifications.map((n) => ({ ...n, read: true }));
        const sorted = sortNotifications(updated);

        set({ notifications: sorted, unreadCount: 0 });
      },

      deleteNotification: (id) => {
        const { notifications } = get();
        const updated = notifications.filter((n) => n.id !== id);
        const sorted = sortNotifications(updated);
        const unreadCount = sorted.filter((n) => !n.read).length;

        set({ notifications: sorted, unreadCount });
      },

      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      updateNotificationReadStatus: (id, read) => {
        const { notifications } = get();
        const updated = notifications.map((n) =>
          n.id === id ? { ...n, read } : n
        );
        const sorted = sortNotifications(updated);
        const unreadCount = sorted.filter((n) => !n.read).length;

        set({ notifications: sorted, unreadCount });
      },
}),
{
  name: 'notification-storage',
  // Only persist notifications and unreadCount for immediate availability
  partialize: (state) => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
  }),
}
));
