import styles from './Filters.module.css';

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.toggle} onClick={() => onChange(!checked)}>
      {label}
      <span className={`${styles.track} ${checked ? styles.trackOn : ''}`}>
        <span className={styles.knob} />
      </span>
    </button>
  );
}
