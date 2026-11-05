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
}

export function Header({ search, region, onRegion, theme, onToggleTheme }: Props) {
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
        </div>
      </div>
    </header>
  );
}
