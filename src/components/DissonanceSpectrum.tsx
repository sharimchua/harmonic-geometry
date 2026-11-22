import React, { useMemo, useState } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getChordPartialsFromVoicing,
  calculatePartialInteractions,
  calculateChordDissonance,
  calculateChordCoincidence,
  PRIME_FAMILY_COLORS,
  SOLFEGE_COLORS,
  SOLFEGE_NEON_COLORS,
  getLabel,
  getNoteName,
  type Partial,
  type PrimeLimitFamily,
} from '@/lib/musicTheory';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Returns the canonical PPT Solfège colour for a pitch class relative to the active tonic.
 * Uses vibrant neon sky-blue (#38BDF8) for Fi (semitone 6) on dark spectrum backgrounds so bars and markers remain clearly legible.
 */
function pptNoteColor(pc: number, scaleTonic: number, alpha = 0.85): string {
  const relSemitone = ((pc - scaleTonic) % 12 + 12) % 12;
  const baseHex = relSemitone === 6 ? SOLFEGE_NEON_COLORS[6] : SOLFEGE_COLORS[relSemitone];
  return hexToRgba(baseHex, alpha);
}

const OCTAVE_OPTIONS = [1, 2, 3, 4, 5, 6];

function criticalBandwidth(freq: number): number {
  return 25 + 75 * Math.pow(1 + 1.4 * (freq / 1000) * (freq / 1000), 0.69);
}

const SUB_BAR_W = 2;
const BAR_GAP = 1;

const DissonanceSpectrum = React.memo(function DissonanceSpectrum() {
  const { activePitchClasses, activeIntervals, root, harmonicRoot, scaleTonic, labelMode, useFlats } = useHarmony();
  const [baseOctave, setBaseOctave] = useState(4);

  const { partials, noteFrequencies } = useMemo(
    () => getChordPartialsFromVoicing(harmonicRoot, activeIntervals, baseOctave),
    [harmonicRoot, activeIntervals, baseOctave]
  );

  const interactions = useMemo(
    () => calculatePartialInteractions(noteFrequencies),
    [noteFrequencies]
  );

  const totalDissonance = useMemo(
    () => calculateChordDissonance(noteFrequencies.map(n => n.freq)),
    [noteFrequencies]
  );

  const coincidence = useMemo(
    () => calculateChordCoincidence(activeIntervals),
    [activeIntervals]
  );

  const primeFamilyKey: PrimeLimitFamily =
    coincidence.primeLimit === 2 ? '2-Du' :
    coincidence.primeLimit === 3 ? '3-Tri' :
    coincidence.primeLimit === 5 ? '5-Qui' :
    coincidence.primeLimit === 7 ? '7-Sep' : '11-Undec';
  const primeColor = PRIME_FAMILY_COLORS[primeFamilyKey];

  const minFreq = 28;
  const maxFreq = 5500;
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  const freqToX = (f: number, width: number) =>
    ((Math.log2(f) - logMin) / (logMax - logMin)) * width;

  const svgWidth = 900;
  const svgHeight = 220;
  const plotTop = 24;
  const plotBottom = 185;
  const plotHeight = plotBottom - plotTop;

  const octaveMarkers = useMemo(() => {
    const markers: { freq: number; label: string }[] = [];
    for (let oct = 1; oct <= 8; oct++) {
      const freq = 440 * Math.pow(2, (oct - 4) + (0 - 9) / 12);
      if (freq >= minFreq && freq <= maxFreq) {
        markers.push({ freq, label: `C${oct}` });
      }
    }
    return markers;
  }, []);

  const partialsByNote = useMemo(() => {
    const map = new Map<number, Partial[]>();
    for (const p of partials) {
      const arr = map.get(p.fundamentalPc) || [];
      arr.push(p);
      map.set(p.fundamentalPc, arr);
    }
    return map;
  }, [partials]);

  const noteBars = useMemo(() => {
    const allBars: { pc: number; items: { cx: number; height: number; partial: Partial; subBars: { x: number; h: number }[] }[] }[] = [];
    for (const [pc, notePartials] of partialsByNote.entries()) {
      const sorted = [...notePartials].sort((a, b) => a.frequency - b.frequency);
      const items = sorted.map(p => {
        const cx = freqToX(p.frequency, svgWidth);
        const cbHz = criticalBandwidth(p.frequency);
        const xLo = freqToX(Math.max(minFreq, p.frequency - cbHz / 2), svgWidth);
        const xHi = freqToX(p.frequency + cbHz / 2, svgWidth);
        const totalW = Math.max(6, xHi - xLo);
        const peakHeight = p.amplitude * plotHeight * 0.85;
        const numBars = Math.max(3, Math.floor(totalW / (SUB_BAR_W + BAR_GAP)));
        const mid = (numBars - 1) / 2;
        const subBars: { x: number; h: number }[] = [];
        const actualTotalW = numBars * (SUB_BAR_W + BAR_GAP) - BAR_GAP;
        for (let j = 0; j < numBars; j++) {
          const dist = mid > 0 ? Math.abs(j - mid) / mid : 0;
          const h = peakHeight * Math.exp(-2.5 * dist * dist);
          const bx = cx - actualTotalW / 2 + j * (SUB_BAR_W + BAR_GAP);
          if (h > 1) subBars.push({ x: bx, h });
        }
        return { cx, height: peakHeight, partial: p, subBars };
      });
      allBars.push({ pc, items });
    }
    return allBars;
  }, [partialsByNote, svgWidth, plotHeight]);

  const dissonancePath = useMemo(() => {
    if (interactions.length === 0) return { line: '', fill: '', peak: 0 };
    const numBins = svgWidth;
    const bins = new Float32Array(numBins);
    for (const pair of interactions) {
      if (pair.dissonance < 0.05) continue;
      const f1 = Math.min(pair.partial1.frequency, pair.partial2.frequency);
      const f2 = Math.max(pair.partial1.frequency, pair.partial2.frequency);
      const fMid = (f1 + f2) / 2;
      const xMid = freqToX(fMid, svgWidth);
      const xSpread = Math.max(4, Math.abs(freqToX(f2, svgWidth) - freqToX(f1, svgWidth)) * 0.6);
      const sigma = Math.max(3, xSpread);
      for (let bx = Math.max(0, Math.floor(xMid - sigma * 3)); bx < Math.min(numBins, Math.ceil(xMid + sigma * 3)); bx++) {
        const dx = bx - xMid;
        bins[bx] += pair.dissonance * Math.exp(-(dx * dx) / (2 * sigma * sigma));
      }
    }
    let peak = 0;
    for (let i = 0; i < numBins; i++) { if (bins[i] > peak) peak = bins[i]; }
    if (peak === 0) return { line: '', fill: '', peak: 0 };
    const maxH = plotHeight * 0.7;
    const points: string[] = [];
    for (let x = 0; x < numBins; x++) {
      const h = (bins[x] / peak) * maxH;
      const y = plotBottom - h;
      points.push(`${x},${y.toFixed(1)}`);
    }
    const line = `M${points.join(' L')}`;
    const fill = `${line} L${numBins - 1},${plotBottom} L0,${plotBottom} Z`;
    return { line, fill, peak };
  }, [interactions, svgWidth, plotHeight, plotBottom]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">
          Fundamentals and Overtones
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-border text-foreground"
            title="Just Intonation integer ratio approximation for this voicing"
          >
            JI Ratio: <strong className="text-primary">{coincidence.integerRatioString}</strong>
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-border text-muted-foreground"
            title="Prime Period Theory Coincidence Super-Cycle: number of root periods required for all chord tones to simultaneously realign at 12 o'clock Do"
          >
            Cycle: <strong className="text-foreground">{coincidence.rootTurnsToAlign}×</strong>
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
            style={{ backgroundColor: `${primeColor}22`, color: primeColor, border: `1px solid ${primeColor}55` }}
            title={`Prime Limit Family (${coincidence.primeLimit}-limit) • Tenney Height: ${coincidence.tenneyHeight}`}
          >
            {coincidence.primeLimit}-Limit ({primeFamilyKey})
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Total Crunch:</span>
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
      <div className="overflow-x-auto w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ minWidth: 500 }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Dissonance spectrum showing fundamentals, overtones, and roughness curve"
        >
          <defs>
            <linearGradient id="dissonance-curve-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0.02" />
            </linearGradient>
            {activePitchClasses.map(pc => {
              return (
                <linearGradient key={`grad-${pc}`} id={`note-grad-${pc}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={pptNoteColor(pc, scaleTonic, 0.5)} />
                  <stop offset="100%" stopColor={pptNoteColor(pc, scaleTonic, 0.03)} />
                </linearGradient>
              );
            })}
          </defs>

          {octaveMarkers.map(m => {
            const x = freqToX(m.freq, svgWidth);
            const oct = parseInt(m.label.replace('C', ''));
            const isSelectable = OCTAVE_OPTIONS.includes(oct);
            const isSelected = baseOctave === oct;
            return (
              <g key={m.label}>
                <line x1={x} y1={plotTop} x2={x} y2={plotBottom} stroke="hsl(30, 8%, 22%)" strokeWidth={1} strokeDasharray="3,4" />
                {isSelectable ? (
                  <g className="cursor-pointer" onClick={() => setBaseOctave(oct)}>
                    <rect
                      x={x - 14} y={plotBottom + 3} width={28} height={16} rx={4}
                      fill={isSelected ? 'hsl(var(--primary))' : 'transparent'}
                      stroke={isSelected ? 'none' : 'hsl(30, 8%, 30%)'} strokeWidth={0.5}
                      className="transition-colors"
                    />
                    <text
                      x={x} y={plotBottom + 14.5} textAnchor="middle" fontSize={9}
                      fontFamily="'JetBrains Mono', monospace"
                      fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(30, 8%, 50%)'}
                      fontWeight={isSelected ? 700 : 400} className="transition-colors select-none"
                    >{m.label}</text>
                  </g>
                ) : (
                  <text x={x} y={plotBottom + 14} textAnchor="middle" fontSize={9}
                    fontFamily="'JetBrains Mono', monospace" fill="hsl(30, 8%, 40%)"
                  >{m.label}</text>
                )}
              </g>
            );
          })}

          {noteBars.map(({ pc, items }) => {
            const relSemitone = ((pc - scaleTonic) % 12 + 12) % 12;
            const isLightBadge = relSemitone === 3 || relSemitone === 4 || relSemitone === 6;
            const badgeTextFill = isLightBadge ? 'hsl(0, 0%, 7%)' : '#ffffff';
            const label = getLabel(pc, root, labelMode, useFlats, scaleTonic);
            return (
              <g key={`bars-${pc}`}>
                {items.map((bar, i) => {
                  const isFundamental = bar.partial.partialNumber === 1;
                  return (
                    <g key={`b-${pc}-${i}`}>
                      {bar.subBars.map((sb, si) => (
                        <rect key={si} x={sb.x} y={plotBottom - sb.h} width={SUB_BAR_W} height={sb.h}
                          fill={pptNoteColor(pc, scaleTonic, isFundamental ? 0.8 : 0.45)} rx={0.5}
                        />
                      ))}
                      {isFundamental && (
                        <>
                          <circle cx={bar.cx} cy={plotTop - 6} r={7.5} fill={pptNoteColor(pc, scaleTonic, 0.95)} />
                          <text x={bar.cx} y={plotTop - 3} textAnchor="middle" fontSize={7.5}
                            fontFamily="'JetBrains Mono', monospace" fill={badgeTextFill} fontWeight={700}
                          >{label}</text>
                        </>
                      )}
                      {!isFundamental && bar.partial.amplitude > 0.35 && (
                        <text x={bar.cx} y={plotBottom - bar.height - 3} textAnchor="middle" fontSize={6}
                          fontFamily="'JetBrains Mono', monospace" fill={pptNoteColor(pc, scaleTonic, 0.75)}
                        >{bar.partial.partialNumber}×</text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {dissonancePath.fill && (
            <>
              <path d={dissonancePath.fill} fill="url(#dissonance-curve-fill)" />
              <path d={dissonancePath.line} fill="none" stroke="hsla(0, 0%, 95%, 0.7)" strokeWidth={1.2} />
            </>
          )}

          <line x1={0} y1={plotBottom} x2={svgWidth} y2={plotBottom} stroke="hsl(30, 5%, 25%)" strokeWidth={1} />
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono text-muted-foreground">
        {activePitchClasses.map(pc => (
          <div key={pc} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: pptNoteColor(pc, scaleTonic, 0.95) }} />
            <span>{getLabel(pc, root, labelMode, useFlats, scaleTonic)} ({getNoteName(pc, useFlats)})</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <span className="w-4 h-px" style={{ background: 'hsla(0, 0%, 95%, 0.7)' }} />
          <span>Crunch</span>
        </div>
        <div className="flex items-center gap-1 ml-1">
          <span className="w-3 h-px border-t border-dashed" style={{ borderColor: 'hsl(30, 8%, 40%)' }} />
          <span>Octave (C)</span>
        </div>
      </div>
    </div>
  );
});

export default DissonanceSpectrum;
