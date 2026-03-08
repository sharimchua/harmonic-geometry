import React, { useState, useRef, useCallback } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getLabel, getNoteName, type LabelMode } from '@/lib/musicTheory';

const RADIUS = 140;
const DIAL_RADIUS = RADIUS + 30;
const CENTER = 180;
const DOT_RADIUS = 18;

const TENSION_COLORS: Record<string, string> = {
  perfect: 'hsl(220, 55%, 58%)',
  consonant: 'hsl(150, 55%, 42%)',
  mild: 'hsl(42, 55%, 52%)',
  dissonant: 'hsl(0, 65%, 52%)',
  tritone: 'hsl(340, 60%, 50%)',
};

const TENSION_LABELS: Record<string, string> = {
  perfect: 'Perfect',
  consonant: 'Consonant',
  mild: 'Mild',
  dissonant: 'Dissonant',
  tritone: 'Tritone',
};

function pitchClassToAngle(pc: number): number {
  return (pc * 30 - 90) * (Math.PI / 180);
}

function pitchClassToXY(pc: number, radius = RADIUS): [number, number] {
  const angle = pitchClassToAngle(pc);
  return [
    CENTER + radius * Math.cos(angle),
    CENTER + radius * Math.sin(angle),
  ];
}

/**
 * Generate an SVG arc path for a curved arrow between two pitch classes.
 * The arrow curves inward (toward center) for clockwise motion, outward for counter-clockwise.
 */
function voiceLeadingArcPath(
  fromPC: number,
  toPC: number,
  radius: number = RADIUS - 28,
  offset: number = 0
): string {
  const r = radius - offset * 12;
  const [x1, y1] = pitchClassToXY(fromPC, r);
  const [x2, y2] = pitchClassToXY(toPC, r);

  if (fromPC === toPC) return ''; // common tone, no arrow

  // Determine shortest path direction
  const diff = ((toPC - fromPC) % 12 + 12) % 12;
  const sweepFlag = diff <= 6 ? 1 : 0;

  // Arc radius — larger for nearby notes, smaller for distant
  const arcR = Math.max(40, r * 0.7);

  return `M ${x1} ${y1} A ${arcR} ${arcR} 0 0 ${sweepFlag} ${x2} ${y2}`;
}

function ArrowHead({ path, color }: { path: string; color: string }) {
  const id = `arrowhead-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <>
      <defs>
        <marker
          id={id}
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 8 3, 0 6" fill={color} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4 2"
        markerEnd={`url(#${id})`}
        opacity={0.85}
      />
    </>
  );
}

export default function PitchClock() {
  const {
    root, scaleTonic, setScaleTonic, setRoot,
    activePitchClasses, scalePitchClasses,
    intervalTensions, labelMode, setLabelMode, useFlats, setUseFlats,
    constructionMode, setConstructionMode, togglePitchClass,
    cadenceMode, lockedPitchClasses, lockedRoot, lockedChord, voiceLeading,
  } = useHarmony();
  const isSameTonicAndRoot = root === scaleTonic;
  const allPitchClasses = Array.from({ length: 12 }, (_, i) => i);

  // ── Drag-to-spin state for key rotation dial ──
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
    const delta = currentAngle - dragStartAngle.current;
    const steps = Math.round(delta / 30);
    const newTonic = ((dragStartTonic.current + steps) % 12 + 12) % 12;
    if (newTonic !== scaleTonic) {
      setScaleTonic(newTonic);
    }
  }, [isDragging, getAngleFromEvent, scaleTonic, setScaleTonic]);

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

  // Locked chord label for cadence mode
  const lockedLabel = cadenceMode && lockedRoot !== null && lockedChord
    ? `${getNoteName(lockedRoot, useFlats)} ${lockedChord.name}`
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* Header with Construction Mode toggle */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">Pitch Clock</h3>
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
      </div>

      {/* Cadence mode locked chord indicator */}
      {cadenceMode && lockedLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground bg-surface-3 px-2 py-1 rounded">
            🔒 {lockedLabel}
          </span>
          <span className="text-[10px] font-mono text-primary">→</span>
          <span className="text-[10px] font-mono text-primary font-semibold">
            {getNoteName(root, useFlats)} {useHarmony().chord.name}
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
        />

        {/* Dial tick marks */}
        {allPitchClasses.map(pc => {
          const angle = pitchClassToAngle(pc);
          const outerR = DIAL_RADIUS + 6;
          const innerR = DIAL_RADIUS - 6;
          const isScaleNote = scalePitchClasses.includes(pc);
          return (
            <line
              key={`tick-${pc}`}
              x1={CENTER + innerR * Math.cos(angle)}
              y1={CENTER + innerR * Math.sin(angle)}
              x2={CENTER + outerR * Math.cos(angle)}
              y2={CENTER + outerR * Math.sin(angle)}
              stroke={pc === scaleTonic ? 'hsl(28, 85%, 55%)' : isScaleNote ? 'hsl(30, 15%, 35%)' : 'hsl(30, 5%, 22%)'}
              strokeWidth={pc === scaleTonic ? 2 : 1}
            />
          );
        })}

        {/* Inner dashed circle */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="hsl(30, 5%, 22%)" strokeWidth="1" strokeDasharray="2 4" />

        {/* Locked chord polygon (cadence mode) */}
        {cadenceMode && lockedPitchClasses.length >= 3 && (
          <polygon
            points={lockedPitchClasses.map(pc => pitchClassToXY(pc).join(',')).join(' ')}
            fill="hsl(220, 55%, 50%)"
            fillOpacity={0.05}
            stroke="hsl(220, 55%, 50%)"
            strokeWidth="1"
            strokeOpacity={0.3}
            strokeDasharray="4 3"
          />
        )}

        {/* Interval lines between active notes */}
        {intervalTensions.map((t, i) => {
          const [x1, y1] = pitchClassToXY(t.from);
          const [x2, y2] = pitchClassToXY(t.to);
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

        {/* Chord polygon fill */}
        {activePitchClasses.length >= 3 && (
          <polygon
            points={activePitchClasses.map(pc => pitchClassToXY(pc).join(',')).join(' ')}
            fill="hsl(28, 85%, 55%)"
            fillOpacity={0.06}
            stroke="hsl(28, 85%, 55%)"
            strokeWidth="1"
            strokeOpacity={0.25}
          />
        )}

        {/* Voice leading arrows (cadence mode) */}
        {cadenceMode && voiceLeading.map((move, i) => {
          const arrows: React.ReactNode[] = [];
          const color = move.semitones === 0
            ? 'hsl(150, 55%, 45%)'  // common tone - green
            : Math.abs(move.semitones) <= 2
              ? 'hsl(42, 75%, 55%)'   // stepwise - gold
              : 'hsl(220, 60%, 60%)'; // leap - blue

          // Handle 1→1, 1→many, many→1
          for (const fromPC of move.from) {
            for (const toPC of move.to) {
              if (fromPC === toPC) continue; // common tone, no arrow needed
              const offset = arrows.length;
              const path = voiceLeadingArcPath(fromPC, toPC, RADIUS - 28, offset);
              if (path) {
                arrows.push(
                  <ArrowHead key={`vl-${i}-${fromPC}-${toPC}`} path={path} color={color} />
                );
              }
            }
          }
          return <g key={`vl-group-${i}`}>{arrows}</g>;
        })}

        {/* Locked chord ghost nodes (cadence mode) */}
        {cadenceMode && lockedPitchClasses.map(pc => {
          if (activePitchClasses.includes(pc)) return null; // don't double-render
          const [x, y] = pitchClassToXY(pc);
          return (
            <g key={`locked-${pc}`}>
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
                {getLabel(pc, lockedRoot ?? root, labelMode, useFlats)}
              </text>
            </g>
          );
        })}

        {/* All 12 pitch class nodes */}
        {allPitchClasses.map(pc => {
          const [x, y] = pitchClassToXY(pc);
          const isActive = activePitchClasses.includes(pc);
          const isRoot = pc === root;
          const isTonic = pc === scaleTonic && !isSameTonicAndRoot;
          const isInScale = scalePitchClasses.includes(pc);
          const isLockedOnly = cadenceMode && lockedPitchClasses.includes(pc) && !isActive;

          if (isLockedOnly) return null; // rendered above as ghost

          let fillColor = 'hsl(0, 0%, 13%)';
          let strokeColor = 'hsl(30, 5%, 25%)';
          let textColor = 'hsl(30, 8%, 40%)';
          let r = DOT_RADIUS - 4;

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

          if (constructionMode && !isActive) {
            strokeColor = 'hsl(28, 40%, 35%)';
          }

          // In cadence mode, highlight common tones
          const isCommonTone = cadenceMode && lockedPitchClasses.includes(pc) && isActive;

          const label = getLabel(pc, root, labelMode, useFlats);

          return (
            <g
              key={pc}
              onClick={() => handleNodeClick(pc)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
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
              {isTonic && !isRoot && (
                <rect
                  x={x - r - 5} y={y - r - 5}
                  width={(r + 5) * 2} height={(r + 5) * 2}
                  fill="none" stroke="hsl(32, 70%, 50%)" strokeWidth="1" opacity={0.4}
                  rx={4}
                  transform={`rotate(45, ${x}, ${y})`}
                />
              )}
              {isRoot && (
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke={strokeColor} strokeWidth="1" opacity={0.4} />
              )}
              <circle cx={x} cy={y} r={r} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
              <text
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fill={textColor}
                fontSize={isRoot ? 12 : 10}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={isActive ? 600 : 400}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Controls row */}
      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
        <div className="flex gap-0.5 bg-secondary rounded p-0.5">
          {(['notes', 'intervals', 'semitones'] as LabelMode[]).map(m => (
            <button
              key={m}
              onClick={() => setLabelMode(m)}
              className={`px-2 py-1 rounded text-[10px] font-mono capitalize transition-all ${
                labelMode === m
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => setUseFlats(!useFlats)}
          className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
            useFlats
              ? 'bg-primary/20 border-primary text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          ♭
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => stepTonic(-1)}
            className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-2 py-1 transition-colors"
            title="Rotate key down a semitone"
          >
            ◀
          </button>
          <span className="text-[10px] font-mono text-muted-foreground">Key</span>
          <button
            onClick={() => stepTonic(1)}
            className="text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded px-2 py-1 transition-colors"
            title="Rotate key up a semitone"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Voice leading legend (cadence mode) */}
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
}
