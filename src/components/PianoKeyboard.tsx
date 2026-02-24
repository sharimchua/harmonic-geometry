import React, { useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel, getIntervalTension } from '@/lib/musicTheory';

const WHITE_KEY_PCS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_PCS = [1, 3, 6, 8, 10];
const OCTAVES = 3;
const START_OCTAVE = 3;

// Tension color mapping (matches design tokens)
const TENSION_COLORS: Record<string, string> = {
  perfect: 'hsl(160, 50%, 42%)',
  consonant: 'hsl(190, 45%, 45%)',
  mild: 'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone: 'hsl(340, 60%, 50%)',
};

const TENSION_WIDTHS: Record<string, number> = {
  perfect: 3,
  consonant: 2.5,
  mild: 2,
  dissonant: 2,
  tritone: 2.5,
};

export default function PianoKeyboard() {
  const { root, setRoot, activeIntervals, activePitchClasses, scalePitchClasses, labelMode, useFlats } = useHarmony();

  // Build all keys
  const keys: { pc: number; octave: number; isBlack: boolean; midi: number }[] = [];
  for (let oct = START_OCTAVE; oct < START_OCTAVE + OCTAVES; oct++) {
    for (let pc = 0; pc < 12; pc++) {
      keys.push({ pc, octave: oct, isBlack: BLACK_KEY_PCS.includes(pc), midi: oct * 12 + pc });
    }
  }

  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);

  // Compute exact voicing MIDI notes (voicing specificity - PRD requirement)
  // Smart bass placement: position so full voicing fits within the visible 2.5 octaves
  const voicingMidiNotes = useMemo(() => {
    const span = activeIntervals.length > 0 ? Math.max(...activeIntervals) - Math.min(...activeIntervals) : 0;
    // Visible range: START_OCTAVE*12 to (START_OCTAVE+OCTAVES)*12-1 = 36..71
    const visibleLow = START_OCTAVE * 12;
    const visibleHigh = (START_OCTAVE + OCTAVES) * 12 - 1;
    // Try to center the voicing; start from a base that keeps everything visible
    let baseMidi = 48 + root; // default C4
    // If voicing would go above visible range, shift down
    while (baseMidi + span > visibleHigh && baseMidi > visibleLow) baseMidi -= 12;
    // If bass is below visible range, shift up
    while (baseMidi + Math.min(...activeIntervals) < visibleLow) baseMidi += 12;
    return activeIntervals.map(interval => baseMidi + interval);
  }, [root, activeIntervals]);

  // Check if a specific MIDI note is part of the exact voicing
  const isVoicingNote = (midi: number) => voicingMidiNotes.includes(midi);

  const whiteKeyWidth = 32;
  const whiteKeyHeight = 120;
  const blackKeyWidth = 20;
  const blackKeyHeight = 72;
  const totalWidth = whiteKeys.length * whiteKeyWidth;
  const stackHeight = Math.max(40, (voicingMidiNotes.length - 1) * 12 + 20);

  const getBlackKeyX = (pc: number, octave: number) => {
    const prevWhitePc = WHITE_KEY_PCS.filter(w => w < pc).pop()!;
    const prevWhiteIdx = whiteKeys.findIndex(w => w.pc === prevWhitePc && w.octave === octave);
    return prevWhiteIdx * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
  };

  // Get x position for a MIDI note on the keyboard
  const getMidiX = (midi: number) => {
    const pc = midi % 12;
    const octave = Math.floor(midi / 12);
    const isBlack = BLACK_KEY_PCS.includes(pc);
    if (isBlack) {
      return getBlackKeyX(pc, octave) + blackKeyWidth / 2;
    } else {
      const idx = whiteKeys.findIndex(w => w.pc === pc && w.octave === octave);
      if (idx === -1) return -1;
      return idx * whiteKeyWidth + whiteKeyWidth / 2;
    }
  };

  // Build ALL interval pairs for visualization below keyboard (not just adjacent)
  const intervalPairs = useMemo(() => {
    const pairs: { fromX: number; toX: number; tension: string; semitones: number }[] = [];
    const sorted = [...voicingMidiNotes].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const fromX = getMidiX(sorted[i]);
        const toX = getMidiX(sorted[j]);
        if (fromX === -1 || toX === -1) continue;
        const semitones = ((sorted[j] - sorted[i]) % 12 + 12) % 12;
        const tension = getIntervalTension(semitones);
        pairs.push({ fromX, toX, tension, semitones });
      }
    }
    return pairs;
  }, [voicingMidiNotes, whiteKeys]);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Piano</h3>
      <div className="overflow-x-auto w-full">
        <svg width={totalWidth} height={whiteKeyHeight + stackHeight + 10} className="mx-auto block">
          {/* White keys */}
          {whiteKeys.map((key, i) => {
            const isExactVoicing = isVoicingNote(key.midi);
            const isPitchClassActive = activePitchClasses.includes(key.pc);
            const isRoot = key.pc === root;
            const isInScale = scalePitchClasses.includes(key.pc);

            // PRD: only highlight exact voicing notes, ghost other pitch class instances
            let fill = 'hsl(30, 8%, 88%)';
            if (isInScale) fill = 'hsl(30, 12%, 78%)';
            if (isPitchClassActive && !isExactVoicing) fill = 'hsl(28, 40%, 75%)'; // ghosted
            if (isExactVoicing) fill = 'hsl(28, 65%, 68%)';
            if (isExactVoicing && isRoot) fill = 'hsl(32, 85%, 58%)';

            return (
              <g key={key.midi} onClick={() => setRoot(key.pc)} className="cursor-pointer">
                <rect
                  x={i * whiteKeyWidth} y={0}
                  width={whiteKeyWidth - 1} height={whiteKeyHeight}
                  fill={fill}
                  stroke="hsl(30, 5%, 22%)"
                  strokeWidth="1"
                  rx={2}
                />
                {isExactVoicing && (
                  <text
                    x={i * whiteKeyWidth + whiteKeyWidth / 2} y={whiteKeyHeight - 10}
                    textAnchor="middle" fontSize={9}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(0, 0%, 10%)" fontWeight={600}
                  >
                    {getLabel(key.pc, root, labelMode, useFlats)}
                  </text>
                )}
                {/* Ghost label for non-voicing active notes */}
                {isPitchClassActive && !isExactVoicing && (
                  <text
                    x={i * whiteKeyWidth + whiteKeyWidth / 2} y={whiteKeyHeight - 10}
                    textAnchor="middle" fontSize={8}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(30, 15%, 45%)" fontWeight={400}
                    opacity={0.6}
                  >
                    {getLabel(key.pc, root, labelMode, useFlats)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Black keys */}
          {blackKeys.map(key => {
            const x = getBlackKeyX(key.pc, key.octave);
            const isExactVoicing = isVoicingNote(key.midi);
            const isPitchClassActive = activePitchClasses.includes(key.pc);
            const isRoot = key.pc === root;
            const isInScale = scalePitchClasses.includes(key.pc);

            let fill = 'hsl(0, 0%, 12%)';
            if (isInScale) fill = 'hsl(30, 10%, 22%)';
            if (isPitchClassActive && !isExactVoicing) fill = 'hsl(28, 35%, 28%)'; // ghosted
            if (isExactVoicing) fill = 'hsl(28, 70%, 38%)';
            if (isExactVoicing && isRoot) fill = 'hsl(32, 80%, 42%)';

            return (
              <g key={key.midi} onClick={() => setRoot(key.pc)} className="cursor-pointer">
                <rect
                  x={x} y={0}
                  width={blackKeyWidth} height={blackKeyHeight}
                  fill={fill}
                  stroke="hsl(0, 0%, 8%)"
                  strokeWidth="1"
                  rx={2}
                />
                {isExactVoicing && (
                  <text
                    x={x + blackKeyWidth / 2} y={blackKeyHeight - 8}
                    textAnchor="middle" fontSize={8}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(30, 10%, 85%)" fontWeight={600}
                  >
                    {getLabel(key.pc, root, labelMode, useFlats)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Interval Stack Visualization (below keyboard) */}
          {intervalPairs.map((pair, i) => {
            const y = whiteKeyHeight + 12 + i * 12;
            const color = TENSION_COLORS[pair.tension] ?? TENSION_COLORS.mild;
            const width = TENSION_WIDTHS[pair.tension] ?? 2;
            return (
              <g key={`stack-${i}`}>
                <line
                  x1={pair.fromX} y1={y}
                  x2={pair.toX} y2={y}
                  stroke={color}
                  strokeWidth={width}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                {/* Small dots at endpoints */}
                <circle cx={pair.fromX} cy={y} r={2.5} fill={color} opacity={0.9} />
                <circle cx={pair.toX} cy={y} r={2.5} fill={color} opacity={0.9} />
                {/* Semitone label at midpoint */}
                <text
                  x={(pair.fromX + pair.toX) / 2}
                  y={y - 3}
                  textAnchor="middle" fontSize={7}
                  fontFamily="'JetBrains Mono', monospace"
                  fill={color} opacity={0.7}
                >
                  {pair.semitones}st
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
