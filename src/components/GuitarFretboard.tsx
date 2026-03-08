import React, { useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel, getIntervalTension, TENSION_COLORS } from '@/lib/musicTheory';

const FRET_WIDTH = 50;
const STRING_SPACING = 24;
const TOP_PAD = 20;
const LEFT_PAD = 30;
const DOT_R = 8;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

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
const MAX_SPAN = 4;    // max fret span for the fretting hand
const MAX_FINGERS = 4; // index, middle, ring, pinky
const MAX_SPAN_BARRE = 5; // slightly wider span when a barre is anchoring

interface VoicingPosition {
  s: number;  // string index (0 = lowest)
  f: number;  // fret (0 = open)
  pc: number; // pitch class
}

/**
 * Count how many fingers a voicing requires.
 * - Open strings (f=0) cost 0 fingers.
 * - Fretted notes on the same fret can share a barre (1 finger for all).
 * - Each additional distinct fret costs 1 finger.
 */
function countFingers(voicing: VoicingPosition[]): { fingers: number; hasBarre: boolean } {
  const frettedFrets = voicing.filter(v => v.f > 0).map(v => v.f);
  if (frettedFrets.length === 0) return { fingers: 0, hasBarre: false };

  const fretCounts = new Map<number, number>();
  for (const f of frettedFrets) {
    fretCounts.set(f, (fretCounts.get(f) || 0) + 1);
  }

  const sortedFrets = [...fretCounts.entries()].sort((a, b) => a[0] - b[0]);
  let fingers = 0;
  let hasBarre = false;

  // Try barre on the lowest fret first (most common), then any fret with 2+ notes
  let barreUsed = false;
  for (const [fret, count] of sortedFrets) {
    if (!barreUsed && count >= 2) {
      const stringsAtFret = voicing.filter(v => v.f === fret).map(v => v.s);
      const minS = Math.min(...stringsAtFret);
      const maxS = Math.max(...stringsAtFret);
      
      let barreFeasible = true;
      for (let s = minS; s <= maxS; s++) {
        const noteOnString = voicing.find(v => v.s === s);
        if (noteOnString && noteOnString.f > 0 && noteOnString.f < fret) {
          barreFeasible = false;
          break;
        }
      }

      if (barreFeasible) {
        fingers += 1;
        barreUsed = true;
        hasBarre = true;
      } else {
        fingers += count;
      }
    } else if (!barreUsed && count === 1) {
      // Even a single note at lowest fret could become a partial barre
      // if higher strings at the same fret are muted/open — just count 1
      fingers += 1;
    } else {
      fingers += count;
    }
  }

  return { fingers, hasBarre };
}

/**
 * Check if open strings are realistic given the fretted positions.
 * Open strings are only natural when:
 * - All fretted notes are within the first 5 frets, OR
 * - The open string is the bass note (lowest string in the voicing)
 */
function openStringsRealistic(voicing: VoicingPosition[]): boolean {
  const hasOpen = voicing.some(v => v.f === 0);
  if (!hasOpen) return true;

  const frettedPositions = voicing.filter(v => v.f > 0);
  if (frettedPositions.length === 0) return true;

  const maxFret = Math.max(...frettedPositions.map(v => v.f));

  // Open strings are natural up to fret 7 (common in fingerstyle)
  if (maxFret <= 7) return true;

  // Beyond fret 7, only allow open if it's below the lowest fretted string (bass drone)
  const openPositions = voicing.filter(v => v.f === 0);
  const lowestFrettedString = Math.min(...frettedPositions.map(v => v.s));
  return openPositions.every(v => v.s < lowestFrettedString);
}

/**
 * Check that muted (skipped) strings don't create unplayable gaps.
 * A gap of 1 muted string between played strings is acceptable.
 * A gap of 2+ muted strings is suspicious but sometimes needed.
 * Muted strings below (lower than) the lowest played string are fine.
 */
function noProblematicGaps(voicing: VoicingPosition[]): boolean {
  const playedStrings = voicing.map(v => v.s).sort((a, b) => a - b);
  if (playedStrings.length < 2) return true;

  const lowest = playedStrings[0];
  const highest = playedStrings[playedStrings.length - 1];
  const playedSet = new Set(playedStrings);

  // Count consecutive interior gaps
  let maxGap = 0;
  let currentGap = 0;
  for (let s = lowest + 1; s < highest; s++) {
    if (!playedSet.has(s)) {
      currentGap++;
      maxGap = Math.max(maxGap, currentGap);
    } else {
      currentGap = 0;
    }
  }

  // Allow at most 1 consecutive muted interior string
  return maxGap <= 1;
}

/**
 * Identify "core tones" for a chord based on jazz voicing principles.
 * For triads: all notes are core.
 * For 7th chords: root, 3rd, 7th (shell voicing principle — 5th is droppable).
 * For extensions (9, 11, 13): root, 3rd, 7th, extension (drop 5th, optionally drop root on inner strings).
 */
function identifyCoreTones(chordPcs: number[], root: number): Set<number> {
  const core = new Set<number>();
  
  // Always include root and 3rd if present
  core.add(root);
  const third = chordPcs.find(pc => {
    const interval = ((pc - root) % 12 + 12) % 12;
    return interval === 3 || interval === 4; // m3 or M3
  });
  if (third !== undefined) core.add(third);
  
  // For 4+ note chords, prioritize the 7th over the 5th
  if (chordPcs.length >= 4) {
    const seventh = chordPcs.find(pc => {
      const interval = ((pc - root) % 12 + 12) % 12;
      return interval === 10 || interval === 11 || interval === 9; // m7, M7, dim7
    });
    if (seventh !== undefined) core.add(seventh);
  }
  
  // For 5+ note chords (extensions), include the highest extension
  if (chordPcs.length >= 5) {
    const extensions = chordPcs.filter(pc => {
      const interval = ((pc - root) % 12 + 12) % 12;
      return interval === 2 || interval === 5 || interval === 9; // 9th, 11th, 13th (relative to root)
    });
    if (extensions.length > 0) {
      // Add the most "colorful" extension
      extensions.forEach(ext => core.add(ext));
    }
  }
  
  return core;
}

/**
 * Determine if a pitch class is droppable in guitar voicings.
 * 5th is typically droppable. Root can be dropped on inner strings if it's already in the bass.
 */
function isDroppable(pc: number, root: number, bassString: number, currentString: number): boolean {
  const interval = ((pc - root) % 12 + 12) % 12;
  
  // 5th (7 semitones) is always droppable for chords with 4+ notes
  if (interval === 7) return true;
  
  // Root can be dropped on inner strings (but not bass) for extended chords
  if (pc === root && currentString > bassString) return true;
  
  return false;
}

function buildVoicing(
  chordPcs: number[],
  bassString: number,
  bassFret: number,
  bassPc: number,
  tuning: number[],
  windowMin: number,
  windowMax: number,
  root: number,
): VoicingPosition[] | null {
  const numStrings = tuning.length;
  const voicing: VoicingPosition[] = [];
  const usedPcs = new Set<number>();
  const coreTones = identifyCoreTones(chordPcs, root);

  voicing.push({ s: bassString, f: bassFret, pc: bassPc });
  usedPcs.add(bassPc);

  for (let s = bassString + 1; s < numStrings; s++) {
    const opts: VoicingPosition[] = [];
    const openPc = tuning[s] % 12;
    // Only consider open strings if the window is near the nut
    if (chordPcs.includes(openPc)) {
      opts.push({ s, f: 0, pc: openPc });
    }
    for (let f = Math.max(1, windowMin); f <= windowMax; f++) {
      const pc = (tuning[s] + f) % 12;
      if (chordPcs.includes(pc)) {
        opts.push({ s, f, pc });
      }
    }
    if (opts.length === 0) continue;

    // PRIORITY SYSTEM for extended chords:
    // 1. Core tones not yet used (root, 3rd, 7th, extensions)
    // 2. Any chord tone not yet used
    // 3. Core tones (even if duplicated)
    // 4. Any chord tone
    const coreUnused = opts.filter(o => coreTones.has(o.pc) && !usedPcs.has(o.pc));
    const nonCoreUnused = opts.filter(o => !coreTones.has(o.pc) && !usedPcs.has(o.pc));
    const coreUsed = opts.filter(o => coreTones.has(o.pc) && usedPcs.has(o.pc));
    const nonCoreUsed = opts.filter(o => !coreTones.has(o.pc) && usedPcs.has(o.pc));
    
    const candidates = [...coreUnused, ...nonCoreUnused, ...coreUsed, ...nonCoreUsed];

    // Try each candidate and pick the first that keeps the voicing playable
    let picked = false;
    for (const pick of candidates) {
      const tentative = [...voicing, pick];
      const fretted = tentative.filter(v => v.f > 0);

      if (fretted.length > 1) {
        const min = Math.min(...fretted.map(v => v.f));
        const max = Math.max(...fretted.map(v => v.f));
        const { hasBarre } = countFingers(tentative);
        const spanLimit = hasBarre ? MAX_SPAN_BARRE : MAX_SPAN;
        if (max - min > spanLimit) continue;
      }

      if (countFingers(tentative).fingers > MAX_FINGERS) continue;

      voicing.push(pick);
      usedPcs.add(pick.pc);
      picked = true;
      break;
    }
    // If no candidate works, skip this string (it will be muted)
  }

  // Validate final voicing
  const covered = new Set(voicing.map(v => v.pc));
  const coresCovered = [...coreTones].filter(pc => covered.has(pc)).length;
  
  // For extended chords (5+ notes), require at least 3 core tones (root, 3rd, 7th OR extension)
  // For 7th chords (4 notes), require at least 3 unique pitch classes
  // For triads, require at least 2-3 notes
  const isExtended = chordPcs.length >= 5;
  const is7thChord = chordPcs.length === 4;
  
  let minCoverage = 2;
  if (isExtended) {
    minCoverage = Math.min(3, coreTones.size); // Require core tones for extensions
  } else if (is7thChord) {
    minCoverage = 3; // Shell voicing minimum
  } else {
    minCoverage = Math.min(2, chordPcs.length);
  }
  
  // High position exception: allow 2-note voicings
  const avgFret = voicing.reduce((s, v) => s + v.f, 0) / voicing.length;
  const isHighPosition = avgFret >= 9;
  const minNotes = isHighPosition ? 2 : 3;

  if (covered.size < minCoverage || voicing.length < minNotes) return null;
  if (isExtended && coresCovered < Math.min(3, coreTones.size)) return null;
  if (!openStringsRealistic(voicing)) return null;
  if (!noProblematicGaps(voicing)) return null;
  if (countFingers(voicing).fingers > MAX_FINGERS) return null;

  return voicing.sort((a, b) => a.s - b.s);
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
    // Generate more window positions for better coverage
    const windows: [number, number][] = [
      [anchor.f, Math.min(maxFret, anchor.f + MAX_SPAN)],
      [Math.max(0, anchor.f - 1), Math.min(maxFret, anchor.f + MAX_SPAN - 1)],
      [Math.max(0, anchor.f - 2), Math.min(maxFret, anchor.f + 2)],
      [Math.max(0, anchor.f - MAX_SPAN), anchor.f],
      // Wider window for barre chords
      [anchor.f, Math.min(maxFret, anchor.f + MAX_SPAN_BARRE)],
      [Math.max(0, anchor.f - 1), Math.min(maxFret, anchor.f + MAX_SPAN_BARRE - 1)],
    ];

    for (const [wMin, wMax] of windows) {
      if (wMax - wMin > MAX_SPAN_BARRE + 1) continue;
      const voicing = buildVoicing(chordPcs, anchor.s, anchor.f, bassPc, tuning, wMin, wMax);
      if (!voicing) continue;

      const key = voicing.map(p => `${p.s}:${p.f}`).join(',');
      if (!seen.has(key)) {
        seen.add(key);
        voicings.push(voicing);
      }
    }
  }

  // Sort by average fret position (nut → bridge)
  voicings.sort((a, b) => {
    const avgA = a.reduce((sum, p) => sum + p.f, 0) / a.length;
    const avgB = b.reduce((sum, p) => sum + p.f, 0) / b.length;
    return avgA - avgB;
  });

  return voicings;
}

const GuitarFretboard = React.memo(function GuitarFretboard() {
  const {
    root, setRoot, scaleTonic, activePitchClasses, scalePitchClasses,
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {allVoicings.length > 1 && (
            <button
              onClick={() => setVoicingIdx(i => (i - 1 + allVoicings.length) % allVoicings.length)}
              className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-1.5 sm:px-2 py-1 transition-colors"
            >
              ◀
            </button>
          )}
          <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
            Voicing {allVoicings.length > 0
              ? `${Math.min(voicingIdx, allVoicings.length - 1) + 1} / ${allVoicings.length}`
              : '— none found'}
          </span>
          {allVoicings.length > 1 && (
            <button
              onClick={() => setVoicingIdx(i => (i + 1) % allVoicings.length)}
              className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-1.5 sm:px-2 py-1 transition-colors"
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

          {/* Ghost dots for all other voicings */}
          {allVoicings.map((voicing, vIdx) => {
            const safeIdx = Math.min(voicingIdx, allVoicings.length - 1);
            if (vIdx === safeIdx) return null;
            return voicing.map((pos, i) => {
              const displayRow = displayOrder.indexOf(pos.s);
              const cx = LEFT_PAD + (pos.f === 0 ? 0 : pos.f * FRET_WIDTH - FRET_WIDTH / 2);
              const cy = TOP_PAD + displayRow * STRING_SPACING;
              return (
                <circle
                  key={`ghost-${vIdx}-${i}`}
                  cx={cx} cy={cy} r={DOT_R - 2}
                  fill="hsl(28, 15%, 24%)"
                  stroke="hsl(28, 20%, 38%)"
                  strokeWidth={0.75}
                  opacity={0.55}
                  className="cursor-pointer"
                  onClick={() => setVoicingIdx(vIdx)}
                />
              );
            });
          })}

          {/* Tension lines for active voicing */}
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

          {/* Active voicing dots */}
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
                    {getLabel(pos.pc, root, labelMode, useFlats, scaleTonic)}
                  </text>
                </g>
              );
            })
          )}

        </svg>
      </div>
    </div>
  );
});

export default GuitarFretboard;
