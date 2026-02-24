
"use client";

import { useEffect, useState } from "react";

export default function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      const raw = localStorage.getItem(key);
      if (raw == null) return;
      const parsed = JSON.parse(raw) as T;
      setValue(parsed);
    } catch {
      // Invalid or missing stored value: keep initial
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
  }, [key, value]);

  return [value, setValue] as const;
}
