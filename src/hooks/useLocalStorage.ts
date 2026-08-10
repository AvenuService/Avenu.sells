import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function useDebounce<T>(value: T, delay = 280) {
  const [debounced, setDebounced] = useState(value);
  const t = useRef<number | undefined>(undefined);

  useEffect(() => {
    t.current = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t.current);
  }, [value, delay]);

  return debounced;
}
