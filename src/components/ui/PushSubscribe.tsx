import React, { useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export default function PushSubscribe() {
  const [status, setStatus] = useState<string>('idle');

  // Don't show the idle prompt on screen (hide "Enable push reminders" when idle)
  if (status === 'idle') return null;

  async function subscribe() {
    if (!('serviceWorker' in navigator)) return setStatus('no-sw');
    if (!('PushManager' in window)) return setStatus('no-push');

    try {
      setStatus('registering-sw');
      const reg = await navigator.serviceWorker.ready;

      setStatus('requesting-permission');
      const p = await Notification.requestPermission();
      if (p !== 'granted') return setStatus('permission-denied');

      setStatus('subscribing');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      // Send subscription to server to send an immediate test notification
      setStatus('sending-subscription');
      const resp = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, payload: { title: 'Welcome!', body: 'Thanks for subscribing — finish your collateral payment.' } }),
      });

      if (!resp.ok) {
        setStatus('send-failed');
        return;
      }

      setStatus('subscribed');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }

  return (
    <div>
      <button className="btn" onClick={subscribe}>
        Enable push reminders
      </button>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
