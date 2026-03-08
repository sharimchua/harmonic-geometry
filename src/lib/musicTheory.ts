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
  'Minor Major 7': 'Dark yet luminous — tension between sadness and beauty',
  'Augmented 7': 'Restless and exotic — pushing outward with blues',
  'Augmented Maj 7': 'Ethereal and expansive — dreamlike tension',
  'Major 6': 'Warm, nostalgic, and grounded — vintage charm',
  'Minor 6': 'Bittersweet and cinematic — noir atmosphere',
  'Major 9': 'Rich and expansive — sophisticated warmth',
  'Dominant 9': 'Funky and bright — a wider dominant color',
  'Minor 9': 'Lush and deep — neo-soul territory',
  'MinMaj 9': 'Complex emotional depth — dark beauty with space',
  'Add 9': 'Open and sparkly — pop brightness without the 7th',
  'Minor Add 9': 'Gentle melancholy with a shimmer of light',
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
    sourceQualities: ['Dominant 7', '7b5', '7#5', '7b9', '7#9', '7#11', '7b13', 'Dominant 9'] },

  { category: 'surprise', direction: 'leadTo', name: 'Deceptive Resolution', label: '→ vi',
    description: 'Tricks the ear — resolves to the relative minor instead of tonic.',
    songExample: '"Every Breath You Take" (Police)',
    rootOffset: 8, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Dominant 7', '7b9', '7#9', 'Dominant 9'] },

  // From Major / Major 7
  { category: 'journey', direction: 'leadTo', name: 'Move to Dominant', label: '→ V',
    description: 'Sets up tension. The classic I → V movement.',
    songExample: '"Twist and Shout" (Beatles)',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'journey', direction: 'leadTo', name: 'Plagal Float', label: '→ IV',
    description: 'Opens up the harmony. Floating away from home.',
    songExample: '"With or Without You" (U2)',
    rootOffset: 5, chordName: 'Major', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'surprise', direction: 'leadTo', name: 'Augmented Push', label: '→ IV',
    description: 'The #5 shoves the ear toward the subdominant.',
    songExample: '"Oh! Darling" (Beatles)',
    rootOffset: 5, chordName: 'Major', resTonic: false,
    sourceQualities: ['Augmented'] },

  // From Minor / Minor 7
  { category: 'resolution', direction: 'leadTo', name: 'Pre-Dominant', label: '→ V7',
    description: 'The classic ii → V motion. Building toward resolution.',
    songExample: '"Autumn Leaves" (Kosma)',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7', 'Minor 9', 'm7b5'] },

  { category: 'journey', direction: 'leadTo', name: 'Minor to Tonic', label: '→ I',
    description: 'A gentle homecoming from the minor subdominant.',
    songExample: '"Creep" (Radiohead)',
    rootOffset: 7, chordName: 'Major 7', resTonic: false,
    sourceQualities: ['Minor', 'Minor 7'] },

  // From Diminished
  { category: 'resolution', direction: 'leadTo', name: 'Diminished Resolution', label: '→ I',
    description: 'High-tension leading-tone movement demanding resolution.',
    songExample: '"Michelle" (Beatles)',
    rootOffset: 1, chordName: 'Major', resTonic: true,
    sourceQualities: ['Diminished', 'Diminished 7'] },

  // From Sus4
  { category: 'resolution', direction: 'leadTo', name: 'Suspend to Dominant', label: '→ V7',
    description: 'Unfolds the suspension into dominant tension.',
    songExample: '"Pinball Wizard" (The Who)',
    rootOffset: 0, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Sus4'] },

  // Universal lead-to suggestions
  { category: 'journey', direction: 'leadTo', name: 'Step Up', label: '→ II',
    description: 'A whole-step ascent — bright Lydian-flavored movement.',
    songExample: '"Just Like Heaven" (The Cure)',
    rootOffset: 2, chordName: 'Major', resTonic: false },

  { category: 'surprise', direction: 'leadTo', name: 'Chromatic Slide Down', label: '→ bVII',
    description: 'Unexpected drop. A rock and modal-interchange staple.',
    songExample: '"Hey Jude" (Beatles)',
    rootOffset: 10, chordName: 'Major', resTonic: false },

  // ═══════════════════════════════════════
  // COME FROM — "What typically leads into this chord?"
  // ═══════════════════════════════════════

  // Into Major / Major 7 (tonic resolution targets)
  { category: 'resolution', direction: 'comeFrom', name: 'Authentic', label: 'V7 →',
    description: 'The ultimate "Full Stop." The strongest resolution.',
    songExample: '"Let It Be" (Beatles)',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Major', 'Major 7', 'Major 9'] },

  { category: 'resolution', direction: 'comeFrom', name: 'Plagal / Amen', label: 'IV →',
    description: 'A softer, grounded homecoming without leading-tone tension.',
    songExample: '"Let It Be" ending (Beatles)',
    rootOffset: 5, chordName: 'Major', resTonic: false,
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

  // Into Dominant 7 (pre-dominant targets)
  { category: 'resolution', direction: 'comeFrom', name: 'ii → V Setup', label: 'ii →',
    description: 'The classic pre-dominant motion. Building momentum.',
    songExample: '"Autumn Leaves" (Kosma)',
    rootOffset: 7, chordName: 'Minor 7', resTonic: false,
    sourceQualities: ['Dominant 7', 'Dominant 9', '7b9', '7#9'] },

  { category: 'journey', direction: 'comeFrom', name: 'Secondary Dominant Chain', label: 'V7/V →',
    description: 'A temporary dominant of this dominant. Circle of fifths energy.',
    songExample: '"Sweet Georgia Brown"',
    rootOffset: 7, chordName: 'Dominant 7', resTonic: false,
    sourceQualities: ['Dominant 7', 'Dominant 9'] },

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

  // Universal come-from suggestions
  { category: 'journey', direction: 'comeFrom', name: 'Chromatic Approach', label: '♭ →',
    description: 'Approaching from a half-step below. Smooth voice leading.',
    songExample: '"Misty" (Garner)',
    rootOffset: 11, chordName: 'Major 7', resTonic: false },

  { category: 'journey', direction: 'comeFrom', name: 'Whole-Step Descent', label: 'II →',
    description: 'A Lydian-flavored approach from a whole step above.',
    songExample: '"Just Like Heaven" (The Cure)',
    rootOffset: 2, chordName: 'Major', resTonic: false },
];

export interface CadenceOption {
  suggestion: CadenceSuggestion;
  targetRoot: PitchClass;
  targetChord: ChordType;
  displayName: string;
}

/**
 * Generate cadence suggestions based on the current harmony.
 * Filters by direction and chord quality.
 */
export function getCadenceSuggestions(
  currentRoot: PitchClass,
  currentChordName: string,
  direction: CadenceDirection,
  useFlats: boolean,
): CadenceOption[] {
  const allChords = Object.values(CHORD_CATEGORIES).flat();

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
      const targetRoot = ((currentRoot + suggestion.rootOffset) % 12 + 12) % 12 as PitchClass;
      const targetChord = allChords.find(c => c.name === suggestion.chordName)
        ?? CHORD_CATEGORIES['Tertian Triads'][0];
      const displayName = `${getNoteName(targetRoot, useFlats)} ${targetChord.name}`;
      return { suggestion, targetRoot, targetChord, displayName };
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
