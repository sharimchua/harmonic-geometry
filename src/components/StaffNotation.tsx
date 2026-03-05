import React, { useMemo, useState } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getIntervalTension, getLabel } from '@/lib/musicTheory';

type ClefType = 'treble' | 'bass';

const LINE_SP = 11;
const STAFF_H = 4 * LINE_SP; // 44px for 5 lines
const NOTE_RX = 6.5;
const NOTE_RY = 4.5;

const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B

const CLEF_CONFIG: Record<ClefType, { bottomPos: number; topPos: number }> = {
  treble: { bottomPos: 30, topPos: 38 }, // E4–F5
  bass:   { bottomPos: 18, topPos: 26 }, // G2–A3
};

const KEY_SIG_SHARP_POS: Record<ClefType, number[]> = {
  treble: [38, 35, 39, 36, 33, 37, 34],
  bass:   [24, 21, 25, 22, 19, 23, 20],
};
const KEY_SIG_FLAT_POS: Record<ClefType, number[]> = {
  treble: [34, 37, 33, 36, 32, 35, 31],
  bass:   [20, 23, 19, 22, 18, 21, 17],
};

const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6];
const FLAT_ORDER  = [6, 2, 5, 1, 4, 0, 3];

const TENSION_COLORS: Record<string, string> = {
  perfect:   'hsl(220, 55%, 58%)',
  consonant: 'hsl(150, 55%, 42%)',
  mild:      'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone:   'hsl(340, 60%, 50%)',
};
const TENSION_WIDTHS: Record<string, number> = {
  perfect: 2.5, consonant: 2, mild: 1.5, dissonant: 1.5, tritone: 2,
};

// ── Helpers ──────────────────────────────────────────────

function pcToLetterSharp(pc: number): number {
  return [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc];
}
function pcToLetterFlat(pc: number): number {
  return [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6][pc];
}

function getAccidental(pc: number, letterIdx: number): number {
  const natural = NATURAL_PCS[letterIdx];
  let diff = ((pc - natural) + 12) % 12;
  if (diff > 6) diff -= 12;
  return diff;
}

function accidentalSymbol(acc: number): string {
  if (acc === 1)  return '♯';
  if (acc === -1) return '♭';
  if (acc === 0)  return '♮';
  if (acc === 2)  return '𝄪';
  if (acc === -2) return '𝄫';
  return '';
}

function computeKeySignature(
  scaleTonic: number,
  scaleIntervals: number[] | null,
  tonicLetter: number,
) {
  const accidentals = new Map<number, number>();
  if (!scaleIntervals || scaleIntervals.length !== 7) return { sharps: [] as number[], flats: [] as number[], accidentals };

  for (let i = 0; i < 7; i++) {
    const letter = (tonicLetter + i) % 7;
    const pc = (scaleTonic + scaleIntervals[i]) % 12;
    const acc = getAccidental(pc, letter);
    if (acc !== 0) accidentals.set(letter, acc);
  }

  const sharps: number[] = [];
  const flats:  number[] = [];
  for (const l of SHARP_ORDER) { if ((accidentals.get(l) ?? 0) > 0) sharps.push(l); }
  for (const l of FLAT_ORDER)  { if ((accidentals.get(l) ?? 0) < 0) flats.push(l); }

  return { sharps, flats, accidentals };
}

// ── Component ────────────────────────────────────────────

export default function StaffNotation() {
  const {
    root, scaleTonic, scale, activeIntervals, activePitchClasses,
    labelMode, useFlats,
  } = useHarmony();

  const [clef, setClef] = useState<ClefType>('treble');
  const { bottomPos, topPos } = CLEF_CONFIG[clef];
  const STAFF_TOP_Y = 64;

  const scaleLetterMap = useMemo(() => {
    const map = new Map<number, number>();
    if (scale && scale.intervals.length === 7) {
      const tonicLetter = useFlats ? pcToLetterFlat(scaleTonic) : pcToLetterSharp(scaleTonic);
      for (let i = 0; i < 7; i++) {
        const letter = (tonicLetter + i) % 7;
        const pc = (scaleTonic + scale.intervals[i]) % 12;
        map.set(pc, letter);
      }
    }
    return map;
  }, [scaleTonic, scale, useFlats]);

  const pcToLetter = (pc: number) => {
    const fromScale = scaleLetterMap.get(pc);
    if (fromScale !== undefined) return fromScale;
    return useFlats ? pcToLetterFlat(pc) : pcToLetterSharp(pc);
  };

  const tonicLetter = pcToLetter(scaleTonic);

  const keySig = useMemo(
    () => computeKeySignature(scaleTonic, scale?.intervals ?? null, tonicLetter),
    [scaleTonic, scale, tonicLetter],
  );

  const getY = (staffPos: number) =>
    STAFF_TOP_Y + STAFF_H - (staffPos - bottomPos) * (LINE_SP / 2);

  const voicingNotes = useMemo(() => {
    if (activeIntervals.length === 0) return [];
    let bestBase = 0;
    let bestScore = Infinity;
    for (let baseMidi = 24; baseMidi <= 84; baseMidi += 12) {
      const adj = baseMidi + root;
      const notes = activeIntervals.map(i => adj + i);
      let score = 0;
      for (const midi of notes) {
        const oct = Math.floor(midi / 12) - 1;
        const pc = midi % 12;
        const letter = pcToLetter(pc);
        const pos = oct * 7 + letter;
        if (pos < bottomPos) score += Math.ceil((bottomPos - pos) / 2);
        else if (pos > topPos) score += Math.ceil((pos - topPos) / 2);
      }
      if (score < bestScore) { bestScore = score; bestBase = adj; }
    }
    return activeIntervals.map(i => bestBase + i);
  }, [root, activeIntervals, clef, useFlats, bottomPos, topPos]);

  const staffNotes = useMemo(() => {
    return voicingNotes.map(midi => {
      const octave = Math.floor(midi / 12) - 1;
      const pc = midi % 12;
      const letter = pcToLetter(pc);
      const staffPos = octave * 7 + letter;
      const noteAcc = getAccidental(pc, letter);
      const keySigAcc = keySig.accidentals.get(letter) ?? 0;
      const showAccidental = noteAcc !== keySigAcc;
      return { midi, pc, letter, octave, staffPos, accidental: noteAcc, showAccidental };
    }).sort((a, b) => a.staffPos - b.staffPos);
  }, [voicingNotes, useFlats, keySig]);

  const noteOffsets = useMemo(() => {
    const offsets = staffNotes.map(() => 0);
    for (let i = 1; i < staffNotes.length; i++) {
      if (staffNotes[i].staffPos - staffNotes[i - 1].staffPos <= 1) {
        offsets[i] = offsets[i - 1] === 0 ? 16 : 0;
      }
    }
    return offsets;
  }, [staffNotes]);

  const ledgerLines = useMemo(() => {
    const lines = new Set<number>();
    for (const n of staffNotes) {
      if (n.staffPos < bottomPos) {
        for (let p = bottomPos - 2; p >= n.staffPos; p -= 2) lines.add(p);
        if (n.staffPos % 2 !== bottomPos % 2) {
          for (let p = bottomPos - 2; p >= n.staffPos + 1; p -= 2) lines.add(p);
        }
      }
      if (n.staffPos > topPos) {
        for (let p = topPos + 2; p <= n.staffPos; p += 2) lines.add(p);
        if (n.staffPos % 2 !== topPos % 2) {
          for (let p = topPos + 2; p <= n.staffPos - 1; p += 2) lines.add(p);
        }
      }
    }
    return [...lines];
  }, [staffNotes, bottomPos, topPos]);

  const tensionPairs = useMemo(() => {
    const pairs: { y1: number; y2: number; tension: string; semitones: number }[] = [];
    for (let i = 0; i < staffNotes.length; i++) {
      for (let j = i + 1; j < staffNotes.length; j++) {
        const semitones = ((staffNotes[j].pc - staffNotes[i].pc) % 12 + 12) % 12;
        pairs.push({
          y1: getY(staffNotes[i].staffPos),
          y2: getY(staffNotes[j].staffPos),
          tension: getIntervalTension(semitones),
          semitones,
        });
      }
    }
    return pairs;
  }, [staffNotes]);

  const clefAreaW = 36;
  const keySigCount = keySig.sharps.length + keySig.flats.length;
  const keySigAreaW = keySigCount > 0 ? keySigCount * 11 + 10 : 0;
  const noteX = 20 + clefAreaW + keySigAreaW + 30;
  const tensionX = noteX + 50;
  const totalWidth = Math.max(420, tensionX + tensionPairs.length * 14 + 30);

  const allPositions = staffNotes.map(n => n.staffPos);
  const minPos = allPositions.length ? Math.min(...allPositions) : bottomPos;
  const maxPos = allPositions.length ? Math.max(...allPositions) : topPos;
  const minY = Math.min(getY(maxPos) - 20, STAFF_TOP_Y - 20);
  const maxY = Math.max(getY(minPos) + 20, STAFF_TOP_Y + STAFF_H + 20);
  const totalHeight = maxY - minY + 40;
  const yOffset = minY < 0 ? -minY + 10 : 10;

  const staffLineXStart = 16;
  const staffLineXEnd = totalWidth - 16;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">Staff</h3>
        <div className="flex gap-1 ml-2">
          {(['treble', 'bass'] as ClefType[]).map(c => (
            <button
              key={c}
              onClick={() => setClef(c)}
              className={`px-2.5 py-1 rounded text-xs font-sans capitalize transition-all ${
                clef === c
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {c === 'treble' ? '𝄞 Treble' : '𝄢 Bass'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <svg width={totalWidth} height={totalHeight} className="mx-auto block">
          <g transform={`translate(0, ${yOffset})`}>
            {/* Staff lines */}
            {Array.from({ length: 5 }, (_, i) => {
              const y = STAFF_TOP_Y + i * LINE_SP;
              return (
                <line key={`sl-${i}`}
                  x1={staffLineXStart} y1={y} x2={staffLineXEnd} y2={y}
                  stroke="hsl(30, 8%, 30%)" strokeWidth={1}
                />
              );
            })}

            {/* Ledger lines */}
            {ledgerLines.map(pos => {
              const y = getY(pos);
              return (
                <line key={`ll-${pos}`}
                  x1={noteX - 12} y1={y} x2={noteX + 20 + 12} y2={y}
                  stroke="hsl(30, 8%, 30%)" strokeWidth={1}
                />
              );
            })}

            {/* Clef indicator */}
            <text
              x={22}
              y={clef === 'treble'
                ? getY(32) + 8
                : getY(24) + 6
              }
              fontSize={clef === 'treble' ? 44 : 36}
              fontFamily="serif, 'Times New Roman', Georgia"
              fill="hsl(30, 10%, 55%)"
              textAnchor="start"
            >
              {clef === 'treble' ? '𝄞' : '𝄢'}
            </text>

            {/* Key signature */}
            {keySig.sharps.map((letterIdx, i) => {
              const pos = KEY_SIG_SHARP_POS[clef][SHARP_ORDER.indexOf(letterIdx)];
              if (pos === undefined) return null;
              const y = getY(pos);
              const x = 20 + clefAreaW + i * 11;
              return (
                <text key={`ks-${i}`}
                  x={x} y={y + 4} fontSize={14}
                  fontFamily="serif" fill="hsl(30, 10%, 65%)"
                >♯</text>
              );
            })}
            {keySig.flats.map((letterIdx, i) => {
              const pos = KEY_SIG_FLAT_POS[clef][FLAT_ORDER.indexOf(letterIdx)];
              if (pos === undefined) return null;
              const y = getY(pos);
              const x = 20 + clefAreaW + i * 11;
              return (
                <text key={`kf-${i}`}
                  x={x} y={y + 4} fontSize={14}
                  fontFamily="serif" fill="hsl(30, 10%, 65%)"
                >♭</text>
              );
            })}

            {/* Note heads */}
            {staffNotes.map((note, i) => {
              const y = getY(note.staffPos);
              const x = noteX + noteOffsets[i];
              const isRoot = note.pc === root;
              const fillColor = isRoot ? 'hsl(32, 85%, 55%)' : 'hsl(28, 70%, 50%)';

              return (
                <g key={`n-${i}`}>
                  {note.showAccidental && (
                    <text
                      x={x - NOTE_RX - 10} y={y + 4}
                      fontSize={13} fontFamily="serif"
                      fill="hsl(30, 10%, 75%)"
                      textAnchor="middle"
                    >
                      {accidentalSymbol(note.accidental)}
                    </text>
                  )}
                  <ellipse
                    cx={x} cy={y} rx={NOTE_RX} ry={NOTE_RY}
                    fill={fillColor}
                    stroke="hsl(30, 15%, 25%)" strokeWidth={1}
                    transform={`rotate(-15, ${x}, ${y})`}
                  />
                  <text
                    x={x} y={y + NOTE_RY + 12}
                    textAnchor="middle" fontSize={8}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(30, 10%, 55%)"
                  >
                    {getLabel(note.pc, root, labelMode, useFlats)}
                  </text>
                </g>
              );
            })}

            {/* Interval tension lines */}
            {tensionPairs.map((pair, i) => {
              const x = tensionX + i * 14;
              const color = TENSION_COLORS[pair.tension] ?? TENSION_COLORS.mild;
              const width = TENSION_WIDTHS[pair.tension] ?? 1.5;
              const minPairY = Math.min(pair.y1, pair.y2);
              const maxPairY = Math.max(pair.y1, pair.y2);

              return (
                <g key={`t-${i}`}>
                  <line
                    x1={x} y1={minPairY} x2={x} y2={maxPairY}
                    stroke={color} strokeWidth={width}
                    strokeLinecap="round" opacity={0.85}
                  />
                  <circle cx={x} cy={minPairY} r={2.5} fill={color} opacity={0.9} />
                  <circle cx={x} cy={maxPairY} r={2.5} fill={color} opacity={0.9} />
                  <text
                    x={x} y={minPairY - 5}
                    textAnchor="middle" fontSize={7}
                    fontFamily="'JetBrains Mono', monospace"
                    fill={color} opacity={0.7}
                  >
                    {pair.semitones}st
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
