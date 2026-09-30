# Treesh 3.0 Continuation — Phase 5 Plan (Updated)

## ▶ SESSION LOG (latest continuation — Games/Things + Storage emergency + Install/Transfer)
This continuation focused on **Games & Things organization**, **game stats/Starlites surfacing**, an **urgent storage failure** caused by browser LocalStorage quota, and finishing the **Install/Add-to-Home-Screen + Data Transfer (no servers)** task.

### ✅ Phase G/T — Games & Things Organization (COMPLETED + verified)
**Delivered (P0/P1):**
- Split **“Games & Things”** into **two tabs** at the top of the same page:
  - **Games** (default)
  - **Things**
- **What’s Next?** and **This or That** are **NOT** top-level tabs.
  - They remain their own pages and are accessed via hero cards from **Games**.
  - Added **“Back to Games”** button on those sub-pages.
- Hero cards layout update:
  - “What’s Next?” + “This or That” render **inline**, each **50% width**, with a **6px gap**.
- Things UX polish:
  - Things tiles + info modal use CTA **“Visit”** (not “Play”).
  - Hoop subtitle is **“Treesh Active”** (not “Treesh Arcade”).
- Verified via screenshots:
  - Games tab default
  - Things tab
  - Hoop info modal showing **TREESH ACTIVE** + **Visit**

### ✅ Phase G1 — Chainz Header Image Restore (COMPLETED + verified)
- Updated `GAMES` entry `key:'chainz'` → `banner` set to uploaded URL:
  - `https://customer-assets-gfyr7b9c.emergentagent.net/job_melody-boost-3/artifacts/wpz1wxpz_IMG_6287.png`
- Verified via screenshot of Chainz info modal.

### ✅ Phase G2 — Game Starlites + Stats bridged into Main App + Profile (COMPLETED + verified)
**Goal:** Make game progress visible from the main app (including profile Stats).

**Delivered:**
- Added `GAME_DATA_SOURCES` registry to read same-origin game storage keys.
- New **“Arcade games”** section injected into the shared `profileStatsHtml()`.
  - Appears in:
    - Games page stats panel (the “Starlites and stats” dropdown)
    - Profile → Stats tab
- Implemented schemas:
  - **FREA!**
    - `localStorage['frea_starlites']`
    - `localStorage['frea_stats_v1']` (JSON; `matchesPlayed`, `roundsWon`, `winsByMode`, `playMs`, etc.)
  - **Chainz**
    - `localStorage['chainz_save_v2']` (JSON; `stats.bestScore`, `stats.bestChain`, `stats.perfectRuns`, `stats.starlitesEarned`, etc.)
- Confirmed **same-origin behavior in production**:
  - Chainz reads `treesh_profile` / `treesh_accent` and writes shared `treesh_stars`.

### ✅ Phase S — Storage Emergency Fix (COMPLETED + verified)
**Root cause:** Browser LocalStorage has a hard per-origin cap (~5MB). App previously showed device disk estimate (GBs) via `navigator.storage.estimate()`, which does **not** reflect LocalStorage’s limit. Large base64 items (custom fonts, background images) can fill LocalStorage so saves begin failing.

**Delivered:**
- Implemented an **honest LocalStorage meter**:
  - `LS_BUDGET ≈ 5MB`
  - `lsAllBytes()` counts full LocalStorage usage
  - UI shows **App storage used: X of ~5MB** (the real bottleneck that blocks saving)
- Kept separate **Media on device** meter (IndexedDB / device space):
  - `navigator.storage.estimate()` scoped to the **media meter**
- Added QuotaExceeded detection and user feedback:
  - `isQuotaError()` + `notifyStorageFull()` toast
  - `LS.set()` now surfaces a clear toast when quota is hit
- Font upload now detects failure:
  - If saving `treesh_custom_font` fails → revert state and show guidance

### ✅ Phase S2 — Games & Apps Storage Management (COMPLETED + verified)
- Added a new Settings → Storage group:
  - **Games & apps data**
  - Measures and can clear:
    - key prefixes: `frea_`, `chainz_`, `vocotap_`, `voco_`, `nects_`
    - game IndexedDB databases (best-effort): `chainz_db`, `vocotap_db`, `nects_db`
- Upgraded storage grouping system:
  - `groupBytes()` supports `prefixes[]`
  - Clear-group action clears:
    - `keys[]`
    - `prefixes[]`
    - `idb[]` via `indexedDB.deleteDatabase()`

### ✅ Phase I/T — Install / Add-to-Home-Screen + Data Transfer (No Servers) (COMPLETED + verified)
**Goal:** For new users (especially iPhone), indicate how to make Treesh feel like an “official app”, detect install state, and add offline file-based transfer between devices/browsers.

**Delivered:**
- **Install / Add-to-Home-Screen UX**
  - `isStandalone()` detection:
    - `matchMedia('(display-mode: standalone)')`
    - iOS `navigator.standalone === true`
  - Captures `beforeinstallprompt` for Android/Chrome and stores it in `_deferredInstall`.
  - `installHintHtml()` shows:
    - iOS manual steps: **Share → Add to Home Screen**
    - Install button where `beforeinstallprompt` is available
  - Install hints are automatically hidden when already installed/standalone.
  - Install hint placement:
    - **Onboarding welcome step** (new users)
    - **Settings → About** (existing users)
- **PWA-ish metadata improvements**
  - Added head meta tags:
    - `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `application-name`, `mobile-web-app-capable`
  - Runtime-injected **Web App Manifest** (Blob URL) to enable install prompts on supported browsers.
- **Full data transfer (no servers, file-based)**
  - `exportAllData()` downloads `treesh-backup-YYYYMMDD.json` containing:
    - All relevant `localStorage` keys:
      - `treesh*` + game prefixes (`frea_`, `chainz_`, `vocotap_`, `voco_`, `nects_`)
    - All `IndexedDB` media records from the main DB (`treesh_media/tracks`):
      - audioBlob + coverBlob encoded as Data URLs
  - `importAllDataFromFile()`:
    - Validates file signature (`type:'treesh-backup'`)
    - Confirms destructive restore
    - Clears matching keys/prefixes
    - Restores `localStorage`, rebuilds IDB blobs, then reloads
  - UI: **Settings → Account → Storage** card “Transfer to another device” with Export/Import.
- Verified:
  - App boots (no console errors)
  - Manifest link is present
  - Transfer card renders
  - Blob ↔ DataURL round-trip and IDB write/read tested successfully

---

## ▶ SESSION LOG 2 (earlier continuation)
Previously completed and already in codebase:
- Custom Song Likes (heart on custom songs)
- Lyric Studio Tips UI toggle
- Backdrops Studio core (9 images, slideshow, filters, dim slider)
- Instrum Vocals STEM EDITING (trim/speed/copy/paste/marquee/per-stem FX)

---

## ▶ ACTIVE SESSION ORDER (updated)
Completed in this continuation:
1) Games/Things split + UX polish ✅
2) Chainz banner restore ✅
3) Game stats/Starlites surfaced in main app + profile ✅
4) Storage emergency fix + game-data storage tools ✅
5) Install/Add-to-Home-Screen + standalone detection ✅
6) Device-to-device/browser-to-browser transfer (no servers) ✅

Next backlog (paused until user requests):
1. **Phase O: Settings Search upgrade (P1)** — Settings tab inside global Search overlay; search + toggle settings from results.
2. **Phase K: Image Studio revamp (P2)** — rename Cover Art Studio → Image Studio; Backdrops-grade layer suite baked into export.
3. **Phase S3 (P1/P2 optional but recommended): Durable storage cure** — move large base64 settings assets (custom font + background images) from LocalStorage → IndexedDB so the device’s real storage (GBs) becomes usable.

Constraints reminder:
- Single-file `/app/single_html/index.html` only
- Tailwind CDN only; **no npm/yarn**
- Offline-first (LocalStorage + IndexedDB)
- **Edits must be strictly sequential** (avoid parallel search/replace wipe)
- Respond in English

Testing reminders:
- Screenshot tool used for UI verification
- If using automated testing agent, set on load:
  - `localStorage.setItem('treesh_whatsnew_off','true')`
  - `localStorage.setItem('treesh_profile','{}')`

---

## 1) Objectives (updated)
- Preserve **single-file architecture** (`index.html`), zero build steps, offline-first.
- Maintain and extend the product’s studios/tools while avoiding regressions.

Completed UX + stability upgrades in this continuation:
- ✅ Games & Things navigable via **Games | Things** tabs
- ✅ In-app games accessible from Games tab (not top-level tabs)
- ✅ Hero cards inline 50% + 6px gap
- ✅ Things: **Visit** CTA; Hoop: **Treesh Active**
- ✅ Chainz banner restored
- ✅ Arcade game progress (stats + Starlites) visible in main app + profile
- ✅ Storage UI reflects true LocalStorage bottleneck (~5MB)
- ✅ Storage tools include **game data**
- ✅ New-user install guidance (especially iPhone) + standalone detection
- ✅ File-based backup/restore transfer across devices/browsers (no servers)

Next objectives (paused until user says to proceed):
- **Settings Search (Phase O)**: search settings in global search overlay with inline toggles/actions.
- **Image Studio (Phase K)**: rename + Backdrops-style layers baked into export.
- **Durable Storage Fix (Phase S3)**: shift large assets out of LocalStorage into IndexedDB.
- Expand game stat adapters when Vocotap/Nects schemas are available.

---

## 2) Implementation Steps (Phased)

### Phase 0 (P0) — iOS Background Playback & Auto-Advance (Partially Done)
Already implemented earlier:
- iOS guard in `ensureVizAudio()`
- Removed `audio.load()` on track changes; `preload='auto'`; MediaSession rebind

Still requires real-device validation:
- iPhone background playback, lock screen controls, auto-advance

---

### Phase L (P0/P1) — Instrum Studio DAW Upgrade (In Progress / Major Track)
Current includes:
- Beat Maker vs Vocals & Audio pages
- Stem/clip editing (trim/speed/copy/paste/marquee/per-stem FX)

Remaining:
- recording UX polish, session management, mixing/export improvements

---

### Phase M (COMPLETED — previous sessions)
- Backdrops Studio mobile-safe modal + multi-layer text/emoji/rotation/fonts/colors
- Music Manager UI fit fixes
- Queue drawer Light Mode fix
- Global Font Color setting

---

### Phase G/T (COMPLETED) — Games & Things Revamp
Delivered:
- Games|Things tabs
- “Visit” CTA for Things; Hoop subtitle “Treesh Active”
- What’s Next?/This or That not top-level tabs; Back-to-Games button
- Inline hero cards (50% each, 6px gap)

Testing:
- Verified via screenshots

---

### Phase G2 (COMPLETED) — Cross-Game Stats/Starlites Bridge
Delivered:
- `GAME_DATA_SOURCES` registry
- “Arcade games” section added into `profileStatsHtml()`

Current adapters:
- FREA: `frea_starlites`, `frea_stats_v1`
- Chainz: `chainz_save_v2.stats`

Future adapters:
- Vocotap, Nects once storage schema is available (repo currently private/404)

---

### Phase S (COMPLETED) — Storage Emergency Fix
Delivered:
- Honest LocalStorage meter (~5MB cap)
- Separate media meter for IndexedDB + device estimate
- QuotaExceeded detection + toast messaging
- Custom font upload failure handling

---

### Phase S2 (COMPLETED) — Games & Apps Data Storage Group
Delivered:
- New storage group supports:
  - prefix-based measurement (e.g., `frea_`, `chainz_`)
  - IndexedDB delete for known game DBs (`chainz_db`, etc.)

---

### Phase I/T (COMPLETED) — Install + Transfer (No Servers)
Delivered:
- iOS Add-to-Home-Screen guidance + install-state detection
- Android/Chrome install button via `beforeinstallprompt`
- PWA head meta tags + runtime manifest injection
- Full export/import backup system covering localStorage + IndexedDB media

Testing:
- Boot + manifest link present
- Transfer UI renders
- Export/import helpers verified (blob round-trip and IDB read/write)

---

### Phase S3 (NEXT, recommended) — Durable Storage Cure (P1/P2)
Problem:
- Large base64 blobs in LocalStorage (fonts/backgrounds) quickly hit the ~5MB cap.

Planned implementation:
- Move these from LocalStorage → IndexedDB:
  - `treesh_custom_font.data` (base64)
  - `treesh_bg_images[]` (data URLs)
- Store only lightweight references/metadata in LocalStorage.
- Add migration logic:
  - If legacy data exists in LocalStorage, import into IDB once, then clear legacy keys.
- Update Storage UI:
  - Show a line item for “Fonts & backgrounds” size (IDB-based), and keep the LocalStorage meter accurate.

Testing:
- Fill localStorage near capacity, then verify saving still works after migration.

---

### Phase O (NEXT) — Settings Search inside Global Search Overlay (P1)
**Status:** In progress in earlier work; must be completed.

Planned implementation:
- Add a new tab: `Settings` in search overlay
- Create/finish `SETTINGS_INDEX`:
  - entries include id, label, description, section, type (`toggle`|`action`|`picker`), get/set
- Render results with inline toggles + “Go to setting” for complex items

Testing:
- Screenshot: Search overlay → Settings tab
- Toggle a setting from results and confirm UI updates immediately

---

### Phase K (NEXT) — Image Studio (Cover Art Studio → Image Studio) + Backdrops-grade Layers (P2)
Planned implementation:
- Rename user-facing strings
- Implement layers (text + emoji) with drag/resize/rotate/fonts/colors
- Bake layers into `cvRender()` output

Testing:
- Exported image includes layers and persists as cover art

---

## 3) Next Actions (Immediate)
**Paused until user says to proceed.**
When continuing:
1. Complete **Phase O** Settings Search
2. Implement **Phase S3** durable storage cure (recommended)
3. Begin **Phase K** Image Studio rename + layer suite
4. Gather Vocotap/Nects storage schema (if repo access provided) to extend game adapters

---

## 4) Success Criteria (updated)
- Games & Things:
  - Games|Things tabs exist; Games default
  - Things show “Visit” CTA; Hoop labeled “Treesh Active”
  - What’s Next?/This or That accessed from Games tab; Back-to-Games exists
  - Heroes inline at 50% width + 6px gap
- Arcade stats surfaced:
  - Profile Stats and Games stats panel show “Arcade games” section
  - FREA + Chainz stats render without errors
- Storage:
  - Storage screen clearly distinguishes **App LocalStorage cap (~5MB)** from **device media space**
  - When quota is exceeded, user sees a clear toast and saves don’t silently fail
  - Games & apps data group can clear prefix-based keys + known game IndexedDB DBs
- Install / Add-to-Home-Screen:
  - New users (iPhone) see guidance to **Share → Add to Home Screen**
  - Prompt/Install button appears when supported (Android/Chrome)
  - Hint is hidden when running standalone
- Data transfer:
  - Export creates a JSON backup including localStorage + IndexedDB media
  - Import restores data and reloads reliably without servers
- No regressions:
  - Offline-first behavior preserved
  - Single-file architecture maintained
  - No console errors on boot
  - Sequential edits only (no code wipe)
