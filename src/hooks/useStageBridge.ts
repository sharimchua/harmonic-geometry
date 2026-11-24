import { useEffect, useRef, useCallback } from 'react';
import {
  type PitchClass,
  type ChordType,
  type ScaleType,
  type LabelMode,
  type HarmonicLockMode,
  type ClockOrientation,
  type AccidentalPreference,
  CHORD_CATEGORIES,
  SCALE_CATEGORIES,
  identifyChordFromPitchClasses,
} from '@/lib/musicTheory';
import { synthInstance } from '@/lib/audioSynth';

const STAGE_PROTOCOL = 'midlifemuso-stage-v1';
const APP_ID = 'harmonic-geometry';

export interface SyncableHarmonyState {
  scaleTonic: PitchClass;
  harmonicRoot: PitchClass;
  chordName: string;
  scaleName: string | null;
  inversion: number;
  dropVoicingType: number;
  labelMode: LabelMode;
  clockOrientation: ClockOrientation;
  accidentalPreference: AccidentalPreference;
  pptSolfegeColors: boolean;
  pptNoteheads: boolean;
  showPianoTriangles: boolean;
  cagedPosition: number | null;
  lockMode: HarmonicLockMode;
  constructionMode: boolean;
  customPitchClasses: PitchClass[] | null;
  cadenceMode: boolean;
  lockedRoot: PitchClass | null;
  lockedChordName: string | null;
}

export function isStageEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.parent !== window &&
      new URLSearchParams(window.location.search).get('stage') === '1'
    );
  } catch {
    return false;
  }
}

function postToParent(msg: Record<string, unknown>): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage({ protocol: STAGE_PROTOCOL, appId: APP_ID, ...msg }, '*');
}

function findChordByName(name: string): ChordType | undefined {
  for (const list of Object.values(CHORD_CATEGORIES)) {
    const found = list.find((c) => c.name === name);
    if (found) return found;
  }
  return undefined;
}

function findScaleByName(name: string): ScaleType | undefined {
  for (const list of Object.values(SCALE_CATEGORIES)) {
    const found = list.find((s) => s.name === name);
    if (found) return found;
  }
  return undefined;
}

interface UseStageBridgeOptions {
  state: SyncableHarmonyState;
  audioEnabled: boolean;
  applyRemoteState: (st: Partial<SyncableHarmonyState>) => void;
  onUnlockAudio: () => void;
  onSetSuppressLocalMidi: (suppressed: boolean) => void;
  onRemoteChordDetected: (root: PitchClass, chord: ChordType, inversion: number) => void;
}

export function useStageBridge({
  state,
  audioEnabled,
  applyRemoteState,
  onUnlockAudio,
  onSetSuppressLocalMidi,
  onRemoteChordDetected,
}: UseStageBridgeOptions) {
  const embedded = isStageEmbedded();
  const isApplyingRemoteRef = useRef(false);
  const lastSentRef = useRef('');
  const throttleRef = useRef<number | null>(null);
  const remoteHeldMidiRef = useRef<Set<number>>(new Set());

  const latestRef = useRef({
    state,
    audioEnabled,
    applyRemoteState,
    onUnlockAudio,
    onSetSuppressLocalMidi,
    onRemoteChordDetected,
  });
  latestRef.current = {
    state,
    audioEnabled,
    applyRemoteState,
    onUnlockAudio,
    onSetSuppressLocalMidi,
    onRemoteChordDetected,
  };

  useEffect(() => {
    if (!embedded) return;

    postToParent({
      type: 'STAGE_READY',
      audioState: synthInstance.getAudioState(),
    });

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown> | null;
      if (!data || data.protocol !== STAGE_PROTOCOL || typeof data.type !== 'string') return;
      const cur = latestRef.current;

      switch (data.type) {
        case 'STAGE_INIT': {
          cur.onSetSuppressLocalMidi(Boolean(data.suppressLocalMidi));
          break;
        }
        case 'STAGE_UNLOCK_AUDIO': {
          cur.onUnlockAudio();
          void synthInstance.unlock().then((audioState) => {
            postToParent({ type: 'STAGE_AUDIO_STATE', audioState });
          });
          break;
        }
        case 'STAGE_MIDI': {
          const ev = data.event;
          if (ev === 'noteOn' && typeof data.midi === 'number') {
            const midi = data.midi;
            const vel = typeof data.velocity === 'number' ? data.velocity : 0.75;
            remoteHeldMidiRef.current.add(midi);
            if (cur.audioEnabled) {
              synthInstance.noteOn(midi, vel);
            }
            const notes = Array.from(remoteHeldMidiRef.current).sort((a, b) => a - b);
            const pcs = [...new Set(notes.map((n) => (n % 12) as PitchClass))].sort((a, b) => a - b);
            if (pcs.length >= 1) {
              const bassPc = (notes[0] % 12) as PitchClass;
              const identified = identifyChordFromPitchClasses(pcs, {
                preferredRoot: cur.state.harmonicRoot,
                scaleTonic: cur.state.scaleTonic,
                bassPitchClass: bassPc,
              });
              if (identified) {
                const chordPcs = identified.chord.intervals.map(
                  (i) => ((identified.root + i) % 12 + 12) % 12
                );
                const idx = chordPcs.indexOf(bassPc);
                const inv = bassPc === identified.root ? 0 : idx > 0 ? idx : 0;
                isApplyingRemoteRef.current = true;
                cur.onRemoteChordDetected(identified.root, identified.chord, inv);
                window.setTimeout(() => {
                  isApplyingRemoteRef.current = false;
                }, 40);
              }
            }
          } else if (ev === 'noteOff' && typeof data.midi === 'number') {
            remoteHeldMidiRef.current.delete(data.midi);
            synthInstance.noteOff(data.midi);
          } else if (ev === 'allNotesOff') {
            remoteHeldMidiRef.current.clear();
            synthInstance.stopAll(true);
          }
          break;
        }
        case 'REMOTE_STATE': {
          const st = data.state as Partial<SyncableHarmonyState> | null;
          if (!st || typeof st !== 'object') break;
          isApplyingRemoteRef.current = true;
          cur.applyRemoteState(st);
          window.setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 50);
          break;
        }
        case 'REMOTE_ACTION': {
          const action = data.action;
          const payload = data.payload as Record<string, unknown> | undefined;
          if (
            action === 'PLAY_CHORD' &&
            typeof payload?.root === 'number' &&
            Array.isArray(payload?.intervals)
          ) {
            const mode = payload.mode === 'block' ? 'block' : 'arpeggio';
            const intervals = payload.intervals.filter((n): n is number => typeof n === 'number');
            synthInstance.playChordVoicing(payload.root, intervals, mode);
          } else if (action === 'PLAY_NOTE' && typeof payload?.midi === 'number') {
            synthInstance.playSingleNote(payload.midi);
          }
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [embedded]);

  useEffect(() => {
    if (!embedded || isApplyingRemoteRef.current) return;
    const encoded = JSON.stringify(state);
    if (encoded === lastSentRef.current) return;

    if (throttleRef.current !== null) {
      window.clearTimeout(throttleRef.current);
    }
    throttleRef.current = window.setTimeout(() => {
      throttleRef.current = null;
      if (isApplyingRemoteRef.current) return;
      lastSentRef.current = encoded;
      postToParent({ type: 'APP_STATE_UPDATE', state });
    }, 100);

    return () => {
      if (throttleRef.current !== null) {
        window.clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
    };
  }, [embedded, state]);

  const broadcastAction = useCallback(
    (action: string, payload?: unknown) => {
      if (!embedded || isApplyingRemoteRef.current) return;
      postToParent({ type: 'APP_ACTION', action, payload });
    },
    [embedded]
  );

  return {
    isEmbedded: embedded,
    broadcastAction,
    findChordByName,
    findScaleByName,
  };
}
