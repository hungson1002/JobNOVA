import { useEffect, useState } from 'react';

export function useProfile(clerkId: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clerkId) return;
    setLoading(true);
    fetch(`/api/users/${clerkId}/profile`)
      .then(res => res.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [clerkId]);

  return { profile, loading, error };
}
