import React, { useMemo, useState } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getChordPartials,
  calculatePartialInteractions,
  calculateChordDissonance,
  getNoteName,
  type Partial,
  type PartialInteraction,
} from '@/lib/musicTheory';

// Assign a unique hue per pitch class for note colouring
const NOTE_HUES: Record<number, number> = {
  0: 32,   // C - orange (root feel)
  1: 0,    // C#
  2: 45,   // D
  3: 60,   // Eb
  4: 80,   // E
  5: 120,  // F
  6: 340,  // F#/Gb (tritone)
  7: 220,  // G (perfect)
  8: 200,  // Ab
  9: 150,  // A (consonant)
  10: 280, // Bb
  11: 300, // B
};

function noteColor(pc: number, alpha = 0.85): string {
  const hue = NOTE_HUES[pc % 12] ?? 0;
  return `hsla(${hue}, 65%, 55%, ${alpha})`;
}

const OCTAVE_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function DissonanceSpectrum() {
  const { activePitchClasses, root, useFlats } = useHarmony();
  const [baseOctave, setBaseOctave] = useState(3);

  const { partials, noteFrequencies } = useMemo(
    () => getChordPartials(activePitchClasses, baseOctave),
    [activePitchClasses, baseOctave]
  );

  const interactions = useMemo(
    () => calculatePartialInteractions(noteFrequencies),
    [noteFrequencies]
  );

  const totalDissonance = useMemo(
    () => calculateChordDissonance(noteFrequencies.map(n => n.freq)),
    [noteFrequencies]
  );

  // Frequency range for display
  const allFreqs = partials.map(p => p.frequency);
  const minFreq = Math.max(20, Math.min(...allFreqs) * 0.8);
  const maxFreq = Math.max(...allFreqs) * 1.15;

  // Use logarithmic scale for frequency axis
  const freqToX = (f: number, width: number) => {
    const logMin = Math.log2(minFreq);
    const logMax = Math.log2(maxFreq);
    return ((Math.log2(f) - logMin) / (logMax - logMin)) * width;
  };

  // Find overlapping partials (within critical bandwidth)
  const overlappingPairs = useMemo(() => {
    return interactions
      .filter(i => i.dissonance > 0.5)
      .sort((a, b) => b.dissonance - a.dissonance);
  }, [interactions]);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 200;
  const barAreaTop = 30;
  const barAreaBottom = 160;
  const barAreaHeight = barAreaBottom - barAreaTop;

  // Group partials by note for layered rendering
  const partialsByNote = useMemo(() => {
    const map = new Map<number, Partial[]>();
    for (const p of partials) {
      const arr = map.get(p.fundamentalPc) || [];
      arr.push(p);
      map.set(p.fundamentalPc, arr);
    }
    return map;
  }, [partials]);

  // Max amplitude for scaling
  const maxAmp = 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">
          Psychoacoustical Dissonance
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">Octave:</span>
          <div className="flex gap-0.5">
            {OCTAVE_OPTIONS.map(oct => (
              <button
                key={oct}
                onClick={() => setBaseOctave(oct)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  baseOctave === oct
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-3 text-muted-foreground hover:bg-surface-2'
                }`}
              >
                C{oct}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dissonance score */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Total Dissonance:</span>
        <span className="text-sm font-mono font-bold text-foreground">{Math.round(totalDissonance)}</span>
        <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (totalDissonance / 30) * 100)}%`,
              background: `linear-gradient(90deg, hsl(var(--interval-consonant)), hsl(var(--interval-mild)), hsl(var(--interval-dissonant)))`,
            }}
          />
        </div>
      </div>

      {/* Spectrum SVG */}
      <div className="overflow-x-auto w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ minWidth: 500 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background grid lines */}
          {[100, 200, 500, 1000, 2000, 5000, 10000].filter(f => f >= minFreq && f <= maxFreq).map(f => {
            const x = freqToX(f, svgWidth);
            return (
              <g key={`grid-${f}`}>
                <line x1={x} y1={barAreaTop} x2={x} y2={barAreaBottom} stroke="hsl(30, 5%, 18%)" strokeWidth={0.5} />
                <text x={x} y={barAreaBottom + 14} textAnchor="middle" fontSize={8} fontFamily="'JetBrains Mono', monospace" fill="hsl(30, 8%, 35%)">
                  {f >= 1000 ? `${f / 1000}k` : f}Hz
                </text>
              </g>
            );
          })}

          {/* Overlap / dissonance zones - rendered as translucent bands between conflicting partials */}
          {overlappingPairs.slice(0, 30).map((pair, i) => {
            const f1 = pair.partial1.frequency;
            const f2 = pair.partial2.frequency;
            const x1 = freqToX(Math.min(f1, f2), svgWidth);
            const x2 = freqToX(Math.max(f1, f2), svgWidth);
            const bandWidth = Math.max(2, x2 - x1);
            const opacity = Math.min(0.4, pair.dissonance * 0.15);
            return (
              <rect
                key={`overlap-${i}`}
                x={x1}
                y={barAreaTop}
                width={bandWidth}
                height={barAreaHeight}
                fill="hsl(var(--interval-dissonant))"
                opacity={opacity}
                rx={1}
              />
            );
          })}

          {/* Partial bars per note */}
          {Array.from(partialsByNote.entries()).map(([pc, notePartials]) => {
            const color = noteColor(pc);
            const barWidth = Math.max(2, svgWidth / (partials.length * 2.5));

            return notePartials.map((p, pi) => {
              const x = freqToX(p.frequency, svgWidth);
              const height = (p.amplitude / maxAmp) * barAreaHeight * 0.85;
              const isFundamental = p.partialNumber === 1;

              return (
                <g key={`bar-${pc}-${pi}`}>
                  <rect
                    x={x - barWidth / 2}
                    y={barAreaBottom - height}
                    width={barWidth}
                    height={height}
                    fill={color}
                    opacity={isFundamental ? 0.9 : 0.5}
                    rx={1}
                  />
                  {/* Fundamental label */}
                  {isFundamental && (
                    <>
                      <circle cx={x} cy={barAreaTop - 6} r={6} fill={color} opacity={0.9} />
                      <text
                        x={x}
                        y={barAreaTop - 3}
                        textAnchor="middle"
                        fontSize={7}
                        fontFamily="'JetBrains Mono', monospace"
                        fill="hsl(0, 0%, 7%)"
                        fontWeight={700}
                      >
                        {getNoteName(pc, useFlats)}
                      </text>
                    </>
                  )}
                  {/* Overtone number for non-fundamentals */}
                  {!isFundamental && p.amplitude > 0.4 && (
                    <text
                      x={x}
                      y={barAreaBottom - height - 3}
                      textAnchor="middle"
                      fontSize={6}
                      fontFamily="'JetBrains Mono', monospace"
                      fill={color}
                      opacity={0.7}
                    >
                      {p.partialNumber}×
                    </text>
                  )}
                </g>
              );
            });
          })}

          {/* Axis line */}
          <line x1={0} y1={barAreaBottom} x2={svgWidth} y2={barAreaBottom} stroke="hsl(30, 5%, 22%)" strokeWidth={1} />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono text-muted-foreground">
        {activePitchClasses.map(pc => (
          <div key={pc} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: noteColor(pc) }} />
            <span>{getNoteName(pc, useFlats)}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-interval-dissonant opacity-40" />
          <span>Overlap / Roughness</span>
        </div>
      </div>
    </div>
  );
}
