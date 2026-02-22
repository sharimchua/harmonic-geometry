import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getNoteName, getIntervalName, getIntervalTension, type IntervalTension } from '@/lib/musicTheory';

/** Map raw tension categories to PRD pedagogical labels */
const TENSION_LABEL: Record<IntervalTension, string> = {
  perfect: 'Identity / Foundations',
  consonant: 'Sweetness',
  mild: 'Texture',
  dissonant: 'Crunch',
  tritone: 'Crunch',
};

const TENSION_COLOR: Record<IntervalTension, string> = {
  perfect: 'hsl(160, 50%, 42%)',
  consonant: 'hsl(190, 45%, 45%)',
  mild: 'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone: 'hsl(340, 60%, 50%)',
};

const TENSION_DESCRIPTION: Record<IntervalTension, string> = {
  perfect: 'Open and stable — the skeleton of the chord',
  consonant: 'Warm and pleasing — the beauty of the chord',
  mild: 'Adds color and movement without sharp tension',
  dissonant: 'Sharp tension that demands attention or resolution',
  tritone: 'Maximum instability — the engine of resolution',
};

export default function IntervalRelationshipList() {
  const { activePitchClasses, root, useFlats, activeIntervals } = useHarmony();

  // Build ordered pairs ascending from lowest note in the voicing
  // Use activeIntervals to respect inversion ordering
  const orderedPcs = activeIntervals.map(i => ((root + i) % 12 + 12) % 12);

  // Generate all adjacent + non-adjacent pairs in voicing order
  const pairs: { from: number; to: number; semitones: number; tension: IntervalTension }[] = [];
  for (let i = 0; i < orderedPcs.length; i++) {
    for (let j = i + 1; j < orderedPcs.length; j++) {
      const semitones = ((orderedPcs[j] - orderedPcs[i]) % 12 + 12) % 12;
      pairs.push({
        from: orderedPcs[i],
        to: orderedPcs[j],
        semitones,
        tension: getIntervalTension(semitones),
      });
    }
  }

  if (pairs.length === 0) return null;

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
        Interval Relationships
      </h3>

      <div className="space-y-1.5">
        {pairs.map((pair, i) => {
          const fromName = getNoteName(pair.from, useFlats);
          const toName = getNoteName(pair.to, useFlats);
          const intervalName = getIntervalName(pair.semitones);
          const label = TENSION_LABEL[pair.tension];
          const color = TENSION_COLOR[pair.tension];
          const desc = TENSION_DESCRIPTION[pair.tension];

          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 group hover:border-primary/30 transition-colors"
            >
              {/* Tension color bar */}
              <div
                className="w-1 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />

              {/* Note pair */}
              <div className="flex items-center gap-1.5 min-w-[72px]">
                <span className="font-mono text-xs font-semibold text-foreground">{fromName}</span>
                <span className="text-[10px] text-muted-foreground">→</span>
                <span className="font-mono text-xs font-semibold text-foreground">{toName}</span>
              </div>

              {/* Interval badge */}
              <span
                className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {intervalName}
              </span>

              {/* Semitone count */}
              <span className="text-[10px] font-mono text-muted-foreground">
                {pair.semitones}st
              </span>

              {/* Pedagogical label */}
              <span className="text-[10px] font-sans text-muted-foreground ml-auto hidden sm:inline" title={desc}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {(['perfect', 'consonant', 'mild', 'dissonant', 'tritone'] as const).map(t => (
          <div key={t} className="flex items-center gap-1" title={TENSION_DESCRIPTION[t]}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TENSION_COLOR[t] }} />
            <span className="text-[9px] font-mono text-muted-foreground">{TENSION_LABEL[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
