import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CheckoutData {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  notes?: string;
}

interface CheckoutResponse {
  success: boolean;
  sessionId?: string;
  sessionUrl?: string;
  orderId?: string;
  depositAmount?: number;
  totalAmount?: number;
  currency?: string;
  error?: string;
}

interface UseCheckoutReturn {
  createCheckout: (data: CheckoutData) => Promise<CheckoutResponse | null>;
  loading: boolean;
  error: string | null;
}

export const useCheckout = (): UseCheckoutReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = async (data: CheckoutData): Promise<CheckoutResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: responseData, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          ...data,
          successUrl: `${window.location.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/?payment=cancelled`
        }
      });

      if (fnError) {
        setError(fnError.message || 'Failed to create checkout');
        return null;
      }

      if (responseData?.error) {
        setError(responseData.error);
        return null;
      }

      // Redirect to Paystack hosted payment page
      if (responseData?.sessionUrl) {
        window.location.href = responseData.sessionUrl;
      }

      return responseData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createCheckout, loading, error };
};
