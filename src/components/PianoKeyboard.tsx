import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel } from '@/lib/musicTheory';

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C# D# F# G# A#
const OCTAVES = 3;
const START_OCTAVE = 3;

export default function PianoKeyboard() {
  const { root, setRoot, activePitchClasses, scalePitchClasses, labelMode, useFlats } = useHarmony();

  const keys: { pc: number; octave: number; isBlack: boolean; midi: number }[] = [];
  for (let oct = START_OCTAVE; oct < START_OCTAVE + OCTAVES; oct++) {
    for (let pc = 0; pc < 12; pc++) {
      keys.push({ pc, octave: oct, isBlack: BLACK_KEYS.includes(pc), midi: oct * 12 + pc });
    }
  }

  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);

  const whiteKeyWidth = 32;
  const whiteKeyHeight = 120;
  const blackKeyWidth = 20;
  const blackKeyHeight = 72;
  const totalWidth = whiteKeys.length * whiteKeyWidth;

  // Map each pc (0-11) to its white key index for black key positioning
  const getBlackKeyX = (pc: number, octave: number) => {
    const whiteIndex = whiteKeys.findIndex(w => w.octave === octave && w.pc === (pc < 5 ? pc - 1 : pc - 1));
    // Find the white key just before this black key
    const prevWhitePc = WHITE_KEYS.filter(w => w < pc).pop()!;
    const prevWhiteIdx = whiteKeys.findIndex(w => w.pc === prevWhitePc && w.octave === octave);
    return prevWhiteIdx * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-widest">Piano</h3>
      <div className="overflow-x-auto w-full">
        <svg width={totalWidth} height={whiteKeyHeight + 20} className="mx-auto block">
          {/* White keys */}
          {whiteKeys.map((key, i) => {
            const isActive = activePitchClasses.includes(key.pc);
            const isRoot = key.pc === root;
            const isInScale = scalePitchClasses.includes(key.pc);
            
            let fill = 'hsl(220, 15%, 85%)';
            if (isInScale) fill = 'hsl(220, 30%, 75%)';
            if (isActive) fill = 'hsl(180, 60%, 65%)';
            if (isRoot) fill = 'hsl(35, 80%, 60%)';

            return (
              <g key={key.midi} onClick={() => setRoot(key.pc)} className="cursor-pointer">
                <rect
                  x={i * whiteKeyWidth} y={0}
                  width={whiteKeyWidth - 1} height={whiteKeyHeight}
                  fill={fill}
                  stroke="hsl(220, 15%, 20%)"
                  strokeWidth="1"
                  rx={2}
                />
                {isActive && (
                  <text
                    x={i * whiteKeyWidth + whiteKeyWidth / 2} y={whiteKeyHeight - 10}
                    textAnchor="middle" fontSize={9}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(220, 20%, 10%)" fontWeight={600}
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
            const isActive = activePitchClasses.includes(key.pc);
            const isRoot = key.pc === root;
            const isInScale = scalePitchClasses.includes(key.pc);

            let fill = 'hsl(220, 15%, 12%)';
            if (isInScale) fill = 'hsl(220, 40%, 25%)';
            if (isActive) fill = 'hsl(180, 70%, 35%)';
            if (isRoot) fill = 'hsl(35, 80%, 40%)';

            return (
              <g key={key.midi} onClick={() => setRoot(key.pc)} className="cursor-pointer">
                <rect
                  x={x} y={0}
                  width={blackKeyWidth} height={blackKeyHeight}
                  fill={fill}
                  stroke="hsl(220, 10%, 8%)"
                  strokeWidth="1"
                  rx={2}
                />
                {isActive && (
                  <text
                    x={x + blackKeyWidth / 2} y={blackKeyHeight - 8}
                    textAnchor="middle" fontSize={8}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(210, 20%, 80%)" fontWeight={600}
                  >
                    {getLabel(key.pc, root, labelMode, useFlats)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
