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

  // Resolution for the smooth curves
  const numSamples = 500;
  const sampleXStep = svgWidth / numSamples;

  // Build smooth envelope paths per note
  const noteEnvelopes = useMemo(() => {
    const envelopes: { pc: number; path: string; peaks: { x: number; y: number; partial: Partial }[] }[] = [];

    for (const [pc, notePartials] of partialsByNote.entries()) {
      const peaks: { x: number; y: number; partial: Partial }[] = [];
      const yValues: number[] = [];

      for (let i = 0; i <= numSamples; i++) {
        const x = i * sampleXStep;
        let totalY = 0;

        for (const p of notePartials) {
          const cx = freqToX(p.frequency, svgWidth);
          // Sigma based on critical bandwidth — low freqs get wide bands, high freqs narrow
          const cbHz = criticalBandwidth(p.frequency);
          const freqLo = Math.max(minFreq, p.frequency - cbHz / 2);
          const freqHi = p.frequency + cbHz / 2;
          const sigma = Math.max(4, (freqToX(freqHi, svgWidth) - freqToX(freqLo, svgWidth)) * 0.45);
          const amp = p.amplitude * plotHeight * 0.85;
          totalY += gaussianPeak(cx, amp, sigma, x);
        }

        yValues.push(totalY);
      }

      // Build SVG area path
      let path = `M 0 ${plotBottom}`;
      for (let i = 0; i <= numSamples; i++) {
        const x = i * sampleXStep;
        const y = plotBottom - yValues[i];
        path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      path += ` L ${svgWidth} ${plotBottom} Z`;

      // Collect peak positions for labels
      for (const p of notePartials) {
        const cx = freqToX(p.frequency, svgWidth);
        const amp = p.amplitude * plotHeight * 0.85;
        peaks.push({ x: cx, y: plotBottom - amp, partial: p });
      }

      envelopes.push({ pc, path, peaks });
    }

    return envelopes;
  }, [partialsByNote, svgWidth, plotBottom, plotHeight]);

  // Build dissonance overlap envelope
  const dissonanceEnvelope = useMemo(() => {
    if (interactions.length === 0) return '';

    const highDissonance = interactions.filter(i => i.dissonance > 0.3).sort((a, b) => b.dissonance - a.dissonance).slice(0, 50);
    if (highDissonance.length === 0) return '';

    const yValues: number[] = [];
    for (let i = 0; i <= numSamples; i++) {
      const x = i * sampleXStep;
      let totalY = 0;

      for (const pair of highDissonance) {
        const f1 = pair.partial1.frequency;
        const f2 = pair.partial2.frequency;
        const midFreq = (f1 + f2) / 2;
        const cx = freqToX(midFreq, svgWidth);
        const spread = Math.abs(freqToX(f2, svgWidth) - freqToX(f1, svgWidth));
        const sigma = Math.max(4, spread * 1.2);
        const amp = Math.min(pair.dissonance * 2.5, plotHeight * 0.5);
        totalY += gaussianPeak(cx, amp, sigma, x);
      }

      yValues.push(Math.min(totalY, plotHeight * 0.7));
    }

    let path = `M 0 ${plotBottom}`;
    for (let i = 0; i <= numSamples; i++) {
      const x = i * sampleXStep;
      const y = plotBottom - yValues[i];
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    path += ` L ${svgWidth} ${plotBottom} Z`;
    return path;
  }, [interactions, svgWidth, plotBottom, plotHeight]);

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

          {/* Dissonance overlap envelope (behind note curves) */}
          {dissonanceEnvelope && (
            <path
              d={dissonanceEnvelope}
              fill="url(#dissonance-fill)"
              stroke="hsl(var(--interval-dissonant))"
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
          )}

          {/* Note envelope curves */}
          {noteEnvelopes.map(({ pc, path, peaks }) => (
            <g key={`env-${pc}`}>
              {/* Filled area */}
              <path
                d={path}
                fill={`url(#note-grad-${pc})`}
                stroke={noteColorStroke(pc)}
                strokeWidth={1.5}
              />
              {/* Fundamental marker */}
              {peaks.filter(p => p.partial.partialNumber === 1).map((p, i) => {
                const x = p.x;
                return (
                  <g key={`fund-${pc}-${i}`}>
                    {/* Vertical stem line */}
                    <line
                      x1={x} y1={p.y} x2={x} y2={plotBottom}
                      stroke={noteColor(pc, 0.6)} strokeWidth={1.5}
                    />
                    {/* Note label */}
                    <circle cx={x} cy={plotTop - 6} r={7} fill={noteColor(pc)} opacity={0.9} />
                    <text
                      x={x} y={plotTop - 3}
                      textAnchor="middle" fontSize={7.5}
                      fontFamily="'JetBrains Mono', monospace"
                      fill="hsl(0, 0%, 7%)" fontWeight={700}
                    >
                      {getNoteName(pc, useFlats)}
                    </text>
                  </g>
                );
              })}
              {/* Overtone markers — thin vertical ticks */}
              {peaks.filter(p => p.partial.partialNumber > 1).map((p, i) => (
                <g key={`ot-${pc}-${i}`}>
                  <line
                    x1={p.x} y1={p.y} x2={p.x} y2={plotBottom}
                    stroke={noteColor(pc, 0.25)} strokeWidth={0.8}
                    strokeDasharray="2,3"
                  />
                  {p.partial.amplitude > 0.35 && (
                    <text
                      x={p.x} y={p.y - 3}
                      textAnchor="middle" fontSize={6}
                      fontFamily="'JetBrains Mono', monospace"
                      fill={noteColor(pc, 0.6)}
                    >
                      {p.partial.partialNumber}×
                    </text>
                  )}
                </g>
              ))}
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
