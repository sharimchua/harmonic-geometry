import React, { useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel, getIntervalTension } from '@/lib/musicTheory';

const FRET_WIDTH = 50;
const STRING_SPACING = 24;
const TOP_PAD = 20;
const LEFT_PAD = 30;
const DOT_R = 8;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

// Tension color mapping
const TENSION_COLORS: Record<string, string> = {
  perfect: 'hsl(160, 50%, 42%)',
  consonant: 'hsl(190, 45%, 45%)',
  mild: 'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone: 'hsl(340, 60%, 50%)',
};

// Common guitar tuning presets
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

  // Collect active note positions for tension overlay
  const activePositions = useMemo(() => {
    const positions: { s: number; f: number; pc: number; cx: number; cy: number }[] = [];
    tuning.forEach((openMidi, s) => {
      // Pick the first active note per string (for primary voicing)
      for (let f = 0; f <= NUM_FRETS; f++) {
        const midi = openMidi + f;
        const pc = midi % 12;
        if (activePitchClasses.includes(pc)) {
          const cx = LEFT_PAD + (f === 0 ? 0 : f * FRET_WIDTH - FRET_WIDTH / 2);
          const cy = TOP_PAD + s * STRING_SPACING;
          positions.push({ s, f, pc, cx, cy });
          break; // one per string for the primary voicing
        }
      }
    });
    return positions;
  }, [tuning, activePitchClasses]);

  // Build tension lines between adjacent active string positions
  const tensionLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; tension: string; semitones: number }[] = [];
    for (let i = 0; i < activePositions.length - 1; i++) {
      for (let j = i + 1; j < activePositions.length; j++) {
        // Only connect adjacent strings for readability
        if (Math.abs(activePositions[j].s - activePositions[i].s) > 2) continue;
        const semitones = ((activePositions[j].pc - activePositions[i].pc) % 12 + 12) % 12;
        const tension = getIntervalTension(semitones);
        lines.push({
          x1: activePositions[i].cx, y1: activePositions[i].cy,
          x2: activePositions[j].cx, y2: activePositions[j].cy,
          tension, semitones,
        });
      }
    }
    return lines;
  }, [activePositions]);

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
          {Array.from({ length: numStrings }, (_, s) => (
            <g key={`string-${s}`}>
              <text
                x={LEFT_PAD - 14}
                y={TOP_PAD + s * STRING_SPACING + 4}
                textAnchor="middle" fontSize={9}
                fontFamily="'JetBrains Mono', monospace"
                fill="hsl(30, 8%, 40%)"
              >
                {stringNames[s]}
              </text>
              <line
                x1={LEFT_PAD}
                y1={TOP_PAD + s * STRING_SPACING}
                x2={totalWidth - 10}
                y2={TOP_PAD + s * STRING_SPACING}
                stroke={`hsl(30, 6%, ${28 - s * 2}%)`}
                strokeWidth={1 + (numStrings - 1 - s) * 0.3}
              />
            </g>
          ))}

          {/* Dots on fret markers */}
          {FRET_MARKERS.filter(f => f !== 12 && f <= NUM_FRETS).map(f => (
            <circle
              key={`dot-${f}`}
              cx={LEFT_PAD + f * FRET_WIDTH - FRET_WIDTH / 2}
              cy={TOP_PAD + ((numStrings - 1) * STRING_SPACING) / 2}
              r={3} fill="hsl(30, 5%, 20%)"
            />
          ))}
          {/* Double dot at 12 */}
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

          {/* Tension overlay lines between active positions */}
          {tensionLines.map((line, i) => {
            const color = TENSION_COLORS[line.tension] ?? TENSION_COLORS.mild;
            return (
              <line
                key={`tension-${i}`}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke={color}
                strokeWidth={1.5}
                opacity={0.5}
                strokeDasharray={line.tension === 'dissonant' || line.tension === 'tritone' ? '4,3' : undefined}
              />
            );
          })}

          {/* Notes on fretboard */}
          {tuning.map((openMidi, s) =>
            Array.from({ length: NUM_FRETS + 1 }, (_, f) => {
              const midi = openMidi + f;
              const pc = midi % 12;
              const isActive = activePitchClasses.includes(pc);
              const isRoot = pc === root;
              const isInScale = scalePitchClasses.includes(pc);

              if (!showArpeggio && !isActive) {
                if (!isInScale) return null;
                return (
                  <circle
                    key={`${s}-${f}`}
                    cx={LEFT_PAD + (f === 0 ? 0 : f * FRET_WIDTH - FRET_WIDTH / 2)}
                    cy={TOP_PAD + s * STRING_SPACING}
                    r={3}
                    fill="hsl(30, 15%, 32%)"
                    opacity={0.5}
                    onClick={() => setRoot(pc)}
                    className="cursor-pointer"
                  />
                );
              }

              if (showArpeggio && !isActive && !isInScale) return null;
              if (!showArpeggio && !isActive) return null;

              let fill = 'hsl(28, 65%, 42%)';
              let textFill = 'hsl(28, 60%, 90%)';
              if (isRoot) {
                fill = 'hsl(32, 80%, 48%)';
                textFill = 'hsl(32, 80%, 95%)';
              } else if (showArpeggio && isInScale && !isActive) {
                fill = 'hsl(30, 12%, 28%)';
                textFill = 'hsl(30, 10%, 65%)';
              }

              const cx = LEFT_PAD + (f === 0 ? 0 : f * FRET_WIDTH - FRET_WIDTH / 2);
              const cy = TOP_PAD + s * STRING_SPACING;

              return (
                <g key={`${s}-${f}`} onClick={() => setRoot(pc)} className="cursor-pointer">
                  <circle cx={cx} cy={cy} r={DOT_R} fill={fill} />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={8} fontWeight={600}
                    fontFamily="'JetBrains Mono', monospace"
                    fill={textFill}
                  >
                    {getLabel(pc, root, labelMode, useFlats)}
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
