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
      <span className={styles.themeIcon} />
    </button>
  );
}
