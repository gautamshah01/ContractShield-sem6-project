import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ── PWA: Service Worker registration ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered, scope:', registration.scope);

        // Notify user when a new SW version is waiting (new deploy)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — could trigger a toast/banner here
              console.log('[PWA] New version available — reload to update.');
              // Auto-reload after 3 seconds (optional: replace with a "Refresh" banner)
              // setTimeout(() => window.location.reload(), 3000);
            }
          });
        });
      })
      .catch((err) => console.warn('[PWA] SW registration failed:', err));
  });
}

// ── PWA: Capture Android "Add to Home Screen" install prompt ─────────────────
// Stored globally so an "Install App" button anywhere in the app can trigger it
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing immediately
  e.preventDefault();
  deferredInstallPrompt = e;
  console.log('[PWA] Install prompt captured — ready to show when user clicks "Install".');
  // Dispatch a custom event so React components can listen for it
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  console.log('[PWA] App installed to home screen!');
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// Expose the trigger so any component can call: window.triggerPWAInstall()
window.triggerPWAInstall = async () => {
  if (!deferredInstallPrompt) return false;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  console.log('[PWA] Install outcome:', outcome);
  deferredInstallPrompt = null;
  return outcome === 'accepted';
};
