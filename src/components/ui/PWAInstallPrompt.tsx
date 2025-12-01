import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import Logo from '@/assets/logo.png';

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
  const [isAnimating, setIsAnimating] = useState(false);

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
    setIsAnimating(true);
    setTimeout(() => {
      setShowPrompt(false);
      setIsAnimating(false);
    }, 300);
    try { localStorage.setItem(STORAGE_KEY_DISMISSED, 'true'); } catch (err) { console.warn('Unable to set dismissed flag', err); }
  };

  if (isInstalled) return null;
  if (!showPrompt) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />
      
      {/* Modern Install Dialog */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none transition-all duration-300 ${
          isAnimating ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="w-full max-w-md pointer-events-auto">
          <div className="mx-4 mb-6 rounded-2xl bg-gradient-primary shadow-glow overflow-hidden">
            {/* Top Section with Logo and Close */}
            <div className="relative p-6 pb-4">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Logo */}
              <div className="flex justify-center mb-4">
                <img 
                  src={Logo} 
                  alt="Fanaka Loans" 
                  className="w-16 h-16 rounded-full object-cover shadow-lg ring-4 ring-white/20"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-4 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Install Fanaka
              </h2>
              <p className="text-sm sm:text-base text-white/90 mb-6 leading-relaxed">
                Get instant loans with quick approval. Install the app for faster access and offline support.
              </p>
              
              {/* Features List */}
              <div className="space-y-2 mb-6 text-left bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                  <span>Quick approval in minutes</span>
                </div>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                  <span>Loans up to KES 50,000</span>
                </div>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                  <span>M-Pesa disbursement</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200 text-sm sm:text-base"
              >
                Not Now
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-3 rounded-xl bg-white text-primary font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </>
  );
};

export default PWAInstallPrompt;
