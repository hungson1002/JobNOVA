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
  Images
} from 'lucide-react';
import { useState } from 'react';

const sidebarItems = [
  { 
    label: "Dashboard", 
    href: "/admin/admin-dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />
  },
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

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed left-4 top-4 z-50 p-2 rounded-md bg-white shadow-md hover:bg-gray-100"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5 text-gray-600" />
        ) : (
          <Menu className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
        {/* Logo section */}
        <div className="h-16 flex items-center gap-3 px-8 border-b shrink-0">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded" />
          <span className="text-lg font-bold text-emerald-600">Admin Panel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-8 px-6">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${pathname === item.href 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="p-6 border-t mt-auto shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
} 