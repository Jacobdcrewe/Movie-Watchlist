import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REGIONS } from '../../shared/types';
import styles from './App.module.css';
import { Background } from './components/Background';
import { DetailDrawer } from './components/Detail/DetailDrawer';
import { ConfirmDialog, NameDialog } from './components/Dialogs/NameDialog';
import { ShareDialog } from './components/Dialogs/ShareDialog';
import { FiltersPanel } from './components/Filters/FiltersPanel';
import { Header } from './components/Header/Header';
import { SearchBox } from './components/Header/SearchBox';
import { ListSwitcher } from './components/Lists/ListSwitcher';
import { EmptyState, LoadingGrid, MovieCollection } from './components/Movies/MovieCollection';
import { parseScale } from './components/Toolbar/SizeSlider';
import { Toolbar } from './components/Toolbar/Toolbar';
import { useHotkeys } from './hooks/useHotkeys';
import { useLists } from './hooks/useLists';
import { useNarrow } from './hooks/useNarrow';
import { usePersistentState } from './hooks/usePersistentState';
import { useProviders } from './hooks/useProviders';
import { useSettings } from './hooks/useSettings';
import { useToast } from './hooks/useToast';
import { useWatchlist } from './hooks/useWatchlist';
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
  userId: string;
  userEmail: string;
  onSignOut: () => void;
}

type Dialog = 'new' | 'rename' | 'share' | 'delete' | null;

export default function App({ userId, userEmail, onSignOut }: Props) {
  const toast = useToast();
  const { settings, loaded, update: updateSettings } = useSettings(toast.show);
  const { region, myServices, theme } = settings;

  const saveCurrentList = useCallback((id: string) => updateSettings({ currentListId: id }), [updateSettings]);
  const lists = useLists(settings.currentListId, loaded, saveCurrentList, toast.show);
  const current = lists.current;
  const readOnly = current?.role === 'viewer';

  const { entries, loading, add, update, remove } = useWatchlist(current?.id ?? null, region, toast.show);
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
  const [dialog, setDialog] = useState<Dialog>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useHotkeys({
    onSlash: () => searchRef.current?.focus(),
    onEscape: () => setDetailId(null),
  });

  // Close the drawer when switching lists.
  useEffect(() => setDetailId(null), [current?.id]);

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

  const empty = readOnly && entries.length === 0
    ? { title: 'Nothing on this list yet', body: 'Movies the owner adds will show up here.' }
    : emptyState(entries.length > 0, regionName);
  const busy = !lists.loaded || (loading && entries.length === 0);

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
        search={
          <SearchBox
            ref={searchRef}
            region={region}
            inList={inList}
            onAdd={add}
            canAdd={!!current && !readOnly}
            showShortcut={!narrow}
          />
        }
      />

      <main className={styles.main}>
        <Toolbar
          title={
            <ListSwitcher
              lists={lists.lists}
              current={current}
              onSelect={lists.select}
              onNew={() => setDialog('new')}
              onRename={() => setDialog('rename')}
              onShare={() => setDialog('share')}
              onDelete={() => setDialog('delete')}
            />
          }
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
          regionName={regionName}
        />

        {busy ? (
          <LoadingGrid scale={scale} />
        ) : visible.length === 0 ? (
          <EmptyState title={empty.title} body={empty.body} />
        ) : (
          <MovieCollection
            entries={visible}
            view={view}
            scale={scale}
            wide={!narrow}
            readOnly={readOnly}
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
          readOnly={readOnly}
          onClose={() => setDetailId(null)}
          onUpdate={update}
          onRemove={remove}
        />
      )}

      {dialog === 'new' && (
        <NameDialog title="New list" submitLabel="Create" onSubmit={lists.create} onClose={() => setDialog(null)} />
      )}
      {dialog === 'rename' && current && (
        <NameDialog
          title="Rename list"
          initial={current.name}
          submitLabel="Save"
          onSubmit={(name) => lists.rename(current.id, name)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'share' && current && (
        <ShareDialog
          list={current}
          myId={userId}
          onClose={() => setDialog(null)}
          onChanged={() => lists.refresh().catch(() => {})}
        />
      )}
      {dialog === 'delete' && current && (
        <ConfirmDialog
          title={current.role === 'owner' ? 'Delete list?' : 'Leave list?'}
          message={
            current.role === 'owner'
              ? `“${current.name}” and all its movies will be deleted for everyone it’s shared with. This can’t be undone.`
              : `You’ll lose access to “${current.name}”. The owner can share it with you again.`
          }
          confirmLabel={current.role === 'owner' ? 'Delete' : 'Leave'}
          onConfirm={() => lists.removeOrLeave(current)}
          onClose={() => setDialog(null)}
        />
      )}

      {toast.message && (
        <div className={`prism-edge ${styles.toast}`} role="alert" onClick={toast.dismiss}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
