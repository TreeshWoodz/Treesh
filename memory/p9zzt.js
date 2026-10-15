/* ---------- P9zzt: Moderation > All users. Every account (active, inactive, new, old, setup not finished) with filters + sorts ---------- */
const ADU_F=[['all','All','users'],['active','Active','activity'],['inactive','Inactive','moon'],['new','New','sparkles'],['setup','Setup not finished','user-x'],['banned','Banned','ban'],['muted','Muted','volume-x'],['verified','Verified','badge-check'],['staff','Staff','shield']];
const ADU_S=[['new','Newest'],['old','Oldest'],['seen','Last active'],['az','A\u2013Z']];
const ADU_PAGE=50, ADU_DAY=864e5;
ADM_SECS.splice(2,0,['users','All users','users']);
function aduNew(){ const s=LS.get('treesh_adu_sort','new'); return {f:'all',s:ADU_S.some(x=>x[0]===s)?s:'new',t:'',rows:null,total:0,counts:null,allN:null,busy:false,err:null,seq:0}; }
function aduU(){ const A=_adm; return A?(A.u||(A.u=aduNew())):null; }
async function aduLoad(more){ const A=_adm, U=aduU(); if(!U) return; const seq=++U.seq; U.err=null; U.busy=true; admPaint();
  try{ const r=await sxRpc('staff_users',{filt:U.f,sort_by:U.s,q:U.t.trim(),lim:ADU_PAGE,skip:more?(U.rows||[]).length:0}); if(_adm!==A||seq!==U.seq) return;
    const rows=(r&&r.rows)||[]; U.rows=more?(U.rows||[]).concat(rows):rows; U.total=(r&&r.total)||0; U.counts=(r&&r.counts)||null; if(!U.t.trim()&&U.counts) U.allN=U.counts.all; }
  catch(e){ if(_adm===A&&seq===U.seq) U.err=e; }
  if(_adm===A&&seq===U.seq){ U.busy=false; admPaint(); } }
function aduWhen(ts,opt){ const t=Date.parse(ts); return t?new Date(t).toLocaleDateString(undefined,opt||{month:'short',day:'numeric',year:'numeric'}):''; }
function aduSeen(u){ const t=Date.parse(u.last_seen)||0; if(!t) return ['Never seen',false]; const on=t>Date.now()-30*ADU_DAY; return [(on?'Active ':'Last seen ')+swAgo(t),on]; }
function aduPills(u){ const R=MQ_ROLE[u.role]||MQ_ROLE.user, P=(c,ic,l,k)=>`<span class="adm-pill ${c}" data-testid="adu-pill-${k}"><i data-lucide="${ic}"></i>${l}</span>`;
  return [!u.username?P('is-mute','user-x','Setup not finished','setup'):'',u.banned_until?P('is-rose','ban','Banned','banned'):'',u.muted_until?P('is-amber','volume-x','Muted','muted'):'',u.role!=='user'?P(R[2],R[1],R[0],'role'):'',u.verified?P('is-sky','badge-check','Verified','verified'):'',(Date.parse(u.created_at)||0)>Date.now()-7*ADU_DAY?P('is-gold','sparkles','New','new'):'',!u.confirmed?P('is-mute','mail-question','Email not confirmed','unconfirmed'):''].join(''); }
function aduRow(u,i){ const A=_adm, on=A.sel===(u.username||'#'+u.id), sn=aduSeen(u), pills=aduPills(u), k=esc(u.username||u.id), nm=u.display_name||u.username||u.email||'New account';
  return `<div class="adm-row adu-row${on?' on':''}" style="--d:${Math.min(i%ADU_PAGE,10)*25}ms" data-testid="adu-row-${k}"><button type="button" data-act="adu-open" data-u="${esc(u.username||'')}" data-id="${esc(u.id)}" class="adm-row-main press">${sxAv(u.username?u:{display_name:u.email||'?'},'adu-av')}<span class="min-w-0 flex-1"><b class="sx-nm"><span class="clamp-1">${esc(nm)}</span>${u.username?sxNameBadges(u,false,'adu-'+i):''}</b>
    <small class="clamp-1">${u.username?'@'+esc(u.username):'No @username yet'}${u.email?` \u00b7 <span data-testid="adu-email-${k}">${esc(u.email)}</span>`:''}</small>
    <span class="adu-meta"><span class="adu-seen${sn[1]?' is-on':''}" data-testid="adu-seen-${k}"><i></i>${esc(sn[0])}</span>${u.created_at?`<span><i data-lucide="calendar-plus"></i>Joined ${esc(aduWhen(u.created_at))}</span>`:''}</span>${pills?`<span class="adu-pills">${pills}</span>`:''}</span></button><i data-lucide="chevron-right" class="adm-chev"></i></div>`; }
function aduListHtml(U){ const busy=U.busy?' disabled':'', any=U.f!=='all'||U.t.trim();
  if(U.err&&!U.rows) return sxEmpty('triangle-alert','Couldn\u2019t load accounts',esc(sxErr(U.err)),`<button type="button" data-act="adu-retry" data-testid="adu-retry" class="sba-btn press mt-4"><i data-lucide="refresh-cw"></i>Try again</button>`);
  if(!U.rows) return `<div class="sx-load" data-testid="adu-loading"><span class="sx-spin"></span><p>Loading everyone\u2026</p></div>`;
  const clear=any?` \u00b7 <button type="button" data-act="adu-reset" data-testid="adu-filter-reset" class="adm-link press">Clear filters</button>`:'';
  if(!U.rows.length) return `<p class="adm-count" data-testid="adu-count">No accounts${clear}</p>`+sxEmpty('users','No one here',any?'Try another filter or clear the text box.':'No one has signed up yet.');
  return `<p class="adm-count" data-testid="adu-count">Showing ${U.rows.length} of ${U.total}${clear}</p><div data-testid="adu-list">${U.rows.map(aduRow).join('')}</div>`
    +(U.rows.length<U.total?`<button type="button" data-act="adu-more" data-testid="adu-load-more" class="adm-qbtn adu-more press"${busy}>${U.busy?'<span class="sx-spin"></span>Loading\u2026':`<i data-lucide="chevrons-down"></i>Load ${Math.min(ADU_PAGE,U.total-U.rows.length)} more`}</button>`:''); }
function aduHtml(){ const U=aduU(), C=U.counts||{}, adm=stRole()==='admin';
  const chips=ADU_F.map(([k,l,ic])=>`<button type="button" data-act="adu-f" data-val="${k}" aria-pressed="${U.f===k}" data-testid="adu-filter-${k}" class="adm-chip press${U.f===k?' on':''}"><i data-lucide="${ic}"></i>${l}${C[k]!=null?`<b data-testid="adu-filter-${k}-count">${C[k]}</b>`:''}</button>`).join('');
  const sort=`<label class="adu-sort"><i data-lucide="arrow-down-up"></i><select id="adu-s" class="adm-sel" aria-label="Sort" data-testid="adu-sort">${ADU_S.map(([k,l])=>`<option value="${k}"${U.s===k?' selected':''}>${l}</option>`).join('')}</select></label>`;
  const box=`<label class="adm-fin"><i data-lucide="filter"></i><input id="adu-t" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(U.t)}" placeholder="${adm?'Narrow by @username, name or email':'Narrow by @username or name'}" data-testid="adu-filter-text"></label>`;
  return admHead(`All users${U.allN!=null?` <span class="adm-h-n" data-testid="adu-total">${U.allN}</span>`:''}`,`Every account on Treesh, newest first by default. Active means seen in the last 30 days.${adm?'':' Only admins can see emails.'}`)
    +`<div class="adm-fbar" data-testid="adu-filter-bar"><div class="adm-chips no-scrollbar" role="group" aria-label="Show" data-testid="adu-filters">${chips}</div><div class="adm-frow">${box}${sort}</div></div><div class="adu-wrap${U.busy&&U.rows?' is-busy':''}" data-testid="adu-wrap">${aduListHtml(U)}</div>`; }

/* the account pane for people who never finished setup (no @username, so no profile to open) */
function aduRawPaint(){ const A=_adm, p=document.getElementById('adm-pane'), u=A&&A.raw; if(!p||!u) return; const adm=stRole()==='admin', sn=aduSeen(u), busy=A.rawBusy?' disabled':'';
  const fact=(ic,l,v,k)=>`<div class="adu-fact" data-testid="adu-raw-${k}"><span class="adu-fact-ic"><i data-lucide="${ic}"></i></span><span class="min-w-0"><small>${l}</small><b class="clamp-1">${esc(v)}</b></span></div>`;
  const del=!adm?`<p class="mod-lock" data-testid="adu-raw-locked"><i data-lucide="lock"></i>Only admins can delete accounts.</p>`
    :A.rawAsk?`<div class="mod-ask" data-testid="adu-raw-confirm"><span class="pm-alert-ic"><i data-lucide="triangle-alert"></i></span><h3 class="pm-title">Delete this account for good?</h3><p class="pm-desc">${esc(u.email||'This account')} is erased and can sign up again from scratch. This can\u2019t be undone.</p><div class="mod-row"><button type="button" data-act="adu-del-no" data-testid="adu-raw-cancel" class="sba-btn lg press"${busy}>Cancel</button><button type="button" data-act="adu-del-yes" data-testid="adu-raw-delete-confirm" class="sba-btn is-danger lg press"${busy}><i data-lucide="trash-2"></i>${A.rawBusy?'Deleting\u2026':'Delete forever'}</button></div></div>`
    :`<button type="button" data-act="adu-del" data-testid="adu-raw-delete" class="sba-btn is-danger lg press mq-go"><i data-lucide="trash-2"></i>Delete account</button>`;
  p.innerHTML=`<div class="adm-pane-in"><div class="adm-pane-top"><button type="button" data-act="adm-pane-close" aria-label="Back" data-testid="admin-pane-back" class="adm-ic press"><i data-lucide="${admMob()?'arrow-left':'x'}"></i></button><span class="adm-pane-t">Account</span></div>
    <div class="mod-body soft-scroll adu-raw" data-testid="adu-raw-pane"><div class="mq-hero">${sxAv({display_name:u.email||'?'},'mq-av')}<div class="min-w-0 flex-1"><h3 class="mq-name"><span class="clamp-1">${esc(u.email||'New account')}</span></h3><p class="mq-handle">No @username yet</p><div class="mq-chips">${aduPills(u)}</div></div></div>
    <div class="mq-status is-warn"><i data-lucide="user-x"></i><span><b>Setup not finished</b><small>They signed up but never picked an @username, so there\u2019s no profile to open yet.</small></span></div>
    <div class="adu-facts">${fact('mail','Email',u.email||'Only admins can see emails','email')}${fact('calendar-plus','Signed up',aduWhen(u.created_at)||'Unknown','joined')}${fact('clock','Last seen',sn[0],'seen')}${fact('mail-check','Email confirmed',u.confirmed?'Yes':'Not yet','confirmed')}</div>
    <section class="mq-panel">${del}</section></div></div>`;
  if(!p.classList.contains('is-open')) requestAnimationFrame(()=>p.classList.add('is-open')); icons(); }
function aduOpen(t){ const A=_adm; if(!A) return; if(t.dataset.u){ A.raw=null; admSelect(t.dataset.u); return; }
  const u=((A.u&&A.u.rows)||[]).find(x=>x.id===t.dataset.id); if(!u) return; A.sel='#'+u.id; A.selD=null; A.selErr=null; A.raw=u; A.rawAsk=false; A.rawBusy=false; aduRawPaint(); admPaint(); }
async function aduDel(){ const A=_adm, u=A&&A.raw; if(!u||A.rawBusy) return; A.rawBusy=true; aduRawPaint();
  try{ await modClean(u.id,'avatars'); await modClean(u.id,'treesh-data'); await sxRpc('staff_delete_user',{target:u.id}); if(_adm!==A) return; toast('Account deleted',u.email||'That account is gone'); A.raw=null; admPaneClose(); admLoad(true); }
  catch(e){ if(_adm!==A) return; A.rawBusy=false; aduRawPaint(); toast('Couldn\u2019t delete it',sxErr(e)); } }

/* hooks into the dashboard */
const _amh9zzt=admMainHtml; admMainHtml=function(){ const A=_adm; if(A&&!A.q&&A.sec==='users') return aduHtml(); return _amh9zzt.apply(this,arguments); };
const _ap9zzt=admPaint; admPaint=function(){ const ae=document.activeElement, fi=ae&&ae.id==='adu-t'?ae:null, ss=fi?[fi.selectionStart,fi.selectionEnd]:null; const r=_ap9zzt.apply(this,arguments);
  if(fi&&!fi.isConnected){ const n=document.getElementById('adu-t'); if(n) try{ n.focus({preventScroll:true}); n.setSelectionRange(ss[0],ss[1]); }catch(e){} }
  const A=_adm, b=document.querySelector('#adm-rail [data-testid="admin-nav-users"]'); if(b&&A&&A.u&&A.u.allN!=null){ let c=b.querySelector('b'); if(!c){ c=document.createElement('b'); c.setAttribute('data-testid','admin-nav-count-users'); b.appendChild(c); } c.textContent=A.u.allN; } return r; };
const _apn9zzt=admPanePaint; admPanePaint=function(){ const A=_adm; if(A&&A.raw&&String(A.sel||'').charAt(0)==='#'){ aduRawPaint(); return; } return _apn9zzt.apply(this,arguments); };
const _as9zzt=admSelect; admSelect=function(uname){ const A=_adm; if(A&&String(uname||'').charAt(0)==='#'){ if(A.raw) aduRawPaint(); return; } return _as9zzt.apply(this,arguments); };
const _al9zzt=admLoad; admLoad=function(){ const r=_al9zzt.apply(this,arguments); if(_adm) aduLoad(); return r; };
let _aduT=0;
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t||!_adm) return; const a=t.dataset.act, U=aduU();
  if(a==='adu-open'){ aduOpen(t); return; }
  if(a==='adu-f'){ if(U.f===t.dataset.val) return; U.f=t.dataset.val; aduLoad(); return; }
  if(a==='adu-more'){ aduLoad(true); return; }
  if(a==='adu-retry'){ aduLoad(); return; }
  if(a==='adu-reset'){ U.f='all'; U.t=''; aduLoad(); return; }
  if(a==='adu-del'){ _adm.rawAsk=true; aduRawPaint(); return; }
  if(a==='adu-del-no'){ _adm.rawAsk=false; aduRawPaint(); return; }
  if(a==='adu-del-yes'){ aduDel(); return; }
  if(a==='adm-pane-close') _adm.raw=null; });
document.addEventListener('input',e=>{ if(!_adm||!e.target||e.target.id!=='adu-t') return; const U=aduU(); U.t=e.target.value; clearTimeout(_aduT); _aduT=setTimeout(()=>{ if(_adm) aduLoad(); },260); });
document.addEventListener('change',e=>{ if(!_adm||!e.target||e.target.id!=='adu-s') return; const U=aduU(); U.s=e.target.value; LS.set('treesh_adu_sort',U.s); aduLoad(); });
