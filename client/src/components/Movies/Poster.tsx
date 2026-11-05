import type { CSSProperties, ReactNode } from 'react';
import { placeholderArt, posterUrl, type PosterSize } from '../../lib/images';
import styles from './Movies.module.css';

interface Props {
  id: number;
  path: string | null;
  size?: PosterSize;
  className?: string;
  style?: CSSProperties;
  dim?: boolean;
  children?: ReactNode;
}

/** 2:3 poster with a lazy-loaded TMDB image over the striped placeholder. */
export function Poster({ id, path, size = 'w342', className = '', style, dim, children }: Props) {
  const src = posterUrl(path, size);
  return (
    <div className={`${styles.poster} ${className}`} style={{ background: placeholderArt(id), ...style }}>
      {src && <img className={styles.posterImg} src={src} alt="" loading="lazy" decoding="async" />}
      {dim && <div className={styles.dim} />}
      {children}
    </div>
  );
}
