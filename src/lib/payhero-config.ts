/**
 * PayHero Configuration Constants
 */

export const PAYHERO_CONFIG = {
  // API Base URL - Using api.payhero.io as per prompt
  BASE_URL: import.meta.env.VITE_PAYHERO_BASE_URL || 'https://api.payhero.io',
  
  // Channel and Auth
  CHANNEL_ID: parseInt(import.meta.env.VITE_PAYHERO_CHANNEL_ID || '0'),
  AUTH_TOKEN: import.meta.env.VITE_PAYHERO_AUTH_TOKEN || '',
  
  // Callback URL for webhook notifications
  CALLBACK_URL: import.meta.env.VITE_PAYHERO_CALLBACK_URL || 'http://localhost:4100/api/payhero/callback',
  
  // API Endpoints (relative to backend proxy in dev)
  ENDPOINTS: {
    INITIATE_STK: '/api/payhero/stk',
    CHECK_STATUS: '/api/payhero/status',
    CHECK_TRANSACTION: '/api/payhero/transaction',
    CALLBACK: '/api/payhero/callback',
  },
  
  // Polling configuration
  POLLING: {
    INTERVAL_MS: 2000,           // Poll every 2 seconds
    MAX_DURATION_MS: 180000,      // 3 minutes max
    CHECK_COUNT: 90,              // 180000 / 2000 = 90 checks
  },
  
  // Phone validation
  PHONE: {
    VALID_PREFIXES: ['07', '254'],  // Kenya mobile prefixes
    LOCAL_PREFIX: '07',
    INTL_PREFIX: '254',
    MIN_LENGTH: 10,               // 07xxxxxxxx
    MAX_LENGTH: 13,               // 254xxxxxxxxx
  },
  
  // Provider identifier
  PROVIDER: 'mpesa',
  
  // Environment
  ENVIRONMENT: (import.meta.env.PROD ? 'production' : 'development') as 'development' | 'production',
};

/**
 * Test phone numbers for development/testing
 * (Use these to test different scenarios in development)
 */
export const TEST_PHONES = {
  success: '0722000000',        // Always succeeds
  timeout: '0722111111',         // Will timeout
  insufficient: '0722222222',    // Insufficient funds
  failed: '0722333333',          // General failure
};

export default PAYHERO_CONFIG;
