import { useCallback, useEffect, useRef, useState } from 'react';

/** A single transient message (errors from the API). */
export function useToast(duration = 4500) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { message, show, dismiss: () => setMessage(null) };
}
