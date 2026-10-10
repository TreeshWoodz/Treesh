/* ---------- P9zzf: push notifications on this device (sw-push.js + /api/push), one-time friendly ask, Settings + notification preferences controls ---------- */
SB_LOCAL.push('treesh_push','treesh_news_last');
const PU_API=window.TREESH_PUSH_API||'/api/push';
const PU_TYPES=[['friends','users','Friend activity','Requests, answers and removals',1],['staff','shield-check','Staff & account','Moderation and changes to your account',1],['updates','sparkles','New versions','When a new Treesh is live',0],['news','megaphone','News from Treesh','Announcements from the team',0]];
const _pu={busy:false,testing:false,err:''};
let _puT=0, _puReg=null, _puAskT=0;
function puS(){ const d=LS.get('treesh_push',null)||{}; return {on:!!d.on,ep:d.ep||'',uid:d.uid||null,prefs:Object.assign({friends:true,staff:true,updates:true,news:true},d.prefs||{}),asked:!!d.asked,visits:+d.visits||0}; }
function puSave(p){ LS.set('treesh_push',p); }
const puHome=()=>navigator.standalone===true||!!(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
function puSupport(){ const has='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&window.isSecureContext;
  if(icnIOS()&&!puHome()) return 'ios';
  if(!has) return icnIOS()?'ios-old':'none';
  return Notification.permission==='denied'?'blocked':'ok'; }
function puB64(s){ const b=atob((s+'='.repeat((4-s.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from(b,c=>c.charCodeAt(0)); }
function puKeyEq(sub,k){ try{ const a=new Uint8Array(sub.options.applicationServerKey), b=puB64(k); return a.length===b.length&&a.every((x,i)=>x===b[i]); }catch(e){ return true; } }
function puPlatform(){ const u=navigator.userAgent; return (icnIOS()?'iOS':/Android/.test(u)?'Android':/Windows/.test(u)?'Windows':/Mac/.test(u)?'Mac':/CrOS|Linux/.test(u)?'Linux':'Web')+(puHome()?' app':''); }
function puErr(e){ const m=String((e&&e.message)||e||''); if(e&&e.name==='NotAllowedError') return 'Notifications are blocked for Treesh in your browser settings.'; if(e&&(e.name==='AbortError'||/push service/i.test(m))) return 'Your browser\u2019s push service didn\u2019t answer. Try again in a moment.'; return m||'Try again.'; }

async function puCall(path,body,auth){ const h={}; if(body) h['Content-Type']='application/json'; if(auth){ const t=await ieTok(); if(t) h.Authorization='Bearer '+t; }
  let r, d=null;
  try{ r=await fetch(PU_API+path,{method:body?'POST':'GET',cache:'no-store',headers:h,body:body?JSON.stringify(body):undefined}); }
  catch(e){ throw new Error(navigator.onLine===false?'You\u2019re offline. Connect and try again.':'Couldn\u2019t reach Treesh. Try again.'); }
  try{ d=await r.json(); }catch(e){}
  if(!r.ok||!d||typeof d!=='object') throw Object.assign(new Error((d&&d.message)||(r.status===404?'Push notifications aren\u2019t switched on for this site yet.':'Something went wrong ('+r.status+'). Try again.')),{status:r.status,code:d&&d.code});
  return d; }
function puReg(){ if(!_puReg) _puReg=navigator.serviceWorker.register('sw-push.js',{scope:'./'}).catch(e=>{ _puReg=null; throw e; }); return _puReg; }
async function puReady(){ await puReg(); return Promise.race([navigator.serviceWorker.ready,new Promise((_,no)=>setTimeout(()=>no(new Error('Treesh\u2019s notification helper didn\u2019t start. Reload and try again.')),12000))]); }
async function puRegGet(){ if(!('serviceWorker' in navigator)) return null; try{ return await navigator.serviceWorker.getRegistration('./'); }catch(e){ return null; } }

/* save this device on the server (signed in = linked to you, so friend + staff alerts can reach it) */
async function puSend(sub,old){ const P=puS(), u=sbUser(); const r=await puCall('/subscribe',Object.assign({subscription:sub.toJSON(),prefs:P.prefs,platform:puPlatform()},old&&old!==sub.endpoint?{old}:{}),true);
  const Q=puS(); Q.on=true; Q.ep=sub.endpoint; Q.uid=r.linked&&u?u.id:null; puSave(Q); return r; }
async function puEnable(){ if(_pu.busy) return; const sup=puSupport();
  if(sup!=='ok'){ puPaint(); if(sup==='blocked') toast('Notifications are blocked','Allow them for Treesh in your browser settings'); return; }
  _pu.busy=true; _pu.err=''; puPaint(); let perm='default';
  try{ perm=await Notification.requestPermission(); }catch(e){ perm=Notification.permission; }
  if(perm!=='granted'){ _pu.busy=false; puPaint(); toast(perm==='denied'?'Notifications are blocked':'Notifications stay off',perm==='denied'?'Allow them for Treesh in your browser settings':'Turn them on in Settings any time'); return; }
  try{ const reg=await puReady(), k=await puCall('/key'); let sub=await reg.pushManager.getSubscription();
    if(sub&&!puKeyEq(sub,k.key)){ try{ await sub.unsubscribe(); }catch(e){} sub=null; }
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:puB64(k.key)});
    await puSend(sub,puS().ep); toast('Notifications are on',sbUser()?'Friend alerts, account news and new versions':'New versions and Treesh news. Sign in for friend alerts'); }
  catch(e){ _pu.err=puErr(e); toast('Couldn\u2019t turn on notifications',_pu.err); }
  _pu.busy=false; puPaint(); }
async function puDisable(){ if(_pu.busy) return; _pu.busy=true; _pu.err=''; puPaint(); let ep=puS().ep;
  try{ const reg=await puRegGet(), sub=reg&&await reg.pushManager.getSubscription(); if(sub){ ep=sub.endpoint; await sub.unsubscribe().catch(()=>{}); } }catch(e){}
  if(ep) puCall('/unsubscribe',{endpoint:ep}).catch(()=>{});
  const P=puS(); P.on=false; P.ep=''; P.uid=null; puSave(P); _pu.busy=false; puPaint(); toast('Notifications are off','Alerts still land in your notification center'); }
function puOff(){ const P=puS(); if(P.ep) puCall('/unsubscribe',{endpoint:P.ep}).catch(()=>{}); P.on=false; P.ep=''; P.uid=null; puSave(P); puPaint(); }
async function puResync(){ const P=puS(); if(!P.on) return;
  try{ const reg=await puRegGet(), sub=reg&&await reg.pushManager.getSubscription(); if(!sub){ puOff(); return; } await puSend(sub,P.ep); }
  catch(e){ if(e&&e.status&&e.status!==503) toast('Couldn\u2019t update notifications',e.message); } puPaint(); }
function puPref(k){ const P=puS(); P.prefs[k]=P.prefs[k]===false; puSave(P); puPaint(); clearTimeout(_puT); _puT=setTimeout(puResync,450); }
async function puTest(){ const P=puS(); if(!P.on||_pu.testing) return; _pu.testing=true; puPaint();
  try{ await puCall('/test',{endpoint:P.ep}); toast('Test sent','It should pop up in a few seconds'); }
  catch(e){ toast('Couldn\u2019t send a test',e.message); if(e.code==='none'||e.code==='gone') puResync(); }
  _pu.testing=false; puPaint(); }
function puLink(){ const P=puS(); if(!P.on) return; const uid=sbUser()?sbUser().id:null; if((P.uid||null)!==uid) puResync(); }

/* ---- the card (Settings > Notifications and the notification preferences) ---- */
function puStatus(){ const P=puS(), s=puSupport();
  if(_pu.busy) return ['is-busy','Working\u2026'];
  if(s==='ios') return ['is-off','Add Treesh to your Home Screen to turn these on'];
  if(s==='ios-old') return ['is-off','Update to iOS 16.4 or later to get these'];
  if(s==='none') return ['is-off','This browser can\u2019t get push notifications'];
  if(s==='blocked') return ['is-warn','Blocked in your browser settings'];
  if(!P.on) return ['is-off','Off on this device'];
  const n=PU_TYPES.filter(t=>P.prefs[t[0]]!==false&&(!t[4]||sbUser())).length;
  return [n?'is-on':'is-warn',n?'On for this device':'On, but every type is off']; }
function puTypesHtml(pfx){ const P=puS(), u=!!sbUser();
  return `<div class="pu-types" data-testid="${pfx}-push-types">${PU_TYPES.map(([k,ic,t,d,acc])=>{ const lock=acc&&!u, v=!lock&&P.prefs[k]!==false; return `<button type="button" role="switch" aria-checked="${v}" data-act="pu-pref" data-k="${k}" data-testid="${pfx}-push-type-${k}" class="pu-type press${v?' is-on':''}${lock?' is-lock':''}"${lock?' disabled':''}><span class="pu-type-ic"><i data-lucide="${lock?'lock':ic}"></i></span><span class="pu-type-tx"><b>${t}</b><small>${lock?'Sign in to get these':d}</small></span><span class="nt-sw${v?' is-on':''}" aria-hidden="true"><i></i></span></button>`; }).join('')}</div>`; }
function puCardHtml(pfx){ const P=puS(), s=puSupport(), on=P.on&&s==='ok', st=puStatus(), u=!!sbUser();
  let h=`<div class="pu-card${on?' is-on':''}" data-pu-card="${pfx}" data-testid="${pfx}-push-card"><div class="pu-row"><span class="pu-ic"><i data-lucide="${on?'bell-ring':'smartphone'}"></i></span><div class="pu-tx"><p class="pu-t">Push notifications</p><p class="pu-s ${st[0]}" data-testid="${pfx}-push-status">${st[1]}</p></div>${s==='ok'?`<button type="button" role="switch" aria-checked="${on}" aria-label="Push notifications on this device" data-act="pu-toggle" data-testid="${pfx}-push-toggle" class="nt-sw pu-sw${on?' is-on':''}${_pu.busy?' is-busy':''}"${_pu.busy?' disabled':''}><i></i></button>`:''}</div>`;
  if(s==='ios') h+=`<ol class="pu-steps" data-testid="${pfx}-push-ios-steps">${['Tap <b>Share</b> at the bottom of Safari','Choose <b>Add to Home Screen</b>','Open Treesh from your Home Screen and turn this on'].map((t,i)=>`<li><span>${i+1}</span><p>${t}</p></li>`).join('')}</ol>`;
  else if(s==='blocked') h+=`<p class="pu-help" data-testid="${pfx}-push-blocked-help">Treesh can\u2019t ask again. Allow notifications for Treesh in your ${icnIOS()?'iPhone Settings, under Notifications':'browser\u2019s site settings'}, then come back here.</p>`;
  else if(on) h+=puTypesHtml(pfx)+`<div class="pu-foot"><button type="button" data-act="pu-test" data-testid="${pfx}-push-test" class="nt-btn press"${_pu.testing?' disabled':''}><i data-lucide="${_pu.testing?'loader-circle':'send'}"${_pu.testing?' class="sba-spin"':''}></i>${_pu.testing?'Sending\u2026':'Send a test'}</button>${u?'':`<button type="button" data-act="pu-signin" data-testid="${pfx}-push-signin" class="nt-btn is-ghost press"><i data-lucide="log-in"></i>Sign in for friend alerts</button>`}</div>`;
  else if(s==='ok') h+=`<p class="pu-help">${u?'Friend requests, account updates':'New versions and Treesh news'} on your lock screen, even when Treesh is closed.</p>`;
  if(_pu.err&&!on) h+=`<p class="pu-err" role="alert" data-testid="${pfx}-push-error">${esc(_pu.err)}</p>`;
  return h+'</div>'; }
function puPaint(){ document.querySelectorAll('[data-pu-card]').forEach(el=>{ el.outerHTML=puCardHtml(el.dataset.puCard); }); icons(); }

const _vs9zzf=viewSettings; viewSettings=function(){ let h=_vs9zzf.apply(this,arguments); const i=h.indexOf('data-act="nt-dnd-toggle"'), b=i>0?h.lastIndexOf('<button',i):-1;
  if(b>0) h=h.slice(0,b)+puCardHtml('settings')+'\n    '+h.slice(b);
  return h.replace('Friend alerts, your full history and quiet hours.','Alerts on this device, your full history and quiet hours.'); };
const _ntPrefs9zzf=ntcPrefsHtml; ntcPrefsHtml=function(){ return _ntPrefs9zzf.apply(this,arguments).replace(/<section class="nt-pc"><div class="nt-sw-list"><button type="button" role="switch" aria-checked="(?:true|false)" data-act="nt-sys"[\s\S]*?<\/section>/,'')
  .replace('<section class="nt-pc is-status"',`<section class="nt-pc">${puCardHtml('notifications')}</section>\n   <section class="nt-pc is-status"`); };
const _ntSys9zzf=ntSystem; ntSystem=function(){ if(puS().on) return; return _ntSys9zzf.apply(this,arguments); };
SETTINGS_INDEX.push({ id:'push', label:'Push notifications', desc:'Alerts on this device, even when Treesh is closed', kw:'push notifications alerts phone iphone android desktop lock screen background device updates', ic:'bell-ring', type:'toggle', get:()=>puS().on, toggle:()=>{ if(puS().on) puDisable(); else puEnable(); } });

/* ---- one friendly ask: after you sign in, or on your second visit. Never again after you choose ---- */
function puAskOk(){ const P=puS(); return !P.asked&&!P.on&&puSupport()==='ok'&&Notification.permission==='default'; }
function puAskSoon(){ if(!puAskOk()||_puAskT) return; let n=0;
  _puAskT=setInterval(()=>{ n++; if(!puAskOk()||n>60){ clearInterval(_puAskT); _puAskT=0; return; }
    if(n>=2&&!document.hidden&&state.profile&&!overlaysOpen()&&!state.npOpen&&!state.ntOpen&&!document.getElementById('eco-ask')&&!document.getElementById('adm-root')){ clearInterval(_puAskT); _puAskT=0; puAskShow(); } },2500); }
function puAskShow(){ if(document.getElementById('pu-ask')) return; const u=!!sbUser(), el=document.createElement('div'); el.id='pu-ask'; el.className='pu-ask is-in'; el.setAttribute('role','dialog'); el.setAttribute('aria-labelledby','pu-ask-t'); el.dataset.testid='push-prompt';
  el.innerHTML=`<div class="pu-ask-card"><span class="pu-ask-ic"><i data-lucide="bell-ring"></i></span><div class="pu-ask-tx"><p class="pu-ask-k">Notifications</p><h3 id="pu-ask-t" data-testid="push-prompt-title">Want Treesh alerts on this device?</h3><p>${u?'Friend requests, account updates and new versions':'New versions and Treesh news'}, even when Treesh is closed. Change it any time in Settings.</p></div><button type="button" data-act="pu-ask-no" class="pu-ask-x press" aria-label="Not now" data-testid="push-prompt-close"><i data-lucide="x"></i></button>
    <div class="pu-ask-btns"><button type="button" data-act="pu-ask-no" class="nt-btn press" data-testid="push-prompt-not-now">Not now</button><button type="button" data-act="pu-ask-yes" class="nt-btn is-primary press" data-testid="push-prompt-turn-on"><i data-lucide="bell"></i>Turn on</button></div></div>`;
  document.body.appendChild(el); icons(); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('is-in'))); }
function puAskDone(){ const P=puS(); P.asked=true; puSave(P); const el=document.getElementById('pu-ask'); if(el){ el.classList.add('is-out'); setTimeout(()=>el.remove(),320); } }

/* ---- taps on a notification, pushes that land while Treesh is on screen ---- */
function puOpen(url){ let u; try{ u=new URL(url,location.href); }catch(e){ return; } const q=u.searchParams, nt=q.get('nt'), pf=q.get('u');
  if(u.origin!==location.origin) return;
  if(q.get('v')){ verCheck(true); return; }
  if(nt&&/^o\d+$/.test(nt)){ const go=()=>ntcOpen(ntFind(nt)?nt:null); if(sbUser()) ntFetch().then(go,go); else go(); return; }
  if(nt&&/^n\d+$/.test(nt)){ const go=()=>ntcOpen(ntFind(nt)?nt:null); newsFetch(true).then(go,go); return; }
  if(pf&&/^[a-z0-9_.]{3,20}$/i.test(pf)){ sxOpenProfile(pf); return; }
  if(!/^\/(index\.html)?$/.test(u.pathname)) location.href=u.href; }
function puMsg(e){ const d=(e&&e.data)||{};
  if(d.type==='treesh-push-open') puOpen(d.url);
  else if(d.type==='treesh-push'){ if(d.kind==='update') verCheck(true); else if(d.kind==='news') newsFetch(true); else if(sbUser()) ntFetch(); } }
async function puBoot(){ const P=puS();
  try{ if(!sessionStorage.getItem('treesh_pv')){ sessionStorage.setItem('treesh_pv','1'); P.visits++; puSave(P); } }catch(e){}
  if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',puMsg);
  try{ const q=new URLSearchParams(location.search), nt=q.get('nt'); if(nt){ const url=location.href; q.delete('nt'); history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash); setTimeout(()=>puOpen(url),1600); } }catch(e){}
  if(P.visits>=2) puAskSoon();
  if(!P.on) return;
  if(puSupport()!=='ok'||Notification.permission!=='granted'){ puOff(); return; }
  try{ const reg=await puReady(), sub=await reg.pushManager.getSubscription(); if(!sub){ puOff(); return; } if(sub.endpoint!==P.ep) await puSend(sub,P.ep); else puLink(); }catch(e){} }
const _p9Init9zzf=p9Init; p9Init=function(){ const r=_p9Init9zzf.apply(this,arguments); setTimeout(()=>{ puBoot().catch(()=>{}); },900); return r; };
const _sbSI9zzf=sbSignedIn; sbSignedIn=function(){ const fresh=_sbJustAuthed; setTimeout(()=>{ puLink(); puPaint(); if(fresh) puAskSoon(); },1500); return _sbSI9zzf.apply(this,arguments); };
const _sbSO9zzf=sbSignedOut; sbSignedOut=function(){ const r=_sbSO9zzf.apply(this,arguments); setTimeout(()=>{ puLink(); puPaint(); },400); return r; };

document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act^="pu-"]'); if(!t) return;
  switch(t.dataset.act){
    case 'pu-toggle': if(puS().on&&puSupport()==='ok') puDisable(); else puEnable(); break;
    case 'pu-pref': puPref(t.dataset.k); break;
    case 'pu-test': puTest(); break;
    case 'pu-signin': { const o=state.ntOpen; if(o) ntcClose(); setTimeout(()=>sbAuthOpen('signin'),o?220:0); break; }
    case 'pu-ask-yes': puAskDone(); puEnable(); break;
    case 'pu-ask-no': puAskDone(); break; } });
