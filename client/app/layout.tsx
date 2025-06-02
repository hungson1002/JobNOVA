"use client"

import { ClerkProvider, useUser } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"
import { Toaster } from 'sonner'
import { cn } from "@/lib/utils"

import { BannedOverlay } from "@/components/BannedOverlay"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { RoleCheck } from "@/components/role-check"
import { CurrencyProvider } from "@/context/currency-context"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { NotificationProvider } from "@/context/notification-context"
import { MessageProvider } from "@/context/message-context"

const inter = Inter({ subsets: ["latin"] })

function BannedLayout({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetch(`http://localhost:8800/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setIsBanned(!!data.is_banned)
        })
        .catch(() => setIsBanned(false));
    } else {
      setIsBanned(false);
    }
  }, [isSignedIn, user?.id]);

  if (isSignedIn && isBanned) {
    return <BannedOverlay />;
  }
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isMessagesRoute = pathname.startsWith("/messages");

  useEffect(() => {
    if (isMessagesRoute) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isMessagesRoute]);

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)} suppressHydrationWarning>
          <Toaster richColors position="top-center" />
          <NotificationProvider>
            <CurrencyProvider>
              <RoleCheck>
                <MessageProvider>
                  {!isAdminRoute && <Navbar />}
                  <BannedLayout>
                    {children}
                  </BannedLayout>
                  {!isAdminRoute && !isMessagesRoute && <Footer />}
                </MessageProvider>
              </RoleCheck>
            </CurrencyProvider>
          </NotificationProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
