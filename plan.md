# Treesh 3.0 — Bug Fixes, Instrum Overhaul, Storage Mgmt, + LyricFlow Integration

## Ground Rules
- Single file only: `/app/single_html/index.html` (Vanilla JS + Tailwind CDN + localStorage). No build step.
- Served by python `http.server` on `:3000` from `/app/single_html`.
- Light mode class = `html.theme-light` (NOT `.light`).
- DO NOT touch `/app/frontend` or `/app/backend`.
- DO NOT run parallel `search_replace` on `index.html` (race conditions → corruption). **Sequential edits only.**
- English-only UI copy.
- Styling: Tailwind CDN utilities + existing `<style>` block only.
- All new interactive/key UI elements must include `data-testid`.

---

## PHASE 1 — Bug Fixes & UI Polish (Status: IN PROGRESS)
### Completed in this workstream
1. Light-mode Profile modal theming (`#profile-panel` stays dark in light mode) — fixed via theme-light overrides. ✅
2. Karaoke: smoother animations (rAF loop), add full-screen karaoke mode. ✅
3. Lyric editing save: preserve metadata/section markers + do not strip structure. ✅
4. Lyric lines: edited indicator + merged explanation/original panel. ✅
5. Lyric lines: user notes (user-authored) + indicator + merged panel. ✅
6. This-or-That champion: correctly resolves current run winner by most wins. ✅
7. Fix “choppy jump/refresh” by preserving scroll-lock state during `renderView()`. ✅
8. Starlites reward system implemented (listening/games/beats + daily gating until profile exists). ✅
9. UI customization: label styling (default white text + customization), custom colors, custom font upload. ✅
10. Voice gating: remove/hide mic UI globally when SpeechRecognition unsupported. ✅
11. App & Page Password Protection shipped earlier in this workstream + lock screen redesign shipped earlier. ✅
12. **Settings tab polish:** Voice tab removed earlier (no meaningful settings at the time). ✅
13. **Global UX protections shipped (new):** ✅
   - Disable zoom: viewport `user-scalable=no` + gesture/wheel/keyboard zoom blockers.
   - Disable text selection globally except editable fields (`input/textarea/select/contenteditable`).
   - Disable image dragging + disable right-click/context menu outside editable fields.
14. **Birthday UX fixes shipped (new):** ✅
   - Onboarding date picker no longer closes instantly (removed destructive re-render; update zodiac/continue button in-place).
   - Onboarding birthday value centered.
   - Settings birthday: full-width input, “Set birthday” placeholder when empty, correct display when set.

### Still pending in Phase 1 (carry-forward)
1. Queue / “Up Next”: allow tapping any song in the list to play it (verify `q-jump` handler). (P2)
2. Mobile mini-bar overlapping bottom navigation (validate at 390×844). (P2)
3. Desktop BPM input: remove/restyle native number spinner arrows. (P3/polish)
4. NEEDS-CLARIFICATION: “best lyrics” setting option the user referenced earlier (ask at checkpoint). (P2)

---

## PHASE 2 — Instrum (Beat Studio) Overhaul (Status: IN PROGRESS)
### Completed (new in this iteration)
1. File Menu dropdown (New/Open/Save/Import/Export + Guide) shipped previously. ✅
2. Bugfix: File dropdown behind grid / clicks not working ✅
3. Bugfix: Presets strip not working ✅
4. **Rename:** “Treesh Studio” → **“Instrum Studio”** (UI labels). ✅

### Still pending in Phase 2 (carry-forward backlog)
1. **Open Studio transition:** add seamless animated transition into the studio. (P1)
2. **Top control row scroll + overflow:** horizontal-only scrolling; fix play/pause overflow + clipped radial glow. (P1)
3. **Presets visible in fullscreen mode**. (P1)
4. **Fullscreen UI cleanup:** remove redundant X button (keep minimize) + smoother fullscreen/minimize transition. (P1)
5. Row labels overlap at medium/large font sizes. (P1)
6. First cell width smaller than rest (verify intention; fix if unintended). (P2)
7. Playback step indicator should highlight active beats properly (currently makes them look invisible/outlined). (P1)
8. Guide & FAQ: expand content, organize into tabs, add legend key, add more FAQs/hints. (P2)
9. Add more instruments incl. Piano/Keys (melodic). (P2)
10. Ensure saving projects persists reliably to `treesh_beats` across refreshes (re-test). (P2)
11. Custom audio stems / record vocals (BandLab-style). (P2) *(also aligns with broader app “custom audio uploads” effort)*

---

## PHASE A — Immediate: Lock Screen Polish (Status: COMPLETED)
**User-confirmed fixes:**
1. When lock screen is shown, **background app is non-scrollable**.
2. **Clock/date removed** from lock screen UI.
3. Lock screen **fits all viewports** (mobile/desktop) with no overflow/scroll.

What was implemented
1. Scroll-lock integration
   - `overlaysOpen()` now includes `state._lockActive` so `syncScrollLock()` locks the background.
2. UI changes
   - Removed `#lock-clock` and `#lock-date` from the template.
   - Tightened spacing so keypad fits small heights.
3. Viewport-fit
   - Lock inner layout uses `h-[100dvh]` and centered `m-auto` content to prevent clipping.

Testing (automation)
- Verified lock screen shows and blocks scroll (`body.position=fixed`, `scrollY` stays `0`).
- Wrong PIN shows error; correct PIN (`0000`) unlocks and restores scroll.
- Verified no overflow on small viewport tests.

---

## PHASE B — P0: Storage Management (Status: COMPLETED)
**User confirmed scope:** Visual gauge + breakdown + delete controls + clear-all.

What was implemented
1. Added **Settings → Account → “Storage & data”** section.
2. Computed usage
   - Treesh usage estimate via `localStorage` key/value length UTF-16 bytes.
   - Device estimate via `navigator.storage.estimate()` (best-effort), shown as “~X free on device”.
3. UI
   - Usage gauge (Treesh used) + estimate text.
   - 6 category cards: **Library & playlists**, **Beats & presets**, **Games & rewards**, **Appearance & profile**, **Cache**, **Security**.
   - Each card shows size + per-group delete button (empty groups are dimmed/disabled).
   - “Clear all Treesh data” button.
4. Deletion behavior
   - Group delete and clear-all use confirm dialog.
   - Clear-all and “Erase everything” remove **all** `treesh*` keys, then reload.

Testing (automation)
- Storage UI rendered and displayed correct totals.
- Cache group clear removed `treesh_recent_searches` (catalog cache repopulates as expected).

---

## PHASE C — P1 Bugs: Overflow Fixes (Status: COMPLETED)
### 1) Welcome/Onboarding birthday input overflow
Fix implemented (revised)
- Reworked date input behavior so:
  - No overflow in layout.
  - Picker does **not** instantly close due to DOM re-render.
  - Date value can be centered.
- Added `showPicker()`-on-click best-effort for browsers that support it.

Testing
- Automation validates stable DOM (no re-render loop) and correct UI state updates.
- **Needs real-device confirmation** (iOS Safari/Android Chrome) for native picker behavior.

### 2) Desktop Now Playing cover art overflow
Fix implemented
- Reduced artwork `vh` cap:
  - Mobile: `42vh → 40vh`
  - Desktop (`lg:`): `64vh → 48vh`
- Prevents cover art from overlapping seek/controls on short laptop heights.

Testing
- Verified at `1280×620`: cover art no longer overlaps seek bar.

---

## PHASE D — P1: Song Metadata (`data-bio` / `data-desc`) (Status: COMPLETED)
What was implemented
1. Parsing
   - `parseSongs()` now reads `data-desc` into `song.desc` (existing `song.bio` preserved).
2. Song Details modal
   - Added an “About” section to `openMetadata()` modal.
3. Now Playing
   - **Removed** “About this track” under cover art per user preference (About remains in Metadata modal only). ✅

Testing
- Verified metadata “About” renders when `desc` is present.

---

## >>> CHECKPOINT: PAUSE & USER REVIEW (Status: NEEDS REVIEW) <<<
Per your batch-then-review preference, the following are ready for your review now:
- Lock screen: no background scrolling, no clock/date, fits all screens, unlock works with `0000`.
- Storage & data UI: gauge + device estimate + breakdown + clear buttons.
- Birthday inputs:
  - Onboarding: picker no longer closes instantly; centered value.
  - Settings: full-width field, “Set birthday” placeholder, correct empty/set behavior.
- Global protections: no zoom, no accidental text selection, image drag disabled, right click disabled.
- Desktop cover art overflow fixed.
- Metadata: `data-desc` parsing + About shown in Metadata modal (not in Now Playing).

Please confirm on your phone:
1. Onboarding birthday date picker: does it stay open while changing month/day?
2. Settings birthday field: does it look full-width and display the chosen date correctly?

---

## PHASE 3 — Global Search Overhaul (Status: NOT STARTED)
### Goals
1. **Smooth open/close transition** (blur + fade + panel motion together; avoid “text appears before blur”).
2. Mobile keyboard behavior (best-effort): only the search box rises; avoid whole app shifting.
3. Layout: results area fills available space (remove large bottom gap).
4. **Extremely smart search**:
   - Case-insensitive, accent-insensitive (Moné == Mone), punctuation-insensitive (A. == A).
   - Fuzzy/partial matching (e.g., “Mo A Lisa” → “Moné A. Lisa”).
   - Query parsing for `"<song> by <artist>"`.
   - Artist name searchable alongside songs.
5. Filters in search results (e.g., Songs / Artists / Explicit / Treesh Picks / Genre / Mood).
6. Recently searched positioned just above search box.
7. Lyrics actions in Search:
   - Favorite/unfavorite lyrics from search.
   - Create lyric cards without requiring favorite.

### Implementation steps (planned)
- Add `normalize(str)` function: lower-case + remove diacritics + strip punctuation.
- Add token scoring: exact token matches + prefix matches + subsequence/fuzzy bonus.
- Add `by <artist>` parsing: split query and score title vs artist separately.
- UI restructure: flex column with results `flex-1 overflow-y-auto`, bottom docked search bar.
- Transition: add overlay entrance animation (opacity + blur + translate).

---

## PHASE 4 — Music Library Filters/Sorting (Status: NOT STARTED)
- Add sort/filter controls to Library:
  - Sort: recently added, title A→Z, artist A→Z, most played.
  - Filter: explicit, Treesh Pick, genre, mood.

---

## PHASE 5 — Now Playing / Lyrics UX Upgrades (Status: NOT STARTED)
1. Edited lyrics should reflect immediately after save.
2. Add transition when launching “WHAT’S NEXT?” game from lyrics.
3. Karaoke:
   - Make letter-by-letter animation smoother.
   - Add exit-fullscreen button in fullscreen karaoke.
4. Fix lyric line spacing bug (edit/like buttons shouldn’t change line spacing).
5. Scrubber:
   - Add accent-colored progress fill.
   - Add A↔B loop (set start/end, repeat until disabled).
6. Minibar:
   - Allow scrubbing while minimized.

---

## PHASE 6 — Lyric Cards Overhaul (Status: NOT STARTED)
1. Create lyric cards without requiring lyrics to be favorited.
2. Preserve/render line breaks (verse/hook/chorus spacing) in cards.
3. More background options:
   - More presets + custom color picker.
   - Image background (cover art and/or artist photos when available).
   - Overlay controls: darken/gradient + blur.
4. Layout options:
   - If not using image bg: keep cover art + title/artist bottom-left.
   - Cover art shape options: rounded, sharp, heart, triangle, diamond, oval, star, cloud, circle.

---

## PHASE 7 — Voice Controls Overhaul (Status: NEEDS DECISION)
### Requested capabilities
- Smart voice commands:
  - play / pause
  - play `<song>` [by `<artist>`] (with disambiguation UI if needed)
  - play `<artist>` (shuffle all tracks by/with artist)
  - open `<page>` (natural phrasing like “go to the studio”, “change settings”)
  - close `<module>`
- Bring back Voice settings tab with:
  - Guide/help + examples
  - Custom phrases → actions (automation)
  - Optional conversational mode

### Decision required (user)
- **Option A (offline/rule-based):** deterministic intent parser + fuzzy match against library; fast, private, works offline.
- **Option B (LLM-backed conversation):** true chat/assist behavior requires a network LLM API (not currently in scope / would violate “no backend” unless we use a user-provided key and client-side calls). 

Planned approach (default)
- Implement Option A fully first; leave a placeholder “Conversational mode (coming soon)” unless you approve an LLM strategy.

---

## PHASE 8 — Custom Audio Uploads + Instrum Imports (Status: NOT STARTED)
- Upload own audio with metadata + lyrics (stored locally).
- Import Instrum projects into library with metadata/custom lyrics.

---

## PHASE 9 — LyricFlow Integration (Status: NOT STARTED)
**Blocked until higher-priority UX issues are addressed.**
- Add top-level nav section.
- Port `/app/lyricflow_reference.txt` into `index.html` (Vanilla JS + Tailwind).
- Persist under `treesh_lyricflow_*` keys (localStorage preferred; IndexedDB only if required and consistent with constraints).

---

## Testing
- Screenshot tool for visual validation (desktop 1440×900 + mobile 390×844 + small 320×568 + landscape 812×375).
- testing_agent for complex interaction flows after each phase (search interactions, lyric save-refresh, studio fullscreen/minimize, scrubber A↔B loop).
- No build tools; rely on browser console logs + cautious sequential edits.

## Notes / Decisions (from user)
- Storage UI must include: **visual gauge + breakdown + delete + clear buttons** (done).
- Test PIN: `0000`.
- Keep current player look as the default; customization options should be opt-in.
- Voice settings tab was removed earlier (no settings); Voice overhaul request requires a new dedicated phase + decision (above).
