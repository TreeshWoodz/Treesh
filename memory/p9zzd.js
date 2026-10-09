/* ---------- P9zzd: one account on two devices (or the Home Screen app + Safari). Sync merges key by key against what was last synced,
   so a device that was left open never puts back an older copy of what you changed somewhere else (Space, banner, bio, likes...) ---------- */
SB_LOCAL.push('treesh_sb_base','treesh_sb_kt');
const sbH=s=>{ if(s==null) return null; s=String(s); let h=0x811c9dc5; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return s.length+'.'+(h>>>0).toString(36); };

/* when each setting was last changed on this device (the newer change wins if both devices changed the same thing) */
let _sbKT=null, _sbKTT=0;
function sbKT(){ if(!_sbKT){ try{ _sbKT=JSON.parse(localStorage.getItem('treesh_sb_kt')||'{}')||{}; }catch(e){ _sbKT={}; } } return _sbKT; }
function sbKTSave(){ clearTimeout(_sbKTT); _sbKTT=setTimeout(()=>{ try{ localStorage.setItem('treesh_sb_kt',JSON.stringify(sbKT())); }catch(e){} },300); }
(function(){ const _set=LS.set; LS.set=function(k){ const r=_set.apply(LS,arguments); if(!_sbQuiet&&sbSyncKey(k)){ sbKT()[k]=Date.now(); sbKTSave(); } return r; }; })();
window.addEventListener('storage',e=>{ if(e.key==='treesh_sb_kt') _sbKT=null; });

/* what this device and the account agreed on at the last sync */
function sbBaseGet(uid){ try{ const b=JSON.parse(localStorage.getItem('treesh_sb_base')||'null'); return b&&b.uid===uid&&b.sigs?b.sigs:null; }catch(e){ return null; } }
function sbBaseSet(uid,ls){ const sigs={}; Object.keys(ls||{}).forEach(k=>{ if(sbSyncKey(k)) sigs[k]=sbH(ls[k]); }); try{ localStorage.setItem('treesh_sb_base',JSON.stringify({uid,sigs})); }catch(e){} }
/* devices that synced before this existed: only what changed here since the last sync counts as this device's */
function sbSynthBase(L,C,since){ const kt=sbKT(), b={}; new Set([...Object.keys(L),...Object.keys(C)]).forEach(k=>{ b[k]=(kt[k]||0)>since?'~':sbH(k in L?L[k]:null); }); return b; }
async function sbLocalLs(u){ return (await sbPayload(u,true)).localStorage; }
function sbMerge(L,C,base,ckt,cdef){ const kt=sbKT(), W={}, took=[], kept=[];
  new Set([...Object.keys(L),...Object.keys(C)]).forEach(k=>{ if(!sbSyncKey(k)) return; const l=k in L?L[k]:null, c=k in C?C[k]:null;
    if(l===c){ if(l!=null) W[k]=l; return; }
    const b=k in base?base[k]:null, lch=sbH(l)!==b, cch=sbH(c)!==b;
    const useC=cch&&(!lch||((ckt&&ckt[k]!=null?+ckt[k]:cdef)>(kt[k]||0)));
    if(useC){ if(c!=null) W[k]=c; took.push(k); } else { if(l!=null) W[k]=l; kept.push(k); } });
  return {W,took,kept}; }

/* what's already in memory catches up with what came from the other device */
const SB_STATE={treesh_profile:()=>{ state.profile=LS.get('treesh_profile',null); },treesh_favorites:()=>{ state.favorites=new Set(LS.get('treesh_favorites',[])); },treesh_dislikes:()=>{ state.dislikes=new Set(LS.get('treesh_dislikes',[])); },
  treesh_playlists:()=>{ state.playlists=LS.get('treesh_playlists',[]); },treesh_fav_lyrics:()=>{ state.favLyrics=LS.get('treesh_fav_lyrics',[]); },treesh_lyric_edits:()=>{ state.lyricEdits=LS.get('treesh_lyric_edits',{}); }};
function sbRefreshState(keys){ let ui=false, other=false; keys.forEach(k=>{ if(SB_STATE[k]){ try{ SB_STATE[k](); ui=true; }catch(e){} } else other=true; }); if(other) sbMeta({stale:true}); if(ui) sbRerender(); }
/* apply the account's side of a merge on this device (custom-song refs, lyric edits and Space healing run through the usual restore) */
async function sbTake(u,C,M,withAssets){ const src={};
  for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(sbSyncKey(k)) src[k]=localStorage.getItem(k); }
  M.took.forEach(k=>{ if(k in M.W) src[k]=M.W[k]; else delete src[k]; });
  const kt=sbKT(), ckt=C.kt||{}, cdef=Date.parse(C.exportedAt)||0; M.took.forEach(k=>{ kt[k]=ckt[k]!=null?+ckt[k]:cdef; }); sbKTSave();
  const ch=await sbRestore({type:'treesh-backup',localStorage:src,assetsPath:withAssets?C.assetsPath:null,_base:C.localStorage});
  sbRefreshState(M.took); return ch; }
const sbRowQ=u=>sb.from('profiles').select('id,username,display_name,avatar_url,bio,created_at').eq('id',u.id).maybeSingle();
const sbDataQ=(u,cols)=>sb.from('user_data').select(cols).eq('user_id',u.id).maybeSingle();
const sbAssetsNew=(C,m)=>!!C.assetsPath&&(!C.assetSigs||JSON.stringify(C.assetSigs)!==JSON.stringify(m.assetBase||null));

/* every restore remembers what the account had, and a full restore takes the account's change times */
const _sbRes9zzd=sbRestore; sbRestore=async function(b){ const u=sbUser(), ch=await _sbRes9zzd.apply(this,arguments);
  if(u&&b&&b.type==='treesh-backup'&&b.localStorage){ sbBaseSet(u.id,b._base||b.localStorage);
    if(!b._base){ const kt=sbKT(), ckt=b.kt||{}, cdef=Date.parse(b.exportedAt)||0; Object.keys(b.localStorage).forEach(k=>{ kt[k]=ckt[k]!=null?+ckt[k]:cdef; }); sbKTSave(); } }
  return ch; };

/* before a device uploads, it brings in whatever another device synced since */
let _sbPayLs=null, _sbMerging=false;
async function sbPreMerge(u){ const m=sbMeta(); if(m.uid!==u.id) return;
  const hd=await sbDataQ(u,'updated_at'); if(hd.error||!hd.data) return;
  const cAt=Date.parse(hd.data.updated_at||'')||0; if(m.cloudAt&&cAt<=m.cloudAt+1000) return;
  const [full,pr]=await Promise.all([sbDataQ(u,'data,updated_at'),sbRowQ(u)]), C=full.data&&full.data.data;
  if(full.error||!C||C.type!=='treesh-backup'||!C.localStorage) return;
  const L=await sbLocalLs(u), M=sbMerge(L,C.localStorage,sbBaseGet(u.id)||sbSynthBase(L,C.localStorage,m.cloudAt||0),C.kt,Date.parse(C.exportedAt)||0), assets=sbAssetsNew(C,m);
  if(!M.took.length&&!assets) return;
  _sbRow9zj=M.took.includes('treesh_profile')&&!pr.error?pr.data:null; await sbTake(u,C,M,assets); }
const _sbPush9zzd=sbPush; sbPush=async function(){ const u=sbUser();
  if(!sb||!u||_sbBusy||!state.profile||pfEditing()) return _sbPush9zzd.apply(this,arguments);
  if(_sbMerging){ _sbAgain=true; return; }
  const before=sbMeta().cloudAt||0; _sbMerging=true;
  try{ await sbPreMerge(u); }catch(e){ console.warn('Treesh sync: merge skipped',e); } finally{ _sbMerging=false; }
  _sbPayLs=null;
  try{ return await _sbPush9zzd.apply(this,arguments); }
  finally{ const m=sbMeta(); if(_sbPayLs&&m.uid===u.id&&(m.cloudAt||0)!==before) sbBaseSet(u.id,_sbPayLs); _sbPayLs=null; } };
const _sbPay9zzd=sbPayload; sbPayload=async function(u,lsOnly){ const b=await _sbPay9zzd.apply(this,arguments); if(lsOnly||!b||!b.localStorage) return b;
  const kt=sbKT(), o={}; Object.keys(b.localStorage).forEach(k=>{ if(kt[k]) o[k]=kt[k]; }); b.kt=o; _sbPayLs=b.localStorage; return b; };

/* coming back to Treesh: a 3-way merge instead of "the account replaces this device" */
const _sbPull9zzd=sbPull; sbPull=async function(o){ o=o||{}; const u=sbUser(), m=sbMeta();
  if(!sb||!u||m.uid!==u.id||!sbBaseGet(u.id)) return _sbPull9zzd.apply(this,arguments);
  state._sbPulled=Date.now(); sbSet('saving');
  try{ const pend=_sbBootPending!=null?_sbBootPending:(m.pending||_sbDirty); _sbBootPending=null;
    const [cr,pr]=await Promise.all([sbDataQ(u,'updated_at'),sbRowQ(u)]); if(pr.error) throw pr.error; if(cr.error) throw cr.error;
    state._sbHadProfile=!!pr.data; const cAt=(cr.data&&Date.parse(cr.data.updated_at||''))||0;
    if(!cr.data||(m.cloudAt&&cAt<=m.cloudAt+1000)){ if(pr.data&&!pend) sbApply(pr.data);
      if(pend||!cr.data){ await sbPush(); return 'pushed'; }
      sbMeta({at:Date.now()}); sbSet('synced'); if(m.stale&&o.restore!==false){ sbMeta({stale:false}); return 'pulled'; } return 'same'; }
    if(o.restore===false){ if(pend) await sbPush(); else sbSet('synced'); return 'later'; }
    const full=await sbDataQ(u,'data,updated_at'); if(full.error) throw full.error; const C=full.data&&full.data.data;
    if(!C||C.type!=='treesh-backup'||!C.localStorage){ await sbPush(); return 'pushed'; }
    const L=await sbLocalLs(u), M=sbMerge(L,C.localStorage,sbBaseGet(u.id),C.kt,Date.parse(C.exportedAt)||0), keepPf=M.kept.includes('treesh_profile');
    if(pr.data&&!keepPf) sbApply(pr.data); if(keepPf) _sbRow9zj=null;
    const ch=(M.took.length||sbAssetsNew(C,sbMeta()))?await sbTake(u,C,M,sbAssetsNew(C,sbMeta())):false;
    _sbDirty=false; sbMeta({pending:false,at:Date.now(),uid:u.id,cloudAt:cAt,stale:false});
    if(M.kept.length){ _sbDirty=true; sbMeta({pending:true}); await sbPush(); } else sbSet('synced');
    return ch||M.took.length?'pulled':'same';
  }catch(e){ sbFail(e); return 'error'; } };
