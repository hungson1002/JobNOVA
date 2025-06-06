import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { X, Send, Paperclip, Smile, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Message } from "@/hooks/useMessages";
import io from "socket.io-client";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatBubbleProps {
  userId: string;
  recipientId?: string;
  messages: Message[];
  avatar: string;
  name: string;
  onSendMessage: (content: string) => void;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function ChatBubble({
  userId,
  recipientId,
  messages,
  avatar,
  name,
  onSendMessage,
  onClose,
  isMinimized,
  onToggleMinimize,
}: ChatBubbleProps) {
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerMounted, setEmojiPickerMounted] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io("http://localhost:8800");
    const id = recipientId || userId;
    function handleOnline({ userId: idCheck }: { userId: string }) {
      if (idCheck === id) setIsOnline(true);
    }
    function handleOffline({ userId: idCheck }: { userId: string }) {
      if (idCheck === id) setIsOnline(false);
    }
    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    socket.emit("checkOnline", { userId: id }, (online: boolean) => setIsOnline(online));
    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
      socket.disconnect();
    };
  }, [recipientId, userId]);

  useEffect(() => {
    setEmojiPickerMounted(true);
  }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-4 left-4 w-96 max-w-[95vw] bg-white rounded-2xl shadow-2xl flex flex-col z-[9999] border border-gray-200 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-50 to-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <Image
            src={avatar || "/placeholder.svg"}
            alt={name}
            width={44}
            height={44}
            className="rounded-full border-2 border-emerald-200 shadow"
          />
          <div>
            <div className="font-semibold text-gray-900 text-base leading-tight">{name}</div>
            <div className="text-xs font-medium flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isOnline ? "bg-emerald-500" : "bg-gray-300"}`}></span>
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* Chat content */}
      <div ref={chatRef} className="flex-1 p-4 overflow-y-auto max-h-72 bg-white rounded-b-xl custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 py-8">
            <span className="mb-2">No messages yet</span>
            <span className="text-xs">Start the conversation!</span>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isMe = msg.sender_clerk_id === userId;
              return (
                <div
                  key={msg.id ? msg.id : `${msg.sender_clerk_id}-${msg.sent_at}-${index}`}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl shadow text-sm max-w-[70%] break-words ${
                      isMe
                        ? "bg-emerald-100 text-emerald-900 rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    {msg.message_content}
                    <div className="text-[10px] text-gray-400 mt-1 text-right">{formatTime(msg.sent_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t bg-white rounded-b-2xl">
        <div className="relative" ref={emojiRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Insert emoji"
          >
            😊
          </button>
          {emojiPickerMounted && (
            <div
              className="absolute bottom-full left-0 z-50"
              style={{ display: showEmojiPicker ? "block" : "none" }}
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} autoFocusSearch={false} />
            </div>
          )}
        </div>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border-2 border-emerald-200 focus:border-emerald-500 bg-gray-50 px-4 text-sm"
        />
        <button type="submit" className="p-2 bg-green-300 rounded-full hover:bg-green-400 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}