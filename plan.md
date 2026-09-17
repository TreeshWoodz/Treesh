# Treesh 3.0 Continuation — Phase 5 Plan

## 1) Objectives
- Restore **reliable core playback** across devices (esp. iOS background playback).
- Fix **Favorites playback/queue correctness** and promote Favorites to a first-class auto-playlist.
- Introduce a new **Studios hub** (Instrum + Lyric Studio) with Lyric Studio as a standalone tool.
- Deliver a **modern Lyric Studio upgrade**: rhymes assist, preview mode, explanations, improved layout.
- Rebuild **Voice Controls** into a powerful, programmable assistant (commands + action recording).
- Add **crossfade** (default 6s), **karaoke fullscreen**, **lyric card studio layout**, and **live update toast**.
- Improve lyrics search and remaining UX fixes.

---

## 2) Implementation Steps (Phased)

### Phase 0 (P0) — iOS Background Playback (Already Done)
**What’s implemented:**
- `IS_IOS` detection.
- Guard: `ensureVizAudio()` returns false on iOS (prevents `createMediaElementSource(audio)`), protecting background audio.
- EQ modal note explaining iOS tradeoff.

**Validation tasks (still required):**
- Confirm background playback stays active on iOS with:
  - EQ opened/closed
  - Viz enabled/disabled
  - Switching tracks

**User stories:**
1. As a user on iOS, I can lock my phone and music continues playing.
2. As a user on iOS, opening EQ does not break background playback.
3. As a user, switching tracks doesn’t cause unexpected stops.
4. As a user, playback controls from lock screen work.
5. As a user, the app explains why EQ behaves differently on iOS.

---

### Phase A — Favorites Playback Fix + Favorites Auto-Playlist + Profile Auto-Close
**Core issue:** `state.contextList` is global and can be overwritten by re-renders (sidebar/library/profile), causing wrong queues.

**POC (core workflow isolation):**
- Create a minimal “context token” approach:
  - When rendering a list, embed `data-ctx="favorites"` (or playlist id, artist id, etc.).
  - On click, rebuild context list from that ctx source **on demand** (no reliance on `state.contextList`).
- Validate: play from Favorites always queues favorites.

**Implementation:**
- Add `getContextListFromEl(el)` helper:
  - favorites → `favSongs()`
  - disliked → `dislikedSongs()`
  - playlist → ids → songs
  - artist/other contexts as needed
- Update `songRow()` usage in favorites/profile/library to include ctx attributes.
- Update dispatcher `case "play"` and `playall-context` to use element ctx-based list.
- Favorites auto-playlist:
  - Generate a virtual playlist card/entry when `state.favorites.size>0`.
  - Appears in Profile Playlists tab and Library playlists list.
  - Selecting it uses the same favorites context.
- Auto-close Profile on play/playall:
  - In dispatcher: if `state.profileOpen`, call `closeProfile(true)` before playing.

**User stories:**
1. As a user, playing a track from Profile → Favorites plays that exact song.
2. As a user, “Play” in Favorites plays only favorites in correct order.
3. As a user, Favorites appears like a playlist everywhere when I have favorites.
4. As a user, removing all favorites hides the Favorites playlist automatically.
5. As a user, the Profile closes automatically when I start playback.

---

### Phase B — “Studios” Hub Page (Rename Instrum → Studios)
**Goal:** A hub like Games with multiple studio entries.

**POC:**
- Add a new “Studios” view that renders two cards:
  - Instrum Studio (existing)
  - Lyric Studio (new standalone entry)
- Ensure navigation works and state persists.

**Implementation:**
- Rename nav item/route from `instrum` to `studios`.
- Studios view:
  - Card: Instrum (opens existing instrum start/route)
  - Card: Lyric Studio (opens new standalone lyric studio)
- Keep existing deep-links to Instrum working (alias route).

**User stories:**
1. As a user, I can open a single Studios page listing all creative tools.
2. As a user, I can enter Instrum Studio from Studios.
3. As a user, I can enter Lyric Studio from Studios without selecting a song.
4. As a user, Studios feels consistent with Games hub.
5. As a user, I can return back to Studios quickly.

---

### Phase C — Lyric Studio Big Upgrade (Standalone + Rhymes + Preview + Explanations + Redesign)
This is complex UI + text assistance + audio preview flows.

**POC (must pass before full redesign):**
1. Standalone Lyric Studio loads with:
   - song picker (library + favorites + search)
   - editable lyric lines list
2. Rhymes panel MVP:
   - detect last word typed (or selected text) from the active input
   - show a list of rhyme suggestions
   - click inserts word at cursor
3. Preview MVP:
   - uses main `<audio>` element
   - opens a preview pane that uses the same lyric rendering/highlight logic as Now Playing
4. Explanations MVP:
   - per-line explanation stored in lyric edits structure (non-destructive)

**Implementation:**
- Create new Lyric Studio “project” state:
  - `{ songId, mode: 'write'|'sync', items, explanations, previewOpen, ... }`
- Rhyme engine:
  - Start with offline mini-dictionary approach (small embedded rhyme map) OR heuristic suffix matching.
  - Optionally add a settings toggle to use a lightweight public endpoint later.
- Preview:
  - Reuse existing lyric highlight functions with a dedicated container.
  - Preview mode mirrors Now Playing lyrics UI but inside studio.
- Explanations:
  - Add `data-explanation` support to lyric entries.
  - Provide UI to add/edit explanation on a line (modal or inline).
- Redesign layout:
  - Split view: editor + rhymes panel + preview panel (responsive, mobile-first).

**User stories:**
1. As a user, I can open Lyric Studio without starting playback first.
2. As a user, as I type, I see rhyme suggestions for my current word.
3. As a user, tapping a rhyme inserts it where my cursor is.
4. As a user, I can preview lyrics synced to audio inside the studio.
5. As a user, I can add explanations to my own lyrics and revisit them later.

---

### Phase D — Voice Controls Overhaul (Commands + Custom Macros + Action Recording + UI)
This is a complex “automation” system inside a fragile SPA.

**POC (core workflow isolation):**
- Implement reliable recognition loop:
  - start/stop mic
  - show live transcript
  - parse commands with confidence thresholds
- Implement 10 core commands end-to-end:
  - play/pause/next/prev
  - open/close profile
  - open studios/games/library
  - set volume 50%
- Implement Action Recorder MVP:
  - record a sequence of `data-act` dispatches + parameters
  - save as a named voice command
  - trigger it by spoken phrase

**Implementation:**
- Voice command router:
  - `intent = parseVoice(text)`
  - `executeIntent(intent)`
- Command registry:
  - built-in commands + user-defined macros persisted in LocalStorage
- Macro recording:
  - hook central click dispatcher to log actions when “recording”
  - store as replayable list of `{act, id, extra}`
- UI redesign:
  - lively assistant modal: waveform + status + suggestions + “examples”
  - settings: mic permissions, wake phrase (optional), command list editor
- Conversation mode MVP:
  - simple scripted replies + optional Web Speech synthesis (no external AI by default)

**User stories:**
1. As a user, I can say “play” and music starts.
2. As a user, I can say “open studios” and navigate there.
3. As a user, I can create my own voice command phrase.
4. As a user, I can record actions and bind them to a phrase.
5. As a user, the assistant feels alive (clear state, feedback, visuals).

---

### Phase E — Crossfade & Smooth Transitions
**POC:**
- Implement fade-out/fade-in using `<audio>.volume` automation around `loadIndex()` transitions.
- Verify works for:
  - manual next/prev
  - auto `ended` advance

**Implementation:**
- Add setting `state.crossfadeSec` (3–30) default 6, and enable toggle.
- Wrap `nextTrack/prevTrack/loadIndex` with a transition controller:
  - ramp volume down
  - switch track
  - ramp volume up
- Add subtle UI animation for track change.

**User stories:**
1. As a user, next/prev transitions are smooth and not abrupt.
2. As a user, auto-advance crossfades at song end.
3. As a user, I can set crossfade time (3–30s).
4. As a user, I can turn crossfade off instantly.
5. As a user, transitions don’t cause playback bugs.

---

### Phase F — Karaoke Fullscreen Revamp
- True fullscreen black canvas, minimal chrome.
- White text, line transitions, tap to exit.

**User stories:**
1. As a user, karaoke fullscreen is distraction-free.
2. As a user, lyrics remain in sync in fullscreen.
3. As a user, I can exit fullscreen with one tap.
4. As a user, count-in still works.
5. As a user, it works on mobile rotation.

---

### Phase G — Lyric Card Studio: Sticky Preview + Mobile Layout
- Keep preview always visible while editing.

**User stories:**
1. As a user, I can edit while always seeing my card preview.
2. As a user, layout works on small phones.
3. As a user, changes reflect instantly.
4. As a user, no scrolling traps.
5. As a user, I can export/share without glitches.

---

### Phase H — Live Update Toast
- Detect update via BUILD_ID mismatch or Last-Modified polling.

**User stories:**
1. As a user, I get a friendly toast when the app updates.
2. As a user, it doesn’t interrupt playback.
3. As a user, it includes date/time.
4. As a user, it only shows once per update.
5. As a user, it’s dismissible.

---

### Phase I — Remaining Improvements
- Find Lyrics search accuracy (query formatting + ranking).
- Add lyrics on upload.
- Vocotap: pause music when game opens + hide player button.

**User stories:**
1. As a user, lyric search finds correct results faster.
2. As a user, I can add lyrics right when uploading.
3. As a user, opening a game pauses music automatically.
4. As a user, game UI isn’t cluttered by player controls.
5. As a user, these features work offline where applicable.

---

## 3) Next Actions (Immediate)
1. **Re-test iOS background playback** on real device (lock screen, app switch, EQ open).
2. Implement Phase A POC: ctx-based queue building (remove reliance on `state.contextList` for click playback).
3. Roll Phase A into full app (Favorites auto-playlist + profile auto-close).
4. Build Phase B Studios hub scaffold (route + two cards) and confirm navigation.
5. Start Phase C Lyric Studio POC (standalone + rhymes + preview + explanations).

---

## 4) Success Criteria
- iOS: background playback continues reliably after background/lock with no random stops.
- Favorites: playing from Profile Favorites always plays the correct favorites queue.
- Favorites auto-playlist appears/disappears correctly and is playable everywhere.
- Studios page exists, Instrum + Lyric Studio accessible.
- Lyric Studio POC proves rhymes insert + preview works; then redesign ships without regressions.
- Voice assistant POC proves command execution + macro recording; then expanded command set.
- Crossfade works for manual + auto track changes with default 6s.
- Karaoke fullscreen and other UI upgrades pass screenshot/e2e checks.
