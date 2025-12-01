import React from 'react';
import Logo from '@/assets/logo.png';
import { X, Bell } from 'lucide-react';
import { subscribeToPush } from '@/services/push';
import { useState } from 'react';

interface Props {
  show: boolean;
  onAllow: () => void;
  onDecline: () => void;
}

const NotificationPermissionPrompt: React.FC<Props> = ({ show, onAllow, onDecline }) => {
  const [bgLoading, setBgLoading] = useState(false);
  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onDecline} />

      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto mx-4 mb-6 rounded-2xl bg-gradient-primary shadow-glow overflow-hidden">
          <div className="relative p-6 pb-4">
            <button
              onClick={onDecline}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="flex justify-center mb-4">
              <img src={Logo} alt="Fanaka Loans" className="w-16 h-16 rounded-full object-cover shadow-lg ring-4 ring-white/20" />
            </div>
          </div>

          <div className="px-6 pb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Enable Notifications</h2>
            <p className="text-sm sm:text-base text-white/90 mb-4">Stay updated with loan offers, application reminders, and important account alerts.</p>

            <div className="flex gap-3 mt-2">
              <button
                onClick={onDecline}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200 text-sm sm:text-base"
              >
                Not now
              </button>

              <button
                onClick={onAllow}
                className="flex-1 px-4 py-3 rounded-xl bg-white text-primary font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Bell className="w-4 h-4" />
                Allow
              </button>
            </div>

            {/* Optional: allow user to enable background push subscriptions explicitly */}
            {typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window ? (
              <div className="mt-3 text-center">
                <button
                  onClick={async () => {
                    try {
                      setBgLoading(true);
                      const sub = await subscribeToPush();
                      console.debug('[push] subscription result', sub);
                    } catch (err) {
                      console.warn('[push] subscribe failed', err);
                    } finally {
                      setBgLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                >
                  {bgLoading ? 'Subscribing…' : 'Enable background notifications'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPermissionPrompt;
