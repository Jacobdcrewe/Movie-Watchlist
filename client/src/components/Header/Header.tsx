import type { ReactNode } from 'react';
import type { Region, Theme } from '../../../../shared/types';
import { RegionSelect } from './RegionSelect';
import { ThemeToggle } from './ThemeToggle';
import styles from './Header.module.css';

interface Props {
  search: ReactNode;
  region: Region;
  onRegion: (r: Region) => void;
  theme: Theme;
  onToggleTheme: () => void;
  userEmail: string;
  onSignOut: () => void;
}

export function Header({ search, region, onRegion, theme, onToggleTheme, userEmail, onSignOut }: Props) {
  return (
    <header className={styles.header}>
      <div className={`glass ${styles.bar}`}>
        <div className={styles.brand}>
          <div className={styles.logo} />
          <span className={styles.name}>Reel</span>
        </div>
        <div className={styles.search}>{search}</div>
        <div className={styles.actions}>
          <RegionSelect value={region} onChange={onRegion} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            className={styles.themeBtn}
            onClick={onSignOut}
            title={userEmail ? `Signed in as ${userEmail} · Sign out` : 'Sign out'}
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6" />
              <path d="M10 11l3-3-3-3M13 8H6" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
