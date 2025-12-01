import React, { useEffect, useState } from 'react';

// Local event interface to avoid relying on external/global types in all tooling
interface LocalBeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform?: string;
  }>;
}

const STORAGE_KEY_DISMISSED = 'pwa-install-dismissed';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<LocalBeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if already in standalone mode (installed)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      // iOS detection (navigator.standalone) — use Reflect.get to avoid `any` casts
      const isIosStandalone = Reflect.get(navigator as unknown as object, 'standalone') === true;
      const installed = !!(isStandalone || isIosStandalone);
      console.log('[PWA] checkInstalled ->', { isStandalone, isIosStandalone, installed });
      return installed;
    };

    if (checkInstalled()) {
      setIsInstalled(true);
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Save for later
      const evt = e as LocalBeforeInstallPromptEvent;
      console.log('[PWA] beforeinstallprompt event fired');
      // store on a typed wrapper of window to avoid `any`
      const win = window as unknown as { deferredPrompt?: LocalBeforeInstallPromptEvent };
      win.deferredPrompt = evt;
      setDeferredPrompt(evt);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      try {
        localStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
      } catch (err) {
        console.warn('Unable to set pwa installed flag', err);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onAppInstalled as EventListener);

    // If we already have a deferredPrompt (e.g., saved by other code), pick it up
    try {
      const win = window as unknown as { deferredPrompt?: LocalBeforeInstallPromptEvent };
      if (win.deferredPrompt) {
        console.log('[PWA] found deferredPrompt on window');
        setDeferredPrompt(win.deferredPrompt);
      }
    } catch (err) {
      // non-fatal
      console.warn('Could not read deferredPrompt from window', err);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled as EventListener);
    };
  }, []);

  useEffect(() => {
    // Show the custom prompt 3 seconds after mount when appropriate
    if (!deferredPrompt) return;
    if (isInstalled) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
    } catch (err) {
      console.warn('Unable to read pwa dismissed flag', err);
      dismissed = false;
    }
    console.log('[PWA] deferredPrompt available -> scheduling show?', { dismissed, isInstalled });
    if (dismissed) return;

    const t = setTimeout(() => {
      console.log('[PWA] showing install prompt (custom UI) after 3s');
      setShowPrompt(true);
    }, 3000);

    return () => clearTimeout(t);
  }, [deferredPrompt, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      console.log('[PWA] prompting native install');
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('[PWA] userChoice ->', choice);
      if (choice.outcome === 'accepted') {
        console.log('[PWA] user accepted the install');
        setIsInstalled(true);
        setShowPrompt(false);
        try { localStorage.setItem(STORAGE_KEY_DISMISSED, 'true'); } catch (err) { console.warn(err); }
      } else {
        // dismissed
        console.log('[PWA] user dismissed the install');
        setShowPrompt(false);
        try { localStorage.setItem(STORAGE_KEY_DISMISSED, 'true'); } catch (err) { console.warn(err); }
      }
    } catch (err) {
      // ignore — log to help debugging
      console.warn('PWA prompt failed', err);
      setShowPrompt(false);
    }
  };

  const handleClose = () => {
    console.log('[PWA] user closed the install prompt (custom)');
    setShowPrompt(false);
    try { localStorage.setItem(STORAGE_KEY_DISMISSED, 'true'); } catch (err) { console.warn('Unable to set dismissed flag', err); }
  };

  if (isInstalled) return null;
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="max-w-lg w-full bg-white/95 dark:bg-slate-800/95 shadow-lg rounded-lg p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-medium">Install Fanaka</div>
          <div className="text-sm text-muted-foreground">Install the app for faster access and offline support.</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleInstall} className="px-3 py-1 rounded-md bg-primary text-white">Install</button>
          <button onClick={handleClose} className="px-3 py-1 rounded-md border">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
