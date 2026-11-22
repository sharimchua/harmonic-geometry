import React, { useMemo, useCallback } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getLabel,
  getIntervalTension,
  TENSION_COLORS,
  TENSION_WIDTHS,
  SOLFEGE_COLORS,
  encodePianoTriangles,
  PITCH_CLASS_TO_PIANO_TRIANGLE,
  PIANO_TRIANGLE_META,
  type PianoTriangleType,
} from '@/lib/musicTheory';

const WHITE_KEY_PCS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_PCS = [1, 3, 6, 8, 10];
const OCTAVES = 3;
const START_OCTAVE = 3;

const PianoKeyboard = React.memo(function PianoKeyboard() {
  const {
    root, setRoot, scaleTonic,
    activeIntervals, activePitchClasses, scalePitchClasses,
    labelMode, useFlats,
    pptSolfegeColors, showPianoTriangles, setShowPianoTriangles,
    playNote,
  } = useHarmony();

  const useSolfegePalette = pptSolfegeColors;

  // Memoize key arrays
  const { whiteKeys, blackKeys } = useMemo(() => {
    const k: { pc: number; octave: number; isBlack: boolean; midi: number }[] = [];
    for (let oct = START_OCTAVE; oct < START_OCTAVE + OCTAVES; oct++) {
      for (let pc = 0; pc < 12; pc++) {
        k.push({ pc, octave: oct, isBlack: BLACK_KEY_PCS.includes(pc), midi: oct * 12 + pc });
      }
    }
    return {
      keys: k,
      whiteKeys: k.filter(key => !key.isBlack),
      blackKeys: k.filter(key => key.isBlack),
    };
  }, []);

  const voicingMidiNotes = useMemo(() => {
    const span = activeIntervals.length > 0 ? Math.max(...activeIntervals) - Math.min(...activeIntervals) : 0;
    const visibleLow = START_OCTAVE * 12;
    const visibleHigh = (START_OCTAVE + OCTAVES) * 12 - 1;
    let baseMidi = 48 + root;
    while (baseMidi + span > visibleHigh && baseMidi > visibleLow) baseMidi -= 12;
    while (baseMidi + Math.min(...activeIntervals) < visibleLow) baseMidi += 12;
    return activeIntervals.map(interval => baseMidi + interval);
  }, [root, activeIntervals]);

  const sortedVoicingMidis = useMemo(() => [...voicingMidiNotes].sort((a, b) => a - b), [voicingMidiNotes]);
  const triangleEncoding = useMemo(() => encodePianoTriangles(sortedVoicingMidis), [sortedVoicingMidis]);

  const isVoicingNote = useCallback((midi: number) => voicingMidiNotes.includes(midi), [voicingMidiNotes]);

  const whiteKeyWidth = 32;
  const whiteKeyHeight = 120;
  const blackKeyWidth = 20;
  const blackKeyHeight = 72;
  const totalWidth = whiteKeys.length * whiteKeyWidth;
  const stackHeight = Math.max(40, (voicingMidiNotes.length - 1) * 12 + 20);

  const getBlackKeyX = useCallback((pc: number, octave: number) => {
    const prevWhitePc = WHITE_KEY_PCS.filter(w => w < pc).pop()!;
    const prevWhiteIdx = whiteKeys.findIndex(w => w.pc === prevWhitePc && w.octave === octave);
    return prevWhiteIdx * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
  }, [whiteKeys]);

  const getMidiX = useCallback((midi: number) => {
    const pc = midi % 12;
    const octave = Math.floor(midi / 12);
    const isBlack = BLACK_KEY_PCS.includes(pc);
    if (isBlack) {
      return getBlackKeyX(pc, octave) + blackKeyWidth / 2;
    } else {
      const idx = whiteKeys.findIndex(w => w.pc === pc && w.octave === octave);
      if (idx === -1) return -1;
      return idx * whiteKeyWidth + whiteKeyWidth / 2;
    }
  }, [whiteKeys, getBlackKeyX]);

  const getMidiY = useCallback((midi: number) => {
    const pc = midi % 12;
    return BLACK_KEY_PCS.includes(pc) ? 38 : 92;
  }, []);

  // Build geometric Piano Triangle overlay instances across the 3 octaves
  const triangleOverlays = useMemo(() => {
    if (!showPianoTriangles) return [];
    const instances: {
      type: PianoTriangleType;
      color: string;
      pts: { midi: number; x: number; y: number; active: boolean; ptNum: number }[];
    }[] = [];

    const minMidi = START_OCTAVE * 12;
    const maxMidi = (START_OCTAVE + OCTAVES) * 12 - 1;

    // Each triangle starts at C# (1), E (4), G (7), A# (10)
    const starts: { offset: number; type: PianoTriangleType }[] = [
      { offset: 1, type: 'D' },
      { offset: 4, type: 'L' },
      { offset: 7, type: 'U' },
      { offset: 10, type: 'R' },
    ];

    for (let oct = START_OCTAVE; oct < START_OCTAVE + OCTAVES; oct++) {
      for (const st of starts) {
        const m1 = oct * 12 + st.offset;
        const m2 = m1 + 1;
        const m3 = m1 + 2;
        if (m1 < minMidi || m3 > maxMidi) continue;
        const x1 = getMidiX(m1);
        const x2 = getMidiX(m2);
        const x3 = getMidiX(m3);
        if (x1 === -1 || x2 === -1 || x3 === -1) continue;

        instances.push({
          type: st.type,
          color: PIANO_TRIANGLE_META[st.type].color,
          pts: [
            { midi: m1, x: x1, y: getMidiY(m1), active: isVoicingNote(m1), ptNum: 1 },
            { midi: m2, x: x2, y: getMidiY(m2), active: isVoicingNote(m2), ptNum: 2 },
            { midi: m3, x: x3, y: getMidiY(m3), active: isVoicingNote(m3), ptNum: 3 },
          ],
        });
      }
    }
    return instances;
  }, [showPianoTriangles, getMidiX, getMidiY, isVoicingNote]);

  const intervalPairs = useMemo(() => {
    const pairs: { fromX: number; toX: number; tension: string; semitones: number }[] = [];
    for (let i = 0; i < sortedVoicingMidis.length; i++) {
      for (let j = i + 1; j < sortedVoicingMidis.length; j++) {
        const fromX = getMidiX(sortedVoicingMidis[i]);
        const toX = getMidiX(sortedVoicingMidis[j]);
        if (fromX === -1 || toX === -1) continue;
        const semitones = ((sortedVoicingMidis[j] - sortedVoicingMidis[i]) % 12 + 12) % 12;
        const tension = getIntervalTension(semitones);
        pairs.push({ fromX, toX, tension, semitones });
      }
    }
    return pairs;
  }, [sortedVoicingMidis, getMidiX]);

  const handleKeyClick = (pc: number, midi: number) => {
    if (!audioEnabled) {
      playNote(midi + 12); // Sound individual note when auto-play chord is off
    }
    setRoot(pc);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">Piano</h3>
          {triangleEncoding && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-border text-primary font-semibold"
              title="PPT Piano Triangle Voicing Encoding (D=Down, L=Left, U=Up, R=Right)"
            >
              △ {triangleEncoding}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowPianoTriangles(!showPianoTriangles)}
          className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
            showPianoTriangles
              ? 'bg-primary/20 border-primary text-primary font-semibold'
              : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
          }`}
          title="Overlay Prime Period Theory Piano Triangles (D / L / U / R)"
        >
          {showPianoTriangles ? '△ Triangles ON' : '△ Piano Triangles'}
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <svg
          width={totalWidth}
          height={whiteKeyHeight + stackHeight + 10}
          className="mx-auto block"
          role="img"
          aria-label="Piano keyboard showing active chord voicing"
        >
          {/* White keys */}
          {whiteKeys.map((key, i) => {
            const isExactVoicing = isVoicingNote(key.midi);
            const isPitchClassActive = activePitchClasses.includes(key.pc);
            const isRoot = key.pc === root;
            const isInScale = scalePitchClasses.includes(key.pc);
            const relToTonic = ((key.pc - scaleTonic) % 12 + 12) % 12;
            const solfegeHex = SOLFEGE_COLORS[relToTonic];

            let fill = 'hsl(30, 8%, 88%)';
            if (isInScale) fill = 'hsl(30, 12%, 78%)';
            if (useSolfegePalette) {
              if (isPitchClassActive && !isExactVoicing) fill = `${solfegeHex}66`;
              if (isExactVoicing) fill = relToTonic === 6 ? '#38BDF8' : solfegeHex;
            } else {
              if (isPitchClassActive && !isExactVoicing) fill = 'hsl(28, 40%, 75%)';
              if (isExactVoicing) fill = 'hsl(28, 65%, 68%)';
              if (isExactVoicing && isRoot) fill = 'hsl(32, 85%, 58%)';
            }

            return (
              <g
                key={key.midi}
                onClick={() => handleKeyClick(key.pc, key.midi)}
                className="cursor-pointer"
                role="button"
                aria-label={`Piano key ${getLabel(key.pc, root, labelMode, useFlats, scaleTonic)}`}
              >
                <rect
                  x={i * whiteKeyWidth} y={0}
                  width={whiteKeyWidth - 1} height={whiteKeyHeight}
                  fill={fill}
                  stroke="hsl(30, 5%, 22%)"
                  strokeWidth="1"
                  rx={2}
                />
                {isExactVoicing && (
                  <text
                    x={i * whiteKeyWidth + whiteKeyWidth / 2} y={whiteKeyHeight - 10}
                    textAnchor="middle" fontSize={9}
                    fontFamily="'JetBrains Mono', monospace"
                    fill={useSolfegePalette ? '#ffffff' : 'hsl(0, 0%, 10%)'} fontWeight={700}
                  >
                    {getLabel(key.pc, root, labelMode, useFlats, scaleTonic)}
                  </text>
                )}
                {isPitchClassActive && !isExactVoicing && (
                  <text
                    x={i * whiteKeyWidth + whiteKeyWidth / 2} y={whiteKeyHeight - 10}
                    textAnchor="middle" fontSize={8}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="hsl(30, 15%, 35%)" fontWeight={500}
                    opacity={0.75}
                  >
                    {getLabel(key.pc, root, labelMode, useFlats, scaleTonic)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Black keys */}
          {blackKeys.map(key => {
            const x = getBlackKeyX(key.pc, key.octave);
            const isExactVoicing = isVoicingNote(key.midi);
            const isPitchClassActive = activePitchClasses.includes(key.pc);
            const isRoot = key.pc === root;
            const isInScale = scalePitchClasses.includes(key.pc);
            const relToTonic = ((key.pc - scaleTonic) % 12 + 12) % 12;
            const solfegeHex = SOLFEGE_COLORS[relToTonic];

            let fill = 'hsl(0, 0%, 12%)';
            if (isInScale) fill = 'hsl(30, 10%, 22%)';
            if (useSolfegePalette) {
              if (isPitchClassActive && !isExactVoicing) fill = `${solfegeHex}66`;
              if (isExactVoicing) fill = relToTonic === 6 ? '#38BDF8' : solfegeHex;
            } else {
              if (isPitchClassActive && !isExactVoicing) fill = 'hsl(28, 35%, 28%)';
              if (isExactVoicing) fill = 'hsl(28, 70%, 38%)';
              if (isExactVoicing && isRoot) fill = 'hsl(32, 80%, 42%)';
            }

            return (
              <g
                key={key.midi}
                onClick={() => handleKeyClick(key.pc, key.midi)}
                className="cursor-pointer"
                role="button"
                aria-label={`Piano key ${getLabel(key.pc, root, labelMode, useFlats, scaleTonic)}`}
              >
                <rect
                  x={x} y={0}
                  width={blackKeyWidth} height={blackKeyHeight}
                  fill={fill}
                  stroke="hsl(0, 0%, 8%)"
                  strokeWidth="1"
                  rx={2}
                />
                {isExactVoicing && (
                  <text
                    x={x + blackKeyWidth / 2} y={blackKeyHeight - 8}
                    textAnchor="middle" fontSize={8}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="#ffffff" fontWeight={700}
                  >
                    {getLabel(key.pc, root, labelMode, useFlats, scaleTonic)}
                  </text>
                )}
              </g>
            );
          })}

          {/* PPT Piano Triangles Overlay */}
          {showPianoTriangles && triangleOverlays.map((tri, idx) => {
            const hasActive = tri.pts.some(p => p.active);
            const pathD = `M ${tri.pts[0].x},${tri.pts[0].y} L ${tri.pts[1].x},${tri.pts[1].y} L ${tri.pts[2].x},${tri.pts[2].y} Z`;
            return (
              <g key={`tri-${idx}`} className="pointer-events-none">
                <path
                  d={pathD}
                  fill={hasActive ? `${tri.color}28` : 'transparent'}
                  stroke={tri.color}
                  strokeWidth={hasActive ? 2.2 : 1.2}
                  strokeOpacity={hasActive ? 0.9 : 0.35}
                  strokeLinejoin="round"
                />
                {tri.pts.map(p => (
                  <g key={p.midi}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={p.active ? 7 : 4.5}
                      fill={p.active ? tri.color : 'rgba(15, 23, 42, 0.7)'}
                      stroke="#ffffff"
                      strokeWidth={p.active ? 1.5 : 0.8}
                      opacity={p.active ? 1 : 0.55}
                    />
                    {p.active && (
                      <text
                        x={p.x}
                        y={p.y + 2.5}
                        textAnchor="middle"
                        fontSize={7.5}
                        fontFamily="'JetBrains Mono', monospace"
                        fill="#ffffff"
                        fontWeight={700}
                      >
                        {p.ptNum}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}

          {/* Interval Stack Visualization */}
          {intervalPairs.map((pair, i) => {
            const y = whiteKeyHeight + 12 + i * 12;
            const color = TENSION_COLORS[pair.tension as keyof typeof TENSION_COLORS] ?? TENSION_COLORS.mild;
            const width = TENSION_WIDTHS[pair.tension as keyof typeof TENSION_WIDTHS] ?? 2;
            return (
              <g key={`stack-${i}`}>
                <line
                  x1={pair.fromX} y1={y}
                  x2={pair.toX} y2={y}
                  stroke={color}
                  strokeWidth={width}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <circle cx={pair.fromX} cy={y} r={2.5} fill={color} opacity={0.9} />
                <circle cx={pair.toX} cy={y} r={2.5} fill={color} opacity={0.9} />
                <text
                  x={(pair.fromX + pair.toX) / 2}
                  y={y - 3}
                  textAnchor="middle" fontSize={7}
                  fontFamily="'JetBrains Mono', monospace"
                  fill={color} opacity={0.7}
                >
                  {pair.semitones} sem
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});

export default PianoKeyboard;
