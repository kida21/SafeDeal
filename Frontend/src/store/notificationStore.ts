import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAllNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.read).length;
    set({ notifications, unreadCount });
  },
  
  addNotification: (notification) => {
    const { notifications } = get();
    // Check if notification already exists to prevent duplicates
    const exists = notifications.some(n => n.id === notification.id);
    if (exists) return;
    
    // Add new notification and sort by created_at descending (newest first)
    const updated = [notification, ...notifications];
    const sorted = updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const unreadCount = sorted.filter(n => !n.read).length;
    
    set({ notifications: sorted, unreadCount });
  },
  
  markAsRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: true }
        : notification
    );
    const unreadCount = updated.filter(n => !n.read).length;
    set({ notifications: updated, unreadCount });
  },
  
  markAllAsRead: () => {
    const { notifications } = get();
    const updated = notifications.map(notification => ({ ...notification, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },
  
  deleteNotification: (id) => {
    const { notifications } = get();
    const updated = notifications.filter(notification => notification.id !== id);
    const unreadCount = updated.filter(n => !n.read).length;
    set({ notifications: updated, unreadCount });
  },
  
  clearAllNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
