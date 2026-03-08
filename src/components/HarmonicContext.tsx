import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getChordFormula, findCompatibleKeys, getNoteName, CHORD_GENRE_HINTS } from '@/lib/musicTheory';

export default function HarmonicContext() {
  const { functionalAnalysis, chordVibe, chord, activePitchClasses, useFlats, scaleTonic, setScaleTonic } = useHarmony();

  const formula = getChordFormula(chord.intervals);
  const compatibleKeys = findCompatibleKeys(activePitchClasses);
  const genreHint = CHORD_GENRE_HINTS[chord.name];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">
        Harmonic Context
      </h3>
      <div className="bg-surface-2 border border-border rounded-md p-4 space-y-3">
        {/* Chord Formula */}
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Formula</p>
          <p className="text-sm font-mono text-foreground font-semibold tracking-wide">{formula}</p>
        </div>

        {/* Character / Vibe */}
        <div className="border-t border-border pt-3">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Character</p>
          <p className="text-sm font-sans text-foreground leading-relaxed">{chordVibe}</p>
          {genreHint && (
            <p className="text-[11px] font-sans text-muted-foreground mt-1">
              <span className="font-semibold">Common in:</span> {genreHint}
            </p>
          )}
        </div>

        {/* Functional Role */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-base font-mono font-bold ${functionalAnalysis.isDiatonic ? 'text-primary' : 'text-muted-foreground'}`}>
              {functionalAnalysis.degreeName}
            </span>
            <span className="text-xs font-sans text-muted-foreground">
              {functionalAnalysis.functionName}
            </span>
          </div>
          <p className="text-xs font-sans text-muted-foreground leading-relaxed">
            {functionalAnalysis.description}
          </p>
        </div>

        {/* Compatible Keys */}
        {compatibleKeys.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
              Found in Keys
            </p>
            <div className="flex flex-wrap gap-1.5">
              {compatibleKeys.map(tonic => (
                <span
                  key={tonic}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                    tonic === scaleTonic
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {getNoteName(tonic, useFlats)}
                </span>
              ))}
            </div>
            <p className="text-[10px] font-sans text-muted-foreground mt-1 italic">
              Major keys containing all notes of this chord
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
