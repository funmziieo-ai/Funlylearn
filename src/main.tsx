import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Keep FunlyLearn's files on the phone so it opens fast (see public/sw.js).
// Only on the real website/app over https, never during local development.
if ('serviceWorker' in navigator && window.location.protocol === 'https:' && !window.location.hostname.includes('localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
