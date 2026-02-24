import { useState } from 'react';

type Site = 'swankyboyz' | 'vaughnsterlingtours' | 'vaughnsterling';

interface UseNewsletterReturn {
  subscribe: (email: string, site: Site, leadMagnet?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useNewsletter = (): UseNewsletterReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subscribe = async (email: string, site: Site, leadMagnet?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      
      const response = await fetch(`${apiUrl}/api/newsletter-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, site, leadMagnet })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to subscribe');
        return false;
      }

      if (data?.error) {
        setError(data.error);
        return false;
      }

      setSuccess(true);
      return true;
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error, success };
};
