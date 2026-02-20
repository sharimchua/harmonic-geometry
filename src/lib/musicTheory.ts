// ─── Note Names ──────────────────────────────────────────
export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type PitchClass = number; // 0-11

export function getNoteName(pc: PitchClass, useFlats = false): string {
  return useFlats ? NOTE_NAMES_FLAT[pc % 12] : NOTE_NAMES_SHARP[pc % 12];
}

// ─── Interval Data ───────────────────────────────────────
export const INTERVAL_NAMES = [
  'P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'
] as const;

export type IntervalTension = 'perfect' | 'consonant' | 'mild' | 'dissonant' | 'tritone';

export function getIntervalTension(semitones: number): IntervalTension {
  const s = ((semitones % 12) + 12) % 12;
  if (s === 0 || s === 7 || s === 5) return 'perfect';
  if (s === 4 || s === 3 || s === 9 || s === 8) return 'consonant';
  if (s === 2 || s === 10) return 'mild';
  if (s === 6) return 'tritone';
  return 'dissonant'; // 1, 11
}

export function getIntervalName(semitones: number): string {
  return INTERVAL_NAMES[((semitones % 12) + 12) % 12];
}

// ─── Chord Definitions ──────────────────────────────────
export interface ChordType {
  name: string;
  intervals: number[];
  category: string;
}

export const CHORD_CATEGORIES: Record<string, ChordType[]> = {
  'Tertian Triads': [
    { name: 'Major', intervals: [0, 4, 7], category: 'Tertian Triads' },
    { name: 'Minor', intervals: [0, 3, 7], category: 'Tertian Triads' },
    { name: 'Diminished', intervals: [0, 3, 6], category: 'Tertian Triads' },
    { name: 'Augmented', intervals: [0, 4, 8], category: 'Tertian Triads' },
  ],
  'Suspended/Open': [
    { name: 'Sus2', intervals: [0, 2, 7], category: 'Suspended/Open' },
    { name: 'Sus4', intervals: [0, 5, 7], category: 'Suspended/Open' },
    { name: 'Quintal', intervals: [0, 7, 14], category: 'Suspended/Open' },
  ],
  'Seventh Chords': [
    { name: 'Major 7', intervals: [0, 4, 7, 11], category: 'Seventh Chords' },
    { name: 'Dominant 7', intervals: [0, 4, 7, 10], category: 'Seventh Chords' },
    { name: 'Minor 7', intervals: [0, 3, 7, 10], category: 'Seventh Chords' },
    { name: 'm7b5', intervals: [0, 3, 6, 10], category: 'Seventh Chords' },
    { name: 'Diminished 7', intervals: [0, 3, 6, 9], category: 'Seventh Chords' },
  ],
  'Shell Voicings': [
    { name: 'Maj Shell (1-3-7)', intervals: [0, 4, 11], category: 'Shell Voicings' },
    { name: 'Dom Shell (1-3-b7)', intervals: [0, 4, 10], category: 'Shell Voicings' },
    { name: 'Min Shell (1-b3-b7)', intervals: [0, 3, 10], category: 'Shell Voicings' },
  ],
  'Extensions': [
    { name: 'Major 9', intervals: [0, 4, 7, 11, 14], category: 'Extensions' },
    { name: 'Dominant 9', intervals: [0, 4, 7, 10, 14], category: 'Extensions' },
    { name: 'Minor 9', intervals: [0, 3, 7, 10, 14], category: 'Extensions' },
    { name: 'Major 11', intervals: [0, 4, 7, 11, 14, 17], category: 'Extensions' },
    { name: 'Major 13', intervals: [0, 4, 7, 11, 14, 17, 21], category: 'Extensions' },
  ],
  'Altered Dominant': [
    { name: '7b5', intervals: [0, 4, 6, 10], category: 'Altered Dominant' },
    { name: '7#5', intervals: [0, 4, 8, 10], category: 'Altered Dominant' },
    { name: '7b9', intervals: [0, 4, 7, 10, 13], category: 'Altered Dominant' },
    { name: '7#9', intervals: [0, 4, 7, 10, 15], category: 'Altered Dominant' },
    { name: '7#11', intervals: [0, 4, 7, 10, 14, 18], category: 'Altered Dominant' },
    { name: '7b13', intervals: [0, 4, 7, 10, 14, 20], category: 'Altered Dominant' },
  ],
};

// ─── Scale Definitions ───────────────────────────────────
export interface ScaleType {
  name: string;
  intervals: number[];
  category: string;
}

export const SCALE_CATEGORIES: Record<string, ScaleType[]> = {
  'Diatonic': [
    { name: 'Ionian (Major)', intervals: [0, 2, 4, 5, 7, 9, 11], category: 'Diatonic' },
    { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], category: 'Diatonic' },
    { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], category: 'Diatonic' },
    { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], category: 'Diatonic' },
    { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], category: 'Diatonic' },
    { name: 'Aeolian (Minor)', intervals: [0, 2, 3, 5, 7, 8, 10], category: 'Diatonic' },
    { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], category: 'Diatonic' },
  ],
  'Melodic/Harmonic Minor': [
    { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11], category: 'Melodic/Harmonic Minor' },
    { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11], category: 'Melodic/Harmonic Minor' },
    { name: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10], category: 'Melodic/Harmonic Minor' },
    { name: 'Lydian Augmented', intervals: [0, 2, 4, 6, 8, 9, 11], category: 'Melodic/Harmonic Minor' },
  ],
  'Symmetrical': [
    { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], category: 'Symmetrical' },
    { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10], category: 'Symmetrical' },
    { name: 'Dim (H-W)', intervals: [0, 1, 3, 4, 6, 7, 9, 10], category: 'Symmetrical' },
    { name: 'Dim (W-H)', intervals: [0, 2, 3, 5, 6, 8, 9, 11], category: 'Symmetrical' },
  ],
  'Pentatonic/Blues': [
    { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9], category: 'Pentatonic/Blues' },
    { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10], category: 'Pentatonic/Blues' },
    { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], category: 'Pentatonic/Blues' },
  ],
};

// ─── Voicing Utilities ──────────────────────────────────
export function invertChord(intervals: number[], inversion: number): number[] {
  if (inversion === 0 || intervals.length === 0) return [...intervals];
  const notes = [...intervals];
  const inv = ((inversion % notes.length) + notes.length) % notes.length;
  for (let i = 0; i < inv; i++) {
    const lowest = notes.shift()!;
    notes.push(lowest + 12);
  }
  // Normalize relative to new bass
  const bass = notes[0];
  return notes.map(n => n - bass);
}

export function dropVoicing(intervals: number[], drop: number): number[] {
  if (intervals.length < 3) return [...intervals];
  const notes = [...intervals];
  // Drop voicing: take the nth note from top and drop it an octave
  const idx = notes.length - drop;
  if (idx >= 0 && idx < notes.length) {
    notes[idx] = notes[idx] - 12;
  }
  return notes.sort((a, b) => a - b);
}

// Get absolute pitch classes from root + intervals
export function getPitchClasses(root: PitchClass, intervals: number[]): PitchClass[] {
  return intervals.map(i => ((root + i) % 12 + 12) % 12);
}

// ─── Guitar Tuning & CAGED ──────────────────────────────
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4 (MIDI)
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
export const NUM_FRETS = 15;

export interface FretPosition {
  string: number;
  fret: number;
  midi: number;
  pitchClass: PitchClass;
}

export function getFretboardPositions(
  pitchClasses: PitchClass[],
  tuning: number[] = STANDARD_TUNING,
  maxFret: number = NUM_FRETS
): FretPosition[] {
  const positions: FretPosition[] = [];
  for (let s = 0; s < tuning.length; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const midi = tuning[s] + f;
      const pc = midi % 12;
      if (pitchClasses.includes(pc)) {
        positions.push({ string: s, fret: f, midi, pitchClass: pc });
      }
    }
  }
  return positions;
}

// CAGED positions (approximate fret ranges for C major shape)
export interface CAGEDPosition {
  name: string;
  shape: string;
  fretRange: [number, number];
}

export const CAGED_POSITIONS: CAGEDPosition[] = [
  { name: 'C Shape', shape: 'C', fretRange: [0, 3] },
  { name: 'A Shape', shape: 'A', fretRange: [2, 6] },
  { name: 'G Shape', shape: 'G', fretRange: [4, 8] },
  { name: 'E Shape', shape: 'E', fretRange: [7, 10] },
  { name: 'D Shape', shape: 'D', fretRange: [9, 13] },
];

export function getCAGEDForRoot(root: PitchClass): CAGEDPosition[] {
  // Shift CAGED positions based on root (C=0 is reference)
  return CAGED_POSITIONS.map(pos => ({
    ...pos,
    fretRange: [
      (pos.fretRange[0] + root) % NUM_FRETS,
      (pos.fretRange[1] + root) % NUM_FRETS,
    ] as [number, number],
  }));
}

// ─── Label Modes ─────────────────────────────────────────
export type LabelMode = 'notes' | 'intervals' | 'semitones';

export function getLabel(
  pc: PitchClass,
  root: PitchClass,
  mode: LabelMode,
  useFlats = false
): string {
  switch (mode) {
    case 'notes':
      return getNoteName(pc, useFlats);
    case 'intervals':
      return getIntervalName((pc - root + 12) % 12);
    case 'semitones':
      return String((pc - root + 12) % 12);
  }
}
