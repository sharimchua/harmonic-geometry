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
  const { root, scaleTonic, chord, scale, useFlats, activeIntervals, lockMode, functionalAnalysis, midi, midiEnabled } = useHarmony();

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
            {midiEnabled && midi.isConnected && (
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-surface-3 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${midi.heldNotes.length > 0 ? 'bg-primary animate-pulse' : 'bg-green-500'}`} />
                MIDI
              </span>
            )}
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-surface-3">
              {lockMode === 'scale' ? '🔒 Scale' : '🔒 Quality'}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              [{intervalStr}]
            </span>
          </div>
        </div>

        <div className="p-4 xl:p-6">
          {/* ── xl+: Two-column layout — Analysis | Instruments ── */}
          <div className="hidden xl:grid xl:grid-cols-2 3xl:grid-cols-[1fr_1fr] gap-6 3xl:gap-8 items-start">
            {/* LEFT COLUMN: Analysis (Pitch Clock hero + Context + Intervals + Cadence) */}
            <div className="flex flex-col gap-6 3xl:gap-8">
              {/* Pitch Clock — hero placement, generous padding */}
              <section className="bg-surface-1 border border-border rounded-lg p-6 3xl:p-10 shadow-sm">
                <PitchClock />
              </section>

              {/* Harmonic Context */}
              <section className="bg-surface-1 border border-border rounded-lg p-5 3xl:p-8 shadow-sm">
                <HarmonicContext />
              </section>

              {/* Interval Relationships */}
              <section className="bg-surface-1 border border-border rounded-lg p-5 3xl:p-8 shadow-sm">
                <IntervalRelationshipList />
              </section>

              {/* Cadence Explorer */}
              <section className="bg-surface-1 border border-border rounded-lg p-5 3xl:p-8 shadow-sm">
                <CadenceExplorer />
              </section>
            </div>

            {/* RIGHT COLUMN: Instruments (Staff + Piano + Fretboard) */}
            <div className="flex flex-col gap-6 3xl:gap-8 sticky top-4">
              <section className="bg-surface-1 border border-border rounded-lg p-5 3xl:p-8 shadow-sm">
                <StaffNotation />
              </section>
              <section className="bg-surface-1 border border-border rounded-lg p-5 3xl:p-8 shadow-sm">
                <PianoKeyboard />
              </section>
              <section className="bg-surface-1 border border-border rounded-lg p-5 3xl:p-8 shadow-sm">
                <GuitarFretboard />
              </section>
            </div>
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

            <section className="bg-surface-1 border border-border rounded-lg p-5 shadow-sm">
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
