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

// ─── Harmonic Lock Modes ────────────────────────────────
export type HarmonicLockMode = 'quality' | 'scale';

// ─── Diatonic Analysis ──────────────────────────────────

/** Scale degree names (1-indexed) */
const SCALE_DEGREE_NAMES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
const SCALE_DEGREE_NAMES_LOWER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'] as const;

/**
 * Given a scale (intervals from tonic) and a root pitch class,
 * find the scale degree (0-indexed) of the root, or -1 if non-diatonic.
 */
export function getScaleDegree(scaleTonic: PitchClass, scaleIntervals: number[], harmonicRoot: PitchClass): number {
  const semitones = ((harmonicRoot - scaleTonic) % 12 + 12) % 12;
  return scaleIntervals.indexOf(semitones);
}

/**
 * Build a diatonic chord on a given scale degree by stacking thirds from the scale.
 * Returns intervals relative to the chord root.
 */
export function buildDiatonicChord(scaleIntervals: number[], degree: number, numNotes: number = 4): number[] {
  const len = scaleIntervals.length;
  const intervals: number[] = [0];
  for (let i = 1; i < numNotes; i++) {
    const scaleDegIdx = (degree + i * 2) % len;
    const octaveOffset = Math.floor((degree + i * 2) / len) * 12;
    const interval = (scaleIntervals[scaleDegIdx] + octaveOffset) - scaleIntervals[degree];
    intervals.push(interval);
  }
  return intervals;
}

/**
 * Find the best matching chord type for a set of intervals.
 */
export function findMatchingChord(intervals: number[]): ChordType | null {
  const normalized = intervals.map(i => ((i % 12) + 12) % 12).sort((a, b) => a - b);
  const allChords = Object.values(CHORD_CATEGORIES).flat();
  
  // Try exact match first (check triads for 3-note, 7ths for 4-note)
  for (const chord of allChords) {
    const chordNorm = chord.intervals.map(i => ((i % 12) + 12) % 12).sort((a, b) => a - b);
    if (chordNorm.length === normalized.length && chordNorm.every((v, i) => v === normalized[i])) {
      return chord;
    }
  }
  // Try matching just the first N notes
  for (const chord of allChords) {
    const chordNorm = chord.intervals.slice(0, normalized.length).map(i => ((i % 12) + 12) % 12).sort((a, b) => a - b);
    if (chordNorm.length === normalized.length && chordNorm.every((v, i) => v === normalized[i])) {
      return chord;
    }
  }
  return null;
}

/**
 * Get the diatonic chord for a given scale degree.
 * Tries 7th chord first, falls back to triad.
 */
export function getDiatonicChordForDegree(scaleIntervals: number[], degree: number): ChordType | null {
  // Try 7th chord
  const seventh = buildDiatonicChord(scaleIntervals, degree, 4);
  const match7 = findMatchingChord(seventh);
  if (match7) return match7;
  
  // Fall back to triad
  const triad = buildDiatonicChord(scaleIntervals, degree, 3);
  return findMatchingChord(triad);
}

// ─── Functional Analysis ────────────────────────────────

export interface FunctionalAnalysis {
  scaleDegree: number; // 0-indexed, -1 if non-diatonic
  degreeName: string; // e.g. "IV", "ii", "V"
  functionName: string; // e.g. "Subdominant"
  description: string; // e.g. "A sense of opening up, moving away from home"
  isDiatonic: boolean;
}

const FUNCTION_NAMES: Record<number, string> = {
  0: 'Tonic',
  1: 'Supertonic',
  2: 'Mediant',
  3: 'Subdominant',
  4: 'Dominant',
  5: 'Submediant',
  6: 'Leading Tone',
};

const FUNCTION_DESCRIPTIONS: Record<number, string> = {
  0: 'Home base. Stable and resolved — this is where the music rests.',
  1: 'A gentle pull away from home. Often leads to the Dominant.',
  2: 'A colorful passing point — shares notes with both Tonic and Dominant.',
  3: 'Opens up the harmony. Creates a sense of floating away from home.',
  4: 'Maximum tension. Wants to resolve back to Tonic.',
  5: 'The relative area — warm and reflective, a softer alternative to Tonic.',
  6: 'Restless and unstable. The strongest pull toward resolution.',
};

const CHORD_VIBES: Record<string, string> = {
  'Major': 'Bright, happy, and open',
  'Minor': 'Warm, reflective, and introspective',
  'Diminished': 'Tense, mysterious, and unstable',
  'Augmented': 'Dreamy, floating, and unresolved',
  'Sus2': 'Open and airy — neither major nor minor',
  'Sus4': 'Suspended and anticipatory — wants to resolve',
  'Major 7': 'Dreamy and lush, like a soft sunset',
  'Dominant 7': 'Bluesy tension — wants to move somewhere',
  'Minor 7': 'Smooth, mellow, and soulful',
  'm7b5': 'Dark and yearning — the classic jazz minor sound',
  'Diminished 7': 'Dramatic and symmetrical — every note is equal',
  'Major 9': 'Rich and expansive — sophisticated warmth',
  'Dominant 9': 'Funky and bright — a wider dominant color',
  'Minor 9': 'Lush and deep — neo-soul territory',
};

export function analyzeFunctionalRole(
  scaleTonic: PitchClass,
  scaleIntervals: number[] | null,
  harmonicRoot: PitchClass,
  chordName: string
): FunctionalAnalysis {
  if (!scaleIntervals) {
    return {
      scaleDegree: -1,
      degreeName: '—',
      functionName: 'No scale selected',
      description: CHORD_VIBES[chordName] || 'A unique harmonic color',
      isDiatonic: false,
    };
  }

  const degree = getScaleDegree(scaleTonic, scaleIntervals, harmonicRoot);
  
  if (degree === -1) {
    return {
      scaleDegree: -1,
      degreeName: 'Non-diatonic',
      functionName: 'Chromatic',
      description: `Outside the current scale. ${CHORD_VIBES[chordName] || 'A unique harmonic color.'}`,
      isDiatonic: false,
    };
  }

  // Determine if the chord is "minor-ish" for numeral casing
  const isMinorQuality = chordName.includes('Minor') || chordName.includes('min') || 
    chordName.includes('m7') || chordName === 'Diminished' || chordName === 'Diminished 7';
  const degreeName = isMinorQuality ? SCALE_DEGREE_NAMES_LOWER[degree] : SCALE_DEGREE_NAMES[degree];

  return {
    scaleDegree: degree,
    degreeName,
    functionName: FUNCTION_NAMES[degree] || 'Unknown',
    description: FUNCTION_DESCRIPTIONS[degree] || '',
    isDiatonic: true,
  };
}

export function getChordVibe(chordName: string): string {
  return CHORD_VIBES[chordName] || 'A unique harmonic color';
}

/**
 * Given a set of pitch classes, try to identify the chord name and root.
 * Returns { root, chord } or null.
 */
export function identifyChordFromPitchClasses(pitchClasses: PitchClass[]): { root: PitchClass; chord: ChordType } | null {
  if (pitchClasses.length < 2) return null;
  const allChords = Object.values(CHORD_CATEGORIES).flat();
  
  // Try each pitch class as a potential root
  for (const candidateRoot of pitchClasses) {
    const intervals = pitchClasses
      .map(pc => ((pc - candidateRoot) % 12 + 12) % 12)
      .sort((a, b) => a - b);
    
    for (const chord of allChords) {
      const chordNorm = chord.intervals.map(i => ((i % 12) + 12) % 12).sort((a, b) => a - b);
      if (chordNorm.length === intervals.length && chordNorm.every((v, i) => v === intervals[i])) {
        return { root: candidateRoot, chord };
      }
    }
  }
  return null;
}
