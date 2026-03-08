import React, { useMemo, useState } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getCadenceSuggestions,
  CADENCE_CATEGORY_META,
  getNoteName,
  type CadenceCategory,
  type CadenceOption,
  type CadenceDirection,
} from '@/lib/musicTheory';

export default function CadenceExplorer() {
  const {
    root, chord, useFlats, setRoot, setChord, setScaleTonic,
    cadenceMode, setCadenceMode, lockedRoot, lockedChord,
  } = useHarmony();
  const [direction, setDirection] = useState<CadenceDirection>('leadTo');

  const suggestions = useMemo(
    () => getCadenceSuggestions(root, chord.name, direction, useFlats),
    [root, chord.name, direction, useFlats],
  );

  const grouped = useMemo(() => {
    const map: Record<CadenceCategory, CadenceOption[]> = {
      resolution: [],
      surprise: [],
      journey: [],
    };
    for (const s of suggestions) {
      map[s.suggestion.category].push(s);
    }
    return map;
  }, [suggestions]);

  const handleSelect = (option: CadenceOption) => {
    if (option.suggestion.resTonic) {
      setScaleTonic(option.targetRoot);
    }
    setChord(option.targetChord);
    setRoot(option.targetRoot);
  };

  const currentLabel = `${getNoteName(root, useFlats)} ${chord.name}`;
  const lockedLabel = lockedRoot !== null && lockedChord
    ? `${getNoteName(lockedRoot, useFlats)} ${lockedChord.name}`
    : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">
          Cadence Explorer
        </h3>
        <div className="flex items-center gap-2">
          {cadenceMode && (
            <span className="text-[10px] font-mono text-muted-foreground">
              🔒 {lockedLabel} → {currentLabel}
            </span>
          )}
          <button
            onClick={() => setCadenceMode(!cadenceMode)}
            className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
              cadenceMode
                ? 'bg-primary/20 border-primary text-primary font-semibold'
                : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {cadenceMode ? '🎯 Cadence ON' : '🎯 Cadence'}
          </button>
        </div>
      </div>

      {cadenceMode && (
        <div className="bg-surface-3 border border-border rounded-lg p-3 space-y-2">
          <p className="text-[11px] font-sans text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Cadence Mode</span> — The pitch clock shows 
            voice leading from <span className="font-mono text-primary">{lockedLabel}</span> to the 
            current harmony. Select a suggestion below or change the chord manually to explore voice leading.
          </p>
        </div>
      )}

      {/* Direction Toggle */}
      <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
        {([
          ['leadTo', 'Lead To →', 'Where to go next'] as const,
          ['comeFrom', '← Come From', 'What leads here'] as const,
        ]).map(([dir, label, title]) => (
          <button
            key={dir}
            onClick={() => setDirection(dir)}
            title={title}
            className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-sans transition-all ${
              direction === dir
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {suggestions.length === 0 && (
        <p className="text-[11px] font-sans text-muted-foreground italic text-center py-3">
          No common cadences for this chord quality in this direction.
        </p>
      )}

      {(Object.keys(grouped) as CadenceCategory[]).map(cat => {
        const meta = CADENCE_CATEGORY_META[cat];
        const options = grouped[cat];
        if (options.length === 0) return null;

        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">{meta.icon}</span>
              <h4 className="text-xs font-sans font-semibold text-foreground tracking-wide">
                {meta.title}
              </h4>
            </div>

            <div className="space-y-1.5">
              {options.map(option => (
                <button
                  key={option.suggestion.name}
                  onClick={() => handleSelect(option)}
                  className="w-full text-left group rounded-lg border border-border bg-surface-2 hover:border-primary/50 hover:bg-surface-3 transition-colors p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {option.suggestion.label}
                      </span>
                      <span className="text-[10px] font-sans text-muted-foreground">
                        {option.suggestion.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-foreground font-semibold group-hover:text-primary transition-colors">
                      {option.displayName}
                    </span>
                  </div>

                  <p className="text-[11px] font-sans text-muted-foreground leading-relaxed">
                    {option.suggestion.description}
                  </p>

                  <p className="text-[10px] font-mono text-muted-foreground/60 mt-1 italic">
                    🎵 {option.suggestion.songExample}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
