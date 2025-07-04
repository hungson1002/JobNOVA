import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface Notification {
  id: string;
  type: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
  title?: string;
  gig_id?: number;
  is_read?: boolean;
  notification_type?: string;
  created_at?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { userId, getToken } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:8800/api/notifications?clerk_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(
        data.notifications.sort((a: Notification, b: Notification) =>
          new Date(b.time || b.created_at || '').getTime() - new Date(a.time || a.created_at || '').getTime()
        )
      );
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, getToken]);

  const addNotification = (n: Notification) => setNotifications((prev) => [n, ...prev]);

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:8800/api/notifications/mark-all-as-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clerk_id: userId }),
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!userId) return;
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:8800/api/notifications/${id}/mark-as-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clerk_id: userId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Fetch notifications when userId changes
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAllAsRead, markAsRead, fetchNotifications, loading }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}; 