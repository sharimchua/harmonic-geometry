import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  NOTE_NAMES_SHARP, NOTE_NAMES_FLAT, TRI_PITCH_CLASSES,
  CHORD_CATEGORIES, SCALE_CATEGORIES,
  type HarmonicLockMode,
  type ClockOrientation,
  type AccidentalPreference,
} from '@/lib/musicTheory';

export default function ControlPanel() {
  const {
    scaleTonic, setScaleTonic,
    root, setRoot, chord, setChord, scale, setScale,
    inversion, setInversion, dropVoicingType, setDropVoicing,
    useFlats, labelMode,
    clockOrientation, setClockOrientation,
    accidentalPreference, setAccidentalPreference,
    pptSolfegeColors, setPptSolfegeColors,
    pptNoteheads, setPptNoteheads,
    showPianoTriangles, setShowPianoTriangles,
    audioEnabled, setAudioEnabled, playCurrentChord,
    lockMode, setLockMode,
    midi, midiEnabled, setMidiEnabled,
  } = useHarmony();

  const noteNames = labelMode === 'tri'
    ? TRI_PITCH_CLASSES
    : (useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP);
  const maxInversion = chord.intervals.length - 1;

  return (
    <div className="space-y-5 text-sm">
      {/* Harmonic Lock Mode */}
      <Section title="Harmonic Mode">
        <div className="flex gap-1">
          {([['quality', 'Quality Lock'], ['scale', 'Scale Lock']] as [HarmonicLockMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setLockMode(mode)}
              className={`px-2.5 py-1.5 rounded text-xs font-sans transition-all ${
                lockMode === mode
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-sans leading-relaxed">
          {lockMode === 'quality'
            ? 'Keeps chord shape fixed when changing roots.'
            : 'Auto-adjusts chord quality to stay diatonic.'}
        </p>
      </Section>

      {/* Scale Tonic (Key Center) */}
      <Section title="Key Center (Tonic)">
        <div className="grid grid-cols-6 gap-1">
          {noteNames.map((name, i) => (
            <button
              key={i}
              onClick={() => setScaleTonic(i)}
              className={`px-2 py-1.5 rounded font-mono text-xs transition-all ${
                scaleTonic === i
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </Section>

      {/* Harmonic Root (Chord Root) */}
      <Section title="Chord Root">
        <div className="grid grid-cols-6 gap-1">
          {noteNames.map((name, i) => (
            <button
              key={i}
              onClick={() => setRoot(i)}
              className={`px-2 py-1.5 rounded font-mono text-xs transition-all ${
                root === i
                  ? 'bg-note-root text-primary-foreground font-semibold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </Section>

      {/* Harmonic Context moved to main display */}

      {/* Chord Quality */}
      <Section title="Chord Quality">
        <div className="space-y-2">
          {Object.entries(CHORD_CATEGORIES).map(([category, chords]) => (
            <div key={category}>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{category}</p>
              <div className="flex flex-wrap gap-1">
                {chords.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setChord(c)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                      chord.name === c.name
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Scale */}
      <Section title="Scale / Mode">
        <button
          onClick={() => setScale(null)}
          className={`px-2 py-1 rounded text-xs font-mono mb-2 transition-all ${
            !scale ? 'bg-accent text-accent-foreground font-semibold' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          None
        </button>
        <div className="space-y-2">
          {Object.entries(SCALE_CATEGORIES).map(([category, scales]) => (
            <div key={category}>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{category}</p>
              <div className="flex flex-wrap gap-1">
                {scales.map(s => (
                  <button
                    key={s.name}
                    onClick={() => setScale(s)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                      scale?.name === s.name
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Voicing Controls */}
      <Section title="Voicing">
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Inversion</p>
            <div className="flex gap-1">
              {Array.from({ length: maxInversion + 1 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setInversion(i)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                    inversion === i
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {i === 0 ? 'Root' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Drop Voicing</p>
            <div className="flex gap-1">
              {[0, 2, 3].map(d => (
                <button
                  key={d}
                  onClick={() => setDropVoicing(d)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                    dropVoicingType === d
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {d === 0 ? 'None' : `Drop ${d}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Display & PPT Settings */}
      <Section title="Display & PPT Layers">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">12 o'clock Zenith</p>
            <div className="flex gap-1">
              {([
                ['tonic', 'Tonic (Do)'],
                ['root', 'Chord Root'],
                ['fixed-c', 'Fixed C'],
              ] as [ClockOrientation, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setClockOrientation(mode)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                    clockOrientation === mode
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Enharmonic Spelling</p>
            <div className="flex gap-1">
              {([
                ['auto', 'Auto (Key)'],
                ['sharps', '♯ Sharps'],
                ['flats', '♭ Flats'],
              ] as [AccidentalPreference, string][]).map(([pref, label]) => (
                <button
                  key={pref}
                  onClick={() => setAccidentalPreference(pref)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                    accidentalPreference === pref
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!pptNoteheads}
                onChange={e => setPptNoteheads(!e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-xs font-sans text-muted-foreground">♩ Traditional Oval Noteheads</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPianoTriangles}
                onChange={e => setShowPianoTriangles(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-xs font-sans text-muted-foreground">△ PPT Piano Triangles (D/L/U/R)</span>
            </label>
          </div>
        </div>
      </Section>

      {/* Audio & Ear-First Auditioning */}
      <Section title="Audio Synth">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`px-2.5 py-1.5 rounded text-xs font-sans transition-all ${
              audioEnabled
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {audioEnabled ? '🔊 Auto-Play On' : '🔇 Auto-Play Off'}
          </button>
          <button
            onClick={() => playCurrentChord('arpeggio')}
            className="px-2.5 py-1.5 rounded text-xs font-mono bg-surface-3 border border-border text-foreground hover:border-primary/50 transition-all"
          >
            ▶ Strum Chord
          </button>
        </div>
      </Section>

      {/* MIDI Input */}
      <Section title="MIDI Input">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMidiEnabled(!midiEnabled)}
              className={`px-2.5 py-1.5 rounded text-xs font-sans transition-all ${
                midiEnabled
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {midiEnabled ? '🎹 MIDI On' : 'Enable MIDI'}
            </button>
          </div>
          {midi.isSupported ? (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${midi.isConnected ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
              <span className="text-[11px] font-sans text-muted-foreground">
                {midi.isConnected ? midi.deviceName : 'No device'}
              </span>
            </div>
          ) : (
            <p className="text-[11px] font-sans text-muted-foreground">MIDI not supported in this browser</p>
          )}
          {midiEnabled && midi.heldNotes.length > 0 && (
            <div className="text-[10px] font-mono text-muted-foreground">
              Notes: {midi.heldNotes.map(n => n).join(', ')}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-1">{title}</h4>
      {children}
    </div>
  );
}
