import { useEffect, useRef } from 'react';

type ReminderOptions = {
  hourly?: boolean; // if true use short intervals (debug)
  intervalMs?: number;
};

const HAS_PAID_KEY = 'fanaka:collateralPaid';
const REMINDER_DISMISSED_KEY = 'fanaka:collateralReminderDismissedUntil';

function isCollateralPaid(): boolean {
  try {
    return localStorage.getItem(HAS_PAID_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

function setDismissUntil(secondsFromNow: number) {
  const until = Date.now() + secondsFromNow * 1000;
  try {
    localStorage.setItem(REMINDER_DISMISSED_KEY, String(until));
  } catch (e) {}
}

function isDismissed(): boolean {
  try {
    const v = localStorage.getItem(REMINDER_DISMISSED_KEY);
    if (!v) return false;
    return Date.now() < Number(v);
  } catch (e) {
    return false;
  }
}

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  }
  return null;
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  try {
    const p = await Notification.requestPermission();
    return p;
  } catch (e) {
    return 'denied';
  }
}

export default function useNotificationReminder(opts?: ReminderOptions) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Register SW early
      const reg = await registerSW();

      // When PWA is installed -> schedule reminders
      function onInstalled() {
        if (!mounted) return;
        if (isCollateralPaid()) return; // nothing to do
        if (isDismissed()) return;

        (async () => {
          const perm = await requestNotificationPermission();
          if (perm !== 'granted') return;

          // show an immediate friendly notification
          try {
            if (reg && reg.showNotification) {
              reg.showNotification('Your Loan Application Pending', {
                body: 'Tap to finish your application unlock your loan.',
                icon: '/logo-192.png',
                badge: '/logo-192.png',
                tag: 'collateral-reminder',
                data: { url: '/' },
              } as any);
            } else {
              // fallback to Notification
              new Notification('Your Loan Application Pending', {
                body: 'Open the app to finish your application and unlock your loan.',
                icon: '/logo-192.png',
                tag: 'collateral-reminder',
              });
            }
          } catch (e) {
            // ignore
          }

          // Attempt to register periodic sync (if supported)
          try {
            if (reg && 'periodicSync' in reg) {
              // @ts-ignore
              await reg.periodicSync.register('collateral-reminder', { minInterval: opts?.intervalMs || 24 * 60 * 60 * 1000 });
            }
          } catch (e) {
            // periodic sync may be unavailable, fallback to in-app timers
          }

          // fallback: schedule in-app reminders while app is open
          const interval = opts?.intervalMs ?? (opts?.hourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = window.setInterval(() => {
            if (isCollateralPaid() || isDismissed()) return;
            try {
            if (reg && reg.showNotification) {
              reg.showNotification('Reminder: Complete Application', {
                body: 'You still have an incomplete loan application — tap to finish.',
                icon: '/logo-192.png',
                tag: 'collateral-reminder',
                data: { url: '/' },
              } as any);
              } else {
                // fallback
                new Notification('Reminder: Loan Application', { body: 'Open the app to finish your collateral payment.' });
              }
            } catch (e) {}
          }, interval);
        })();
      }

      // Listen for install event
      window.addEventListener('appinstalled', onInstalled);

      // Also if the app is already in standalone mode (user installed previously), trigger on load
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) {
        // short defer to allow service worker to be ready
        setTimeout(() => onInstalled(), 1000);
      }

      // Cleanup
      return () => {
        mounted = false;
        window.removeEventListener('appinstalled', onInstalled);
        if (timerRef.current) window.clearInterval(timerRef.current);
      };
    }

    const cleanupPromise = init();
    return () => {
      cleanupPromise.then((fn) => fn).catch(() => {});
    };
  }, [opts]);
}
