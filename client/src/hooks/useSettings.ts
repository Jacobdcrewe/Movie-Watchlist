import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../../../shared/types';
import { api } from '../api/client';

const THEME_KEY = 'reel-theme';

function initialTheme(): Settings['theme'] {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch {
    /* storage unavailable */
  }
  return 'dark';
}

/** Region, subscribed services and theme — persisted on the server. */
export function useSettings(onError: (msg: string) => void) {
  const [settings, setSettings] = useState<Settings>({ region: 'CA', myServices: [], theme: initialTheme() });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .settings()
      .then((s) => setSettings(s))
      .catch((e: Error) => onError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  // Apply theme to <html> and remember it locally so reloads don't flash.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    try {
      localStorage.setItem(THEME_KEY, settings.theme);
    } catch {
      /* ignore */
    }
  }, [settings.theme]);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      api.saveSettings(patch).catch((e: Error) => onError(`Couldn’t save settings: ${e.message}`));
    },
    [onError],
  );

  return { settings, loaded, update };
}
