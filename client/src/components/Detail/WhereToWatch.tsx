import { ArrowUpRight, ExternalLink, Play } from 'lucide-react';
import { bestStream, watchUrl } from '../../lib/watchLinks';
import { ServiceLogo } from '../ui/ServiceLogo';
import type { Availability, Provider } from '../../../../shared/types';
import styles from './Detail.module.css';

interface Props {
  availability: Availability;
  myServices: number[];
  regionName: string;
  /** Movie title, used to open the movie's page on each service. */
  title: string;
}

interface Group {
  label: string;
  rows: { provider: Provider; note: string; highlight: boolean }[];
}

export function WhereToWatch({ availability, myServices, regionName, title }: Props) {
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

  const featured = bestStream(availability.stream, myServices);
  const featuredUrl = featured && watchUrl(featured, title, availability.link);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Where to watch</span>
        <span className="mono-label" style={{ letterSpacing: 0 }}>
          {regionName.toUpperCase()}
        </span>
      </div>

      {featured && featuredUrl && (
        <a className={styles.watchOn} href={featuredUrl} target="_blank" rel="noreferrer">
          <Play size={15} strokeWidth={2} fill="currentColor" aria-hidden />
          Watch on {featured.name}
          <ServiceLogo provider={featured} size={24} />
        </a>
      )}

      {groups.map((g) => (
        <div key={g.label} className={styles.group}>
          <span className="mono-label">{g.label}</span>
          <div className={styles.table}>
            {g.rows.map(({ provider, note, highlight }) => {
              const kind = g.label === 'STREAM' ? 'Incl.' : g.label === 'RENT' ? 'Rent' : 'Buy';
              const url = watchUrl(provider, title, availability.link);
              const content = (
                <>
                  <ServiceLogo provider={provider} size={22} />
                  <span className={styles.providerName}>{provider.name}</span>
                  {note && <span className={styles.providerNote}>{note}</span>}
                  <span className={styles.providerKind}>{kind}</span>
                  {url && <ArrowUpRight className={styles.providerGo} size={15} strokeWidth={2} aria-hidden />}
                </>
              );
              const cls = `${styles.providerRow} ${highlight ? styles.providerMine : ''}`;
              return url ? (
                <a
                  key={provider.id}
                  className={`${cls} ${styles.providerLink}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${kind === 'Incl.' ? 'Watch' : kind} on ${provider.name}`}
                >
                  {content}
                </a>
              ) : (
                <div key={provider.id} className={cls}>
                  {content}
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
