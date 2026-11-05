import { useEffect, useState } from 'react';

/** True once the page has scrolled more than `offset` px. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > offset);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);
  return scrolled;
}
