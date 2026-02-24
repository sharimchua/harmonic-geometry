import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';

export default function HarmonicContext() {
  const { functionalAnalysis, chordVibe } = useHarmony();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">
        Harmonic Context
      </h3>
      <div className="bg-surface-2 border border-border rounded-md p-4 space-y-3">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Character</p>
          <p className="text-sm font-sans text-foreground leading-relaxed">{chordVibe}</p>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-base font-mono font-bold ${functionalAnalysis.isDiatonic ? 'text-primary' : 'text-muted-foreground'}`}>
              {functionalAnalysis.degreeName}
            </span>
            <span className="text-xs font-sans text-muted-foreground">
              {functionalAnalysis.functionName}
            </span>
          </div>
          <p className="text-xs font-sans text-muted-foreground leading-relaxed">
            {functionalAnalysis.description}
          </p>
        </div>
      </div>
    </div>
  );
}
