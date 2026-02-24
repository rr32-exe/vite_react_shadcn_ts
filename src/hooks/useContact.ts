import { useState } from 'react';

interface ContactData {
  name: string;
  email: string;
  message: string;
  service?: string;
  site?: string;
}

interface UseContactReturn {
  submit: (data: ContactData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useContact = (): UseContactReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (data: ContactData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      
      const response = await fetch(`${apiUrl}/api/contact-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error || 'Failed to send message');
        return false;
      }

      if (responseData?.error) {
        setError(responseData.error);
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

  return { submit, loading, error, success };
};
