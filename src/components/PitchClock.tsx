import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import {
  getLabel,
  getNoteName,
  TENSION_COLORS,
  TENSION_LABELS,
  SOLFEGE_COLORS,
  SOLFEGE_NEON_COLORS,
  type ClockOrientation,
} from '@/lib/musicTheory';

const RADIUS = 140;
const DIAL_RADIUS = RADIUS + 30;
const CENTER = 188;
const DOT_RADIUS = 18;

/**
 * Computes the clock angle in radians for a pitch class relative to the 12 o'clock anchor.
 * When anchorPc is scaleTonic ('tonic' mode), Do (scaleTonic) is at 12 o'clock (-PI/2) and Fi (+6) is at 6 o'clock (+PI/2).
 */
export function pitchClassToAngle(pc: number, anchorPc: number = 0): number {
  const relSemitone = ((pc - anchorPc) % 12 + 12) % 12;
  return (relSemitone * 30 - 90) * (Math.PI / 180);
}

export function pitchClassToXY(pc: number, anchorPc: number = 0, radius = RADIUS): [number, number] {
  const angle = pitchClassToAngle(pc, anchorPc);
  return [
    CENTER + radius * Math.cos(angle),
    CENTER + radius * Math.sin(angle),
  ];
}

/**
 * Sorts and deduplicates pitch classes in clockwise order around the 12 o'clock anchor
 * so SVG <polygon> elements never self-intersect on extended chords (9ths, 11ths, 13ths, Quintal).
 */
export function sortPitchClassesClockwise(pcs: number[], anchorPc: number = 0): number[] {
  const unique = [...new Set(pcs.map(pc => ((pc % 12) + 12) % 12))];
  return unique.sort((a, b) => {
    const relA = ((a - anchorPc) % 12 + 12) % 12;
    const relB = ((b - anchorPc) % 12 + 12) % 12;
    return relA - relB;
  });
}

function voiceLeadingArcPath(fromPC: number, toPC: number, anchorPc: number, offset: number = 0): string {
  const r = RADIUS + 24 + offset * 10;
  const [x1, y1] = pitchClassToXY(fromPC, anchorPc, r);
  const [x2, y2] = pitchClassToXY(toPC, anchorPc, r);
  if (fromPC === toPC) return '';
  const diff = ((toPC - fromPC) % 12 + 12) % 12;
  const sweepFlag = diff <= 6 ? 1 : 0;
  const arcR = Math.max(50, r * 0.8);
  return `M ${x1} ${y1} A ${arcR} ${arcR} 0 0 ${sweepFlag} ${x2} ${y2}`;
}

function ArrowHead({ path, color, stableId }: { path: string; color: string; stableId: string }) {
  const id = `arrowhead-${stableId}`;
  return (
    <>
      <defs>
        <marker id={id} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <polygon points="0 0, 8 3, 0 6" fill={color} />
        </marker>
      </defs>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 2" markerEnd={`url(#${id})`} opacity={0.85} />
    </>
  );
}

const PitchClock = React.memo(function PitchClock() {
  const {
    root, scaleTonic, setScaleTonic, setRoot,
    activePitchClasses, scalePitchClasses,
    intervalTensions, labelMode, useFlats,
    clockOrientation, setClockOrientation,
    pptSolfegeColors, setPptSolfegeColors,
    constructionMode, setConstructionMode, togglePitchClass,
    cadenceMode, setCadenceMode, lockedPitchClasses, lockedRoot, lockedChord, voiceLeading,
    chord: chordObj,
    playCurrentChord,
  } = useHarmony();

  const isSameTonicAndRoot = root === scaleTonic;
  const allPitchClasses = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  // Determine which pitch class sits at 12 o'clock zenith
  const anchorPc = useMemo(() => {
    if (clockOrientation === 'tonic') return scaleTonic;
    if (clockOrientation === 'root') return root;
    return 0; // 'fixed-c'
  }, [clockOrientation, scaleTonic, root]);

  const useSolfegePalette = pptSolfegeColors;
  const showOuterSubclockLabels = labelMode !== 'notes' && labelMode !== 'tri';

  const sortedActivePcs = useMemo(
    () => sortPitchClassesClockwise(activePitchClasses, anchorPc),
    [activePitchClasses, anchorPc]
  );

  const sortedLockedPcs = useMemo(
    () => sortPitchClassesClockwise(lockedPitchClasses, anchorPc),
    [lockedPitchClasses, anchorPc]
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartAngle = useRef<number>(0);
  const dragStartTonic = useRef<number>(0);

  const getAngleFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const handleDialPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartAngle.current = getAngleFromEvent(e);
    dragStartTonic.current = scaleTonic;
  }, [getAngleFromEvent, scaleTonic]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const currentAngle = getAngleFromEvent(e);
    let delta = currentAngle - dragStartAngle.current;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    const steps = Math.round(delta / 30);
    // In 'tonic' orientation, rotating the outer pitch ring clockwise pulls lower pitch classes up to 12 o'clock
    const dirFactor = clockOrientation === 'tonic' ? -1 : 1;
    const newTonic = ((dragStartTonic.current + dirFactor * steps) % 12 + 12) % 12;
    if (newTonic !== scaleTonic) {
      setScaleTonic(newTonic);
    }
  }, [isDragging, getAngleFromEvent, scaleTonic, setScaleTonic, clockOrientation]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const stepTonic = (dir: number) => {
    setScaleTonic(((scaleTonic + dir) % 12 + 12) % 12);
  };

  const handleNodeClick = (pc: number) => {
    if (constructionMode) {
      togglePitchClass(pc);
    } else {
      setRoot(pc);
    }
  };

  const handleNodeKeyDown = (e: React.KeyboardEvent, pc: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNodeClick(pc);
    }
  };

  const handleDialKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      stepTonic(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      stepTonic(1);
    }
  };

  const lockedLabel = cadenceMode && lockedRoot !== null && lockedChord
    ? `${getNoteName(lockedRoot, useFlats)} ${lockedChord.name}`
    : null;

  const zenithNoteName = getNoteName(anchorPc, useFlats, labelMode === 'tri');
  const nadirNoteName = getNoteName((anchorPc + 6) % 12, useFlats, labelMode === 'tri');

  return (
    <div className="flex flex-col items-center">
      {/* Header & Mode Toggles */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap justify-center">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest mr-1">Pitch Clock</h3>
        <button
          onClick={() => playCurrentChord('arpeggio')}
          className="text-[10px] font-mono px-2 py-1 rounded-md border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          title="Play / Strum current chord voicing"
        >
          🔊 Play
        </button>
        <button
          onClick={() => setConstructionMode(!constructionMode)}
          className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
            constructionMode
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          {constructionMode ? '✏️ Edit ON' : '✏️ Edit'}
        </button>
        <button
          onClick={() => setCadenceMode(!cadenceMode)}
          className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
            cadenceMode
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          {cadenceMode ? '🎯 Cadence ON' : '🎯 Cadence'}
        </button>
      </div>

      {/* 12 o'clock Orientation Switcher */}
      <div className="flex items-center gap-1 mb-3 bg-surface-2 p-0.5 rounded-md border border-border">
        <span className="text-[10px] font-mono text-muted-foreground px-2">12:00 Zenith:</span>
        {([
          ['tonic', `Tonic (${getNoteName(scaleTonic, useFlats)})`],
          ['root', `Root (${getNoteName(root, useFlats)})`],
          ['fixed-c', 'Fixed C'],
        ] as [ClockOrientation, string][]).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setClockOrientation(mode)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
              clockOrientation === mode
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {cadenceMode && lockedLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground bg-surface-3 px-2 py-1 rounded">
            🔒 {lockedLabel}
          </span>
          <span className="text-[10px] font-mono text-primary">→</span>
          <span className="text-[10px] font-mono text-primary font-semibold">
            {getNoteName(root, useFlats)} {chordObj.name}
          </span>
        </div>
      )}

      <svg
        ref={svgRef}
        width={CENTER * 2}
        height={CENTER * 2}
        className="overflow-visible select-none"
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        role="img"
        aria-label={`Pitch clock centered with ${zenithNoteName} at 12 o'clock showing chord intervals as a geometric shape`}
      >
        {/* Outer dial ring (draggable for key rotation) */}
        <circle
          cx={CENTER} cy={CENTER} r={DIAL_RADIUS}
          fill="none"
          stroke={isDragging ? 'hsl(28, 85%, 55%)' : 'hsl(30, 5%, 18%)'}
          strokeWidth={isDragging ? 2 : 1}
          className="cursor-grab active:cursor-grabbing"
          onMouseDown={handleDialPointerDown}
          onTouchStart={handleDialPointerDown}
          tabIndex={0}
          onKeyDown={handleDialKeyDown}
          role="slider"
          aria-label="Key rotation dial — use arrow keys or drag to change key"
          aria-valuemin={0}
          aria-valuemax={11}
          aria-valuenow={scaleTonic}
          aria-valuetext={`Key of ${getNoteName(scaleTonic, useFlats)}`}
        />

        {/* Vertical Polar Diameter Axis (12 o'clock Do <-> 6 o'clock Fi Tritone Axis) */}
        <line
          x1={CENTER}
          y1={CENTER - RADIUS + DOT_RADIUS + 4}
          x2={CENTER}
          y2={CENTER + RADIUS - DOT_RADIUS - 4}
          stroke={useSolfegePalette ? 'rgba(225, 54, 16, 0.28)' : 'hsl(30, 15%, 24%)'}
          strokeWidth="1.25"
          strokeDasharray="4 4"
        />

        {/* 12 o'clock Zenith & 6 o'clock Nadir Axis Badges */}
        <text
          x={CENTER}
          y={CENTER - DIAL_RADIUS - (showOuterSubclockLabels ? 18 : 10)}
          textAnchor="middle"
          fontSize={8.5}
          fontFamily="'JetBrains Mono', monospace"
          fill="hsl(28, 80%, 60%)"
          opacity={0.75}
        >
          12:00 • {clockOrientation === 'tonic' ? `Do (${zenithNoteName})` : clockOrientation === 'root' ? `Root (${zenithNoteName})` : 'C'}
        </text>
        <text
          x={CENTER}
          y={CENTER + DIAL_RADIUS + (showOuterSubclockLabels ? 24 : 16)}
          textAnchor="middle"
          fontSize={8.5}
          fontFamily="'JetBrains Mono', monospace"
          fill="hsl(30, 10%, 50%)"
          opacity={0.7}
        >
          6:00 • {clockOrientation === 'tonic' ? `Fi (${nadirNoteName})` : `Tritone (${nadirNoteName})`}
        </text>

        {/* Dial tick marks & Subclock absolute pitch ring */}
        {allPitchClasses.map(pc => {
          const angle = pitchClassToAngle(pc, anchorPc);
          const outerR = DIAL_RADIUS + 5;
          const innerR = DIAL_RADIUS - 5;
          const labelR = DIAL_RADIUS + 14;
          const isScaleNote = scalePitchClasses.includes(pc);
          const isTonicNode = pc === scaleTonic;
          return (
            <g key={`tick-group-${pc}`}>
              <line
                x1={CENTER + innerR * Math.cos(angle)}
                y1={CENTER + innerR * Math.sin(angle)}
                x2={CENTER + outerR * Math.cos(angle)}
                y2={CENTER + outerR * Math.sin(angle)}
                stroke={isTonicNode ? 'hsl(28, 85%, 55%)' : isScaleNote ? 'hsl(30, 15%, 35%)' : 'hsl(30, 5%, 22%)'}
                strokeWidth={isTonicNode ? 2 : 1}
              />
              {showOuterSubclockLabels && (
                <text
                  x={CENTER + labelR * Math.cos(angle)}
                  y={CENTER + labelR * Math.sin(angle)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8.5}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={isTonicNode ? 700 : 400}
                  fill={isTonicNode ? 'hsl(28, 85%, 65%)' : isScaleNote ? 'hsl(30, 12%, 55%)' : 'hsl(30, 5%, 35%)'}
                >
                  {getNoteName(pc, useFlats)}
                </text>
              )}
            </g>
          );
        })}

        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="hsl(30, 5%, 22%)" strokeWidth="1" strokeDasharray="2 4" />

        {/* Locked chord polygon (cadence mode) */}
        {cadenceMode && sortedLockedPcs.length >= 3 && (
          <polygon
            points={sortedLockedPcs.map(pc => pitchClassToXY(pc, anchorPc).join(',')).join(' ')}
            fill="hsl(220, 55%, 50%)"
            fillOpacity={0.05}
            stroke="hsl(220, 55%, 50%)"
            strokeWidth="1"
            strokeOpacity={0.3}
            strokeDasharray="4 3"
          />
        )}

        {/* Interval lines */}
        {intervalTensions.map((t, i) => {
          const [x1, y1] = pitchClassToXY(t.from, anchorPc);
          const [x2, y2] = pitchClassToXY(t.to, anchorPc);
          const color = TENSION_COLORS[t.tension];
          const isDiss = t.tension === 'dissonant' || t.tension === 'tritone';
          const isPerfect = t.tension === 'perfect';
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth={isPerfect ? 2.5 : isDiss ? 2.5 : 1.5}
              strokeDasharray={isDiss ? '6 3' : 'none'}
              opacity={0.8}
            />
          );
        })}

        {/* Chord polygon fill (strictly clockwise sorted around anchorPc) */}
        {sortedActivePcs.length >= 3 && (
          <polygon
            points={sortedActivePcs.map(pc => pitchClassToXY(pc, anchorPc).join(',')).join(' ')}
            fill="hsl(28, 85%, 55%)"
            fillOpacity={0.07}
            stroke="hsl(28, 85%, 55%)"
            strokeWidth="1.2"
            strokeOpacity={0.3}
          />
        )}

        {/* Voice leading arrows (cadence mode) */}
        {cadenceMode && voiceLeading.map((move, i) => {
          const arrows: React.ReactNode[] = [];
          const color = move.semitones === 0
            ? 'hsl(150, 55%, 45%)'
            : Math.abs(move.semitones) <= 2
              ? 'hsl(42, 75%, 55%)'
              : 'hsl(220, 60%, 60%)';

          for (const fromPC of move.from) {
            for (const toPC of move.to) {
              if (fromPC === toPC) continue;
              const offset = arrows.length;
              const path = voiceLeadingArcPath(fromPC, toPC, anchorPc, offset);
              if (path) {
                arrows.push(
                  <ArrowHead key={`vl-${i}-${fromPC}-${toPC}`} path={path} color={color} stableId={`${i}-${fromPC}-${toPC}`} />
                );
              }
            }
          }
          return <g key={`vl-group-${i}`}>{arrows}</g>;
        })}

        {/* Locked chord ghost nodes */}
        {cadenceMode && lockedPitchClasses.map(pc => {
          if (activePitchClasses.includes(pc)) return null;
          const [x, y] = pitchClassToXY(pc, anchorPc);
          const noteName = getLabel(pc, lockedRoot ?? root, labelMode, useFlats, scaleTonic);
          return (
            <g
              key={`locked-${pc}`}
              onClick={() => handleNodeClick(pc)}
              onKeyDown={(e) => handleNodeKeyDown(e, pc)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Locked chord note ${noteName}`}
            >
              <circle
                cx={x} cy={y} r={DOT_RADIUS - 3}
                fill="hsl(220, 40%, 18%)"
                stroke="hsl(220, 55%, 45%)"
                strokeWidth="1"
                strokeDasharray="3 2"
                opacity={0.6}
              />
              <text
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fill="hsl(220, 50%, 60%)"
                fontSize={9}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={400}
                opacity={0.7}
              >
                {noteName}
              </text>
            </g>
          );
        })}

        {/* All 12 pitch class nodes */}
        {allPitchClasses.map(pc => {
          const [x, y] = pitchClassToXY(pc, anchorPc);
          const isActive = activePitchClasses.includes(pc);
          const isRoot = pc === root;
          const isTonic = pc === scaleTonic && !isSameTonicAndRoot;
          const isInScale = scalePitchClasses.includes(pc);
          const isLockedOnly = cadenceMode && lockedPitchClasses.includes(pc) && !isActive;

          if (isLockedOnly) return null;

          const relToTonic = ((pc - scaleTonic) % 12 + 12) % 12;
          const solfegeHex = SOLFEGE_COLORS[relToTonic];
          const solfegeNeon = SOLFEGE_NEON_COLORS[relToTonic];
          const isFiObsidian = relToTonic === 6;

          let fillColor = 'hsl(0, 0%, 13%)';
          let strokeColor = 'hsl(30, 5%, 25%)';
          let textColor = 'hsl(30, 8%, 40%)';
          let r = DOT_RADIUS - 4;

          if (useSolfegePalette) {
            if (isInScale && !isActive && !isTonic) {
              fillColor = isFiObsidian ? '#1e293b' : `${solfegeHex}33`;
              strokeColor = isFiObsidian ? '#64748b' : `${solfegeHex}99`;
              textColor = solfegeNeon;
              r = DOT_RADIUS - 2;
            }
            if (isTonic && !isActive) {
              fillColor = `${solfegeHex}55`;
              strokeColor = solfegeHex;
              textColor = '#ffffff';
              r = DOT_RADIUS;
            }
            if (isActive && !isRoot) {
              fillColor = isFiObsidian ? '#141414' : solfegeHex;
              strokeColor = isFiObsidian ? '#38BDF8' : '#ffffff';
              textColor = '#ffffff';
              r = DOT_RADIUS;
            }
            if (isRoot) {
              fillColor = isFiObsidian ? '#141414' : solfegeHex;
              strokeColor = '#ffffff';
              textColor = '#ffffff';
              r = DOT_RADIUS + 2;
            }
          } else {
            if (isInScale && !isActive && !isTonic) {
              fillColor = 'hsl(30, 10%, 18%)';
              strokeColor = 'hsl(30, 15%, 32%)';
              textColor = 'hsl(30, 10%, 55%)';
              r = DOT_RADIUS - 2;
            }
            if (isTonic && !isActive) {
              fillColor = 'hsl(32, 45%, 20%)';
              strokeColor = 'hsl(32, 70%, 50%)';
              textColor = 'hsl(32, 60%, 65%)';
              r = DOT_RADIUS;
            }
            if (isActive && !isRoot) {
              fillColor = 'hsl(28, 60%, 18%)';
              strokeColor = 'hsl(28, 85%, 55%)';
              textColor = 'hsl(28, 80%, 70%)';
              r = DOT_RADIUS;
            }
            if (isRoot) {
              fillColor = 'hsl(32, 70%, 22%)';
              strokeColor = 'hsl(32, 90%, 52%)';
              textColor = 'hsl(32, 85%, 72%)';
              r = DOT_RADIUS + 2;
            }
          }

          if (constructionMode && !isActive) {
            strokeColor = 'hsl(28, 40%, 35%)';
          }

          const isCommonTone = cadenceMode && lockedPitchClasses.includes(pc) && isActive;
          const label = getLabel(pc, root, labelMode, useFlats, scaleTonic);
          const noteDesc = isRoot ? 'Root' : isActive ? 'Chord tone' : isTonic ? 'Key center' : isInScale ? 'Scale note' : 'Note';

          return (
            <g
              key={pc}
              onClick={() => handleNodeClick(pc)}
              onKeyDown={(e) => handleNodeKeyDown(e, pc)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${noteDesc}: ${label}`}
            >
              {constructionMode && (
                <circle
                  cx={x} cy={y} r={r + 8}
                  fill="none"
                  stroke={isActive ? 'hsl(0, 65%, 45%)' : 'hsl(150, 55%, 35%)'}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
              )}
              {isCommonTone && (
                <circle
                  cx={x} cy={y} r={r + 6}
                  fill="none"
                  stroke="hsl(150, 55%, 45%)"
                  strokeWidth="1.5"
                  opacity={0.6}
                />
              )}
              {(isTonic || (pc === scaleTonic && isSameTonicAndRoot)) && (
                <rect
                  x={x - r - 5} y={y - r - 5}
                  width={(r + 5) * 2} height={(r + 5) * 2}
                  fill="none" stroke={useSolfegePalette ? '#E13610' : 'hsl(32, 70%, 50%)'} strokeWidth="1" opacity={0.45}
                  rx={4}
                  transform={`rotate(45, ${x}, ${y})`}
                />
              )}
              {isRoot && (
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke={strokeColor} strokeWidth="1" opacity={0.45} />
              )}
              <circle cx={x} cy={y} r={r} fill={fillColor} stroke={strokeColor} strokeWidth={isRoot ? 2 : 1.5} />
              <text
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fill={textColor}
                fontSize={isRoot ? 11.5 : 9.5}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={isActive ? 700 : 400}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Controls row */}
      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
        <div className="flex items-center gap-1">
          <button
            onClick={() => stepTonic(-1)}
            className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-2 py-1 transition-colors"
            title="Rotate key down a semitone"
            aria-label="Rotate key down one semitone"
          >
            ◀
          </button>
          <span className="text-[10px] font-mono text-muted-foreground px-1">
            Key: {getNoteName(scaleTonic, useFlats, labelMode === 'tri')}
          </span>
          <button
            onClick={() => stepTonic(1)}
            className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-2 py-1 transition-colors"
            title="Rotate key up a semitone"
            aria-label="Rotate key up one semitone"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Voice leading legend */}
      {cadenceMode && voiceLeading.length > 0 && (
        <div className="flex gap-4 flex-wrap justify-center mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(150, 55%, 45%)' }} />
            <span className="text-[10px] font-mono text-muted-foreground">Common</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(42, 75%, 55%)' }} />
            <span className="text-[10px] font-mono text-muted-foreground">Step</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(220, 60%, 60%)' }} />
            <span className="text-[10px] font-mono text-muted-foreground">Leap</span>
          </div>
        </div>
      )}

      {/* Tension legend */}
      {!cadenceMode && (
        <div className="flex gap-4 flex-wrap justify-center mt-3">
          {(['perfect', 'consonant', 'mild', 'dissonant', 'tritone'] as const).map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: TENSION_COLORS[t] }} />
              <span className="text-[10px] font-mono text-muted-foreground">{TENSION_LABELS[t]}</span>
            </div>
          ))}
        </div>
      )}

      {constructionMode && (
        <p className="text-[10px] font-mono text-primary/70 mt-2">
          Click nodes to add/remove notes • Chord auto-detected
        </p>
      )}
    </div>
  );
});

export default PitchClock;
