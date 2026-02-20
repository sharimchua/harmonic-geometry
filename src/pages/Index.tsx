import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getNoteName } from '@/lib/musicTheory';
import PitchClock from '@/components/PitchClock';
import PianoKeyboard from '@/components/PianoKeyboard';
import GuitarFretboard from '@/components/GuitarFretboard';
import ControlPanel from '@/components/ControlPanel';

const Index = () => {
  const { root, chord, scale, useFlats, activeIntervals } = useHarmony();

  const chordLabel = `${getNoteName(root, useFlats)} ${chord.name}`;
  const scaleLabel = scale ? `${getNoteName(root, useFlats)} ${scale.name}` : 'No scale';
  const intervalStr = activeIntervals.map(i => ((i % 12) + 12) % 12).join('-');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Control Panel */}
      <aside className="w-72 min-w-[280px] border-r border-border bg-surface-1 overflow-y-auto p-4 hidden lg:block">
        <div className="mb-4">
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">
            Harmonic<span className="text-primary">Geometry</span>
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Musical harmony as spatial geometry</p>
        </div>
        <ControlPanel />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-border bg-surface-1 p-3">
          <h1 className="text-base font-mono font-bold text-foreground">
            Harmonic<span className="text-primary">Geometry</span>
          </h1>
        </div>

        {/* Status bar */}
        <div className="border-b border-border bg-surface-2 px-4 py-2 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-note-root" />
            <span className="font-mono text-sm font-semibold text-foreground">{chordLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-note-scale" />
            <span className="font-mono text-xs text-muted-foreground">{scaleLabel}</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">
            intervals: [{intervalStr}]
          </span>
        </div>

        {/* Visualizations */}
        <div className="p-4 space-y-6 max-w-5xl mx-auto">
          {/* Pitch Clock */}
          <section className="bg-surface-1 border border-border rounded-lg p-6">
            <PitchClock />
          </section>

          {/* Piano */}
          <section className="bg-surface-1 border border-border rounded-lg p-4">
            <PianoKeyboard />
          </section>

          {/* Guitar Fretboard */}
          <section className="bg-surface-1 border border-border rounded-lg p-4">
            <GuitarFretboard />
          </section>
        </div>

        {/* Mobile Control Panel */}
        <div className="lg:hidden p-4">
          <details className="bg-surface-1 border border-border rounded-lg">
            <summary className="px-4 py-3 font-mono text-sm text-foreground cursor-pointer">Controls</summary>
            <div className="px-4 pb-4">
              <ControlPanel />
            </div>
          </details>
        </div>
      </main>
    </div>
  );
};

export default Index;
