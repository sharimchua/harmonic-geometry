import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  type PitchClass,
  type ChordType,
  type ScaleType,
  type LabelMode,
  type HarmonicLockMode,
  type FunctionalAnalysis,
  CHORD_CATEGORIES,
  SCALE_CATEGORIES,
  getPitchClasses,
  invertChord,
  dropVoicing,
  getIntervalTension,
  getScaleDegree,
  getDiatonicChordForDegree,
  analyzeFunctionalRole,
  getChordVibe,
  type IntervalTension,
} from '@/lib/musicTheory';

interface HarmonyState {
  scaleTonic: PitchClass; // key center
  harmonicRoot: PitchClass; // chord root
  chord: ChordType;
  scale: ScaleType | null;
  inversion: number;
  dropVoicingType: number;
  labelMode: LabelMode;
  showArpeggio: boolean;
  cagedPosition: number | null;
  useFlats: boolean;
  lockMode: HarmonicLockMode;
}

interface HarmonyContextValue extends HarmonyState {
  // Keep `root` as alias for harmonicRoot for backward compat
  root: PitchClass;
  setScaleTonic: (tonic: PitchClass) => void;
  setRoot: (root: PitchClass) => void;
  setChord: (chord: ChordType) => void;
  setScale: (scale: ScaleType | null) => void;
  setInversion: (inv: number) => void;
  setDropVoicing: (drop: number) => void;
  setLabelMode: (mode: LabelMode) => void;
  setShowArpeggio: (show: boolean) => void;
  setCagedPosition: (pos: number | null) => void;
  setUseFlats: (useFlats: boolean) => void;
  setLockMode: (mode: HarmonicLockMode) => void;
  // Derived data
  activeIntervals: number[];
  activePitchClasses: PitchClass[];
  scalePitchClasses: PitchClass[];
  intervalTensions: { from: PitchClass; to: PitchClass; tension: IntervalTension; semitones: number }[];
  functionalAnalysis: FunctionalAnalysis;
  chordVibe: string;
}

const HarmonyContext = createContext<HarmonyContextValue | null>(null);

const defaultChord = CHORD_CATEGORIES['Tertian Triads'][0]; // Major

export function HarmonyProvider({ children }: { children: React.ReactNode }) {
  const [scaleTonic, setScaleTonic] = useState<PitchClass>(0);
  const [harmonicRoot, setHarmonicRoot] = useState<PitchClass>(0);
  const [chord, setChordRaw] = useState<ChordType>(defaultChord);
  const [scale, setScale] = useState<ScaleType | null>(SCALE_CATEGORIES['Diatonic'][0]);
  const [inversion, setInversion] = useState(0);
  const [dropVoicingType, setDropVoicing] = useState(0);
  const [labelMode, setLabelMode] = useState<LabelMode>('notes');
  const [showArpeggio, setShowArpeggio] = useState(false);
  const [cagedPosition, setCagedPosition] = useState<number | null>(null);
  const [useFlats, setUseFlats] = useState(false);
  const [lockMode, setLockMode] = useState<HarmonicLockMode>('quality');

  // When in scale lock mode, changing root adjusts chord quality diatonically
  const setRoot = useCallback((newRoot: PitchClass) => {
    setHarmonicRoot(newRoot);
    setInversion(0);
    setDropVoicing(0);

    if (lockMode === 'scale' && scale) {
      const degree = getScaleDegree(scaleTonic, scale.intervals, newRoot);
      if (degree !== -1) {
        const diatonicChord = getDiatonicChordForDegree(scale.intervals, degree);
        if (diatonicChord) {
          setChordRaw(diatonicChord);
        }
      }
    }
  }, [lockMode, scale, scaleTonic]);

  const setChord = useCallback((c: ChordType) => {
    setChordRaw(c);
    setInversion(0);
    setDropVoicing(0);
  }, []);

  const activeIntervals = useMemo(() => {
    let intervals = [...chord.intervals];
    if (inversion > 0) intervals = invertChord(intervals, inversion);
    if (dropVoicingType > 0) intervals = dropVoicing(intervals, dropVoicingType);
    return intervals;
  }, [chord, inversion, dropVoicingType]);

  const activePitchClasses = useMemo(
    () => getPitchClasses(harmonicRoot, activeIntervals),
    [harmonicRoot, activeIntervals]
  );

  const scalePitchClasses = useMemo(
    () => scale ? getPitchClasses(scaleTonic, scale.intervals) : [],
    [scaleTonic, scale]
  );

  const intervalTensions = useMemo(() => {
    const tensions: HarmonyContextValue['intervalTensions'] = [];
    const pcs = activePitchClasses;
    for (let i = 0; i < pcs.length; i++) {
      for (let j = i + 1; j < pcs.length; j++) {
        const semitones = ((pcs[j] - pcs[i]) % 12 + 12) % 12;
        tensions.push({
          from: pcs[i],
          to: pcs[j],
          tension: getIntervalTension(semitones),
          semitones,
        });
      }
    }
    return tensions;
  }, [activePitchClasses]);

  const functionalAnalysis = useMemo(
    () => analyzeFunctionalRole(scaleTonic, scale?.intervals ?? null, harmonicRoot, chord.name),
    [scaleTonic, scale, harmonicRoot, chord.name]
  );

  const chordVibe = useMemo(() => getChordVibe(chord.name), [chord.name]);

  const value: HarmonyContextValue = {
    scaleTonic, setScaleTonic: useCallback((t: PitchClass) => setScaleTonic(t), []),
    harmonicRoot,
    root: harmonicRoot, // alias
    setRoot,
    chord, setChord,
    scale, setScale,
    inversion, setInversion,
    dropVoicingType, setDropVoicing,
    labelMode, setLabelMode,
    showArpeggio, setShowArpeggio,
    cagedPosition, setCagedPosition,
    useFlats, setUseFlats,
    lockMode, setLockMode,
    activeIntervals,
    activePitchClasses,
    scalePitchClasses,
    intervalTensions,
    functionalAnalysis,
    chordVibe,
  };

  return <HarmonyContext.Provider value={value}>{children}</HarmonyContext.Provider>;
}

export function useHarmony() {
  const ctx = useContext(HarmonyContext);
  if (!ctx) throw new Error('useHarmony must be used within HarmonyProvider');
  return ctx;
}
