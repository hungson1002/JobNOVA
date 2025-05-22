import Link from "next/link"
import Image from "next/image"
import { Home, Search } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="max-w-md">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F7F9FA] opacity-50 rounded-full blur-xl" />
          <Image
            src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
            alt="404 Illustration"
            width={400}
            height={400}
            className="mx-auto"
          />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-emerald-500">Oops! Page not found</h1>
        <p className="mb-8 text-gray-600">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Browse Services
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
