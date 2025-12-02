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
    // Determine API base:
    // - If VITE_API_BASE is set, use it.
    // - In dev mode, default to backend running on http://localhost:4100 to avoid proxy/origin mismatches.
    // - Otherwise use a relative path so Vite proxy (or same-origin) can apply in production.
  const importedMeta = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string | boolean> }) : undefined;
  const metaEnv = importedMeta?.env ?? {};
  const metaEnvTyped = metaEnv as Record<string, string | boolean | undefined>;
  const API_BASE = (typeof metaEnvTyped.VITE_API_BASE === 'string' ? metaEnvTyped.VITE_API_BASE : undefined) || (metaEnvTyped.DEV ? 'http://localhost:4100' : '');
    const url = (API_BASE ? `${API_BASE.replace(/\/$/, '')}` : '') + '/api/payhero/stk';
    console.debug('[payhero] calling URL:', url);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount, accountRef: accountRef || 'FANAKA_COLLATERAL' }),
    });

    // Try to parse JSON, but gracefully handle empty or non-JSON responses
  let body: Record<string, unknown> | null = null;
    try {
      body = await resp.json();
    } catch (parseErr) {
      try {
        const txt = await resp.text();
        console.warn('[payhero] response not JSON, raw text:', txt);
        body = { raw: txt };
      } catch (e) {
        console.warn('[payhero] failed to read response body:', e);
        body = null;
      }
    }

    console.debug('[payhero] response status:', resp.status, 'body:', body);

    if (!resp.ok) {
      const rawErr = (body && (body as Record<string, unknown>)) || {};
      const errMsg = typeof rawErr.error === 'string' ? rawErr.error : (typeof rawErr.message === 'string' ? rawErr.message : `HTTP ${resp.status}`);
      return { success: false, error: String(errMsg) };
    }

    const raw = (body && (body as Record<string, unknown>)) || {};
    const message = typeof raw.message === 'string' ? raw.message : undefined;
    const requestId = typeof raw.requestId === 'string' ? raw.requestId : (typeof raw.transactionId === 'string' ? raw.transactionId : null);
    const transactionId = typeof raw.transactionId === 'string' ? raw.transactionId : null;

    return {
      success: true,
      message,
      requestId,
      transactionId,
    };
  } catch (err) {
    console.warn('[payhero] request failed', err);
    return { success: false, error: String(err) };
  }
}

export default { initiateStkPush };
