"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export function ProtectedRoute() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isSignedIn && user) {
      const publicMetadata = user.publicMetadata || {}
      const isAdmin = publicMetadata.isAdmin
      const isSeller = publicMetadata.isSeller
      const isBuyer = publicMetadata.isBuyer

      // Nếu không có role nào thì chuyển đến select-role
      if (!isAdmin && !isSeller && !isBuyer) {
        router.push("/select-role")
      }
    }
  }, [user, pathname, router, isSignedIn])

  return null
}
