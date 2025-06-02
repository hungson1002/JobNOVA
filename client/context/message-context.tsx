import React, { createContext, useContext, ReactNode } from "react";
import { useMessages, Message, Ticket } from "@/hooks/useMessages";

interface MessageContextType {
  messages: Message[];
  tickets: Ticket[];
  chatWindows: any[];
  setChatWindows: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  error: string | null;
  sendMessage: (...args: any[]) => Promise<any>;
  markMessagesAsRead: (...args: any[]) => void;
  fetchMessagesData: (...args: any[]) => Promise<Message[]>;
  fetchTicketsData: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const message = useMessages({});
  return (
    <MessageContext.Provider value={message}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessageContext must be used within a MessageProvider");
  return ctx;
} 