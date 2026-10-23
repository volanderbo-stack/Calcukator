import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { requestPersistentStorage } from './storage/db';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestPersistentStorage();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
