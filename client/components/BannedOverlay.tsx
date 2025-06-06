import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { Phone, Mail, MessageSquare, FileText, X } from "lucide-react";

export function BannedOverlay() {
  const { signOut } = useClerk();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
      <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Your account has been banned</h2>
        <p className="mb-6">Please contact admin for more details or submit a support request.</p>
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowModal(true)}
          >
            Contact Support
          </Button>
          <Button
            className="w-full"
            variant="destructive"
            onClick={() => signOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center mb-4">
              <MessageSquare className="w-12 h-12 text-emerald-500 mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-gray-800">Contact Support</h3>
              <p className="mb-4 text-gray-500 text-center">
                You can contact us via the following channels:
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <Phone className="w-6 h-6 text-emerald-500" />
                <a href="tel:+15551234567" className="font-medium text-gray-700 hover:underline">
                  +1 (555) 123-4567
                </a>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <Mail className="w-6 h-6 text-emerald-500" />
                <a href="mailto:support@example.com" className="font-medium text-gray-700 hover:underline">
                  support@example.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 