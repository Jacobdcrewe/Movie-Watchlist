import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import './theme/global.css';

// Apply the last-used theme before first paint to avoid a flash.
try {
  const t = localStorage.getItem('reel-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
