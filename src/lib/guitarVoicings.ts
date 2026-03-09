// src/lib/guitarVoicings.ts

export interface VoicingPosition {
  s: number; // string index (0 = lowest)
  f: number; // fret (0 = open)
  pc: number; // pitch class
}

type VoicingStyle = 'fingerstyle' | 'strum';

const MAX_FINGERS = 4; // index, middle, ring, pinky
const BASE_MAX_SPAN = 4; // typical non-barre reach
const BASE_MAX_SPAN_BARRE = 5; // slightly wider if barre is anchoring

function mod12(n: number) {
  return ((n % 12) + 12) % 12;
}

/**
 * Count how many fingers a voicing requires.
 * - Open strings cost 0.
 * - Fretted notes on the same fret can share a (partial) barre (1 finger).
 * - Otherwise, each distinct fret costs 1 finger.
 */
function countFingers(voicing: VoicingPosition[]): { fingers: number; hasBarre: boolean } {
  const frettedFrets = voicing.filter(v => v.f > 0).map(v => v.f);
  if (frettedFrets.length === 0) return { fingers: 0, hasBarre: false };

  const fretCounts = new Map<number, number>();
  for (const f of frettedFrets) fretCounts.set(f, (fretCounts.get(f) || 0) + 1);

  const sortedFrets = [...fretCounts.entries()].sort((a, b) => a[0] - b[0]);
  let fingers = 0;
  let hasBarre = false;

  let barreUsed = false;
  for (const [fret, count] of sortedFrets) {
    if (!barreUsed && count >= 2) {
      const stringsAtFret = voicing.filter(v => v.f === fret).map(v => v.s);
      const minS = Math.min(...stringsAtFret);
      const maxS = Math.max(...stringsAtFret);

      // Barre is feasible if nothing in-between needs a lower fret (partial barre allowed).
      let barreFeasible = true;
      for (let s = minS; s <= maxS; s++) {
        const noteOnString = voicing.find(v => v.s === s);
        if (noteOnString && noteOnString.f > 0 && noteOnString.f < fret) {
          barreFeasible = false;
          break;
        }
      }

      if (barreFeasible) {
        fingers += 1;
        barreUsed = true;
        hasBarre = true;
      } else {
        fingers += count;
      }
    } else {
      fingers += 1;
    }
  }

  return { fingers, hasBarre };
}

/**
 * Identify core tones for voicing priority.
 * - Triads: all tones are core.
 * - 7ths+: prioritize root, 3rd, 7th and any extensions.
 */
function identifyCoreTones(chordPcs: number[], root: number): Set<number> {
  const pcs = [...new Set(chordPcs.map(mod12))];
  const core = new Set<number>();

  core.add(root);

  const third = pcs.find(pc => {
    const i = mod12(pc - root);
    return i === 3 || i === 4;
  });
  if (third !== undefined) core.add(third);

  if (pcs.length >= 4) {
    const seventh = pcs.find(pc => {
      const i = mod12(pc - root);
      return i === 9 || i === 10 || i === 11;
    });
    if (seventh !== undefined) core.add(seventh);
  }

  if (pcs.length >= 5) {
    const extensions = pcs.filter(pc => {
      const i = mod12(pc - root);
      return i === 2 || i === 5 || i === 9; // 9, 11, 13
    });
    for (const ext of extensions) core.add(ext);
  }

  // Triads: everything is core.
  if (pcs.length <= 3) return new Set(pcs);

  return core;
}

function maxConsecutiveInteriorGap(playedStrings: number[], style: VoicingStyle): number {
  // Fingerstyle often uses string-skips (especially in spread triads / drop voicings).
  if (style === 'fingerstyle') {
    if (playedStrings.length <= 5) return 3;
    return 2;
  }

  // Strummed shapes should be more contiguous.
  return 1;
}

function noProblematicGaps(voicing: VoicingPosition[], style: VoicingStyle): boolean {
  const playedStrings = voicing.map(v => v.s).sort((a, b) => a - b);
  if (playedStrings.length < 2) return true;

  const lowest = playedStrings[0];
  const highest = playedStrings[playedStrings.length - 1];
  const playedSet = new Set(playedStrings);

  let maxGap = 0;
  let currentGap = 0;
  for (let s = lowest + 1; s < highest; s++) {
    if (!playedSet.has(s)) {
      currentGap++;
      maxGap = Math.max(maxGap, currentGap);
    } else {
      currentGap = 0;
    }
  }

  return maxGap <= maxConsecutiveInteriorGap(playedStrings, style);
}

/**
 * Open-string realism:
 * - Low open strings as drones are fine even in high positions.
 * - For fingerstyle, open top-strings (B/e) are also realistic as ringing melody notes.
 */
function openStringsRealistic(voicing: VoicingPosition[], tuning: number[], style: VoicingStyle): boolean {
  const hasOpen = voicing.some(v => v.f === 0);
  if (!hasOpen) return true;

  const fretted = voicing.filter(v => v.f > 0);
  if (fretted.length === 0) return true;

  const maxFret = Math.max(...fretted.map(v => v.f));
  if (maxFret <= 7) return true;

  const openPositions = voicing.filter(v => v.f === 0);
  const lowestFrettedString = Math.min(...fretted.map(v => v.s));

  const top1 = tuning.length - 1;
  const top2 = tuning.length - 2;

  return openPositions.every(v => {
    // Bass drone: open string below the lowest fretted string.
    if (v.s < lowestFrettedString) return true;

    // Fingerstyle: allow ringing top strings (melody) even high up the neck.
    if (style === 'fingerstyle' && (v.s === top1 || v.s === top2)) return true;

    return false;
  });
}

function spanLimitForPosition(minFret: number, maxFret: number, hasBarre: boolean, style: VoicingStyle): number {
  const base = hasBarre ? BASE_MAX_SPAN_BARRE : BASE_MAX_SPAN;

  // Higher up the neck, stretches are physically easier (smaller fret spacing).
  const highPositionBonus = minFret >= 9 ? 1 : 0;

  // Fingerstyle tolerates slightly wider spans due to non-strum constraints.
  const fingerstyleBonus = style === 'fingerstyle' ? 1 : 0;

  return base + highPositionBonus + fingerstyleBonus;
}

function buildVoicing(
  chordPcs: number[],
  bassString: number,
  bassFret: number,
  bassPc: number,
  tuning: number[],
  windowMin: number,
  windowMax: number,
  root: number,
  style: VoicingStyle,
): VoicingPosition[] | null {
  const pcs = [...new Set(chordPcs.map(mod12))];
  const numStrings = tuning.length;

  const voicing: VoicingPosition[] = [];
  const usedPcs = new Set<number>();
  const coreTones = identifyCoreTones(pcs, root);

  voicing.push({ s: bassString, f: bassFret, pc: bassPc });
  usedPcs.add(bassPc);

  for (let s = bassString + 1; s < numStrings; s++) {
    const opts: VoicingPosition[] = [];

    const openPc = mod12(tuning[s]);
    if (pcs.includes(openPc)) opts.push({ s, f: 0, pc: openPc });

    for (let f = Math.max(1, windowMin); f <= windowMax; f++) {
      const pc = mod12(tuning[s] + f);
      if (pcs.includes(pc)) opts.push({ s, f, pc });
    }

    if (opts.length === 0) continue;

    // Priority: (1) core tones unused, (2) any unused, (3) core used, (4) any used.
    const coreUnused = opts.filter(o => coreTones.has(o.pc) && !usedPcs.has(o.pc));
    const nonCoreUnused = opts.filter(o => !coreTones.has(o.pc) && !usedPcs.has(o.pc));
    const coreUsed = opts.filter(o => coreTones.has(o.pc) && usedPcs.has(o.pc));
    const nonCoreUsed = opts.filter(o => !coreTones.has(o.pc) && usedPcs.has(o.pc));

    const candidates = [...coreUnused, ...nonCoreUnused, ...coreUsed, ...nonCoreUsed].sort((a, b) => {
      // Prefer fretted notes (more controllable) in high positions; prefer lower frets overall.
      if (a.f === 0 && b.f > 0) return 1;
      if (b.f === 0 && a.f > 0) return -1;
      return a.f - b.f;
    });

    for (const pick of candidates) {
      const tentative = [...voicing, pick];
      const fretted = tentative.filter(v => v.f > 0);

      const { fingers, hasBarre } = countFingers(tentative);
      if (fingers > MAX_FINGERS) continue;

      if (fretted.length >= 2) {
        const min = Math.min(...fretted.map(v => v.f));
        const max = Math.max(...fretted.map(v => v.f));
        const spanLimit = spanLimitForPosition(min, max, hasBarre, style);
        if (max - min > spanLimit) continue;
      }

      voicing.push(pick);
      usedPcs.add(pick.pc);
      break;
    }

    // If no candidate works, skip this string (muted)
  }

  // Validate final voicing
  const covered = new Set(voicing.map(v => v.pc));
  const coresCovered = [...coreTones].filter(pc => covered.has(pc)).length;

  const isExtended = pcs.length >= 5;
  const is7th = pcs.length === 4;

  const avgFret = voicing.reduce((sum, v) => sum + v.f, 0) / voicing.length;
  const isHighPosition = avgFret >= 9;

  const minNotes = isHighPosition ? 2 : 3;

  // Coverage rules (slightly relaxed for high-position fingerstyle shapes)
  let minUnique = 2;
  if (isExtended) minUnique = isHighPosition ? 2 : Math.min(3, coreTones.size);
  else if (is7th) minUnique = 3;
  else minUnique = Math.min(2, pcs.length);

  if (covered.size < minUnique) return null;
  if (voicing.length < minNotes) return null;

  if (isExtended) {
    const requiredCore = isHighPosition && style === 'fingerstyle' ? 2 : Math.min(3, coreTones.size);
    if (coresCovered < requiredCore) return null;
  }

  if (!openStringsRealistic(voicing, tuning, style)) return null;
  if (!noProblematicGaps(voicing, style)) return null;
  if (countFingers(voicing).fingers > MAX_FINGERS) return null;

  return voicing.sort((a, b) => a.s - b.s);
}

function gapPenalty(voicing: VoicingPosition[]): number {
  const strings = voicing.map(v => v.s).sort((a, b) => a - b);
  if (strings.length < 2) return 0;

  let penalty = 0;
  for (let i = 1; i < strings.length; i++) {
    const gap = strings[i] - strings[i - 1] - 1;
    if (gap > 0) penalty += gap;
  }
  return penalty;
}

export function generateVoicings(
  chordPcs: number[],
  bassPc: number,
  root: number,
  tuning: number[],
  maxFret: number,
  style: VoicingStyle = 'fingerstyle',
): VoicingPosition[][] {
  const pcs = [...new Set(chordPcs.map(mod12))];
  const numStrings = tuning.length;

  const seen = new Set<string>();
  const voicings: VoicingPosition[][] = [];

  // Fingerstyle can anchor the “bass” on higher strings (upper-set chord grips).
  const maxBassString = style === 'fingerstyle'
    ? Math.min(4, Math.max(0, numStrings - 2))
    : Math.min(2, numStrings - 1);

  const bassPositions: { s: number; f: number }[] = [];
  for (let s = 0; s <= maxBassString; s++) {
    for (let f = 0; f <= maxFret; f++) {
      if (mod12(tuning[s] + f) === bassPc) bassPositions.push({ s, f });
    }
  }

  for (const anchor of bassPositions) {
    const anchorSpan = style === 'fingerstyle'
      ? (anchor.f >= 9 ? 6 : 5)
      : (anchor.f >= 9 ? 5 : 4);

    const windows: [number, number][] = [
      [anchor.f, Math.min(maxFret, anchor.f + anchorSpan)],
      [Math.max(0, anchor.f - 1), Math.min(maxFret, anchor.f + anchorSpan - 1)],
      [Math.max(0, anchor.f - 2), Math.min(maxFret, anchor.f + Math.max(2, anchorSpan - 2))],
      [Math.max(0, anchor.f - anchorSpan), anchor.f],

      // Wider alternative for partial barres / position shifts
      [anchor.f, Math.min(maxFret, anchor.f + anchorSpan + 1)],
      [Math.max(0, anchor.f - 1), Math.min(maxFret, anchor.f + anchorSpan)],
    ];

    for (const [wMin, wMax] of windows) {
      if (wMax < wMin) continue;

      const voicing = buildVoicing(pcs, anchor.s, anchor.f, bassPc, tuning, wMin, wMax, root, style);
      if (!voicing) continue;

      const key = voicing.map(p => `${p.s}:${p.f}`).join(',');
      if (seen.has(key)) continue;

      seen.add(key);
      voicings.push(voicing);
    }
  }

  const coreTones = identifyCoreTones(pcs, root);

  voicings.sort((a, b) => {
    const coveredA = new Set(a.map(v => v.pc));
    const coveredB = new Set(b.map(v => v.pc));

    // 1) Missing core tones
    const missingA = [...coreTones].filter(pc => !coveredA.has(pc)).length;
    const missingB = [...coreTones].filter(pc => !coveredB.has(pc)).length;
    if (missingA !== missingB) return missingA - missingB;

    // 2) Prefer fewer duplicates on 7ths+
    if (pcs.length >= 4) {
      const dupesA = a.length - coveredA.size;
      const dupesB = b.length - coveredB.size;
      if (dupesA !== dupesB) return dupesA - dupesB;
    }

    // 3) Prefer less extreme string-skips (still allowing them)
    const gapA = gapPenalty(a);
    const gapB = gapPenalty(b);
    if (gapA !== gapB) return gapA - gapB;

    // 4) Average fret (nut -> bridge)
    const avgA = a.reduce((sum, p) => sum + p.f, 0) / a.length;
    const avgB = b.reduce((sum, p) => sum + p.f, 0) / b.length;
    return avgA - avgB;
  });

  return voicings;
}
