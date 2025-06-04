import Image from "next/image";

interface ChatPromptProps {
  avatar: string;
  name: string;
  status?: string;
  onClick: () => void;
}

export function ChatPrompt({ avatar, name, status, onClick }: ChatPromptProps) {
  return (
    <div
      className="fixed bottom-4 left-4 flex items-center bg-white rounded-full shadow-lg px-4 py-2 cursor-pointer z-[9999] transition hover:shadow-xl min-w-[220px]"
      onClick={onClick}
    >
      <Image src={avatar || "/placeholder.svg"} alt={name} width={40} height={40} className="rounded-full border" />
      <div className="ml-3">
        <div className="font-semibold text-gray-900">Message {name}</div>
        <div className="text-xs text-gray-500">{status || "Online"}</div>
      </div>
    </div>
  );
} 