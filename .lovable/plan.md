
## Review: Bugs and Improvements

### Bugs Found

**1. Cadence chaining race condition (CadenceExplorer.tsx, lines 39-42)**
The `handleSelect` function calls `setCadenceMode(false)` then immediately `setCadenceMode(true)`. Because React batches state updates, the `setCadenceMode(true)` callback inside HarmonyContext reads the *current* `harmonicRoot` and `chord` — but `setChord` and `setRoot` haven't been called yet (they happen on lines 50-51). However, the real issue is the *opposite*: calling `setCadenceMode(false)` then `setCadenceMode(true)` in the same render batch means the second call re-locks the *old* harmony (before the new chord/root are set), which is actually the desired behavior. But because React 18 batches these, the intermediate `false` state may never take effect, meaning `lockedRoot`/`lockedChord` might not update. This needs to be restructured — the context should expose a `relockCadence()` method that directly sets the locked values to the current harmony without toggling.

**2. Interval label "st" suffix is incorrect (multiple components)**
Throughout the app, semitone counts are displayed with the suffix `st` (e.g., "7st", "5st"). The correct abbreviation is "st" only for 1 (1st). For other numbers it should be just "st" as shorthand for "semitones" — but this reads as ordinal ("7st" instead of "7th"). This is ambiguous. Should use "st" consistently as abbreviation for "semitones" or spell it out as e.g. "7 sem".

**3. Console warning: Function components cannot be given refs**
PitchClock and ControlPanel are being passed refs somewhere in Index.tsx. Looking at the code, `SECTION_COMPONENTS` maps section IDs to components and renders them via `React.createElement(SECTION_COMPONENTS[id])` in the mobile view. The ref warning likely comes from somewhere else — possibly the `section` wrapper. This is a minor React warning but should be cleaned up.

**4. Duplicate label controls**
The label mode toggle (notes/intervals/semitones) and flats toggle appear in *both* the ControlPanel sidebar AND below the PitchClock. This is redundant and could confuse users about which is the "source of truth." Consider removing the duplicate from either location.

**5. `ArrowHead` component generates random IDs on every render (PitchClock.tsx, line 63)**
`Math.random().toString(36).slice(2, 8)` is called during render, which means new marker IDs every re-render. This causes unnecessary SVG DOM churn and could cause flickering. Should use stable IDs based on the arrow's from/to values.

### Improvements

**6. Missing mobile control panel for construction/cadence mode**
The construction mode and cadence mode toggles are only in the PitchClock header. On mobile, the ControlPanel is inside a `<details>` element, but these toggles aren't in it — they're only visible when scrolled to the Pitch Clock section.

**7. Cadence Explorer: no way to exit cadence mode**
Once cadence mode is activated via the explorer, there's no clear "exit" or "reset" button within the CadenceExplorer component itself. Users must scroll up to the PitchClock to toggle it off.

**8. Guitar fretboard: all voicings rendered simultaneously**
All generated voicings are rendered on top of each other in the fretboard SVG, creating visual clutter. Should add a voicing selector (prev/next) to browse one voicing at a time.

### Plan

1. **Fix cadence chaining** — Add a `relockCadence()` method to HarmonyContext that atomically sets `lockedRoot = harmonicRoot` and `lockedChord = chord` without toggling. Use this in CadenceExplorer's `handleSelect`.

2. **Fix unstable ArrowHead IDs** — Replace `Math.random()` with deterministic IDs based on from/to pitch classes.

3. **Remove duplicate label/flat controls** — Remove the label mode and flats toggles from inside the PitchClock component since they already exist in the ControlPanel sidebar (and mobile details panel).

4. **Add cadence mode exit in CadenceExplorer** — Add a small "Exit Cadence" button in the CadenceExplorer when cadence mode is active.

5. **Add voicing navigator to Guitar Fretboard** — Show one voicing at a time with prev/next buttons instead of overlapping all voicings.

6. **Clean up "st" semitone labels** — Change to "st" → "sem" or just the number for clarity across IntervalRelationshipList, PianoKeyboard, and StaffNotation.
