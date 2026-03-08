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
  perfect: 'hsl(220, 55%, 58%)',
  consonant: 'hsl(150, 55%, 42%)',
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
const MAX_SPAN = 4;

interface VoicingPosition {
  s: number;
  f: number;
  pc: number;
}

function buildVoicing(
  chordPcs: number[],
  bassString: number,
  bassFret: number,
  bassPc: number,
  tuning: number[],
  windowMin: number,
  windowMax: number,
): VoicingPosition[] | null {
  const numStrings = tuning.length;
  const voicing: VoicingPosition[] = [];
  const usedPcs = new Set<number>();

  voicing.push({ s: bassString, f: bassFret, pc: bassPc });
  usedPcs.add(bassPc);

  for (let s = bassString + 1; s < numStrings; s++) {
    const opts: VoicingPosition[] = [];
    const openPc = tuning[s] % 12;
    if (chordPcs.includes(openPc) && windowMin <= 3) {
      opts.push({ s, f: 0, pc: openPc });
    }
    for (let f = Math.max(1, windowMin); f <= windowMax; f++) {
      const pc = (tuning[s] + f) % 12;
      if (chordPcs.includes(pc)) {
        opts.push({ s, f, pc });
      }
    }
    if (opts.length === 0) continue;

    const unused = opts.filter(o => !usedPcs.has(o.pc));
    const pick = unused.length > 0 ? unused[0] : opts[0];

    const fretted = [...voicing, pick].filter(v => v.f > 0);
    if (fretted.length > 1) {
      const min = Math.min(...fretted.map(v => v.f));
      const max = Math.max(...fretted.map(v => v.f));
      if (max - min > MAX_SPAN) continue;
    }

    voicing.push(pick);
    usedPcs.add(pick.pc);
  }

  const covered = new Set(voicing.map(v => v.pc));
  const minCoverage = Math.min(3, chordPcs.length);
  if (covered.size >= minCoverage && voicing.length >= 3) {
    return voicing.sort((a, b) => a.s - b.s);
  }
  return null;
}

function generateVoicings(
  chordPcs: number[],
  bassPc: number,
  tuning: number[],
  maxFret: number = NUM_FRETS
): VoicingPosition[][] {
  const numStrings = tuning.length;
  const seen = new Set<string>();
  const voicings: VoicingPosition[][] = [];

  const bassPositions: { s: number; f: number }[] = [];
  for (let s = 0; s < Math.min(3, numStrings); s++) {
    for (let f = 0; f <= maxFret; f++) {
      if ((tuning[s] + f) % 12 === bassPc) {
        bassPositions.push({ s, f });
      }
    }
  }

  for (const anchor of bassPositions) {
    const windows: [number, number][] = [
      [anchor.f, Math.min(maxFret, anchor.f + MAX_SPAN)],
      [Math.max(0, anchor.f - 2), Math.min(maxFret, anchor.f + 2)],
      [Math.max(0, anchor.f - MAX_SPAN), anchor.f],
    ];

    for (const [wMin, wMax] of windows) {
      if (wMax - wMin > MAX_SPAN + 1) continue;
      const voicing = buildVoicing(chordPcs, anchor.s, anchor.f, bassPc, tuning, wMin, wMax);
      if (!voicing) continue;

      const key = voicing.map(p => `${p.s}:${p.f}`).join(',');
      if (!seen.has(key)) {
        seen.add(key);
        voicings.push(voicing);
      }
    }
  }

  return voicings;
}

export default function GuitarFretboard() {
  const {
    root, setRoot, activePitchClasses, scalePitchClasses,
    labelMode, useFlats,
    activeIntervals, inversion,
  } = useHarmony();
  const [voicingIdx, setVoicingIdx] = React.useState(0);

  const bassPc = useMemo(() => {
    if (inversion === 0) return root;
    const intervals = [...activeIntervals];
    const bassInterval = intervals[0];
    return ((root + bassInterval) % 12 + 12) % 12;
  }, [root, inversion, activeIntervals]);

  const [tuningIdx, setTuningIdx] = React.useState(0);
  const currentTuning = TUNING_PRESETS[tuningIdx];
  const tuning = currentTuning.tuning;
  const stringNames = currentTuning.stringNames;
  const numStrings = tuning.length;
  const totalWidth = LEFT_PAD + (NUM_FRETS + 1) * FRET_WIDTH;
  const totalHeight = TOP_PAD + (numStrings - 1) * STRING_SPACING + 30;

  const displayOrder = useMemo(() => {
    const order: number[] = [];
    for (let i = numStrings - 1; i >= 0; i--) order.push(i);
    return order;
  }, [numStrings]);

  const allVoicings = useMemo(() => {
    return generateVoicings(activePitchClasses, bassPc, tuning, NUM_FRETS);
  }, [bassPc, tuning, activePitchClasses]);

  // Reset voicing index when chord changes
  React.useEffect(() => {
    setVoicingIdx(0);
  }, [activePitchClasses, bassPc, tuning]);

  // Show only the selected voicing (or none if empty)
  const voicings = allVoicings.length > 0 ? [allVoicings[Math.min(voicingIdx, allVoicings.length - 1)]] : [];

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
        <div className="flex items-center gap-2">
          {allVoicings.length > 1 && (
            <button
              onClick={() => setVoicingIdx(i => (i - 1 + allVoicings.length) % allVoicings.length)}
              className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-2 py-1 transition-colors"
            >
              ◀
            </button>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            {allVoicings.length > 0
              ? `${Math.min(voicingIdx, allVoicings.length - 1) + 1} / ${allVoicings.length}`
              : '0 voicings'}
          </span>
          {allVoicings.length > 1 && (
            <button
              onClick={() => setVoicingIdx(i => (i + 1) % allVoicings.length)}
              className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-2 py-1 transition-colors"
            >
              ▶
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <svg width={totalWidth} height={totalHeight} className="mx-auto block">
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

          <line
            x1={LEFT_PAD} y1={TOP_PAD}
            x2={LEFT_PAD} y2={TOP_PAD + (numStrings - 1) * STRING_SPACING}
            stroke="hsl(30, 10%, 55%)" strokeWidth="3"
          />

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

        </svg>
      </div>
    </div>
  );
}
