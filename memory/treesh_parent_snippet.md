# Treesh parent app: Bronze Blitz integration snippets

Bronze Blitz runs same-origin at https://treesh.app/games/bronze-blitz and shares localStorage with Treesh.
- Name: read from `treesh_profile.nickname` (falls back to `username`). The name prompt shows only if there is no Treesh profile.
- Starlites: one shared wallet. The game reads and writes `treesh_stars.points` directly and adds `treesh_stars.log` entries ("Bronze Blitz: ...").
  It also posts `{type:"treesh:starlites", source:"bronze-blitz", delta, reason, points}` to the parent window.
- Game progress (levels, trophies, stats, inventory, themes) is saved under `bronze_save_v1`.

## 1) Add to GAMES (next to frea / vocotap / chainz / nects)
```js
  {key:'bronze', name:'Bronze Blitz', url:'https://treesh.app/games/bronze-blitz', logo:'', banner:'', mono:'B', a:'#E08F3C', b:'#7a4512', age:'All', updated:'October 8, 2026', desc:'Match the culture. Swap vinyl, crowns, kicks and djembes, set off Blitz Bombs and stack Starlites across 30 levels and 5 game modes.'},
```

## 2) Add to GAME_DATA_SOURCES (Arcade stats in Profile)
```js
  { key:"bronze", name:"Bronze Blitz", mono:"B", a:"#E08F3C", b:"#7a4512",
    starlites:()=>{ const sv=_gdJson("bronze_save_v1",{})||{}; return (sv.stats&&+sv.stats.earned)||0; },
    hasData:()=> _gdRaw("bronze_save_v1")!=null,
    stats:()=>{ const sv=_gdJson("bronze_save_v1",{})||{}; const st=sv.stats||{}; const lv=Object.values(sv.levelStars||{}).filter(s=>s>0).length;
      return [["Levels cleared",lv+"/30"],["Trophies",(sv.claimed||[]).length+"/24"],["Best combo","x"+(st.maxCombo||0)]]; } },
```

## 3) Keep the shared wallet in sync (paste once, after `state` is created)
The game writes `treesh_stars` from its iframe. This makes sure Treesh reloads it instead of overwriting it with a stale in-memory copy.
```js
addEventListener('storage', e => {
  if (e.key === 'treesh_stars') { state.stars = LS.get('treesh_stars', state.stars) || state.stars; updateStarDisplays(); }
});
addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data || e.data.type !== 'treesh:starlites') return;
  state.stars = LS.get('treesh_stars', state.stars) || state.stars; updateStarDisplays();
});
```

## 4) Include Bronze Blitz in backups and live stat refresh
- In the "gamedata" backup group, add `"bronze_"` to `prefixes`.
- In the storage listener regex `/^(treesh_hoop_|vocotap_|frea_|chainz_)/`, add `bronze_`, so it becomes `/^(treesh_hoop_|vocotap_|frea_|chainz_|bronze_)/`.

## Hosting note
The game is built with `homepage: /games/bronze-blitz`. If treesh.app is a single Netlify site, place this rule ABOVE the catch-all in the root `_redirects`:
```
/games/bronze-blitz/*    /games/bronze-blitz/index.html   200
```
