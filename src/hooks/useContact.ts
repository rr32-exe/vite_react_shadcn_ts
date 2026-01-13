import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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
      const { data: responseData, error: fnError } = await supabase.functions.invoke('contact-submit', {
        body: data
      });

      if (fnError) {
        setError(fnError.message || 'Failed to send message');
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
