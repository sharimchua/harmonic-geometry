import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel, getIntervalTension } from '@/lib/musicTheory';

const RADIUS = 140;
const CENTER = 170;
const DOT_RADIUS = 18;

const TENSION_COLORS: Record<string, string> = {
  perfect: 'hsl(160, 50%, 42%)',
  consonant: 'hsl(190, 45%, 45%)',
  mild: 'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone: 'hsl(340, 60%, 50%)',
};

function pitchClassToAngle(pc: number): number {
  return (pc * 30 - 90) * (Math.PI / 180);
}

function pitchClassToXY(pc: number): [number, number] {
  const angle = pitchClassToAngle(pc);
  return [
    CENTER + RADIUS * Math.cos(angle),
    CENTER + RADIUS * Math.sin(angle),
  ];
}

export default function PitchClock() {
  const {
    root, setRoot, activePitchClasses, scalePitchClasses,
    intervalTensions, labelMode, useFlats,
  } = useHarmony();

  const allPitchClasses = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Pitch Clock</h3>
      <svg width={CENTER * 2} height={CENTER * 2} className="overflow-visible">
        {/* Background circle */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 30} fill="none" stroke="hsl(30, 5%, 18%)" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="hsl(30, 5%, 22%)" strokeWidth="1" strokeDasharray="2 4" />

        {/* Interval lines between active notes */}
        {intervalTensions.map((t, i) => {
          const [x1, y1] = pitchClassToXY(t.from);
          const [x2, y2] = pitchClassToXY(t.to);
          const color = TENSION_COLORS[t.tension];
          const isDiss = t.tension === 'dissonant' || t.tension === 'tritone';
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth={isDiss ? 2.5 : 1.5}
              strokeDasharray={isDiss ? '6 3' : 'none'}
              opacity={0.7}
            />
          );
        })}

        {/* Chord polygon fill */}
        {activePitchClasses.length >= 3 && (
          <polygon
            points={activePitchClasses.map(pc => pitchClassToXY(pc).join(',')).join(' ')}
            fill="hsl(28, 85%, 55%)"
            fillOpacity={0.06}
            stroke="hsl(28, 85%, 55%)"
            strokeWidth="1"
            strokeOpacity={0.25}
          />
        )}

        {/* All 12 pitch class nodes */}
        {allPitchClasses.map(pc => {
          const [x, y] = pitchClassToXY(pc);
          const isActive = activePitchClasses.includes(pc);
          const isRoot = pc === root;
          const isInScale = scalePitchClasses.includes(pc);
          
          let fillColor = 'hsl(0, 0%, 13%)';
          let strokeColor = 'hsl(30, 5%, 25%)';
          let textColor = 'hsl(30, 8%, 40%)';
          let r = DOT_RADIUS - 4;

          if (isInScale && !isActive) {
            fillColor = 'hsl(30, 10%, 18%)';
            strokeColor = 'hsl(30, 15%, 32%)';
            textColor = 'hsl(30, 10%, 55%)';
            r = DOT_RADIUS - 2;
          }
          if (isActive && !isRoot) {
            fillColor = 'hsl(28, 60%, 18%)';
            strokeColor = 'hsl(28, 85%, 55%)';
            textColor = 'hsl(28, 80%, 70%)';
            r = DOT_RADIUS;
          }
          if (isRoot) {
            fillColor = 'hsl(32, 70%, 22%)';
            strokeColor = 'hsl(32, 90%, 52%)';
            textColor = 'hsl(32, 85%, 72%)';
            r = DOT_RADIUS + 2;
          }

          const label = getLabel(pc, root, labelMode, useFlats);

          return (
            <g
              key={pc}
              onClick={() => setRoot(pc)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              {isRoot && (
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke={strokeColor} strokeWidth="1" opacity={0.4} />
              )}
              <circle cx={x} cy={y} r={r} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
              <text
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fill={textColor}
                fontSize={isRoot ? 12 : 10}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={isActive ? 600 : 400}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tension legend */}
      <div className="flex gap-3 mt-3 flex-wrap justify-center">
        {(['perfect', 'consonant', 'mild', 'dissonant', 'tritone'] as const).map(t => (
          <div key={t} className="flex items-center gap-1">
            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: TENSION_COLORS[t] }} />
            <span className="text-[10px] font-mono text-muted-foreground capitalize">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
