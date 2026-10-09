/* ---------- P9zw: Notification center. History of everything, tabs, search, sections, swipe, pin, menus, undo, Do Not Disturb, alert types ---------- */
const _ntc={tab:'all',q:'',prefs:false,hl:null,lim:120};
const NT_TABS=[['all','All'],['online','Online'],['app','App'],['unread','Unread']];
let _ntUndo=null;
function ntcPanel(){ return document.querySelector('#nt-root .nt-panel'); }
function ntcOpen(hl,prefs){ let r=document.getElementById('nt-root'); _ntc.hl=hl||null; _ntc.prefs=!!prefs; _ntc.lim=120;
  if(hl){ const it=ntFind(hl); if(it&&((_ntc.tab==='app'&&it.src!=='app')||(_ntc.tab==='online'&&it.src!=='online')||(_ntc.tab==='unread'&&it.read))) _ntc.tab='all'; _ntc.q=''; }
  if(!r){ r=document.createElement('div'); r.id='nt-root'; r.innerHTML=`<div class="nt-bd" data-act="nt-close" data-testid="notifications-backdrop"></div><aside class="nt-panel" role="dialog" aria-modal="true" aria-label="Notifications" data-testid="notifications-center-drawer" tabindex="-1"></aside>`; document.body.appendChild(r);
    r.querySelector('.nt-bd').addEventListener('wheel',e=>e.preventDefault(),{passive:false}); r.querySelector('.nt-bd').addEventListener('touchmove',e=>e.preventDefault(),{passive:false}); }
  r.classList.remove('is-out'); state.ntOpen=true; document.documentElement.classList.add('nt-open'); try{ pfFitBars(); }catch(e){}
  ntcPaint(true); ntBell(); ntbClearAll(); if(sbUser()) ntFetch();
  setTimeout(()=>{ const p=ntcPanel(); if(p&&!p.contains(document.activeElement)) try{ p.focus({preventScroll:true}); }catch(e){} },60); }
function ntcClose(){ const r=document.getElementById('nt-root'); if(!r||!state.ntOpen) return; ntUndoCommit(); ntcMenuClose(); state.ntOpen=false; r.classList.add('is-out'); ntBell();
  setTimeout(()=>{ if(!state.ntOpen){ r.remove(); document.documentElement.classList.remove('nt-open'); } },300); }
addEventListener('resize',()=>{ if(state.ntOpen) try{ pfFitBars(); }catch(e){} },{passive:true});
document.addEventListener('click',e=>{ if(!state.ntOpen) return; const t=e.target&&e.target.closest&&e.target.closest('#mobile-nav [data-act], #app header [data-act], #app aside [data-act]'); if(!t||t.dataset.act==='nt-open') return; ntcClose(); },true);
document.addEventListener('keydown',e=>{ if(e.key!=='Escape'||!state.ntOpen) return; e.stopImmediatePropagation(); if(document.querySelector('#nt-root .nt-menu')) ntcMenuClose(); else if(_ntc.prefs){ _ntc.prefs=false; ntcPaint(true); } else ntcClose(); },true);

/* ---- paint ---- */
function ntcCounts(){ const A=ntAll(); let o=0,a=0,u=0; A.forEach(x=>{ if(x.src==='online') o++; else a++; if(!x.read) u++; }); return {all:A.length,online:o,app:a,unread:u}; }
function ntcPaint(full){ const p=ntcPanel(); if(!p) return;
  if(_ntc.prefs){ const sc=p.querySelector('.nt-prefs'), st=sc?sc.scrollTop:0; p.innerHTML=ntcPrefsHtml(); icons(); const s2=p.querySelector('.nt-prefs'); if(s2&&!full) s2.scrollTop=st; return; }
  if(full||!p.querySelector('.nt-list')){ p.innerHTML=ntcShellHtml(); ntcWire(p); }
  ntcHead(p); ntcList(p); }
function ntcShellHtml(){ const ib=(a,ic,l,tid)=>`<button type="button" data-act="${a}" class="nt-ib press" title="${l}" aria-label="${l}" data-testid="${tid}"><i data-lucide="${ic}"></i></button>`;
  return `<header class="nt-head"><div class="nt-head-l"><p class="nt-kick"><i data-lucide="bell-ring"></i>Inbox</p><h2 class="nt-title font-display" data-testid="notifications-title">Notifications</h2><p class="nt-sub" data-testid="notifications-summary"></p></div>
  <div class="nt-head-r">${ib('nt-readall','check-check','Mark all as read','notifications-mark-all-read-btn')}${ib('nt-prefs','settings-2','Notification settings','notifications-preferences-btn')}${ib('nt-more','ellipsis','More','notifications-more-btn')}${ib('nt-close','x','Close','notifications-close-btn')}</div></header>
  <div class="nt-tabs" role="tablist" data-testid="notifications-tabs">${NT_TABS.map(([k,l])=>`<button type="button" role="tab" data-act="nt-tab" data-val="${k}" data-testid="notifications-tab-${k}" class="nt-tab"><span>${l}</span><b class="nt-cnt" data-testid="notifications-tab-${k}-count"></b></button>`).join('')}<i class="nt-tab-ind" aria-hidden="true"></i></div>
  <label class="nt-search"><i data-lucide="search"></i><input type="search" placeholder="Search notifications" aria-label="Search notifications" autocomplete="off" enterkeyhint="search" data-testid="notifications-search-input"><button type="button" data-act="nt-q-clear" class="nt-q-x" aria-label="Clear search" data-testid="notifications-search-clear" hidden><i data-lucide="x"></i></button></label>
  <div class="nt-dnd-strip" data-testid="notifications-dnd-strip" hidden></div>
  <div class="nt-list" data-testid="notifications-list"></div>
  <div class="nt-undo" data-testid="notification-undo-snackbar" role="status" hidden></div>`; }
function ntUntil(t){ const d=new Date(t), now=new Date(); return (d.toDateString()===now.toDateString()?'':d.toLocaleDateString(undefined,{weekday:'short'})+' ')+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }
function ntcHead(p){ const C=ntcCounts(), dnd=ntDnd(), P=ntP();
  const sub=p.querySelector('.nt-sub'); if(sub) sub.innerHTML=`${C.unread?`<b>${C.unread}</b> unread`:'All caught up'} \u00b7 ${C.all} saved${dnd?' \u00b7 <span class="nt-sub-q"><i data-lucide="moon"></i>Quiet</span>':''}`;
  const tabs=p.querySelector('.nt-tabs'); p.querySelectorAll('.nt-tab').forEach((b,i)=>{ const k=b.dataset.val, on=k===_ntc.tab, n=C[k]; b.classList.toggle('is-on',on); b.setAttribute('aria-selected',on?'true':'false'); b.querySelector('.nt-cnt').textContent=n?(n>99?'99+':n):''; if(on&&tabs) tabs.style.setProperty('--ti',i); });
  const q=p.querySelector('.nt-search input'); if(q&&q.value!==_ntc.q) q.value=_ntc.q; const x=p.querySelector('.nt-q-x'); if(x) x.hidden=!_ntc.q;
  const s=p.querySelector('.nt-dnd-strip'); if(s){ s.hidden=!dnd; s.innerHTML=dnd?`<i data-lucide="moon"></i><span>Do Not Disturb is on${P.dnd>0?' until '+ntUntil(P.dnd):''}. Alerts still land here.</span><button type="button" data-act="nt-dnd" data-val="0" data-testid="notifications-dnd-turn-off">Turn off</button>`:''; }
  const ra=p.querySelector('[data-act="nt-readall"]'); if(ra) ra.disabled=!C.unread; icons(); }
function ntcFiltered(){ const q=_ntc.q.trim().toLowerCase();
  return ntAll().filter(x=>{ if(_ntc.tab==='online'&&x.src!=='online') return false; if(_ntc.tab==='app'&&x.src==='online') return false; if(_ntc.tab==='unread'&&x.read) return false;
    if(q){ const c=ntCopy(x), hay=(c.p+' '+(c.b||'')+' '+c.app+' '+(x.view||'')+' '+(x.actor?x.actor.u+' '+x.actor.n:'')).toLowerCase(); if(hay.indexOf(q)<0) return false; } return true; }); }
function ntcGroups(L){ const n=new Date(), d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(), d1=d0-864e5, d7=d0-6*864e5;
  const G=[['pinned','Pinned','pin',[]],['today','Today','',[]],['yesterday','Yesterday','',[]],['week','This week','',[]],['earlier','Earlier','',[]]];
  L.forEach(x=>G[x.pin?0:x.t>=d0?1:x.t>=d1?2:x.t>=d7?3:4][3].push(x)); return G.filter(g=>g[3].length); }
function ntcSignInCard(alone){ return `<div class="nt-empty${alone?'':' is-card'}" data-testid="notifications-signin-card"><span class="nt-empty-ic"><i data-lucide="user-round-plus"></i></span><b>Sign in for friend alerts</b><p>Get a heads-up when someone adds you, answers your request, or anything changes on your account.</p><button type="button" data-act="nt-signin" class="nt-btn is-primary press" data-testid="notifications-signin-btn">Sign in</button></div>`; }
function ntcEmpty(){ const q=_ntc.q.trim(); let ic='bell',t='Nothing here yet',s='Your pop-ups and friend alerts collect here.',btn='';
  if(q){ ic='search-x'; t='No matches'; s=`Nothing matches \u201c${esc(q)}\u201d.`; btn=`<button type="button" data-act="nt-q-clear" class="nt-btn press" data-testid="notifications-empty-clear-search">Clear search</button>`; }
  else if(_ntc.tab==='online'&&!sbUser()) return ntcSignInCard(true);
  else if(_ntc.tab==='online'){ ic='users'; t='No friend activity yet'; s=state._ntNoSql?'Online alerts aren\u2019t switched on for Treesh yet.':'Friend requests, answers and changes to your account show up here, live.'; }
  else if(_ntc.tab==='unread'){ ic='check-check'; t='You\u2019re all caught up'; s='No unread notifications.'; }
  else if(_ntc.tab==='app'){ ic='app-window'; t='No app pop-ups saved'; s=ntP().app?'Pop-ups like \u201cAdded to Liked\u201d land here.':'Saving app pop-ups is off in preferences.'; }
  return `<div class="nt-empty" data-testid="notifications-empty-state"><span class="nt-empty-ic"><i data-lucide="${ic}"></i></span><b>${t}</b><p>${s}</p>${btn}</div>`; }
function ntcRow(it){ const c=ntCopy(it), K=NT_KIND[it.kind]||NT_KIND.app, id=it.id, qb=(a,ic,l,tid)=>`<button type="button" data-act="${a}" data-id="${id}" class="nt-qb" title="${l}" aria-label="${l}" data-testid="${tid}-${id}"><i data-lucide="${ic}"></i></button>`;
  return `<div class="nt-row-wrap" data-id="${id}" data-kind="${it.kind}" data-src="${it.src}" data-testid="nt-row-${id}"><div class="nt-rv is-l" aria-hidden="true"><i data-lucide="${it.read?'mail':'mail-check'}"></i>${it.read?'Unread':'Read'}</div><div class="nt-rv is-r" aria-hidden="true">Delete<i data-lucide="trash-2"></i></div>
  <div class="nt-row${it.read?'':' is-unread'}${it.pin?' is-pin':''}" data-act="nt-row" data-id="${id}">${ntAvHtml(it)}
   <div class="nt-row-body"><p class="nt-row-meta"><span class="nt-app ${K[1]}">${esc(c.app)}</span>${it.view?`<span class="nt-where">${esc(it.view)}</span>`:''}<time datetime="${new Date(it.t).toISOString()}" title="${esc(ntDate(it.t))}">${ntAgo(it.t)}</time>${it.pin?'<i data-lucide="pin" class="nt-pin-ic"></i>':''}</p>
    <p class="nt-row-t">${c.t}${it.n>1?` <span class="nt-times">\u00d7${it.n}</span>`:''}</p>${c.b?`<p class="nt-row-b">${esc(c.b)}</p>`:''}${ntActsHtml(it)}</div>
   <span class="nt-dot" aria-hidden="true"></span>
   <div class="nt-quick">${qb('nt-q-read',it.read?'mail':'mail-check',it.read?'Mark as unread':'Mark as read','nt-row-read')}${qb('nt-q-pin',it.pin?'pin-off':'pin',it.pin?'Unpin':'Pin','nt-row-pin')}${qb('nt-q-del','trash-2','Delete','nt-row-del')}</div>
   <button type="button" data-act="nt-menu" data-id="${id}" class="nt-row-more" aria-label="More options" aria-haspopup="menu" data-testid="nt-row-menu-${id}"><i data-lucide="ellipsis-vertical"></i></button></div></div>`; }
function ntcList(p){ const L=p.querySelector('.nt-list'); if(!L) return; const items=ntcFiltered(), st=L.scrollTop;
  if(!items.length){ L.innerHTML=ntcEmpty(); icons(); return; }
  let h=_ntc.tab==='online'&&!sbUser()?ntcSignInCard(false):'';
  ntcGroups(items.slice(0,_ntc.lim)).forEach(g=>{ h+=`<section class="nt-sec" data-testid="notifications-section-${g[0]}"><h3 class="nt-sec-h">${g[2]?`<i data-lucide="${g[2]}"></i>`:''}${g[1]}<span>${g[3].length}</span></h3>${g[3].map(ntcRow).join('')}</section>`; });
  if(items.length>_ntc.lim) h+=`<button type="button" data-act="nt-more-rows" class="nt-more-rows press" data-testid="notifications-show-more">Show ${Math.min(120,items.length-_ntc.lim)} more</button>`;
  L.innerHTML=h; L.scrollTop=st; icons();
  if(_ntc.hl){ const el=L.querySelector(`.nt-row-wrap[data-id="${CSS.escape(_ntc.hl)}"]`); _ntc.hl=null; if(el){ el.scrollIntoView({block:'center'}); el.classList.add('is-hl'); setTimeout(()=>el.classList.remove('is-hl'),2400); } } }

/* ---- swipe rows: left = delete, right = read/unread, hold = menu ---- */
function ntcWire(p){ const L=p.querySelector('.nt-list'); let S=null;
  p.querySelector('.nt-search input').addEventListener('input',e=>{ _ntc.q=e.target.value; _ntc.lim=120; ntcHead(p); ntcList(p); });
  L.addEventListener('scroll',()=>{ if(document.querySelector('#nt-root .nt-menu')) ntcMenuClose(); },{passive:true});
  L.addEventListener('pointerdown',e=>{ const w=e.target.closest('.nt-row-wrap'); if(!w||e.button>0||e.target.closest('button,a,input')) return; const row=w.querySelector('.nt-row');
    S={w,row,x:e.clientX,y:e.clientY,dx:0,on:false,id:e.pointerId,lp:setTimeout(()=>{ if(S&&!S.on){ w._sw=Date.now(); try{ navigator.vibrate&&navigator.vibrate(10); }catch(_){} ntcMenu(w.dataset.id,row.querySelector('.nt-row-more')||row); S=null; } },520)}; });
  L.addEventListener('pointermove',e=>{ if(!S||e.pointerId!==S.id) return; const dx=e.clientX-S.x, dy=e.clientY-S.y;
    if(!S.on){ if(Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)){ clearTimeout(S.lp); S=null; return; } if(Math.abs(dx)<10) return; S.on=true; clearTimeout(S.lp); try{ S.w.setPointerCapture(e.pointerId); }catch(_){} S.w.classList.add('is-drag'); }
    S.dx=dx; const W=S.w.offsetWidth, v=dx>0?Math.min(dx,W*0.55):Math.max(dx,-W*0.9); S.row.style.transform=`translate3d(${v}px,0,0)`;
    S.w.classList.toggle('is-l',dx>0); S.w.classList.toggle('is-r',dx<0); S.w.classList.toggle('is-arm',Math.abs(dx)>W*0.3); });
  const end=e=>{ if(!S||(e&&e.pointerId!==S.id)) return; clearTimeout(S.lp); const s=S; S=null; if(!s.on) return; s.w._sw=Date.now(); s.w.classList.remove('is-drag');
    const W=s.w.offsetWidth, arm=Math.abs(s.dx)>W*0.3, id=s.w.dataset.id; s.row.style.transition='transform .3s cubic-bezier(.16,1,.3,1)';
    if(arm&&s.dx<0){ s.row.style.transform=`translate3d(${-W-20}px,0,0)`; s.w.classList.add('is-gone'); setTimeout(()=>ntRemove([id],'Notification deleted'),230); return; }
    s.row.style.transform=''; setTimeout(()=>{ s.row.style.transition=''; s.w.classList.remove('is-l','is-r','is-arm'); if(arm&&s.dx>0){ const it=ntFind(id); if(it) ntMarkRead([id],!it.read); } },300); };
  L.addEventListener('pointerup',end); L.addEventListener('pointercancel',end);
  L.addEventListener('contextmenu',e=>{ const w=e.target.closest('.nt-row-wrap'); if(!w) return; e.preventDefault(); if(!document.querySelector('#nt-root .nt-menu')) ntcMenu(w.dataset.id,w.querySelector('.nt-row-more')); });
  L.addEventListener('click',e=>{ const w=e.target.closest('.nt-row-wrap'); if(w&&w._sw&&Date.now()-w._sw<380){ e.stopPropagation(); e.preventDefault(); } },true); }

/* ---- menus ---- */
function ntcMenuClose(){ document.querySelectorAll('#nt-root .nt-menu').forEach(m=>m.remove()); }
function ntcMenuAt(m,anchor){ const p=ntcPanel(); p.appendChild(m); icons(); const pr=p.getBoundingClientRect(), ar=(anchor||p).getBoundingClientRect(), h=m.offsetHeight;
  let top=ar.bottom-pr.top+6; if(top+h>pr.height-12) top=ar.top-pr.top-h-6; m.style.top=Math.max(12,top)+'px'; m.style.right=Math.max(12,pr.right-ar.right)+'px'; requestAnimationFrame(()=>m.classList.add('is-in')); }
function ntcMenu(id,anchor){ ntcMenuClose(); const it=ntFind(id); if(!it||!ntcPanel()) return; const K=NT_KIND[it.kind]||NT_KIND.app, muted=!!ntP().mute[it.kind], mi=(a,ic,l,tid,cls)=>`<button type="button" role="menuitem" data-act="${a}" data-id="${id}" data-testid="notification-menu-${tid}"${cls?` class="${cls}"`:''}><i data-lucide="${ic}"></i>${l}</button>`;
  const m=document.createElement('div'); m.className='nt-menu'; m.setAttribute('role','menu'); m.dataset.testid='notification-menu';
  m.innerHTML=mi('nt-m-pin',it.pin?'pin-off':'pin',it.pin?'Unpin':'Pin to top','pin')+mi('nt-m-read',it.read?'mail':'mail-check',it.read?'Mark as unread':'Mark as read','read')
    +(NT_ON.includes(it.kind)?mi('nt-m-mute',muted?'bell':'bell-off',(muted?'Turn on ':'Mute ')+K[2].toLowerCase(),'mute'):'')+(it.actor&&it.actor.u?mi('nt-view','circle-user-round','View profile','view'):'')+mi('nt-m-del','trash-2','Delete','delete','is-danger');
  ntcMenuAt(m,anchor); }
function ntcMoreMenu(anchor){ ntcMenuClose(); const C=ntcCounts(), m=document.createElement('div'); m.className='nt-menu'; m.setAttribute('role','menu'); m.dataset.testid='notifications-more-menu';
  m.innerHTML=`<button type="button" role="menuitem" data-act="nt-readall" data-testid="notifications-more-mark-read"${C.unread?'':' disabled'}><i data-lucide="check-check"></i>Mark all as read</button><button type="button" role="menuitem" data-act="nt-hm-clear-read" data-testid="notifications-more-clear-read"><i data-lucide="eraser"></i>Clear read</button><button type="button" role="menuitem" data-act="nt-hm-clear-all" class="is-danger" data-testid="notifications-more-clear-all"><i data-lucide="trash-2"></i>Clear all (keeps pinned)</button><button type="button" role="menuitem" data-act="nt-prefs" data-testid="notifications-more-prefs"><i data-lucide="settings-2"></i>Preferences</button>`;
  ntcMenuAt(m,anchor); }

/* ---- delete with undo ---- */
function ntRemove(ids,label){ ntUndoCommit(); const A=ntAll(), gone=A.filter(x=>ids.includes(x.id)); if(!gone.length) return; _nt=A.filter(x=>!ids.includes(x.id)); ntSave();
  _ntUndo={items:gone,t:setTimeout(ntUndoCommit,5000)}; ids.forEach(i=>ntbDismiss(i)); ntcUndoShow(label||(gone.length===1?'Notification deleted':gone.length+' notifications deleted')); }
function ntUndoCommit(){ if(!_ntUndo) return; clearTimeout(_ntUndo.t); const sids=_ntUndo.items.filter(x=>x.sid).map(x=>x.sid); _ntUndo=null; ntcUndoHide(); if(sids.length) ntSrv('notif_delete',{ids:sids}); }
function ntUndo(){ if(!_ntUndo) return; clearTimeout(_ntUndo.t); const back=_ntUndo.items; _ntUndo=null; _nt=ntAll().concat(back); ntPrune(); ntSave(); ntcUndoHide(); ntQuietToast(back.length===1?'Notification restored':back.length+' notifications restored'); }
function ntcUndoShow(txt){ const u=document.querySelector('#nt-root .nt-undo'); if(!u) return; u.innerHTML=`<i data-lucide="trash-2"></i><span data-testid="notification-undo-text">${esc(txt)}</span><button type="button" data-act="nt-undo" data-testid="notification-undo-btn">Undo</button><i class="nt-undo-life"></i>`; u.hidden=false; u.classList.remove('is-in'); void u.offsetWidth; u.classList.add('is-in'); icons(); }
function ntcUndoHide(){ const u=document.querySelector('#nt-root .nt-undo'); if(u){ u.hidden=true; u.classList.remove('is-in'); } }
function ntMarkAllRead(){ const A=ntAll(); let n=0; A.forEach(x=>{ if(!x.read){ x.read=true; n++; } }); if(!n) return; ntSrv('notif_mark',{ids:null,is_read:true}); ntSave(); ntQuietToast(n===1?'1 marked as read':n+' marked as read'); }

/* ---- preferences ---- */
function ntcStatus(){ const u=sbUser(), [c,t,s]=!u?['is-off','Signed out','Sign in to get friend alerts on this device']:state._ntNoSql?['is-warn','Online alerts aren\u2019t switched on yet','The Treesh notifications setup hasn\u2019t been run']:_ntCh?['is-live','Live','Friend alerts arrive the moment they happen']:['is-poll','Connected','Checking for new alerts every minute'];
  return `<span class="nt-live ${c}" aria-hidden="true"><i></i></span><div><b data-testid="notifications-online-status-text">${t}</b><small>${s}</small></div>`; }
function ntcPrefsHtml(){ const P=ntP(), dnd=ntDnd(), C=ntcCounts(), dv=P.dnd===-1?'-1':dnd?(P.dk||'1h'):'0';
  const seg=(act,cur,opts,tid)=>`<div class="nt-seg" role="radiogroup" data-testid="${tid}">${opts.map(([v,l])=>{ const on=String(v)===String(cur); return `<button type="button" role="radio" aria-checked="${on}" data-act="${act}" data-val="${v}" data-testid="${tid}-${String(v).replace('-','m')}" class="${on?'is-on':''}">${l}</button>`; }).join('')}</div>`;
  const sw=(act,on,ic,t,s,tid,k,cls)=>`<button type="button" role="switch" aria-checked="${!!on}" data-act="${act}"${k?` data-k="${k}"`:''} data-testid="${tid}" class="nt-sw-row press"><span class="nt-sw-ic ${cls||''}"><i data-lucide="${ic}"></i></span><span class="nt-sw-tx"><b>${t}</b><small>${s}</small></span><span class="nt-sw${on?' is-on':''}" aria-hidden="true"><i></i></span></button>`;
  const hd=(ic,t,s)=>`<div class="nt-pc-h"><span class="nt-pc-ic"><i data-lucide="${ic}"></i></span><div><b>${t}</b><small>${s}</small></div></div>`;
  return `<header class="nt-head is-sub"><button type="button" data-act="nt-prefs-back" class="nt-ib press" aria-label="Back" data-testid="notifications-prefs-back"><i data-lucide="arrow-left"></i></button><div class="nt-head-l"><p class="nt-kick">Notifications</p><h2 class="nt-title font-display">Preferences</h2></div><button type="button" data-act="nt-close" class="nt-ib press" aria-label="Close" data-testid="notifications-close-btn"><i data-lucide="x"></i></button></header>
  <div class="nt-prefs" data-testid="notifications-preferences">
   <section class="nt-pc${dnd?' is-dnd':''}">${hd('moon','Do Not Disturb',dnd?(P.dnd===-1?'On until you turn it off':'On until '+ntUntil(P.dnd)):'Banners stay quiet. Everything still lands in your history.')}${seg('nt-dnd',dv,[['0','Off'],['1h','1 hour'],['tm','Until tomorrow'],['-1','Always']],'nt-dnd-seg')}</section>
   <section class="nt-pc">${hd('timer','Banner time','How long friend alerts stay on screen')}${seg('nt-dur',P.dur,[[3,'3s'],[5,'5s'],[8,'8s'],[0,'Until I dismiss']],'nt-dur-seg')}<button type="button" data-act="nt-preview" class="nt-btn is-ghost press nt-pc-btn" data-testid="notifications-preview-banner-btn"><i data-lucide="play"></i>Preview a banner</button></section>
   <section class="nt-pc">${hd('bell-ring','Alert types','Muted types still save quietly to your history')}<div class="nt-sw-list">${NT_ON.map(k=>sw('nt-mute',!P.mute[k],NT_KIND[k][0],NT_KIND[k][2],NT_KIND[k][3],'nt-type-'+k,k,NT_KIND[k][1])).join('')}</div></section>
   <section class="nt-pc">${hd('history','History',`${C.all} saved on this device \u00b7 ${C.unread} unread`)}<div class="nt-sw-list">${sw('nt-app-hist',P.app,'app-window','Save app pop-ups','Keep things like \u201cAdded to Liked\u201d in the App tab','nt-app-hist-toggle','','is-app')}</div>
    <p class="nt-pc-lbl">Keep history for</p>${seg('nt-keep',P.keep,[[30,'30 days'],[90,'90 days'],[0,'Forever']],'nt-keep-seg')}<button type="button" data-act="nt-hm-clear-all" class="nt-btn is-danger press nt-pc-btn" data-testid="notifications-clear-history-btn"><i data-lucide="trash-2"></i>Clear history (keeps pinned)</button></section>
   ${'Notification' in window?`<section class="nt-pc"><div class="nt-sw-list">${sw('nt-sys',P.sys&&Notification.permission==='granted','monitor-smartphone','Alerts in the background','A system alert when Treesh isn\u2019t on screen','nt-sys-toggle')}</div></section>`:''}
   <section class="nt-pc is-status" data-testid="notifications-online-status">${ntcStatus()}</section></div>`; }
function ntSetDnd(v){ const P=ntP(), d=new Date(); if(v==='1h') P.dnd=Date.now()+36e5; else if(v==='tm'){ d.setDate(d.getDate()+1); d.setHours(7,0,0,0); P.dnd=d.getTime(); } else if(v==='-1') P.dnd=-1; else P.dnd=0; P.dk=v; ntSetP(P);
  if(P.dnd) ntbClearAll(); ntQuietToast(P.dnd?'Do Not Disturb on':'Do Not Disturb off',P.dnd===-1?'Until you turn it off':P.dnd?'Until '+ntUntil(P.dnd):''); }
function ntPreview(){ ntBanner({id:'preview'+Date.now(),src:'preview',kind:'friend_accepted',t:Date.now(),actor:{id:'',u:'',n:'Treesh preview',av:TREESH_LOGO}}); }

/* ---- center clicks (shared listener lives in P9zv) ---- */
function ntcClick(a,t,e){ const id=t.dataset.id, p=ntcPanel(), it=id?ntFind(id):null, P=ntP();
  switch(a){
    case 'nt-open': if(state.ntOpen) ntcClose(); else ntcOpen(); break;
    case 'nt-open-prefs': ntcOpen(null,true); break;
    case 'nt-close': ntcClose(); break;
    case 'nt-tab': _ntc.tab=t.dataset.val; _ntc.lim=120; ntcMenuClose(); if(p){ ntcHead(p); ntcList(p); const L=p.querySelector('.nt-list'); if(L) L.scrollTop=0; } break;
    case 'nt-q-clear': _ntc.q=''; if(p){ ntcHead(p); ntcList(p); const q=p.querySelector('.nt-search input'); if(q) q.focus(); } break;
    case 'nt-readall': ntcMenuClose(); ntMarkAllRead(); break;
    case 'nt-prefs': ntcMenuClose(); _ntc.prefs=true; ntcPaint(true); break;
    case 'nt-prefs-back': _ntc.prefs=false; ntcPaint(true); break;
    case 'nt-more': if(document.querySelector('#nt-root .nt-menu')) ntcMenuClose(); else ntcMoreMenu(t); break;
    case 'nt-hm-clear-read': ntcMenuClose(); ntRemove(ntAll().filter(x=>x.read&&!x.pin).map(x=>x.id)); break;
    case 'nt-hm-clear-all': ntcMenuClose(); ntRemove(ntAll().filter(x=>!x.pin).map(x=>x.id)); break;
    case 'nt-row': { if(!it) break; if(t.closest('.nt-row-wrap')&&t.closest('.nt-row-wrap').classList.contains('is-drag')) break; ntMarkRead([id],true);
      if(it.actor&&it.actor.u&&it.kind!=='friend_request') ntViewActor(id); else { const b=t.querySelector('.nt-row-b'); t.classList.toggle('is-open'); if(b) b.title=''; } break; }
    case 'nt-menu': if(document.querySelector('#nt-root .nt-menu')) ntcMenuClose(); else ntcMenu(id,t); break;
    case 'nt-m-pin': case 'nt-q-pin': if(it){ it.pin=!it.pin; ntcMenuClose(); ntSave(); ntQuietToast(it.pin?'Pinned to the top':'Unpinned'); } break;
    case 'nt-m-read': case 'nt-q-read': if(it){ ntcMenuClose(); ntMarkRead([id],!it.read); } break;
    case 'nt-m-mute': if(it){ P.mute[it.kind]=!P.mute[it.kind]; ntSetP(P); ntcMenuClose(); ntQuietToast(P.mute[it.kind]?'Muted '+NT_KIND[it.kind][2].toLowerCase():'Turned on '+NT_KIND[it.kind][2].toLowerCase(),P.mute[it.kind]?'They still save to your history':''); } break;
    case 'nt-m-del': case 'nt-q-del': ntcMenuClose(); ntRemove([id]); break;
    case 'nt-more-rows': _ntc.lim+=120; if(p) ntcList(p); break;
    case 'nt-undo': ntUndo(); break;
    case 'nt-signin': ntcClose(); setTimeout(()=>sbAuthOpen('signin'),200); break;
    case 'nt-dnd': ntSetDnd(t.dataset.val); if(state.ntOpen) ntcPaint(); break;
    case 'nt-dur': P.dur=+t.dataset.val; ntSetP(P); ntcPaint(); break;
    case 'nt-mute': { const k=t.dataset.k; P.mute[k]=!P.mute[k]; ntSetP(P); ntcPaint(); break; }
    case 'nt-app-hist': P.app=!P.app; ntSetP(P); ntcPaint(); break;
    case 'nt-keep': P.keep=+t.dataset.val; ntSetP(P); ntPrune(); ntSave(true); ntcPaint(); break;
    case 'nt-sys': if(P.sys&&Notification.permission==='granted'){ P.sys=false; ntSetP(P); ntcPaint(); break; }
      Promise.resolve(Notification.requestPermission()).then(r=>{ const Q=ntP(); Q.sys=r==='granted'; ntSetP(Q); ntcPaint(); if(r!=='granted') ntQuietToast('Alerts are blocked','Allow notifications for Treesh in your browser settings'); }).catch(()=>{}); break;
    case 'nt-preview': ntPreview(); break;
    case 'nt-dnd-toggle': ntSetDnd(ntDnd()?'0':'-1'); try{ renderView(); }catch(err){} break; } }
document.addEventListener('pointerdown',e=>{ const m=document.querySelector('#nt-root .nt-menu'); if(m&&!m.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-act="nt-menu"],[data-act="nt-more"]'))) ntcMenuClose(); },true);

/* ---- Settings: name under picture + a Notifications card ---- */
const _vs9zw=viewSettings; viewSettings=function(){ let h=_vs9zw.apply(this,arguments); const tab=state.settingsTab;
  const i=h.indexOf('data-testid="a11y-quick-toggle"'), b=i>0?h.lastIndexOf('<button',i):-1;
  if(b>0) h=h.slice(0,b)+toggleCard('toggle-nav-pf-name','settings-toggle-nav-profile-name',!!state.navPfName,'circle-user-round','Show my name under my picture','Your nickname appears under your profile picture in the bottom bar')+'\n'+h.slice(b);
  const j=h.indexOf('<section data-testid="settings-sleep"'); const C=ntcCounts(), dnd=ntDnd();
  if(j>0) h=h.slice(0,j)+`<section data-testid="settings-notifications" class="${tab==='system'?'':'hidden'} rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
    <div class="mb-1 flex items-center gap-2.5"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="bell-ring" style="width:18px;height:18px"></i></span><h2 class="text-lg font-bold">Notifications</h2></div>
    <p class="mb-4 pl-11 text-sm text-white/50">Friend alerts, your full history and quiet hours.</p>
    <div class="space-y-2.5"><button data-act="nt-open" data-testid="settings-open-notifications" class="press flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.06]"><div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white/70"><i data-lucide="inbox" style="width:18px;height:18px"></i></div><div class="min-w-0 flex-1"><p class="text-sm font-semibold">Notification center</p><p class="text-xs text-white/50">${C.unread?C.unread+' unread \u00b7 ':''}${C.all} saved on this device</p></div><i data-lucide="chevron-right" style="width:16px;height:16px" class="text-white/40"></i></button>
    <button data-act="nt-open-prefs" data-testid="settings-notification-prefs" class="press flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.06]"><div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white/70"><i data-lucide="sliders-horizontal" style="width:18px;height:18px"></i></div><div class="min-w-0 flex-1"><p class="text-sm font-semibold">Notification preferences</p><p class="text-xs text-white/50">Banner time, alert types, history</p></div><i data-lucide="chevron-right" style="width:16px;height:16px" class="text-white/40"></i></button>
    ${toggleCard('nt-dnd-toggle','settings-toggle-dnd',dnd,'moon','Do Not Disturb','Silence friend banners. Everything still lands in your history')}</div></section>\n`+h.slice(j);
  return h; };
SETTINGS_INDEX.push(
  { id:'nav-pf-name', label:'Show my name under my picture', desc:'Your nickname under your picture in the bottom bar', kw:'profile name nickname picture avatar nav bottom bar label', ic:'circle-user-round', type:'toggle', get:()=>!!state.navPfName, toggle:()=>{ state.navPfName=!state.navPfName; LS.set('treesh_nav_pf_name',state.navPfName); try{ renderShell(); renderView(); }catch(e){} } },
  { id:'nt-dnd', label:'Do Not Disturb', desc:'Silence friend banners, keep the history', kw:'notifications quiet mute silence banners dnd alerts', ic:'moon', type:'toggle', get:()=>ntDnd(), toggle:()=>{ ntSetDnd(ntDnd()?'0':'-1'); } },
  { id:'nt-center', label:'Notification center', desc:'Every pop-up and friend alert you\u2019ve had', kw:'notifications inbox history alerts bell friend requests', ic:'bell', type:'action', go:()=>{ try{ closeSearch(); }catch(e){} setTimeout(()=>ntcOpen(),220); } });
