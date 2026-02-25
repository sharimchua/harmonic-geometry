import React, { useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel, getIntervalTension } from '@/lib/musicTheory';

const FRET_WIDTH = 50;
const STRING_SPACING = 24;
const TOP_PAD = 20;
const LEFT_PAD = 30;
const DOT_R = 8;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

const TENSION_COLORS: Record<string, string> = {
  perfect: 'hsl(160, 50%, 42%)',
  consonant: 'hsl(190, 45%, 45%)',
  mild: 'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone: 'hsl(340, 60%, 50%)',
};

const TUNING_PRESETS: { name: string; tuning: number[]; stringNames: string[] }[] = [
  { name: 'Standard', tuning: [40, 45, 50, 55, 59, 64], stringNames: ['E', 'A', 'D', 'G', 'B', 'e'] },
  { name: 'Drop D', tuning: [38, 45, 50, 55, 59, 64], stringNames: ['D', 'A', 'D', 'G', 'B', 'e'] },
  { name: 'Open G', tuning: [38, 43, 50, 55, 59, 62], stringNames: ['D', 'G', 'D', 'G', 'B', 'D'] },
  { name: 'Open D', tuning: [38, 45, 50, 54, 57, 62], stringNames: ['D', 'A', 'D', 'F#', 'A', 'D'] },
  { name: 'DADGAD', tuning: [38, 45, 50, 55, 57, 62], stringNames: ['D', 'A', 'D', 'G', 'A', 'D'] },
  { name: 'Open E', tuning: [40, 47, 52, 56, 59, 64], stringNames: ['E', 'B', 'E', 'G#', 'B', 'E'] },
  { name: 'Half Step Down', tuning: [39, 44, 49, 54, 58, 63], stringNames: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
];

const NUM_FRETS = 15;
const MAX_SPAN = 4; // max fret span for a playable voicing

interface VoicingPosition {
  s: number; // string index
  f: number; // fret number
  pc: number; // pitch class
}

/**
 * Find playable voicings across the fretboard by scanning fret windows.
 * For each window, find the best assignment of chord tones to strings
 * (one note per string, max MAX_SPAN fret span, prioritizing all chord tones).
 */
function generateVoicings(
  chordPcs: number[],
  rootPc: number,
  tuning: number[],
  maxFret: number = NUM_FRETS
): VoicingPosition[][] {
  const numStrings = tuning.length;
  const voicings: VoicingPosition[][] = [];

  // Scan across fret positions — each voicing anchored by a root on bass strings
  const rootPositions: { s: number; f: number }[] = [];
  // Find all root positions on the lower 3 strings (bass foundation)
  for (let s = 0; s < Math.min(3, numStrings); s++) {
    for (let f = 0; f <= maxFret; f++) {
      if ((tuning[s] + f) % 12 === rootPc) {
        rootPositions.push({ s, f });
      }
    }
  }

  // For each root anchor, build the best voicing in that region
  const usedRegions = new Set<number>(); // avoid duplicate voicings in same region
  for (const anchor of rootPositions) {
    const regionKey = Math.floor(anchor.f / 3);
    if (usedRegions.has(regionKey)) continue;

    // Define the fret window around this anchor
    const minFret = Math.max(0, anchor.f - 1);
    const maxWindowFret = Math.min(maxFret, minFret + MAX_SPAN);

    // For each string, find available chord tones in this window
    const stringOptions: VoicingPosition[][] = [];
    for (let s = 0; s < numStrings; s++) {
      const opts: VoicingPosition[] = [];
      for (let f = (s <= anchor.s ? anchor.f : minFret); f <= maxWindowFret; f++) {
        const pc = (tuning[s] + f) % 12;
        if (chordPcs.includes(pc)) {
          opts.push({ s, f, pc });
        }
      }
      // Also check open string (fret 0) if within range
      if (minFret <= 2) {
        const openPc = tuning[s] % 12;
        if (chordPcs.includes(openPc) && !opts.some(o => o.f === 0)) {
          opts.unshift({ s, f: 0, pc: openPc });
        }
      }
      stringOptions.push(opts);
    }

    // Greedy: ensure bass note is the root, then fill upper strings with chord tones
    const voicing: VoicingPosition[] = [];
    const usedPcs = new Set<number>();

    // Place root on the anchor string
    voicing.push({ s: anchor.s, f: anchor.f, pc: rootPc });
    usedPcs.add(rootPc);

    // Fill remaining strings from anchor+1 upward
    for (let s = anchor.s + 1; s < numStrings; s++) {
      const opts = stringOptions[s];
      if (opts.length === 0) continue;

      // Prefer chord tones not yet used (to cover all chord tones)
      const unused = opts.filter(o => !usedPcs.has(o.pc));
      const pick = unused.length > 0 ? unused[0] : opts[0];

      // Check playability: fret span
      const frettedNotes = voicing.filter(v => v.f > 0);
      if (pick.f > 0 && frettedNotes.length > 0) {
        const currentMin = Math.min(...frettedNotes.map(v => v.f));
        const currentMax = Math.max(...frettedNotes.map(v => v.f));
        const newMin = Math.min(currentMin, pick.f);
        const newMax = Math.max(currentMax, pick.f);
        if (newMax - newMin > MAX_SPAN) continue; // skip - too wide
      }

      voicing.push(pick);
      usedPcs.add(pick.pc);
    }

    // Only keep voicings that cover at least 3 chord tones (or all if chord has ≤3)
    const coveredPcs = new Set(voicing.map(v => v.pc));
    const minCoverage = Math.min(3, chordPcs.length);
    if (coveredPcs.size >= minCoverage && voicing.length >= 3) {
      voicings.push(voicing.sort((a, b) => a.s - b.s));
      usedRegions.add(regionKey);
    }
  }

  // Deduplicate voicings that are identical
  const unique: VoicingPosition[][] = [];
  const seen = new Set<string>();
  for (const v of voicings) {
    const key = v.map(p => `${p.s}:${p.f}`).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(v);
    }
  }

  return unique;
}

export default function GuitarFretboard() {
  const {
    root, setRoot, activePitchClasses, scalePitchClasses,
    showArpeggio, labelMode, useFlats,
  } = useHarmony();

  const [tuningIdx, setTuningIdx] = React.useState(0);
  const currentTuning = TUNING_PRESETS[tuningIdx];
  const tuning = currentTuning.tuning;
  const stringNames = currentTuning.stringNames;
  const numStrings = tuning.length;
  const totalWidth = LEFT_PAD + (NUM_FRETS + 1) * FRET_WIDTH;
  const totalHeight = TOP_PAD + (numStrings - 1) * STRING_SPACING + 30;

  // Reverse display order: high strings at top, low strings at bottom
  const displayOrder = useMemo(() => {
    const order: number[] = [];
    for (let i = numStrings - 1; i >= 0; i--) order.push(i);
    return order;
  }, [numStrings]);

  // Generate voicings across the fretboard
  const voicings = useMemo(() => {
    return generateVoicings(activePitchClasses, root, tuning, NUM_FRETS);
  }, [root, tuning, activePitchClasses]);

  // Build tension lines for each voicing
  const voicingTensionLines = useMemo(() => {
    return voicings.map(voicing => {
      const lines: { x1: number; y1: number; x2: number; y2: number; tension: string }[] = [];
      for (let i = 0; i < voicing.length; i++) {
        for (let j = i + 1; j < voicing.length; j++) {
          const semitones = ((voicing[j].pc - voicing[i].pc) % 12 + 12) % 12;
          const tension = getIntervalTension(semitones);
          const displayRowI = displayOrder.indexOf(voicing[i].s);
          const displayRowJ = displayOrder.indexOf(voicing[j].s);
          lines.push({
            x1: LEFT_PAD + (voicing[i].f === 0 ? 0 : voicing[i].f * FRET_WIDTH - FRET_WIDTH / 2),
            y1: TOP_PAD + displayRowI * STRING_SPACING,
            x2: LEFT_PAD + (voicing[j].f === 0 ? 0 : voicing[j].f * FRET_WIDTH - FRET_WIDTH / 2),
            y2: TOP_PAD + displayRowJ * STRING_SPACING,
            tension,
          });
        }
      }
      return lines;
    });
  }, [voicings, displayOrder]);

  // Collect all voiced positions into a set for highlighting
  const voicedSet = useMemo(() => {
    const set = new Set<string>();
    voicings.forEach(v => {
      v.forEach(p => set.add(`${p.s}-${p.f}`));
    });
    return set;
  }, [voicings]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">Fretboard</h3>
        <select
          value={tuningIdx}
          onChange={e => setTuningIdx(Number(e.target.value))}
          className="bg-secondary text-secondary-foreground text-xs font-mono px-2 py-1 rounded border border-border cursor-pointer"
        >
          {TUNING_PRESETS.map((preset, i) => (
            <option key={preset.name} value={i}>{preset.name}</option>
          ))}
        </select>
        <span className="text-[10px] font-mono text-muted-foreground">
          {voicings.length} voicing{voicings.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="overflow-x-auto w-full">
        <svg width={totalWidth} height={totalHeight} className="mx-auto block">
          {/* Fret markers */}
          {FRET_MARKERS.map(f => f <= NUM_FRETS && (
            <text
              key={`marker-${f}`}
              x={LEFT_PAD + f * FRET_WIDTH - FRET_WIDTH / 2}
              y={TOP_PAD - 6}
              textAnchor="middle" fontSize={9}
              fontFamily="'JetBrains Mono', monospace"
              fill="hsl(30, 8%, 35%)"
            >
              {f}
            </text>
          ))}

          {/* Nut */}
          <line
            x1={LEFT_PAD} y1={TOP_PAD}
            x2={LEFT_PAD} y2={TOP_PAD + (numStrings - 1) * STRING_SPACING}
            stroke="hsl(30, 10%, 55%)" strokeWidth="3"
          />

          {/* Fret lines */}
          {Array.from({ length: NUM_FRETS }, (_, f) => (
            <line
              key={`fret-${f}`}
              x1={LEFT_PAD + (f + 1) * FRET_WIDTH}
              y1={TOP_PAD}
              x2={LEFT_PAD + (f + 1) * FRET_WIDTH}
              y2={TOP_PAD + (numStrings - 1) * STRING_SPACING}
              stroke="hsl(30, 5%, 22%)" strokeWidth="1"
            />
          ))}

          {/* Strings */}
          {displayOrder.map((dataIdx, row) => (
            <g key={`string-${dataIdx}`}>
              <text
                x={LEFT_PAD - 14}
                y={TOP_PAD + row * STRING_SPACING + 4}
                textAnchor="middle" fontSize={9}
                fontFamily="'JetBrains Mono', monospace"
                fill="hsl(30, 8%, 40%)"
              >
                {stringNames[dataIdx]}
              </text>
              <line
                x1={LEFT_PAD}
                y1={TOP_PAD + row * STRING_SPACING}
                x2={totalWidth - 10}
                y2={TOP_PAD + row * STRING_SPACING}
                stroke={`hsl(30, 6%, ${28 - dataIdx * 2}%)`}
                strokeWidth={1 + (numStrings - 1 - dataIdx) * 0.3}
              />
            </g>
          ))}

          {/* Fret marker dots */}
          {FRET_MARKERS.filter(f => f !== 12 && f <= NUM_FRETS).map(f => (
            <circle
              key={`dot-${f}`}
              cx={LEFT_PAD + f * FRET_WIDTH - FRET_WIDTH / 2}
              cy={TOP_PAD + ((numStrings - 1) * STRING_SPACING) / 2}
              r={3} fill="hsl(30, 5%, 20%)"
            />
          ))}
          {12 <= NUM_FRETS && [
            TOP_PAD + STRING_SPACING * 1.5,
            TOP_PAD + STRING_SPACING * 3.5,
          ].map((y, i) => (
            <circle
              key={`dot12-${i}`}
              cx={LEFT_PAD + 12 * FRET_WIDTH - FRET_WIDTH / 2}
              cy={y} r={3} fill="hsl(30, 5%, 20%)"
            />
          ))}

          {/* Tension overlay lines for each voicing */}
          {voicingTensionLines.map((lines, posIdx) =>
            lines.map((line, i) => {
              const color = TENSION_COLORS[line.tension] ?? TENSION_COLORS.mild;
              return (
                <line
                  key={`tension-${posIdx}-${i}`}
                  x1={line.x1} y1={line.y1}
                  x2={line.x2} y2={line.y2}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.3}
                  strokeDasharray={line.tension === 'dissonant' || line.tension === 'tritone' ? '4,3' : undefined}
                />
              );
            })
          )}

          {/* Voicing dots (highlighted) */}
          {voicings.map((voicing, posIdx) =>
            voicing.map((pos, i) => {
              const displayRow = displayOrder.indexOf(pos.s);
              const cx = LEFT_PAD + (pos.f === 0 ? 0 : pos.f * FRET_WIDTH - FRET_WIDTH / 2);
              const cy = TOP_PAD + displayRow * STRING_SPACING;
              const isRoot = pos.pc === root;
              const fill = isRoot ? 'hsl(32, 85%, 52%)' : 'hsl(28, 60%, 40%)';
              const stroke = isRoot ? 'hsl(32, 90%, 65%)' : 'hsl(28, 50%, 55%)';

              return (
                <g key={`v-${posIdx}-${i}`} onClick={() => setRoot(pos.pc)} className="cursor-pointer">
                  <circle cx={cx} cy={cy} r={DOT_R} fill={fill} stroke={stroke} strokeWidth={1} />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={8} fontWeight={600}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(0, 0%, 92%)"
                  >
                    {getLabel(pos.pc, root, labelMode, useFlats)}
                  </text>
                </g>
              );
            })
          )}

          {/* Ghost scale tones (not in chord, but in scale) */}
          {showArpeggio && displayOrder.map((dataIdx, row) =>
            Array.from({ length: NUM_FRETS + 1 }, (_, f) => {
              const key = `${dataIdx}-${f}`;
              if (voicedSet.has(key)) return null;
              const midi = tuning[dataIdx] + f;
              const pc = midi % 12;
              if (!scalePitchClasses.includes(pc) || activePitchClasses.includes(pc)) return null;
              const cx = LEFT_PAD + (f === 0 ? 0 : f * FRET_WIDTH - FRET_WIDTH / 2);
              const cy = TOP_PAD + row * STRING_SPACING;
              return (
                <circle
                  key={`ghost-${key}`}
                  cx={cx} cy={cy} r={3}
                  fill="hsl(30, 15%, 32%)" opacity={0.5}
                  onClick={() => setRoot(pc)} className="cursor-pointer"
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}
