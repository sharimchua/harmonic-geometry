import { type PitchClass, type ChordType, CHORD_CATEGORIES, getNoteName } from './musicTheory';

export interface ChordSynonym {
  root: PitchClass;
  rootName: string;
  chordName: string;
  chord: ChordType;
}

/**
 * Find alternative root spellings for the same set of pitch classes.
 * E.g. Am7 = C6 (same notes: A C E G).
 */
export function getChordSynonyms(
  currentRoot: PitchClass,
  currentChord: ChordType,
  useFlats: boolean,
): ChordSynonym[] {
  const allChords = Object.values(CHORD_CATEGORIES).flat();
  const currentPCs = currentChord.intervals
    .map(i => ((currentRoot + i) % 12 + 12) % 12)
    .sort((a, b) => a - b);

  const synonyms: ChordSynonym[] = [];

  for (const candidateRoot of Array.from({ length: 12 }, (_, i) => i)) {
    if (candidateRoot === currentRoot) continue;

    for (const chord of allChords) {
      const candidatePCs = chord.intervals
        .map(i => ((candidateRoot + i) % 12 + 12) % 12)
        .sort((a, b) => a - b);

      if (
        candidatePCs.length === currentPCs.length &&
        candidatePCs.every((v, i) => v === currentPCs[i])
      ) {
        // Avoid duplicates
        if (!synonyms.find(s => s.root === candidateRoot && s.chordName === chord.name)) {
          synonyms.push({
            root: candidateRoot as PitchClass,
            rootName: getNoteName(candidateRoot, useFlats),
            chordName: chord.name,
            chord,
          });
        }
      }
    }
  }

  return synonyms;
}
