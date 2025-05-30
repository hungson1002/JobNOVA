import React, { createContext, useContext, useState } from "react";

export interface Notification {
  id: string;
  type: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
  title?: string;
  gig_id?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (n: Notification) => setNotifications((prev) => [n, ...prev]);
  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markAsRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAllAsRead, markAsRead }}
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