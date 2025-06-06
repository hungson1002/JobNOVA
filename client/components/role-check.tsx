"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface RoleCheckProps {
  children: React.ReactNode;
}

export function RoleCheck({ children }: RoleCheckProps) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const isAdmin = user?.publicMetadata?.isAdmin
      const isSeller = user?.publicMetadata?.isSeller
      const isBuyer = user?.publicMetadata?.isBuyer

      // Nếu là admin thì chuyển hướng vào trang admin
      if (isAdmin && !pathname.startsWith("/admin")) {
        router.push("/admin/manage-users")
        return;
      }

      if (!isAdmin && !isSeller && !isBuyer) {
        router.push("/select-role")
      }
    }
  }, [isLoaded, isSignedIn, user, router, pathname])

  return <>{children}</>
}
