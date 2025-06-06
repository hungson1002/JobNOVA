"use client"

import { useRouter } from "next/navigation"
import { LogOut, User, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  const router = useRouter()
  const { user } = useUser()

  const isAdmin = user?.publicMetadata?.isAdmin
  const isSeller = user?.publicMetadata?.isSeller
  const isBuyer = user?.publicMetadata?.isBuyer

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-emerald-50">
          <Image
            src="/placeholder.svg?height=32&width=32"
            alt="User"
            width={32}
            height={32}
            className="rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <Shield className="h-4 w-4 text-blue-500" />
              <span>Admin Account</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-emerald-500" />
              <span>User Account</span>
            </>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isAdmin ? (
          <>
            <DropdownMenuItem>
              <Link href="/admin/manage-gigs" className="w-full">
                Manage Gigs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/admin/manage-users" className="w-full">
                Manage Users
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem>
              <Link href="/dashboard/user" className="w-full">
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/orders" className="w-full">
                Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/saved" className="w-full">
                Saved Services
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="w-full">
                Settings
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/select-role" className="flex w-full items-center gap-2 text-amber-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Switch Role
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <button
            onClick={() => {
              router.push("/select-role")
            }}
            className="flex w-full items-center gap-2 text-red-500"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 