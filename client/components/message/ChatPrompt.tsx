import Image from "next/image";
import io from "socket.io-client";
import { useEffect, useState } from "react";

interface ChatPromptProps {
  avatar: string;
  name: string;
  status?: string;
  onClick: () => void;
  userId?: string;
}

export function ChatPrompt({ avatar, name, status, onClick, userId }: ChatPromptProps) {
  const [isOnline, setIsOnline] = useState(false);
  useEffect(() => {
    const socket = io("http://localhost:8800");
    const id = userId || name;
    function handleOnline({ userId }: { userId: string }) {
      if (userId === id) setIsOnline(true);
    }
    function handleOffline({ userId }: { userId: string }) {
      if (userId === id) setIsOnline(false);
    }
    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    socket.emit("checkOnline", { userId: id }, (online: boolean) => setIsOnline(online));
    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
      socket.disconnect();
    };
  }, [userId, name]);
  return (
    <div
      className="fixed bottom-4 left-4 flex items-center bg-white rounded-full shadow-lg px-4 py-2 cursor-pointer z-[9999] transition hover:shadow-xl min-w-[220px]"
      onClick={onClick}
    >
      <Image src={avatar || "/placeholder.svg"} alt={name} width={40} height={40} className="rounded-full border" />
      <div className="ml-3">
        <div className="font-semibold text-gray-900">Message {name}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isOnline ? "bg-emerald-500" : "bg-gray-300"}`}></span>
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>
    </div>
  );
} 