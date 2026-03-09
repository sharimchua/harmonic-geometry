import React, { useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { generateVoicings, type VoicingPosition } from '@/lib/guitarVoicings';
import { getLabel, getIntervalTension, TENSION_COLORS } from '@/lib/musicTheory';

const FRET_WIDTH = 50;
const STRING_SPACING = 24;
const TOP_PAD = 20;
const LEFT_PAD = 30;
const DOT_R = 8;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19];

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
const MAX_FRET_DISTANCE = 4; // Maximum fret distance for tension lines

interface FretboardNote {
  s: number; // string index (0 = lowest)
  f: number; // fret number
  pc: number; // pitch class
  isCore: boolean; // whether this is a core tone
}

/**
 * Identify core tones for a chord based on music theory.
 * For triads: all notes are core.
 * For 7th chords: root, 3rd, 7th (5th is less essential).
 * For extensions: root, 3rd, 7th, and the extensions.
 */
function identifyCoreTones(chordPcs: number[], root: number): Set<number> {
  const pcs = [...new Set(chordPcs.map(pc => ((pc % 12) + 12) % 12))];
  const core = new Set<number>();
  
  // Always include root
  core.add(root);
  
  // Find and include 3rd
  const third = pcs.find(pc => {
    const interval = ((pc - root) % 12 + 12) % 12;
    return interval === 3 || interval === 4; // m3 or M3
  });
  if (third !== undefined) core.add(third);
  
  // For triads, all notes are core
  if (pcs.length <= 3) {
    pcs.forEach(pc => core.add(pc));
    return core;
  }
  
  // For 4+ note chords, prioritize 7th over 5th
  const seventh = pcs.find(pc => {
    const interval = ((pc - root) % 12 + 12) % 12;
    return interval === 9 || interval === 10 || interval === 11; // dim7, m7, M7
  });
  if (seventh !== undefined) core.add(seventh);
  
  // For 5+ note chords, include extensions
  if (pcs.length >= 5) {
    const extensions = pcs.filter(pc => {
      const interval = ((pc - root) % 12 + 12) % 12;
      return interval === 2 || interval === 5 || interval === 9; // 9th, 11th, 13th
    });
    extensions.forEach(ext => core.add(ext));
  }
  
  return core;
}

const GuitarFretboard = React.memo(function GuitarFretboard() {
  const {
    root, setRoot, scaleTonic,
    activeIntervals,
    activePitchClasses,
    labelMode, useFlats,
  } = useHarmony();

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

  // Find all chord tones on the fretboard
  const chordTones = useMemo(() => {
    const coreTones = identifyCoreTones(activePitchClasses, root);
    const notes: FretboardNote[] = [];
    
    for (let s = 0; s < numStrings; s++) {
      for (let f = 0; f <= NUM_FRETS; f++) {
        const pc = (tuning[s] + f) % 12;
        if (activePitchClasses.includes(pc)) {
          notes.push({
            s,
            f,
            pc,
            isCore: coreTones.has(pc),
          });
        }
      }
    }
    
    return notes;
  }, [activePitchClasses, root, tuning, numStrings]);

  // Generate tension lines between all chord tones (like PitchClock)
  const tensionLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; tension: string }[] = [];

    // Create tension lines between all pairs of chord tones
    for (let i = 0; i < chordTones.length; i++) {
      for (let j = i + 1; j < chordTones.length; j++) {
        const note1 = chordTones[i];
        const note2 = chordTones[j];

        // Skip notes on the same string
        if (note1.s === note2.s) continue;

        const semitones = ((note2.pc - note1.pc) % 12 + 12) % 12;
        const tension = getIntervalTension(semitones);

        const displayRow1 = displayOrder.indexOf(note1.s);
        const displayRow2 = displayOrder.indexOf(note2.s);

        lines.push({
          x1: LEFT_PAD + (note1.f === 0 ? 0 : note1.f * FRET_WIDTH - FRET_WIDTH / 2),
          y1: TOP_PAD + displayRow1 * STRING_SPACING,
          x2: LEFT_PAD + (note2.f === 0 ? 0 : note2.f * FRET_WIDTH - FRET_WIDTH / 2),
          y2: TOP_PAD + displayRow2 * STRING_SPACING,
          tension,
        });
      }
    }

    return lines;
  }, [chordTones, displayOrder, tuning]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 w-full">
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

          {/* Frets */}
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

          {/* Fret markers */}
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

          {/* Tension lines */}
          {tensionLines.map((line, i) => {
            const color = TENSION_COLORS[line.tension] ?? TENSION_COLORS.mild;
            return (
              <line
                key={`tension-${i}`}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke={color}
                strokeWidth={1.5}
                opacity={0.4}
                strokeDasharray={line.tension === 'dissonant' || line.tension === 'tritone' ? '4,3' : undefined}
              />
            );
          })}

          {/* Chord tone dots */}
          {chordTones.map((note, i) => {
            const displayRow = displayOrder.indexOf(note.s);
            const cx = LEFT_PAD + (note.f === 0 ? 0 : note.f * FRET_WIDTH - FRET_WIDTH / 2);
            const cy = TOP_PAD + displayRow * STRING_SPACING;
            
            const isRoot = note.pc === root;
            const fill = isRoot 
              ? 'hsl(32, 85%, 52%)' 
              : note.isCore 
                ? 'hsl(28, 60%, 40%)' 
                : 'hsl(28, 40%, 35%)';
            const stroke = isRoot 
              ? 'hsl(32, 90%, 65%)' 
              : note.isCore 
                ? 'hsl(28, 50%, 55%)' 
                : 'hsl(28, 30%, 50%)';
            const opacity = note.isCore ? 1 : 0.6;

            return (
              <g key={`note-${i}`} onClick={() => setRoot(note.pc)} className="cursor-pointer">
                <circle 
                  cx={cx} cy={cy} r={DOT_R} 
                  fill={fill} stroke={stroke} strokeWidth={1} 
                  opacity={opacity}
                />
                <text
                  x={cx} y={cy}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={8} fontWeight={600}
                  fontFamily="'JetBrains Mono', monospace"
                  fill="hsl(0, 0%, 92%)"
                  opacity={opacity}
                >
                  {getLabel(note.pc, root, labelMode, useFlats, scaleTonic)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});

export default GuitarFretboard;
