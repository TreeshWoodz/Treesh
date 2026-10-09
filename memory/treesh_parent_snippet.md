# Treesh parent app → Ebonics integration snippet

Ebonics is served at `https://treesh.app/games/ebonics` (same origin as the parent), so it shares localStorage:
- Profile (read/write, same format): `treesh_profile` ({nickname, username, avatar, birthday, zodiac, joined})
- **Starlites wallet (shared, read/write): `treesh_stars.points`** — Ebonics does a fresh read-modify-write on every change and adds log entries `{t, a, r:"Ebonics · ..."}` to `treesh_stars.log`
- Accent color (read-only): `treesh_accent` — used as Ebonics' highlight color (toggle in Ebonics Shop)
- Lifetime Starlites earned in Ebonics: `ebonics_starlites` (integer, for Arcade stats)
- Full game save/stats: `ebonics_save_v1`

## How Ebonics syncs Starlites (automatic, in this order)
1. **Opened inside Treesh on treesh.app (same origin iframe)** — Ebonics calls the parent's own `awardStars(amount, "Ebonics · …", {silent:true})`, so the main app's in-memory wallet, display and cloud sync update instantly. **No parent change needed.**
2. **Opened at treesh.app/games/ebonics in its own tab** — writes `treesh_stars` directly; add section 0 so an open Treesh tab adopts it.
3. **Opened inside Treesh from another origin** (e.g. a preview link) — uses `postMessage`; add section 0b.
4. **Anywhere else** — player signs in with their Treesh account on the Ebonics Profile page; Ebonics pulls `treesh_stars` from the `user_data` cloud backup and pushes Starlites changes back (delta-merged). Treesh picks it up on its next pull (when the tab regains focus).

## 0b) postMessage bridge (only needed when Ebonics is hosted on a different origin)
```js
const EBONICS_ORIGINS=['https://trophy-hustle.preview.emergentagent.com']; // add your Ebonics host(s)
window.addEventListener('message', e => {
  if(!EBONICS_ORIGINS.includes(e.origin) || !e.data || e.data.from!=='ebonics') return;
  const reply=()=>{ try{ e.source.postMessage({type:'treesh:sync', stars:state.stars, profile:state.profile, accent:state.accent}, e.origin); }catch(_){} };
  if(e.data.type==='treesh:stars:award' && Array.isArray(e.data.entries)){
    e.data.entries.slice(0,20).forEach(x=>{ const a=Math.trunc(+x.a)||0; if(a && Math.abs(a)<=5000) awardStars(a, String(x.r||'Ebonics').slice(0,80), {silent:true}); });
  }
  if(e.data.type==='treesh:hello' || e.data.type==='treesh:stars:award') reply();
});
```

## 0) Keep the parent's in-memory wallet fresh (for case 2)
The parent holds `state.stars` in memory and writes it back on every award. Add this once (e.g. right after `function saveStars(){...}`) so it adopts changes Ebonics makes:
```js
window.addEventListener('storage', e => {
  if (e.key === 'treesh_stars' && e.newValue) {
    try { state.stars = JSON.parse(e.newValue); updateStarDisplays(); } catch(_) {}
  }
});
```
And make awards re-read before writing (replace the first statement of `awardStars`):
```js
function awardStars(amount, reason, opts){ opts=opts||{}; if(!amount) return; state.stars=LS.get("treesh_stars", state.stars); const st=state.stars; /* ...rest unchanged... */ }
```

## 1) Add to `GAMES` (Games tab)
```js
{key:'ebonics', name:'Ebonics', url:'https://treesh.app/games/ebonics', logo:'', banner:'', mono:'E', a:'#FFC72C', b:'#8B5CF6', age:'13+', updated:'October 7, 2026', desc:'The language. The culture. The game. Decode AAVE, flip phrases with an AI judge and stack Starlites across 7 modes.'},
```

## 2) Add to `GAME_DATA_SOURCES` (Arcade games stats)
```js
{ key:"ebonics", name:"Ebonics", mono:"E", a:"#FFC72C", b:"#8B5CF6",
  starlites:()=> _gdInt("ebonics_starlites"),
  hasData:()=> _gdRaw("ebonics_save_v1")!=null,
  stats:()=>{ const s=_gdJson("ebonics_save_v1",{})||{}; return [["Games",fmtNum(s.gamesPlayed||0)],["Correct",fmtNum(s.totalCorrect||0)],["Best combo",fmtNum(s.bestCombo||0)+"x"]]; } },
```

## 3) Include Ebonics data in transfer / cloud sync
```js
const TRANSFER_PREFIXES=["treesh","frea_","chainz_","vocotap_","voco_","nects_","ebonics_"];
```
And in the "gamedata" data-category entry add `"ebonics_"` to `prefixes`.
