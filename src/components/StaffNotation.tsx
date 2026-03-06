import React, { useMemo, useState } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getIntervalTension } from '@/lib/musicTheory';

type ClefType = 'treble' | 'bass';

const LINE_SP = 14;
const STAFF_H = 4 * LINE_SP;
const NOTE_RX = 7.5;
const NOTE_RY = 5;

const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11];

const CLEF_CONFIG: Record<ClefType, { bottomPos: number; topPos: number }> = {
  treble: { bottomPos: 30, topPos: 38 },
  bass:   { bottomPos: 18, topPos: 26 },
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
    root, scaleTonic, scale, activeIntervals,
    useFlats,
  } = useHarmony();

  const [clef, setClef] = useState<ClefType>('treble');
  const { bottomPos, topPos } = CLEF_CONFIG[clef];
  const STAFF_TOP_Y = 30;

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
        offsets[i] = offsets[i - 1] === 0 ? 18 : 0;
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

  const clefAreaW = 40;
  const keySigCount = keySig.sharps.length + keySig.flats.length;
  const keySigAreaW = keySigCount > 0 ? keySigCount * 12 + 10 : 0;
  const noteX = 20 + clefAreaW + keySigAreaW + 30;
  const tensionX = noteX + 50;
  const totalWidth = Math.max(380, tensionX + tensionPairs.length * 14 + 30);

  const allPositions = staffNotes.map(n => n.staffPos);
  const minPos = allPositions.length ? Math.min(...allPositions) : bottomPos;
  const maxPos = allPositions.length ? Math.max(...allPositions) : topPos;
  const minY = Math.min(getY(maxPos) - 16, STAFF_TOP_Y - 16);
  const maxY = Math.max(getY(minPos) + 16, STAFF_TOP_Y + STAFF_H + 16);
  const totalHeight = maxY - minY + 20;
  const yOffset = minY < 0 ? -minY + 6 : 6;

  const staffLineXStart = 16;
  const staffLineXEnd = totalWidth - 16;

  // Ledger line width: just wider than the notehead
  const ledgerHalf = NOTE_RX + 4;

  return (
    <div className="flex items-start gap-3">
      {/* Side controls */}
      <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
        <span className="text-[10px] font-sans font-semibold text-muted-foreground uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
          Staff
        </span>
        <div className="flex flex-col gap-1 mt-1">
          {(['treble', 'bass'] as ClefType[]).map(c => (
            <button
              key={c}
              onClick={() => setClef(c)}
              className={`w-8 h-8 rounded flex items-center justify-center text-base transition-all ${
                clef === c
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              title={c === 'treble' ? 'Treble Clef' : 'Bass Clef'}
            >
              {c === 'treble' ? '𝄞' : '𝄢'}
            </button>
          ))}
        </div>
      </div>

      {/* Staff SVG */}
      <div className="overflow-x-auto flex-1 min-w-0">
        <svg width={totalWidth} height={totalHeight} className="block w-full" viewBox={`0 0 ${totalWidth} ${totalHeight}`} preserveAspectRatio="xMidYMid meet">
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

            {/* Ledger lines — only note-width */}
            {ledgerLines.map(pos => {
              const y = getY(pos);
              // Find the x positions of notes on or near this ledger line
              const notesOnLine = staffNotes
                .map((n, i) => ({ ...n, x: noteX + noteOffsets[i] }))
                .filter(n => Math.abs(n.staffPos - pos) <= 1 && n.staffPos % 2 === pos % 2 || n.staffPos === pos);
              
              if (notesOnLine.length > 0) {
                const minNoteX = Math.min(...notesOnLine.map(n => n.x));
                const maxNoteX = Math.max(...notesOnLine.map(n => n.x));
                return (
                  <line key={`ll-${pos}`}
                    x1={minNoteX - ledgerHalf} y1={y} x2={maxNoteX + ledgerHalf} y2={y}
                    stroke="hsl(30, 8%, 30%)" strokeWidth={1}
                  />
                );
              }
              return (
                <line key={`ll-${pos}`}
                  x1={noteX - ledgerHalf} y1={y} x2={noteX + ledgerHalf} y2={y}
                  stroke="hsl(30, 8%, 30%)" strokeWidth={1}
                />
              );
            })}

            {/* Clef indicator — bass clef dots on F line (pos 22 = 4th line) */}
            <text
              x={22}
              y={clef === 'treble'
                ? getY(32) + 8
                : getY(22) + 10
              }
              fontSize={clef === 'treble' ? 52 : 42}
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
              const x = 20 + clefAreaW + i * 12;
              return (
                <text key={`ks-${i}`}
                  x={x} y={y + 5} fontSize={16}
                  fontFamily="serif" fill="hsl(30, 10%, 65%)"
                >♯</text>
              );
            })}
            {keySig.flats.map((letterIdx, i) => {
              const pos = KEY_SIG_FLAT_POS[clef][FLAT_ORDER.indexOf(letterIdx)];
              if (pos === undefined) return null;
              const y = getY(pos);
              const x = 20 + clefAreaW + i * 12;
              return (
                <text key={`kf-${i}`}
                  x={x} y={y + 5} fontSize={16}
                  fontFamily="serif" fill="hsl(30, 10%, 65%)"
                >♭</text>
              );
            })}

            {/* Note heads — no labels */}
            {staffNotes.map((note, i) => {
              const y = getY(note.staffPos);
              const x = noteX + noteOffsets[i];
              const isRoot = note.pc === root;
              const fillColor = isRoot ? 'hsl(32, 85%, 55%)' : 'hsl(28, 70%, 50%)';

              return (
                <g key={`n-${i}`}>
                  {note.showAccidental && (
                    <text
                      x={x - NOTE_RX - 10} y={y + 5}
                      fontSize={15} fontFamily="serif"
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
