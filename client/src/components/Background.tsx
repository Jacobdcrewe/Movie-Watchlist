import styles from './Background.module.css';

/** The three softly blurred colour blobs behind the frosted glass. */
export function Background() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={`${styles.blob} ${styles.one}`} />
      <div className={`${styles.blob} ${styles.two}`} />
      <div className={`${styles.blob} ${styles.three}`} />
    </div>
  );
}
