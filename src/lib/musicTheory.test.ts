import { describe, it, expect } from 'vitest';
import { identifyChordFromPitchClasses } from '@/lib/musicTheory';

describe('identifyChordFromPitchClasses', () => {
  it('identifies C-G-B as C Major 7 with omitted 3rd', () => {
    const result = identifyChordFromPitchClasses([0, 7, 11], {
      bassPitchClass: 0,
      preferredRoot: 0,
      scaleTonic: 0,
    });

    expect(result).not.toBeNull();
    expect(result!.root).toBe(0);
    expect(result!.matchKind).toBe('subset');
    expect(result!.chord.name).toBe('Major 7 (no 3)');
    expect(result!.chord.intervals).toEqual([0, 7, 11]);
  });

  it('prefers exact shell voicings over subset names', () => {
    const result = identifyChordFromPitchClasses([0, 4, 11], {
      bassPitchClass: 0,
      preferredRoot: 0,
    });

    expect(result!.matchKind).toBe('exact');
    expect(result!.chord.name).toBe('Maj Shell (1-3-7)');
  });

  it('identifies C-G-A# as C Dominant 7 with omitted 3rd', () => {
    const result = identifyChordFromPitchClasses([0, 7, 10], {
      bassPitchClass: 0,
      preferredRoot: 0,
    });

    expect(result!.root).toBe(0);
    expect(result!.chord.name).toBe('Dominant 7 (no 3)');
  });

  it('uses bass note to choose root when multiple interpretations exist', () => {
    const result = identifyChordFromPitchClasses([0, 4, 7], {
      bassPitchClass: 4,
      preferredRoot: 0,
    });

    expect(result!.root).toBe(0);
    expect(result!.chord.name).toBe('Major');
  });

  it('falls back to interval formula for unrecognized sets', () => {
    const result = identifyChordFromPitchClasses([0, 1, 6], {
      bassPitchClass: 0,
      preferredRoot: 0,
    });

    expect(result!.matchKind).toBe('fallback');
    expect(result!.root).toBe(0);
    expect(result!.chord.name).toBe('1 – b2 – #4');
    expect(result!.chord.category).toBe('Voicing');
  });

  it('identifies dyads using bass pitch class as root', () => {
    const result = identifyChordFromPitchClasses([0, 7], {
      bassPitchClass: 7,
      preferredRoot: 0,
    });

    expect(result!.root).toBe(7);
    expect(result!.matchKind).toBe('dyad');
    expect(result!.chord.name).toBe('Dyad (P5)');
  });
});
