import React, { useMemo } from 'react';
import { useHarmony } from '@/contexts/HarmonyContext';
import { getChordSynonyms } from '@/lib/chordSynonyms';

export default function ChordSynonyms() {
  const { root, chord, useFlats, setRoot, setChord } = useHarmony();

  const synonyms = useMemo(
    () => getChordSynonyms(root, chord, useFlats),
    [root, chord, useFlats],
  );

  if (synonyms.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Also:</span>
      {synonyms.map((syn, i) => (
        <button
          key={`${syn.root}-${syn.chordName}-${i}`}
          onClick={() => {
            setRoot(syn.root);
            setChord(syn.chord);
          }}
          className="text-[11px] font-mono text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-surface-2 hover:bg-surface-3"
          title={`Respell as ${syn.rootName} ${syn.chordName}`}
        >
          {syn.rootName} {syn.chordName}
        </button>
      ))}
    </div>
  );
}
