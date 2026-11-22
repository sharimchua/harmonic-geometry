import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getNoteName,
  getIntervalName,
  getIntervalTension,
  getJustIntervalSpec,
  FULL_INTERVAL_NAMES,
  TENSION_COLORS,
  type IntervalTension,
} from '@/lib/musicTheory';

/** Map raw tension categories to PRD pedagogical labels */
const TENSION_LABEL: Record<IntervalTension, string> = {
  perfect: 'Identity / Foundations',
  consonant: 'Sweetness',
  mild: 'Texture',
  dissonant: 'Crunch',
  tritone: 'Crunch',
};

const TENSION_COLOR = TENSION_COLORS;

const TENSION_DESCRIPTION: Record<IntervalTension, string> = {
  perfect: 'Open and stable — the skeleton of the chord',
  consonant: 'Warm and pleasing — the beauty of the chord',
  mild: 'Adds color and movement without sharp tension',
  dissonant: 'Sharp tension that demands attention or resolution',
  tritone: 'Maximum instability — the engine of resolution',
};

// Group key for deduplication (dissonant & tritone both = Crunch)
const TENSION_GROUP: Record<IntervalTension, string> = {
  perfect: 'perfect',
  consonant: 'consonant',
  mild: 'mild',
  dissonant: 'dissonant',
  tritone: 'dissonant',
};

interface PairInfo {
  from: number;
  to: number;
  semitones: number;
  tension: IntervalTension;
}

export default function IntervalRelationshipList() {
  const { root, useFlats, activeIntervals, labelMode } = useHarmony();
  const useTri = labelMode === 'tri';

  // Deduplicate ordered pitch classes so octave-doubled extensions don't produce unison 0-semitone self-pairs
  const orderedPcs = [...new Set(activeIntervals.map(i => ((root + i) % 12 + 12) % 12))];

  const pairs: PairInfo[] = [];
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

  if (pairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-2xl mb-2">🎵</span>
        <p className="text-sm text-muted-foreground italic">
          A single note stands alone — add another to create an interval.
        </p>
      </div>
    );
  }

  // Group pairs by tension category
  const groupOrder: IntervalTension[] = ['perfect', 'consonant', 'mild', 'dissonant', 'tritone'];
  const groups = groupOrder
    .map(t => ({
      tension: t,
      label: TENSION_LABEL[t],
      color: TENSION_COLOR[t],
      desc: TENSION_DESCRIPTION[t],
      pairs: pairs.filter(p => p.tension === t),
    }))
    .filter(g => g.pairs.length > 0);

  // Merge dissonant + tritone into one visual group
  const mergedGroups: typeof groups = [];
  for (const g of groups) {
    const groupKey = TENSION_GROUP[g.tension];
    const existing = mergedGroups.find(mg => TENSION_GROUP[mg.tension] === groupKey);
    if (existing) {
      existing.pairs.push(...g.pairs);
    } else {
      mergedGroups.push({ ...g, pairs: [...g.pairs] });
    }
  }

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
        Interval Relationships
      </h3>

      <div className="space-y-4">
        {mergedGroups.map(group => (
          <div key={group.tension}>
            {/* Tension category header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
              <span className="text-xs font-sans font-semibold" style={{ color: group.color }}>
                {group.label}
              </span>
              <span className="text-[10px] font-sans text-muted-foreground italic hidden sm:inline">
                — {group.desc}
              </span>
            </div>

            <div className="space-y-1.5 pl-5">
              {group.pairs.map((pair, i) => {
                const fromName = getNoteName(pair.from, useFlats, useTri);
                const toName = getNoteName(pair.to, useFlats, useTri);
                const intervalAbbr = getIntervalName(pair.semitones);
                const intervalFull = FULL_INTERVAL_NAMES[intervalAbbr] || intervalAbbr;
                const color = TENSION_COLOR[pair.tension];
                const jiSpec = getJustIntervalSpec(pair.semitones);

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2 group/row hover:border-primary/30 transition-colors flex-wrap"
                  >
                    {/* Tension color bar */}
                    <div
                      className="w-1 h-7 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />

                    {/* Note pair */}
                    <div className="flex items-center gap-1.5 min-w-[68px]">
                      <span className="font-mono text-sm font-semibold text-foreground">{fromName}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="font-mono text-sm font-semibold text-foreground">{toName}</span>
                    </div>

                    {/* Interval badge with abbreviation */}
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${color}22`, color }}
                      title={intervalFull}
                    >
                      {intervalAbbr}
                    </span>

                    {/* Full interval name */}
                    <span className="text-xs font-sans text-muted-foreground hidden sm:inline">
                      {intervalFull}
                    </span>

                    {/* PPT Just Ratio & Prime Family badge */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 text-foreground"
                        title={`Just Intonation Ratio: ${jiSpec.ratioLabel} (${jiSpec.justCents}¢, 12-TET offset: ${jiSpec.edoErrorCents > 0 ? '+' : ''}${jiSpec.edoErrorCents}¢)`}
                      >
                        {jiSpec.ratioLabel}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold hidden md:inline"
                        style={{ backgroundColor: `${jiSpec.primeColor}20`, color: jiSpec.primeColor }}
                        title={`Prime Family: ${jiSpec.primeFamily} (${jiSpec.primeLimit}-limit)`}
                      >
                        {jiSpec.primeFamily}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground min-w-[36px] text-right">
                        {pair.semitones} st
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {(['perfect', 'consonant', 'mild', 'dissonant', 'tritone'] as const).map(t => (
          <div key={t} className="flex items-center gap-1.5" title={TENSION_DESCRIPTION[t]}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TENSION_COLOR[t] }} />
            <span className="text-[10px] font-mono text-muted-foreground">{TENSION_LABEL[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
