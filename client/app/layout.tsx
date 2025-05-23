"use client"

import { ClerkProvider, useUser } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"
import { Toaster } from 'sonner'

import { BannedOverlay } from "@/components/BannedOverlay"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { RoleCheck } from "@/components/role-check"
import { CurrencyProvider } from "@/context/currency-context"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

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

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className={inter.className} suppressHydrationWarning>
          <Toaster richColors position="top-center" />
          <CurrencyProvider>
            <RoleCheck />
            {!isAdminRoute && <Navbar />}
            <BannedLayout>
              {children}
            </BannedLayout>
            {!isAdminRoute && <Footer />}
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
