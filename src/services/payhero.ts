import { StkPushResponse, StatusCheckResponse } from '@/lib/payhero-types';

/**
 * Calls the backend to initiate an STK push for M-Pesa payment
 */
export async function initiateStkPush(
  phone: string,
  amount: number,
  customerName: string,
  accountRef: string
): Promise<StkPushResponse> {
  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4100/api';
    const url = `${apiBase}/payhero/stk`;

    console.log('[payhero] calling URL:', url);
    console.log('[payhero] payload:', { phone, amount, customerName, accountRef });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        amount,
        customer_name: customerName,
        account_reference: accountRef,
      }),
    });

    let data;
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.log('[payhero] non-JSON response:', text);
      data = { error: 'Invalid response format', raw: text };
    }

    console.log('[payhero] response status:', response.status);
    console.log('[payhero] response data:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Server error: ${response.status}`,
        status: response.status,
      };
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[payhero] error:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Polls the backend to check payment status
 */
export async function checkPaymentStatus(
  paymentReference: string
): Promise<StatusCheckResponse> {
  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4100/api';
    const url = `${apiBase}/payhero/status?reference=${encodeURIComponent(paymentReference)}`;

    console.log('[payhero] checking status for:', paymentReference);

    const response = await fetch(url);

    let data;
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.log('[payhero] non-JSON status response:', text);
      data = { error: 'Invalid response format', raw: text };
    }

    console.log('[payhero] status response:', data);

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[payhero] status check error:', message);
    return {
      success: false,
      error: message,
    };
  }
}
