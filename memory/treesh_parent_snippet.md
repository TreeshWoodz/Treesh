# Treesh parent app → Ebonics integration snippet

Ebonics is served at `https://treesh.app/games/ebonics` (same origin as the parent), so it shares localStorage:
- Profile (read/write, same format): `treesh_profile` ({nickname, username, avatar, birthday, zodiac, joined})
- **Starlites wallet (shared, read/write): `treesh_stars.points`** — Ebonics does a fresh read-modify-write on every change and adds log entries `{t, a, r:"Ebonics · ..."}` to `treesh_stars.log`
- Accent color (read-only): `treesh_accent` — used as Ebonics' highlight color (toggle in Ebonics Shop)
- Lifetime Starlites earned in Ebonics: `ebonics_starlites` (integer, for Arcade stats)
- Full game save/stats: `ebonics_save_v1`

## 0) REQUIRED for wallet sync — keep the parent's in-memory wallet fresh
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
