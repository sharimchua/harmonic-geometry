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

/**
 * CAGED shape templates for a Major triad, defined as fret offsets relative to the chord root.
 * Each shape: [lowE, A, D, G, B, highE] — null means string is muted.
 * Fret values are relative to the root position of that shape.
 * 
 * For C shape at root C(0): bass starts on A string fret 3 (C note)
 * These are the canonical open-position shapes transposed.
 */
interface CAGEDShape {
  name: string;
  /** For root=0 (C), the absolute frets. null = muted. */
  baseFrets: (number | null)[];
  /** Which fret is the "anchor" (root position) for transposing */
  anchorString: number;
  anchorFret: number;
}

// Canonical CAGED shapes for C major (root = C = 0)
// These get transposed by adding (root semitones) to each fret
const CAGED_SHAPES: CAGEDShape[] = [
  // C shape: x-3-2-0-1-0 (bass on A string)
  { name: 'C', baseFrets: [null, 3, 2, 0, 1, 0], anchorString: 1, anchorFret: 3 },
  // A shape: x-0-2-2-2-0 → for C, shift by 3: x-3-5-5-5-3
  { name: 'A', baseFrets: [null, 3, 5, 5, 5, 3], anchorString: 1, anchorFret: 3 },
  // G shape: 3-2-0-0-0-3 → for C, shift by 5: 8-7-5-5-5-8
  { name: 'G', baseFrets: [8, 7, 5, 5, 5, 8], anchorString: 0, anchorFret: 8 },
  // E shape: 0-2-2-1-0-0 → for C, shift by 8: 8-10-10-9-8-8
  { name: 'E', baseFrets: [8, 10, 10, 9, 8, 8], anchorString: 0, anchorFret: 8 },
  // D shape: x-x-0-2-3-2 → for C, shift by 10: x-x-10-12-13-12
  { name: 'D', baseFrets: [null, null, 10, 12, 13, 12], anchorString: 2, anchorFret: 10 },
];

/**
 * Transpose a CAGED shape to a new root.
 * Returns absolute fret numbers for standard tuning.
 */
function transposeCagedShape(
  shape: CAGEDShape,
  rootPc: number,
  tuning: number[],
  chordPcs: number[]
): { frets: (number | null)[]; positions: { s: number; f: number; pc: number }[] } {
  // The base shapes are defined for root C (pc=0).
  // To transpose to a new root, shift all frets by rootPc semitones.
  const shift = rootPc; // semitones from C
  const frets: (number | null)[] = shape.baseFrets.map((f, s) => {
    if (f === null) return null;
    const transposed = f + shift;
    // Wrap if beyond fretboard — but keep within 0..NUM_FRETS
    if (transposed > NUM_FRETS) return null;
    return transposed;
  });

  // Validate: each fretted note must be a chord tone
  const positions: { s: number; f: number; pc: number }[] = [];
  for (let s = 0; s < frets.length; s++) {
    const f = frets[s];
    if (f === null) continue;
    const midi = tuning[s] + f;
    const pc = midi % 12;
    if (chordPcs.includes(pc)) {
      positions.push({ s, f, pc });
    } else {
      // Try to adjust ±1 fret to find a chord tone (for non-major chords)
      let found = false;
      for (const adj of [-1, 1, -2, 2]) {
        const adjF = f + adj;
        if (adjF < 0 || adjF > NUM_FRETS) continue;
        const adjPc = (tuning[s] + adjF) % 12;
        if (chordPcs.includes(adjPc)) {
          frets[s] = adjF;
          positions.push({ s, f: adjF, pc: adjPc });
          found = true;
          break;
        }
      }
      if (!found) {
        frets[s] = null; // mute this string
      }
    }
  }

  return { frets, positions };
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

  // Build CAGED voicings for all 5 positions
  const cagedVoicings = useMemo(() => {
    return CAGED_SHAPES.map(shape => {
      const result = transposeCagedShape(shape, root, tuning, activePitchClasses);
      return {
        name: shape.name,
        ...result,
      };
    });
  }, [root, tuning, activePitchClasses]);

  // Build tension lines for each CAGED position
  const cagedTensionLines = useMemo(() => {
    return cagedVoicings.map(voicing => {
      const lines: { x1: number; y1: number; x2: number; y2: number; tension: string }[] = [];
      const pos = voicing.positions;
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const semitones = ((pos[j].pc - pos[i].pc) % 12 + 12) % 12;
          const tension = getIntervalTension(semitones);
          const displayRowI = displayOrder.indexOf(pos[i].s);
          const displayRowJ = displayOrder.indexOf(pos[j].s);
          const f1 = pos[i].f;
          const f2 = pos[j].f;
          lines.push({
            x1: LEFT_PAD + (f1 === 0 ? 0 : f1 * FRET_WIDTH - FRET_WIDTH / 2),
            y1: TOP_PAD + displayRowI * STRING_SPACING,
            x2: LEFT_PAD + (f2 === 0 ? 0 : f2 * FRET_WIDTH - FRET_WIDTH / 2),
            y2: TOP_PAD + displayRowJ * STRING_SPACING,
            tension,
          });
        }
      }
      return lines;
    });
  }, [cagedVoicings, displayOrder]);

  // Collect all CAGED fretted positions into a set for highlighting
  const cagedFrettedSet = useMemo(() => {
    const set = new Set<string>();
    cagedVoicings.forEach(v => {
      v.positions.forEach(p => set.add(`${p.s}-${p.f}`));
    });
    return set;
  }, [cagedVoicings]);

  // CAGED shape colors for distinguishing positions
  const CAGED_COLORS = [
    'hsl(32, 85%, 58%)',  // C - warm orange
    'hsl(190, 55%, 45%)', // A - teal
    'hsl(140, 45%, 42%)', // G - green
    'hsl(280, 40%, 55%)', // E - purple
    'hsl(350, 55%, 52%)', // D - rose
  ];

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
      </div>

      {/* CAGED position legend */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {cagedVoicings.map((v, i) => (
          <div key={v.name} className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: CAGED_COLORS[i] }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">{v.name}</span>
          </div>
        ))}
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

          {/* Tension overlay lines for each CAGED position */}
          {cagedTensionLines.map((lines, posIdx) =>
            lines.map((line, i) => {
              const color = TENSION_COLORS[line.tension] ?? TENSION_COLORS.mild;
              return (
                <line
                  key={`tension-${posIdx}-${i}`}
                  x1={line.x1} y1={line.y1}
                  x2={line.x2} y2={line.y2}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.35}
                  strokeDasharray={line.tension === 'dissonant' || line.tension === 'tritone' ? '4,3' : undefined}
                />
              );
            })
          )}

          {/* CAGED voicing dots (highlighted) */}
          {cagedVoicings.map((voicing, posIdx) =>
            voicing.positions.map((pos, i) => {
              const displayRow = displayOrder.indexOf(pos.s);
              const cx = LEFT_PAD + (pos.f === 0 ? 0 : pos.f * FRET_WIDTH - FRET_WIDTH / 2);
              const cy = TOP_PAD + displayRow * STRING_SPACING;
              const isRoot = pos.pc === root;
              const fill = isRoot ? 'hsl(32, 85%, 52%)' : CAGED_COLORS[posIdx];
              const textFill = isRoot ? 'hsl(32, 95%, 95%)' : 'hsl(0, 0%, 95%)';

              return (
                <g key={`caged-${posIdx}-${i}`} onClick={() => setRoot(pos.pc)} className="cursor-pointer">
                  <circle cx={cx} cy={cy} r={DOT_R} fill={fill} stroke="hsl(0,0%,10%)" strokeWidth={0.5} />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={8} fontWeight={600}
                    fontFamily="'JetBrains Mono', monospace"
                    fill={textFill}
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
              if (cagedFrettedSet.has(key)) return null;
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
