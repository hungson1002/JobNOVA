import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

interface Portfolio {
  id: number;
  title: string;
  description: string;
  portfolio_url: string;
  portfolio_size?: number;
  portfolio_type?: string;
  created_at: string;
}

interface PortfolioSectionProps {
  clerkId: string;
}

export function PortfolioSection({ clerkId }: PortfolioSectionProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await fetch(`http://localhost:8800/api/portfolios/${clerkId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch portfolios');
        }
        const data = await response.json();
        setPortfolios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolios');
      } finally {
        setLoading(false);
      }
    };

    if (clerkId) {
      fetchPortfolios();
    }
  }, [clerkId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading portfolios: {error}
      </div>
    );
  }

  if (portfolios.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Portfolio</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium">{portfolio.title}</h4>
              {portfolio.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {portfolio.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {portfolio.portfolio_type && (
                    <span className="mr-2">{portfolio.portfolio_type}</span>
                  )}
                  {portfolio.portfolio_size && (
                    <span>{Math.round(portfolio.portfolio_size / 1024)} KB</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  asChild
                >
                  <a
                    href={portfolio.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 