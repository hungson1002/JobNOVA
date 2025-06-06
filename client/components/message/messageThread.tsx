"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Message } from "@/hooks/useMessages";
import io from "socket.io-client";

interface MessageThreadProps {
  messages: Message[];
  recipient: { id: string; name: string; avatar: string; online?: boolean };
  onSendMessage: (content: string) => void;
}

const socket = io("http://localhost:8800");

const MessageThreadComponent = ({
  messages,
  recipient,
  onSendMessage,
}: MessageThreadProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const [online, setOnline] = useState(!!recipient.online);

  // Realtime online status
  useEffect(() => {
    if (!recipient.id) return;
    // Lắng nghe event online/offline
    const handleOnline = ({ userId }: { userId: string }) => {
      if (userId === recipient.id) setOnline(true);
    };
    const handleOffline = ({ userId }: { userId: string }) => {
      if (userId === recipient.id) setOnline(false);
    };
    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    // Hỏi trạng thái online khi mount
    socket.emit("checkOnline", { userId: recipient.id }, (isOnline: boolean) => setOnline(isOnline));
    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
    };
  }, [recipient.id]);

  // Scroll xuống cuối nếu có tin nhắn mới thực sự
  useEffect(() => {
    const node = messagesEndRef.current;
    if (!node) return;
  
    const observer = new ResizeObserver(() => {
      node.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  
    observer.observe(node);
  
    return () => observer.disconnect();
  }, [messages.length]);
  

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-4 border-b p-4 bg-white/80 dark:bg-gray-900/80 rounded-t-2xl shadow-sm">
        <div className="relative group">
          <Image
            src={recipient.avatar || "/placeholder.svg"}
            alt={recipient.name}
            width={56}
            height={56}
            className="rounded-full border-2 border-emerald-100 shadow-md group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:underline cursor-pointer">
            {recipient.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`h-2 w-2 rounded-full ${
                online ? "bg-emerald-500" : "bg-gray-400"
              }`}
            ></span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No messages yet</h3>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Send a message to start the conversation with {recipient.name}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isMe = message.sender_clerk_id !== recipient.id;
              return (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex items-end ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isMe && (
                    <Image
                      src={recipient.avatar || "/placeholder.svg"}
                      alt={recipient.name}
                      width={32}
                      height={32}
                      className="mr-2 h-8 w-8 rounded-full shadow"
                    />
                  )}
                  <div
                    className={`max-w-[70%] flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 shadow-md text-base font-medium break-words ${
                        isMe
                          ? "bg-emerald-500 text-white rounded-br-md"
                          : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-200 rounded-bl-md"
                      }`}
                    >
                      {message.message_content}
                    </div>
                    <div
                      className={`mt-1 flex items-center gap-1 text-xs text-gray-400 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{formatTime(message.sent_at)}</span>
                      {isMe && (
                        <span className="ml-1">
                          {message.is_read ? "Read" : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white/90 dark:bg-gray-900/90 rounded-b-2xl">
        <form onSubmit={handleSend} className="flex gap-3 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 hover:bg-emerald-100 dark:hover:bg-gray-800"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-full border-2 border-gray-200 focus:border-emerald-500 px-4 py-2 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:focus:border-emerald-500 transition"
            autoComplete="off"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 hover:bg-emerald-100 dark:hover:bg-gray-800"
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Insert emoji</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-4 py-2 text-base font-semibold shadow-md transition"
            aria-label="Gửi tin nhắn"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

const MessageThread = memo(MessageThreadComponent);
export default MessageThread;
