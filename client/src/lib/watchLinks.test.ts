import { describe, expect, it } from 'vitest';
import { bestStream, watchUrl } from './watchLinks';

const p = (id: number, name: string) => ({ id, name, logoPath: null });

describe('watch links', () => {
  it('builds a search link for known services, including name variants', () => {
    expect(watchUrl(p(8, 'Netflix'), 'Dune: Part Two', null)).toBe('https://www.netflix.com/search?q=Dune%3A%20Part%20Two');
    expect(watchUrl(p(1796, 'Netflix Standard with Ads'), 'Up', null)).toBe('https://www.netflix.com/search?q=Up');
    expect(watchUrl(p(119, 'Amazon Prime Video'), 'Up', null)).toContain('primevideo.com');
  });

  it('falls back to the watch page for unknown services', () => {
    expect(watchUrl(p(999, 'Some Indie Service'), 'Up', 'https://tmdb/watch')).toBe('https://tmdb/watch');
    expect(watchUrl(p(999, 'Some Indie Service'), 'Up', null)).toBeNull();
  });

  it('features a subscribed service first', () => {
    const stream = [p(8, 'Netflix'), p(230, 'Crave')];
    expect(bestStream(stream, [230])?.name).toBe('Crave');
    expect(bestStream(stream, [])?.name).toBe('Netflix');
    expect(bestStream([], [230])).toBeNull();
  });
});
