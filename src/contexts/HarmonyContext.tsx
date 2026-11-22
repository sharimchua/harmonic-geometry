import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  type PitchClass,
  type ChordType,
  type ScaleType,
  type LabelMode,
  type HarmonicLockMode,
  type FunctionalAnalysis,
  type ClockOrientation,
  type AccidentalPreference,
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
  identifyChordFromPitchClasses,
  shouldKeyUseFlats,
  type IdentifyChordOptions,
  type ChordMatchKind,
  type IntervalTension,
  type VoiceLeadingMove,
  calculateVoiceLeading,
} from '@/lib/musicTheory';
import { useMidi, type MidiState } from '@/hooks/use-midi';
import { synthInstance } from '@/lib/audioSynth';

interface HarmonyState {
  scaleTonic: PitchClass;
  harmonicRoot: PitchClass;
  chord: ChordType;
  scale: ScaleType | null;
  inversion: number;
  dropVoicingType: number;
  labelMode: LabelMode;
  clockOrientation: ClockOrientation;
  accidentalPreference: AccidentalPreference;
  pptSolfegeColors: boolean;
  pptNoteheads: boolean;
  showPianoTriangles: boolean;
  audioEnabled: boolean;
  cagedPosition: number | null;
  useFlats: boolean;
  lockMode: HarmonicLockMode;
  constructionMode: boolean;
  cadenceMode: boolean;
  lockedRoot: PitchClass | null;
  lockedChord: ChordType | null;
}

interface HarmonyContextValue extends HarmonyState {
  root: PitchClass;
  setScaleTonic: (tonic: PitchClass) => void;
  setRoot: (root: PitchClass) => void;
  setChord: (chord: ChordType) => void;
  setScale: (scale: ScaleType | null) => void;
  setInversion: (inv: number) => void;
  setDropVoicing: (drop: number) => void;
  setLabelMode: (mode: LabelMode) => void;
  setClockOrientation: (orientation: ClockOrientation) => void;
  setAccidentalPreference: (pref: AccidentalPreference) => void;
  setPptSolfegeColors: (on: boolean) => void;
  setPptNoteheads: (on: boolean) => void;
  setShowPianoTriangles: (on: boolean) => void;
  setAudioEnabled: (on: boolean) => void;
  playCurrentChord: (mode?: 'block' | 'arpeggio') => void;
  playNote: (midi: number) => void;
  setCagedPosition: (pos: number | null) => void;
  setUseFlats: (useFlats: boolean) => void;
  setLockMode: (mode: HarmonicLockMode) => void;
  setConstructionMode: (on: boolean) => void;
  togglePitchClass: (pc: PitchClass) => void;
  // Cadence mode
  setCadenceMode: (on: boolean) => void;
  relockCadence: () => void;
  // MIDI
  midi: MidiState;
  midiEnabled: boolean;
  setMidiEnabled: (on: boolean) => void;
  // Derived data
  activeIntervals: number[];
  activePitchClasses: PitchClass[];
  lockedPitchClasses: PitchClass[];
  scalePitchClasses: PitchClass[];
  intervalTensions: { from: PitchClass; to: PitchClass; tension: IntervalTension; semitones: number }[];
  functionalAnalysis: FunctionalAnalysis;
  chordVibe: string;
  voiceLeading: VoiceLeadingMove[];
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
  const [clockOrientation, setClockOrientation] = useState<ClockOrientation>('tonic');
  const [accidentalPreference, setAccidentalPreference] = useState<AccidentalPreference>('auto');
  const [pptSolfegeColors, setPptSolfegeColors] = useState<boolean>(true);
  const [pptNoteheads, setPptNoteheads] = useState<boolean>(true);
  const [showPianoTriangles, setShowPianoTriangles] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabledRaw] = useState<boolean>(false);

  const [cagedPosition, setCagedPosition] = useState<number | null>(null);
  const [lockMode, setLockMode] = useState<HarmonicLockMode>('scale');
  const [constructionMode, setConstructionMode] = useState(false);
  const [customPitchClasses, setCustomPitchClasses] = useState<PitchClass[] | null>(null);
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [cadenceMode, setCadenceModeRaw] = useState(false);
  const [lockedRoot, setLockedRoot] = useState<PitchClass | null>(null);
  const [lockedChord, setLockedChord] = useState<ChordType | null>(null);

  const useFlats = useMemo(() => {
    if (accidentalPreference === 'flats') return true;
    if (accidentalPreference === 'sharps') return false;
    return shouldKeyUseFlats(scaleTonic, scale?.intervals ?? null);
  }, [accidentalPreference, scaleTonic, scale]);

  const setUseFlats = useCallback((flats: boolean) => {
    setAccidentalPreference(flats ? 'flats' : 'sharps');
  }, []);

  const setAudioEnabled = useCallback((on: boolean) => {
    setAudioEnabledRaw(on);
  }, []);

  const setCadenceMode = useCallback((on: boolean) => {
    if (on) {
      setLockedRoot(harmonicRoot);
      setLockedChord(chord);
    } else {
      setLockedRoot(null);
      setLockedChord(null);
    }
    setCadenceModeRaw(on);
  }, [harmonicRoot, chord]);

  const relockCadence = useCallback(() => {
    setLockedRoot(harmonicRoot);
    setLockedChord(chord);
  }, [harmonicRoot, chord]);

  // MIDI integration — update harmony when chords are played
  const handleMidiChord = useCallback((event: {
    root: PitchClass;
    chord: ChordType;
    matchKind: ChordMatchKind;
    inversion: number;
    pitchClasses: PitchClass[];
  }) => {
    if (!midiEnabled) return;
    setHarmonicRoot(event.root);
    setChordRaw(event.chord);
    setInversion(event.inversion);
    setDropVoicing(0);
    setCustomPitchClasses(null);
  }, [midiEnabled]);

  const getMidiIdentifyOptions = useCallback((): Omit<IdentifyChordOptions, 'bassPitchClass'> => ({
    preferredRoot: harmonicRoot,
    scaleTonic,
  }), [harmonicRoot, scaleTonic]);

  const midi = useMidi(midiEnabled ? handleMidiChord : undefined, getMidiIdentifyOptions, midiEnabled);

  // Toggle a pitch class on/off in construction mode
  const togglePitchClass = useCallback((pc: PitchClass) => {
    setCustomPitchClasses(prev => {
      const current = prev ?? getPitchClasses(harmonicRoot, chord.intervals);
      const next = current.includes(pc)
        ? current.filter(p => p !== pc)
        : [...current, pc].sort((a, b) => a - b);

      if (next.length >= 1) {
        const identified = identifyChordFromPitchClasses(next, {
          preferredRoot: harmonicRoot,
          scaleTonic,
        });
        if (identified) {
          setHarmonicRoot(identified.root);
          setChordRaw(identified.chord);
          if (audioEnabled) {
            synthInstance.playChordVoicing(identified.root, identified.chord.intervals, 'block');
          }
        }
      }
      return next.length === 0 ? null : next;
    });
  }, [harmonicRoot, chord.intervals, scaleTonic, audioEnabled]);

  // When in scale lock mode, changing root adjusts chord quality diatonically
  const setRoot = useCallback((newRoot: PitchClass) => {
    setCustomPitchClasses(null);
    setHarmonicRoot(newRoot);
    setInversion(0);
    setDropVoicing(0);

    let nextChord = chord;
    if (lockMode === 'scale' && scale) {
      const degree = getScaleDegree(scaleTonic, scale.intervals, newRoot);
      if (degree !== -1) {
        const currentNoteCount = chord.intervals.length;
        const diatonicChord = getDiatonicChordForDegree(scale.intervals, degree, currentNoteCount);
        if (diatonicChord) {
          setChordRaw(diatonicChord);
          nextChord = diatonicChord;
        }
      }
    }
    if (audioEnabled) {
      synthInstance.playChordVoicing(newRoot, nextChord.intervals, 'arpeggio');
    }
  }, [lockMode, scale, scaleTonic, chord, audioEnabled]);

  const setChord = useCallback((c: ChordType) => {
    setChordRaw(c);
    setInversion(0);
    setDropVoicing(0);
    setCustomPitchClasses(null);
    if (audioEnabled) {
      synthInstance.playChordVoicing(harmonicRoot, c.intervals, 'arpeggio');
    }
  }, [harmonicRoot, audioEnabled]);

  const activeIntervals = useMemo(() => {
    let intervals = [...chord.intervals];
    if (inversion > 0) intervals = invertChord(intervals, inversion);
    if (dropVoicingType > 0) intervals = dropVoicing(intervals, dropVoicingType);
    return intervals;
  }, [chord, inversion, dropVoicingType]);

  const playCurrentChord = useCallback((mode: 'block' | 'arpeggio' = 'arpeggio') => {
    synthInstance.playChordVoicing(harmonicRoot, activeIntervals, mode);
  }, [harmonicRoot, activeIntervals]);

  const playNote = useCallback((midiNote: number) => {
    synthInstance.playSingleNote(midiNote);
  }, []);

  // Deduplicated pitch classes from the base chord intervals
  const activePitchClasses = useMemo(
    () => customPitchClasses ?? [...new Set(getPitchClasses(harmonicRoot, chord.intervals))],
    [harmonicRoot, chord.intervals, customPitchClasses]
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

  const lockedPitchClasses = useMemo(
    () => lockedRoot !== null && lockedChord ? [...new Set(getPitchClasses(lockedRoot, lockedChord.intervals))] : [],
    [lockedRoot, lockedChord]
  );

  const voiceLeading = useMemo(
    () => cadenceMode && lockedPitchClasses.length > 0
      ? calculateVoiceLeading(lockedPitchClasses, activePitchClasses)
      : [],
    [cadenceMode, lockedPitchClasses, activePitchClasses]
  );

  const value: HarmonyContextValue = {
    scaleTonic,
    setScaleTonic: useCallback((t: PitchClass) => setScaleTonic(t), []),
    harmonicRoot,
    root: harmonicRoot,
    setRoot,
    chord,
    setChord,
    scale,
    setScale,
    inversion,
    setInversion,
    dropVoicingType,
    setDropVoicing,
    labelMode,
    setLabelMode,
    clockOrientation,
    setClockOrientation,
    accidentalPreference,
    setAccidentalPreference,
    pptSolfegeColors,
    setPptSolfegeColors,
    pptNoteheads,
    setPptNoteheads,
    showPianoTriangles,
    setShowPianoTriangles,
    audioEnabled,
    setAudioEnabled,
    playCurrentChord,
    playNote,
    cagedPosition,
    setCagedPosition,
    useFlats,
    setUseFlats,
    lockMode,
    setLockMode,
    constructionMode,
    setConstructionMode,
    togglePitchClass,
    cadenceMode,
    lockedRoot,
    lockedChord,
    setCadenceMode,
    relockCadence,
    midi,
    midiEnabled,
    setMidiEnabled,
    activeIntervals,
    activePitchClasses,
    lockedPitchClasses,
    scalePitchClasses,
    intervalTensions,
    functionalAnalysis,
    chordVibe,
    voiceLeading,
  };

  return <HarmonyContext.Provider value={value}>{children}</HarmonyContext.Provider>;
}

export function useHarmony() {
  const ctx = useContext(HarmonyContext);
  if (!ctx) throw new Error('useHarmony must be used within HarmonyProvider');
  return ctx;
}
