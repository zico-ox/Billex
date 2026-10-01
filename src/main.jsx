import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Progressive Web App (PWA) Service Worker for Offline & Install support
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Weknd POS] Service Worker active with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Weknd POS] Service Worker registration failed:', err);
      });
  });
}
