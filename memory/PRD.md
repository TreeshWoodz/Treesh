
## Update (Jun 2026)
- Fixed wavy notes: added finger-drag tracking (onTouchMove) so waves must be TRACED across lanes; every wavy note now gets a cross-lane path (chartEngine wavePath). Fixed undefined liveStars crash + added its style.
- Redesigned Home secondary tiles (Editor/Settings/How to play): distinct lane-color gradient icon chips with glow, glass surfaces, and captions.

## Update 2 (Jun 2026)
- FIXED editor completely broken: board migrated from PanResponder to raw onTouch* had no responder claim; switched to onResponderGrant/Move/Release so notes add again (mouse+touch).
- FIXED wavy notes not showing in editor: waveData() was called with wrong args (number instead of Note) => NaN path. Corrected both call sites; live preview now traces the drag.
- Editor UI: removed REC badge (covered lane 4), Record button dot now blinks, tips bubble is toggleable (close/show tips).
- Swapped home logo to new vocotap-logo-v2.png (bigger).
- My Music import: read parent Treesh app IndexedDB treesh_media/tracks (same origin), expose as source=device in "On this device" tab; added refresh button (re-scans My Music + refetches Treesh catalog). mineSongs also feed Home Quick Play.
- PENDING (from earlier ask, data model added, UI not yet): wave-follow "Nice trace!" feedback, audio-start reliability, editor first-run tutorial, desktop custom key UI.

## Update 3 (Jun 2026)
- Scoring fixed: accuracy = hits/total (no misses = 100%); half-star tiers per spec; starlites 5*=300, 4/4.5*=150, 2.5-3.5*=100, <=2*=50. Half stars render in results + live HUD.
- Reliable audio start: countdown waits for status.isLoaded (2.5s fallback).
- Difficulty-first: analysis shows difficulty grid immediately; generates only chosen difficulty on Play (generateFor) with Building + Error(retry/back/edit) states + uri guard. Easy far sparser (keepFrac 0.22 + 0.5s minGap) so notes hit strong beats.
- Editor-first flow: Home Editor opens editor directly; Change/empty-state -> library?pick=editor -> selecting returns to editor.
- Editor: Chart saved toast + Export chart button; wavy redesign (head at start, ribbon follows finger, glowing tip dot).
- Wave-trace reward: glowing trail + Nice trace! pop.
- Home BEST: removed duplicate white star char.
- DEFERRED: editor first-run tutorial, settings key-remap UI (keys default ASDF), native lock-screen next/prev media controls (needs native build + clarification).

## Update 4 (Jun 2026)
- Editor first-run tutorial: 5-step skippable modal (editor.tsx), auto-shows once a song is selected when editorTutorialSeen=false, persists as seen, replayable via header help button. Verified (iteration_7).
- Settings Desktop Keys remap (web only): tap a lane then press a key to bind; persists to settings.keyBindings; Reset to A/S/D/F; game.tsx reads bindings. Verified (iteration_7).
- Media lock-screen next/prev controls: SKIPPED per user.
