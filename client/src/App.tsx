import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REGIONS } from '../../shared/types';
import styles from './App.module.css';
import { Background } from './components/Background';
import { DetailDrawer } from './components/Detail/DetailDrawer';
import { FiltersPanel } from './components/Filters/FiltersPanel';
import { Header } from './components/Header/Header';
import { SearchBox } from './components/Header/SearchBox';
import { EmptyState, LoadingGrid, MovieCollection } from './components/Movies/MovieCollection';
import { parseScale } from './components/Toolbar/SizeSlider';
import { Toolbar } from './components/Toolbar/Toolbar';
import { useHotkeys } from './hooks/useHotkeys';
import { useNarrow } from './hooks/useNarrow';
import { useProviders } from './hooks/useProviders';
import { useSettings } from './hooks/useSettings';
import { useToast } from './hooks/useToast';
import { useWatchlist } from './hooks/useWatchlist';
import { usePersistentState } from './hooks/usePersistentState';
import {
  emptyState,
  filterEntries,
  genresOf,
  sortEntries,
  summary,
  tabCounts,
  type SortKey,
  type Tab,
  type ViewMode,
} from './lib/watchlist';

interface Props {
  userEmail: string;
  onSignOut: () => void;
}

export default function App({ userEmail, onSignOut }: Props) {
  const toast = useToast();
  const { settings, loaded, update: updateSettings } = useSettings(toast.show);
  const { region, myServices, theme } = settings;
  const { entries, loading, add, update, remove } = useWatchlist(region, loaded, toast.show);
  const services = useProviders(region, myServices, entries);
  const narrow = useNarrow();

  const [tab, setTab] = useState<Tab>('towatch');
  const [sort, setSort] = usePersistentState<SortKey>('reel-sort', 'added');
  const [view, setView] = usePersistentState<ViewMode>('reel-view', 'grid');
  const [scaleRaw, setScaleRaw] = usePersistentState<string>('reel-scale', '1');
  const scale = parseScale(scaleRaw);
  const [genre, setGenre] = useState('All');
  const [onlyMine, setOnlyMine] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useHotkeys({
    onSlash: () => searchRef.current?.focus(),
    onEscape: () => setDetailId(null),
  });

  const genres = useMemo(() => genresOf(entries), [entries]);
  // If the selected genre disappears (e.g. last movie removed), fall back to All.
  useEffect(() => {
    if (!genres.includes(genre)) setGenre('All');
  }, [genres, genre]);

  const visible = useMemo(
    () => sortEntries(filterEntries(entries, { tab, genre, onlyMine, myServices }), sort),
    [entries, tab, genre, onlyMine, myServices, sort],
  );
  const counts = useMemo(() => tabCounts(entries), [entries]);
  const inList = useMemo(() => new Set(entries.map((e) => e.movie.id)), [entries]);
  const detail = entries.find((e) => e.movie.id === detailId) ?? null;
  const regionName = REGIONS[region];

  const toggleService = useCallback(
    (id: number) =>
      updateSettings({ myServices: myServices.includes(id) ? myServices.filter((x) => x !== id) : [...myServices, id] }),
    [myServices, updateSettings],
  );
  const toggleWatched = useCallback((id: number, watched: boolean) => update(id, { watched }), [update]);

  const empty = emptyState(entries.length > 0, regionName);

  return (
    <div className={styles.app}>
      <Background />

      <Header
        region={region}
        onRegion={(r) => updateSettings({ region: r })}
        theme={theme}
        onToggleTheme={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
        userEmail={userEmail}
        onSignOut={onSignOut}
        search={<SearchBox ref={searchRef} region={region} inList={inList} onAdd={add} showShortcut={!narrow} />}
      />

      <main className={styles.main}>
        <Toolbar
          summary={summary(entries, myServices)}
          tab={tab}
          counts={counts}
          onTab={setTab}
          sort={sort}
          onSort={setSort}
          view={view}
          onView={setView}
          scale={scale}
          onScale={(s) => setScaleRaw(String(s))}
        />

        <FiltersPanel
          services={services}
          myServices={myServices}
          onToggleService={toggleService}
          onlyMine={onlyMine}
          onOnlyMine={setOnlyMine}
          genres={genres}
          genre={genre}
          onGenre={setGenre}
        />

        {loading && entries.length === 0 ? (
          <LoadingGrid scale={scale} />
        ) : visible.length === 0 ? (
          <EmptyState title={empty.title} body={empty.body} />
        ) : (
          <MovieCollection
            entries={visible}
            view={view}
            scale={scale}
            wide={!narrow}
            myServices={myServices}
            onOpen={setDetailId}
            onToggleWatched={toggleWatched}
            onRemove={remove}
          />
        )}

        <footer className={styles.footer}>
          Availability for {regionName} · data from{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            TMDB
          </a>{' '}
          &amp;{' '}
          <a href="https://www.justwatch.com/" target="_blank" rel="noreferrer">
            JustWatch
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </footer>
      </main>

      {detail && (
        <DetailDrawer
          entry={detail}
          regionName={regionName}
          myServices={myServices}
          onClose={() => setDetailId(null)}
          onUpdate={update}
          onRemove={remove}
        />
      )}

      {toast.message && (
        <div className={styles.toast} role="alert" onClick={toast.dismiss}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
