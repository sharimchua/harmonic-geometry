

## Review: Optimisations and Improvements

After a thorough review of the codebase, here are the issues and improvements I've identified, grouped by priority.

---

### 1. Fix Console Warnings — forwardRef on Function Components

**Problem**: Console shows "Function components cannot be given refs" warnings for `PitchClock` and `ControlPanel`. This happens because `React.createElement(SECTION_COMPONENTS[id])` in `Index.tsx` may pass refs through the component map lookup.

**Fix**: This is benign but noisy. The warnings come from React's internal checks. No action strictly needed, but wrapping components with `React.memo` (which they should have anyway for performance) would clean this up.

---

### 2. Performance — Memoize Expensive Components

**Problem**: Every state change in `HarmonyContext` triggers re-renders of *all* child components. The `DissonanceSpectrum` does heavy computation (Plomp-Levelt pairwise dissonance across 7 partials × N notes), and `GuitarFretboard` generates all voicings on every render.

**Fix**: Wrap the heavy components (`DissonanceSpectrum`, `GuitarFretboard`, `PitchClock`, `StaffNotation`, `PianoKeyboard`) in `React.memo` so they only re-render when their consumed context values actually change.

---

### 3. Ghost Voicings Rendering All Voicings in SVG

**Problem**: In `GuitarFretboard.tsx` (line 471), the ghost dots loop renders circles for **every** voicing in `allVoicings`. For complex chords this could be 30-50+ voicings, each with 4-6 dots = 120-300 SVG elements rendered but mostly off-screen or overlapping.

**Fix**: Limit ghost rendering to adjacent voicings only (e.g. `voicingIdx ± 2`) or remove ghost dots entirely — users navigate via the arrow buttons anyway.

---

### 4. Repeated TENSION_COLORS Constants

**Problem**: The same `TENSION_COLORS` object is defined independently in `PitchClock.tsx`, `GuitarFretboard.tsx`, `PianoKeyboard.tsx`, `StaffNotation.tsx`, and `IntervalRelationshipList.tsx`. This creates maintenance risk if colors are updated.

**Fix**: Export a single `TENSION_COLORS` constant from `musicTheory.ts` (or a dedicated `constants.ts`) and import it everywhere.

---

### 5. Mobile Controls Panel — Collapsible but Not Discoverable

**Problem**: On mobile (`lg:hidden`), the control panel is hidden inside a `<details>` element at the **bottom** of the page. Users must scroll past all visualisations to find it. There's no obvious affordance.

**Fix**: Move the mobile controls toggle to the mobile header bar as a hamburger/gear icon that opens a slide-out sheet (using the existing `Sheet` UI component). This makes controls immediately accessible.

---

### 6. Accessibility — Missing ARIA Labels and Keyboard Navigation

**Problem**: Interactive elements like the pitch clock nodes, piano keys, and fretboard dots use `onClick` on SVG elements but lack proper `aria-label` attributes. The pitch clock dial uses mouse/touch events but has no keyboard equivalent.

**Fix**: Add `aria-label` to SVG interactive elements and ensure the dial rotation can also be triggered via keyboard (arrow keys when focused).

---

### 7. Status Bar Overflow on Small Screens

**Problem**: The status bar (`flex-wrap`) can become crowded on tablet-width screens (~768-1024px) with chord name, key label, synonyms, lock toggle, label dropdown, and interval string all competing for space.

**Fix**: Hide the interval string `[intervalStr]` below `md` breakpoint, and collapse `ChordSynonyms` into a popover/tooltip on smaller screens.

---

### 8. Piano Keyboard — `getMidiX` Dependency Issue

**Problem**: In `PianoKeyboard.tsx`, the `intervalPairs` `useMemo` (line 87) lists `whiteKeys` as a dependency, but `getMidiX` is a closure that captures `whiteKeys` without being in the dependency array. The `whiteKeys` array is recreated every render (not memoized).

**Fix**: Memoize `whiteKeys`, `blackKeys`, and `getMidiX` with `useMemo`/`useCallback` to prevent unnecessary recalculations.

---

### 9. URL State Persistence

**Problem**: The current harmony state (key, root, chord, scale) is entirely in-memory. Refreshing the page resets everything. Users can't share a specific chord analysis via URL.

**Fix**: Sync key state to URL search params (e.g. `?key=C&root=G&chord=Dominant+7&scale=Ionian`). This enables bookmarking and sharing.

---

### Summary of Changes

| # | Area | Impact | Effort |
|---|------|--------|--------|
| 1 | Console warnings | Clean | Low |
| 2 | React.memo on heavy components | Performance | Low |
| 3 | Limit ghost voicing rendering | Performance | Low |
| 4 | Consolidate TENSION_COLORS | Maintainability | Low |
| 5 | Mobile controls as Sheet | UX | Medium |
| 6 | Accessibility improvements | A11y | Medium |
| 7 | Status bar responsive overflow | UX | Low |
| 8 | Memoize Piano keyboard arrays | Performance | Low |
| 9 | URL state persistence | UX/Sharing | Medium |

I'd recommend tackling items 2, 3, 4, 5, 7, and 8 first as they're high-impact, low-to-medium effort improvements.

