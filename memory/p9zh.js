/* ---------- P9zh: smooth scrolling (no page-wide blocking touch listeners), self-healing scroll lock, custom music stays private per account ---------- */
/* sheet flick-to-close only listens to touchmove while a draggable sheet is on screen, so page scrolling never waits on JS */
function sheetMoveBind(fn){ window._shMv={fn,on:false}; sheetMoveSync(); }
function sheetMoveSync(){ const m=window._shMv; if(!m) return; const on=!!document.querySelector('.pm-panel,#profile-panel,.mk-sheet,.um-panel,[data-voice-panel],.zh-sheet');
  if(on===m.on) return; m.on=on; if(on) document.addEventListener('touchmove',m.fn,{passive:false,capture:true}); else document.removeEventListener('touchmove',m.fn,true); }

/* Magic Markup's drag guard is only bound while editing */
let _mkGuardOn=false, _mkTrackEnd=null;
function mkGuardSync(){ const on=!!state.mkEdit; if(on===_mkGuardOn) return; _mkGuardOn=on;
  if(on) document.addEventListener('touchmove',_mkTMGuard,{passive:false,capture:true}); else { document.removeEventListener('touchmove',_mkTMGuard,true); _mkTouchLock=false; _mkLP=null; } }
const _mkSE9zh=mkSetEdit; mkSetEdit=function(){ const r=_mkSE9zh.apply(this,arguments); mkGuardSync(); return r; };
/* a drag whose finger-up got lost (block re-rendered mid-drag) ends on the next touch instead of blocking scroll forever */
const _mkT9zh=mkTrack; mkTrack=function(move,up){ let fin=false; _mkT9zh.call(this,move,ev=>{ fin=true; _mkTrackEnd=null; up(ev); }); _mkTrackEnd=()=>{ if(!fin) document.dispatchEvent(new Event('touchcancel')); }; };

/* scroll lock only counts overlays that are really on screen (a stale flag used to freeze scrolling) */
const OV_HOST={game:'modal',tot:'modal',npOpen:'np',queueOpen:'queue',profileOpen:'profile',searchOpen:'searchlay',lsOpen:'ls',sleep:'sleep',_lockActive:'lock',umOpen:'um-root'};
const _ovo9zh=overlaysOpen; overlaysOpen=function(){ const held={};
  for(const k in OV_HOST){ if(state[k]){ const h=document.getElementById(OV_HOST[k]); if(!h||!h.childElementCount){ held[k]=state[k]; state[k]=(k==='game'||k==='tot')?null:false; } } }
  try{ return _ovo9zh.apply(this,arguments); } finally{ for(const k in held) state[k]=held[k]; } };
let _shRaf=0;
function shTick(){ _shRaf=0; sheetMoveSync(); mkGuardSync(); try{ if(_locked!==overlaysOpen()) syncScrollLock(); }catch(e){} }
function shSoon(){ if(!_shRaf) _shRaf=requestAnimationFrame(shTick); }
new MutationObserver(shSoon).observe(document.body,{childList:true,subtree:true});
document.addEventListener('touchstart',e=>{ if(e.touches.length===1){ if(_mkTrackEnd) _mkTrackEnd(); if(!state.mkEdit){ _mkTouchLock=false; _mkLP=null; } } shTick(); },{passive:true,capture:true});
document.addEventListener('wheel',shSoon,{passive:true,capture:true});
mkGuardSync();

/* ---- custom music: lives only on this device and only for the account that added it ---- */
function umOwner(){ const u=sbUser(); return u?u.id:(sbMeta().uid||'guest'); }
function umIsUserId(id){ id=String(id==null?'':id); if(/^u-/.test(id)) return true; const s=SONG_BY_ID[id]; return !!(s&&(s._user||s.source==='user')); }
let _umLoadedFor=null;
const _idbPut9zh=idbPut; idbPut=function(rec){ if(rec&&typeof rec==='object'&&!rec.owner) rec.owner=umOwner(); return _idbPut9zh.apply(this,arguments); };
const _idbGA9zh=idbGetAll; idbGetAll=function(){ return _idbGA9zh.apply(this,arguments).then(recs=>{ const me=umOwner(); _umLoadedFor=me;
  return (recs||[]).filter(r=>{ if(!r) return false; if(!r.owner){ r.owner=me; _idbPut9zh(r).catch(()=>{}); } return r.owner===me; }); }); };
async function umClaimGuest(uid){ try{ for(const r of (await _idbGA9zh())||[]){ if(r&&(r.owner==='guest'||!r.owner)){ r.owner=uid; await _idbPut9zh(r); } } }catch(e){} }
const _sbSI9zh=sbSignedIn; sbSignedIn=async function(u){ if(_sbJustAuthed&&u) await umClaimGuest(u.id);
  const r=await _sbSI9zh.apply(this,arguments); if(u&&_umLoadedFor&&_umLoadedFor!==u.id) try{ loadUserSongs(); }catch(e){} try{ sxPublishSoon(true); }catch(e){} return r; };

/* public profile never lists custom songs (titles, artists, lyrics) */
const _sxSnap9zh=sxSnapshot; sxSnapshot=function(){ const hid=[]; Object.keys(SONG_BY_ID).forEach(id=>{ if(umIsUserId(id)){ hid.push([id,SONG_BY_ID[id]]); delete SONG_BY_ID[id]; } });
  let o; try{ o=_sxSnap9zh.apply(this,arguments); } finally{ hid.forEach(([id,s])=>{ SONG_BY_ID[id]=s; }); }
  const ok=x=>!!x&&!umIsUserId(x.id);
  ['favorites','disliked','lyrics'].forEach(k=>{ if(Array.isArray(o[k])) o[k]=o[k].filter(ok); });
  if(Array.isArray(o.playlists)) o.playlists=o.playlists.map(pl=>Object.assign({},pl,{songs:(pl.songs||[]).filter(ok)}));
  if(o.top&&o.top.song&&!ok(o.top.song)) o.top.song=null;
  if(o.listening&&Array.isArray(o.listening.songs)) o.listening.songs=o.listening.songs.filter(ok);
  if(o.space&&o.space.song&&umIsUserId(o.space.song.id)) o.space.song.id='';
  return o; };

/* the account backup skips lyrics written for custom songs, and a restore keeps this device's copy */
const _sbPay9zh=sbPayload; sbPayload=async function(){ const b=await _sbPay9zh.apply(this,arguments);
  try{ const k='treesh_lyric_edits', v=b.localStorage[k]; if(v){ const o=JSON.parse(v); let ch=false; Object.keys(o).forEach(id=>{ if(umIsUserId(id)){ delete o[id]; ch=true; } }); if(ch) b.localStorage[k]=JSON.stringify(o); } }catch(e){} return b; };
const _sbRes9zh=sbRestore; sbRestore=async function(){ const keep={}; try{ const o=LS.get('treesh_lyric_edits',{})||{}; Object.keys(o).forEach(id=>{ if(umIsUserId(id)) keep[id]=o[id]; }); }catch(e){}
  const r=await _sbRes9zh.apply(this,arguments);
  if(Object.keys(keep).length) try{ const o=Object.assign(JSON.parse(localStorage.getItem('treesh_lyric_edits')||'{}'),keep); sbQuietSet('treesh_lyric_edits',o); state.lyricEdits=o; }catch(e){}
  return r; };

/* deleting an account removes only that account's custom music when other accounts use this device */
const _sbWD9zh=sbWipeDevice; sbWipeDevice=async function(){ let others=false;
  try{ const all=(await _idbGA9zh())||[], me=umOwner(), mine=all.filter(r=>r&&(r.owner===me||!r.owner)); others=all.length>mine.length; if(others) for(const r of mine) await idbDelete(r.id); }catch(e){}
  if(!others) return _sbWD9zh.apply(this,arguments);
  const dd=indexedDB.deleteDatabase.bind(indexedDB); indexedDB.deleteDatabase=n=>{ if(n!=='treesh_media') return dd(n); const fake={}; ['onsuccess','onerror','onblocked'].forEach(k=>Object.defineProperty(fake,k,{set(f){ if(k==='onsuccess'&&typeof f==='function') setTimeout(f,0); }})); return fake; };
  try{ await assetClear(); }catch(e){} try{ return await _sbWD9zh.apply(this,arguments); } finally{ indexedDB.deleteDatabase=dd; } };
