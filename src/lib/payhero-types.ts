/**
 * PayHero M-Pesa STK Type Definitions
 */

export interface StkPushRequest {
  amount: number;
  phone_number: string; // 254xxxxxxxxx format
  channel_id: number;
  provider: 'mpesa';
  reference: string; // Unique transaction reference
  customer_name: string;
  callback_url: string;
}

export interface StkPushResponse {
  success: boolean;
  message?: string;
  checkout_request_id?: string;
  request_id?: string;
  transaction_id?: string;
  error?: string;
  status_code?: number;
}

export interface StatusCheckResponse {
  success: boolean;
  status?: 'QUEUED' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND';
  message?: string;
  amount?: number;
  phone_number?: string;
  payment_reference?: string;
  mpesa_receipt_number?: string;
  error?: string;
  error_code?: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  phoneNumber: string;
  amount: number;
  status: 'QUEUED' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'TIMEOUT';
  checkoutRequestId?: string;
  paymentReference: string;
  mpesaReceiptNumber?: string;
  timestamp: string;
  updatedAt: string;
  environment: 'development' | 'production';
  creditsAdded?: number;
  errorMessage?: string;
}

export interface PaymentPollingState {
  isPolling: boolean;
  status: 'IDLE' | 'INITIATING' | 'POLLING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  elapsedSeconds: number;
  lastStatusCheck?: StatusCheckResponse;
  error?: string;
}

export interface PaymentInitiateResult {
  success: boolean;
  checkoutRequestId?: string;
  paymentReference: string;
  error?: string;
}
