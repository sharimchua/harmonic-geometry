import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  type PitchClass,
  type ChordType,
  type ScaleType,
  type LabelMode,
  CHORD_CATEGORIES,
  SCALE_CATEGORIES,
  getPitchClasses,
  invertChord,
  dropVoicing,
  getIntervalTension,
  type IntervalTension,
} from '@/lib/musicTheory';

interface HarmonyState {
  root: PitchClass;
  chord: ChordType;
  scale: ScaleType | null;
  inversion: number;
  dropVoicingType: number; // 0=none, 2=drop2, 3=drop3
  labelMode: LabelMode;
  showArpeggio: boolean;
  cagedPosition: number | null; // 0-4 or null
  useFlats: boolean;
}

interface HarmonyContextValue extends HarmonyState {
  setRoot: (root: PitchClass) => void;
  setChord: (chord: ChordType) => void;
  setScale: (scale: ScaleType | null) => void;
  setInversion: (inv: number) => void;
  setDropVoicing: (drop: number) => void;
  setLabelMode: (mode: LabelMode) => void;
  setShowArpeggio: (show: boolean) => void;
  setCagedPosition: (pos: number | null) => void;
  setUseFlats: (useFlats: boolean) => void;
  // Derived data
  activeIntervals: number[];
  activePitchClasses: PitchClass[];
  scalePitchClasses: PitchClass[];
  intervalTensions: { from: PitchClass; to: PitchClass; tension: IntervalTension; semitones: number }[];
}

const HarmonyContext = createContext<HarmonyContextValue | null>(null);

const defaultChord = CHORD_CATEGORIES['Tertian Triads'][0]; // Major

export function HarmonyProvider({ children }: { children: React.ReactNode }) {
  const [root, setRoot] = useState<PitchClass>(0);
  const [chord, setChord] = useState<ChordType>(defaultChord);
  const [scale, setScale] = useState<ScaleType | null>(SCALE_CATEGORIES['Diatonic'][0]);
  const [inversion, setInversion] = useState(0);
  const [dropVoicingType, setDropVoicing] = useState(0);
  const [labelMode, setLabelMode] = useState<LabelMode>('notes');
  const [showArpeggio, setShowArpeggio] = useState(false);
  const [cagedPosition, setCagedPosition] = useState<number | null>(null);
  const [useFlats, setUseFlats] = useState(false);

  const activeIntervals = useMemo(() => {
    let intervals = [...chord.intervals];
    if (inversion > 0) intervals = invertChord(intervals, inversion);
    if (dropVoicingType > 0) intervals = dropVoicing(intervals, dropVoicingType);
    return intervals;
  }, [chord, inversion, dropVoicingType]);

  const activePitchClasses = useMemo(
    () => getPitchClasses(root, activeIntervals),
    [root, activeIntervals]
  );

  const scalePitchClasses = useMemo(
    () => scale ? getPitchClasses(root, scale.intervals) : [],
    [root, scale]
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

  const value: HarmonyContextValue = {
    root, setRoot: useCallback((r: PitchClass) => setRoot(r), []),
    chord, setChord: useCallback((c: ChordType) => { setChord(c); setInversion(0); setDropVoicing(0); }, []),
    scale, setScale,
    inversion, setInversion,
    dropVoicingType, setDropVoicing,
    labelMode, setLabelMode,
    showArpeggio, setShowArpeggio,
    cagedPosition, setCagedPosition,
    useFlats, setUseFlats,
    activeIntervals,
    activePitchClasses,
    scalePitchClasses,
    intervalTensions,
  };

  return <HarmonyContext.Provider value={value}>{children}</HarmonyContext.Provider>;
}

export function useHarmony() {
  const ctx = useContext(HarmonyContext);
  if (!ctx) throw new Error('useHarmony must be used within HarmonyProvider');
  return ctx;
}
