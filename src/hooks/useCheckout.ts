import { useState } from 'react';

interface CheckoutData {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  notes?: string;
  site?: string; // e.g., 'vaughnsterling'
  provider?: 'paypal' | 'yoco' | 'paystack' | 'stripe'; // optional provider override
}

interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  paypalOrderId?: string;
  approveUrl?: string;
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
      
      // Choose endpoint based on requested provider (default: PayPal)
      const provider = data.provider || 'paypal';
      const endpoint = provider === 'yoco' ? '/api/create-yoco-charge' : '/api/create-paypal-order';

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
        setError(errorData.error || 'Failed to create PayPal order');
        return null;
      }

      const responseData = await response.json();

      if (responseData?.error) {
        setError(responseData.error);
        return null;
      }

      // Redirect to PayPal approval page
      if (responseData?.approveUrl) {
        window.location.href = responseData.approveUrl;
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
