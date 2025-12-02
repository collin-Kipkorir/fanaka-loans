/**
 * usePaymentPolling Hook
 * Manages polling for payment status with 2-second intervals and 3-minute timeout
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { checkPaymentStatus } from '@/lib/payhero-service';
import PAYHERO_CONFIG from '@/lib/payhero-config';
import type { StatusCheckResponse, PaymentPollingState } from '@/lib/payhero-types';

export function usePaymentPolling() {
  const [state, setState] = useState<PaymentPollingState>({
    isPolling: false,
    status: 'IDLE',
    elapsedSeconds: 0,
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Start polling for payment status
   * @param paymentReference - Unique payment reference from initiateStkPush
   * @param onSuccess - Callback when payment succeeds
   * @param onTimeout - Callback when polling times out
   */
  const startPolling = useCallback(
    (
      paymentReference: string,
      onSuccess?: (status: StatusCheckResponse) => void,
      onTimeout?: () => void
    ) => {
      if (!paymentReference) {
        console.error('[payhero-polling] Invalid payment reference');
        setState(prev => ({ ...prev, status: 'FAILED', error: 'Invalid payment reference' }));
        return;
      }

      console.log('[payhero-polling] Starting polling for reference:', paymentReference);
      setState(prev => ({
        ...prev,
        isPolling: true,
        status: 'POLLING',
        elapsedSeconds: 0,
        error: undefined,
      }));

      startTimeRef.current = Date.now();
      let checkCount = 0;

      // Set up polling interval
      pollingIntervalRef.current = setInterval(async () => {
        checkCount++;
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);

        setState(prev => ({
          ...prev,
          elapsedSeconds: elapsed,
        }));

        console.debug(
          `[payhero-polling] Check #${checkCount} (${elapsed}s elapsed)`,
          paymentReference
        );

        try {
          const result = await checkPaymentStatus(paymentReference);

          setState(prev => ({
            ...prev,
            lastStatusCheck: result,
          }));

          if (result.success) {
            const paymentStatus = result.status;

            if (paymentStatus === 'SUCCESS') {
              console.log('[payhero-polling] Payment successful!', result);
              clearInterval(pollingIntervalRef.current!);
              clearTimeout(timeoutRef.current!);

              setState(prev => ({
                ...prev,
                isPolling: false,
                status: 'SUCCESS',
              }));

              onSuccess?.(result);
              return;
            } else if (paymentStatus === 'FAILED') {
              console.warn('[payhero-polling] Payment failed:', result);
              clearInterval(pollingIntervalRef.current!);
              clearTimeout(timeoutRef.current!);

              setState(prev => ({
                ...prev,
                isPolling: false,
                status: 'FAILED',
                error: result.message || 'Payment failed',
              }));
              return;
            } else if (paymentStatus === 'PENDING' || paymentStatus === 'QUEUED') {
              console.debug('[payhero-polling] Payment still pending, continuing poll...');
              // Continue polling
            } else if (paymentStatus === 'NOT_FOUND') {
              // Transaction not yet in provider system, continue polling
              console.debug('[payhero-polling] Transaction not found yet, continuing poll...');
            }
          }
        } catch (err) {
          console.warn('[payhero-polling] Error checking status:', err);
          // Continue polling on errors (network might be temporary)
        }
      }, PAYHERO_CONFIG.POLLING.INTERVAL_MS);

      // Set up timeout
      timeoutRef.current = setTimeout(() => {
        console.warn('[payhero-polling] Polling timeout after', PAYHERO_CONFIG.POLLING.MAX_DURATION_MS / 1000, 'seconds');
        clearInterval(pollingIntervalRef.current!);

        setState(prev => ({
          ...prev,
          isPolling: false,
          status: 'TIMEOUT',
          error: 'Payment verification timeout. Please check M-Pesa app or try again.',
        }));

        onTimeout?.();
      }, PAYHERO_CONFIG.POLLING.MAX_DURATION_MS);
    },
    []
  );

  /**
   * Stop polling (manual cancel)
   */
  const stopPolling = useCallback(() => {
    console.log('[payhero-polling] Stopping polling');
    clearInterval(pollingIntervalRef.current!);
    clearTimeout(timeoutRef.current!);

    setState(prev => ({
      ...prev,
      isPolling: false,
    }));
  }, []);

  /**
   * Reset polling state
   */
  const resetPolling = useCallback(() => {
    console.log('[payhero-polling] Resetting state');
    stopPolling();
    setState({
      isPolling: false,
      status: 'IDLE',
      elapsedSeconds: 0,
      lastStatusCheck: undefined,
      error: undefined,
    });
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    // State
    isPolling: state.isPolling,
    status: state.status,
    elapsedSeconds: state.elapsedSeconds,
    lastStatusCheck: state.lastStatusCheck,
    error: state.error,

    // Actions
    startPolling,
    stopPolling,
    resetPolling,
  };
}

export default usePaymentPolling;
