import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Message } from "@/hooks/useMessages";

interface MessageThreadProps {
  messages: Message[];
  recipient: { id: string; name: string; avatar: string; online?: boolean };
  onSendMessage: (content: string) => void;
}

export function MessageThread({ messages, recipient, onSendMessage }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    <div className="flex h-full flex-col rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Image
              src={recipient.avatar || "/placeholder.svg"}
              alt={recipient.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            {recipient.online && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900"></span>
            )}
          </div>
          <div>
            <h3 className="font-medium">{recipient.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {recipient.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
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
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_clerk_id === recipient.id ? "justify-start" : "justify-end"}`}
              >
                {message.sender_clerk_id === recipient.id && (
                  <Image
                    src={recipient.avatar || "/placeholder.svg"}
                    alt={recipient.name}
                    width={32}
                    height={32}
                    className="mr-2 h-8 w-8 rounded-full"
                  />
                )}
                <div className="max-w-[70%]">
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender_clerk_id === recipient.id
                        ? "bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        : "bg-emerald-500 text-white dark:bg-emerald-600"
                    }`}
                  >
                    <p>{message.message_content}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
                    <span>{formatTime(message.sent_at)}</span>
                    {message.sender_clerk_id !== recipient.id && (
                      <span>{message.is_read ? "Read" : "Sent"}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 dark:border-gray-800">
        <form onSubmit={handleSend} className="flex gap-2">
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
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
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
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="shrink-0 bg-emerald-500 hover:bg-emerald-600"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}