// Client-side service to call the backend Payhero STK initiation endpoint
// The backend will forward the request to PayHero API with proper authentication

export interface StkResult {
  success: boolean;
  message?: string;
  requestId?: string | null;
  transactionId?: string | null;
  error?: string;
}

/**
 * Initiate STK push via backend endpoint
 * @param phone - M-Pesa phone number (e.g., 254712345678)
 * @param amount - Amount in KES
 * @param accountRef - Optional account reference (loan ID)
 */
export async function initiateStkPush(phone: string, amount: number, accountRef?: string): Promise<StkResult> {
  try {
    const resp = await fetch('/api/payhero/stk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount, accountRef: accountRef || 'FANAKA_COLLATERAL' }),
    });

    const body = await resp.json();
    console.debug('[payhero] response:', body);
    if (!resp.ok) return { success: false, error: body?.error || body?.message || 'Provider error' };
    return {
      success: true,
      message: body.message,
      requestId: body.requestId || body.transactionId || null,
      transactionId: body.transactionId || null,
    };
  } catch (err) {
    console.warn('[payhero] request failed', err);
    return { success: false, error: String(err) };
  }
}

export default { initiateStkPush };
