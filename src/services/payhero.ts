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
  // Prefer an explicit VITE_API_BASE when set to a public host.
  // Fallback to same-origin `/api` for builds where VITE_API_BASE is missing,
  // localhost, or points to private/local IPs (192.168.x, 10.x, 172.16-31.x).
  const rawBase = import.meta.env.VITE_API_BASE;
  // Detect localhost, loopback, or private IP ranges
  const isLocalOrPrivate = rawBase && /localhost|127\.|192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\./.test(rawBase);
  const apiBase = rawBase && !isLocalOrPrivate ? rawBase : '/api';
  const url = `${apiBase.replace(/\/$/, '')}/payhero-stk`;

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
  const rawBase = import.meta.env.VITE_API_BASE;
  // Detect localhost, loopback, or private IP ranges
  const isLocalOrPrivate = rawBase && /localhost|127\.|192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\./.test(rawBase);
  const apiBase = rawBase && !isLocalOrPrivate ? rawBase : '/api';
  const url = `${apiBase.replace(/\/$/, '')}/payhero-status?reference=${encodeURIComponent(paymentReference)}`;

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
