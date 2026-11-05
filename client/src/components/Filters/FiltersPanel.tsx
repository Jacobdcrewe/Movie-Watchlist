import { ServiceLogo } from '../ui/ServiceLogo';
import type { Provider } from '../../../../shared/types';
import { Toggle } from './Toggle';
import styles from './Filters.module.css';

interface Props {
  services: Provider[];
  myServices: number[];
  onToggleService: (id: number) => void;
  onlyMine: boolean;
  onOnlyMine: (v: boolean) => void;
  genres: string[];
  genre: string;
  onGenre: (g: string) => void;
}

export function FiltersPanel(p: Props) {
  return (
    <section className={`glass ${styles.panel}`} aria-label="Filters">
      <div className={styles.row}>
        <span className={`mono-label ${styles.rowLabel}`}>MY SERVICES</span>
        <div className={`${styles.chips} ${styles.services}`}>
          {p.services.length === 0 && <span className={styles.hint}>Loading services…</span>}
          {p.services.map((s) => {
            const on = p.myServices.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                className={`${styles.chip} ${on ? styles.serviceOn : ''}`}
                onClick={() => p.onToggleService(s.id)}
              >
                <ServiceLogo provider={s} size={18} />
                {s.name}
              </button>
            );
          })}
        </div>
        <Toggle label="Only on my services" checked={p.onlyMine} onChange={p.onOnlyMine} />
      </div>
      <div className={styles.divider} />
      <div className={styles.row}>
        <span className={`mono-label ${styles.rowLabel}`}>GENRE</span>
        <div className={styles.chips} style={{ flex: 1 }}>
          {p.genres.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={g === p.genre}
              className={`${styles.chip} ${g === p.genre ? styles.genreOn : ''}`}
              onClick={() => p.onGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
