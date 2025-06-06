"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Users,
  BarChart3,
  FileText,
  HelpCircle,
  Menu,
  X,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function DashboardSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false) // For demo purposes
  const { user, isSignedIn } = useUser();

  const userLinks = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "My Orders",
      href: "/dashboard",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "Messages",
      href: "/messages",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: 3,
    },
    {
      title: "Saved",
      href: "/saved",
      icon: <Heart className="h-5 w-5" />,
    },
  ]

  const sellerLinks = [
    {
      title: "Seller Dashboard",
      href: "/seller-dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "My Gigs",
      href: "/seller-dashboard?tab=gigs",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Orders to Fulfill",
      href: "/seller-dashboard?tab=orders",
      icon: <Package className="h-5 w-5" />,
      badge: 2,
    },
  ]

  const adminLinks = [
    {
      title: "Manage Users",
      href: "/admin?tab=users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Manage Services",
      href: "/admin?tab=services",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Manage Orders",
      href: "/admin?tab=orders",
      icon: <Package className="h-5 w-5" />,
    },
  ]

  const bottomLinks = [
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Help & Support",
      href: "/help",
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ]

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button variant="outline" size="icon" onClick={toggleSidebar} className="rounded-full bg-white shadow-md">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* User Profile */}
          <div className="flex items-center gap-3 p-4">
            <Image
              src={user?.imageUrl || "/placeholder.svg?height=40&width=40"}
              alt="User"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <div className="font-medium">
                {(user?.firstName || user?.lastName)
                  ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                  : "User"}
              </div>
              <div className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress || ""}</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col gap-1">
              {/* Buyer Section */}
              <div className="mb-4">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">BUYER</h3>
                {userLinks
                  .filter(link => link.title !== "Dashboard")
                  .map((link) => (
                    <SidebarLink
                      key={link.title}
                      href={link.href}
                      icon={link.icon}
                      title={link.title}
                      isActive={pathname === link.href}
                      badge={link.badge}
                    />
                  ))}
              </div>

              {/* Seller Section */}
              <div className="mb-4">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">SELLER</h3>
                <SidebarLink
                  key={sellerLinks[0].title}
                  href={sellerLinks[0].href}
                  icon={sellerLinks[0].icon}
                  title={sellerLinks[0].title}
                  isActive={pathname === sellerLinks[0].href}
                />
                <Button asChild variant="ghost" className="w-full justify-start pl-2 text-emerald-600">
                  <Link href="/create-gig" className="flex items-center gap-2">
                    <ChevronRight className="h-5 w-5" />
                    <span>Create a New Gig</span>
                  </Link>
                </Button>
              </div>

              {/* Admin Section (conditionally rendered) */}
              {isAdmin && (
                <div className="mb-4">
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">Admin</h3>
                  {adminLinks.map((link) => (
                    <SidebarLink
                      key={link.title}
                      href={link.href}
                      icon={link.icon}
                      title={link.title}
                      isActive={pathname === link.href}
                    />
                  ))}
                </div>
              )}
            </nav>
          </div>

          {/* Bottom Links */}
          <div className="border-t p-4">
            <nav className="flex flex-col gap-1">
              {bottomLinks.map((link) => (
                <SidebarLink
                  key={link.title}
                  href={link.href}
                  icon={link.icon}
                  title={link.title}
                  isActive={pathname === link.href}
                />
              ))}
              <Button variant="ghost" className="w-full justify-start pl-2 text-red-600">
                <LogOut className="mr-2 h-5 w-5" />
                <span>Logout</span>
              </Button>
            </nav>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={toggleSidebar} aria-hidden="true"></div>
      )}
    </>
  )
}

interface SidebarLinkProps {
  href: string
  icon: React.ReactNode
  title: string
  badge?: number
  isActive?: boolean
}

function SidebarLink({ href, icon, title, badge, isActive }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium ${
        isActive ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <div className="flex items-center">
        <span className="mr-2">{icon}</span>
        <span>{title}</span>
      </div>
      {badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1 text-xs font-medium text-emerald-700">
          {badge}
        </span>
      )}
    </Link>
  )
}
