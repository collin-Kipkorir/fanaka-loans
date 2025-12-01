import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './serviceWorkerRegistration';

// Register service worker (best-effort). This will silently fail on unsupported browsers.
registerServiceWorker().then(() => {
	// noop – registration logs are inside the helper
}).catch((err) => console.debug('[SW] register error', err));

createRoot(document.getElementById("root")!).render(<App />);
