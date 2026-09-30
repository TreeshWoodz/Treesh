# FREA! (Treesh Arcade)

The deliverable is **`games/frea.html`**: one self-contained file with no external JS or CSS. It is served at `treesh.app/games/frea` (repo `treesh`, branch `main`).

---

## ⚠️ Golden rule: never edit `frea.html` by hand

`frea.html` is a **build output**. Every build regenerates it from `src/`. Any manual edit to it **will be lost** the next time someone builds.

Edit the files in `src/`, then rebuild.

---

## How to build

```bash
python3 games/build.py          # from the repo root
# or
cd games && python3 build.py
```

Requirements: Python 3 only (standard library, no packages).

Output: `built frea.html <N> bytes`. The build is deterministic, so the same sources always produce the same file.

### Optional sanity check (syntax only)
```bash
node -e "const h=require('fs').readFileSync('games/frea.html','utf8');const re=/<script>([\s\S]*?)<\/script>/g;let m,b=0;while((m=re.exec(h))){try{new Function(m[1])}catch(e){b++;console.log(e.message)}}console.log('syntax errors',b)"
```

---

## What the build does (`build.py`)

1. Reads `src/base.html`, which is the original game (HTML, CSS, main IIFE and embedded art).
2. Injects each file in `CSS = [...]` as one `<style id="frea-polish">` block, right before `</head>`.
3. Injects each file in `JS = [...]`, **in order**, **inside the game's main IIFE**, just before the last `})();`. This gives every module full closure access to game internals (`startGame`, `endGame`, `fleas`, `player`, `gameMode`, `sfx`, …). Modules can wrap or override those functions directly.
4. Writes the result to `games/frea.html`.

### Module order matters
```
treesh.js   → defines window.Treesh (wallet/profile); everything else uses it
style.js    → character style + official cast (window.FREA_CAST)
furni.js    → furniture art library (window.Furni, plus the Furni.add / Furni.h extension API)
seasonal.js → seasonal furniture packs + their art (window.FreaSeasons); needs Furni
trophies.js → trophies + match payouts; wraps startGame/endGame/infect/…
house.js    → Flea House + Backyard Garden (uses Furni, Seasons, Trophies, Treesh)
polish.js   → profile card, Trophy Room tab, lobby UI (uses all of the above)
```
To add a module, put the file in `src/` and add its name to `JS` (or `CSS`) in `build.py`, in the right position.

---

## Source layout
| File | What it owns |
|---|---|
| `src/base.html` | The original game, with small hook edits. Large (~1.2 MB) because it embeds base64 art |
| `src/treesh.js` | Treesh bridge: shared `treesh_stars` wallet, `treesh_profile`, award ledger and reconcile, daily/birthday bonus |
| `src/style.js` | Character style 2.0 (the reference look) and the official cast |
| `src/furni.js` | Furniture and item art, also used by the Zen Sandbox objects |
| `src/seasonal.js` | 6 date-based furniture packs (25 items + art) and the rotation logic |
| `src/trophies.js` | 55 trophies (every mode, Flea House, Garden, Seasonal), Starlite payouts, end-of-match reward breakdown |
| `src/house.js` | Flea House, a Sims-style Zen life-sim (buy, drag, rotate and sell furniture, needs, paint, upstairs) plus the **Backyard Garden** |
| `src/polish.js` | Profile card, Trophy Room tab, lobby trophy button |
| `src/polish.css` | All styles for the new UI |

---

## Parent-app integration (localStorage, same origin)

| Key | Owner | Notes |
|---|---|---|
| `treesh_stars` | parent (shared) | `{points, log:[{t,a,r,src,id}], ...}`. FREA! adds to `points` and appends to `log` |
| `treesh_profile` | parent (read-only for FREA!) | `{nickname, birthday, zodiac, avatar}`. `avatar` must be a URL, data-URI or path. Anything else (e.g. an emoji) falls back to the nickname initial |
| `frea_star_ledger_v1` | FREA! | Journal of every award, used for reconcile |
| `frea_trophies_v1`, `frea_trophy_c_v1`, `frea_earn_day_v1`, `frea_house_v1`, `frea_daily_v1` | FREA! | Game-local progress |

### Starlites safety
FREA! writes straight into `treesh_stars` and journals each award in `frea_star_ledger_v1`. If the parent app later overwrites `treesh_stars` from stale in-memory state, FREA! re-applies any missing ledger entries exactly once (`Treesh.reconcile()`, which runs on load, every 15 s, and when the tab becomes visible).

### Live Balance Sync (parent hookup: DONE, see `/app/parent/index.html`)
FREA! posts this message to `window.parent` on every wallet change:
```js
{type:'treesh:stars', v:2, source:'frea', points, entry:{id,t,a,r}, meta:{kind:'trophy'|'match'|'garden'|'spend'|'reward', icon}}
```
The updated parent `index.html` adds 3 small blocks (the diff against `index.original.html` is only +32 lines, CRLF kept):
1. **CSS**: the `star-bump` pulse, the `.gf-stars` header chip, and the `+N ✦` float.
2. **Header chip**: `<span id="gf-stars" data-star-count>` in the game-frame bar, so the balance is visible while playing.
3. **JS**, right after `updateStarDisplays()`:
   - `syncStarsFromStorage()` re-reads `treesh_stars` into `state.stars`. This fixes the old issue where the parent's stale memory overwrote game awards on its next `saveStars()`.
   - A `storage` listener, plus a `message` listener that only trusts `#gf-frame`. It dedupes by entry id, and a cross-origin fallback applies the delta with `awardStars` if storage isn't shared.
   - A trophy toast in the parent app when the game is minimized or closed.

Test harness: `/treesh-test/index.html` on the preview is a copy of the parent with the FREA! URL pointed at `/games/frea.html`.

### Payout rules (in `trophies.js`)
- Match played: +10. Victory: +40. First win per mode each day: +25. Mode bonus: up to +30.
- Trophies: Bronze 25, Silver 50, Gold 100, Platinum 250.
- Zen chill time: up to 30 per day. Match earnings are capped at 700 per day (`DAY_CAP`). Trophies are not capped.

---

## Backyard Garden (house.js)
- The yard sits at world x `-660…-14` (left of the house, through the back door). It has 5 beds (`PLOT_X`).
- Seeds (`SEEDS`): 🍓 6✦→14✦ (2h) · 🥕 8→20 (3h) · 🍇 10→26 (4h) · 🌻 12→32 (5h) · 🍉 18→48 (7h) · 🎃 Moon Pumpkin 25→70 (10h). Times are game minutes; 1 real second = 1 game minute at 1× speed.
- Crops grow **only while watered** (water drains 0.35 per minute). They keep growing while you're away, up to 720 minutes.
- Fleas water and harvest on their own. The player can tap a bed, or select a flea and then tap a bed. Harvests go into a snack basket, and the **Picnic** button feeds everyone.
- Garden Starlites are capped at **160 ✦ per day** (`GARDEN_CAP`). Save data lives in `frea_house_v1.garden`.
- The yard also accepts floor and surface furniture, but not on the beds or on walls.

## Seasonal furniture (seasonal.js)
| Pack | Dates | Items |
|---|---|---|
| ❄️ Winter Wonderland | Dec 1 – Feb 28/29 | Twinkle Tree, Snow Buddy, Cocoa Mug, Fairy Lights, Snow Globe |
| 💝 Sweetheart | Feb 1 – Feb 16 | Heart Loveseat, Heart Balloon, Rose Vase |
| 🌸 Spring Bloom | Mar 1 – May 31 | Cherry Blossom, Tulip Pot, Birdhouse, Egg Basket, Garden Swing |
| 🏖️ Summer Splash | Jun 1 – Aug 31 | Splash Pool, Beach Chair, Ice Cream Cart, Tiki Torch, Surfboard |
| 🍂 Harvest Moon | Sep 1 – Nov 30 | Leaf Pile, Scarecrow, Soup Cauldron, Cozy Candles |
| 🎃 Spooky Night | Oct 10 – Nov 2 | Jack-o'-Lantern, Ghost Lamp, Cobweb |

- Items can only be **bought** in season, but owned items stay forever. The shop shows days left and a locked "Coming up" pack.
- To add a pack, append to `PACKS` (same row format as the house catalog) and `Furni.add(type, drawFn, defaultColor)` for its art.
- **Preview another date:** `localStorage.frea_debug_date='2026-12-20'` or `frea.html?freadate=2026-12-20`.

## Quick console checks (on the running page)
```js
FreaTrophies.count('h_placed',1)                        // unlock "Moving In" → +25 ✦ and a toast
JSON.parse(localStorage.treesh_stars).points           // confirm the balance
Treesh.reconcile()                                      // re-apply missing awards; returns the count fixed
FreaHouse.state().garden                                // garden beds, basket and today's garden earnings
FreaSeasons.active().map(p=>p.name)                     // packs in season right now
```
