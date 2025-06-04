import { useState, useEffect } from 'react';

interface User {
  id: string;
  clerk_id: string;
  user_roles: string[];
  username?: string | null;
  name?: string | null;
  avatar?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8800/api/users/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setError(null);
        } else if (response.status === 404) {
          // User not authenticated is not an error
          setUser(null);
          setError(null);
        } else {
          setUser(null);
          setError('Authentication failed');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isAdmin = user?.user_roles?.includes('admin') || false;

  return {
    user,
    loading,
    error,
    isAdmin,
  };
} 