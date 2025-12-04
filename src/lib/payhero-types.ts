export interface StkPushRequest {
  phone: string;
  amount: number;
  customer_name: string;
  account_reference: string;
  callback_url?: string;
}

export interface StkPushResponse {
  success?: boolean;
  request_id?: string;
  merchant_request_id?: string;
  checkout_request_id?: string;
  response_code?: string;
  response_description?: string;
  error?: string;
  status?: number;
  // PayHero may return these fields in the STK response
  reference?: string;
  external_reference?: string;
}

export interface StatusCheckResponse {
  success?: boolean;
  status?: string;
  paid?: boolean;
  amount?: number;
  error?: string;
  transaction_id?: string;
}

export interface PaymentInitiateResult {
  success: boolean;
  request_id?: string;
  error?: string;
}
