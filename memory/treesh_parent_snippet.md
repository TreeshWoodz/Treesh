# Treesh parent app → Ebonics integration snippet

Ebonics is served at `https://treesh.app/games/ebonics` (same origin as the parent), so it shares localStorage:
- Reads/writes the shared profile: `treesh_profile` ({nickname, username, avatar, birthday, zodiac, joined})
- Reads the main wallet (read-only): `treesh_stars.points`
- Writes its own Starlites balance: `ebonics_starlites` (integer, like `frea_starlites`)
- Full game save/stats: `ebonics_save_v1`

## 1) Add to `GAMES` (Games tab)
```js
{key:'ebonics', name:'Ebonics', url:'https://treesh.app/games/ebonics', logo:'', banner:'', mono:'E', a:'#FFC72C', b:'#8B5CF6', age:'13+', updated:'October 7, 2026', desc:'The language. The culture. The game. Decode AAVE, flip phrases with an AI judge and stack Starlites across 7 modes.'},
```

## 2) Add to `GAME_DATA_SOURCES` (Arcade games stats + Starlites total)
```js
{ key:"ebonics", name:"Ebonics", mono:"E", a:"#FFC72C", b:"#8B5CF6",
  starlites:()=> _gdInt("ebonics_starlites"),
  hasData:()=> _gdRaw("ebonics_save_v1")!=null || _gdRaw("ebonics_starlites")!=null,
  stats:()=>{ const s=_gdJson("ebonics_save_v1",{})||{}; return [["Games",fmtNum(s.gamesPlayed||0)],["Correct",fmtNum(s.totalCorrect||0)],["Best combo",fmtNum(s.bestCombo||0)+"x"]]; } },
```

## 3) Include Ebonics data in transfer / cloud sync
```js
const TRANSFER_PREFIXES=["treesh","frea_","chainz_","vocotap_","voco_","nects_","ebonics_"];
```
And in the "gamedata" data-category entry add `"ebonics_"` to `prefixes`.
