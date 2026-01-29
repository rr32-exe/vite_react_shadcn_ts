import { useState } from 'react';

interface CheckoutData {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  notes?: string;
  site?: string; // e.g., 'vaughnsterling'
}

interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  checkoutUrl?: string;
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
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      
      // YOCO is the primary payment provider
      const endpoint = '/api/create-yoco-charge';

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: data.serviceId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          notes: data.notes,
          site: data.site,
          successUrl: `${window.location.origin}/?payment=success`,
          cancelUrl: `${window.location.origin}/?payment=cancelled`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create payment');
        return null;
      }

      const responseData = await response.json();

      if (responseData?.error) {
        setError(responseData.error);
        return null;
      }

      // Redirect to YOCO checkout page
      const checkoutUrl = responseData?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
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
