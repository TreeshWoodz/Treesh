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
furni.js    → furniture art library (window.Furni)
trophies.js → trophies + match payouts; wraps startGame/endGame/infect/…
house.js    → Flea House (uses Furni, Trophies, Treesh)
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
| `src/trophies.js` | 48 trophies (every mode plus Flea House), Starlite payouts, end-of-match reward breakdown |
| `src/house.js` | Flea House, a Sims-style Zen life-sim (buy, drag, rotate and sell furniture, needs, paint, upstairs) |
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

Optional parent snippet, so the Treesh UI updates live while FREA! is open:
```js
window.addEventListener('storage',e=>{if(e.key==='treesh_stars'){state.stars=LS.get('treesh_stars',state.stars);updateStarDisplays();}});
```

### Payout rules (in `trophies.js`)
- Match played: +10. Victory: +40. First win per mode each day: +25. Mode bonus: up to +30.
- Trophies: Bronze 25, Silver 50, Gold 100, Platinum 250.
- Zen chill time: up to 30 per day. Match earnings are capped at 700 per day (`DAY_CAP`). Trophies are not capped.

---

## Quick console checks (on the running page)
```js
FreaTrophies.count('h_placed',1)                        // unlock "Moving In" → +25 ✦ and a toast
JSON.parse(localStorage.treesh_stars).points           // confirm the balance
Treesh.reconcile()                                      // re-apply missing awards; returns the count fixed
```
