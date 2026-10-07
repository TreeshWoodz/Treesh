# FREA! upgrade: PRD / status

## Original ask
Polish every mode, the character models and the UI. Turn Zen into a Sims-like mode. Update all furniture. Add trophies for every mode. Add the Treesh Starlites system and the Treesh profile. Host at treesh.app/games/frea (repo treesh / main / games folder).

## Done (v1 of this upgrade)
- Single-file build at `/app/games/frea.html`. It is previewed through the frontend at `/games/frea.html` (a symlink), and React `App.js` loads it in an iframe
- Character style 2.0 matches the user's reference sheet: glossy eyes, blush, D-smile, ball antennae, glass wings and ball feet. The 12 named cast members are used as AI and roommates
- Treesh bridge: shared `treesh_stars` wallet plus a ledger that reconciles parent overwrites, the `treesh_profile` nickname and avatar, a daily streak bonus and a birthday gift
- Rewards: +10 per match, +40 per win, +25 for the first win per mode each day, mode bonuses, and a daily cap of 700. A breakdown shows on the end screen
- 48 trophies (bronze to platinum) across General, Capture, Race, Burning Orb, Infectious, Hide & Seek, Hoops, Zen Sandbox and Flea House. They appear in a Trophy Room tab and a lobby trophy button, with unlock banners
- HnS and Hoops-team wins are now recorded in stats (previously missing)
- Zen chooser offers Flea House (new) or Sandbox (existing)
- Flea House: 5 rooms over 2 floors, with upstairs unlocked for 400 ✦. Buy catalog has 36 items priced in ✦. Items can be dragged, flipped, recolored, stacked on surfaces, snapped and sold. Paint covers wallpaper, patterns and floors. Fleas have 4 needs, act on their own and follow direct commands. Also includes chat, a day/night cycle, lamps, speed controls, autosave, 3 save slots, and inviting or moving out roommates
- New furniture art library, also used by the Sandbox objects

## Done (v1.1: verification pass)
- The build is reproducible: `python3 games/build.py` gives the same output. Build docs are in `games/README.md`: the golden rule, module order and localStorage keys
- All 7 modes (race, survival, tag, hoops, classic, zen, hns) start with 0 page errors, and the Flea House opens
- Trophy → Starlites confirmed: unlocking "Moving In" adds +25 to `treesh_stars.points`, writes a log entry and shows a toast. After a stale overwrite by the parent, `Treesh.reconcile()` re-applies the missing awards
- Fix: non-URL `treesh_profile.avatar` values (for example an emoji) no longer show a broken image. They fall back to the nickname initial, and failing image URLs are hidden
- Fix: Flea House name tags no longer overlap when fleas cluster. The selected flea's label wins

## Done (v1.2: Garden, Seasonal, Live Sync)
- **Backyard Garden**: a yard with 5 beds and 6 seeds. Fleas water and harvest on their own. Garden tab with Water all, Harvest all and Picnic. Crops grow while you're away. Garden Starlites are capped at 160 ✦ per day
- **Seasonal Furniture**: new `src/seasonal.js` with 6 date-rotating packs and 25 new items with art. The Buy shop opens on Seasonal, showing days left and a locked "Coming up" preview. A new-pack dot appears on the Buy tab. Debug date: `frea_debug_date` or `?freadate=`
- **Live Balance Sync**: FREA! sends a `treesh:stars` postMessage with trophy info. The parent `/app/parent/index.html` is updated (+32 lines): it re-syncs from storage (fixing the stale overwrite), adds a header Starlite chip with a +N float, and shows a trophy toast when the game is minimized. Test copy at `/treesh-test/index.html`
- 7 new trophies (55 total). What's New slides added
- Verified via screenshots only. The full testing-agent pass was skipped at the user's request

## Backlog
- More Flea House content: outdoor yard, more room types, and seasonal items

## Phase 4 (Party Mode update)
- Party Mode: pick which modes rotate (Zen excluded), rounds, order, rivals; points 3/2/1 per round; final podium + Starlites bonus.
- New modes: King of the Hill, Floor is Lava, Star Rush, Red Light Green Light, Freeze Tag.
- Unified HUD: mode banner w/ goal + party round, How-to-play intro card, cleaner results chips.

## Phase 5 (Copycat, new modes, performance)
- Copycat, Musical Platforms, Sumo Ring, Hoops+, NavAI, glassy modals (earlier in phase)
- **Performance Mode** (`src/perf.js`, `src/perf.css`): Auto (default) / Lite / High in Settings → Display.
  - Lite: DPR 1, canvas shadowBlur hard-disabled at the context level, particle cap 70, no sparks, CSS backdrop-filter off, render 30 FPS
  - The simulation is now fixed at 60 steps/s on every screen, so 120/144Hz monitors no longer speed up the game. In-between steps draw to a 1x1 dummy canvas
  - Auto: Lite on phones and on devices with ≤4 cores or ≤4GB RAM. Otherwise High, with a watchdog that drops to Lite if the average frame time is over 22ms. Key `frea_perf_lvl`
- **Treasure Dig rework** (`src/dig.js`): real grid dirt (topsoil / soil / 2-hit clay / boulders). Tunnels persist. Coins sit shallow, gems mid, crowns deep. Tap dirt to tunnel there. Fling hard to drill a crater. CPUs dig toward treasure, thieves bump to steal
- **Musical Chairs option** (`src/chairs.js`): Seats = Platforms | Chairs. Real chairs in a row with a ring rug. Fleas march a loop while the music plays (the back lane is drawn behind the chairs), then race to sit. One chair is removed each round
- Copycat: when the player leads, taps during "Get ready" are queued and fire when the gap ends
- Test hooks: `__frea.setMode(m); __frea.start()`, `FreaDig.tapWorld(x,y)`, `FreaPerf.set('lite')`, `FreaChairs.chairs()`

## Update — Lobby hero row + graphics verification
- Desktop (>=900px): What's New carousel now sits side-by-side with the Party Mode banner in the first row of the mode grid; clock moves into the What's New header (src/lobbyrow.js + desktop.css). Mobile layout unchanged (stacked).
- Verified Settings → Display & Accessibility → Platforms (Themed/Basic) and Background (Scenic/Basic) toggles; persisted in localStorage (frea_plat_style / frea_bg_style).
- Verified 16 new action emotes + CPU flea reactions (actions2.js); player-triggered reaction radius widened in competitive modes. Debug: window.FreaReact.state().
- Help FAQ mentions Basic Platforms/Background. Test report: /app/test_reports/iteration_7.json (95%, remaining items were test-harness false positives, verified manually).

## Session update (fork 2)
- fx2.js wired into build; window.FreaFx2 exposed
- Flap Dash hover-until-first-flap; Cozy Home portrait wall décor (rail, fairy lights, shelf); mobile overlap verified fixed
- Zen CPU fleas now do staged activities with props (TV+popcorn+glow+reactions, read, snack, nap, water plants, sing)
- Verified: arcade modes, Ball & Hoop Studio (Neon/Beach), H&S Mansion/Haunted/Graveyard (iteration_9.json)
