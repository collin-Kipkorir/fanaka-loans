export const PAYHERO_CONFIG = {
  BASE_URL: import.meta.env.VITE_PAYHERO_BASE_URL || 'https://api.payhero.co.ke',
  ACCOUNT_ID: import.meta.env.VITE_PAYHERO_ACCOUNT_ID || '3278',
  CHANNEL_ID: import.meta.env.VITE_PAYHERO_CHANNEL_ID || '3838',
  AUTH_TOKEN: import.meta.env.VITE_PAYHERO_AUTH_TOKEN || '',
  CALLBACK_URL: import.meta.env.VITE_PAYHERO_CALLBACK_URL || 'http://localhost:5000/api/payment-callback',
  POLLING_INTERVAL: 2000, // 2 seconds
  POLLING_TIMEOUT: 180000, // 3 minutes
};

export const TEST_PHONES = [
  '0712345678',
  '0798765432',
  '254712345678',
  '254798765432',
];

export function validateAndFormatPhone(phone: string): string {
  // Remove spaces and dashes
  let cleaned = phone.replace(/[\s-]/g, '');

  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }

  // If doesn't start with 254, prepend it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  return cleaned;
}

export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TX${timestamp}${random}`;
}

export function isValidKenyaPhoneNumber(phone: string): boolean {
  const formatted = validateAndFormatPhone(phone);
  const kenyaPhoneRegex = /^254(7\d{8}|1\d{8})$/;
  return kenyaPhoneRegex.test(formatted);
}
