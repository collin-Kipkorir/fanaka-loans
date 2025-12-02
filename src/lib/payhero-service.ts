/**
 * PayHero M-Pesa STK Service Layer
 * Handles phone validation, STK push initiation, and status checking
 */

import PAYHERO_CONFIG from './payhero-config';
import type { 
  StkPushRequest, 
  StkPushResponse, 
  StatusCheckResponse,
  PaymentInitiateResult 
} from './payhero-types';

/**
 * Validate and format phone number to international format (254xxxxxxxxx)
 * @param phone - Phone number in local (07xxx) or international (254xxx) format
 * @returns Formatted phone number or null if invalid
 */
export function validateAndFormatPhone(phone: string): string | null {
  // Remove all spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Check if empty
  if (!cleaned) {
    console.warn('[payhero] Phone validation failed: empty phone number');
    return null;
  }
  
  // Handle local format (07xx xxx xxx)
  if (cleaned.startsWith('07')) {
    // Remove leading 0 and add 254
    const international = '254' + cleaned.substring(1);
    if (international.length === 12) {
      console.log('[payhero] Formatted local phone:', cleaned, '→', international);
      return international;
    }
  }
  
  // Handle international format (254xxxxxxxxx)
  if (cleaned.startsWith('254')) {
    if (cleaned.length === 12) {
      console.log('[payhero] Validated international phone:', cleaned);
      return cleaned;
    }
  }
  
  // Handle +254 format
  if (cleaned.startsWith('+254')) {
    const noPlus = cleaned.substring(1);
    if (noPlus.length === 12) {
      console.log('[payhero] Formatted +254 phone:', cleaned, '→', noPlus);
      return noPlus;
    }
  }
  
  console.warn('[payhero] Phone validation failed: invalid format or length', cleaned);
  return null;
}

/**
 * Generate unique payment reference with timestamp and random suffix
 */
export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const ref = `TX${timestamp}${random}`;
  console.debug('[payhero] Generated payment reference:', ref);
  return ref;
}

/**
 * Initiate STK push payment via backend
 * @param phone - Phone number (will be validated and formatted)
 * @param amount - Amount in KES
 * @param customerName - Customer name for the transaction
 * @param accountRef - Optional account reference (loan ID, etc)
 * @returns Result with checkout request ID and payment reference
 */
export async function initiateStkPush(
  phone: string,
  amount: number,
  customerName: string = 'Fanaka Loans',
  accountRef: string = 'FANAKA_COLLATERAL'
): Promise<PaymentInitiateResult> {
  try {
    // Validate and format phone number
    const formattedPhone = validateAndFormatPhone(phone);
    if (!formattedPhone) {
      const error = 'Invalid phone number format. Use 07xx xxx xxx or 254xx xxx xxxx';
      console.error('[payhero] Initiate STK failed:', error);
      return { success: false, paymentReference: '', error };
    }
    
    // Validate amount
    if (!amount || amount <= 0) {
      const error = 'Invalid amount';
      console.error('[payhero] Initiate STK failed:', error);
      return { success: false, paymentReference: '', error };
    }
    
    // Generate unique payment reference
    const paymentReference = generatePaymentReference();
    
    // Build request payload
    const payload: StkPushRequest = {
      amount: Math.round(amount),
      phone_number: formattedPhone,
      channel_id: PAYHERO_CONFIG.CHANNEL_ID,
      provider: PAYHERO_CONFIG.PROVIDER as 'mpesa',
      reference: paymentReference,
      customer_name: customerName,
      callback_url: PAYHERO_CONFIG.CALLBACK_URL,
    };
    
    console.log('[payhero] Initiating STK push:', {
      phone: formattedPhone,
      amount: payload.amount,
      reference: paymentReference,
    });
    
    // Call backend endpoint
    const response = await fetch(PAYHERO_CONFIG.ENDPOINTS.INITIATE_STK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = (await response.json()) as StkPushResponse;
    
    if (!response.ok || !data.success) {
      const error = data.error || data.message || 'Failed to initiate STK push';
      console.error('[payhero] STK push failed:', error, data);
      return { success: false, paymentReference, error };
    }
    
    console.log('[payhero] STK push initiated successfully:', {
      checkoutRequestId: data.checkout_request_id || data.request_id,
      reference: paymentReference,
    });
    
    return {
      success: true,
      checkoutRequestId: data.checkout_request_id || data.request_id,
      paymentReference,
    };
  } catch (err) {
    const error = `Request failed: ${String(err)}`;
    console.error('[payhero] Initiate STK exception:', error);
    return { success: false, paymentReference: '', error };
  }
}

/**
 * Check payment status by reference
 * @param paymentReference - Unique payment reference returned from initiateStkPush
 * @returns Status check response
 */
export async function checkPaymentStatus(paymentReference: string): Promise<StatusCheckResponse> {
  try {
    if (!paymentReference) {
      const error = 'Invalid payment reference';
      console.warn('[payhero] Status check failed:', error);
      return { success: false, error };
    }
    
    console.debug('[payhero] Checking status for reference:', paymentReference);
    
    // Call backend endpoint with reference as query param
    const url = `${PAYHERO_CONFIG.ENDPOINTS.CHECK_STATUS}?reference=${encodeURIComponent(paymentReference)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = (await response.json()) as StatusCheckResponse;
    
    if (!response.ok) {
      console.warn('[payhero] Status check failed:', response.status, data);
      return { success: false, error: data.error || 'Status check failed' };
    }
    
    console.log('[payhero] Status check result:', data.status, {
      reference: paymentReference,
      mpesaReceipt: data.mpesa_receipt_number,
    });
    
    return { success: true, ...data };
  } catch (err) {
    const error = `Status check exception: ${String(err)}`;
    console.error('[payhero] Status check failed:', error);
    return { success: false, error };
  }
}

/**
 * Validate if a phone number is a valid Safaricom/Kenya mobile number
 */
export function isValidKenyaPhoneNumber(phone: string): boolean {
  const formatted = validateAndFormatPhone(phone);
  return formatted !== null && formatted.length === 12 && formatted.startsWith('254');
}

export default {
  validateAndFormatPhone,
  generatePaymentReference,
  initiateStkPush,
  checkPaymentStatus,
  isValidKenyaPhoneNumber,
};
