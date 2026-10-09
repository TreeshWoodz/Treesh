/* ---------- P9zy: calm updates. Screens patch only what changed (no flashing, no lost place) and sync never reloads mid-task ---------- */
const MORPH_OPAQUE=new Set(['view','nav-notif','lc-layers','imenu']);
const MORPH_FRESH='input[type="file"],#set-bday,#group-members,#group-name,#lc-lyric-box,#lc-layer-panel,[data-morph="fresh"]';
const MORPH_JS_ATTRS=['data-hint'];
const MORPH_OWN=['TEXTAREA','CANVAS','IFRAME','VIDEO','AUDIO'];
function mKey(n){ if(n.nodeType!==1) return null; if(n.id) return '#'+n.id; const t=n.getAttribute('data-testid'); return t?'t'+t:null; }
function mKeys(list){ const cnt={}; return list.map(n=>{ const k=mKey(n); if(!k) return null; cnt[k]=(cnt[k]||0)+1; return k+'|'+cnt[k]; }); }
function mSame(a,b){ if(a.nodeType!==b.nodeType) return false; if(a.nodeType!==1||a.nodeName===b.nodeName) return true; return a.nodeName==='svg'&&b.nodeName==='I'&&a.getAttribute('data-lucide')===b.getAttribute('data-lucide'); }
function mIcoSame(a,b){ const n=b.getAttribute('data-lucide'); if(a.getAttribute('data-lucide')!==n||(a.getAttribute('class')||'')!==('lucide lucide-'+n+' '+(b.getAttribute('class')||'')).trim()) return false;
  for(const x of b.attributes) if(x.name!=='class'&&a.getAttribute(x.name)!==x.value) return false; return true; }
function mAttrs(a,b){ const cv=a.nodeName==='CANVAS', own=n=>cv&&(n==='width'||n==='height'||n==='style');
  for(let i=a.attributes.length-1;i>=0;i--){ const n=a.attributes[i].name; if(!b.hasAttribute(n)&&!MORPH_JS_ATTRS.includes(n)&&!own(n)) a.removeAttribute(n); }
  for(const x of b.attributes){ if(!own(x.name)&&a.getAttribute(x.name)!==x.value) a.setAttribute(x.name,x.value); }
  if((a.nodeName==='INPUT'||a.nodeName==='TEXTAREA')&&document.activeElement!==a){ if(a.type==='checkbox'||a.type==='radio') a.checked=b.hasAttribute('checked');
    else if(a.type!=='file'){ const v=a.nodeName==='TEXTAREA'?b.textContent:(b.getAttribute('value')||''); if(a.value!==v) a.value=v; } } }
function mNode(a,b){ if(a.nodeType!==1){ if(a.nodeValue!==b.nodeValue) a.nodeValue=b.nodeValue; return; }
  if(a.nodeName==='svg'&&b.nodeName==='I'){ if(!mIcoSame(a,b)) a.replaceWith(b); return; }
  if(a.matches(MORPH_FRESH)){ a.replaceWith(b); return; }
  const sel=a.nodeName==='SELECT'?(b.querySelector('option[selected]')||b.querySelector('option')):null, sv=sel?sel.getAttribute('value')!=null?sel.getAttribute('value'):sel.textContent:null;
  mAttrs(a,b); if(MORPH_OWN.includes(a.nodeName)||(a.id&&MORPH_OPAQUE.has(a.id))||a.hasAttribute('data-morph-opaque')) return;
  mKids(a,b); if(sv!=null&&document.activeElement!==a&&a.value!==sv) a.value=sv; }
function mKids(a,b){ const nk=Array.from(b.childNodes), nkeys=mKeys(nk), want=new Set(nkeys.filter(Boolean));
  const old=Array.from(a.childNodes), okeys=mKeys(old), keyOf=new Map(), byKey=new Map(); old.forEach((c,i)=>{ if(okeys[i]){ keyOf.set(c,okeys[i]); byKey.set(okeys[i],c); } });
  const keep=c=>c.nodeType===1&&c.hasAttribute('data-morph-keep'); let cur=a.firstChild;
  const skip=()=>{ while(cur){ if(keep(cur)){ cur=cur.nextSibling; continue; } const k=keyOf.get(cur); if(k&&!want.has(k)){ const nx=cur.nextSibling; a.removeChild(cur); cur=nx; continue; } break; } };
  nk.forEach((n,i)=>{ skip(); const k=nkeys[i]; let m=null;
    if(k){ const c=byKey.get(k); if(c&&mSame(c,n)){ m=c; byKey.delete(k); } } else if(cur&&!keyOf.get(cur)&&mSame(cur,n)) m=cur;
    if(m){ if(m===cur) cur=cur.nextSibling; else a.insertBefore(m,cur); mNode(m,n); } else a.insertBefore(n,cur); });
  skip(); while(cur){ const nx=cur.nextSibling; if(!keep(cur)) a.removeChild(cur); cur=nx; } }
function morphHTML(el,html){ const t=document.createElement('template'); t.innerHTML=html; mKids(el,t.content); }
function morphOK(){ return !window.__noMorph; }

/* wiring that would double up on kept elements */
const _wr9zy=wireReorder; wireReorder=function(c){ if(!c||c._wr9zy) return; c._wr9zy=1; return _wr9zy.apply(this,arguments); };
const _wmd9zy=wireMiniDrag; wireMiniDrag=function(el){ if(!el||el._wmd9zy) return; el._wmd9zy=1; return _wmd9zy.apply(this,arguments); };

/* sync: changes from another device wait for a calm moment instead of reloading under your fingers */
let _sbRLWait=false, _sbTouchAt=0; const _sbBootAt=Date.now();
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{ _sbTouchAt=Date.now(); },{capture:true,passive:true}));
function sbBusyUI(){ const ae=document.activeElement; return !!(document.querySelector('#modal > *, #modal2 > *, #sx-root, #nt-root, #clip-root')||state.npOpen||state.profileOpen||state.searchOpen||(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))); }
function sbQuietReload(){ try{ sessionStorage.setItem('treesh_sb_rl',String(Date.now())); sessionStorage.setItem('treesh_rl_y',String(window.scrollY||0)); }catch(e){} try{ location.reload(); }catch(e){} }
const _sbRL9zy=sbReload; sbReload=function(force){ if(force) return _sbRL9zy.call(this,true);
  let last=0; try{ last=+sessionStorage.getItem('treesh_sb_rl')||0; }catch(e){} if(Date.now()-last<30000){ sbRerender(); return; }
  if(Date.now()-_sbBootAt<8000&&!_sbTouchAt&&!sbBusyUI()&&audio.paused){ sbQuietReload(); return; }
  if(_sbRLWait) return; _sbRLWait=true; ntSyncNote(); };
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&_sbRLWait&&audio.paused) sbQuietReload(); });
function ntSyncNote(){ const now=Date.now(), it={id:'a'+now.toString(36)+'sync',src:'app',kind:'sync',t:now,read:false,title:'Synced from your other device',body:'Refresh to see the latest. Treesh also refreshes quietly next time you leave the app.'};
  ntAll().unshift(it); ntPrune(); ntSave(true); ntBellRing(); if(!ntDnd()&&!state.ntOpen) ntBanner(it); }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="nt-sync-refresh"]'); if(!t) return; const it=ntFind(t.dataset.id); if(it){ it.read=true; it.done='synced'; ntSave(true); } sbQuietReload(); });
(function(){ let y=0; try{ y=+sessionStorage.getItem('treesh_rl_y')||0; sessionStorage.removeItem('treesh_rl_y'); }catch(e){} if(!y) return; let n=0; const go=()=>{ n++; const v=document.getElementById('view'); if(v&&v.children.length&&document.documentElement.scrollHeight>y){ window.scrollTo(0,y); return; } if(n<12) setTimeout(go,250); }; setTimeout(go,300); })();
