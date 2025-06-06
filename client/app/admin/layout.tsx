"use client"

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useClerk } from '@clerk/nextjs';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ShoppingBag, 
  FolderKanban, 
  FileBarChart, 
  LogOut,
  Menu,
  X,
  Images,
  Star,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const sidebarItems = [
  { 
    label: "Manager User", 
    href: "/admin/manage-users",
    icon: <Users className="h-5 w-5" />
  },
  { 
    label: "Manager Service", 
    href: "/admin/manage-gigs",
    icon: <Briefcase className="h-5 w-5" />
  },
  { 
    label: "Top Rate Management", 
    href: "/admin/manage-top-rate",
    icon: <Star className="h-5 w-5" />
  },
  { 
    label: "Order Management", 
    href: "/admin/manage-orders",
    icon: <ShoppingBag className="h-5 w-5" />
  },
  { 
    label: "Category Management", 
    href: "/admin/manage-categories",
    icon: <FolderKanban className="h-5 w-5" />
  },
  {
    label: "Banner Slides",
    href: "/admin/manage-slides",
    icon: <Images className="h-5 w-5" />
  },
  { 
    label: "Report Management", 
    href: "/admin/manage-reports",
    icon: <FileBarChart className="h-5 w-5" />
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#f8fafc] text-gray-900'}`}>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed left-4 top-4 z-50 p-2 rounded-md shadow-md ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col shadow-xl rounded-r-3xl transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-72'}
          ${darkMode ? 'bg-gray-800' : 'bg-white'}
          border-r
        `}
      >
        {/* Logo + Toggle */}
        <div className="h-16 flex items-center gap-3 px-4 border-b shrink-0 justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded shadow-md" />
            {!collapsed && <span className="text-lg font-bold text-emerald-600">Admin Panel</span>}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>
        {/* Navigation */}
        <TooltipProvider>
          <nav className="flex-1 overflow-y-auto py-8 px-2 lg:px-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.href}>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:scale-105 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40
                          ${pathname === item.href ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-600' : 'text-gray-600 dark:text-gray-200'}
                          ${collapsed ? 'justify-center' : ''}
                        `}
                      >
                        {item.icon}
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="text-sm font-semibold">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              ))}
            </ul>
          </nav>
        </TooltipProvider>
        {/* Logout button */}
        <div className={`p-4 border-t mt-auto shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      {/* Main content */}
      <main className="flex-1 overflow-y-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex justify-end items-center mb-8">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
} 