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

## PHASE 1 — Bug Fixes & UI Polish (Status: PARTIALLY COMPLETE)
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
12. Settings tab polish: Voice tab removed earlier (no meaningful settings at the time). ✅
13. **Global UX protections shipped (new):** ✅
   - Disable zoom: viewport `maximum-scale=1.0, user-scalable=no` + gesture/wheel/keyboard zoom blockers.
   - Disable text selection globally except editable fields (`input/textarea/select/contenteditable`).
   - Disable image dragging + disable right-click/context menu outside editable fields.
14. **Birthday UX fixes shipped (revised, new):** ✅
   - Replaced brittle native date inputs with a **custom date field** (`dateFieldHTML`) using a fully-styled container + transparent native `input[type=date]` overlay.
   - Prevents overflow on all viewports (Welcome/Onboarding/Settings/Parent-DOB).
   - Picker no longer closes instantly (removed destructive re-render; updates happen in-place).
   - Clean placeholders (e.g., “Select your birthday” / “Set birthday”) and formatted display (e.g., “Jun 15, 1995”).
   - `showPicker()` on click best-effort for browsers that support it.
15. **Welcome birthday overflow regression fixed (new):** ✅ via the custom date field approach.

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
Fix implemented (final)
- Migrated all birthday/date inputs to the **custom date field** wrapper:
  - No overflow in layout.
  - Picker does not close due to DOM re-render.
  - Clean placeholder + formatted display.

Testing
- Verified no horizontal overflow in automation.
- Verified picker stability by eliminating full re-render on date change.

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

## >>> CHECKPOINT: PAUSE & USER REVIEW (Status: UPDATED) <<<
User cadence: **review after each phase**.

### Ready for review (already implemented)
- Lock screen: no background scrolling, no clock/date, fits all screens, unlock works with `0000`.
- Storage & data UI: gauge + device estimate + breakdown + clear buttons.
- Birthday/date fields (all places): no overflow, consistent width, placeholders, formatted display, picker stable.
- Global protections: no zoom, no accidental text selection, image drag disabled, right click disabled.
- Desktop cover art overflow fixed.
- Metadata: `data-desc` parsing + About shown in Metadata modal (not in Now Playing).

### Newly completed and ready for review
- **PHASE 3 Global Search overhaul** (below).

---

## PHASE 3 — Global Search Overhaul (Status: COMPLETED)
### Goals (delivered)
1. Smooth open/close transition (blur + fade + panel motion together; avoid “text appears before blur”). ✅
2. Mobile keyboard behavior (best-effort): only the search dock rises; avoid whole app shifting. ✅
3. Layout: results area fills available space (remove large bottom gap). ✅
4. Extremely smart search (accent/punct/case-insensitive + fuzzy/partial matching). ✅
5. Filters in search results + sorting controls. ✅
6. Recently searched positioned just above search box (not centered). ✅
7. Lyrics actions in Search:
   - Favorite/unfavorite lyrics from search. ✅
   - Create lyric cards without requiring favorite. ✅

### What was implemented
1. **Smart fuzzy search engine**
   - `normStr()` strips diacritics/accents and punctuation, normalizes whitespace.
   - Token scoring: exact match + prefix + substring + subsequence bonus.
   - `"<song> by <artist>"` query parsing (`parseByQuery`).
   - Song scoring considers: title, artist, featuring, writtenBy, genre, mood, album.
   - Artist scoring considers: name + role.
   - Lyrics search matches normalized lyric text.

2. **UI overhaul**
   - New flex layout: results `flex-1` fill available space; dock pinned bottom.
   - Recent searches moved into a horizontal chip bar **directly above the search box**.
   - Added songs-only filter chips: All / Picks / Explicit / Clean.
   - Added sort chips: Top / A–Z / Artist.

3. **Smooth open transition**
   - Split overlay into:
     - `.search-backdrop` (blur/fade establishes first)
     - `.search-content` (content fades/slides in with delay)
   - Fixes “text appears before blur” jank.

4. **Lyrics results actions**
   - Each lyric result row now has:
     - Heart toggle (favorite/unfavorite lyric)
     - “Make card” button
   - Implemented `state.studio.picked` + `studioLines()` to allow building lyric cards **without** favoriting.
   - Updated builder/draw/share logic to use `studioLines()`.

### Verification (automation)
- Confirmed no results/dock gap (gap = 0).
- Confirmed recent chip placement above search box.
- Confirmed fuzzy matching for user examples:
  - “mona lisa by savionce” → Moné A. Lisa by SAVIONCE (1 result)
  - “mone alisa”, “mone a lisa”, “MONE A. LISA” all top-match.
  - Typos/partials/no punctuation also work.
- Confirmed Lyrics tab: favorite toggle + make-card present for each row.
- Confirmed make-card does not require favoriting (favCount remains 0).

---

## PHASE 4 — Music Library Filters/Sorting (Status: NOT STARTED)
- Add sort/filter controls to Library:
  - Sort: recently added, title A→Z, artist A→Z, most played.
  - Filter: explicit, Treesh Pick, genre, mood.

---

## PHASE 5 — Now Playing / Lyrics UX Upgrades (Status: NEXT UP)
**User priority order after Search:** Now Playing upgrades → Instrum fixes → Lyric Cards overhaul → Voice overhaul.

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

Implementation notes (planned)
- Identify lyric edit save flow; ensure `renderLyrics()` / NP lyric panel refreshes immediately after save.
- Add transition classes for game open (overlay fade/scale) before navigation/state switch.
- Karaoke performance:
  - Reduce DOM churn; prefer transform/opacity + requestAnimationFrame; cache measurements.
  - Add obvious exit-fullscreen control in fullscreen karaoke.
- Lyric line spacing:
  - Move edit/like controls to absolute-positioned overlay or fixed-width inline container that doesn’t change line height.
- Scrubber progress fill:
  - Use CSS background-size or a sibling progress element synced to currentTime/duration.
- A–B loop:
  - Store `state.abLoop={on,a,b}`; clamp seeking and loop on `timeupdate`.
- Minibar scrubbing:
  - Add pointer handlers for the mini seek slider; sync with main player.

---

## PHASE 6 — Lyric Cards Overhaul (Status: NOT STARTED)
1. Preserve/render line breaks (verse/hook/chorus spacing) in cards.
2. More background options:
   - More presets + custom color picker.
   - Image background (cover art and/or artist photos when available).
   - Overlay controls: darken/gradient + blur.
3. Layout options:
   - If not using image bg: keep cover art + title/artist bottom-left.
   - Cover art shape options: rounded, sharp, heart, triangle, diamond, oval, star, cloud, circle.

*(Note: Phase 3 already enabled “make card without favoriting” by introducing `picked` lines; Phase 6 expands visual customization and line-break fidelity.)*

---

## PHASE 7 — Voice Controls Overhaul (Status: DECIDED / NOT STARTED)
Decision (user)
- **Offline / rule-based approach confirmed** (private, offline; no API key).

Requested capabilities
- Smart voice commands:
  - play / pause
  - play `<song>` [by `<artist>`] (with disambiguation UI if needed)
  - play `<artist>` (shuffle all tracks by/with artist)
  - open `<page>` (natural phrasing like “go to the studio”, “change settings”)
  - close `<module>`
- Bring back Voice settings tab with:
  - Guide/help + examples
  - Custom phrases → actions (automation)

Planned approach
- Implement deterministic intent parser + fuzzy matcher (reuse Search normalization/scoring).
- Add disambiguation modal when multiple candidates match.
- Re-add Voice settings tab containing:
  - Toggle + permission status
  - Command guide
  - Custom phrase manager (phrase → action mapping)

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
- testing_agent for complex interaction flows after each phase:
  - Search interactions (completed), lyric save-refresh, scrubber A↔B loop, minibar scrubbing, karaoke fullscreen exit, studio fullscreen/minimize.
- No build tools; rely on browser console logs + cautious sequential edits.

## Notes / Decisions (from user)
- Storage UI must include: **visual gauge + breakdown + delete + clear buttons** (done).
- Test PIN: `0000`.
- Keep current player look as the default; customization options should be opt-in.
- Voice approach: **offline/rule-based** confirmed; conversational LLM mode not in scope.
- Delivery cadence: **review after each major phase**.
