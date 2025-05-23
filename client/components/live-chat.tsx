// "use client"

// import type React from "react"

// import { useState, useRef, useEffect } from "react"
// import Image from "next/image"
// import { Send, Smile, Paperclip, Check, CheckCheck } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// interface Message {
//   id: string
//   text: string
//   sender: "me" | "other"
//   time: string
//   status: "sending" | "sent" | "delivered" | "read"
// }

// interface ChatProps {
//   recipient: {
//     id: string
//     name: string
//     avatar: string
//     online?: boolean
//   }
//   initialMessages?: Message[]
//   className?: string
// }

// export function LiveChat({ recipient, initialMessages = [], className }: ChatProps) {
//   const [messages, setMessages] = useState<Message[]>(initialMessages)
//   const [newMessage, setNewMessage] = useState("")
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   // Scroll to bottom of messages when new message is added
//   useEffect(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
//     }
//   }, [messages])

//   const handleSendMessage = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!newMessage.trim()) return

//     // Create a new message with "sending" status
//     const message: Message = {
//       id: `msg-${Date.now()}`,
//       text: newMessage,
//       sender: "me",
//       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//       status: "sending",
//     }

//     setMessages([...messages, message])
//     setNewMessage("")

//     // Simulate message being sent and then delivered
//     setTimeout(() => {
//       setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "sent" } : msg)))

//       // Simulate message being delivered
//       setTimeout(() => {
//         setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "delivered" } : msg)))

//         // Simulate message being read
//         setTimeout(() => {
//           setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "read" } : msg)))

//           // Simulate recipient typing and sending a response
//           setTimeout(() => {
//             const response: Message = {
//               id: `msg-${Date.now()}`,
//               text: "Thanks for your message! I'll get back to you shortly.",
//               sender: "other",
//               time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//               status: "read",
//             }
//             setMessages((prev) => [...prev, response])
//           }, 2000)
//         }, 1000)
//       }, 1000)
//     }, 1000)
//   }

//   const getStatusIcon = (status: Message["status"]) => {
//     switch (status) {
//       case "sending":
//         return <div className="h-3 w-3 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
//       case "sent":
//         return <Check className="h-3 w-3 text-gray-400" />
//       case "delivered":
//         return <CheckCheck className="h-3 w-3 text-gray-400" />
//       case "read":
//         return <CheckCheck className="h-3 w-3 text-emerald-500" />
//       default:
//         return null
//     }
//   }

//   return (
//     <div
//       className={`flex h-full flex-col rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}
//     >
//       {/* Chat Header */}
//       <div className="flex items-center justify-between border-b p-3 dark:border-gray-800">
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Image
//               src={recipient.avatar || "/placeholder.svg"}
//               alt={recipient.name}
//               width={40}
//               height={40}
//               className="rounded-full"
//             />
//             {recipient.online && (
//               <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900"></span>
//             )}
//           </div>
//           <div>
//             <h3 className="font-medium">{recipient.name}</h3>
//             <p className="text-xs text-gray-500 dark:text-gray-400">{recipient.online ? "Online" : "Offline"}</p>
//           </div>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
//         {messages.length === 0 ? (
//           <div className="flex h-full flex-col items-center justify-center">
//             <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
//               <Send className="h-8 w-8 text-gray-400" />
//             </div>
//             <h3 className="mb-2 text-lg font-semibold">No messages yet</h3>
//             <p className="text-center text-gray-600 dark:text-gray-400">
//               Send a message to start the conversation with {recipient.name}
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {messages.map((message) => (
//               <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
//                 {message.sender !== "me" && (
//                   <Image
//                     src={recipient.avatar || "/placeholder.svg"}
//                     alt={recipient.name}
//                     width={32}
//                     height={32}
//                     className="mr-2 h-8 w-8 rounded-full"
//                   />
//                 )}
//                 <div className="max-w-[70%]">
//                   <div
//                     className={`rounded-lg p-3 ${
//                       message.sender === "me"
//                         ? "bg-emerald-500 text-white dark:bg-emerald-600"
//                         : "bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200"
//                     }`}
//                   >
//                     <p>{message.text}</p>
//                   </div>
//                   <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500">
//                     <span>{message.time}</span>
//                     {message.sender === "me" && getStatusIcon(message.status)}
//                   </div>
//                 </div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>
//         )}
//       </div>

//       {/* Message Input */}
//       <div className="border-t p-3 dark:border-gray-800">
//         <form onSubmit={handleSendMessage} className="flex gap-2">
//           <TooltipProvider>
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <Button type="button" variant="ghost" size="icon" className="shrink-0">
//                   <Paperclip className="h-5 w-5" />
//                 </Button>
//               </TooltipTrigger>
//               <TooltipContent>
//                 <p>Attach file</p>
//               </TooltipContent>
//             </Tooltip>
//           </TooltipProvider>

//           <Input
//             type="text"
//             placeholder="Type a message..."
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             className="flex-1"
//           />

//           <TooltipProvider>
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <Button type="button" variant="ghost" size="icon" className="shrink-0">
//                   <Smile className="h-5 w-5" />
//                 </Button>
//               </TooltipTrigger>
//               <TooltipContent>
//                 <p>Add emoji</p>
//               </TooltipContent>
//             </Tooltip>
//           </TooltipProvider>

//           <Button type="submit" disabled={!newMessage.trim()} className="shrink-0 bg-emerald-500 hover:bg-emerald-600">
//             <Send className="h-5 w-5" />
//           </Button>
//         </form>
//       </div>
//     </div>
//   )
// }


"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, Smile, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Message } from "@/hooks/useMessages";

interface LiveChatProps {
  recipient: {
    id: string;
    name: string;
    avatar: string;
    online?: boolean;
  };
  messages: Message[];
  onSendMessage: (content: string) => void;
  className?: string;
}

export function LiveChat({ recipient, messages, onSendMessage, className }: LiveChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
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
    <div
      className={`flex h-full flex-col rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900 ${className || ""}`}
    >
      {/* Chat Header */}
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

      {/* Message Input */}
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