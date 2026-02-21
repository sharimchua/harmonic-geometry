import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  NOTE_NAMES_SHARP, NOTE_NAMES_FLAT,
  CHORD_CATEGORIES, SCALE_CATEGORIES,
  type LabelMode, type HarmonicLockMode,
} from '@/lib/musicTheory';

export default function ControlPanel() {
  const {
    scaleTonic, setScaleTonic,
    root, setRoot, chord, setChord, scale, setScale,
    inversion, setInversion, dropVoicingType, setDropVoicing,
    labelMode, setLabelMode, showArpeggio, setShowArpeggio,
    useFlats, setUseFlats,
    lockMode, setLockMode,
    functionalAnalysis, chordVibe,
  } = useHarmony();

  const noteNames = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
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

      {/* Contextual Descriptor */}
      <Section title="Harmonic Context">
        <div className="bg-surface-2 border border-border rounded-md p-3 space-y-2">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Character</p>
            <p className="text-xs font-sans text-foreground leading-relaxed">{chordVibe}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-sm font-mono font-bold ${functionalAnalysis.isDiatonic ? 'text-primary' : 'text-muted-foreground'}`}>
                {functionalAnalysis.degreeName}
              </span>
              <span className="text-[10px] font-sans text-muted-foreground">
                {functionalAnalysis.functionName}
              </span>
            </div>
            <p className="text-[11px] font-sans text-muted-foreground leading-relaxed">{functionalAnalysis.description}</p>
          </div>
        </div>
      </Section>

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
                  {i === 0 ? 'Root' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : 'rd'}`}
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

      {/* Display Settings */}
      <Section title="Display">
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Labels</p>
            <div className="flex gap-1">
              {(['notes', 'intervals', 'semitones'] as LabelMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setLabelMode(m)}
                  className={`px-2 py-1 rounded text-xs font-mono capitalize transition-all ${
                    labelMode === m
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArpeggio}
                onChange={e => setShowArpeggio(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-xs font-sans text-muted-foreground">Arpeggio Mode</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useFlats}
                onChange={e => setUseFlats(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-xs font-sans text-muted-foreground">♭ Flats</span>
            </label>
          </div>
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
