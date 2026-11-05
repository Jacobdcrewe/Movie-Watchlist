import { useEffect } from 'react';

// Count of open overlays, so a dialog on top of the drawer doesn't unlock early.
let locks = 0;

/**
 * Freeze page scrolling while an overlay (drawer, dialog) is open.
 * `scrollbar-gutter: stable` on <html> (global.css) keeps the layout from
 * jumping when the page scrollbar is hidden.
 */
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    locks++;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      locks--;
      if (locks === 0) document.documentElement.style.overflow = '';
    };
  }, [active]);
}
