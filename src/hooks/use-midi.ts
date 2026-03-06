import { useState, useEffect, useCallback, useRef } from 'react';
import { type PitchClass, identifyChordFromPitchClasses } from '@/lib/musicTheory';

export interface MidiState {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  heldNotes: number[];       // MIDI note numbers currently held
  lastChord: {
    root: PitchClass;
    pitchClasses: PitchClass[];
    bassNote: number;         // lowest MIDI note (for inversion detection)
    inversion: number;
  } | null;
}

export interface MidiChordEvent {
  root: PitchClass;
  chord: ReturnType<typeof identifyChordFromPitchClasses> extends infer T ? T extends null ? never : T : never;
  inversion: number;
  pitchClasses: PitchClass[];
}

const NOTE_OFF_DELAY_MS = 300; // ms to wait after key release before processing

/**
 * Determines the inversion number by comparing the bass note's pitch class
 * to the identified root and the chord's interval structure.
 */
function detectInversion(
  bassNotePc: PitchClass,
  root: PitchClass,
  intervals: number[]
): number {
  if (bassNotePc === root) return 0;
  const chordPcs = intervals.map(i => ((root + i) % 12 + 12) % 12);
  const bassIndex = chordPcs.indexOf(bassNotePc);
  return bassIndex > 0 ? bassIndex : 0;
}

export function useMidi(
  onChordDetected?: (event: MidiChordEvent) => void
) {
  const [state, setState] = useState<MidiState>({
    isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    isConnected: false,
    deviceName: null,
    heldNotes: [],
    lastChord: null,
  });

  const heldNotesRef = useRef<Set<number>>(new Set());
  const onChordRef = useRef(onChordDetected);
  onChordRef.current = onChordDetected;
  const noteOffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processNotes = useCallback(() => {
    const notes = Array.from(heldNotesRef.current).sort((a, b) => a - b);
    setState(prev => ({ ...prev, heldNotes: notes }));

    if (notes.length === 0) return; // retain last chord

    const pitchClasses = [...new Set(notes.map(n => (n % 12) as PitchClass))].sort((a, b) => a - b);
    
    if (pitchClasses.length < 1) return;

    const identified = identifyChordFromPitchClasses(pitchClasses);
    if (!identified) return;

    const bassNote = notes[0];
    const bassPc = (bassNote % 12) as PitchClass;
    const inversion = detectInversion(bassPc, identified.root, identified.chord.intervals);

    setState(prev => ({
      ...prev,
      lastChord: { root: identified.root, pitchClasses, bassNote, inversion },
    }));

    onChordRef.current?.({
      root: identified.root,
      chord: identified,
      inversion,
      pitchClasses,
    });
  }, []);

  const scheduleNoteOffProcess = useCallback(() => {
    // Clear any pending timer
    if (noteOffTimerRef.current) {
      clearTimeout(noteOffTimerRef.current);
    }
    // Delay processing to allow for slightly staggered key releases
    noteOffTimerRef.current = setTimeout(() => {
      processNotes();
      noteOffTimerRef.current = null;
    }, NOTE_OFF_DELAY_MS);
  }, [processNotes]);

  useEffect(() => {
    if (!state.isSupported) return;

    let midiAccess: any = null;

    const handleMidiMessage = (e: any) => {
      const [status, note, velocity] = e.data ?? [];
      if (status === undefined || note === undefined) return;

      const command = status & 0xf0;
      if (command === 0x90 && velocity > 0) {
        // Note On — process immediately for responsiveness
        if (noteOffTimerRef.current) {
          clearTimeout(noteOffTimerRef.current);
          noteOffTimerRef.current = null;
        }
        heldNotesRef.current.add(note);
        processNotes();
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        // Note Off — delay processing
        heldNotesRef.current.delete(note);
        scheduleNoteOffProcess();
      }
    };

    const connectInputs = (access: any) => {
      let firstName: string | null = null;
      access.inputs.forEach((input: any) => {
        if (!firstName) firstName = input.name ?? 'MIDI Device';
        input.onmidimessage = handleMidiMessage;
      });
      setState(prev => ({
        ...prev,
        isConnected: access.inputs.size > 0,
        deviceName: firstName,
      }));
    };

    navigator.requestMIDIAccess({ sysex: false })
      .then((access) => {
        midiAccess = access;
        connectInputs(access);

        access.onstatechange = () => {
          connectInputs(access);
        };
      })
      .catch(() => {
        setState(prev => ({ ...prev, isSupported: false }));
      });

    return () => {
      if (noteOffTimerRef.current) {
        clearTimeout(noteOffTimerRef.current);
      }
      if (midiAccess) {
        midiAccess.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [state.isSupported, processNotes, scheduleNoteOffProcess]);

  return state;
}
