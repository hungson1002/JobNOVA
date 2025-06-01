import { useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:8800"); // thay bằng domain thật khi deploy

export function useNotificationSocket(clerkId: string, onReceive: (notification: any) => void) {
  useEffect(() => {
    if (!clerkId) return;

    socket.emit("join_notification_room", clerkId);
    socket.on("new_notification", onReceive);

    return () => {
      socket.off("new_notification", onReceive);
    };
  }, [clerkId, onReceive]);
}
