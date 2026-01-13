
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './sentry';

// Initialize Sentry if provided
initSentry(import.meta.env.VITE_SENTRY_DSN as string | undefined);

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
