import { useLayoutEffect, useRef, useState } from 'react';
import type { Availability, Provider } from '../../../../shared/types';
import { ServiceLogo } from '../ui/ServiceLogo';
import styles from './Movies.module.css';

export function ServiceBadge({ provider, mine }: { provider: Provider; mine: boolean }) {
  return (
    <span className={`${styles.badge} ${mine ? styles.badgeMine : ''}`} title={mine ? `${provider.name} · on your services` : provider.name}>
      <ServiceLogo provider={provider} size={15} />
      <span className={styles.badgeText}>{provider.name}</span>
    </span>
  );
}

export function TransactBadge({ kind, providers }: { kind: 'RENT' | 'BUY'; providers: Provider[] }) {
  if (!providers.length) return null;
  const extra = providers.length > 1 ? ` +${providers.length - 1}` : '';
  return (
    <span className={styles.dashed} title={providers.map((p) => p.name).join(', ')}>
      <span className={styles.dashedKind}>{kind}</span>
      <span className={styles.badgeText}>
        {providers[0].name}
        {extra}
      </span>
    </span>
  );
}

const TILE = 22;
const GAP = 5;
const MORE = 30; // approx. width of the "+N" pill

/**
 * One line of service logos (yours first, ringed), as many as fit, then "+N".
 * Measures its own width so it adapts to card size, the size slider and mobile.
 */
function LogoStrip({ providers, myServices }: { providers: Provider[]; myServices: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const fitsAll = Math.floor((width + GAP) / (TILE + GAP));
  const count =
    !width || providers.length <= fitsAll ? providers.length : Math.max(1, Math.floor((width - MORE) / (TILE + GAP)));
  const shown = providers.slice(0, count);
  const hidden = providers.slice(count);
  const names = providers.map((p) => p.name).join(', ');

  return (
    <div ref={ref} className={styles.logoStrip} role="list" aria-label={`Streaming on ${names}`}>
      {shown.map((p) => {
        const mine = myServices.includes(p.id);
        return (
          <span
            key={p.id}
            role="listitem"
            className={`${styles.logoTile} ${mine ? styles.logoTileMine : ''}`}
            title={mine ? `${p.name} · on your services` : p.name}
          >
            <ServiceLogo provider={p} size={TILE} fallback="initial" />
          </span>
        );
      })}
      {hidden.length > 0 && (
        <span role="listitem" className={styles.more} title={hidden.map((p) => p.name).join(', ')}>
          +{hidden.length}
        </span>
      )}
    </div>
  );
}

interface Props {
  availability: Availability;
  myServices: number[];
  /** Compact mode (grid cards): one line of service logos; rent/buy only when nothing streams. */
  compact?: boolean;
}

/** Streaming services first, subscribed ones highlighted; then rent / buy options. */
export function AvailabilityBadges({ availability, myServices, compact }: Props) {
  const { stream, rent, buy } = availability;
  // Show services you subscribe to first.
  const ordered = [...stream].sort((a, b) => Number(myServices.includes(b.id)) - Number(myServices.includes(a.id)));
  const nothing = !stream.length && !rent.length && !buy.length;

  if (compact) {
    if (ordered.length) return <LogoStrip providers={ordered} myServices={myServices} />;
    if (rent.length) return <TransactBadge kind="RENT" providers={rent} />;
    if (buy.length) return <TransactBadge kind="BUY" providers={buy} />;
    return <span className={styles.unavailable}>Not available here</span>;
  }

  return (
    <>
      {ordered.map((p) => (
        <ServiceBadge key={p.id} provider={p} mine={myServices.includes(p.id)} />
      ))}
      <TransactBadge kind="RENT" providers={rent} />
      <TransactBadge kind="BUY" providers={buy} />
      {nothing && <span className={styles.unavailable}>Not available here</span>}
    </>
  );
}
