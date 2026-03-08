

## Educational Improvements for Harmonic Geometry

After reviewing the full application, here are the key educational improvements that would strengthen the learning experience:

### 1. Add Scale Degree Labels to the Label Mode System

Currently the label modes are: Notes, Intervals, Semitones. There's a missing fourth mode: **Scale Degrees** (1, 2, b3, 4, 5, etc.). This is critical for the PRD's "Functional Awareness" pedagogical objective — understanding how notes relate to the *key*, not just to the chord root. The existing `intervals` mode shows intervals relative to the *chord root*, but students also need to see how notes sit within the *scale*.

**Changes**: Add `'scaleDegrees'` to `LabelMode`, implement `getScaleDegreeLabel()` in musicTheory.ts, update `getLabel()`, and add the option to the ControlPanel display toggle.

### 2. Add Interval Name Tooltips / Expanded Names

The interval list uses abbreviated names (P1, m2, M3, P5, TT) which are correct but opaque to beginners. Adding **full interval names** as visible secondary text or tooltips would help students connect abbreviations to concepts.

**Changes**: Add a `FULL_INTERVAL_NAMES` map (e.g., P1 → "Unison", m2 → "Minor 2nd", TT → "Tritone") and display it as subtitle text in the IntervalRelationshipList rows and as title attributes elsewhere.

### 3. Add a "What Am I Hearing?" Tooltip to Tension Categories

The IntervalRelationshipList has pedagogical labels ("Identity / Foundations", "Sweetness", etc.) but the *descriptions* are only visible as hover tooltips on the legend. These should be **always visible** as a brief educational note per tension category group, or at minimum as an expandable section.

**Changes**: Group the interval pairs by tension category in IntervalRelationshipList and add a brief one-line description header for each group (e.g., "Crunch — Sharp tension that demands attention or resolution").

### 4. Add Chord Formula Display

Students need to see the **chord formula** (e.g., "1 - 3 - 5 - 7" for Major 7, "1 - b3 - 5 - b7" for Minor 7) alongside the chord name. This is a core music theory learning tool that's currently missing. The Harmonic Context panel is the natural place for this.

**Changes**: Add a `getChordFormula()` function that converts chord intervals to formula notation (1, b2, 2, b3, 3, 4, b5, 5, #5, 6, b7, 7), and display it prominently in the HarmonicContext component.

### 5. Add "Common In" / Genre Context to Chord Vibes

The `CHORD_VIBES` descriptions are good but could be strengthened by adding a brief genre/usage hint (e.g., Major 7 → "Dreamy and lush... Common in: Jazz, Neo-Soul, Bossa Nova"). This connects abstract theory to real music the student listens to.

**Changes**: Add a `CHORD_GENRE_HINTS` map and append it to the chordVibe display in HarmonicContext.

### 6. Contextual Key Highlighting (PRD Requirement — Currently Missing)

The PRD specifies: *"When a chord is selected, the Scale Tonic selector highlights which keys contain all notes of the current chord diatonically."* This feature doesn't exist yet. It would show students which keys their current chord "belongs to" — a powerful learning insight.

**Changes**: Add a `findCompatibleKeys()` function that checks all 12 major scale tonics to find which contain all active pitch classes. Display the compatible keys as highlighted badges in the HarmonicContext panel.

### Summary of Changes

| # | Feature | Files |
|---|---------|-------|
| 1 | Scale Degree label mode | musicTheory.ts, ControlPanel.tsx, all label consumers |
| 2 | Full interval names | musicTheory.ts, IntervalRelationshipList.tsx |
| 3 | Tension category descriptions | IntervalRelationshipList.tsx |
| 4 | Chord formula display | musicTheory.ts, HarmonicContext.tsx |
| 5 | Genre context hints | musicTheory.ts, HarmonicContext.tsx |
| 6 | Compatible keys display | musicTheory.ts, HarmonicContext.tsx |

