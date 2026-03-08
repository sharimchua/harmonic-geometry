import { useState, useCallback } from 'react';

const COOKIE_KEY = 'hg_section_order';
const COL_COOKIE_KEY = 'hg_section_cols';

export type SectionId = 'context' | 'intervals' | 'cadence' | 'dissonance' | 'staff' | 'piano' | 'fretboard';

/** Column assignment: 'analysis' (left), 'instruments' (center), 'cadence' (right at 3col) */
export type ColumnId = 'analysis' | 'instruments';

const DEFAULT_ORDER: SectionId[] = ['context', 'intervals', 'staff', 'piano', 'fretboard', 'dissonance', 'cadence'];

/** Default column assignments */
const DEFAULT_COLUMNS: Record<SectionId, ColumnId> = {
  context: 'analysis',
  intervals: 'analysis',
  dissonance: 'analysis',
  cadence: 'analysis',
  staff: 'instruments',
  piano: 'instruments',
  fretboard: 'instruments',
};

function readCookie<T>(key: string, validator: (val: unknown) => T | null): T | null {
  try {
    const match = document.cookie.split('; ').find(c => c.startsWith(key + '='));
    if (!match) return null;
    const val = JSON.parse(decodeURIComponent(match.split('=')[1]));
    return validator(val);
  } catch {}
  return null;
}

function writeCookie(key: string, value: unknown) {
  const val = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${key}=${val};path=/;max-age=${60 * 60 * 24 * 365}`;
}

function validateOrder(val: unknown): SectionId[] | null {
  if (Array.isArray(val) && DEFAULT_ORDER.every(id => val.includes(id)) && val.length === DEFAULT_ORDER.length) return val as SectionId[];
  return null;
}

function validateColumns(val: unknown): Record<SectionId, ColumnId> | null {
  if (val && typeof val === 'object' && DEFAULT_ORDER.every(id => (val as any)[id] === 'analysis' || (val as any)[id] === 'instruments')) {
    return val as Record<SectionId, ColumnId>;
  }
  return null;
}

export function useSectionOrder() {
  const [order, setOrder] = useState<SectionId[]>(() => readCookie(COOKIE_KEY, validateOrder) ?? DEFAULT_ORDER);
  const [columns, setColumns] = useState<Record<SectionId, ColumnId>>(() => readCookie(COL_COOKIE_KEY, validateColumns) ?? DEFAULT_COLUMNS);

  const moveUp = useCallback((id: SectionId) => {
    setOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      writeCookie(COOKIE_KEY, next);
      return next;
    });
  }, []);

  const moveDown = useCallback((id: SectionId) => {
    setOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      writeCookie(COOKIE_KEY, next);
      return next;
    });
  }, []);

  const moveToColumn = useCallback((id: SectionId, col: ColumnId) => {
    setColumns(prev => {
      const next = { ...prev, [id]: col };
      writeCookie(COL_COOKIE_KEY, next);
      return next;
    });
  }, []);

  return { order, columns, moveUp, moveDown, moveToColumn };
}
