import { useRef, useState } from "react";
import Image from "next/image";
import { X, Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Message } from "@/hooks/useMessages";

interface ChatBubbleProps {
  userId: string;
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
    <div className="fixed bottom-4 left-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col z-[9999]">
      {!isMinimized && (
        <>
          <div className="p-2 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src={avatar || "/placeholder.svg"}
                alt={name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="font-semibold">{name}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
                <span>-</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div ref={chatRef} className="flex-1 p-2 overflow-y-auto max-h-60">
            {messages.map((msg, index) => (
              <div
                key={msg.id ? msg.id : `${msg.sender_clerk_id}-${msg.sent_at}-${index}`}
                className={`mb-2 ${msg.sender_clerk_id === userId ? "text-left" : "text-right"}`}
              >
                <span
                  className={`p-2 rounded-lg ${
                    msg.sender_clerk_id === userId ? "bg-gray-100" : "bg-emerald-100"
                  }`}
                >
                  {msg.message_content}
                </span>
                <div className="text-xs text-gray-500">{!msg.sent_at || isNaN(Date.parse(msg.sent_at)) ? "..." : formatTime(msg.sent_at)}</div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
              placeholder="Type a message..."
              className="flex-1 mr-2"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0">
                    <Smile className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button onClick={handleSend} size="sm" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
      {isMinimized && (
        <div className="p-2 flex items-center gap-2 cursor-pointer" onClick={onToggleMinimize}>
          <Image
            src={avatar || "/placeholder.svg"}
            alt={name}
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-semibold">{name}</span>
        </div>
      )}
    </div>
  );
}