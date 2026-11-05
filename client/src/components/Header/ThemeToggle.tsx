import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../../../../shared/types';
import styles from './Header.module.css';

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.themeBtn}
      onClick={onToggle}
      title="Toggle light / dark"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun size={17} strokeWidth={1.8} aria-hidden /> : <Moon size={17} strokeWidth={1.8} aria-hidden />}
    </button>
  );
}
