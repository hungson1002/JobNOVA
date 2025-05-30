"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RoleCheckProps {
  children: React.ReactNode;
}

export function RoleCheck({ children }: RoleCheckProps) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const isAdmin = user?.publicMetadata?.isAdmin
      const isSeller = user?.publicMetadata?.isSeller
      const isBuyer = user?.publicMetadata?.isBuyer

      if (!isAdmin && !isSeller && !isBuyer) {
        router.push("/select-role")
      }
    }
  }, [isLoaded, isSignedIn, user, router])

  return <>{children}</>
}
