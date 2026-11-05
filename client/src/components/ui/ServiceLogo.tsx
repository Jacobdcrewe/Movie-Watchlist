import { useState } from 'react';
import type { Provider } from '../../../../shared/types';
import { logoUrl } from '../../lib/images';
import { serviceColor } from '../../lib/serviceColor';
import styles from './ui.module.css';

interface Props {
  provider: Provider;
  size?: number;
  /**
   * What to show when there's no logo (or it fails to load):
   * 'dot' — a small coloured dot (for name pills); 'initial' — a lettered tile (logo-only strips).
   */
  fallback?: 'dot' | 'initial';
}

/**
 * A streaming service's official logo (supplied by TMDB with the provider data),
 * with a fallback when there's no logo or it fails to load.
 */
export function ServiceLogo({ provider, size = 16, fallback = 'dot' }: Props) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl(provider.logoPath);
  const radius = Math.round(size * 0.25);

  if (!src || failed) {
    if (fallback === 'initial') {
      return (
        <span
          className={styles.initial}
          style={{ width: size, height: size, borderRadius: radius, background: serviceColor(provider.name, provider.id), fontSize: Math.round(size * 0.5) }}
          aria-hidden
        >
          {provider.name.trim().charAt(0).toUpperCase()}
        </span>
      );
    }
    const dot = Math.max(6, Math.round(size * 0.45));
    return (
      <span className={styles.logoSlot} style={{ width: size, height: size }} aria-hidden>
        <span className={styles.dot} style={{ width: dot, height: dot, background: serviceColor(provider.name, provider.id) }} />
      </span>
    );
  }
  return (
    <img
      className={styles.logo}
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ borderRadius: radius }}
      onError={() => setFailed(true)}
    />
  );
}
