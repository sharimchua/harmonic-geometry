import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { STANDARD_TUNING, STRING_NAMES, NUM_FRETS, getLabel } from '@/lib/musicTheory';

const FRET_WIDTH = 50;
const STRING_SPACING = 24;
const TOP_PAD = 20;
const LEFT_PAD = 30;
const DOT_R = 8;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

export default function GuitarFretboard() {
  const {
    root, setRoot, activePitchClasses, scalePitchClasses,
    showArpeggio, labelMode, useFlats,
  } = useHarmony();

  const numStrings = STANDARD_TUNING.length;
  const totalWidth = LEFT_PAD + (NUM_FRETS + 1) * FRET_WIDTH;
  const totalHeight = TOP_PAD + (numStrings - 1) * STRING_SPACING + 30;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Fretboard</h3>
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
                {STRING_NAMES[s]}
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

          {/* Notes on fretboard */}
          {STANDARD_TUNING.map((openMidi, s) =>
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
