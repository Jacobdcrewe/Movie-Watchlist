import { MonitorPlay } from 'lucide-react';
import type { Provider } from '../../../../shared/types';
import { ScrollRow } from '../ui/ScrollRow';
import { ServicesMenu } from './ServicesMenu';
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
  regionName: string;
}

/**
 * Compact filter bar. Desktop: [My services ▾] [Streamable] | genres… on one line.
 * Mobile: services + Streamable on top, the genre scroller below.
 */
export function FiltersPanel(p: Props) {
  return (
    <section className={`glass ${styles.bar}`} aria-label="Filters">
      <div className={styles.lead}>
        <ServicesMenu
          services={p.services}
          myServices={p.myServices}
          onToggle={p.onToggleService}
          regionName={p.regionName}
        />
        <button
          type="button"
          aria-pressed={p.onlyMine}
          className={`${styles.chip} ${styles.streamable} ${p.onlyMine ? styles.on : ''}`}
          title="Only show movies on your services"
          onClick={() => p.onOnlyMine(!p.onlyMine)}
        >
          <MonitorPlay size={15} strokeWidth={2} aria-hidden />
          Streamable
        </button>
      </div>

      <span className={styles.divider} aria-hidden />

      <ScrollRow ariaLabel="Genres" selectedKey={p.genre} className={styles.genres}>
        {p.genres.map((g) => (
          <button
            key={g}
            type="button"
            data-key={g}
            aria-pressed={g === p.genre}
            className={`${styles.chip} ${g === p.genre ? styles.on : ''}`}
            onClick={() => p.onGenre(g)}
          >
            {g}
          </button>
        ))}
      </ScrollRow>
    </section>
  );
}
