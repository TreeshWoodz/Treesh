/* ---------- P9zzl: profiles — every profile opens as a sheet between the top bar and the nav bar (the profile itself), full screen fills the page with Profile / Stats / Activity (swipe on phones), public Magic Markup ---------- */
const PFP_PAGES=[['profile','Profile','user-round'],['stats','Stats','chart-no-axes-column'],['activity','Activity','activity']];
const PFP_ACT=['favorites','lyrics','disliked','playlists'], SXP_STATS=['listening','badges'];
function pfpIdx(pg){ return Math.max(0,PFP_PAGES.findIndex(p=>p[0]===pg)); }
function pfpTabsHtml(pg,pre){ return `<div class="pfp-tabs pfp-skip" role="tablist" aria-label="Profile pages" data-testid="${pre}-pages" style="--pi:${pfpIdx(pg)}"><div class="pfp-seg"><span class="pfp-ind" aria-hidden="true"></span>${PFP_PAGES.map(([k,l,ic])=>`<button type="button" role="tab" aria-selected="${k===pg}" data-act="pfp-go" data-val="${k}" data-testid="${pre}-page-${k}" class="pfp-tab press${k===pg?' on':''}"><i data-lucide="${ic}"></i><span>${l}</span></button>`).join('')}</div></div>`; }
function pfpSyncTabs(root,pg){ const tb=root&&root.querySelector('.pfp-tabs'); if(!tb) return; tb.style.setProperty('--pi',pfpIdx(pg)); tb.querySelectorAll('.pfp-tab').forEach(b=>{ const on=b.dataset.val===pg; b.classList.toggle('on',on); b.setAttribute('aria-selected',String(on)); }); }
function pfpTop(sc,tb){ const prev=tb&&tb.previousElementSibling; return prev?Math.max(0,Math.round(prev.getBoundingClientRect().bottom-sc.getBoundingClientRect().top+sc.scrollTop)):0; }
function pfpKeepTop(sc,y){ const tb=sc&&sc.querySelector(':scope > .pfp-tabs'); if(!tb) return; sc.scrollTop=Math.min(y,pfpTop(sc,tb)); }
function pfpAnim(panel,dir){ if(!panel) return; panel.dataset.dir=dir>0?'next':dir<0?'prev':''; panel.classList.remove('pfp-in'); void panel.offsetWidth; panel.classList.add('pfp-in'); }
function pfpStuckWire(sc){ if(!sc||sc._pfpSt) return; sc._pfpSt=1; const f=()=>{ const tb=sc.querySelector(':scope > .pfp-tabs'), on=!!tb&&tb.getBoundingClientRect().top<=sc.getBoundingClientRect().top+(parseFloat(getComputedStyle(tb).top)||0)+1&&sc.scrollTop>4; if(tb) tb.classList.toggle('is-stuck',on); const p=sc.closest('#profile-panel,.sx-panel'); if(p) p.classList.toggle('pfx-stuck',on); }; sc.addEventListener('scroll',f,{passive:true}); f(); }
function pfpSwipe(sc,cur,go){ if(!sc||sc._pfpSw) return; sc._pfpSw=1; let x0=0,y0=0,t0=0,ok=false;
  sc.addEventListener('touchstart',e=>{ const t=e.touches[0]; ok=e.touches.length===1&&!!sc.querySelector(':scope > .pfp-tabs')&&!document.documentElement.classList.contains('mkd-on')&&!e.target.closest('input,textarea,select,[contenteditable="true"],.no-scrollbar,.overflow-x-auto,.sx-tabs,.pfp-tabs,.sp-top8,.tl-row,.mkd-ui,[data-noswipe]'); x0=t.clientX; y0=t.clientY; t0=Date.now(); },{passive:true});
  sc.addEventListener('touchend',e=>{ if(!ok) return; ok=false; const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0; if(Math.abs(dx)<64||Math.abs(dx)<Math.abs(dy)*1.7||Date.now()-t0>650) return;
    const j=pfpIdx(cur())+(dx<0?1:-1); if(j>=0&&j<PFP_PAGES.length) go(PFP_PAGES[j][0],dx<0?1:-1); },{passive:true}); }
function pfpWantTab(pg){ return pg==='stats'?'stats':pg==='activity'?(PFP_ACT.includes(state.profileTab)?state.profileTab:(state._pfAct||'favorites')):null; }

/* the space between the bars: below the top bar, above the nav bar, right of the desktop sidebar (bars hidden under another overlay don't count) */
function pfBarRect(el){ if(!el||getComputedStyle(el).display==='none') return null; const r=el.getBoundingClientRect(); if(r.width<2||r.height<2||r.bottom<=0||r.top>=innerHeight) return null;
  const x=Math.min(innerWidth-2,Math.max(1,r.left+r.width/2)), y=Math.min(innerHeight-2,Math.max(1,r.top+r.height/2));
  const hit=document.elementsFromPoint(x,y).find(e=>!e.closest('#profile,#sx-root,#ntb-root,#toast'));
  return hit&&el.contains(hit)?r:null; }
function pfBars(){ const de=document.documentElement, hb=pfBarRect(document.querySelector('#app .gl-main > header')), nb=pfBarRect(document.getElementById('mobile-nav')), ab=innerWidth>=1024?pfBarRect(document.querySelector('#app aside.nav-glass')):null;
  de.style.setProperty('--pfa-t',(hb?Math.max(0,Math.round(hb.bottom)):0)+'px'); de.style.setProperty('--pfa-b',(nb?Math.max(0,Math.round(innerHeight-nb.top)):0)+'px'); de.style.setProperty('--pfa-l',(ab?Math.round(ab.right):0)+'px'); }
/* grow / shrink smoothly between the sheet and full screen, even when the panel is rebuilt */
function pfxMorph(sel,fn){ const el=document.querySelector(sel), r=el&&el.getBoundingClientRect(), rad=el?getComputedStyle(el).borderRadius:''; fn(); const n=document.querySelector(sel);
  if(!r||!n||matchMedia('(prefers-reduced-motion: reduce)').matches) return; const W=document.documentElement.clientWidth, H=document.documentElement.clientHeight, s=n.style, P={top:r.top,left:r.left,bottom:H-r.bottom,right:W-r.right};
  s.setProperty('transition','none','important'); Object.keys(P).forEach(k=>s.setProperty(k,Math.round(P[k])+'px','important')); s.setProperty('border-radius',rad,'important'); void n.offsetWidth;
  s.removeProperty('transition'); Object.keys(P).forEach(k=>s.removeProperty(k)); s.removeProperty('border-radius'); n.classList.remove('pfx-swap'); void n.offsetWidth; n.classList.add('pfx-swap'); }
function pfxMaxBtn(pre,max,cls){ const l=max?'Exit full screen':'Full screen'; return `<button type="button" data-act="pfx-max" data-testid="${pre}-fullscreen-toggle" aria-pressed="${max}" aria-label="${l}" title="${l}" class="pfx-max press ${cls||''}"><i data-lucide="${max?'minimize-2':'maximize-2'}"></i></button>`; }
function pfxMoreHtml(pre,sub,lock){ return `<div class="pfx-more pfp-skip"><button type="button" data-act="pfx-max" data-val="stats" data-testid="${pre}-see-stats" class="pfx-more-btn press${lock?' is-locked':''}"><span class="pfx-more-ic"><i data-lucide="${lock?'lock-keyhole':'chart-no-axes-column'}"></i></span><span class="pfx-more-tx"><b>${lock?'Sign in to see stats &amp; activity':'Stats &amp; activity'}</b><small>${lock?'The full profile is for Treesh members. It\u2019s free':sub}</small></span><i data-lucide="chevron-right"></i></button></div>`; }
function sxpGate(){ const u=_sxV&&_sxV.d&&_sxV.d.username; $("#modal2").innerHTML=modal2Wrap(`<div class="sxp-gate" data-testid="profile-guest-gate"><span class="sxp-gate-ic"><i data-lucide="lock-keyhole"></i></span><h2>See ${u?'@'+esc(u)+'\u2019s':'their'} full profile</h2><p>Create a free Treesh account or sign in to see their stats, activity, favorites and more.</p><div class="sxp-gate-btns"><button type="button" data-act="sb-auth-open" data-val="signup" data-testid="profile-gate-signup" class="sba-btn is-primary lg press"><i data-lucide="user-plus"></i>Create account</button><button type="button" data-act="sb-auth-open" data-val="signin" data-testid="profile-gate-signin" class="sba-btn lg press"><i data-lucide="log-in"></i>Sign in</button></div><button type="button" data-act="modal2-close" data-testid="profile-gate-later" class="sxp-gate-later press">Not now</button></div>`,'profile-gate-modal'); syncScrollLock(); icons(); }

/* full screen: the bars float over the profile (html.pfx-full lifts them) */
function pfxFullSync(){ document.documentElement.classList.toggle('pfx-full',!!document.querySelector('#profile-panel.is-max:not(.profile-out), #sx-root:not(.is-out) .sx-panel.is-max')); }
/* your profile */
function pfpOwnPg(){ return state.pfMax&&PFP_PAGES.some(p=>p[0]===state.pfPage)?state.pfPage:'profile'; }
function pfpDecorateOwn(){ const panel=document.getElementById('profile-panel'), sc=document.getElementById('profile-scroll'); if(!panel||!sc) return; const max=!!state.pfMax, edit=!!state.settingsEditProfile;
  panel.classList.toggle('is-max',max); if(!max) panel.classList.remove('sp-page'); pfxFullSync();
  const x=panel.querySelector(':scope > .pf-close'); if(x&&!edit&&!panel.querySelector(':scope > .pfx-max')) x.insertAdjacentHTML('afterend',pfxMaxBtn('profile',max,'pfx-own'));
  const main=sc.querySelector(':scope > .pf-main'); if(!main||edit){ delete panel.dataset.pg; icons(); return; }
  const pg=pfpOwnPg(); panel.dataset.pg=pg; if(max&&!sc.querySelector(':scope > .pfp-tabs')) main.insertAdjacentHTML('beforebegin',pfpTabsHtml(pg,'profile'));
  let st=main.querySelector(':scope > .pfp-stats'); if(!st){ main.insertAdjacentHTML('afterbegin','<div class="pfp-stats pfp-skip" data-testid="profile-stats-page"></div>'); st=main.firstElementChild; }
  ['profile-stats-row','profile-stars-card'].forEach(t=>{ const el=sc.querySelector(`.pf-panel-hero [data-testid="${t}"]`); if(el) st.appendChild(el); });
  if(!max&&!sc.querySelector(':scope > .pfx-more')) main.insertAdjacentHTML('afterend',pfxMoreHtml('profile','Starlites, plays, favorites, lyrics and more'));
  if(max){ pfpStuckWire(sc); pfpSwipe(sc,pfpOwnPg,pfpGoOwn); } pfxFullSync(); icons(); }
function pfpGoOwn(pg,dir){ const panel=document.getElementById('profile-panel'), sc=document.getElementById('profile-scroll'); if(!panel||!panel.dataset.pg||!sc||!state.pfMax) return; const was=pfpOwnPg(); if(pg===was) return;
  const y=sc.scrollTop; state.pfPage=pg; panel.dataset.pg=pg; pfpSyncTabs(panel,pg);
  const want=pfpWantTab(pg); if(want&&want!==state.profileTab){ state.profileTab=want; const tw=document.getElementById('profile-tabs'); if(tw) tw.innerHTML=profileTabsInner(); renderProfileBody(); icons(); }
  pfpKeepTop(sc,y); pfpAnim(panel,dir!=null?dir:pfpIdx(pg)-pfpIdx(was)); }
function pfxOwnMax(on,pg){ if(!state.profileOpen) return;
  pfxMorph('#profile-panel',()=>{ state.pfMax=!!on; state.pfPage=on?(pg||state.pfPage||'profile'):'profile'; const want=on&&pfpWantTab(state.pfPage); if(want) state.profileTab=want; renderProfile(); });
  const n=document.getElementById('profile-scroll'), tb=n&&n.querySelector(':scope > .pfp-tabs'); if(pg&&tb) n.scrollTop=pfpTop(n,tb); }
const _rp9zzl=renderProfile; renderProfile=function(){ if(state.profileOpen){ pfBars(); document.documentElement.classList.add('pf-open'); } const r=_rp9zzl.apply(this,arguments); try{ pfpDecorateOwn(); }catch(e){ console.warn('profile pages',e); } return r; };
const _op9zzl=openProfile; openProfile=function(tab){ const fresh=!state.profileOpen;
  if(tab==='stats'){ state.pfPage='stats'; state.pfMax=true; } else if(tab&&PFP_ACT.includes(tab)){ state.pfPage='activity'; state._pfAct=tab; state.pfMax=true; } else if(fresh){ state.pfPage='profile'; state.pfMax=false; }
  return _op9zzl.apply(this,arguments); };
const _cp9zzl=closeProfile; closeProfile=function(){ const r=_cp9zzl.apply(this,arguments); pfxFullSync(); setTimeout(()=>{ if(!state.profileOpen){ document.documentElement.classList.remove('pf-open'); state.pfMax=false; } },320); return r; };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('#profile-panel [data-act="profile-tab"]'); if(t&&PFP_ACT.includes(t.dataset.tab)) state._pfAct=t.dataset.tab; },true);

/* someone else's profile: the same sheet, full screen adds their stats and activity */
function sxpPg(){ return _sxV&&_sxV.full&&PFP_PAGES.some(p=>p[0]===_sxV.pg)?_sxV.pg:'profile'; }
function sxpTabsFor(pg){ const d=_sxV&&_sxV.d; if(!d||pg==='profile') return []; return sxTabs(d).map(t=>t[0]).filter(k=>pg==='stats'?SXP_STATS.includes(k):!SXP_STATS.includes(k)); }
function sxpDecorate(){ const r=document.getElementById('sx-root'), panel=r&&r.querySelector('.sx-panel'), sc=document.getElementById('sx-scroll'), V=_sxV; if(!panel||!sc||!V) return;
  const full=!!V.full, d=V.d; r.classList.toggle('is-max',full); panel.classList.toggle('is-max',full); if(!full) panel.classList.remove('sp-page'); pfxFullSync();
  panel.classList.toggle('dark-surface',spNorm(d&&d.data&&d.data.space).bg.type!=='theme');
  const hero=sc.querySelector(':scope > .sx-hero'), ok=!!(hero&&d&&!V.busy&&!V.err&&d.relation!=='blocked'&&!d.locked_all);
  const top=panel.querySelector('.sx-top'), back=top&&top.querySelector('[data-testid="user-profile-close"]');
  if(back&&!back.parentElement.classList.contains('sx-top-l')){ const l=document.createElement('span'); l.className='sx-top-l'; back.replaceWith(l); l.appendChild(back); if(ok) l.insertAdjacentHTML('beforeend',pfxMaxBtn('uprof',full,'sx-x')); }
  if(!ok){ delete panel.dataset.pg; icons(); return; }
  const pg=sxpPg(); panel.dataset.pg=pg; hero.insertAdjacentHTML('afterend',(full?pfpTabsHtml(pg,'uprof'):'')+'<div class="pfp-stats" data-testid="uprof-stats-page"></div>');
  const st=sc.querySelector(':scope > .pfp-stats'), stats=hero.querySelector('[data-testid="uprof-stats"]'); if(stats) st.appendChild(stats);
  if(!sc.querySelector(':scope > .sp-secs')) st.insertAdjacentHTML('afterend',`<div class="pfp-empty" data-testid="uprof-profile-empty"><i data-lucide="sparkles"></i><p>@${esc(d.username)} hasn\u2019t added anything to their profile yet.</p></div>`);
  const list=sxpTabsFor(pg); panel.classList.toggle('pfp-none',pg!=='profile'&&!list.length);
  if(pg!=='profile'&&!list.length) st.insertAdjacentHTML('afterend',`<div class="pfp-empty is-none" data-testid="uprof-page-empty"><i data-lucide="eye-off"></i><p>Nothing shared here yet.</p></div>`);
  if(!full&&(!sbUser()||sxTabs(d).length||st.childElementCount)) sc.insertAdjacentHTML('beforeend',pfxMoreHtml('uprof','Their top songs, badges, favorites and more',!sbUser()));
  if(full){ pfpStuckWire(sc); pfpSwipe(sc,sxpPg,sxpGo); } pfxFullSync(); icons(); }
function sxpGo(pg,dir){ const V=_sxV; if(!V||!V.full) return; const was=sxpPg(); if(pg===was) return; const sc=document.getElementById('sx-scroll'), y=sc?sc.scrollTop:0;
  V.pg=pg; const list=sxpTabsFor(pg); if(list.length&&!list.includes(V.tab)) V.tab=list[0]; sxRender();
  const n=document.getElementById('sx-scroll'); if(n){ n.scrollTop=y; pfpKeepTop(n,y); } pfpAnim(document.querySelector('#sx-root .sx-panel'),dir!=null?dir:pfpIdx(pg)-pfpIdx(was)); }
function sxpFull(on,pg){ const V=_sxV; if(!V) return; const sc=document.getElementById('sx-scroll'), y=sc?sc.scrollTop:0;
  pfxMorph('#sx-root .sx-panel',()=>{ V.full=!!on; V.pg=on?(pg||'profile'):'profile'; const list=sxpTabsFor(V.pg); if(list.length&&!list.includes(V.tab)) V.tab=list[0]; sxRender(); });
  const n=document.getElementById('sx-scroll'), tb=n&&n.querySelector(':scope > .pfp-tabs'); if(n) n.scrollTop=pg&&tb?pfpTop(n,tb):y; }
/* signing in from the gate brings you straight back to that profile (also across the reload after sign-in) */
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('.sxp-gate [data-act="sb-auth-open"]'), u=_sxV&&_sxV.d&&_sxV.d.username; if(t&&u) try{ sessionStorage.setItem('treesh_pf_after_auth',u); }catch(x){} },true);
const _sbIn9zzl=sbSignedIn; sbSignedIn=async function(){ const r=await _sbIn9zzl.apply(this,arguments); let u=''; try{ u=sessionStorage.getItem('treesh_pf_after_auth')||''; if(u) sessionStorage.removeItem('treesh_pf_after_auth'); }catch(x){} if(u&&sbUser()) setTimeout(()=>sxOpenProfile(u),450); return r; };
const _sxR9zzl=sxRender; sxRender=function(){ pfBars(); const r=_sxR9zzl.apply(this,arguments); try{ sxpDecorate(); sxApplyCustom(); }catch(e){ console.warn('profile view',e); } return r; };

document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a==='modal2-close'&&t.closest('.sxp-gate')){ closeModal2(); return; }
  if(a==='pfp-go'){ e.preventDefault(); e.stopImmediatePropagation(); if(t.closest('#sx-root')) sxpGo(t.dataset.val); else pfpGoOwn(t.dataset.val); return; }
  if(a==='pfx-max'){ e.preventDefault(); e.stopImmediatePropagation(); const pg=t.dataset.val||''; if(t.closest('#sx-root')){ if(!sbUser()&&!(_sxV&&_sxV.full)) sxpGate(); else sxpFull(pg?true:!(_sxV&&_sxV.full),pg); } else pfxOwnMax(pg?true:!state.pfMax,pg); return; }
  /* the bars stay usable: using them leaves the profile */
  if(!(_sxV||state.profileOpen)||!t.closest('#mobile-nav, #app aside.nav-glass, #app .gl-main > header')) return; const own=state.profileOpen; if(_sxV) sxClose();
  if(a==='open-profile'){ if(own){ e.preventDefault(); e.stopImmediatePropagation(); closeProfile(); } return; }
  if(own) closeProfile(); },true);
addEventListener('resize',()=>{ if(state.profileOpen||_sxV) pfBars(); },{passive:true});

/* Magic Markup on your profile is public: page containers added here don't shift markup paths, edits publish, visitors get the full styling */
const _mkdKids9zzl=mkdKids; mkdKids=function(n){ return _mkdKids9zzl(n).filter(c=>!c.classList||!c.classList.contains('pfp-skip')); };
const _mkdCommit9zzl=mkdCommit; mkdCommit=function(){ const r=_mkdCommit9zzl.apply(this,arguments); try{ if(_mkd.prof) sxPublishSoon(); }catch(e){} return r; };
const _mkdOff9zzl=mkdOff; mkdOff=function(){ const was=_mkd.prof; const r=_mkdOff9zzl.apply(this,arguments); try{ if(was) sxPublishSoon(true); }catch(e){} return r; };
const _sxSnap9zzl=sxSnapshot; sxSnapshot=function(){ const s=_sxSnap9zzl.apply(this,arguments); try{ const D=(mkS().pages||{}).profile, deep={}; if(D&&D.deep) Object.keys(D.deep).filter(k=>k.indexOf('T:')===0).slice(0,120).forEach(k=>{ deep[k]=D.deep[k]; }); s.custom={deep}; }catch(e){} return s; };
sxApplyCustom=function(){ const d=_sxV&&_sxV.d, deep=d&&d.data&&d.data.custom&&d.data.custom.deep; const root=document.getElementById('sx-scroll'); if(!deep||!root) return;
  Object.keys(deep).forEach(k=>{ const m=/^T:(.+):(\d+)((?:\/\d+)*)$/.exec(k); if(!m) return; const mapped=SX_MAP[m[1]], tid=mapped||m[1]; if(mapped&&(m[2]!=='0'||m[3])) return;
    let el=root.querySelectorAll('[data-testid="'+CSS.escape(tid)+'"]')[+m[2]]; if(!el) return;
    for(const i of (m[3]?m[3].slice(1).split('/').map(Number):[])){ el=mkdKids(el)[i]; if(!el) return; }
    const c=Object.assign({},deep[k]); if(c.txt!=null&&tid!=='uprof-bio'&&mapped) delete c.txt; try{ mkdApplyEl(el,c,false); }catch(e){} }); };

const _sxc9zzl=sxClose; sxClose=function(){ const r=_sxc9zzl.apply(this,arguments); pfxFullSync(); return r; };
