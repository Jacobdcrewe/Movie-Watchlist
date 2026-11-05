import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Region, Theme } from '../../../../shared/types';
import { useScrolled } from '../../hooks/useScrolled';
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
  // Light glass at the top of the page; near-solid once content scrolls underneath.
  const scrolled = useScrolled();
  return (
    <header className={styles.header}>
      <div className={`glass ${styles.bar} ${scrolled ? styles.solid : ''}`}>
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
            <LogOut size={17} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
