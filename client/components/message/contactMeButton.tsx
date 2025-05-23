import { Button } from "@/components/ui/button";

interface ContactMeButtonProps {
  onClick: () => void;
}

export function ContactMeButton({ onClick }: ContactMeButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
    >
      Contact Me
    </Button>
  );
}