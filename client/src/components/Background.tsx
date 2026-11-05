import styles from './Background.module.css';

/** The iridescent prism mesh behind the glass, with two soft glows for depth. */
export function Background() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.mesh} />
      <div className={`${styles.glow} ${styles.one}`} />
      <div className={`${styles.glow} ${styles.two}`} />
    </div>
  );
}
