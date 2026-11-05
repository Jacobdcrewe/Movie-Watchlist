import { Search } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { REGIONS, type Region, type SearchResult } from '../../../../shared/types';
import { useSearch } from '../../hooks/useSearch';
import { SearchResults } from './SearchResults';
import styles from './SearchBox.module.css';

interface Props {
  region: Region;
  inList: Set<number>;
  onAdd: (r: SearchResult) => void;
  showShortcut: boolean;
  /** False on view-only lists. */
  canAdd: boolean;
}

export const SearchBox = forwardRef<HTMLInputElement, Props>(function SearchBox(
  { region, inList, onAdd, showShortcut, canAdd },
  ref,
) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { results, loading, error, settledQuery } = useSearch(query, region, focused);
  const q = query.trim();

  const heading = q ? '' : `TRENDING IN ${REGIONS[region].toUpperCase()}`;

  return (
    <>
      <div className={styles.field}>
        <Search size={16} strokeWidth={2} className={styles.icon} aria-hidden />
        <input
          ref={ref}
          className={styles.input}
          value={query}
          placeholder="Search movies to add…"
          aria-label="Search movies"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('');
              e.currentTarget.blur();
            }
            if (e.key === 'Enter' && canAdd && results[0] && settledQuery === q) onAdd(results[0]);
          }}
        />
        {loading && focused && <span className={styles.spinner} aria-label="Loading" />}
        {showShortcut && <span className={styles.kbd}>/</span>}
      </div>
      {focused && (
        <SearchResults
          heading={heading}
          results={results}
          inList={inList}
          onAdd={onAdd}
          canAdd={canAdd}
          error={error}
          emptyText={!loading && settledQuery === q && q && !results.length ? `No matches for “${q}”` : ''}
          regionName={REGIONS[region]}
        />
      )}
    </>
  );
});
