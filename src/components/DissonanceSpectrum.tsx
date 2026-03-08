import React, { useMemo, useState } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getChordPartials,
  calculatePartialInteractions,
  calculateChordDissonance,
  getNoteName,
  type Partial,
} from '@/lib/musicTheory';

// Unique hue per pitch class
const NOTE_HUES: Record<number, number> = {
  0: 32, 1: 0, 2: 45, 3: 60, 4: 80, 5: 120,
  6: 340, 7: 220, 8: 200, 9: 150, 10: 280, 11: 300,
};

function noteColor(pc: number, alpha = 0.85): string {
  const hue = NOTE_HUES[pc % 12] ?? 0;
  return `hsla(${hue}, 65%, 55%, ${alpha})`;
}

function noteColorFill(pc: number): string {
  const hue = NOTE_HUES[pc % 12] ?? 0;
  return `hsla(${hue}, 55%, 50%, 0.35)`;
}

function noteColorStroke(pc: number): string {
  const hue = NOTE_HUES[pc % 12] ?? 0;
  return `hsla(${hue}, 65%, 60%, 0.8)`;
}

const OCTAVE_OPTIONS = [1, 2, 3, 4, 5, 6];

// Critical bandwidth in Hz (Bark scale approximation) — wider at low frequencies
function criticalBandwidth(freq: number): number {
  return 25 + 75 * Math.pow(1 + 1.4 * (freq / 1000) * (freq / 1000), 0.69);
}

// Generate a smooth Gaussian-like peak for a partial
function gaussianPeak(centerX: number, amplitude: number, sigma: number, x: number): number {
  const dx = x - centerX;
  return amplitude * Math.exp(-(dx * dx) / (2 * sigma * sigma));
}

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

  // Frequency range — always show C1 to ~C8 region for context
  const minFreq = 28; // ~B0
  const maxFreq = 5500; // well past overtones

  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  const freqToX = (f: number, width: number) =>
    ((Math.log2(f) - logMin) / (logMax - logMin)) * width;

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 220;
  const plotTop = 24;
  const plotBottom = 185;
  const plotHeight = plotBottom - plotTop;

  // Octave marker frequencies (C1 through C8)
  const octaveMarkers = useMemo(() => {
    const markers: { freq: number; label: string }[] = [];
    for (let oct = 1; oct <= 8; oct++) {
      const freq = 440 * Math.pow(2, (oct - 4) + (0 - 9) / 12); // C = pc 0
      // C frequency = 440 * 2^((oct-4) + (0-9)/12)
      if (freq >= minFreq && freq <= maxFreq) {
        markers.push({ freq, label: `C${oct}` });
      }
    }
    return markers;
  }, []);

  // Group partials by note
  const partialsByNote = useMemo(() => {
    const map = new Map<number, Partial[]>();
    for (const p of partials) {
      const arr = map.get(p.fundamentalPc) || [];
      arr.push(p);
      map.set(p.fundamentalPc, arr);
    }
    return map;
  }, [partials]);

  // Number of thin bars per partial to create waveform look
  const BARS_PER_PARTIAL = 11; // odd number so there's a center bar
  const BAR_GAP = 1; // px gap between bars

  // Build waveform bar data per note
  const noteBars = useMemo(() => {
    const allBars: { pc: number; items: { x: number; cx: number; width: number; height: number; partial: Partial; subBars: { x: number; w: number; h: number }[] }[] }[] = [];

    for (const [pc, notePartials] of partialsByNote.entries()) {
      const sorted = [...notePartials].sort((a, b) => a.frequency - b.frequency);
      const items = sorted.map(p => {
        const cx = freqToX(p.frequency, svgWidth);
        const cbHz = criticalBandwidth(p.frequency);
        const xLo = freqToX(Math.max(minFreq, p.frequency - cbHz / 2), svgWidth);
        const xHi = freqToX(p.frequency + cbHz / 2, svgWidth);
        const totalW = Math.max(6, xHi - xLo);
        const peakHeight = p.amplitude * plotHeight * 0.85;

        // Create sub-bars with Gaussian falloff from center
        const subBarW = Math.max(1, (totalW - (BARS_PER_PARTIAL - 1) * BAR_GAP) / BARS_PER_PARTIAL);
        const mid = (BARS_PER_PARTIAL - 1) / 2;
        const subBars: { x: number; w: number; h: number }[] = [];

        for (let j = 0; j < BARS_PER_PARTIAL; j++) {
          const dist = Math.abs(j - mid) / mid; // 0 at center, 1 at edges
          const h = peakHeight * Math.exp(-2.5 * dist * dist); // Gaussian envelope
          const bx = cx - totalW / 2 + j * (subBarW + BAR_GAP);
          if (h > 1) {
            subBars.push({ x: bx, w: subBarW, h });
          }
        }

        return { x: cx - totalW / 2, cx, width: totalW, height: peakHeight, partial: p, subBars };
      });
      allBars.push({ pc, items });
    }
    return allBars;
  }, [partialsByNote, svgWidth, plotHeight]);

  // Dissonance overlap bars
  const dissonanceBars = useMemo(() => {
    if (interactions.length === 0) return [];

    return interactions
      .filter(i => i.dissonance > 0.3)
      .sort((a, b) => b.dissonance - a.dissonance)
      .slice(0, 40)
      .map(pair => {
        const f1 = Math.min(pair.partial1.frequency, pair.partial2.frequency);
        const f2 = Math.max(pair.partial1.frequency, pair.partial2.frequency);
        const x1 = freqToX(f1, svgWidth);
        const x2 = freqToX(f2, svgWidth);
        const barW = Math.max(3, x2 - x1);
        const height = Math.min(pair.dissonance * 3, plotHeight * 0.5);
        const opacity = Math.min(0.45, pair.dissonance * 0.12);
        return { x: x1, width: barW, height, opacity };
      });
  }, [interactions, svgWidth, plotHeight]);

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
        <span className="text-sm font-mono font-bold text-foreground">{Math.round(totalDissonance)}%</span>
        <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, totalDissonance)}%`,
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
          <defs>
            {/* Dissonance gradient */}
            <linearGradient id="dissonance-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--interval-dissonant))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--interval-dissonant))" stopOpacity="0.05" />
            </linearGradient>
            {/* Per-note gradients */}
            {activePitchClasses.map(pc => {
              const hue = NOTE_HUES[pc % 12] ?? 0;
              return (
                <linearGradient key={`grad-${pc}`} id={`note-grad-${pc}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`hsla(${hue}, 55%, 55%, 0.5)`} />
                  <stop offset="100%" stopColor={`hsla(${hue}, 55%, 55%, 0.03)`} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Octave marker lines */}
          {octaveMarkers.map(m => {
            const x = freqToX(m.freq, svgWidth);
            return (
              <g key={m.label}>
                <line
                  x1={x} y1={plotTop} x2={x} y2={plotBottom}
                  stroke="hsl(30, 8%, 22%)" strokeWidth={1} strokeDasharray="3,4"
                />
                <text
                  x={x} y={plotBottom + 14}
                  textAnchor="middle" fontSize={9}
                  fontFamily="'JetBrains Mono', monospace"
                  fill="hsl(30, 8%, 40%)"
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          {/* Dissonance overlap bars (behind note bars) */}
          {dissonanceBars.map((bar, i) => (
            <rect
              key={`diss-${i}`}
              x={bar.x}
              y={plotBottom - bar.height}
              width={bar.width}
              height={bar.height}
              fill="hsl(var(--interval-dissonant))"
              opacity={bar.opacity}
              rx={1}
            />
          ))}

          {/* Note silhouette fills (behind bars for depth) */}
          {noteEnvelopes.map(({ pc, path }) => path && (
            <path
              key={`sil-${pc}`}
              d={path}
              fill={`url(#note-grad-${pc})`}
              opacity={0.6}
            />
          ))}

          {/* Note partial bars with outlines */}
          {noteBars.map(({ pc, items }) => (
            <g key={`bars-${pc}`}>
              {items.map((bar, i) => {
                const isFundamental = bar.partial.partialNumber === 1;
                return (
                  <g key={`b-${pc}-${i}`}>
                    <rect
                      x={bar.x}
                      y={plotBottom - bar.height}
                      width={bar.width}
                      height={bar.height}
                      fill="none"
                      stroke={noteColorStroke(pc)}
                      strokeWidth={isFundamental ? 1.5 : 0.7}
                      rx={1}
                    />
                    {/* Fundamental: strong accent line at center */}
                    {isFundamental && (
                      <>
                        <line
                          x1={bar.cx} y1={plotBottom - bar.height}
                          x2={bar.cx} y2={plotBottom}
                          stroke={noteColor(pc, 0.8)} strokeWidth={2}
                        />
                        <circle cx={bar.cx} cy={plotTop - 6} r={7} fill={noteColor(pc)} opacity={0.9} />
                        <text
                          x={bar.cx} y={plotTop - 3}
                          textAnchor="middle" fontSize={7.5}
                          fontFamily="'JetBrains Mono', monospace"
                          fill="hsl(0, 0%, 7%)" fontWeight={700}
                        >
                          {getNoteName(pc, useFlats)}
                        </text>
                      </>
                    )}
                    {/* Overtone number */}
                    {!isFundamental && bar.partial.amplitude > 0.35 && (
                      <text
                        x={bar.cx}
                        y={plotBottom - bar.height - 3}
                        textAnchor="middle" fontSize={6}
                        fontFamily="'JetBrains Mono', monospace"
                        fill={noteColor(pc, 0.6)}
                      >
                        {bar.partial.partialNumber}×
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* Axis line */}
          <line x1={0} y1={plotBottom} x2={svgWidth} y2={plotBottom} stroke="hsl(30, 5%, 25%)" strokeWidth={1} />
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
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(var(--interval-dissonant))' }} />
          <span>Roughness</span>
        </div>
        <div className="flex items-center gap-1 ml-1">
          <span className="w-3 h-px border-t border-dashed" style={{ borderColor: 'hsl(30, 8%, 40%)' }} />
          <span>Octave (C)</span>
        </div>
      </div>
    </div>
  );
}
