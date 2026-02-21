import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel } from '@/lib/musicTheory';

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [1, 3, 6, 8, 10];
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

  const getBlackKeyX = (pc: number, octave: number) => {
    const prevWhitePc = WHITE_KEYS.filter(w => w < pc).pop()!;
    const prevWhiteIdx = whiteKeys.findIndex(w => w.pc === prevWhitePc && w.octave === octave);
    return prevWhiteIdx * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Piano</h3>
      <div className="overflow-x-auto w-full">
        <svg width={totalWidth} height={whiteKeyHeight + 20} className="mx-auto block">
          {/* White keys */}
          {whiteKeys.map((key, i) => {
            const isActive = activePitchClasses.includes(key.pc);
            const isRoot = key.pc === root;
            const isInScale = scalePitchClasses.includes(key.pc);
            
            let fill = 'hsl(30, 8%, 88%)';
            if (isInScale) fill = 'hsl(30, 12%, 78%)';
            if (isActive) fill = 'hsl(28, 65%, 68%)';
            if (isRoot) fill = 'hsl(32, 85%, 58%)';

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
                {isActive && (
                  <text
                    x={i * whiteKeyWidth + whiteKeyWidth / 2} y={whiteKeyHeight - 10}
                    textAnchor="middle" fontSize={9}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(0, 0%, 10%)" fontWeight={600}
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

            let fill = 'hsl(0, 0%, 12%)';
            if (isInScale) fill = 'hsl(30, 10%, 22%)';
            if (isActive) fill = 'hsl(28, 70%, 38%)';
            if (isRoot) fill = 'hsl(32, 80%, 42%)';

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
                {isActive && (
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
        </svg>
      </div>
    </div>
  );
}
