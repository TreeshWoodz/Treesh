"""Patch Treesh index.html so it live-syncs Starlites / profile / accent with Chainz (same-origin or cross-origin)."""
import os, re
SRC = '/app/tools/index.html'
s = open(SRC, encoding='utf-8').read()

BRIDGE = r'''
/* ---------- Treesh Games live sync (Chainz & friends) ----------
   Games write treesh_stars / treesh_profile / treesh_accent in localStorage.
   1) Same-origin: the 'storage' event + a 'chainz:sync' ping refresh Treesh's in-memory state,
      so Treesh never overwrites Starlites that a game just awarded.
   2) Cross-origin (e.g. game on treesh.life, Treesh on treesh.app): games post
      chainz:award / chainz:spend messages and Treesh applies them to its own wallet. */
const TREESH_GAME_ORIGINS=["https://treesh.app","https://www.treesh.app","https://treesh.life","https://www.treesh.life"];
function treeshSyncFromLS(keys){
  keys=keys||["treesh_stars","treesh_profile","treesh_accent"];
  if(keys.indexOf("treesh_stars")>-1){ const s=LS.get("treesh_stars",null); if(s&&typeof s==="object"){ state.stars=Object.assign({}, state.stars||{}, s); try{ updateStarDisplays(); }catch(e){} } }
  if(keys.indexOf("treesh_profile")>-1){ const p=LS.get("treesh_profile",null); if(p&&typeof p==="object"&&JSON.stringify(p)!==JSON.stringify(state.profile)){ state.profile=p; try{ renderShell(); }catch(e){} } }
  if(keys.indexOf("treesh_accent")>-1){ const a=LS.get("treesh_accent",null); if(typeof a==="string"&&a&&a!==state.accent){ state.accent=a; try{ applyAccent(a); }catch(e){} } }
}
function treeshGameState(){ return {type:"treesh:state", profile:state.profile||null, accent:state.accent||"#9328ff", stars:{points:(state.stars&&state.stars.points)||0}}; }
window.addEventListener("storage", function(e){ if(!e.key||/^treesh_(stars|profile|accent)$/.test(e.key)) treeshSyncFromLS(e.key?[e.key]:undefined); });
window.addEventListener("message", function(e){
  const d=e.data; if(!d||typeof d!=="object"||typeof d.type!=="string"||d.type.indexOf("chainz:")!==0) return;
  const same=e.origin===location.origin; if(!same && TREESH_GAME_ORIGINS.indexOf(e.origin)===-1) return;
  if(d.type==="chainz:sync"){ if(same) treeshSyncFromLS(Array.isArray(d.keys)?d.keys:undefined); }
  else if(d.type==="chainz:award" && !same){ const amt=Math.max(0,Math.min(2000,parseInt(d.amount,10)||0)); if(amt){ if(d.game){ state.stars.games=(state.stars.games||0)+1; } awardStars(amt, String(d.reason||"Chainz reward").slice(0,80), {silent:true}); } }
  else if(d.type==="chainz:spend" && !same){ const amt=Math.max(0,parseInt(d.amount,10)||0); const st=state.stars; if(amt && (st.points||0)>=amt){ st.points-=amt; st.log=st.log||[]; st.log.unshift({t:Date.now(), a:-amt, r:String(d.reason||"Chainz shop").slice(0,80)}); if(st.log.length>50) st.log.length=50; saveStars(); updateStarDisplays(); } }
  try{ if(e.source) e.source.postMessage(treeshGameState(), same?location.origin:e.origin); }catch(_){}
});
'''

anchor = 'window.addEventListener("hashchange",'
assert anchor in s, 'anchor missing'
if 'treeshSyncFromLS' not in s:
    s = s.replace(anchor, BRIDGE.strip() + '\n' + anchor, 1)

# show spends as negative in "Recent rewards"
old = '<span class="shrink-0 font-semibold text-[color:var(--treesh-gold)]">+${e.a}</span>'
if old in s:
    s = s.replace(old, '<span class="shrink-0 font-semibold text-[color:var(--treesh-gold)]">${e.a<0?\'\\u2212\'+Math.abs(e.a):\'+\'+e.a}</span>')

# include Chainz data in the "Games & rewards" data group (export / reset)
s = s.replace('keys:["treesh_game_stats","treesh_game_opts","treesh_tot","treesh_stars","treesh_stats"]',
              'keys:["treesh_game_stats","treesh_game_opts","treesh_tot","treesh_stars","treesh_stats","chainz_save_v2","chainz_seen_howto"]')

# push fresh state into the game iframe when it loads (helps cross-origin games)
s = s.replace('function gfLoaded(){ state._gfLoaded=true;',
              'function gfLoaded(){ try{ const f=document.getElementById("gf-frame"); if(f&&f.contentWindow) f.contentWindow.postMessage(treeshGameState(), "*"); }catch(e){} state._gfLoaded=true;', 1)

os.makedirs('/app/treesh-site', exist_ok=True)
open('/app/treesh-site/index.html', 'w', encoding='utf-8').write(s)
# preview copy: open the local Chainz build instead of the production URL
prev = s.replace("url:'https://treesh.app/games/chainz'", "url:'/chainz.html'")
open('/app/frontend/public/treesh.html', 'w', encoding='utf-8').write(prev)
print('patched', 'treeshSyncFromLS' in s, "url:'/chainz.html'" in prev, 'chainz_save_v2' in s, '\\u2212' in s)
