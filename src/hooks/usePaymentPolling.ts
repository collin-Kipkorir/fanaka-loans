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
    (reference: string) => {
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

          if (response.success || response.paid) {
            setStatus('completed');
            stopPolling();
            options.onSuccess?.(response);
          } else if (response.error) {
            setError(response.error);
            stopPolling();
            options.onError?.(response.error);
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
