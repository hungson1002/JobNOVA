import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ChatAvatarProps {
  avatar: string;
  name: string;
  unreadCount: number;
  onClick: () => void;
}

export function ChatAvatar({ avatar, name, unreadCount, onClick }: ChatAvatarProps) {
  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <Image
        src={avatar || "/placeholder.svg"}
        alt={name}
        width={40}
        height={40}
        className="rounded-full h-10 w-10"
      />
      {unreadCount > 0 && (
        <Badge className="absolute top-0 right-0 h-5 w-5 rounded-full bg-emerald-500 p-0 text-center text-xs">
          {unreadCount}
        </Badge>
      )}
    </div>
  );
}