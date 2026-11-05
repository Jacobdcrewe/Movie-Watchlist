import { useState } from 'react';
import type { Provider } from '../../../../shared/types';
import { logoUrl } from '../../lib/images';
import { serviceColor } from '../../lib/serviceColor';
import styles from './ui.module.css';

/**
 * A streaming service's official logo (supplied by TMDB with the provider data),
 * falling back to a coloured dot if there's no logo or it fails to load.
 */
export function ServiceLogo({ provider, size = 16 }: { provider: Provider; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl(provider.logoPath);

  if (!src || failed) {
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
      style={{ borderRadius: Math.round(size * 0.25) }}
      onError={() => setFailed(true)}
    />
  );
}
