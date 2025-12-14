import { useState, useCallback, useRef, useEffect } from 'react';
import { checkPaymentStatus } from '@/services/payhero';
import { PAYHERO_CONFIG } from '@/lib/payhero-config';
import type { StatusCheckResponse } from '@/lib/payhero-types';

interface UsePaymentPollingOptions {
  onSuccess?: (data: StatusCheckResponse) => void;
  onTimeout?: () => void;
  onError?: (error: string) => void;
}

export const usePaymentPolling = (options: UsePaymentPollingOptions = {}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsPolling(false);
    setElapsedSeconds(0);
  }, []);

  const resetPolling = useCallback(() => {
    stopPolling();
    setStatus(null);
    setError(null);
    setElapsedSeconds(0);
  }, [stopPolling]);

  const startPolling = useCallback(
    (reference: string, fallbackAmount?: number) => {
      if (isPolling) return; // Prevent duplicate polling

      setIsPolling(true);
      setStatus(null);
      setError(null);
      setElapsedSeconds(0);
      startTimeRef.current = Date.now();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);

        // Check timeout
        if (elapsed >= PAYHERO_CONFIG.POLLING_TIMEOUT / 1000) {
          stopPolling();
          options.onTimeout?.();
        }
      }, 1000);

      // Start polling
      const poll = async () => {
        try {
          const response = await checkPaymentStatus(reference);

          // If PayHero didn't include the amount yet (common for QUEUED),
          // fill it from the provided fallbackAmount so the UI can display the expected amount.
          if ((response.amount === undefined || response.amount === null || response.amount === 0) && typeof fallbackAmount === 'number' && fallbackAmount > 0) {
            response.amount = fallbackAmount;
          }

          // If the status endpoint is not available, log and let the polling continue
          if (response.error && response.error.includes('Endpoint not found')) {
            console.log('[polling] Status endpoint not available yet, will retry until timeout');
            return; // try again on next interval
          }

          // PayHero returns a `status` string: QUEUED, SUCCESS, FAILED
          // Also check for success/paid flags in the response
          const respStatus = response?.status ? String(response.status).toUpperCase() : null;
          const isPaid = response?.paid === true || response?.success === true;
          const isSuccess = respStatus === 'SUCCESS' || (isPaid && respStatus !== 'FAILED');

          console.log('[polling] Status check:', { 
            status: respStatus, 
            paid: response?.paid, 
            success: response?.success,
            isSuccess 
          });

          if (isSuccess) {
            console.log('[polling] Payment successful!');
            setStatus('completed');
            stopPolling();
            options.onSuccess?.(response);
          } else if (respStatus === 'FAILED') {
            const errMsg = response.error || response.error_message || 'Payment failed';
            setError(errMsg);
            stopPolling();
            options.onError?.(errMsg);
          } else {
            // QUEUED or other pending statuses -> keep polling
            console.log('[polling] Payment pending (status=', respStatus, '), continuing to poll');
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setError(message);
          stopPolling();
          options.onError?.(message);
        }
      };

      // Poll immediately, then at intervals
      poll();
      pollingIntervalRef.current = setInterval(poll, PAYHERO_CONFIG.POLLING_INTERVAL);
    },
    [isPolling, stopPolling, options]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return {
    isPolling,
    status,
    elapsedSeconds,
    error,
    startPolling,
    stopPolling,
    resetPolling,
  };
};
