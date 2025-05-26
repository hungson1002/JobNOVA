"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useClerk } from '@clerk/nextjs';

const sidebarItems = [
  { label: "Dashboard", href: "/admin/admin-dashboard" },
  { label: "Manager User", href: "/admin/manage-users" },
  { label: "Manager Service", href: "/admin/manage-gigs" },
  { label: "Order Management", href: "/admin/manage-orders" },
  { label: "Category Management", href: "/admin/manage-categories" },
  { label: "Report Management", href: "/admin/manage-reports" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-[#e6f4f1]">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col p-6 fixed inset-y-0 left-0 z-30">
        <div className="mb-10 flex items-center gap-2">
          <span className="text-2xl font-bold text-teal-600">Admin Panel</span>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${
                    pathname === item.href
                      ? "bg-teal-500 text-white"
                      : "hover:bg-teal-100 text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
        >
          Đăng xuất
        </button>
      </aside>
      {/* Main content */}
      <main className="flex-1 ml-0 md:ml-64 p-8 transition-all w-full">{children}</main>
    </div>
  );
} 