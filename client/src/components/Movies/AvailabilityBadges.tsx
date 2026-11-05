import type { Availability, Provider } from '../../../../shared/types';
import { serviceColor } from '../../lib/serviceColor';
import styles from './Movies.module.css';

export function ServiceBadge({ provider, mine }: { provider: Provider; mine: boolean }) {
  return (
    <span className={`${styles.badge} ${mine ? styles.badgeMine : ''}`} title={mine ? 'On your services' : undefined}>
      <span className={styles.badgeDot} style={{ background: serviceColor(provider.name, provider.id) }} />
      {provider.name}
    </span>
  );
}

export function TransactBadge({ kind, providers }: { kind: 'RENT' | 'BUY'; providers: Provider[] }) {
  if (!providers.length) return null;
  const extra = providers.length > 1 ? ` +${providers.length - 1}` : '';
  return (
    <span className={styles.dashed} title={providers.map((p) => p.name).join(', ')}>
      <span className={styles.dashedKind}>{kind}</span>
      {providers[0].name}
      {extra}
    </span>
  );
}

interface Props {
  availability: Availability;
  myServices: number[];
  /** Compact mode (grid cards): first two services + "+N", rent only when nothing streams. */
  compact?: boolean;
}

/** Streaming services first, subscribed ones highlighted; then rent / buy options. */
export function AvailabilityBadges({ availability, myServices, compact }: Props) {
  const { stream, rent, buy } = availability;
  // Show services you subscribe to first.
  const ordered = [...stream].sort((a, b) => Number(myServices.includes(b.id)) - Number(myServices.includes(a.id)));
  const shown = compact ? ordered.slice(0, 2) : ordered;
  const more = ordered.length - shown.length;

  return (
    <>
      {shown.map((p) => (
        <ServiceBadge key={p.id} provider={p} mine={myServices.includes(p.id)} />
      ))}
      {more > 0 && <span className={styles.more}>+{more}</span>}
      {(!compact || !stream.length) && <TransactBadge kind="RENT" providers={rent} />}
      {(!compact || (!stream.length && !rent.length)) && <TransactBadge kind="BUY" providers={buy} />}
      {!stream.length && !rent.length && !buy.length && <span className={styles.unavailable}>Not available here</span>}
    </>
  );
}
