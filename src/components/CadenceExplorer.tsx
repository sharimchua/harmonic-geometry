import React, { useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getCadenceSuggestions,
  CADENCE_CATEGORY_META,
  getNoteName,
  type CadenceCategory,
  type CadenceOption,
} from '@/lib/musicTheory';

export default function CadenceExplorer() {
  const { root, useFlats, setRoot, setChord, setScaleTonic } = useHarmony();

  const suggestions = useMemo(
    () => getCadenceSuggestions(root, useFlats),
    [root, useFlats],
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
    // If the cadence implies resolution to tonic, update scale tonic too
    if (option.suggestion.resTonic) {
      setScaleTonic(root);
    }
    setChord(option.targetChord);
    setRoot(option.targetRoot);
  };

  const currentLabel = getNoteName(root, useFlats);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">
          Cadence Explorer
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          from {currentLabel}
        </span>
      </div>

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
