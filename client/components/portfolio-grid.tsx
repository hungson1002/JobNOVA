"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  portfolio_images: string[];
  category?: {
    id: number;
    name: string;
  };
  gig?: {
    id: number;
    title: string;
  };
}

interface PortfolioGridProps {
  portfolios: PortfolioItem[];
  clerkId: string;
  isOwner?: boolean;
  isSeller?: boolean;
}

export function PortfolioGrid({ 
  portfolios, 
  clerkId, 
  isOwner = false, 
  isSeller = false,
}: PortfolioGridProps) {
  // Calculate how many placeholders needed
  const maxSlots = 4;
  const showAdd = isOwner && isSeller;
  const portfoliosToShow = portfolios.slice(0, maxSlots - (showAdd ? 1 : 0));
  const placeholders = Array(maxSlots - portfoliosToShow.length - (showAdd ? 1 : 0)).fill(null);

  // Modal state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openModal = (idx: number) => setSelectedIndex(idx);
  const closeModal = () => setSelectedIndex(null);
  const prevPortfolio = () => setSelectedIndex((prev) => prev === null ? null : (prev - 1 + portfoliosToShow.length) % portfoliosToShow.length);
  const nextPortfolio = () => setSelectedIndex((prev) => prev === null ? null : (prev + 1) % portfoliosToShow.length);

  if (!portfoliosToShow.length) {
    return <div className="text-gray-500">No portfolio found for this gig.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {showAdd && (
          <Link href="/create-portfolio">
            <Card className="aspect-square relative overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-gray-400">
              <Plus className="h-8 w-8 mb-2" />
              <span className="text-sm">Add a Project</span>
            </Card>
          </Link>
        )}
        {portfoliosToShow.map((portfolio, idx) => (
          <Card key={portfolio.id} className="relative overflow-hidden group cursor-pointer" onClick={() => openModal(idx)}>
            <div className="aspect-square relative">
              <Image
                src={portfolio.portfolio_images[0] || '/placeholder.svg'}
                alt={portfolio.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <h3 className="font-semibold mb-2">{portfolio.title}</h3>
                  {portfolio.description && (
                    <p className="text-sm line-clamp-2">{portfolio.description}</p>
                  )}
                  {portfolio.gig && (
                    <Link
                      href={`/gigs/${portfolio.gig.id}`}
                      className="inline-flex items-center mt-2 text-sm hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      View Related Gig
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {placeholders.map((_, idx) => (
          <Card key={`placeholder-${idx}`} className="aspect-square flex items-center justify-center bg-gray-100">
            <span className="text-gray-300">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect width="100%" height="100%" fill="#e5e7eb"/><path d="M4 17l6-6 4 4 6-6" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </Card>
        ))}
      </div>
      <div className="text-left mt-2">
        <Button variant="link" asChild>
          <Link href={`/users/${clerkId}/portfolio`} className="text-emerald-600 font-medium">
            See Projects &rarr;
          </Link>
        </Button>
      </div>

      {/* Modal chi tiết portfolio */}
      {selectedIndex !== null && portfoliosToShow[selectedIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="absolute top-4 right-4">
            <button onClick={closeModal} className="bg-white/20 hover:bg-white/40 rounded-full p-2">
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <button onClick={prevPortfolio} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button onClick={nextPortfolio} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2">
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-8 relative flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Made by</span>
              <Link href={`/users/${clerkId}`} className="font-semibold hover:underline">User</Link>
            </div>
            <h2 className="text-2xl font-bold mb-2">{portfoliosToShow[selectedIndex].title}</h2>
            <p className="text-gray-600 mb-4">{portfoliosToShow[selectedIndex].description}</p>
            <div className="w-full flex justify-center mb-4">
              <Image
                src={portfoliosToShow[selectedIndex].portfolio_images[0] || '/placeholder.svg'}
                alt={portfoliosToShow[selectedIndex].title}
                width={400}
                height={300}
                className="object-contain rounded-lg max-h-[400px]"
              />
            </div>
            {portfoliosToShow[selectedIndex].category && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">Project category</span>
                <div>
                  <span className="inline-block mt-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                    {portfoliosToShow[selectedIndex].category.name}
                  </span>
                </div>
              </div>
            )}
            <Button className="mt-4" onClick={closeModal}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
} 