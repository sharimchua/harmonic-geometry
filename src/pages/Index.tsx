import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getNoteName } from '@/lib/musicTheory';
import PitchClock from '@/components/PitchClock';
import PianoKeyboard from '@/components/PianoKeyboard';
import GuitarFretboard from '@/components/GuitarFretboard';
import CadenceExplorer from '@/components/CadenceExplorer';
import IntervalRelationshipList from '@/components/IntervalRelationshipList';
import HarmonicContext from '@/components/HarmonicContext';
import ControlPanel from '@/components/ControlPanel';
import StaffNotation from '@/components/StaffNotation';

const Index = () => {
  const { root, scaleTonic, chord, scale, useFlats, activeIntervals, lockMode, functionalAnalysis } = useHarmony();

  const chordLabel = `${getNoteName(root, useFlats)} ${chord.name}`;
  const keyLabel = scale ? `Key of ${getNoteName(scaleTonic, useFlats)} ${scale.name}` : 'No key';
  const intervalStr = activeIntervals.map(i => ((i % 12) + 12) % 12).join('-');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Control Panel */}
      <aside className="w-72 min-w-[280px] border-r border-border bg-surface-1 overflow-y-auto p-5 hidden lg:block flex-shrink-0">
        <div className="mb-6">
          <h1 className="text-lg font-sans font-bold text-foreground tracking-tight">
            Harmonic<span className="text-primary"> Geometry</span>
          </h1>
          <p className="text-[11px] font-sans text-muted-foreground mt-1">Learn music like a language</p>
        </div>
        <ControlPanel />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-border bg-surface-1 p-3">
          <h1 className="text-base font-sans font-bold text-foreground">
            Harmonic<span className="text-primary"> Geometry</span>
          </h1>
        </div>

        {/* Status bar */}
        <div className="border-b border-border bg-surface-2 px-4 py-2.5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-note-root" />
            <span className="font-sans text-sm font-semibold text-foreground">{chordLabel}</span>
            {functionalAnalysis.isDiatonic && (
              <span className="font-mono text-xs text-primary font-bold">{functionalAnalysis.degreeName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-sans text-xs text-muted-foreground">{keyLabel}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-surface-3">
              {lockMode === 'scale' ? '🔒 Scale' : '🔒 Quality'}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              [{intervalStr}]
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            RESPONSIVE LAYOUT
            
            Default (mobile):     Single column, everything stacked
            xl  (1280px+):        Pitch Clock | Intervals + Cadence  (2 col)
            2xl (1536px+):        Pitch Clock (large center) | Right sidebar (Context + Intervals + Cadence)
                                  Below: Staff + Piano + Guitar in 2-col grid
            3xl (1920px+):        3-column: Context+Staff | Pitch Clock | Intervals+Cadence
                                  Below: Piano + Guitar side by side
           ═══════════════════════════════════════════════ */}

        <div className="p-4 3xl:p-6">
          {/* ── 3xl: Three-column hero row ── */}
          <div className="hidden 3xl:grid 3xl:grid-cols-[320px_1fr_360px] gap-5 items-start mb-5">
            {/* Left column: Context + Staff */}
            <div className="flex flex-col gap-5 sticky top-4">
              <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                <HarmonicContext />
              </section>
              <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                <StaffNotation />
              </section>
            </div>

            {/* Center: Pitch Clock — hero placement */}
            <section className="bg-surface-1 border border-border rounded-lg p-6 shadow-sm sticky top-4">
              <PitchClock />
            </section>

            {/* Right column: Intervals + Cadence */}
            <div className="flex flex-col gap-5 sticky top-4">
              <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                <IntervalRelationshipList />
              </section>
              <section className="bg-surface-1 border border-border rounded-lg p-5 shadow-sm overflow-y-auto max-h-[420px]">
                <CadenceExplorer />
              </section>
            </div>
          </div>

          {/* 3xl: Instruments row — side by side */}
          <div className="hidden 3xl:grid 3xl:grid-cols-2 gap-5">
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <PianoKeyboard />
            </section>
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <GuitarFretboard />
            </section>
          </div>

          {/* ── 2xl (not 3xl): Two-column layout ── */}
          <div className="hidden 2xl:grid 3xl:hidden 2xl:grid-cols-[1fr_340px] gap-5 items-start mb-5">
            {/* Left: Context + Pitch Clock */}
            <div className="flex flex-col gap-5">
              <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                <HarmonicContext />
              </section>
              <section className="bg-surface-1 border border-border rounded-lg p-6 shadow-sm sticky top-4">
                <PitchClock />
              </section>
            </div>

            {/* Right sidebar: Intervals + Cadence + Staff */}
            <div className="flex flex-col gap-5 sticky top-4">
              <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                <IntervalRelationshipList />
              </section>
              <section className="bg-surface-1 border border-border rounded-lg p-5 shadow-sm overflow-y-auto max-h-[360px]">
                <CadenceExplorer />
              </section>
              <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                <StaffNotation />
              </section>
            </div>
          </div>

          {/* 2xl (not 3xl): Instruments row */}
          <div className="hidden 2xl:grid 3xl:hidden 2xl:grid-cols-2 gap-5">
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <PianoKeyboard />
            </section>
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <GuitarFretboard />
            </section>
          </div>

          {/* ── xl (not 2xl): Original 2-col layout ── */}
          <div className="hidden xl:block 2xl:hidden space-y-5 max-w-5xl mx-auto">
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <HarmonicContext />
            </section>

            <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
              <section className="bg-surface-1 border border-border rounded-lg p-6 shadow-sm sticky top-4">
                <PitchClock />
              </section>
              <div className="flex flex-col gap-5">
                <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                  <IntervalRelationshipList />
                </section>
                <section className="bg-surface-1 border border-border rounded-lg p-5 shadow-sm overflow-y-auto max-h-[420px]">
                  <CadenceExplorer />
                </section>
              </div>
            </div>

            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <StaffNotation />
            </section>
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <PianoKeyboard />
            </section>
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <GuitarFretboard />
            </section>
          </div>

          {/* ── Default / mobile / md (below xl): Single column ── */}
          <div className="xl:hidden space-y-5 max-w-5xl mx-auto">
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <HarmonicContext />
            </section>

            <section className="bg-surface-1 border border-border rounded-lg p-6 shadow-sm">
              <PitchClock />
            </section>

            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <IntervalRelationshipList />
            </section>

            <section className="bg-surface-1 border border-border rounded-lg p-5 shadow-sm overflow-y-auto max-h-[420px]">
              <CadenceExplorer />
            </section>

            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <StaffNotation />
            </section>
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <PianoKeyboard />
            </section>
            <section className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
              <GuitarFretboard />
            </section>
          </div>
        </div>

        {/* Mobile Control Panel */}
        <div className="lg:hidden p-4">
          <details className="bg-surface-1 border border-border rounded-lg shadow-sm">
            <summary className="px-4 py-3 font-sans text-sm text-foreground cursor-pointer">Controls</summary>
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
