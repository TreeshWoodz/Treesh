/* ---------- P9zv: profile tab = bigger picture (name optional), notification history, online alerts (Supabase, live), message banners ---------- */
SB_LOCAL.push('treesh_nt','treesh_nt_last');

/* nav: just your picture, your name under it if you turn that on */
state.navPfName=LS.get('treesh_nav_pf_name',false);
navProfileHtml=function(){ const p=state.profile||{}, on=!!state.profileOpen, nm=!!state.navPfName;
  return `<button data-act="open-profile" data-testid="nav-mobile-profile" aria-label="Profile" title="${esc(p.nickname||'Profile')}" ${on?'aria-current="page"':''} class="gl-bnav-item nav-pf${nm?' has-name':''} ${on?'is-active ':''}flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors ${on?'text-[color:var(--treesh-purple)]':'text-white/55'}"><span class="nav-pf-av" data-testid="nav-profile-avatar">${p.avatar?img(p.avatar,'h-full w-full object-cover'):`<b>${esc((p.nickname||'T').charAt(0).toUpperCase())}</b>`}</span>${nm?`<span class="nav-pf-name max-w-full truncate" data-testid="nav-profile-name">${esc(p.nickname||'You')}</span>`:''}</button>`; };

/* ---- store (this device only) ---- */
const NT_KEY='treesh_nt', NT_PK='treesh_nt_prefs', NT_MAX=500;
const NT_ON=['friend_request','friend_accepted','friend_declined','friend_removed','request_cancelled','staff'];
const NT_KIND={friend_request:['user-plus','is-req','Friend requests','When someone wants to be friends'],friend_accepted:['user-check','is-ok','Accepted requests','When someone accepts your request'],friend_declined:['user-x','is-no','Declined requests','When someone turns down your request'],friend_removed:['user-minus','is-warn','Removed you','When someone removes you as a friend'],request_cancelled:['undo-2','is-mute','Cancelled requests','When someone takes back their request'],staff:['shield-check','is-staff','Staff & account','Moderation and changes to your account'],app:['bell','is-app','App pop-ups','Saved, changed, now playing'],star:['sparkles','is-star','Starlites','Stars and discoveries'],sync:['refresh-cw','is-ok','Sync','Changes from your other devices']};
const NT_VIEW={home:'Home',artists:'Icons',library:'Library',studios:'Studios',game:'Arcade',settings:'Settings',playlist:'Playlist',artist:'Artist',album:'Album',search:'Search'};
let _nt=null, _ntQuiet=false, _ntLast=null, _ntSaveT=0;
function ntP(){ const d=LS.get(NT_PK,null)||{}; return {dnd:+d.dnd||0,dk:d.dk||'',dur:[0,3,5,8].includes(d.dur)?d.dur:5,mute:Object.assign({},d.mute||{}),keep:[0,30,90].includes(d.keep)?d.keep:90,app:d.app!==false,sys:!!d.sys}; }
function ntSetP(p){ LS.set(NT_PK,p); ntBell(); }
function ntDnd(){ const d=ntP().dnd; return d===-1||d>Date.now(); }
function ntAll(){ if(!_nt){ const a=LS.get(NT_KEY,null); _nt=Array.isArray(a)?a.filter(x=>x&&x.id&&x.t):[]; ntPrune(); } return _nt; }
function ntPrune(){ const k=ntP().keep, cut=k?Date.now()-k*864e5:0; _nt=(_nt||[]).filter(x=>x.pin||x.t>=cut).sort((a,b)=>b.t-a.t);
  if(_nt.length>NT_MAX){ const pins=_nt.filter(x=>x.pin); _nt=pins.concat(_nt.filter(x=>!x.pin).slice(0,Math.max(0,NT_MAX-pins.length))).sort((a,b)=>b.t-a.t); } }
function ntSave(now){ clearTimeout(_ntSaveT); const go=()=>{ if(!LS.set(NT_KEY,_nt||[])){ _nt=(_nt||[]).filter(x=>x.pin||x.src==='online'||Date.now()-x.t<7*864e5); LS.set(NT_KEY,_nt); } }; if(now) go(); else _ntSaveT=setTimeout(go,250); ntBell(); if(state.ntOpen) ntcPaint(); }
function ntUnread(){ return ntAll().filter(x=>!x.read).length; }
function ntFind(id){ return ntAll().find(x=>x.id===id); }
function ntQuietToast(m,s){ _ntQuiet=true; try{ toast(m,s); } finally{ _ntQuiet=false; } }
addEventListener('storage',e=>{ if(e.key===NT_KEY){ _nt=null; ntBell(); if(state.ntOpen) ntcPaint(); } else if(e.key===NT_PK) ntBell(); });

/* every pop-up lands in the App tab (already seen, so it isn't counted as unread) */
const _toast9zv=toast; toast=function(msg,sub,opts){
  if(state._ntOk&&/^\d+ friend requests?$/.test(String(msg||''))) return;
  try{ ntLogApp(msg,sub,opts); }catch(e){} return _toast9zv.apply(this,arguments); };
function ntLogApp(msg,sub,opts){ if(_ntQuiet||!msg||!ntP().app) return; const m=String(msg).slice(0,140), s=sub?String(sub).slice(0,240):'', now=Date.now();
  if(_ntLast&&_ntLast.title===m&&_ntLast.body===s&&now-_ntLast.t<5000){ _ntLast.t=now; _ntLast.n=(_ntLast.n||1)+1; ntSave(); return; }
  const it={id:'a'+now.toString(36)+Math.random().toString(36).slice(2,6),src:'app',kind:opts&&opts.star?'star':'app',t:now,read:true,title:m,body:s,view:NT_VIEW[state.view]||''};
  ntAll().unshift(it); _ntLast=it; ntPrune(); ntSave(); }

/* ---- words ---- */
function ntName(it){ const a=it.actor||{}; return a.n||(a.u?'@'+a.u:'Someone'); }
function ntAgo(t){ const s=Math.max(0,(Date.now()-t)/1000); if(s<45) return 'now'; if(s<3600) return Math.max(1,Math.round(s/60))+'m'; if(s<86400) return Math.round(s/3600)+'h'; if(s<604800) return Math.round(s/86400)+'d'; return new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function ntDate(t){ return new Date(t).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }
function ntEditList(c){ const L=[]; if('display_name' in c) L.push('name'); if('username' in c) L.push('@username'); if('bio' in c) L.push('bio'); if(c.remove_avatar) L.push('photo'); if(c.remove_banner) L.push('banner'); return L.length?'Changed: '+L.join(', '):''; }
function ntStaffCopy(it){ const d=it.data||{}, x=d.detail||{}, until=x.until&&Date.parse(x.until)?'Until '+ntDate(Date.parse(x.until)):'', why=x.reason?'Reason: '+x.reason:'', j=a=>a.filter(Boolean).join(' \u00b7 ');
  const M={ban:['Your account was suspended',j([until,why])],unban:['Your suspension was lifted','Welcome back to Treesh'],mute:['Your profile changes are on hold',j([until,why])||'People see your page as it was'],unmute:['Your profile is live again','Everyone sees your latest changes'],edit:['Treesh staff updated your profile',ntEditList(x)],verify:['You\u2019re verified','Your page shows the verified badge now'],unverify:['Your verified badge was removed',''],make_mod:['You\u2019re a Treesh moderator now','Staff tools are on your profile'],make_admin:['You\u2019re a Treesh admin now','Every staff tool is unlocked'],remove_mod:['You\u2019re no longer a moderator',''],remove_admin:['You\u2019re no longer an admin','']};
  const m=M[d.action]||['Your account was updated','By Treesh staff']; return {t:esc(m[0]),p:m[0],b:m[1],app:'Account'}; }
function ntCopy(it){ const nm=ntName(it), B=`<b>${esc(nm)}</b>`, u=it.actor&&it.actor.u&&it.actor.n?'@'+it.actor.u:'', w=(a,b)=>({t:B+' '+a,p:nm+' '+a,b,app:'Friends'});
  switch(it.kind){
    case 'friend_request': return w('sent you a friend request',u?u+' wants to be friends on Treesh':'Wants to be friends on Treesh');
    case 'friend_accepted': return w('accepted your friend request','You\u2019re friends now. Say hi on their page');
    case 'friend_declined': return w('declined your friend request','You can send another one later');
    case 'friend_removed': return w('removed you as a friend','Their friends-only sections are hidden from you now');
    case 'request_cancelled': return w('cancelled their friend request',u);
    case 'staff': return ntStaffCopy(it);
    default: return {t:esc(it.title),p:it.title,b:it.body||'',app:it.kind==='star'?'Starlites':it.kind==='sync'?'Sync':'Treesh'}; } }
function ntAvHtml(it,cls){ const K=NT_KIND[it.kind]||NT_KIND.app, a=it.actor;
  const face=a?(a.av?`<img src="${esc(a.av)}" alt="" loading="lazy" draggable="false">`:`<b>${esc(ntName(it).replace(/^@/,'').charAt(0).toUpperCase())}</b>`):`<i data-lucide="${K[0]}"></i>`;
  return `<span class="nt-av ${a?'':'is-sys '}${K[1]} ${cls||''}">${face}${a?`<span class="nt-kind ${K[1]}"><i data-lucide="${K[0]}"></i></span>`:''}</span>`; }
function ntActsHtml(it,pre){ const T=pre||'notification';
  if(it.kind==='sync') return !it.done&&_sbRLWait?`<div class="nt-acts"><button type="button" data-act="nt-sync-refresh" data-id="${it.id}" data-testid="${T}-action-refresh${pre?'':'-'+it.id}" class="nt-btn is-primary press"><i data-lucide="refresh-cw"></i>Refresh now</button></div>`:'';
  if(it.kind==='friend_request'&&!it.done) return `<div class="nt-acts"><button type="button" data-act="nt-accept" data-id="${it.id}" data-testid="${T}-action-accept${pre?'':'-'+it.id}" class="nt-btn is-primary press"><i data-lucide="check"></i>Accept</button><button type="button" data-act="nt-decline" data-id="${it.id}" data-testid="${T}-action-decline${pre?'':'-'+it.id}" class="nt-btn press"><i data-lucide="x"></i>Decline</button><button type="button" data-act="nt-view" data-id="${it.id}" data-testid="${T}-action-view${pre?'':'-'+it.id}" class="nt-btn is-ghost press">View</button></div>`;
  if(it.done){ const D={accepted:['user-check','You\u2019re friends now','is-ok'],declined:['x','Request declined',''],gone:['clock','Request no longer available','']}[it.done]||['check','Done',''];
    return `<div class="nt-acts"><span class="nt-done ${D[2]}" data-testid="${T}-done${pre?'':'-'+it.id}"><i data-lucide="${D[0]}"></i>${D[1]}</span>${it.actor&&it.actor.u?`<button type="button" data-act="nt-view" data-id="${it.id}" data-testid="${T}-action-view${pre?'':'-'+it.id}" class="nt-btn is-ghost press">View profile</button>`:''}</div>`; }
  if(it.actor&&it.actor.u) return `<div class="nt-acts"><button type="button" data-act="nt-view" data-id="${it.id}" data-testid="${T}-action-view${pre?'':'-'+it.id}" class="nt-btn is-ghost press"><i data-lucide="circle-user-round"></i>View profile</button></div>`;
  if(it.kind==='staff') return `<div class="nt-acts"><button type="button" data-act="nt-myprofile" data-id="${it.id}" data-testid="${T}-action-profile${pre?'':'-'+it.id}" class="nt-btn is-ghost press"><i data-lucide="circle-user-round"></i>Your profile</button></div>`;
  return ''; }

/* ---- online: Supabase table + Realtime, a light poll as backup ---- */
let _ntCh=null, _ntUid=null, _ntBusy=false, _ntNoSqlAt=0;
async function ntRpc(fn,args){ if(!sb) throw new Error('offline'); const {data,error}=await sb.rpc(fn,args||{});
  if(error){ if(error.code==='PGRST202'||error.code==='42883'||/Could not find the function/i.test(error.message||'')){ state._ntNoSql=true; _ntNoSqlAt=Date.now(); } throw error; }
  state._ntOk=true; state._ntNoSql=false; return data; }
function ntSrv(fn,args){ if(!sb||!sbUser()||state._ntNoSql) return; ntRpc(fn,args).catch(()=>{}); }
function ntLastGet(){ const l=LS.get('treesh_nt_last',null), u=sbUser(); return l&&u&&l.uid===u.id?(+l.id||0):null; }
function ntLastSet(id){ const u=sbUser(); if(u) LS.set('treesh_nt_last',{uid:u.id,id}); }
async function ntFetch(){ const u=sbUser(); if(!u||!sb||_ntBusy||navigator.onLine===false) return; if(state._ntNoSql&&Date.now()-_ntNoSqlAt<6e5) return; _ntBusy=true;
  try{ const last=ntLastGet(); const rows=await ntRpc('my_notifications',{after_id:last||0}); if(sbUser()&&sbUser().id===u.id) ntIngest(rows||[],{first:last==null}); }catch(e){} finally{ _ntBusy=false; } }
function ntFromRow(r){ const d=r.data||{}; return {id:'o'+r.id,sid:+r.id,src:'online',kind:NT_ON.includes(r.kind)?r.kind:'staff',t:Date.parse(r.created_at)||Date.now(),read:!!r.read,
  actor:r.actor?{id:r.actor,u:d.username||'',n:d.display_name||'',av:d.avatar_url||''}:null,data:{action:d.action||null,detail:d.detail||null}}; }
function ntIngest(rows,o){ o=o||{}; const A=ntAll(), have=new Set(A.filter(x=>x.sid).map(x=>x.sid)); let max=ntLastGet()||0; const fresh=[];
  rows.slice().sort((a,b)=>a.id-b.id).forEach(r=>{ if(!r||r.id==null) return; max=Math.max(max,+r.id); if(have.has(+r.id)) return; const it=ntFromRow(r);
    if(it.actor){ const j=A.findIndex(x=>x.src==='online'&&x.kind===it.kind&&x.actor&&x.actor.id===it.actor.id&&Math.abs(x.t-it.t)<6e5); if(j>=0){ it.pin=A[j].pin; A.splice(j,1); } }
    if(it.kind==='request_cancelled'||it.kind==='friend_accepted') A.forEach(x=>{ if(x.kind==='friend_request'&&!x.done&&x.actor&&it.actor&&x.actor.id===it.actor.id) x.done=it.kind==='friend_accepted'?'accepted':'gone'; });
    A.unshift(it); have.add(it.sid); fresh.push(it); });
  if(max) ntLastSet(max);
  if(!fresh.length) return; ntPrune(); ntSave(true); ntSocialRefresh(fresh);
  const P=ntP(), recent=fresh.filter(x=>!x.read&&!P.mute[x.kind]&&(o.live||Date.now()-x.t<15*6e4)).sort((a,b)=>a.t-b.t);
  if(!recent.length) return; ntBellRing();
  if(document.hidden&&P.sys) ntSystem(recent[recent.length-1],recent.length);
  if(ntDnd()||state.ntOpen) return;
  if(recent.length>3){ recent.slice(-2).forEach(x=>ntBanner(x)); ntBanner({summary:recent.length-2}); } else recent.forEach(x=>ntBanner(x)); }
function ntSocialRefresh(fresh){ const fr=fresh.filter(x=>x.kind!=='staff'); if(!fr.length) return;
  const d=fr.filter(x=>x.kind==='friend_request').length-fr.filter(x=>x.kind==='request_cancelled').length; if(d) state._sxIncoming=Math.max(0,(state._sxIncoming||0)+d);
  try{ const b=document.querySelector('[data-testid="hero-friends"] .sx-badge'); if(b){ const n=state._sxIncoming||0; b.textContent=n||''; b.hidden=!n; } }catch(e){}
  try{ if(document.querySelector('#modal2 .sx-fr')) sxFriendsLoad(); }catch(e){}
  try{ if(_sxV&&_sxV.d&&fr.some(x=>x.actor&&x.actor.id===_sxV.d.id)) sxOpenProfile(_sxV.d.username); }catch(e){} }
function ntLive(){ const u=sbUser(); if(!sb||!u||typeof sb.channel!=='function'||state._ntNoSql) return; if(_ntCh&&_ntUid===u.id) return; ntUnlive(); _ntUid=u.id;
  try{ _ntCh=sb.channel('treesh-nt-'+u.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+u.id},p=>{ if(p&&p.new&&sbUser()&&p.new.user_id===sbUser().id) ntIngest([p.new],{live:true}); }).subscribe(); }catch(e){ _ntCh=null; _ntUid=null; } }
function ntUnlive(){ if(_ntCh){ try{ sb.removeChannel(_ntCh); }catch(e){} } _ntCh=null; _ntUid=null; }
function ntStart(){ if(!sbUser()){ ntUnlive(); return; } ntFetch().then(ntLive); }
const _sbSI9zv=sbSignedIn; sbSignedIn=function(){ setTimeout(ntStart,1200); return _sbSI9zv.apply(this,arguments); };
const _sbSO9zv=sbSignedOut; sbSignedOut=function(){ ntUnlive(); return _sbSO9zv.apply(this,arguments); };
setInterval(()=>{ if(!document.hidden&&sbUser()) ntFetch(); },60000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&sbUser()) ntFetch(); });
addEventListener('online',()=>{ if(sbUser()) ntStart(); });
function ntSystem(it,n){ try{ if(!('Notification' in window)||Notification.permission!=='granted') return; const c=ntCopy(it);
  const x=new Notification(n>1?n+' new on Treesh':c.p,{body:n>1?c.p:(c.b||''),icon:(it.actor&&it.actor.av)||TREESH_LOGO,tag:'treesh-'+it.id}); x.onclick=()=>{ try{ focus(); }catch(e){} ntcOpen(it.id); x.close(); }; }catch(e){} }

/* ---- friend request answers from a banner or the center ---- */
async function ntAnswer(id,yes,btn){ const it=ntFind(id); if(!it||!it.actor) return; const box=btn&&btn.closest('.nt-acts'); if(box) box.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{ const rel=await sxRpc('respond_friend_request',{other:it.actor.id,accept:!!yes}); it.done=yes?(rel==='friends'?'accepted':'gone'):'declined'; it.read=true;
    if(it.sid) ntSrv('notif_mark',{ids:[it.sid],is_read:true}); state._sxIncoming=Math.max(0,(state._sxIncoming||0)-1); ntSave(true); ntbRefresh(id); ntSocialRefresh([{kind:'none'}]);
    ntQuietToast(it.done==='accepted'?'You\u2019re friends now':it.done==='gone'?'That request is gone':'Request declined',it.done==='accepted'?ntName(it):'');
    if(it.done!=='gone') setTimeout(()=>ntbDismiss(id),it.done==='accepted'?1600:900); }
  catch(e){ if(box) box.querySelectorAll('button').forEach(b=>b.disabled=false); ntQuietToast('Couldn\u2019t do that',sxErr(e)); } }
function ntMarkRead(ids,on){ const A=ntAll(), sids=[]; A.forEach(x=>{ if(ids.includes(x.id)&&x.read!==on){ x.read=on; if(x.sid) sids.push(x.sid); } }); if(sids.length) ntSrv('notif_mark',{ids:sids,is_read:on}); ntSave(); }
function ntViewActor(id){ const it=ntFind(id); if(!it||!it.actor||!it.actor.u) return; ntMarkRead([id],true); ntbDismiss(id); const go=()=>sxOpenProfile(it.actor.u); if(state.ntOpen){ ntcClose(); setTimeout(go,200); } else go(); }

/* ---- bell in the top bar ---- */
function ntBellHtml(){ const n=ntUnread(), d=ntDnd();
  return `<button data-act="nt-open" aria-label="${n?'Notifications, '+n+' unread':'Notifications'}" title="Notifications" data-testid="header-notifications-bell-btn" class="press nt-bell relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10${d?' is-dnd':''}${state.ntOpen?' is-on':''}"><i data-lucide="bell" style="width:18px;height:18px"></i><span class="nt-badge" data-testid="notifications-unread-badge"${n?'':' hidden'}>${n>99?'99+':n}</span><span class="nt-moon" data-testid="notifications-dnd-indicator" aria-hidden="true"><i data-lucide="moon"></i></span></button>`; }
function ntBell(){ const b=document.querySelector('#app header [data-testid="header-notifications-bell-btn"]'); if(!b) return; const n=ntUnread(), s=b.querySelector('.nt-badge');
  if(s){ s.textContent=n>99?'99+':String(n); s.hidden=!n; } b.classList.toggle('is-dnd',ntDnd()); b.classList.toggle('is-on',!!state.ntOpen); b.setAttribute('aria-label',n?'Notifications, '+n+' unread':'Notifications'); }
function ntBellRing(){ const b=document.querySelector('#app header [data-testid="header-notifications-bell-btn"]'); if(!b) return; b.classList.remove('is-ring'); void b.offsetWidth; b.classList.add('is-ring'); setTimeout(()=>b.classList.remove('is-ring'),1100); }
const _rShell9zv=renderShell; renderShell=function(){ const r=_rShell9zv.apply(this,arguments); const s=document.querySelector('#app header [data-testid="open-settings-button"]');
  if(s&&!document.querySelector('#app header [data-testid="header-notifications-bell-btn"]')){ s.insertAdjacentHTML('beforebegin',ntBellHtml()); icons(); } return r; };
setInterval(()=>{ const d=ntP().dnd; if(d>0&&d<=Date.now()){ const p=ntP(); p.dnd=0; ntSetP(p); if(state.ntOpen) ntcPaint(); } },30000);

/* ---- message banners: in from the right, out to the right (or flick up), pause while you touch them ---- */
function ntbRoot(){ let r=document.getElementById('ntb-root'); if(!r){ r=document.createElement('div'); r.id='ntb-root'; r.setAttribute('aria-live','polite'); r.dataset.testid='notification-banners'; document.body.appendChild(r);
    r.addEventListener('pointerenter',e=>{ if(e.pointerType==='mouse'){ r.classList.add('is-hold','is-fan'); ntbLayout(); } }); r.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse'){ r.classList.remove('is-hold','is-fan'); ntbLayout(); } }); } return r; }
function ntBanner(it){ const r=ntbRoot(), P=ntP(), sum=!!it.summary, id=sum?'sum'+Date.now():it.id; if(!sum&&r.querySelector(`.ntb[data-id="${id}"]`)) return;
  const c=sum?{t:`<b>${it.summary} more</b> notifications`,b:'Open your notifications to catch up',app:'Treesh'}:ntCopy(it), K=sum?NT_KIND.app:(NT_KIND[it.kind]||NT_KIND.app);
  const el=document.createElement('div'); el.className='ntb is-in'; el.dataset.id=id; el.dataset.testid='notification-banner-item'; el.setAttribute('role','status'); el.style.setProperty('--d',(P.dur||0)+'s');
  el.innerHTML=`<div class="ntb-card ${K[1]}"><button type="button" data-act="ntb-open" data-id="${id}" class="ntb-main" data-testid="notification-banner-open">${sum?`<span class="nt-av is-sys is-app"><i data-lucide="layers"></i></span>`:ntAvHtml(it,'is-lg')}<span class="ntb-txt"><span class="ntb-top"><span class="ntb-app"><i data-lucide="${K[0]}"></i>${esc(c.app)}</span><time>now</time></span><span class="ntb-t">${c.t}</span>${c.b?`<span class="ntb-b">${esc(c.b)}</span>`:''}</span></button><button type="button" data-act="ntb-x" data-id="${id}" class="ntb-x" aria-label="Dismiss" data-testid="notification-banner-dismiss"><i data-lucide="x"></i></button>${sum?'':ntActsHtml(it,'notification-banner')}${P.dur?'<i class="ntb-life"></i>':''}</div>`;
  r.prepend(el); icons(); ntbWire(el);
  const life=el.querySelector('.ntb-life'); if(life) life.addEventListener('animationend',()=>ntbDismiss(id));
  const all=[...r.querySelectorAll('.ntb:not(.is-out)')]; all.slice(3).forEach(x=>ntbDismiss(x.dataset.id));
  requestAnimationFrame(()=>{ ntbLayout(); requestAnimationFrame(()=>el.classList.remove('is-in')); });
  try{ navigator.vibrate&&navigator.vibrate(12); }catch(e){} }
function ntbLayout(){ const r=document.getElementById('ntb-root'); if(!r) return; const L=[...r.querySelectorAll('.ntb:not(.is-out)')], fan=r.classList.contains('is-fan')||innerWidth>=1024; let y=0;
  L.forEach((el,i)=>{ el.style.zIndex=10-i; if(el._drag) return; if(fan){ el.style.setProperty('--y',y+'px'); el.style.setProperty('--s','1'); el.style.setProperty('--o','1'); y+=el.offsetHeight+10; }
    else { el.style.setProperty('--y',(i*11)+'px'); el.style.setProperty('--s',String(1-i*0.05)); el.style.setProperty('--o',i?String(1-i*0.3):'1'); }
    el.classList.toggle('is-back',!fan&&i>0); });
  r.style.height=(fan?y:(L[0]?L[0].offsetHeight+L.length*11:0))+'px'; }
function ntbDismiss(id,dir){ const r=document.getElementById('ntb-root'), el=r&&r.querySelector(`.ntb[data-id="${id}"]`); if(!el||el.classList.contains('is-out')) return;
  el.classList.add('is-out',dir==='up'?'to-up':'to-right'); setTimeout(()=>{ el.remove(); ntbLayout(); },320); ntbLayout(); }
function ntbClearAll(){ const r=document.getElementById('ntb-root'); if(r) r.querySelectorAll('.ntb').forEach(el=>ntbDismiss(el.dataset.id)); }
function ntbRefresh(id){ const r=document.getElementById('ntb-root'), el=r&&r.querySelector(`.ntb[data-id="${id}"]`), it=ntFind(id); if(!el||!it) return; const a=el.querySelector('.nt-acts'), h=ntActsHtml(it,'notification-banner'); if(a){ const t=document.createElement('div'); t.innerHTML=h; a.replaceWith(t.firstElementChild||t); icons(); ntbLayout(); } }
function ntbWire(el){ let S=null; const card=el.querySelector('.ntb-card');
  el.addEventListener('pointerdown',e=>{ if(e.button>0||e.target.closest('.nt-acts button,.ntb-x')) return; S={x:e.clientX,y:e.clientY,dx:0,dy:0,on:false,id:e.pointerId,t:performance.now()}; el.parentElement&&el.parentElement.classList.add('is-hold'); });
  el.addEventListener('pointermove',e=>{ if(!S||e.pointerId!==S.id) return; const dx=e.clientX-S.x, dy=e.clientY-S.y;
    if(!S.on){ if(Math.hypot(dx,dy)<7) return; S.on=true; el._drag=true; el.classList.add('is-drag'); try{ el.setPointerCapture(e.pointerId); }catch(_){} }
    S.dx=dx; S.dy=dy; const x=dx>0?dx:dx*0.25, y=dy<0?dy:dy*0.2; card.style.transform=`translate3d(${x}px,${y}px,0)`; card.style.opacity=String(Math.max(0.3,1-Math.max(0,dx)/(el.offsetWidth*1.2)-Math.max(0,-dy)/220)); });
  const end=e=>{ if(!S||(e&&e.pointerId!==S.id)) return; const s=S; S=null; const root=el.parentElement; if(root&&!root.matches(':hover')) root.classList.remove('is-hold'); if(!s.on) return;
    el._drag=false; el.classList.remove('is-drag'); el._sw=Date.now(); const dt=Math.max(1,performance.now()-s.t), vx=s.dx/dt, vy=s.dy/dt;
    if(s.dx>Math.min(110,el.offsetWidth*0.32)||(vx>0.55&&s.dx>24)){ card.style.transform=''; card.style.opacity=''; ntbDismiss(el.dataset.id,'right'); return; }
    if(s.dy<-44||(vy<-0.5&&s.dy<-16)){ card.style.transform=''; card.style.opacity=''; ntbDismiss(el.dataset.id,'up'); return; }
    card.style.transition='transform .42s cubic-bezier(.34,1.56,.64,1), opacity .3s ease'; card.style.transform=''; card.style.opacity=''; setTimeout(()=>{ card.style.transition=''; },440); ntbLayout(); };
  el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
  el.addEventListener('click',e=>{ if(el._sw&&Date.now()-el._sw<350){ e.stopPropagation(); e.preventDefault(); } },true); }

/* ---- clicks shared by banners and the center ---- */
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act^="nt-"],[data-act^="ntb-"],[data-act="toggle-nav-pf-name"]'); if(!t) return; const a=t.dataset.act, id=t.dataset.id;
  switch(a){
    case 'toggle-nav-pf-name': state.navPfName=!state.navPfName; LS.set('treesh_nav_pf_name',state.navPfName); try{ renderShell(); renderView(); }catch(err){} toast(state.navPfName?'Your name shows under your picture':'Picture only in the nav bar'); break;
    case 'ntb-x': ntbDismiss(id,'right'); break;
    case 'ntb-open': { ntbDismiss(id,'right'); if(String(id).indexOf('sum')===0){ ntcOpen(); break; } const it=ntFind(id); if(!it) break; ntMarkRead([id],true); ntcOpen(id); break; }
    case 'nt-accept': case 'nt-decline': ntAnswer(id,a==='nt-accept',t); break;
    case 'nt-view': ntViewActor(id); break;
    case 'nt-myprofile': ntMarkRead([id],true); ntbDismiss(id); if(state.ntOpen) ntcClose(); setTimeout(()=>openProfile(),state.ntOpen?200:0); break;
    default: if(typeof ntcClick==='function') ntcClick(a,t,e); } });
