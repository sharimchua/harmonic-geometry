import { useState, useCallback } from 'react';

const COOKIE_KEY = 'hg_section_order';

export type SectionId = 'context' | 'intervals' | 'cadence' | 'dissonance' | 'staff' | 'piano' | 'fretboard';

const DEFAULT_ORDER: SectionId[] = ['context', 'intervals', 'cadence', 'dissonance', 'staff', 'piano', 'fretboard'];

function readCookie(): SectionId[] | null {
  try {
    const match = document.cookie.split('; ').find(c => c.startsWith(COOKIE_KEY + '='));
    if (!match) return null;
    const val = JSON.parse(decodeURIComponent(match.split('=')[1]));
    if (Array.isArray(val) && val.length === DEFAULT_ORDER.length) return val as SectionId[];
  } catch {}
  return null;
}

function writeCookie(order: SectionId[]) {
  const val = encodeURIComponent(JSON.stringify(order));
  document.cookie = `${COOKIE_KEY}=${val};path=/;max-age=${60 * 60 * 24 * 365}`;
}

export function useSectionOrder() {
  const [order, setOrder] = useState<SectionId[]>(() => readCookie() ?? DEFAULT_ORDER);

  const moveUp = useCallback((id: SectionId) => {
    setOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      writeCookie(next);
      return next;
    });
  }, []);

  const moveDown = useCallback((id: SectionId) => {
    setOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      writeCookie(next);
      return next;
    });
  }, []);

  return { order, moveUp, moveDown };
}
