import { ExternalLink } from 'lucide-react';
import { ServiceLogo } from '../ui/ServiceLogo';
import type { Availability, Provider } from '../../../../shared/types';
import styles from './Detail.module.css';

interface Props {
  availability: Availability;
  myServices: number[];
  regionName: string;
}

interface Group {
  label: string;
  rows: { provider: Provider; note: string; highlight: boolean }[];
}

export function WhereToWatch({ availability, myServices, regionName }: Props) {
  const groups: Group[] = [
    {
      label: 'STREAM',
      rows: availability.stream.map((p) => {
        const mine = myServices.includes(p.id);
        return { provider: p, note: mine ? 'Subscribed' : '', highlight: mine };
      }),
    },
    { label: 'RENT', rows: availability.rent.map((p) => ({ provider: p, note: '', highlight: false })) },
    { label: 'BUY', rows: availability.buy.map((p) => ({ provider: p, note: '', highlight: false })) },
  ].filter((g) => g.rows.length);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Where to watch</span>
        <span className="mono-label" style={{ letterSpacing: 0 }}>
          {regionName.toUpperCase()}
        </span>
      </div>

      {groups.map((g) => (
        <div key={g.label} className={styles.group}>
          <span className="mono-label">{g.label}</span>
          <div className={styles.table}>
            {g.rows.map(({ provider, note, highlight }) => {
              return (
                <div key={provider.id} className={`${styles.providerRow} ${highlight ? styles.providerMine : ''}`}>
                  <ServiceLogo provider={provider} size={22} />
                  <span className={styles.providerName}>{provider.name}</span>
                  {note && <span className={styles.providerNote}>{note}</span>}
                  <span className={styles.providerKind}>{g.label === 'STREAM' ? 'Incl.' : g.label === 'RENT' ? 'Rent' : 'Buy'}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {groups.length === 0 && <div className={styles.muted}>Not available in {regionName} right now.</div>}

      {availability.link && (
        <a className={styles.link} href={availability.link} target="_blank" rel="noreferrer">
          See prices on JustWatch <ExternalLink size={13} strokeWidth={2} aria-hidden />
        </a>
      )}
    </section>
  );
}
