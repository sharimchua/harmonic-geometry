import React from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getNoteName, type LabelMode } from '@/lib/musicTheory';
import PitchClock from '@/components/PitchClock';
import PianoKeyboard from '@/components/PianoKeyboard';
import GuitarFretboard from '@/components/GuitarFretboard';
import CadenceExplorer from '@/components/CadenceExplorer';
import IntervalRelationshipList from '@/components/IntervalRelationshipList';
import HarmonicContext from '@/components/HarmonicContext';
import ControlPanel from '@/components/ControlPanel';
import StaffNotation from '@/components/StaffNotation';
import ChordSynonyms from '@/components/ChordSynonyms';
import DissonanceSpectrum from '@/components/DissonanceSpectrum';
import { useSectionOrder, type SectionId, type ColumnId } from '@/hooks/useSectionOrder';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Lock, Unlock, Tags } from 'lucide-react';

const SECTION_COMPONENTS: Record<SectionId, React.FC> = {
  context: HarmonicContext,
  intervals: IntervalRelationshipList,
  cadence: CadenceExplorer,
  dissonance: DissonanceSpectrum,
  staff: StaffNotation,
  piano: PianoKeyboard,
  fretboard: GuitarFretboard,
};

const SECTION_LABELS: Record<SectionId, string> = {
  context: 'Harmonic Context',
  intervals: 'Interval Relationships',
  cadence: 'Cadence Explorer',
  dissonance: 'Dissonance Spectrum',
  staff: 'Staff Notation',
  piano: 'Piano',
  fretboard: 'Guitar Fretboard',
};

const Index = () => {
  const { root, scaleTonic, chord, scale, useFlats, activeIntervals, lockMode, setLockMode, labelMode, setLabelMode, functionalAnalysis, midi, midiEnabled } = useHarmony();
  const { order, columns, moveUp, moveDown, moveToColumn } = useSectionOrder();

  const chordLabel = `${getNoteName(root, useFlats)} ${chord.name}`;
  const keyLabel = scale ? `Key of ${getNoteName(scaleTonic, useFlats)} ${scale.name}` : 'No key';
  const intervalStr = activeIntervals.map(i => ((i % 12) + 12) % 12).join('-');

  // For 2-column (xl): use default analysis/instruments split
  const defaultAnalysis: SectionId[] = ['context', 'intervals', 'cadence', 'dissonance'];
  const defaultInstruments: SectionId[] = ['staff', 'piano', 'fretboard'];
  const orderedAnalysis2col = order.filter(id => defaultAnalysis.includes(id));
  const orderedInstruments2col = order.filter(id => defaultInstruments.includes(id));

  // For 3-column (3xl): use user column assignments, cadence is always promoted to col 3
  const nonCadenceSections = order.filter(id => id !== 'cadence');
  const orderedAnalysis3col = nonCadenceSections.filter(id => columns[id] === 'analysis');
  const orderedInstruments3col = nonCadenceSections.filter(id => columns[id] === 'instruments');

  const renderSection = (
    id: SectionId,
    idx: number,
    list: SectionId[],
    showColumnArrows?: { currentCol: ColumnId }
  ) => {
    const Comp = SECTION_COMPONENTS[id];
    const canMoveLeft = showColumnArrows && showColumnArrows.currentCol === 'instruments';
    const canMoveRight = showColumnArrows && showColumnArrows.currentCol === 'analysis';

    return (
      <section key={id} className="bg-surface-1 border border-border rounded-lg p-5 3xl:p-6 shadow-sm relative group">
        <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {/* Cross-column arrows (3xl only, rendered via CSS) */}
          {canMoveLeft && (
            <button
              onClick={() => moveToColumn(id, 'analysis')}
              className="w-5 h-5 rounded flex items-center justify-center bg-surface-3 hover:bg-surface-2 text-muted-foreground hidden 3xl:flex"
              title="Move to Analysis column"
            >
              <ChevronLeft size={12} />
            </button>
          )}
          {canMoveRight && (
            <button
              onClick={() => moveToColumn(id, 'instruments')}
              className="w-5 h-5 rounded flex items-center justify-center bg-surface-3 hover:bg-surface-2 text-muted-foreground hidden 3xl:flex"
              title="Move to Instruments column"
            >
              <ChevronRight size={12} />
            </button>
          )}
          {idx > 0 && (
            <button onClick={() => moveUp(id)} className="w-5 h-5 rounded flex items-center justify-center bg-surface-3 hover:bg-surface-2 text-muted-foreground" title="Move up">
              <ChevronUp size={12} />
            </button>
          )}
          {idx < list.length - 1 && (
            <button onClick={() => moveDown(id)} className="w-5 h-5 rounded flex items-center justify-center bg-surface-3 hover:bg-surface-2 text-muted-foreground" title="Move down">
              <ChevronDown size={12} />
            </button>
          )}
        </div>
        <Comp />
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Control Panel */}
      <aside className="w-72 min-w-[280px] border-r border-border bg-surface-1 overflow-y-auto p-5 hidden lg:flex flex-col flex-shrink-0">
        <div className="mb-6">
          <a href="https://midlifemuso.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group/brand">
            <img src="/images/midlife-muso-icon.webp" alt="Midlife Muso" className="w-9 h-9 rounded-md" />
            <div>
              <h1 className="text-lg font-sans font-bold text-foreground tracking-tight">
                Harmonic<span className="text-primary"> Geometry</span>
              </h1>
              <p className="text-[10px] font-sans text-muted-foreground group-hover/brand:text-primary transition-colors">
                A Midlife Muso Tool
              </p>
            </div>
          </a>
        </div>
        <div className="flex-1">
          <ControlPanel />
        </div>
        {/* Sidebar footer links */}
        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <p className="text-[10px] font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-2">Midlife Muso</p>
          <a href="https://midlifemuso.com" target="_blank" rel="noopener noreferrer" className="block text-xs font-sans text-muted-foreground hover:text-primary transition-colors">
            Home
          </a>
          <a href="https://midlifemuso.com/learning" target="_blank" rel="noopener noreferrer" className="block text-xs font-sans text-muted-foreground hover:text-primary transition-colors">
            Learning Resources
          </a>
          <a href="https://midlifemuso.com/about-me" target="_blank" rel="noopener noreferrer" className="block text-xs font-sans text-muted-foreground hover:text-primary transition-colors">
            About Me
          </a>
          <a href="https://midlifemuso.com/tools" target="_blank" rel="noopener noreferrer" className="block text-xs font-sans text-muted-foreground hover:text-primary transition-colors">
            More Tools
          </a>
          <p className="text-[9px] font-sans text-muted-foreground/60 pt-2">
            Ear-first guitar & piano coaching in Melbourne
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-border bg-surface-1 p-3 flex items-center gap-2.5">
          <a href="https://midlifemuso.com" target="_blank" rel="noopener noreferrer">
            <img src="/images/midlife-muso-icon.webp" alt="Midlife Muso" className="w-7 h-7 rounded-md" />
          </a>
          <div>
            <h1 className="text-base font-sans font-bold text-foreground">
              Harmonic<span className="text-primary"> Geometry</span>
            </h1>
            <p className="text-[9px] font-sans text-muted-foreground">A Midlife Muso Tool</p>
          </div>
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
          {/* Chord synonyms */}
          <ChordSynonyms />
          <div className="flex items-center gap-2 ml-auto">
            {midiEnabled && midi.isConnected && (
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-surface-3 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${midi.heldNotes.length > 0 ? 'bg-primary animate-pulse' : 'bg-green-500'}`} />
                MIDI
              </span>
            )}
            {/* Lock mode toggle */}
            <button
              onClick={() => setLockMode(lockMode === 'scale' ? 'quality' : 'scale')}
              className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                lockMode === 'scale'
                  ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                  : 'bg-accent/15 border-accent/40 text-accent-foreground font-semibold'
              }`}
              title={lockMode === 'scale' ? 'Scale Lock: Click to switch to Quality Lock' : 'Quality Lock: Click to switch to Scale Lock'}
            >
              {lockMode === 'scale' ? <Lock size={12} /> : <Unlock size={12} />}
              {lockMode === 'scale' ? 'Scale Lock' : 'Quality Lock'}
            </button>
            {/* Label mode dropdown */}
            <div className="relative flex items-center">
              <Tags size={12} className="absolute left-2 text-muted-foreground pointer-events-none" />
              <select
                value={labelMode}
                onChange={e => setLabelMode(e.target.value as LabelMode)}
                className="text-xs font-mono bg-surface-3 border border-border text-foreground rounded-md pl-7 pr-6 py-1 appearance-none cursor-pointer hover:bg-surface-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="notes">Notes</option>
                <option value="intervals">Intervals</option>
                <option value="scaleDegrees">Scale °</option>
                <option value="semitones">Semitones</option>
              </select>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              [{intervalStr}]
            </span>
          </div>
        </div>

        <div className="p-4 xl:p-6">

          {/* ── 3xl+: Three-column layout — Analysis | Instruments | Cadence ── */}
          <div className="hidden 3xl:grid 3xl:grid-cols-3 gap-6 items-start">
            {/* LEFT COLUMN: Analysis (Pitch Clock hero + ordered analysis sections) */}
            <div className="flex flex-col gap-6">
              <section className="bg-surface-1 border border-border rounded-lg p-8 shadow-sm">
                <PitchClock />
              </section>
              {orderedAnalysis3col.map((id, i) => renderSection(id, i, orderedAnalysis3col, { currentCol: 'analysis' }))}
            </div>

            {/* CENTER COLUMN: Instruments */}
            <div className="flex flex-col gap-6 sticky top-4">
              {orderedInstruments3col.map((id, i) => renderSection(id, i, orderedInstruments3col, { currentCol: 'instruments' }))}
            </div>

            {/* RIGHT COLUMN: Cadence Explorer (dedicated, always visible) */}
            <div className="flex flex-col gap-6 sticky top-4">
              <section className="bg-surface-1 border border-border rounded-lg p-6 shadow-sm">
                <CadenceExplorer />
              </section>
            </div>
          </div>

          {/* ── xl to 3xl: Two-column layout — Analysis | Instruments ── */}
          <div className="hidden xl:grid 3xl:hidden xl:grid-cols-2 gap-6 items-start">
            {/* LEFT COLUMN: Analysis (Pitch Clock hero + ordered sections) */}
            <div className="flex flex-col gap-6">
              <section className="bg-surface-1 border border-border rounded-lg p-6 shadow-sm">
                <PitchClock />
              </section>
              {orderedAnalysis2col.map((id, i) => renderSection(id, i, orderedAnalysis2col))}
            </div>

            {/* RIGHT COLUMN: Instruments */}
            <div className="flex flex-col gap-6 sticky top-4">
              {orderedInstruments2col.map((id, i) => renderSection(id, i, orderedInstruments2col))}
            </div>
          </div>

          {/* ── Default / mobile / md (below xl): Single column ── */}
          <div className="xl:hidden space-y-5 max-w-5xl mx-auto">
            <section className="bg-surface-1 border border-border rounded-lg p-6 shadow-sm">
              <PitchClock />
            </section>
            {order.map((id, i) => (
              <section key={id} className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm relative group">
                <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {i > 0 && (
                    <button onClick={() => moveUp(id)} className="w-5 h-5 rounded flex items-center justify-center bg-surface-3 hover:bg-surface-2 text-muted-foreground">
                      <ChevronUp size={12} />
                    </button>
                  )}
                  {i < order.length - 1 && (
                    <button onClick={() => moveDown(id)} className="w-5 h-5 rounded flex items-center justify-center bg-surface-3 hover:bg-surface-2 text-muted-foreground">
                      <ChevronDown size={12} />
                    </button>
                  )}
                </div>
                {React.createElement(SECTION_COMPONENTS[id])}
              </section>
            ))}
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden p-4 space-y-4">
          <details className="bg-surface-1 border border-border rounded-lg shadow-sm">
            <summary className="px-4 py-3 font-sans text-sm text-foreground cursor-pointer">Controls</summary>
            <div className="px-4 pb-4">
              <ControlPanel />
            </div>
          </details>
          <div className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm flex items-center gap-3">
            <img src="/images/midlife-muso-icon.webp" alt="Midlife Muso" className="w-8 h-8 rounded-md" />
            <div className="flex-1">
              <p className="text-xs font-sans font-semibold text-foreground">Midlife Muso</p>
              <p className="text-[10px] font-sans text-muted-foreground">Ear-first guitar & piano coaching</p>
            </div>
            <a
              href="https://midlifemuso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-sans font-semibold text-primary hover:text-accent transition-colors px-2.5 py-1.5 rounded bg-surface-3"
            >
              Visit
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
