import { describe, it, expect } from 'vitest';
import {
  identifyChordFromPitchClasses,
  getChordPartialsFromVoicing,
  analyzeFunctionalRole,
  getLabel,
  getTriPitchClass,
  encodePianoTriangles,
  calculateChordCoincidence,
  shouldKeyUseFlats,
} from '@/lib/musicTheory';
import { pitchClassToAngle, sortPitchClassesClockwise } from '@/components/PitchClock';

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
    expect(result!.chord.name).toBe('1 – b2 – b5');
    expect(result!.chord.category).toBe('Voicing');
  });

  it('identifies dyads using bass pitch class as root', () => {
    const result = identifyChordFromPitchClasses([0, 7], {
      bassPitchClass: 7,
      preferredRoot: 0,
    });

    expect(result!.root).toBe(7);
    expect(result!.matchKind).toBe('dyad');
    expect(result!.chord.name).toBe('Dyad (P4)');
  });
});

describe('Pitch Clock 12 o\'clock Recentring & Polygon Ordering', () => {
  it('places the active anchor pitch class at 12 o\'clock (-PI/2) and its tritone at 6 o\'clock (+PI/2)', () => {
    // Tonic = D (2)
    expect(pitchClassToAngle(2, 2)).toBeCloseTo(-Math.PI / 2, 5);
    // Tritone of D = Ab (8) -> 6 o'clock (+PI/2)
    expect(pitchClassToAngle(8, 2)).toBeCloseTo(Math.PI / 2, 5);
    // Perfect 5th of D = A (9) -> 7 o'clock (120 degrees)
    expect(pitchClassToAngle(9, 2)).toBeCloseTo((120 * Math.PI) / 180, 5);
  });

  it('sorts and deduplicates extended chord pitch classes clockwise around the 12 o\'clock anchor', () => {
    // C Major 9: intervals [0, 4, 7, 11, 14] -> pitch classes [0, 4, 7, 11, 2]
    // Unsorted would self-intersect (11 -> 2 -> 0). Sorted around C(0) must be [0, 2, 4, 7, 11]
    expect(sortPitchClassesClockwise([0, 4, 7, 11, 2], 0)).toEqual([0, 2, 4, 7, 11]);

    // When anchor is G (7), clockwise order from 12 o'clock G is [7, 11, 0, 2, 4]
    expect(sortPitchClassesClockwise([0, 4, 7, 11, 2], 7)).toEqual([7, 11, 0, 2, 4]);
  });
});

describe('Music Theory Audit Fixes & PPT Synergies', () => {
  it('computes monotonically ascending frequencies for chord voicings crossing the C octave boundary', () => {
    // A4 Major triad: root = 9 (A), intervals = [0, 4, 7] -> A4 (440Hz), C#5 (~554.37Hz), E5 (~659.25Hz)
    const { noteFrequencies } = getChordPartialsFromVoicing(9, [0, 4, 7], 4);
    expect(noteFrequencies[0].freq).toBeCloseTo(440, 1);
    expect(noteFrequencies[1].freq).toBeGreaterThan(noteFrequencies[0].freq);
    expect(noteFrequencies[2].freq).toBeGreaterThan(noteFrequencies[1].freq);
    expect(noteFrequencies[1].midi).toBe(73); // C#5, not C#4 (61)
  });

  it('produces accurate mode-aware Roman numerals (e.g. bIII, bVI, bVII in Aeolian)', () => {
    const aeolian = [0, 2, 3, 5, 7, 8, 10];
    // Eb Major (pc 3) in C Aeolian (tonic 0) -> bIII
    const mediant = analyzeFunctionalRole(0, aeolian, 3, 'Major');
    expect(mediant.isDiatonic).toBe(true);
    expect(mediant.degreeName).toBe('♭III');

    // Ab Major (pc 8) in C Aeolian -> bVI
    const submediant = analyzeFunctionalRole(0, aeolian, 8, 'Major');
    expect(submediant.degreeName).toBe('♭VI');
  });

  it('uses canonical PPT Solfège (Fi for tritone, So for fifth) and Tri Pitch-Class notation', () => {
    expect(getLabel(6, 0, 'solfege', false, 0)).toBe('Fi');
    expect(getLabel(7, 0, 'solfege', false, 0)).toBe('So');
    expect(getTriPitchClass(6, 'symbol')).toBe('△C');
    expect(getTriPitchClass(1, 'symbol')).toBe('△G');
    expect(getTriPitchClass(5, 'symbol')).toBe('F');
    expect(getTriPitchClass(11, 'symbol')).toBe('B');
  });

  it('encodes Piano Triangle strings accurately for close and spread voicings', () => {
    // C Major triad (C4=60, E4=64, G4=67) -> R3 L1 U1
    expect(encodePianoTriangles([60, 64, 67])).toBe('R3L1U1');
    // D Major 7 root position (D4=62, F#4=66, A4=69, C#5=73) -> D2 L3 U3 D1
    expect(encodePianoTriangles([62, 66, 69, 73])).toBe('D2L3U3D1');
    // D Major 7 with 7th in bass (C#4=61, D4=62, F#4=66, A4=69) -> D12 L3 U3
    expect(encodePianoTriangles([61, 62, 66, 69])).toBe('D12L3U3');
  });

  it('computes Coincidence Super-Cycle and Just Intonation ratios for triads', () => {
    // Major triad [0, 4, 7] -> 4:5:6, 4 root turns to align, 5-limit
    const maj = calculateChordCoincidence([0, 4, 7]);
    expect(maj.integerRatioString).toBe('4:5:6');
    expect(maj.rootTurnsToAlign).toBe(4);
    expect(maj.primeLimit).toBe(5);

    // Minor triad [0, 3, 7] -> 10:12:15, 10 root turns to align, 5-limit
    const min = calculateChordCoincidence([0, 3, 7]);
    expect(min.integerRatioString).toBe('10:12:15');
    expect(min.rootTurnsToAlign).toBe(10);
  });

  it('auto-detects flat vs sharp keys accurately', () => {
    const ionian = [0, 2, 4, 5, 7, 9, 11];
    const aeolian = [0, 2, 3, 5, 7, 8, 10];
    expect(shouldKeyUseFlats(5, ionian)).toBe(true);  // F Major -> flats
    expect(shouldKeyUseFlats(7, ionian)).toBe(false); // G Major -> sharps
    expect(shouldKeyUseFlats(0, aeolian)).toBe(true); // C Minor -> flats
    expect(shouldKeyUseFlats(9, aeolian)).toBe(false); // A Minor -> naturals/sharps
  });
});
