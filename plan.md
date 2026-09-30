# plan.md — Chainz Ultimate Makeover + Treesh Starlites/Profile Sync

## 1) Objectives
- Rebuild **Chainz** as a polished, App-Store-grade **React** SPA that can be deployed as static files at `https://treesh.life/games/chainz` (no backend dependency, no router path dependency).
- Seamlessly integrate Treesh data:
  - Read/apply `treesh_profile` (nickname/avatar) and `treesh_accent` (theme).
  - Earn/spend **Starlites** via `treesh_stars` with consistent logs.
  - Patch parent `index.html` to live-sync changes from the game (avoid overwrite/race).
- Upgrade word validation: **large built-in bank** + **live Datamuse API** + **IndexedDB caching** + offline fallback.
- Add **multiple working game modes**, **achievements/trophies**, and a **Starlites gift shop** (currency = Starlites).
- Replace brittle/legacy logic (GSAP/jQuery) with a maintainable state-driven architecture; squash known bugs.

## 2) Implementation Steps

### Phase 1 — Core POC (must pass before full build)
**Goal:** prove the hardest parts work end-to-end in isolation: word validation engine + Treesh Starlite/profile sync + persistence.

User stories (POC)
1. As a player, I can enter a word and get an immediate accept/reject with a clear reason.
2. As a player, my accepted links work offline using a built-in bank.
3. As a player, when online, I can use broader “real” related words via Datamuse.
4. As a Treesh user, I see my nickname/avatar and accent color reflected instantly in Chainz.
5. As a Treesh user, I earn Starlites in Chainz and see my total update in Treesh without refresh.

Steps
1. **Web research (best practice)**
   - Confirm Datamuse usage patterns (rate limits, params like `ml`, `rel_trg`, `sp`, caching strategy) and IndexedDB caching patterns in React.
2. **Generate built-in bank (build-time asset)**
   - Create `/public/data/chainz-bank.json` containing vocabulary + associations + compound mappings (generated script).
   - Include a small profanity/unsafe filter list in generation + runtime.
3. **POC: Word validation module**
   - Implement `validateLink(prompt, answer, modeRules)` that checks in this order:
     - Normalization (lowercase, trim, ASCII letters)
     - Mode-specific constraints (e.g., Letter Link, Compound)
     - Built-in bank acceptance
     - If online: Datamuse acceptance (with min-score/frequency thresholds)
     - Cache Datamuse results in IndexedDB store `assoc`.
4. **POC: Treesh bridge module**
   - Implement `treeshRead()` for `treesh_profile`, `treesh_accent`, `treesh_stars`.
   - Implement `treeshAwardStars(amount, reason)` and `treeshSpendStars(amount, reason)` that:
     - Update `treesh_stars.points` and append log entries (cap 50) exactly like parent.
     - Broadcast updates via `postMessage` to parent + rely on `storage` events.
5. **POC UI page (single screen)**
   - Minimal screen: shows profile + accent, prompt/answer input, validate button, “award +10” test button, and a “spend -10” test button.
6. **Exit criteria for Phase 1**
   - Validation works for: offline (bank), online (Datamuse), cached repeat lookup.
   - Starlites update persists and parent can reflect updates live (after patch in Phase 2).

### Phase 2 — V1 App Development (React game MVP)
**Goal:** build the full playable game around the proven core.

User stories (V1)
1. As a player, I can choose a mode, start a run, and clearly understand win/lose conditions.
2. As a player, I can switch between on-screen keyboard and system keyboard in Settings.
3. As a player, I can earn Starlites during/after a run with transparent breakdown.
4. As a player, I can unlock achievements and see progress and rewards.
5. As a player, I can open the Shop and buy/equip a keyboard skin using Starlites.

Steps
1. **App shell + theming**
   - Use Treesh fonts (Manrope/Doto/etc) and apply CSS variables from `treesh_accent`.
   - Screen-state machine (no routes): Home → Mode Select → Run → Results → Shop → Achievements → Settings.
2. **Persistence layer**
   - `localStorage` key `chainz_save` for settings/inventory/equipped/achievements/stats.
   - `IndexedDB` database `chainz_db`:
     - `assoc` (Datamuse cache)
     - `runs` (run history: mode, score, chain, timestamps)
3. **Core gameplay implementation**
   - Timer + turn loop + input handling + animations (CSS/Framer Motion).
   - Robust prompt selection and used-word/prompt tracking.
   - Clear error states (already-used, invalid, offline/online differences).
4. **Game modes (working set)**
   - Classic (per-turn timer)
   - Blitz (global 60s)
   - Survival (hearts)
   - Sudden Death (1 mistake ends)
   - Zen (no fail, lower rewards)
   - Daily Chain (date-seeded, 1 attempt/day)
   - Letter Link (starts with last letter)
   - Compound (prompt+answer forms compound, using bank compound map + Datamuse `sp` fallback)
5. **Starlite reward design + implementation**
   - During play: +1 per valid link, +5 per 5-chain milestone, speed bonus +2 under threshold, difficulty multipliers.
   - End of run: completion bonus, PB bonus, daily bonus, first-run-of-day bonus.
   - Achievements grant one-time Starlite payouts.
   - Shop spending writes negative log entry.
6. **Achievements/trophies**
   - ~30–40 achievements with tiers (chains, streaks, speed, daily streak, mode-specific feats).
   - Toast + achievement screen + progress bars.
7. **Shop (gift shop) V1**
   - Categories: Power-ups, Keyboard Skins, Trails/Particles, Backgrounds.
   - Owned/equipped state saved to `chainz_save`.
   - Purchases validated against `treesh_stars.points`.
8. **Settings V1**
   - SFX/music/volume, reduced motion, shake, particles, timer bar, countdown style, autocap.
   - “Use system keyboard” toggle (disables on-screen keyboard UI).
9. **End-to-end testing round**
   - Run through: start run → validate words → end run → stars awarded → buy item → equip → refresh persists.

### Phase 3 — Parent Treesh patch + polish + hardening
**Goal:** ensure seamless integration when embedded in Treesh iframe; eliminate race conditions.

User stories (Integration/Polish)
1. As a Treesh user, if Chainz awards Starlites, Treesh UI reflects it immediately.
2. As a Treesh user, profile/accent changes in Treesh reflect in Chainz without reload.
3. As a player, I never lose Starlites due to stale in-memory overwrites.
4. As a player, the game remains smooth on mobile with overlays/keyboard.
5. As a player, I can factory-reset Chainz data without affecting Treesh library data.

Steps
1. **Patch `index.html` (parent) live-sync**
   - Add `window.addEventListener('storage', ...)` to refresh `state.stars/profile/accent` from LS and update displays.
   - Add `window.addEventListener('message', ...)` to accept `{type:'TREESH_SYNC', keys:[...]}` from iframe and refresh.
   - Ensure patch is minimal and doesn’t break existing state.
2. **Cross-origin safety**
   - Even though same-origin expected, keep postMessage origin checks + fallback.
3. **Performance + UX polish**
   - Reduce layout thrash; memoize heavy selectors; cap run history.
   - Accessibility: focus states, reduced motion compliance, readable contrast.
4. **Bug bash + regression testing**
   - Validate all modes, shop purchase edge cases, offline/online transitions, IndexedDB failures.

### Phase 4 — Release packaging & GitHub deployment readiness
User stories (Release)
1. As a maintainer, I can build static files and deploy them to `/games/chainz/` without breaking assets.
2. As a maintainer, I can set the correct base path so the app works under a subdirectory.
3. As a user, refresh/deep reload still loads the app correctly.
4. As a user, data persists across sessions.
5. As a user, the app works on mobile Safari/Chrome.

Steps
1. Set build to work at subpath (`homepage: "."` or equivalent) and only use relative asset URLs.
2. Provide `README` deploy notes (GitHub Pages / static hosting).
3. Deliverables folder:
   - `deliverables/chainz-react-build/` (static build)
   - `deliverables/index.html` (patched parent)

## STATUS (updated)
- Phase 1 POC: DONE. /app/tools/test_core.mjs passes 19/19 (bank offline, Datamuse online, neighbour-overlap, letter link, compound). Bank generated by /app/tools/genbank.py -> /app/frontend/public/data/chainz-bank.json (20k vocab, 1.8k prompts, 680 compound prompts).
- Phase 2 V1: BUILT. React screens: Home, Modes, Play, Results, Trophies (46), Shop (power-ups, crates, 9 keyboards, 6 sounds, 8 arenas, 6 effects, 8 titles), Profile (IDB run history), Settings (system keyboard toggle etc), HowTo. Game logic in src/screens/Play.jsx; economy in src/game/GameContext.jsx.
- Phase 3: parent patch DONE (/app/tools/patch_treesh.py -> /app/deliverables/index.html and preview /treesh.html). Verified live sync in iframe.
- Testing: 3 rounds, iteration 3 = 54/54 passed (dev app, single-file build, Treesh iframe sync).
- Deliverables: /app/treesh-site/games/chainz.html (single file -> Treesh repo main/games/chainz.html, served by Netlify at treesh.app/games/chainz) + /app/treesh-site/index.html (patched Treesh). Rebuild: bash treesh-site/build.sh. Platform branding removed from code.

## 3) Next Actions (immediate)
1. Implement Phase 1 POC modules: `wordValidation`, `datamuseClient`, `idbCache`, `treeshBridge`.
2. Generate and commit `/public/data/chainz-bank.json` via script.
3. Create the POC screen and verify:
   - Offline bank validation
   - Online Datamuse validation
   - IndexedDB caching
   - Starlite award/spend updates `treesh_stars` correctly.
4. Apply the minimal patch to parent `index.html` and confirm live sync with an iframe embed.

## 4) Success Criteria
- **Core:** Word validation accepts a wide set of legitimate related words online; works offline with bank fallback; cached lookups reduce API calls.
- **Treesh sync:** `treesh_profile`, `treesh_accent`, `treesh_stars` are read/written without data loss; parent reflects changes live.
- **Gameplay:** At least 6–8 modes functional with clear rules; stable timers; no soft locks.
- **Economy:** Starlites earning/spending is consistent, logged, and capped; shop purchases persist.
- **Quality:** Mobile-friendly, fast, accessible; no critical console errors; refresh-safe under `/games/chainz/`.
