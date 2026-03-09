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

export const FULL_INTERVAL_NAMES: Record<string, string> = {
  'P1': 'Unison',
  'm2': 'Minor 2nd',
  'M2': 'Major 2nd',
  'm3': 'Minor 3rd',
  'M3': 'Major 3rd',
  'P4': 'Perfect 4th',
  'TT': 'Tritone',
  'P5': 'Perfect 5th',
  'm6': 'Minor 6th',
  'M6': 'Major 6th',
  'm7': 'Minor 7th',
  'M7': 'Major 7th',
};

export type IntervalTension = 'perfect' | 'consonant' | 'mild' | 'dissonant' | 'tritone';

export function getIntervalTension(semitones: number): IntervalTension {
  const s = ((semitones % 12) + 12) % 12;
  if (s === 0 || s === 7 || s === 5) return 'perfect';
  if (s === 4 || s === 3 || s === 9 || s === 8) return 'consonant';
  if (s === 2 || s === 10) return 'mild';
  if (s === 6) return 'tritone';
  return 'dissonant'; // 1, 11
}

// ─── Shared Tension Visual Constants ─────────────────────
export const TENSION_COLORS: Record<IntervalTension, string> = {
  perfect: 'hsl(220, 55%, 58%)',
  consonant: 'hsl(150, 55%, 42%)',
  mild: 'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone: 'hsl(340, 60%, 50%)',
};

export const TENSION_WIDTHS: Record<IntervalTension, number> = {
  perfect: 3,
  consonant: 2.5,
  mild: 2,
  dissonant: 2,
  tritone: 2.5,
};

export const TENSION_LABELS: Record<IntervalTension, string> = {
  perfect: 'Perfect',
  consonant: 'Consonant',
  mild: 'Mild',
  dissonant: 'Dissonant',
  tritone: 'Tritone',
};

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
    { name: 'Minor Major 7', intervals: [0, 3, 7, 11], category: 'Seventh Chords' },
    { name: 'm7b5', intervals: [0, 3, 6, 10], category: 'Seventh Chords' },
    { name: 'Diminished 7', intervals: [0, 3, 6, 9], category: 'Seventh Chords' },
    { name: 'Augmented 7', intervals: [0, 4, 8, 10], category: 'Seventh Chords' },
    { name: 'Augmented Maj 7', intervals: [0, 4, 8, 11], category: 'Seventh Chords' },
  ],
  'Sixth Chords': [
    { name: 'Major 6', intervals: [0, 4, 7, 9], category: 'Sixth Chords' },
    { name: 'Minor 6', intervals: [0, 3, 7, 9], category: 'Sixth Chords' },
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
    { name: 'MinMaj 9', intervals: [0, 3, 7, 11, 14], category: 'Extensions' },
    { name: 'Major 11', intervals: [0, 4, 7, 11, 14, 17], category: 'Extensions' },
    { name: 'Dominant 11', intervals: [0, 4, 7, 10, 14, 17], category: 'Extensions' },
    { name: 'Minor 11', intervals: [0, 3, 7, 10, 14, 17], category: 'Extensions' },
    { name: 'Major 13', intervals: [0, 4, 7, 11, 14, 17, 21], category: 'Extensions' },
    { name: 'Dominant 13', intervals: [0, 4, 7, 10, 14, 17, 21], category: 'Extensions' },
    { name: 'Minor 13', intervals: [0, 3, 7, 10, 14, 17, 21], category: 'Extensions' },
    { name: 'Add 9', intervals: [0, 4, 7, 14], category: 'Extensions' },
    { name: 'Minor Add 9', intervals: [0, 3, 7, 14], category: 'Extensions' },
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
/**
 * Invert a chord by moving the bottom N notes up an octave.
 * Intervals stay relative to the original root so pitch classes are preserved.
 * E.g. Major [0,4,7] inv 1 → [4,7,12] (E is bass, root C moves up)
 */
export function invertChord(intervals: number[], inversion: number): number[] {
  if (inversion === 0 || intervals.length === 0) return [...intervals];
  const notes = [...intervals];
  const inv = ((inversion % notes.length) + notes.length) % notes.length;
  for (let i = 0; i < inv; i++) {
    const lowest = notes.shift()!;
    notes.push(lowest + 12);
  }
  // Keep intervals relative to original root (do NOT re-base)
  return notes;
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

// ─── Voice Leading ──────────────────────────────────────
export interface VoiceLeadingMove {
  from: PitchClass[];  // one or more source tones
  to: PitchClass[];    // one or more destination tones
  semitones: number;   // shortest signed distance (-6 to +6)
}

/**
 * Calculate optimal voice leading between two sets of pitch classes.
 * Uses nearest-neighbor matching with support for splits (1→2) and merges (2→1).
 */
export function calculateVoiceLeading(
  fromPCs: PitchClass[],
  toPCs: PitchClass[]
): VoiceLeadingMove[] {
  if (fromPCs.length === 0 || toPCs.length === 0) return [];

  const moves: VoiceLeadingMove[] = [];
  const fromUsed = new Set<number>();
  const toUsed = new Set<number>();

  // Shortest signed semitone distance (-6 to +6)
  const dist = (a: number, b: number) => {
    const d = ((b - a) % 12 + 12) % 12;
    return d <= 6 ? d : d - 12;
  };

  // Common tones first (distance 0)
  for (let i = 0; i < fromPCs.length; i++) {
    for (let j = 0; j < toPCs.length; j++) {
      if (!fromUsed.has(i) && !toUsed.has(j) && fromPCs[i] === toPCs[j]) {
        moves.push({ from: [fromPCs[i]], to: [toPCs[j]], semitones: 0 });
        fromUsed.add(i);
        toUsed.add(j);
        break;
      }
    }
  }

  // Greedy nearest-neighbor for remaining
  const remainFrom = fromPCs.map((pc, i) => ({ pc, i })).filter(x => !fromUsed.has(x.i));
  const remainTo = toPCs.map((pc, i) => ({ pc, i })).filter(x => !toUsed.has(x.i));

  // Build cost matrix
  const pairs: { fi: number; ti: number; cost: number; d: number }[] = [];
  for (const f of remainFrom) {
    for (const t of remainTo) {
      const d = dist(f.pc, t.pc);
      pairs.push({ fi: f.i, ti: t.i, cost: Math.abs(d), d });
    }
  }
  pairs.sort((a, b) => a.cost - b.cost);

  const usedF2 = new Set<number>();
  const usedT2 = new Set<number>();

  for (const p of pairs) {
    if (usedF2.has(p.fi) || usedT2.has(p.ti)) continue;
    moves.push({ from: [fromPCs[p.fi]], to: [toPCs[p.ti]], semitones: p.d });
    usedF2.add(p.fi);
    usedT2.add(p.ti);
  }

  // Handle unmatched: splits (1 source → multiple targets) or merges (multiple sources → 1 target)
  const unmatchedFrom = remainFrom.filter(x => !usedF2.has(x.i));
  const unmatchedTo = remainTo.filter(x => !usedT2.has(x.i));

  if (unmatchedTo.length > 0 && unmatchedFrom.length === 0) {
    // Extra target notes — find closest matched source for each
    for (const t of unmatchedTo) {
      let bestMove: VoiceLeadingMove | null = null;
      let bestCost = Infinity;
      for (const m of moves) {
        const d = dist(m.from[0], t.pc);
        if (Math.abs(d) < bestCost) {
          bestCost = Math.abs(d);
          bestMove = m;
        }
      }
      if (bestMove) {
        // Add as a split: the source now goes to multiple targets
        bestMove.to.push(t.pc);
      }
    }
  } else if (unmatchedFrom.length > 0 && unmatchedTo.length === 0) {
    // Extra source notes — find closest matched target for each
    for (const f of unmatchedFrom) {
      let bestMove: VoiceLeadingMove | null = null;
      let bestCost = Infinity;
      for (const m of moves) {
        const d = dist(f.pc, m.to[0]);
        if (Math.abs(d) < bestCost) {
          bestCost = Math.abs(d);
          bestMove = m;
        }
      }
      if (bestMove) {
        bestMove.from.push(f.pc);
      }
    }
  } else {
    // Both unmatched — pair them greedily
    for (const f of unmatchedFrom) {
      let bestT: typeof unmatchedTo[0] | null = null;
      let bestCost = Infinity;
      for (const t of unmatchedTo) {
        const d = Math.abs(dist(f.pc, t.pc));
        if (d < bestCost) { bestCost = d; bestT = t; }
      }
      if (bestT) {
        moves.push({ from: [f.pc], to: [bestT.pc], semitones: dist(f.pc, bestT.pc) });
      }
    }
  }

  return moves;
}

// ─── Label Modes ─────────────────────────────────────────
export type LabelMode = 'notes' | 'intervals' | 'scaleDegrees' | 'semitones' | 'solfege';

const SCALE_DEGREE_LABELS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', '#5', '6', 'b7', '7'] as const;

const SOLFEGE_LABELS = ['Do', 'Ra', 'Re', 'Me', 'Mi', 'Fa', 'Se', 'Sol', 'Le', 'La', 'Te', 'Ti'] as const;

/** Get a scale degree label for a pitch class relative to a tonic (e.g. "1", "b3", "#5") */
export function getScaleDegreeLabel(pc: PitchClass, scaleTonic: PitchClass): string {
  const semitones = ((pc - scaleTonic) % 12 + 12) % 12;
  return SCALE_DEGREE_LABELS[semitones];
}

export function getLabel(
  pc: PitchClass,
  root: PitchClass,
  mode: LabelMode,
  useFlats = false,
  scaleTonic?: PitchClass
): string {
  switch (mode) {
    case 'notes':
      return getNoteName(pc, useFlats);
    case 'intervals':
      return getIntervalName((pc - root + 12) % 12);
    case 'scaleDegrees':
      return getScaleDegreeLabel(pc, scaleTonic ?? root);
    case 'semitones':
      return String((pc - root + 12) % 12);
    case 'solfege': {
      const semitones = ((pc - (scaleTonic ?? root)) % 12 + 12) % 12;
      return SOLFEGE_LABELS[semitones];
    }
  }
}

/** Convert chord intervals to formula notation (e.g. "1 - 3 - 5 - 7") */
export function getChordFormula(intervals: number[]): string {
  return intervals.map(i => {
    const semitones = ((i % 12) + 12) % 12;
    return SCALE_DEGREE_LABELS[semitones];
  }).join(' – ');
}

/** Find all major scale tonics that contain all given pitch classes diatonically */
export function findCompatibleKeys(pitchClasses: PitchClass[]): PitchClass[] {
  if (pitchClasses.length === 0) return [];
  const majorScale = [0, 2, 4, 5, 7, 9, 11]; // Ionian intervals
  const compatible: PitchClass[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    const scalePCs = majorScale.map(i => (tonic + i) % 12);
    if (pitchClasses.every(pc => scalePCs.includes(pc))) {
      compatible.push(tonic);
    }
  }
  return compatible;
}

/** Genre/usage hints for chord types */
export const CHORD_GENRE_HINTS: Record<string, string> = {
  'Major': 'Pop, Rock, Folk, Country',
  'Minor': 'Pop, Rock, R&B, Classical',
  'Diminished': 'Classical, Jazz, Film Scores',
  'Augmented': 'Jazz, Film Scores, Progressive Rock',
  'Sus2': 'Indie, Post-Rock, Ambient',
  'Sus4': 'Rock, Pop, Gospel',
  'Major 7': 'Jazz, Neo-Soul, Bossa Nova',
  'Dominant 7': 'Blues, Jazz, Funk, Rock & Roll',
  'Minor 7': 'Jazz, R&B, Neo-Soul, Lo-Fi',
  'm7b5': 'Jazz, Latin Jazz, Film Scores',
  'Diminished 7': 'Classical, Jazz, Ragtime',
  'Minor Major 7': 'Jazz, Film Noir, Bond Themes',
  'Augmented 7': 'Jazz, Fusion, Progressive',
  'Augmented Maj 7': 'Jazz, Contemporary Classical',
  'Major 6': 'Jazz Standards, Swing, Bossa Nova',
  'Minor 6': 'Jazz, Film Noir, Gypsy Jazz',
  'Major 9': 'Jazz, Neo-Soul, Contemporary R&B',
  'Dominant 9': 'Funk, Jazz, R&B, Blues',
  'Minor 9': 'Neo-Soul, Lo-Fi, Contemporary Jazz',
  'MinMaj 9': 'Jazz, Film Scores',
  'Add 9': 'Pop, Indie, Worship Music',
  'Minor Add 9': 'Indie, Ambient, Post-Rock',
  '7b5': 'Bebop, Jazz, Fusion',
  '7#5': 'Jazz, Blues, Fusion',
  '7b9': 'Jazz, Flamenco, Latin',
  '7#9': 'Blues, Rock (Hendrix), Funk',
  '7#11': 'Jazz, Fusion',
  '7b13': 'Jazz, Latin Jazz',
};

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
 * Tries to match the requested note count (chord family) first,
 * then falls back to simpler forms.
 */
export function getDiatonicChordForDegree(scaleIntervals: number[], degree: number, preferredNoteCount: number = 3): ChordType | null {
  // Try the preferred note count first (preserves chord family)
  const preferred = buildDiatonicChord(scaleIntervals, degree, preferredNoteCount);
  const matchPref = findMatchingChord(preferred);
  if (matchPref) return matchPref;

  // Try 7th chord if not already tried
  if (preferredNoteCount !== 4) {
    const seventh = buildDiatonicChord(scaleIntervals, degree, 4);
    const match7 = findMatchingChord(seventh);
    if (match7) return match7;
  }

  // Fall back to triad if not already tried
  if (preferredNoteCount !== 3) {
    const triad = buildDiatonicChord(scaleIntervals, degree, 3);
    const matchTriad = findMatchingChord(triad);
    if (matchTriad) return matchTriad;
  }

  // Last resort: try triad
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

// Enhanced function descriptions that differentiate based on chord quality and context
const MAJOR_FUNCTION_DESCRIPTIONS: Record<number, string> = {
  0: 'Home base. Bright and resolved — the place where all tension finds rest.',
  1: 'Lydian ascent from home. As a major II, it provides bright expansion before dominant or subdominant motion.',
  2: 'Bright mediant color — often a stepping stone toward the subdominant or a pivot to relative keys.',
  3: 'The classic subdominant opening. As a major IV, it creates warm expansion away from home, the sound of hymns and classic rock.',
  4: 'Dominant without the seventh — gentler tension that suggests rather than demands resolution.',
  5: 'Major submediant — often borrowed from parallel modes, creating bright contrast in minor contexts.',
  6: 'Rare in major contexts — usually appears as a modal borrowing or chromatic passing harmony.',
};

const MINOR_FUNCTION_DESCRIPTIONS: Record<number, string> = {
  0: 'Dark home — introspective and grounded. In major keys as vi, it provides reflective contrast.',
  1: 'Natural minor supertonic — the essential ii chord that flows perfectly to dominant tension.',
  2: 'Gentle minor mediant — bridges tonic and subdominant areas with introspective warmth.',
  3: 'Minor subdominant — creates the famous "borrowed iv" when used in major keys, adding melancholic depth.',
  4: 'Minor dominant — modal and ancient-sounding. Found in Dorian and folk traditions.',
  5: 'The relative minor center — warm alternative to tonic. As vi in major, it\'s the most common minor chord.',
  6: 'Unstable and restless — as vii in natural minor, it lacks the strong pull of the leading tone.',
};

const DIMINISHED_FUNCTION_DESCRIPTIONS: Record<number, string> = {
  0: 'Highly unusual as a tonic — creates extreme instability and demands immediate resolution.',
  1: 'Rare and unstable — typically appears as a chromatic passing chord.',
  2: 'Uncommon — might appear as a diminished mediant in harmonic contexts.',
  3: 'Unusual subdominant — creates dark, mysterious pre-dominant function.',
  4: 'Rare as a pure diminished dominant — usually appears with added seventh.',
  5: 'Uncommon — typically a chromatic passing harmony.',
  6: 'The classic leading-tone chord — as viiº, it creates maximum pull toward the tonic.',
};

const DOMINANT7_FUNCTION_DESCRIPTIONS: Record<number, string> = {
  0: 'Dominant-tonic — creates restless, blues-influenced tonic that wants to move.',
  1: 'Secondary dominant of V — creates temporary tonicization and circle-of-fifths motion.',
  2: 'Secondary dominant of vi — pulls strongly toward the relative minor area.',
  3: 'Rare as a subdominant seventh — usually functions as a secondary dominant.',
  4: 'The essential dominant seventh — maximum functional tension demanding resolution to tonic.',
  5: 'Secondary dominant of ii — creates temporary tonicization of the supertonic area.',
  6: 'Backdoor dominant — the bVII7 that resolves to I with smooth bass motion, common in jazz and folk.',
};

const CHORD_VIBES: Record<string, string> = {
  'Single Note': 'Pure and unadorned — the fundamental building block of all harmony. A single pitch contains infinite potential, waiting to define or dissolve into larger structures.',
  
  // ── Tertian Triads ──
  'Major': 'The universal brightness of resolution and joy. In tonal contexts: as I, it provides home and rest; as IV, it opens into warm expansion; as V without the 7th, it offers gentle forward motion without harsh tension.',
  'Minor': 'Introspective warmth with emotional depth. As ii or vi, it provides smooth diatonic color; as iii, it bridges major and minor areas; in modal contexts, it creates the foundation for Aeolian or Dorian landscapes.',
  'Diminished': 'Concentrated instability demanding resolution. Most commonly found as viiº in major keys, it creates powerful leading-tone motion; as a passing chord, it provides chromatic voice-leading between stable harmonies.',
  'Augmented': 'Restless expansion with no natural resolution. Often used as a chromatic alteration of I (I+) to push toward IV, or in symmetrical progressions where every note can function as a potential root.',
  
  // ── Suspended/Open ──
  'Sus2': 'Transparent ambiguity — neither major nor minor. Creates spacious, modal landscapes without committing to a traditional tertian quality. Perfect for ambient textures and modern folk progressions.',
  'Sus4': 'Active suspension yearning for resolution. The 4th wants to fall to the 3rd, creating forward momentum. Classic in gospel turnarounds, rock anthems, and creating rhythmic anticipation.',
  'Quintal': 'Open, modern consonance built on 5ths. Bypasses traditional major/minor polarity entirely, creating transparent harmonic layers. Common in minimalism, film scores, and contemporary jazz.',
  
  // ── Seventh Chords ──
  'Major 7': 'Sophisticated warmth with gentle dissonance. As Imaj7, it creates a floating, never-quite-settled tonic; as IVmaj7, it adds Lydian brightness; perfect for jazz ballads and dreamy pop.',
  'Dominant 7': 'Essential functional tension demanding resolution. The tritone between 3rd and 7th creates the strongest pull toward the tonic. The engine of blues, jazz, and classical functional harmony.',
  'Minor 7': 'Smooth, soulful sophistication without harsh edges. As ii7 or vi7, it provides the perfect stepping stone in progressions; as a tonic, it creates the relaxed foundation of Dorian or modern R&B.',
  'Minor Major 7': 'Dark complexity with an inner luminosity. The major 7th against the minor 3rd creates beautiful tension. Often used in film noir, Bond themes, or as the tonic of harmonic minor progressions.',
  'm7b5': 'The essential minor ii chord with sophisticated darkness. In major keys as ii°7, it sets up minor ii-V-i progressions; creates the perfect pre-dominant for dramatic minor resolutions.',
  'Diminished 7': 'Symmetrical drama where every note is equidistant. Functions as a dominant substitute with multiple possible resolutions. Classic in ragtime, classical transitions, and jazz turnarounds.',
  'Augmented 7': 'Blues-tinged instability with upward thrust. Combines the restless augmented triad with dominant 7th tension. Common in blues as a I+ chord moving to IV, or in jazz as chromatic alteration.',
  'Augmented Maj 7': 'Ethereal expansion with sophisticated color. The major 7th softens the augmented triad\'s edge, creating dreamy, floating harmonies perfect for impressionistic and modern jazz contexts.',
  
  // ── Sixth Chords ──
  'Major 6': 'Vintage warmth with grounded stability. Often substitutes for major 7th chords when you want sweetness without the floating quality. Essential in swing, country, and classic pop ballads.',
  'Minor 6': 'Bittersweet melancholy with cinematic depth. The major 6th against minor tonality creates beautiful tension. Perfect for film noir, gypsy jazz, and sophisticated pop ballads.',
  
  // ── Shell Voicings ──
  'Maj Shell (1-3-7)': 'Essential major color without the 5th. Strips down to the most important notes: root, quality (3rd), and sophistication (7th). Perfect for comping, piano voicings, and jazz arrangements.',
  'Dom Shell (1-3-b7)': 'Essential dominant function in minimal form. Maximizes the tritone tension while leaving space for other instruments. The backbone of jazz comping and blues rhythm guitar.',
  'Min Shell (1-b3-b7)': 'Essential minor 7th character without bulk. Clean, soulful, and perfect for creating smooth voice-leading in progressions. Less dense than full minor 7th chords.',
  
  // ── Extensions ──
  'Major 9': 'Expansive major sophistication with open color. The 9th adds airiness to major 7th harmony. Perfect for neo-soul, contemporary jazz, and anywhere you want warmth with space.',
  'Dominant 9': 'Funky dominant tension with extra color. The 9th brightens the dominant 7th without losing its functional power. Essential in funk, jazz-fusion, and blues-rock.',
  'Minor 9': 'Lush minor sophistication with contemporary depth. Creates the perfect foundation for neo-soul and modern R&B. Darker than major 9th but more complex than minor 7th.',
  'MinMaj 9': 'Complex emotional architecture with space and light. Combines the dark beauty of minor major 7th with the openness of the 9th. Perfect for film scoring and sophisticated pop.',
  'Major 11': 'Suspended major character with extensions. The 11th often replaces the 3rd, creating sus4-like qualities with additional upper structure complexity.',
  'Dominant 11': 'Extended dominant tension with modern color. Often voiced without the 3rd to avoid clashing with the 11th. Common in fusion and contemporary jazz.',
  'Minor 11': 'Deep minor sophistication with natural extensions. The 11th fits naturally in minor harmony. Creates lush, complex textures perfect for modal jazz and contemporary styles.',
  'Major 13': 'Maximum major sophistication with full harmonic spectrum. Contains all the chord tones up to the 13th. The ultimate expression of major tonality with jazz complexity.',
  'Dominant 13': 'Complete dominant harmony with full upper structure. The 13th adds brightness to dominant function while maintaining all the essential tension notes.',
  'Minor 13': 'Full minor harmonic spectrum with contemporary color. The most complete expression of minor sophistication, containing all available chord tones.',
  'Add 9': 'Bright major color with pop appeal. Adds the sparkle of the 9th without the sophistication (and potential heaviness) of the 7th. Perfect for contemporary pop and worship music.',
  'Minor Add 9': 'Gentle minor color with contemporary shimmer. The 9th lightens minor tonality without adding jazzy sophistication. Perfect for indie, ambient, and modern folk styles.',
  
  // ── Altered Dominant ──
  '7b5': 'Dominant tension with diminished character. The b5 adds harmonic minor flavor and creates additional leading-tone motion. Classic in bebop and when you want darker dominant color.',
  '7#5': 'Dominant expansion with augmented character. The #5 pushes outward while maintaining dominant function. Common in blues and when you want dominant tension with upward energy.',
  '7b9': 'Dark dominant tension with minor flavor. The b9 adds harmonic minor character to dominant function. Essential for Spanish and Latin styles, and dramatic minor ii-V progressions.',
  '7#9': 'The "Hendrix chord" — blues meets dissonance. The #9 creates the signature clash that defines purple haze and modern blues-rock. Perfect for when you want dominant function with attitude.',
  '7#11': 'Lydian-flavored dominant with bright tension. The #11 adds the brightness of Lydian mode to dominant function. Common in jazz and when you want sophisticated dominant color.',
  '7b13': 'Dark dominant with minor character. The b13 adds harmonic minor flavor and creates darker dominant resolution. Perfect for jazz ballads and sophisticated minor progressions.',
  
  // ── Dyads ──────────────────────────────────────────────
  'Dyad (P1)': 'Unison — two voices speaking as one. Absolute stability with no harmonic colour; the foundation of everything.',
  'Dyad (m2)': 'Minor 2nd — raw, abrasive crunch. The tightest possible clash, generating intense friction that screams for resolution. Found at the heart of jazz dissonance and horror scoring.',
  'Dyad (M2)': 'Major 2nd — an open, unresolved suspense. Airy and slightly ambiguous, it sits between stability and tension. Common in modal and folk melodies.',
  'Dyad (m3)': 'Minor 3rd — the colour of introspection. Warm but shadowed, it carries the weight of sadness and longing. The defining interval of minor tonality.',
  'Dyad (M3)': 'Major 3rd — the brightest consonant interval. Confident and warm, it declares major tonality with a simple, singing clarity. The bedrock of major harmony.',
  'Dyad (P4)': 'Perfect 4th — noble and open. Historically treated as a consonance, it has a hollow, ambiguous strength. Pillars of power chords and ancient parallel organum.',
  'Dyad (TT)': 'Tritone — the "Devil\'s Interval." Exactly half an octave, it splits the scale with maximum instability. Neither resolves inward nor outward naturally — pure restless tension demanding movement.',
  'Dyad (P5)': 'Perfect 5th — the most stable and pure consonance after the octave. Open, powerful, and harmonically neutral — it defines power chords, open tunings, and the foundation of Western harmony.',
  'Dyad (m6)': 'Minor 6th — the inversion of the Major 3rd. Rich and slightly melancholic, with a long, yearning quality. Common in romantic and cinematic writing.',
  'Dyad (M6)': 'Major 6th — bright and singing. The inversion of the Minor 3rd, it carries warmth and optimism. A favourite melodic leap and the basis of the Major 6th chord colour.',
  'Dyad (m7)': 'Minor 7th — bluesy and unresolved. A wide, cool interval that hovers without settling. The defining sound of dominant 7th tension and the blues.',
  'Dyad (M7)': 'Major 7th — the most "reaching" consonance. Just one semitone from the octave, it carries a luminous, yearning quality — at once beautiful and slightly tense, the sound of jazz sophistication.',
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

  // Determine chord quality for appropriate description and numeral case
  const isMinorQuality = chordName.includes('Minor') || chordName.includes('min') || 
    chordName.includes('m7') || chordName === 'Diminished' || chordName === 'Diminished 7';
  const isDominant7 = chordName.includes('Dominant 7') || chordName.includes('7b') || 
    chordName.includes('7#') || chordName === 'Dominant 7';
  const isDiminished = chordName.includes('Diminished') || chordName.includes('dim');

  // Choose appropriate description based on chord quality
  let description: string;
  if (isDominant7) {
    description = DOMINANT7_FUNCTION_DESCRIPTIONS[degree] || 'Dominant-type harmony with specific functional role.';
  } else if (isDiminished) {
    description = DIMINISHED_FUNCTION_DESCRIPTIONS[degree] || 'Diminished harmony creating instability and tension.';
  } else if (isMinorQuality) {
    description = MINOR_FUNCTION_DESCRIPTIONS[degree] || 'Minor harmony providing introspective color.';
  } else {
    description = MAJOR_FUNCTION_DESCRIPTIONS[degree] || 'Major harmony providing bright, stable color.';
  }

  // Use appropriate numeral casing
  const degreeName = isMinorQuality ? SCALE_DEGREE_NAMES_LOWER[degree] : SCALE_DEGREE_NAMES[degree];

  return {
    scaleDegree: degree,
    degreeName,
    functionName: FUNCTION_NAMES[degree] || 'Unknown',
    description,
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
/**
 * Given a set of pitch classes, try to identify the chord name and root.
 * Supports dyads (2 notes) as intervals, and full chords (3+ notes).
 */
export function identifyChordFromPitchClasses(pitchClasses: PitchClass[]): { root: PitchClass; chord: ChordType } | null {
  if (pitchClasses.length < 1) return null;
  const allChords = Object.values(CHORD_CATEGORIES).flat();

  // Single note — unison
  if (pitchClasses.length === 1) {
    const pc = pitchClasses[0];
    const unison: ChordType = {
      name: 'Single Note',
      intervals: [0],
      category: 'Single Note',
    };
    return { root: pc, chord: unison };
  }
  
  // For 3+ notes, try to match against known chord types
  if (pitchClasses.length >= 3) {
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
  }
  
  // For exactly 2 notes (dyad), treat the lower as root and create an interval "chord"
  if (pitchClasses.length === 2) {
    const sorted = [...pitchClasses].sort((a, b) => a - b);
    const rootPc = sorted[0];
    const semitones = ((sorted[1] - sorted[0]) % 12 + 12) % 12;
    const intervalName = INTERVAL_NAMES[semitones];
    const dyad: ChordType = {
      name: `Dyad (${intervalName})`,
      intervals: [0, semitones],
      category: 'Dyads',
    };
    return { root: rootPc, chord: dyad };
  }

  return null;
}

// ─── Cadence Explorer ───────────────────────────────────

export type CadenceCategory = 'resolution' | 'surprise' | 'journey';
export type CadenceDirection = 'leadTo' | 'comeFrom';

export interface CadenceSuggestion {
  category: CadenceCategory;
  direction: CadenceDirection;
  name: string;
  label: string;
  description: string;
  songExample: string;
  /** Semitone offset from current root to target root */
  rootOffset: number;
  /** Chord quality name for the target */
  chordName: string;
  /** If true, implies the target becomes the new tonic */
  resTonic: boolean;
  /** Optional: only show when the current chord quality matches one of these */
  sourceQualities?: string[];
}

const CADENCE_TEMPLATES: CadenceSuggestion[] = [
  // ═══════════════════════════════════════
  // LEAD TO — "Where does this chord want to go?"
  // ═══════════════════════════════════════

  // From any Dominant 7 type
  { category: 'resolution', direction: 'leadTo', name: 'Authentic Resolution', label: '→ I',
    description: 'The strongest resolution. Your V7 resolves home.',
    songExample: '"Let It Be" (Beatles)',
    rootOffset: 5, chordName: 'Major 7', resTonic: true,
    sourceQualities: ['Dominant 7', '7b5', '7#5', '7b9', '7#9', '7#11', '7b13', 'Dominant 9', 'Dominant 11', 'Dominant 13'] },

  { category: 'resolution', direction: 'leadTo', name: 'Resolve to Minor', label: '→ i',
    description: 'Resolve to the minor tonic. Dark and final.',
    songExample: '"Stairway to Heaven" (Led Zeppelin)',
    rootOffset: 5, chordName: 'Minor 7', resTonic: true,
    sourceQualities: ['Dominant 7', '7b9', '7#9', 'Dominant 9'] },

  { category: 'surprise', direction: 'leadTo', name: 'Deceptive Resolution', label: '→ vi',
    description: 'Tricks the ear — resolves to the relative minor instead of tonic.',
    songExample: '"Every Breath You Take" (Police)',
    rootOffset: 8, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Dominant 7', '7b9', '7#9', 'Dominant 9'] },

  { category: 'surprise', direction: 'leadTo', name: 'Deceptive to ♭VI', label: '→ ♭VI',
    description: 'A dramatic deceptive move to the flat sixth. Cinematic impact.',
    songExample: '"Don\'t Stop Believin\'" (Journey)',
    rootOffset: 8, chordName: 'Major', resTonic: false,
    sourceQualities: ['Dominant 7', 'Dominant 9'] },

  // From Major / Major 7
  { category: 'journey', direction: 'leadTo', name: 'Move to Dominant', label: '→ V',
    description: 'Sets up tension. The classic I → V movement.',
    songExample: '"Twist and Shout" (Beatles)',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9', 'Major 6'] },

  { category: 'journey', direction: 'leadTo', name: 'Plagal Float', label: '→ IV',
    description: 'Opens up the harmony. Floating away from home.',
    songExample: '"With or Without You" (U2)',
    rootOffset: 5, chordName: 'Major', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9', 'Major 6'] },

  { category: 'journey', direction: 'leadTo', name: 'Drop to vi', label: '→ vi',
    description: 'Move to the relative minor. Shifts the mood introspectively.',
    songExample: '"Africa" (Toto)',
    rootOffset: 9, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'journey', direction: 'leadTo', name: 'Rise to ii', label: '→ ii',
    description: 'Classic diatonic movement. Sets up a ii-V-I.',
    songExample: '"Fly Me to the Moon" (Bart Howard)',
    rootOffset: 2, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9', 'Major 6'] },

  { category: 'surprise', direction: 'leadTo', name: 'Augmented Push', label: '→ IV',
    description: 'The #5 shoves the ear toward the subdominant.',
    songExample: '"Oh! Darling" (Beatles)',
    rootOffset: 5, chordName: 'Major', resTonic: false,
    sourceQualities: ['Augmented', 'Augmented 7', 'Augmented Maj 7'] },

  { category: 'surprise', direction: 'leadTo', name: 'Chromatic Passing', label: '→ #I°7',
    description: 'Passing diminished that leads chromatically upward.',
    songExample: '"All of Me" (Marks/Simons)',
    rootOffset: 1, chordName: 'Diminished 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 6'] },

  // From Minor / Minor 7
  { category: 'resolution', direction: 'leadTo', name: 'Pre-Dominant', label: '→ V7',
    description: 'The classic ii → V motion. Building toward resolution.',
    songExample: '"Autumn Leaves" (Kosma)',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7', 'Minor 9', 'Minor 11', 'm7b5'] },

  { category: 'journey', direction: 'leadTo', name: 'Minor to Tonic', label: '→ I',
    description: 'A gentle homecoming from the minor subdominant.',
    songExample: '"Creep" (Radiohead)',
    rootOffset: 7, chordName: 'Major 7', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7'] },

  { category: 'journey', direction: 'leadTo', name: 'Minor iii to IV', label: '→ IV',
    description: 'A natural diatonic movement building momentum.',
    songExample: '"Lean on Me" (Bill Withers)',
    rootOffset: 5, chordName: 'Major', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7', 'Minor 9'] },

  // From Half-Diminished (m7b5)
  { category: 'resolution', direction: 'leadTo', name: 'Half-Dim to V7', label: '→ V7',
    description: 'Classic minor ii-V movement. Pulls strongly to the dominant.',
    songExample: '"Blue in Green" (Miles Davis)',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['m7b5'] },

  { category: 'resolution', direction: 'leadTo', name: 'Half-Dim to V7b9', label: '→ V7b9',
    description: 'Darker minor ii-V with altered dominant tension.',
    songExample: '"Summertime" (Gershwin)',
    rootOffset: 7, chordName: '7b9', resTonic: false,
    sourceQualities: ['m7b5'] },

  // From Diminished
  { category: 'resolution', direction: 'leadTo', name: 'Diminished Resolution', label: '→ I',
    description: 'High-tension leading-tone movement demanding resolution.',
    songExample: '"Michelle" (Beatles)',
    rootOffset: 1, chordName: 'Major', resTonic: true,
    sourceQualities: ['Diminished', 'Diminished 7'] },

  { category: 'resolution', direction: 'leadTo', name: 'Dim to Minor', label: '→ i',
    description: 'Resolves the tension to a minor chord. Dark resolution.',
    songExample: '"God Only Knows" (Beach Boys)',
    rootOffset: 1, chordName: 'Minor', resTonic: true,
    sourceQualities: ['Diminished', 'Diminished 7'] },

  // From Sus4
  { category: 'resolution', direction: 'leadTo', name: 'Suspend to Dominant', label: '→ V7',
    description: 'Unfolds the suspension into dominant tension.',
    songExample: '"Pinball Wizard" (The Who)',
    rootOffset: 0, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Sus4'] },

  { category: 'resolution', direction: 'leadTo', name: 'Sus to Major', label: '→ I',
    description: 'Resolves the suspended 4th to the major third. Classic release.',
    songExample: '"A Hard Day\'s Night" (Beatles)',
    rootOffset: 0, chordName: 'Major', resTonic: false,
    sourceQualities: ['Sus4', 'Sus2'] },

  // From 6th Chords
  { category: 'journey', direction: 'leadTo', name: '6th to ii', label: '→ ii',
    description: 'Sets up a ii-V-I from a sweet 6th chord.',
    songExample: '"The Way You Look Tonight" (Kern)',
    rootOffset: 2, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Major 6', 'Minor 6'] },

  // Universal lead-to suggestions
  { category: 'journey', direction: 'leadTo', name: 'Step Up', label: '→ II',
    description: 'A whole-step ascent — bright Lydian-flavored movement.',
    songExample: '"Just Like Heaven" (The Cure)',
    rootOffset: 2, chordName: 'Major', resTonic: false },

  { category: 'surprise', direction: 'leadTo', name: 'Chromatic Slide Down', label: '→ ♭VII',
    description: 'Unexpected drop. A rock and modal-interchange staple.',
    songExample: '"Hey Jude" (Beatles)',
    rootOffset: 10, chordName: 'Major', resTonic: false },

  { category: 'surprise', direction: 'leadTo', name: 'Minor Plagal (iv)', label: '→ iv',
    description: 'Borrow from parallel minor. Creates the "Hollywood" sadness.',
    songExample: '"My Funny Valentine" (Rodgers)',
    rootOffset: 5, chordName: 'Minor', resTonic: false,
    sourceQualities: ['Major', 'Major 7'] },

  { category: 'surprise', direction: 'leadTo', name: 'Tritone Sub', label: '→ ♭II7',
    description: 'The jazz player\'s secret. Smooth chromatic bass to tonic.',
    songExample: '"Girl from Ipanema" (Jobim)',
    rootOffset: 6, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Minor 7', 'm7b5'] },

  // ═══════════════════════════════════════
  // COME FROM — "What typically leads into this chord?"
  // ═══════════════════════════════════════

  // Into Major / Major 7 (tonic resolution targets)
  { category: 'resolution', direction: 'comeFrom', name: 'Authentic', label: 'V7 →',
    description: 'The ultimate "Full Stop." The strongest resolution.',
    songExample: '"Let It Be" (Beatles)',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9', 'Major 6'] },

  { category: 'resolution', direction: 'comeFrom', name: 'Plagal / Amen', label: 'IV →',
    description: 'A softer, grounded homecoming without leading-tone tension.',
    songExample: '"Let It Be" ending (Beatles)',
    rootOffset: 5, chordName: 'Major', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'resolution', direction: 'comeFrom', name: 'ii-V Arrival', label: 'ii →',
    description: 'The classic jazz arrival. Coming home from a ii-V.',
    songExample: '"Autumn Leaves" (Kosma)',
    rootOffset: 2, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'surprise', direction: 'comeFrom', name: 'Minor Plagal', label: 'iv →',
    description: 'The "Hollywood Heartbreak." Borrowed from parallel minor.',
    songExample: '"Creep" (Radiohead), "Space Oddity" (Bowie)',
    rootOffset: 5, chordName: 'Minor', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'surprise', direction: 'comeFrom', name: 'Backdoor Dominant', label: '♭VII7 →',
    description: 'Soulful jazz-pop resolution from the flat seventh.',
    songExample: '"Lady Madonna" (Beatles)',
    rootOffset: 10, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'surprise', direction: 'comeFrom', name: 'Tritone Sub', label: '♭II7 →',
    description: 'The ultimate jazz tension. Smooth chromatic bass descent.',
    songExample: '"Girl from Ipanema" (Jobim)',
    rootOffset: 1, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'journey', direction: 'comeFrom', name: 'From ♭VI', label: '♭VI →',
    description: 'Modal interchange magic. Coming from the Aeolian flat sixth.',
    songExample: '"Wonderwall" (Oasis)',
    rootOffset: 8, chordName: 'Major', resTonic: false,
    sourceQualities: ['Major', 'Major 7'] },

  // Into Dominant 7 (pre-dominant targets)
  { category: 'resolution', direction: 'comeFrom', name: 'ii → V Setup', label: 'ii →',
    description: 'The classic pre-dominant motion. Building momentum.',
    songExample: '"Autumn Leaves" (Kosma)',
    rootOffset: 7, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Dominant 7', 'Dominant 9', '7b9', '7#9', 'Dominant 11', 'Dominant 13'] },

  { category: 'journey', direction: 'comeFrom', name: 'Secondary Dominant Chain', label: 'V7/V →',
    description: 'A temporary dominant of this dominant. Circle of fifths energy.',
    songExample: '"Sweet Georgia Brown"',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Dominant 7', 'Dominant 9'] },

  { category: 'journey', direction: 'comeFrom', name: 'From I', label: 'I →',
    description: 'Simple tonic to dominant. The classic opening move.',
    songExample: '"Twist and Shout" (Beatles)',
    rootOffset: 5, chordName: 'Major 7', resTonic: false,
    sourceQualities: ['Dominant 7', 'Dominant 9'] },

  { category: 'surprise', direction: 'comeFrom', name: 'From ♭VII', label: '♭VII →',
    description: 'Approaching V from the flat-7 for a rock-tinged setup.',
    songExample: '"With or Without You" (U2)',
    rootOffset: 3, chordName: 'Major', resTonic: false,
    sourceQualities: ['Dominant 7'] },

  // Into Minor / Minor 7
  { category: 'resolution', direction: 'comeFrom', name: 'Mediant Pivot', label: 'III7 →',
    description: 'A dramatic secondary dominant pulling to the relative minor.',
    songExample: '"Hotel California" (Eagles)',
    rootOffset: 8, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7', 'Minor 9'] },

  { category: 'surprise', direction: 'comeFrom', name: 'Deceptive Arrival', label: 'V7 (of key) →',
    description: 'You expected the tonic but landed here instead.',
    songExample: '"Every Breath You Take" (Police)',
    rootOffset: 4, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7', 'Minor 9'] },

  { category: 'journey', direction: 'comeFrom', name: 'From IV', label: 'IV →',
    description: 'Natural diatonic descent from the subdominant.',
    songExample: '"Mad World" (Tears for Fears)',
    rootOffset: 8, chordName: 'Major', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7'] },

  { category: 'journey', direction: 'comeFrom', name: 'From I', label: 'I →',
    description: 'Stepping down to the vi. Classic melancholic shift.',
    songExample: '"Africa" (Toto)',
    rootOffset: 3, chordName: 'Major 7', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7', 'Minor 9'] },

  // Into Diminished 7
  { category: 'journey', direction: 'comeFrom', name: 'From I', label: 'I →',
    description: 'The tonic sets up a chromatic passing diminished.',
    songExample: '"All of Me" (Marks/Simons)',
    rootOffset: 11, chordName: 'Major', resTonic: false,
    sourceQualities: ['Diminished', 'Diminished 7'] },

  // Universal come-from suggestions
  { category: 'journey', direction: 'comeFrom', name: 'Chromatic Approach', label: '♭ →',
    description: 'Approaching from a half-step below. Smooth voice leading.',
    songExample: '"Misty" (Garner)',
    rootOffset: 11, chordName: 'Major 7', resTonic: false },

  { category: 'journey', direction: 'comeFrom', name: 'Whole-Step Descent', label: 'II →',
    description: 'A Lydian-flavored approach from a whole step above.',
    songExample: '"Just Like Heaven" (The Cure)',
    rootOffset: 2, chordName: 'Major', resTonic: false },

  { category: 'surprise', direction: 'comeFrom', name: 'Chromatic Ascent', label: '♯ →',
    description: 'Approaching from a half-step above. Dramatic tension.',
    songExample: '"I Got Rhythm" (Gershwin)',
    rootOffset: 1, chordName: 'Major', resTonic: false },
];

export interface CadenceOption {
  suggestion: CadenceSuggestion;
  targetRoot: PitchClass;
  targetChord: ChordType;
  displayName: string;
  functionalLabel: string;
  targetDegree: number;
  contextualDescription: string;
}

/** Generate a contextual description based on actual functional movement */
function getContextualCadenceDescription(
  fromDegree: number,
  toDegree: number,
  direction: CadenceDirection,
  originalDescription: string,
): string {
  const degreeNames = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII'];
  const from = degreeNames[fromDegree];
  const to = degreeNames[toDegree];
  
  // Key functional movements with contextual descriptions
  const movements: Record<string, string> = {
    // Dominant to Tonic (V → I)
    '7-0': 'The ultimate resolution. Dominant tension releasing to tonic stability.',
    // Subdominant to Tonic (IV → I)
    '5-0': 'Plagal motion. A warm, settled return home without leading-tone tension.',
    // Tonic to Dominant (I → V)
    '0-7': 'Moving to dominant territory. Building tension that will want resolution.',
    // Tonic to Subdominant (I → IV)
    '0-5': 'Opening up toward the subdominant. Floating away from home.',
    // ii to V
    '2-7': 'Pre-dominant to dominant. The classic ii–V setup toward resolution.',
    // V to vi (Deceptive)
    '7-9': 'Deceptive motion. Avoiding the expected tonic for emotional twist.',
    // vi to IV
    '9-5': 'Descending from relative minor to subdominant. Building toward home.',
    // IV to V
    '5-7': 'Subdominant to dominant. Classic tension-building progression.',
    // ♭VII to I
    '10-0': 'Backdoor resolution. Modal interchange creating a "cool jazz" arrival.',
    // iv to I (minor plagal)
    '5-0-m': 'Minor plagal motion. The "Hollywood heartbreak" borrowed from parallel minor.',
    // I to vi
    '0-9': 'Dropping to the relative minor. Introspective shift in mood.',
    // I to ii
    '0-2': 'Rising to the supertonic. Setting up a potential ii–V–I.',
    // iii to vi
    '4-9': 'Mediant to submediant. Diatonic third relation — smooth and subtle.',
    // vi to ii
    '9-2': 'Circle-of-fifths motion through the minor side of the key.',
    // ii to I
    '2-0': 'Direct supertonic to tonic. A gentle, understated resolution.',
    // V to IV (retrogression)
    '7-5': 'Retrogression. Moving backward from dominant to subdominant — unexpected release.',
    // ♭VI to V
    '8-7': 'Dramatic approach to dominant. Chromatic intensity building toward resolution.',
    // ♭VI to I
    '8-0': 'Direct flat-six resolution. Cinematic and powerful.',
    // I to ♭VII
    '0-10': 'Modal mixture. Stepping down to the subtonic — rock and modal flavor.',
    // IV to I in context of being the V chord
    '5-0': 'Arriving at tonic from the subdominant. Amen cadence territory.',
  };
  
  const key = `${fromDegree}-${toDegree}`;
  
  if (movements[key]) {
    return movements[key];
  }
  
  // Generate generic contextual description
  if (toDegree === 0) {
    return `Resolving from ${from} to the tonic. ${direction === 'leadTo' ? 'Moving toward home.' : 'This chord leads home.'}`;
  }
  if (fromDegree === 0) {
    return `Departing from tonic to ${to}. ${direction === 'leadTo' ? 'Creating harmonic motion.' : 'A common starting point.'}`;
  }
  if (toDegree === 7) {
    return `Moving toward the dominant (${to}). Building tension for resolution.`;
  }
  if (fromDegree === 7) {
    return `Coming from the dominant (${from}). Transitional or unexpected movement.`;
  }
  
  // Fall back to original if no contextual match
  return originalDescription;
}

/**
 * Generate cadence suggestions based on the current harmony within the key context.
 * Uses the scaleTonic to determine the functional role of the current chord,
 * then suggests progressions relative to that context.
 */
export function getCadenceSuggestions(
  currentRoot: PitchClass,
  currentChordName: string,
  scaleTonic: PitchClass,
  direction: CadenceDirection,
  useFlats: boolean,
): CadenceOption[] {
  const allChords = Object.values(CHORD_CATEGORIES).flat();
  
  // Calculate current chord's degree relative to the key
  const currentDegree = ((currentRoot - scaleTonic) % 12 + 12) % 12;
  
  // Map cadence templates to key-contextual suggestions
  // The templates define functional relationships (e.g., V→I, IV→I)
  // We translate these to the actual key
  
  return CADENCE_TEMPLATES
    .filter(s => s.direction === direction)
    .filter(s => {
      if (!s.sourceQualities) return true;
      return s.sourceQualities.some(q =>
        currentChordName === q ||
        currentChordName.includes(q) ||
        (q === 'Minor' && currentChordName.startsWith('Minor')) ||
        (q === 'Major' && currentChordName.startsWith('Major'))
      );
    })
    .map(suggestion => {
      // Calculate the target root relative to the current root
      const targetRoot = ((currentRoot + suggestion.rootOffset) % 12 + 12) % 12 as PitchClass;
      const targetChord = allChords.find(c => c.name === suggestion.chordName)
        ?? CHORD_CATEGORIES['Tertian Triads'][0];
      
      // Calculate target degree relative to key for display context
      const targetDegree = ((targetRoot - scaleTonic) % 12 + 12) % 12;
      
      // Generate contextual label showing the functional movement
      const degreeNumerals = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII'];
      const fromDegree = degreeNumerals[currentDegree];
      const toDegree = degreeNumerals[targetDegree];
      
      const displayName = `${getNoteName(targetRoot, useFlats)} ${targetChord.name}`;
      const functionalLabel = direction === 'leadTo' 
        ? `${fromDegree} → ${toDegree}` 
        : `${toDegree} → ${fromDegree}`;
      
      // Generate contextual description based on actual functional movement
      const contextualDescription = getContextualCadenceDescription(
        currentDegree,
        targetDegree,
        direction,
        suggestion.description,
      );
      
      return { 
        suggestion, 
        targetRoot, 
        targetChord, 
        displayName,
        functionalLabel,
        targetDegree,
        contextualDescription,
      };
    });
}

export const CADENCE_CATEGORY_META: Record<CadenceCategory, { title: string; icon: string }> = {
  resolution: { title: 'The Resolution', icon: '🏠' },
  surprise: { title: 'The Surprise', icon: '✨' },
  journey: { title: 'The Journey', icon: '🧭' },
};

// ─── Psychoacoustical Dissonance (Plomp-Levelt / Sethares) ───────────

const NUM_PARTIALS = 7; // 1 fundamental + 6 overtones
const AMPLITUDE_DECAY = 0.88;

/** Convert a pitch class + octave to frequency in Hz (A4 = 440) */
export function pitchClassToFrequency(pc: PitchClass, octave: number): number {
  // MIDI note number: C4 = 60, A4 = 69
  const midi = octave * 12 + pc + 12; // pc 0 = C, octave 4 → midi 60
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Generate harmonic partials for a fundamental frequency */
export interface Partial {
  frequency: number;
  amplitude: number;
  partialNumber: number; // 1-based
  fundamentalPc: PitchClass;
  fundamentalFreq: number;
}

export function generatePartials(fundamentalFreq: number, fundamentalPc: PitchClass): Partial[] {
  const partials: Partial[] = [];
  for (let i = 1; i <= NUM_PARTIALS; i++) {
    partials.push({
      frequency: fundamentalFreq * i,
      amplitude: Math.pow(AMPLITUDE_DECAY, i - 1),
      partialNumber: i,
      fundamentalPc,
      fundamentalFreq,
    });
  }
  return partials;
}

/** Plomp-Levelt dissonance between two pure tones */
function plompLeveltDissonance(f1: number, a1: number, f2: number, a2: number): number {
  const fmin = Math.min(f1, f2);
  const fmax = Math.max(f1, f2);
  const b = fmax - fmin;
  const s = 0.24 / (0.021 * fmin + 19);
  const sb = s * b;
  return a1 * a2 * (Math.exp(-3.5 * sb) - Math.exp(-5.75 * sb));
}

/** Calculate total psychoacoustical dissonance for a set of frequencies, normalised 0-100.
 *  Includes INTRA-note partial interference (a single low note has overtone roughness)
 *  as well as INTER-note interference. */
export function calculateChordDissonance(frequencies: number[]): number {
  if (frequencies.length === 0) return 0;

  // Build all partials (including intra-note pairs)
  const rawDissonance = (freqs: number[]) => {
    let total = 0;
    const allPartials: { freq: number; amp: number }[] = [];
    for (const f of freqs) {
      for (let i = 1; i <= NUM_PARTIALS; i++) {
        allPartials.push({ freq: f * i, amp: Math.pow(AMPLITUDE_DECAY, i - 1) });
      }
    }
    // All pairwise interactions including within-note overtones
    for (let i = 0; i < allPartials.length; i++) {
      for (let j = i + 1; j < allPartials.length; j++) {
        total += plompLeveltDissonance(
          allPartials[i].freq, allPartials[i].amp,
          allPartials[j].freq, allPartials[j].amp
        );
      }
    }
    return total;
  };

  const actual = rawDissonance(frequencies);

  // Reference max: chromatic cluster of same note count starting from a FIXED frequency
  // Using a fixed reference (C3 = ~130.81 Hz) ensures that the same chord quality
  // at different roots produces the same dissonance percentage in equal temperament.
  const fixedRefFreq = 130.81; // C3
  const noteCount = Math.max(2, frequencies.length); // at least 2 for meaningful reference
  const referenceFreqs: number[] = [];
  for (let i = 0; i < noteCount; i++) {
    referenceFreqs.push(fixedRefFreq * Math.pow(2, i / 12)); // chromatic cluster
  }
  const referenceMax = rawDissonance(referenceFreqs);

  const normalised = referenceMax > 0 ? (actual / referenceMax) * 100 : 0;
  return Math.min(100, Math.max(0, normalised));
}

/** Find pairwise dissonance between every pair of partials from different notes */
export interface PartialInteraction {
  partial1: Partial;
  partial2: Partial;
  dissonance: number;
  freqDiff: number;
}

export function calculatePartialInteractions(
  noteFrequencies: { freq: number; pc: PitchClass }[]
): PartialInteraction[] {
  const interactions: PartialInteraction[] = [];
  const notePartials = noteFrequencies.map(n => generatePartials(n.freq, n.pc));

  // Inter-note interactions
  for (let i = 0; i < notePartials.length; i++) {
    for (let j = i + 1; j < notePartials.length; j++) {
      for (const p1 of notePartials[i]) {
        for (const p2 of notePartials[j]) {
          const d = plompLeveltDissonance(p1.frequency, p1.amplitude, p2.frequency, p2.amplitude);
          if (d > 0.0001) {
            interactions.push({
              partial1: p1,
              partial2: p2,
              dissonance: d * 100,
              freqDiff: Math.abs(p1.frequency - p2.frequency),
            });
          }
        }
      }
    }
  }

  // Intra-note interactions (overtone-to-overtone roughness within each note)
  for (let i = 0; i < notePartials.length; i++) {
    const ps = notePartials[i];
    for (let a = 0; a < ps.length; a++) {
      for (let b = a + 1; b < ps.length; b++) {
        const d = plompLeveltDissonance(ps[a].frequency, ps[a].amplitude, ps[b].frequency, ps[b].amplitude);
        if (d > 0.0001) {
          interactions.push({
            partial1: ps[a],
            partial2: ps[b],
            dissonance: d * 100,
            freqDiff: Math.abs(ps[a].frequency - ps[b].frequency),
          });
        }
      }
    }
  }

  return interactions;
}

/** Get all partials for a chord at a specific octave */
export function getChordPartials(
  pitchClasses: PitchClass[],
  baseOctave: number
): { partials: Partial[]; noteFrequencies: { freq: number; pc: PitchClass }[] } {
  const noteFrequencies = pitchClasses.map(pc => ({
    freq: pitchClassToFrequency(pc, baseOctave),
    pc,
  }));
  const partials = noteFrequencies.flatMap(n => generatePartials(n.freq, n.pc));
  return { partials, noteFrequencies };
}

/** Get all partials for a chord using voicing-aware intervals (accounts for inversions & drop voicings) */
export function getChordPartialsFromVoicing(
  root: PitchClass,
  intervals: number[],
  baseOctave: number
): { partials: Partial[]; noteFrequencies: { freq: number; pc: PitchClass }[] } {
  const noteFrequencies = intervals.map(semitones => {
    const pc = ((root + semitones) % 12 + 12) % 12 as PitchClass;
    // Calculate the actual octave offset from the interval
    const octaveOffset = Math.floor(semitones / 12);
    const remainder = ((semitones % 12) + 12) % 12;
    // If the remainder pushes past the root's position, it's still in the same octave
    const freq = pitchClassToFrequency(pc, baseOctave + octaveOffset);
    return { freq, pc };
  });
  const partials = noteFrequencies.flatMap(n => generatePartials(n.freq, n.pc));
  return { partials, noteFrequencies };
}
