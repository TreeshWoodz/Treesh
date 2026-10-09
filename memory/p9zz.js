/* ---------- P9zz: Space restore safety net, profile edits sync only on Save, missing birthday, search closes profile, new Moderation dashboard + sheet ---------- */

/* ===== signing in: your profile, Space, banner and background always come back ===== */
const SB_FIRST=['treesh_profile','treesh_bday_edits','treesh_social','treesh_nav_pf_name'];
const SP_DEF=JSON.stringify(spNorm({}));
const spIsDefault=s=>!s||JSON.stringify(spNorm(s))===SP_DEF;
async function spFetchData(url){ try{ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) return null; const b=await r.blob(); if(!b.size||b.size>8*1024*1024||(b.type&&!/^image\//.test(b.type))) return null;
  return await new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(b); }); }catch(e){ return null; } }
function pfMergeCloud(cloud){ const cur=state.profile||LS.get('treesh_profile',null)||{}, p=Object.assign({},cur); let ch=false;
  ['birthday','zodiac','joined','talents','favs'].forEach(k=>{ if((p[k]==null||p[k]==='')&&cloud[k]!=null&&cloud[k]!==''){ p[k]=cloud[k]; ch=true; } });
  if(spIsDefault(p.space)&&!spIsDefault(cloud.space)){ p.space=cloud.space; ch=true; }
  if(ch){ state.profile=p; try{ sbQuietSet('treesh_profile',p); }catch(e){} } return ch; }
async function spHeal(){ const u=sbUser(); if(!sb||!u) return false; let row=null;
  try{ const r=await sb.from('profiles').select('public_data,banner_url').eq('id',u.id).maybeSingle(); row=r&&r.data; }catch(e){} if(!row) return false;
  const pub=(row.public_data&&row.public_data.space)||null, p=Object.assign({},state.profile||{}); let ch=false, bgUrl=pub&&pub.bg&&pub.bg.type==='image'?pub.bg.img||'':'';
  if(pub&&spIsDefault(p.space)&&!spIsDefault(pub)){ p.space=JSON.parse(JSON.stringify(pub)); if(bgUrl) p.space.bg=Object.assign({},pub.bg,{local:true,img:''}); state.profile=p; sbQuietSet('treesh_profile',p); ch=true; }
  const S=spNorm(p.space);
  if(S.bg.local&&S.bg.type==='image'&&bgUrl){ let have=null; try{ have=await assetGet('space_bg'); }catch(e){} if(!have){ const d=await spFetchData(bgUrl); if(d){ try{ await assetPut('space_bg',d); state.spaceBg=d; ch=true; }catch(e){} } } }
  if(row.banner_url){ let hb=null; try{ hb=await assetGet('profile_banner'); }catch(e){} if(!hb){ const d=await spFetchData(row.banner_url); if(d){ try{ await assetPut('profile_banner',d); state.profileBanner=d; ch=true; }catch(e){} } } }
  return ch; }
async function spAssetsRefresh(){ try{ state.profileBanner=(await assetGet('profile_banner'))||''; }catch(e){} try{ state.spaceBg=(await assetGet('space_bg'))||''; }catch(e){} }
const _sbRes9zz=sbRestore; sbRestore=async function(b){ let cloudP=null;
  if(b&&b.localStorage&&typeof b.localStorage==='object'){ const src=b.localStorage, pri=k=>{ const i=SB_FIRST.indexOf(k); return i<0?99:i; }, o={};
    Object.keys(src).sort((x,y)=>(pri(x)-pri(y))||(String(src[x]||'').length-String(src[y]||'').length)).forEach(k=>{ o[k]=src[k]; });
    b=Object.assign({},b,{localStorage:o}); try{ cloudP=JSON.parse(src.treesh_profile||'null'); }catch(e){} }
  let ch=await _sbRes9zz.call(this,b);
  try{ if(cloudP&&typeof cloudP==='object'&&pfMergeCloud(cloudP)) ch=true; }catch(e){}
  try{ if(await Promise.race([spHeal(),new Promise(r=>setTimeout(()=>r(false),9000))])) ch=true; }catch(e){ console.warn('space heal',e); }
  await spAssetsRefresh(); return ch; };
/* never publish before your banner and Space background have loaded from this device */
let _spAR=null;
function spAssetsReady(){ return _spAR||(_spAR=Promise.all([assetGet('profile_banner').then(v=>{ if(v&&!state.profileBanner) state.profileBanner=v; }).catch(()=>{}),assetGet('space_bg').then(v=>{ if(v&&!state.spaceBg) state.spaceBg=v; }).catch(()=>{})])); }

/* ===== editing your profile: nothing leaves the device until you tap Save ===== */
const _pfHold={push:false,pub:false,t:0}; let _pfSnap=null;
function pfEditing(){ return !!state.settingsEditProfile&&!!document.getElementById('set-nick'); }
function pfHoldWatch(){ if(_pfHold.t) return; _pfHold.t=setInterval(()=>{ if(!pfEditing()) pfHoldRelease(false); },2500); }
function pfHoldRelease(now){ const P=_pfHold.push, Q=_pfHold.pub; _pfHold.push=_pfHold.pub=false; if(_pfHold.t){ clearInterval(_pfHold.t); _pfHold.t=0; }
  if(now){ try{ sbQueuePush(true); }catch(e){} return; } if(P) try{ sbSchedule(false); }catch(e){} if(Q) try{ sxPublishSoon(); }catch(e){} }
const _sbPush9zz=sbPush; sbPush=async function(){ if(pfEditing()&&!_sbOut){ _pfHold.push=true; _sbDirty=true; sbMeta({pending:true}); pfHoldWatch(); return; } return _sbPush9zz.apply(this,arguments); };
const _sxPub9zz=sxPublish; sxPublish=async function(){ if(pfEditing()&&!_sbOut){ _pfHold.pub=true; pfHoldWatch(); return; } await spAssetsReady(); return _sxPub9zz.apply(this,arguments); };
function pfSnapTake(){ const p=state.profile||{}; _pfSnap={banner:state.profileBanner||'',talents:JSON.stringify(p.talents||null),favs:JSON.stringify(p.favs||null)}; }
async function pfSnapRevert(){ const S=_pfSnap; _pfSnap=null; if(!S) return; let ch=false;
  if((state.profileBanner||'')!==S.banner){ try{ if(S.banner) await assetPut('profile_banner',S.banner); else await assetDel('profile_banner'); }catch(e){} state.profileBanner=S.banner; ch=true; }
  const p=state.profile||{}; if(JSON.stringify(p.talents||null)!==S.talents||JSON.stringify(p.favs||null)!==S.favs){ const q=Object.assign({},p,{talents:JSON.parse(S.talents),favs:JSON.parse(S.favs)}); state.profile=q; LS.set('treesh_profile',q); ch=true; }
  if(ch) setTimeout(()=>{ try{ pfRerender(); }catch(e){} },30); }
(function(){ let v=!!state.settingsEditProfile; Object.defineProperty(state,'settingsEditProfile',{configurable:true,enumerable:true,get(){ return v; },set(x){ x=!!x; if(x&&!v) pfSnapTake(); v=x; }}); })();
const _toast9zz=toast; toast=function(t){ if(pfEditing()&&(t==='Banner updated'||t==='Banner removed')) return _toast9zz.call(this,t==='Banner updated'?'Banner ready':'Banner removed','Tap Save to keep it'); return _toast9zz.apply(this,arguments); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a==='save-profile'){ setTimeout(()=>{ if(!state.settingsEditProfile){ _pfSnap=null; pfHoldRelease(true); } },0); }
  else if(a==='settings-edit-profile'&&t.dataset.val!=='on'&&state.settingsEditProfile){ pfSnapRevert(); setTimeout(()=>pfHoldRelease(false),0); } },true);

/* ===== birthday: a missing one can always be added ===== */
bdayLocked=function(){ return bdayEditCount()>=2&&!!(state.profile&&state.profile.birthday); };
const _sph9zz=settingsProfileHtml; settingsProfileHtml=function(editing){ let h=_sph9zz.apply(this,arguments); if(state.profile&&state.profile.birthday) return h;
  if(editing) return h.replace(/<p class="mt-1\.5 text-\[11px\] text-white\/40">Heads up:[^<]*<\/p>/,'<p class="pf-bd-miss" data-testid="profile-birthday-missing-note"><i data-lucide="cake"></i>No birthday on your profile. Add it for your zodiac and birthday surprise, then tap Save.</p>');
  return h.replace('<div class="tl-row">','<div class="tl-row"><button type="button" data-act="pf-add-bday" data-testid="profile-add-birthday" class="bd-chip is-add press"><i data-lucide="cake"></i>Add your birthday</button>'); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="pf-add-bday"]'); if(!t) return;
  state.settingsEditProfile=true; state._pfDraft=null; if(!state.profileOpen) openProfile(); else pfRerender();
  setTimeout(()=>{ const i=document.getElementById('set-bday'); if(i){ i.scrollIntoView({block:'center',behavior:'smooth'}); try{ i.focus({preventScroll:true}); }catch(_){} } },380); });

/* ===== opening search never hides behind your profile ===== */
function pfOutOfWay(){ if(state.profileOpen){ try{ closeProfile(); }catch(e){} } const r=document.getElementById('sx-root'); if(r&&!r.classList.contains('is-out')){ try{ sxClose(); }catch(e){} } }
const _os9zz=openSearch; openSearch=function(){ pfOutOfWay(); return _os9zz.apply(this,arguments); };
const _sxFP9zz=sxFindPeople; sxFindPeople=function(){ pfOutOfWay(); return _sxFP9zz.apply(this,arguments); };

/* ===== moderation: one person (sheet from their profile, or the pane inside the dashboard) ===== */
let _adm=null, _modHost='sheet';
function modT(){ return _modHost==='dash'?((_adm&&_adm.selD)||null):((_sxV&&_sxV.d)||null); }
function admRoleOf(d){ return (d&&d.role)||'user'; }
const MQ_ROLE={user:['Member','user-round','is-mute'],moderator:['Moderator','shield','is-violet'],admin:['Admin','shield-check','is-sky']};
function mqDefaultTab(d){ const M=(d&&d.mod)||{}; if(M.banned_until) return 'ban'; if(M.muted_until) return 'mute'; return modCan('ban')?'ban':'mute'; }
const _modOpen9zz=modOpen; modOpen=function(){ if(_modHost==='dash'&&_adm) _adm.mod=_mod; _modHost='sheet'; const r=_modOpen9zz.apply(this,arguments); _sheetMod=_mod; return r; };
modHtml=function(){ const d=modT(); if(!d) return ''; const M=d.mod||{}, L=M.live||{}, nm=d.display_name||d.username, role=admRoleOf(d), R=MQ_ROLE[role]||MQ_ROLE.user, busy=_mod.busy?' disabled':'';
  if(!_mod.tab||_mod.tab==='status') _mod.tab=mqDefaultTab(d); const t=_mod.tab, pane=_modHost==='dash';
  const lock=txt=>`<p class="mod-lock" data-testid="mod-locked-note"><i data-lucide="lock"></i>${txt}</p>`, notAdm=d.role==='admin'?'Moderators can\u2019t act on admins.':'';
  const chips=[M.banned_until?`<span class="adm-pill is-rose" data-testid="mod-chip-banned"><i data-lucide="ban"></i>Banned</span>`:'',M.muted_until?`<span class="adm-pill is-amber" data-testid="mod-chip-muted"><i data-lucide="volume-x"></i>Muted</span>`:'',d.verified?`<span class="adm-pill is-sky" data-testid="mod-chip-verified"><i data-lucide="badge-check"></i>Verified</span>`:'',`<span class="adm-pill ${R[2]}" data-testid="mod-chip-role"><i data-lucide="${R[1]}"></i>${R[0]}</span>`].join('');
  const joined=d.created_at?new Date(d.created_at).toLocaleDateString(undefined,{month:'short',year:'numeric'}):'';
  const status=M.banned_until?`<div class="mq-status is-err" data-testid="mod-status-card"><i data-lucide="ban"></i><span><b>Banned ${esc(stUntil(M.banned_until))}</b><small>${M.ban_reason?esc(M.ban_reason):'No reason given'}</small></span>${modCan('ban')?`<button type="button" data-act="mod-unban" data-testid="mod-unban" class="sba-btn press"${busy}>Lift ban</button>`:''}</div>`
    :M.muted_until?`<div class="mq-status is-warn" data-testid="mod-status-card"><i data-lucide="volume-x"></i><span><b>Muted ${esc(stUntil(M.muted_until))}</b><small>${M.mute_reason?esc(M.mute_reason):'Profile changes stay private until it ends'}</small></span>${modCan('mute')?`<button type="button" data-act="mod-unmute" data-testid="mod-unmute" class="sba-btn press"${busy}>Unmute</button>`:''}</div>`
    :`<div class="mq-status is-ok" data-testid="mod-status-card"><i data-lucide="shield-check"></i><span><b>In good standing</b><small>No ban or mute${joined?' \u00b7 Joined '+esc(joined):''}</small></span></div>`;
  const T=[['ban','Ban','ban','is-rose',modCan('ban'),M.banned_until?'Active':'Sign-in block'],['mute','Mute','volume-x','is-amber',modCan('mute'),M.muted_until?'Active':'Freeze profile'],['profile','Profile','user-pen','is-violet',modCan('edit'),'Name, bio, photos'],['badges','Verified','badge-check','is-sky',modCan('verify'),d.verified?'On':'Off'],['role','Role','shield','is-cyan',modCan('role'),R[0]],['danger','Delete','trash-2','is-rose',modCan('delete'),'Erase account']];
  const grid=`<div class="mq-grid" role="tablist" aria-label="Actions" data-testid="mod-quick-actions">${T.map(([k,l,ic,c,ok,s],i)=>`<button type="button" role="tab" aria-selected="${t===k}" data-act="mod-tab" data-val="${k}" data-testid="mod-quick-action-${k}" class="mq-tile ${c} press${t===k?' on':''}${ok?'':' is-locked'}" style="--d:${i*30}ms"><span class="mq-tile-ic"><i data-lucide="${ic}"></i></span><b>${l}</b><small>${s}</small>${ok?'':'<i data-lucide="lock" class="mq-lock"></i>'}</button>`).join('')}</div>`;
  const ph=(ic,c,title,sub)=>`<div class="mq-ph"><span class="mq-tile-ic ${c}"><i data-lucide="${ic}"></i></span><span class="min-w-0"><b>${title}</b><small>${sub}</small></span></div>`;
  let panel='';
  if(t==='ban') panel=ph('ban','is-rose','Ban','Signs them out and blocks sign-in until the time you pick. Their profile shows \u201cSuspended\u201d.')+(!modCan('ban')?lock(notAdm||'Only admins can ban people.'):modDurHtml('ban')+`<button type="button" data-act="mod-ban-go" data-testid="mod-ban-submit" class="sba-btn is-danger lg press mq-go"${busy}><i data-lucide="ban"></i>${M.banned_until?'Update ban':'Ban @'+esc(d.username)}</button>`);
  else if(t==='mute') panel=ph('volume-x','is-amber','Mute','They can keep editing, but nothing they change goes public until the mute ends.')+(!modCan('mute')?lock(notAdm):modDurHtml('mute')+`<button type="button" data-act="mod-mute-go" data-testid="mod-mute-submit" class="sba-btn is-primary lg press mq-go"${busy}><i data-lucide="volume-x"></i>${M.muted_until?'Update mute':'Mute @'+esc(d.username)}</button>`);
  else if(t==='profile') panel=ph('user-pen','is-violet','Edit profile','Fix anything inappropriate. They get a notice listing what changed.')+(!modCan('edit')?lock(notAdm):(M.muted_until?`<div class="mod-note"><i data-lucide="info"></i><span>@${esc(d.username)} is muted, so people see their profile from before the mute. Your changes apply to both.</span></div>`:'')
    +`<label class="sba-f"><span>Display name</span><div class="umx-lrow"><input id="mod-name" maxlength="40" value="${esc(L.display_name||'')}" class="umx-in" data-testid="mod-name-input"><button type="button" data-act="mod-save" data-val="display_name" data-testid="mod-name-save" class="sba-btn is-primary press"${busy}>Save</button></div></label>`
    +`<label class="sba-f mt-3"><span>Username <i class="tsf-opt">3\u201320 letters, numbers, _ or .</i></span><div class="umx-lrow"><input id="mod-uname" maxlength="20" autocapitalize="none" spellcheck="false" value="${esc(L.username||'')}" class="umx-in" data-testid="mod-username-input"><button type="button" data-act="mod-save" data-val="username" data-testid="mod-username-save" class="sba-btn is-primary press"${busy}>Save</button></div></label>`
    +`<label class="sba-f mt-3"><span>Bio</span><textarea id="mod-bio" rows="3" maxlength="160" class="tsf-ta" data-testid="mod-bio-input">${esc(L.bio||'')}</textarea></label><div class="mod-row"><button type="button" data-act="mod-save" data-val="bio" data-testid="mod-bio-save" class="sba-btn is-primary press"${busy}>Save bio</button><button type="button" data-act="mod-clear-bio" data-testid="mod-bio-clear" class="sba-btn press"${busy}>Clear bio</button></div>`
    +`<div class="mq-sub"><p class="mq-lbl">Photos</p><div class="mod-pics"><div class="mod-pic"><span class="sx-av is-md">${L.avatar_url?`<img src="${esc(L.avatar_url)}" alt="">`:'<i data-lucide="user-round"></i>'}</span><button type="button" data-act="mod-rm" data-val="avatar" data-testid="mod-remove-avatar" class="sba-btn press"${L.avatar_url&&!_mod.busy?'':' disabled'}><i data-lucide="trash-2"></i>Remove photo</button></div><div class="mod-pic"><span class="mod-bn"${L.banner_url?` style="background-image:url('${esc(L.banner_url)}')"`:''}></span><button type="button" data-act="mod-rm" data-val="banner" data-testid="mod-remove-banner" class="sba-btn press"${L.banner_url&&!_mod.busy?'':' disabled'}><i data-lucide="trash-2"></i>Remove banner</button></div></div></div>`);
  else if(t==='badges'){ const ic=d.verified_icon||''; panel=ph('badge-check','is-sky','Verified','For real members of the Treesh Icons. Link their Icon page so people can find their music.')+(!modCan('verify')?lock(notAdm||'Only admins can verify people.'):`<label class="tsf-chk"><input type="checkbox" id="mod-vf" ${d.verified?'checked':''} data-testid="mod-verified-toggle"><span><b>Verified</b><small>Shows a check next to their name everywhere.</small></span></label><label class="sba-f mt-3"><span>Treesh Icon page <i class="tsf-opt">optional</i></span><select id="mod-vf-icon" class="tsf-sel" data-testid="mod-verified-icon"><option value="">No Icon link</option>${(ARTISTS||[]).slice().sort((a,b)=>String(a.name).localeCompare(b.name)).map(a=>`<option value="${esc(a.id)}"${a.id===ic?' selected':''}>${esc(a.name)}</option>`).join('')}</select></label><button type="button" data-act="mod-vf-save" data-testid="mod-verified-save" class="sba-btn is-primary lg press mq-go"${busy}><i data-lucide="check"></i>Save verification</button>`); }
  else if(t==='role') panel=ph('shield','is-cyan','Role','Admins can do everything. Moderators can mute and edit profiles, but can\u2019t ban, delete, verify or act on admins.')+(!modCan('role')?lock(notAdm||'Only admins can change roles.'):`<div class="mod-roles" role="radiogroup" aria-label="Role" data-testid="mod-role-options">${MOD_ROLES.map(([r,l,ic,s])=>{ const on=role===r; return `<button type="button" role="radio" aria-checked="${on}" data-act="mod-role" data-val="${r}" data-testid="mod-role-${r}" class="mod-role press is-${r}${on?' on':''}"${busy||(on?' disabled':'')}><span class="mod-role-ic"><i data-lucide="${ic}"></i></span><b>${l}</b><small>${s}</small>${on?'<em data-testid="mod-role-current">Current</em>':''}</button>`; }).join('')}</div>`);
  else if(t==='danger') panel=ph('trash-2','is-rose','Delete account','Deletes their account, profile, friends and synced data for good. This can\u2019t be undone.')+(!modCan('delete')?lock(d.role==='admin'?'Admins can only be removed in the Supabase SQL editor.':'Only admins can delete accounts.'):`<label class="sba-f"><span>Type <b>${esc(d.username)}</b> to confirm</span><input id="mod-del" autocapitalize="none" spellcheck="false" placeholder="${esc(d.username)}" data-testid="mod-delete-confirm-input"></label><button type="button" data-act="mod-del-go" data-testid="mod-delete-submit" class="sba-btn is-danger lg press mq-go"${busy}><i data-lucide="trash-2"></i>Delete @${esc(d.username)}</button>`);
  if(_mod.ask){ const A=_mod.ask; panel=`<div class="mod-ask" data-testid="moderation-confirm"><span class="pm-alert-ic"><i data-lucide="triangle-alert"></i></span><h3 class="pm-title" data-testid="moderation-confirm-title">${esc(A.title)}</h3><p class="pm-desc">${esc(A.desc)}</p><div class="mod-row"><button type="button" data-act="mod-ask-no" data-testid="moderation-confirm-cancel" class="sba-btn lg press">Cancel</button><button type="button" data-act="mod-ask-yes" data-testid="moderation-confirm-ok" class="sba-btn is-danger lg press">${esc(A.ok)}</button></div></div>`; }
  const close=pane?'':`<button type="button" data-act="modal2-close" aria-label="Close" data-testid="moderation-close" class="tsf-x press"><i data-lucide="x"></i></button>`;
  return `<div class="mq-hero" data-testid="mod-hero">${sxAv(d,'mq-av')}<div class="min-w-0 flex-1"><h3 class="mq-name sx-nm" data-testid="mod-person-name"><span class="clamp-1">${esc(nm)}</span>${sxNameBadges(d,false,'mod')}</h3><p class="mq-handle">@${esc(d.username)}</p><div class="mq-chips">${chips}</div></div>${close}</div>
   <div class="mod-body soft-scroll" data-testid="moderation-body">${status}${grid}<section class="mq-panel" data-testid="mod-panel-${t}">${panel}</section></div>`; };
const _modPaint9zz=modPaint; modPaint=function(fresh){ if(_modHost==='dash'){ admPanePaint(); return; } return _modPaint9zz.apply(this,arguments); };
const _modReload9zz=modReload; modReload=async function(u){ if(_modHost==='dash'&&_adm){ await admSelect(u||_adm.sel,true); admLoad(true); return; } return _modReload9zz.apply(this,arguments); };
const _modAct9zz=modAct; modAct=function(a,t){ const d=modT(); if(_modHost==='dash'&&a==='mod-del-go'&&d){ const v=((document.getElementById('mod-del')||{}).value||'').trim().replace(/^@+/,'').toLowerCase(), id=d.id, u='@'+d.username;
    if(v!==d.username){ toast('Type the username to confirm',d.username); return; }
    modAsk('Delete '+u+' for good?','Their account, profile and synced data are erased. This can\u2019t be undone.','Delete forever',async()=>{ await modClean(id,'avatars'); await modClean(id,'treesh-data'); const r=await modRun('staff_delete_user',{target:id},['Account deleted',u+' is gone']); if(r){ admPaneClose(); admLoad(true); } }); return; }
  return _modAct9zz.apply(this,arguments); };

/* ===== moderation dashboard (full page) ===== */
const ADM_SECS=[['overview','Overview','layout-dashboard'],['activity','Activity','history'],['suspended','Banned','ban'],['muted','Muted','volume-x'],['staff','Staff','shield'],['verified','Verified','badge-check']];
const ADM_F=[['all','All',null],['ban','Bans',['ban','unban']],['mute','Mutes',['mute','unmute']],['edit','Edits',['edit']],['badge','Badges',['verify','unverify']],['role','Roles',['make_mod','remove_mod','make_admin','remove_admin']],['delete','Deletes',['delete']]];
const ADM_R=[['today','Today'],['7d','7 days'],['30d','30 days'],['all','All time']];
const ADM_C={ban:'is-rose',delete:'is-rose',mute:'is-amber',unban:'is-cyan',unmute:'is-cyan',edit:'is-violet',verify:'is-sky',unverify:'is-sky',make_mod:'is-cyan',remove_mod:'is-cyan',make_admin:'is-cyan',remove_admin:'is-cyan'};
const admDay0=(n)=>{ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(n||0)); return d.getTime(); };
const admTs=x=>Date.parse(x&&x.created_at)||0;
function admMob(){ return window.innerWidth<900; }
function admOpen(sec){ if(!stStaff()){ toast('Moderation is for Treesh staff'); return; } if(state.profileOpen) try{ closeProfile(true); }catch(e){} if(document.querySelector('#modal2 > *')) try{ closeModal2(); }catch(e){}
  _adm={sec:sec||'overview',lists:{},log:null,busy:true,err:null,q:'',res:null,seq:0,qseq:0,f:{a:'all',who:'',r:'all',t:''},sel:null,selD:null,selErr:null,mod:null};
  let r=document.getElementById('adm-root'); if(r) r.remove(); r=document.createElement('div'); r.id='adm-root'; r.setAttribute('role','dialog'); r.setAttribute('aria-modal','true'); r.setAttribute('aria-label','Moderation'); r.setAttribute('data-testid','admin-dashboard-overlay');
  const adm=stRole()==='admin';
  r.innerHTML=`<div class="adm-bd" data-act="adm-close"></div><div class="adm-panel dark-surface" data-testid="admin-dashboard">
   <header class="adm-top"><span class="adm-orb"><i data-lucide="gavel"></i></span><div class="adm-ttl"><h2>Moderation</h2><p><span class="adm-tag" data-testid="admin-staff-tag"><i data-lucide="shield-check"></i>Staff only</span><span class="adm-me">You\u2019re a Treesh ${adm?'admin':'moderator'}</span></p></div>
    <label class="adm-search"><i data-lucide="search"></i><input id="adm-q" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Find anyone by @username or name" data-testid="admin-quick-search-input"><kbd>Ctrl K</kbd><button type="button" data-act="adm-q-clear" aria-label="Clear search" data-testid="admin-quick-search-clear" class="adm-q-x" hidden><i data-lucide="x"></i></button></label>
    <div class="adm-acts"><button type="button" data-act="adm-refresh" aria-label="Refresh" title="Refresh" data-testid="admin-refresh-btn" class="adm-ic press"><i data-lucide="refresh-cw"></i></button><button type="button" data-act="adm-close" aria-label="Close" data-testid="admin-dashboard-close-btn" class="adm-ic press"><i data-lucide="x"></i></button></div></header>
   <div class="adm-body"><nav class="adm-rail no-scrollbar" id="adm-rail" aria-label="Sections" data-testid="admin-nav"></nav><main class="adm-main soft-scroll" id="adm-main" data-testid="admin-main"></main><aside class="adm-pane" id="adm-pane" aria-label="Person" data-testid="admin-detail-pane"></aside></div></div>`;
  document.body.appendChild(r); icons(); syncScrollLock(); admLoad(); if(!admMob()) setTimeout(()=>{ const i=document.getElementById('adm-q'); if(i) try{ i.focus({preventScroll:true}); }catch(e){} },260); }
function admClose(){ const r=document.getElementById('adm-root'); _adm=null; if(_modHost==='dash'){ _modHost='sheet'; _mod=null; } if(!r) return; r.classList.add('is-out'); setTimeout(()=>{ if(!_adm) r.remove(); syncScrollLock(); },240); }
modDashOpen=function(){ admOpen(); };
async function admLoad(quiet){ const A=_adm; if(!A) return; const seq=++A.seq; A.err=null; if(!quiet){ A.busy=true; admPaint(); }
  const kinds=['suspended','muted','staff','verified'];
  try{ const r=await Promise.all([sxRpc('staff_log',{lim:200})].concat(kinds.map(k=>sxRpc('staff_list',{kind:k})))); if(_adm!==A||seq!==A.seq) return; A.log=(r[0]||[]).slice().sort((x,y)=>admTs(y)-admTs(x)); kinds.forEach((k,i)=>{ A.lists[k]=r[i+1]||[]; }); A.at=Date.now(); }
  catch(e){ if(_adm===A&&seq===A.seq) A.err=e; }
  if(_adm===A&&seq===A.seq){ A.busy=false; admPaint(); } }
function admCounts(){ const A=_adm, L=A.lists, log=A.log||[], t0=admDay0(0), w0=admDay0(6), st=L.staff||[];
  return {banned:(L.suspended||[]).length,muted:(L.muted||[]).length,staff:st.length,admins:st.filter(u=>u.role==='admin').length,verified:(L.verified||[]).length,today:log.filter(x=>admTs(x)>=t0).length,week:log.filter(x=>admTs(x)>=w0).length}; }
function admPaint(){ const A=_adm; if(!A) return; const rail=document.getElementById('adm-rail'), main=document.getElementById('adm-main'); if(!rail||!main) return; const C=A.log?admCounts():null;
  const n={suspended:C&&C.banned,muted:C&&C.muted,staff:C&&C.staff,verified:C&&C.verified,activity:C&&C.week};
  const item=([k,l,ic])=>`<button type="button" data-act="adm-sec" data-val="${k}" data-testid="admin-nav-${k}" aria-current="${!A.q&&A.sec===k?'page':'false'}" class="adm-nav press${!A.q&&A.sec===k?' on':''}"><i data-lucide="${ic}"></i><span class="adm-nl">${l}</span>${n[k]!=null&&n[k]!==false?`<b data-testid="admin-nav-count-${k}">${n[k]}</b>`:''}</button>`;
  const rh=ADM_SECS.slice(0,2).map(item).join('')+`<p class="adm-rail-h">People</p>`+ADM_SECS.slice(2).map(item).join('');
  if(rail._h!==rh){ rail._h=rh; rail.innerHTML=rh; }
  const mh=admMainHtml(); if(main._h!==mh){ const keep=main._sec===(A.q?'q':A.sec); main._h=mh; main._sec=A.q?'q':A.sec; main.innerHTML=mh; if(!keep) main.scrollTop=0; }
  icons(); }
function admMainHtml(){ const A=_adm;
  if(A.q) return admSearchHtml();
  if(A.err&&!A.log) return sxEmpty('triangle-alert','Couldn\u2019t load moderation',esc(sxErr(A.err)),`<button type="button" data-act="adm-refresh" data-testid="admin-retry" class="sba-btn press mt-4"><i data-lucide="refresh-cw"></i>Try again</button>`);
  if(!A.log) return `<div class="sx-load" data-testid="admin-loading"><span class="sx-spin"></span><p>Loading\u2026</p></div>`;
  if(A.sec==='overview') return admOverviewHtml(); if(A.sec==='activity') return admActivityHtml(); return admPeopleHtml(A.sec); }
function admHead(title,sub,extra){ return `<div class="adm-h"><div class="min-w-0"><h3>${title}</h3>${sub?`<p>${sub}</p>`:''}</div>${extra||''}</div>`; }
function admLogRow(x,i){ const A=MOD_ACT[x.action]||['circle-dot',x.action], who=x.target_username||x.target_name, det=x.detail||{};
  const extra=x.action==='ban'||x.action==='mute'?(det.until?esc(stUntil(det.until)):'')+(det.reason?' \u00b7 '+esc(det.reason):''):x.action==='edit'?Object.keys(det).map(k=>k.replace('_',' ')).join(', '):(x.action==='verify'&&det.icon&&stIcon(det.icon)?'Icon \u00b7 '+esc(stIcon(det.icon).name):'');
  const ts=admTs(x), tm=ts?new Date(ts).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}):'';
  return `<button type="button" data-act="adm-open" data-u="${esc(x.target_username||'')}" class="adm-log press" data-testid="admin-log-row-${i}" style="--d:${Math.min(i,10)*25}ms"${x.target_username?'':' disabled'}><span class="adm-log-ic ${ADM_C[x.action]||'is-violet'}"><i data-lucide="${A[0]}"></i></span><span class="min-w-0 flex-1"><span class="adm-log-t clamp-2"><b>@${esc(x.actor_username||'staff')}</b> ${A[1]} <b>${who?'@'+esc(who):'an account'}</b></span>${extra?`<small class="clamp-1">${extra}</small>`:''}</span><time title="${esc(ts?new Date(ts).toLocaleString():'')}">${esc(tm)}</time></button>`; }
function admDayLabel(ts){ if(ts>=admDay0(0)) return 'Today'; if(ts>=admDay0(1)) return 'Yesterday'; return new Date(ts).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}); }
function admGrouped(L){ let out='', last=''; L.forEach((x,i)=>{ const lb=admDayLabel(admTs(x)); if(lb!==last){ last=lb; out+=`<p class="adm-day" data-testid="admin-log-day">${esc(lb)}</p>`; } out+=admLogRow(x,i); }); return out; }
function admOverviewHtml(){ const A=_adm, C=admCounts(), L=A.lists;
  const tile=(k,sec,ic,c,label,n,sub,i)=>`<button type="button" data-act="adm-sec" data-val="${sec}" data-testid="stat-tile-${k}" class="adm-stat ${c} press" style="--d:${i*45}ms"><span class="adm-stat-ic"><i data-lucide="${ic}"></i></span><span class="adm-stat-n" data-testid="stat-tile-${k}-value">${n}</span><span class="adm-stat-l">${label}</span><span class="adm-stat-s">${sub}</span></button>`;
  const cap=(A.log||[]).length>=200?'+':'';
  const tiles=`<div class="adm-stats" data-testid="admin-stats">${[
    tile('banned','suspended','ban','is-rose','Banned now',C.banned,C.banned?'Tap to review':'No one',0),
    tile('muted','muted','volume-x','is-amber','Muted now',C.muted,C.muted?'Profiles frozen':'No one',1),
    tile('staff','staff','shield','is-cyan','Staff team',C.staff,C.admins+' admin'+(C.admins===1?'':'s')+' \u00b7 '+(C.staff-C.admins)+' mod'+(C.staff-C.admins===1?'':'s'),2),
    tile('verified','verified','badge-check','is-sky','Verified',C.verified,'Treesh Icons',3),
    tile('today','activity','zap','is-gold','Actions today',C.today,C.today?'Latest '+swAgo(admTs(A.log[0])):'Quiet so far',4),
    tile('week','activity','activity','is-violet','Last 7 days',C.week+cap,'Staff actions',5)].join('')}</div>`;
  const days=[6,5,4,3,2,1,0].map(n=>{ const a=admDay0(n), b=n?admDay0(n-1):Infinity; return {n,ts:a,c:(A.log||[]).filter(x=>{ const t=admTs(x); return t>=a&&t<b; }).length}; }), mx=Math.max(1,...days.map(x=>x.c));
  const chart=`<section class="adm-card" data-testid="admin-activity-chart"><div class="adm-card-h"><span><b>Activity this week</b><small>${C.week+cap} action${C.week===1?'':'s'}</small></span><button type="button" data-act="adm-sec" data-val="activity" data-testid="admin-see-activity" class="adm-link press">Open log</button></div><div class="adm-chart">${days.map((x,i)=>`<div class="adm-bar${x.n===0?' is-today':''}" title="${x.c} on ${esc(new Date(x.ts).toLocaleDateString())}" data-testid="admin-chart-bar-${i}"><em>${x.c||''}</em><i style="--h:${Math.round(x.c/mx*100)}%;--d:${i*50}ms"></i><span>${x.n===0?'Today':esc(new Date(x.ts).toLocaleDateString(undefined,{weekday:'short'}))}</span></div>`).join('')}</div></section>`;
  const recent=(A.log||[]).slice(0,5);
  const rec=`<section class="adm-card" data-testid="admin-recent"><div class="adm-card-h"><span><b>Latest actions</b><small>Everything staff did, newest first</small></span><button type="button" data-act="adm-sec" data-val="activity" data-testid="admin-see-all" class="adm-link press">See all</button></div>${recent.length?recent.map(admLogRow).join(''):`<p class="adm-none">No actions yet.</p>`}</section>`;
  const soon=[].concat((L.suspended||[]).map(u=>({u,k:'ban',t:Date.parse(u.banned_until)})),(L.muted||[]).map(u=>({u,k:'mute',t:Date.parse(u.muted_until)}))).filter(x=>x.t&&x.t-Date.now()<864e5*2).sort((a,b)=>a.t-b.t).slice(0,5);
  const soonH=soon.length?`<section class="adm-card mt-3" data-testid="admin-ending-soon"><div class="adm-card-h"><span><b>Ending soon</b><small>Bans and mutes that end in the next 48 hours</small></span></div>${soon.map((x,i)=>admPersonRow(x.u,x.k==='ban'?'suspended':'muted',i)).join('')}</section>`:'';
  return admHead('Overview','A quick look at bans, mutes and what the team has been up to.')+tiles+`<div class="adm-grid2">${chart}${rec}</div>`+soonH; }
function admFiltered(){ const A=_adm, F=A.f, acts=(ADM_F.find(x=>x[0]===F.a)||[])[2], r0=F.r==='today'?admDay0(0):F.r==='7d'?admDay0(6):F.r==='30d'?admDay0(29):0, q=F.t.trim().replace(/^@+/,'').toLowerCase();
  return (A.log||[]).filter(x=>(!acts||acts.includes(x.action))&&(!F.who||x.actor_username===F.who)&&(!r0||admTs(x)>=r0)&&(!q||[x.target_username,x.target_name,x.actor_username,(x.detail||{}).reason].some(v=>v&&String(v).toLowerCase().indexOf(q)>=0))); }
function admListHtml(){ const L=admFiltered(), A=_adm, any=A.f.a!=='all'||A.f.who||A.f.r!=='all'||A.f.t;
  return `<p class="adm-count" data-testid="admin-log-count">${L.length===(A.log||[]).length?'Showing all '+L.length:'Showing '+L.length+' of '+(A.log||[]).length}${any?` \u00b7 <button type="button" data-act="adm-f-reset" data-testid="admin-filter-reset" class="adm-link press">Clear filters</button>`:''}</p>`
   +(L.length?`<div data-testid="admin-log-list">${admGrouped(L)}</div>`:sxEmpty('filter-x',(A.log||[]).length?'Nothing matches':'No actions yet',(A.log||[]).length?'Try another filter or time range.':'Bans, mutes and edits will show up here.')); }
function admActivityHtml(){ const A=_adm, F=A.f, log=A.log||[], who=[...new Set(log.map(x=>x.actor_username).filter(Boolean))].sort();
  const cnt=k=>{ const acts=(ADM_F.find(x=>x[0]===k)||[])[2]; return acts?log.filter(x=>acts.includes(x.action)).length:log.length; };
  return admHead('Activity log','Every staff action. Tap one to open that person.')+`<div class="adm-fbar" data-testid="admin-filter-bar">
    <div class="adm-chips no-scrollbar" role="group" aria-label="Action type" data-testid="admin-filter-actions">${ADM_F.map(([k,l])=>`<button type="button" data-act="adm-f" data-val="${k}" aria-pressed="${F.a===k}" data-testid="filter-chip-${k}" class="adm-chip press${F.a===k?' on':''}">${l}<b>${cnt(k)}</b></button>`).join('')}</div>
    <div class="adm-frow"><div class="adm-chips no-scrollbar" role="group" aria-label="Time range" data-testid="admin-filter-range">${ADM_R.map(([k,l])=>`<button type="button" data-act="adm-r" data-val="${k}" aria-pressed="${F.r===k}" data-testid="filter-range-${k}" class="adm-chip press${F.r===k?' on':''}">${l}</button>`).join('')}</div>
     <select id="adm-who" class="adm-sel" aria-label="Staff member" data-testid="admin-filter-staff"><option value="">Everyone on staff</option>${who.map(u=>`<option value="${esc(u)}"${F.who===u?' selected':''}>@${esc(u)}</option>`).join('')}</select>
     <label class="adm-fin"><i data-lucide="filter"></i><input id="adm-ft" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(F.t)}" placeholder="Filter by @username or reason" data-testid="admin-filter-text"></label></div></div>
   <div id="adm-list">${admListHtml()}</div>`; }
function admPersonRow(u,kind,i){ const A=_adm, on=A&&A.sel&&A.sel===u.username, staffAdm=stRole()==='admin', ic=stIcon(u.verified_icon);
  const sub=kind==='suspended'?`<span class="adm-pill is-rose"><i data-lucide="ban"></i>Banned</span> ${esc(stUntil(u.banned_until))}${u.ban_reason?' \u00b7 '+esc(u.ban_reason):''}`:kind==='muted'?`<span class="adm-pill is-amber"><i data-lucide="volume-x"></i>Muted</span> ${esc(stUntil(u.muted_until))}${u.mute_reason?' \u00b7 '+esc(u.mute_reason):''}`:kind==='staff'?`<span class="adm-pill ${(MQ_ROLE[u.role]||MQ_ROLE.user)[2]}"><i data-lucide="${(MQ_ROLE[u.role]||MQ_ROLE.user)[1]}"></i>${(MQ_ROLE[u.role]||MQ_ROLE.user)[0]}</span>`:kind==='verified'?`<span class="adm-pill is-sky"><i data-lucide="badge-check"></i>Verified</span>${ic?' Icon \u00b7 '+esc(ic.name):''}`:(u.suspended?'<span class="adm-pill is-rose">Suspended</span>':esc((MQ_ROLE[u.role]||MQ_ROLE.user)[0]));
  const q=kind==='suspended'&&staffAdm&&u.role!=='admin'?`<button type="button" data-act="adm-quick" data-k="unban" data-id="${esc(u.id)}" data-u="${esc(u.username||'')}" data-testid="admin-quick-unban-${esc(u.username||i)}" class="adm-qbtn press">Lift ban</button>`:kind==='muted'&&(staffAdm||u.role!=='admin')?`<button type="button" data-act="adm-quick" data-k="unmute" data-id="${esc(u.id)}" data-u="${esc(u.username||'')}" data-testid="admin-quick-unmute-${esc(u.username||i)}" class="adm-qbtn press">Unmute</button>`:'';
  return `<div class="adm-row${on?' on':''}" style="--d:${Math.min(i,10)*30}ms" data-testid="people-row-${esc(u.username||i)}"><button type="button" data-act="adm-open" data-u="${esc(u.username||'')}" class="adm-row-main press"${u.username?'':' disabled'}>${sxAv(u)}<span class="min-w-0 flex-1"><b class="sx-nm"><span class="clamp-1">${esc(u.display_name||u.username||'Deleted account')}</span>${sxNameBadges(u,false,'adm-'+(u.username||i))}</b><small class="clamp-1">${u.username?'@'+esc(u.username)+' \u00b7 ':''}${sub}</small></span></button>${q}<i data-lucide="chevron-right" class="adm-chev"></i></div>`; }
function admPeopleHtml(k){ const L=_adm.lists[k]||[], D={suspended:['Banned','People who can\u2019t sign in right now.','ban','No one is banned'],muted:['Muted','Their profile changes stay private until the mute ends.','volume-x','No one is muted'],staff:['Staff','Admins and moderators.','shield','No staff yet'],verified:['Verified','Verified Treesh Icons.','badge-check','No one is verified yet']}[k];
  return admHead(D[0]+` <span class="adm-h-n" data-testid="admin-people-count">${L.length}</span>`,D[1])+(L.length?`<div data-testid="admin-people-list">${L.map((u,i)=>admPersonRow(u,k,i)).join('')}</div>`:sxEmpty(D[2],D[3],'')); }
function admSearchHtml(){ const A=_adm; if(A.res==null) return admHead('Search',`Looking for \u201c${esc(A.q)}\u201d\u2026`)+`<div class="sx-load"><span class="sx-spin"></span></div>`;
  return admHead('Search',`${A.res.length} result${A.res.length===1?'':'s'} for \u201c${esc(A.q)}\u201d`)+(A.res.length?`<div data-testid="admin-search-results">${A.res.map((u,i)=>admPersonRow(u,u.suspended?'suspended-s':'',i)).join('')}</div>`:sxEmpty('search-x','No one matches','Try their exact @username.')); }
async function admSelect(uname,keep){ const A=_adm; if(!A||!uname) return; const same=A.sel===uname;
  if(_modHost!=='dash'){ _modHost='dash'; _mod=A.mod; }
  A.sel=uname; if(!keep||!same){ A.selD=null; A.selErr=null; _mod={tab:'',banDur:'1d',muteDur:'1d',busy:false}; A.mod=_mod; admPanePaint(true); admPaint(); }
  let d=null, err=null; try{ d=await sxRpc('get_user_profile',{uname}); }catch(e){ err=e; } if(_adm!==A||A.sel!==uname) return;
  A.selD=d; A.selErr=err||(d?null:{message:'That account is gone'}); if(_mod&&d&&(!keep||!same)) _mod.tab=mqDefaultTab(d); admPanePaint(); }
function admPaneClose(){ const A=_adm; if(!A) return; A.sel=null; A.selD=null; const p=document.getElementById('adm-pane'); if(p) p.classList.remove('is-open'); admPaint(); setTimeout(()=>{ if(_adm&&!_adm.sel&&p) p.innerHTML=''; },340); }
function admPanePaint(fresh){ const A=_adm, p=document.getElementById('adm-pane'); if(!A||!p||!A.sel) return; const d=A.selD;
  const top=`<div class="adm-pane-top"><button type="button" data-act="adm-pane-close" aria-label="Back" data-testid="admin-pane-back" class="adm-ic press"><i data-lucide="${admMob()?'arrow-left':'x'}"></i></button><span class="adm-pane-t">Moderate</span>${d?`<button type="button" data-act="adm-view-profile" data-u="${esc(d.username)}" data-testid="admin-view-profile" class="adm-qbtn press"><i data-lucide="user-round"></i>View profile</button>`:''}</div>`;
  let body;
  if(!d&&!A.selErr) body=`<div class="sx-load"><span class="sx-spin"></span></div>`;
  else if(!d) body=sxEmpty('triangle-alert','Couldn\u2019t open this person',esc(sxErr(A.selErr)));
  else if(!d.mod) body=sxEmpty(d.relation==='self'?'user-round':'lock',d.relation==='self'?'That\u2019s you':'You can\u2019t moderate this account',d.relation==='self'?'Staff can\u2019t moderate their own account.':'');
  else body=`<div class="mod-sheet is-pane" data-testid="moderation-sheet">${modHtml()}</div>`;
  const prev=p.querySelector('.mod-body'), y=prev&&!fresh?prev.scrollTop:0;
  p.innerHTML=`<div class="adm-pane-in">${top}${body}</div>`; const nb=p.querySelector('.mod-body'); if(nb&&y) nb.scrollTop=y;
  if(!p.classList.contains('is-open')) requestAnimationFrame(()=>p.classList.add('is-open')); icons(); }
async function admQuick(b){ const k=b.dataset.k, id=b.dataset.id, u='@'+(b.dataset.u||''); if(!id) return; b.disabled=true;
  try{ if(k==='unban') await sxRpc('staff_set_ban',{target:id,until:null,reason:null}); else await sxRpc('staff_set_mute',{target:id,until:null,reason:null}); toast(k==='unban'?'Ban lifted':'Unmuted',k==='unban'?u+' can sign in again':'Their latest changes are public now'); await admLoad(true); if(_adm&&_adm.sel===b.dataset.u) admSelect(_adm.sel,true); }
  catch(e){ b.disabled=false; toast('Couldn\u2019t do that',sxErr(e)); } }
let _admQT=0, _admFT=0;
document.addEventListener('input',e=>{ const el=e.target; if(!_adm||!el) return;
  if(el.id==='adm-q'){ const q=el.value.trim().replace(/^@+/,'').toLowerCase(), A=_adm; A.q=q; A.res=null; const x=document.querySelector('#adm-root .adm-q-x'); if(x) x.hidden=!el.value; clearTimeout(_admQT); admPaint(); if(!q) return; const seq=++A.qseq;
    _admQT=setTimeout(async()=>{ let r=[]; try{ r=(await sxRpc('search_users',{q}))||[]; }catch(err){} if(_adm===A&&seq===A.qseq&&A.q===q){ A.res=r; admPaint(); } },240); return; }
  if(el.id==='adm-ft'){ _adm.f.t=el.value; clearTimeout(_admFT); _admFT=setTimeout(()=>{ const l=document.getElementById('adm-list'); if(l&&_adm){ l.innerHTML=admListHtml(); icons(); const m=document.getElementById('adm-main'); if(m) m._h=null; } },120); } });
document.addEventListener('change',e=>{ if(_adm&&e.target&&e.target.id==='adm-who'){ _adm.f.who=e.target.value; admPaint(); } });
let _sheetMod=null;
document.addEventListener('click',e=>{ const el=e.target; if(!el||!el.closest) return;
  if(_adm&&el.closest('#adm-pane')){ if(_modHost!=='dash'){ _sheetMod=_mod; _modHost='dash'; _mod=_adm.mod; } }
  else if(el.closest('#modal2 .mod-sheet')&&_modHost!=='sheet'){ if(_adm) _adm.mod=_mod; _modHost='sheet'; _mod=_sheetMod; } },true);
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]');
  if(!t) return; const a=t.dataset.act, v=t.dataset.val; if(a.indexOf('adm-')!==0) return;
  switch(a){
    case 'adm-close': admClose(); break;
    case 'adm-refresh': admLoad(); if(_adm&&_adm.sel) admSelect(_adm.sel,true); break;
    case 'adm-sec': if(!_adm) break; _adm.sec=v; _adm.q=''; _adm.res=null; { const i=document.getElementById('adm-q'); if(i) i.value=''; const x=document.querySelector('#adm-root .adm-q-x'); if(x) x.hidden=true; } admPaint(); break;
    case 'adm-q-clear': { const i=document.getElementById('adm-q'); if(i){ i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); i.focus(); } break; }
    case 'adm-f': if(_adm){ _adm.f.a=v; admPaint(); } break;
    case 'adm-r': if(_adm){ _adm.f.r=v; admPaint(); } break;
    case 'adm-f-reset': if(_adm){ _adm.f={a:'all',who:'',r:'all',t:''}; const m=document.getElementById('adm-main'); if(m) m._h=null; admPaint(); } break;
    case 'adm-open': if(t.dataset.u) admSelect(t.dataset.u); break;
    case 'adm-pane-close': admPaneClose(); break;
    case 'adm-view-profile': if(t.dataset.u) sxOpenProfile(t.dataset.u); break;
    case 'adm-quick': admQuick(t); break; } });
window.addEventListener('keydown',e=>{ if(!_adm) return; const k=e.key;
  if((e.ctrlKey||e.metaKey)&&(k==='k'||k==='K')){ e.preventDefault(); e.stopImmediatePropagation(); const i=document.getElementById('adm-q'); if(i){ i.focus(); i.select(); } return; }
  if(k==='Escape'){ if(document.querySelector('#modal2 > *')||document.getElementById('sx-root')) return; e.preventDefault(); e.stopImmediatePropagation(); if(_adm.sel) admPaneClose(); else admClose(); } },true);
const _ovo9zz=overlaysOpen; overlaysOpen=function(){ return !!_ovo9zz.apply(this,arguments)||!!document.getElementById('adm-root'); };

/* ===== profile header: no theme toggle, Style lives in Edit profile, Magic Markup lives in Style ===== */
const _sph9zzb=settingsProfileHtml; settingsProfileHtml=function(editing){ let h=_sph9zzb.apply(this,arguments);
  if(!editing) return h.replace(/<button data-act="set-theme" data-val="[a-z]*" data-testid="hero-theme-toggle"[\s\S]*?<\/button>/,'').replace('<button data-act="settings-edit-profile" data-val="on" data-testid="hero-edit-profile"','<button type="button" data-act="pf-preview" data-testid="hero-preview-profile" aria-label="Preview your profile like a visitor" title="See it like a visitor" class="pf-bubble press inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"><i data-lucide="eye" style="width:15px;height:15px"></i>Preview</button><button data-act="settings-edit-profile" data-val="on" data-testid="hero-edit-profile"');
  const card=`<button type="button" data-act="sp-open" data-testid="profile-edit-style-button" class="pf-style-cta press"><span class="pf-style-ic"><i data-lucide="palette"></i></span><span class="min-w-0 flex-1"><b>Style my profile</b><small>Themes, background, fonts, sections, layout and Magic Markup</small></span><i data-lucide="chevron-right" class="pf-style-chev"></i></button>`;
  return h.replace('<div class="mt-4 grid gap-4 sm:grid-cols-2">',card+'<div class="mt-4 grid gap-4 sm:grid-cols-2">'); };
SP_TABS.push(['markup','Magic Markup','wand-sparkles']);
const _spEB9zz=spEdBody; spEdBody=function(){ if(_spEd&&_spEd.tab==='markup') return `<div class="sp-mk" data-testid="editor-markup-panel"><span class="sp-mk-ic"><i data-lucide="wand-sparkles"></i></span><h4>Move, resize and restyle anything</h4><p>Tap any part of your profile to move it, resize it, hide it or give it its own colors. Your style changes are saved first.</p><button type="button" data-act="sp-mk" data-testid="editor-markup-start" class="sp-ed-btn is-primary press"><i data-lucide="wand-sparkles"></i>Start Magic Markup</button>${(()=>{ const D=pfMkKeys(); return D&&Object.keys(D).length; })()?`<p class="sp-mk-note"><i data-lucide="check"></i>You already have Magic Markup changes on your profile.</p>`:''}</div>`; return _spEB9zz.apply(this,arguments); };
document.addEventListener('click',async e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="sp-mk"]'); if(!t||!_spEd) return;
  const dirty=!!state._spBgDraft||(state._spDraft&&JSON.stringify(spNorm(state._spDraft))!==JSON.stringify(spNorm((state.profile||{}).space)));
  if(dirty) await spSave(); else spEdClose(); setTimeout(()=>{ try{ pfMkStart(); }catch(err){ console.warn(err); } },320); });

/* ===== preview: see your profile the way visitors do ===== */
let _pvFriends=null;
function pvData(as){ const p=state.profile||{}, c=sxCfg(), src=sxSnapshot(), pv=c.sections||{}, me=stMe()||{}, fr=as==='friends', see=fr||!c.private;
  const data={nickname:src.nickname,talents:src.talents,favs:src.favs}, locked=[];
  if(see){ ['joined','accent','theme','custom'].forEach(k=>{ if(src[k]!=null) data[k]=src[k]; }); data.space=spNorm(p.space);
    ['zodiac','badges','favorites','lyrics','disliked','playlists','listening','arcade'].forEach(k=>{ const v=pv[k]||'everyone', keys=k==='badges'?['badges','stats','top']:k==='zodiac'?['zodiac','bday']:[k]; if(v==='everyone'||(v==='friends'&&fr)) keys.forEach(x=>{ if(src[x]!=null) data[x]=src[x]; }); else if(v==='friends') locked.push(k); }); }
  const fv=pv.friendlist||'everyone', fl=(_pvFriends||[]).filter(f=>f.relation==='friends').map(f=>({id:f.id,username:f.username,display_name:f.display_name||null,avatar_url:f.avatar_url||null,role:f.role,verified:f.verified}));
  let friend_list=null; if(see&&sbUser()){ if(fv==='everyone'||(fv==='friends'&&fr)) friend_list=fl; else if(fv==='friends') locked.push('friendlist'); }
  return {id:(sbUser()||{}).id||'me',username:p.usernameSynced||p.username||'you',display_name:p.nickname||'Treesh Fan',avatar_url:p.avatarUrl||p.avatar||null,bio:see?(p.bio||null):null,banner_url:see?(state.profileBanner||null):null,created_at:new Date(pfJoined(p)).toISOString(),is_private:!!c.private,relation:fr?'friends':'none',friends:fl.length,role:me.role||'user',verified:!!me.verified,verified_icon:me.verified?me.verified_icon||null:null,suspended:false,locked_all:!see,locked,data,friend_list,mod:null}; }
function pvRender(as){ const d=pvData(as), keep=_sxV&&_sxV.preview?_sxV.tab:null; _sxV={u:d.username,d,tab:keep||'listening',busy:false,err:null,preview:as}; const T=sxTabs(d); if(T.length&&!T.some(t=>t[0]===_sxV.tab)) _sxV.tab=T[0][0]; sxRender(); }
async function pvOpen(as){ if(sbUser()&&!_pvFriends){ try{ _pvFriends=(await sxRpc('my_friends'))||[]; }catch(e){ _pvFriends=[]; } } pvRender(as||'everyone'); }
function pvDecorate(){ const root=document.getElementById('sx-root'); if(!root) return; const on=!!(_sxV&&_sxV.preview); root.classList.toggle('is-preview',on); let bar=root.querySelector('.pvx-bar'); if(!on){ if(bar) bar.remove(); return; }
  const d=_sxV.d, panel=root.querySelector('.sx-panel'); if(panel&&d&&d.data&&d.data.space&&!d.locked_all){ const S=spNorm(d.data.space); if(S.bg.local) spApplyRoot(panel,S,state.spaceBg||''); }
  const as=_sxV.preview, html=`<div class="pvx-bar" data-testid="profile-preview-bar"><span class="pvx-k"><i data-lucide="eye"></i><span><b>Preview</b><small data-testid="profile-preview-note">How ${as==='friends'?'your friends see':'everyone sees'} your profile</small></span></span><div class="pvx-seg" role="radiogroup" aria-label="View as">${[['everyone','Everyone','globe'],['friends','Friends','users-round']].map(([k,l,ic])=>`<button type="button" role="radio" aria-checked="${as===k}" data-act="pvx-as" data-val="${k}" data-testid="profile-preview-as-${k}" class="pvx-opt press${as===k?' on':''}"><i data-lucide="${ic}"></i>${l}</button>`).join('')}</div><button type="button" data-act="pvx-exit" aria-label="Exit preview" data-testid="profile-preview-exit" class="pvx-x press"><i data-lucide="x"></i><span>Exit</span></button></div>`;
  if(!bar){ bar=document.createElement('div'); root.appendChild(bar); } bar.outerHTML=html; icons(); }
const _sxR9zz=sxRender; sxRender=function(){ const r=_sxR9zz.apply(this,arguments); try{ pvDecorate(); }catch(e){ console.warn('preview',e); } return r; };
const _sxOP9zz=sxOpenProfile; sxOpenProfile=function(u){ if(_sxV&&_sxV.preview&&String(u||'').replace(/^@+/,'').toLowerCase()===_sxV.u){ pvRender(_sxV.preview); return; } return _sxOP9zz.apply(this,arguments); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a==='pf-preview'){ pvOpen('everyone'); return; }
  if(!_sxV||!_sxV.preview||!t.closest('#sx-root')) return;
  if(a==='pvx-as'){ e.stopImmediatePropagation(); pvRender(t.dataset.val); return; }
  if(a==='pvx-exit'){ e.stopImmediatePropagation(); sxClose(); return; }
  if(t.closest('.sx-acts,.sx-top-r')){ e.preventDefault(); e.stopImmediatePropagation(); toast('This is just a preview','Visitors can tap this on your real profile'); } },true);

/* ===== banner positioner: crop to the real banner shape, drag to place, zoom ===== */
const BN_AD=3.2, BN_AM=1.6, BN_OUT=1800;
let _bn=null;
function bnOpen(src,own){ const im=new Image(); im.onload=()=>{ _bn={src,own:!!own,img:im,W:im.naturalWidth,H:im.naturalHeight,z:1,cx:im.naturalWidth/2,cy:im.naturalHeight/2,mode:window.innerWidth<900?'phone':'desk',pts:new Map()}; bnPaint(); };
  im.onerror=()=>{ if(own) try{ URL.revokeObjectURL(src); }catch(e){} toast('Couldn\u2019t open that image'); }; im.src=src; }
function bnCrop(){ const B=_bn, w1=Math.min(B.W,B.H*BN_AD), w=w1/B.z, h=w/BN_AD; B.cx=Math.max(w/2,Math.min(B.W-w/2,B.cx)); B.cy=Math.max(h/2,Math.min(B.H-h/2,B.cy)); return {w,h}; }
function bnLayout(){ const B=_bn, st=document.getElementById('bn-stage'), im=st&&st.querySelector('img'); if(!im) return; const {w,h}=bnCrop(), rw=B.mode==='phone'?h*BN_AM:w, W=st.clientWidth, s=W/rw;
  im.style.width=(B.W*s)+'px'; im.style.height=(B.H*s)+'px'; im.style.transform=`translate(${(-(B.cx-rw/2)*s).toFixed(1)}px,${(-(B.cy-h/2)*s).toFixed(1)}px)`;
  const z=document.getElementById('bn-zoom'); if(z&&+z.value!==B.z) z.value=B.z; const zo=document.getElementById('bn-zoom-out'); if(zo) zo.textContent=Math.round(B.z*100)+'%'; }
function bnPaint(){ const B=_bn; if(!B) return; const ph=B.mode==='phone';
  $("#modal2").innerHTML=modal2Wrap(`<div class="bn-sheet" data-testid="banner-positioner"><div class="tsf-head"><span class="sba-orb"><i data-lucide="image"></i></span><div class="min-w-0 flex-1"><h3 class="tsf-t">Position your banner</h3><p class="tsf-d">Drag to move it. Pinch, scroll or use the slider to zoom.</p></div><button type="button" data-act="bn-cancel" aria-label="Close" data-testid="banner-pos-close" class="tsf-x press"><i data-lucide="x"></i></button></div>
   <div class="bn-modes" role="radiogroup" aria-label="Preview on" data-testid="banner-pos-modes">${[['phone','Phone','smartphone'],['desk','Computer','monitor']].map(([k,l,ic])=>`<button type="button" role="radio" aria-checked="${B.mode===k}" data-act="bn-mode" data-val="${k}" data-testid="banner-pos-mode-${k}" class="bn-mode press${B.mode===k?' on':''}"><i data-lucide="${ic}"></i>${l}</button>`).join('')}</div>
   <div class="bn-stage${ph?' is-phone':''}" id="bn-stage" data-no-swipe data-testid="banner-pos-stage" style="aspect-ratio:${ph?BN_AM:BN_AD}"><img src="${esc(B.src)}" alt="" draggable="false">${ph?'<span class="bn-av" aria-hidden="true"></span>':`<span class="bn-zone" style="width:${(BN_AM/BN_AD*100).toFixed(2)}%" aria-hidden="true" data-testid="banner-pos-phone-zone"><em>Phones</em></span>`}<span class="bn-hint" aria-hidden="true"><i data-lucide="move"></i>Drag</span></div>
   <p class="bn-cap" data-testid="banner-pos-caption">${ph?'This is exactly how your banner fits on phones.':'The full banner on computers. The dashed box is what phones show.'}</p>
   <div class="bn-zrow"><i data-lucide="zoom-out"></i><input type="range" id="bn-zoom" min="1" max="4" step="0.01" value="${B.z}" aria-label="Zoom" data-testid="banner-pos-zoom" class="sp-range"><i data-lucide="zoom-in"></i><span id="bn-zoom-out" class="bn-zv">${Math.round(B.z*100)}%</span></div>
   <div class="bn-acts"><button type="button" data-act="bn-reset" data-testid="banner-pos-reset" class="sba-btn press"><i data-lucide="rotate-ccw"></i>Reset</button><button type="button" data-act="bn-apply" data-testid="banner-pos-apply" class="sba-btn is-primary press"><i data-lucide="check"></i>Use banner</button></div></div>`,'banner-positioner-modal','xl');
  icons(); syncScrollLock(); requestAnimationFrame(bnLayout); bnWire(); }
function bnWire(){ const st=document.getElementById('bn-stage'); if(!st) return; const B=_bn; let last=null, pinch=null;
  const scale=()=>{ const {w,h}=bnCrop(); return st.clientWidth/(B.mode==='phone'?h*BN_AM:w); };
  st.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ st.setPointerCapture(e.pointerId); }catch(_){} B.pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); st.classList.add('is-drag'); last={x:e.clientX,y:e.clientY}; if(B.pts.size===2){ const [a,b]=[...B.pts.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:B.z}; } });
  st.addEventListener('pointermove',e=>{ if(!B.pts.has(e.pointerId)) return; B.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(B.pts.size>=2&&pinch){ const [a,b]=[...B.pts.values()]; B.z=Math.max(1,Math.min(4,pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.d))); bnLayout(); return; }
    if(!last) return; const s=scale(); B.cx-=(e.clientX-last.x)/s; B.cy-=(e.clientY-last.y)/s; last={x:e.clientX,y:e.clientY}; bnLayout(); });
  const up=e=>{ B.pts.delete(e.pointerId); if(B.pts.size<2) pinch=null; if(!B.pts.size){ last=null; st.classList.remove('is-drag'); } else { const p=[...B.pts.values()][0]; last={x:p.x,y:p.y}; } };
  st.addEventListener('pointerup',up); st.addEventListener('pointercancel',up);
  st.addEventListener('wheel',e=>{ e.preventDefault(); B.z=Math.max(1,Math.min(4,B.z*(e.deltaY<0?1.08:1/1.08))); bnLayout(); },{passive:false}); }
function bnClose(){ const B=_bn; _bn=null; if(B&&B.own) setTimeout(()=>{ try{ URL.revokeObjectURL(B.src); }catch(e){} },500); closeModal2(); }
function bnApply(){ const B=_bn; if(!B) return; const {w,h}=bnCrop(), c=document.createElement('canvas'); c.width=BN_OUT; c.height=Math.round(BN_OUT/BN_AD); const g=c.getContext('2d'); g.imageSmoothingQuality='high';
  g.drawImage(B.img,B.cx-w/2,B.cy-h/2,w,h,0,0,c.width,c.height); let d=''; try{ d=c.toDataURL('image/jpeg',.86); }catch(e){ toast('Couldn\u2019t use that image'); return; } bnClose(); pfBannerApply(d); }
pfSetBanner=function(f){ if(!/^image\//.test(f.type||'')){ toast('Pick an image file'); return; } if(f.size>20*1024*1024){ toast('Image too large','Use one under 20 MB'); return; } if(typeof pfStashDraft==='function') pfStashDraft(); bnOpen(URL.createObjectURL(f),true); };
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='bn-zoom'&&_bn){ _bn.z=+e.target.value||1; bnLayout(); } });
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a==='pf-banner-edit'){ if(state.profileBanner){ e.stopImmediatePropagation(); if(typeof pfStashDraft==='function') pfStashDraft(); bnOpen(state.profileBanner,false); } return; }
  if(a.indexOf('bn-')!==0||!_bn) return; e.stopImmediatePropagation();
  if(a==='bn-cancel') bnClose(); else if(a==='bn-apply') bnApply(); else if(a==='bn-reset'){ _bn.z=1; _bn.cx=_bn.W/2; _bn.cy=_bn.H/2; bnLayout(); } else if(a==='bn-mode'){ _bn.mode=t.dataset.val; bnPaint(); } },true);
window.addEventListener('resize',()=>{ if(_bn) bnLayout(); });

/* ===== Music Studio: a new upload opens its full Edit track page right away ===== */
let _umNew=[], _umNewN=0, _umAdding=0;
const _umUpHtml9zz=umUpHtml; umUpHtml=function(){ if(!_umAdding) return _umUpHtml9zz.apply(this,arguments);
  return `<section class="umx-up is-adding" id="um-up" data-testid="um-upload"><div class="umx-drop" data-testid="um-adding"><span class="umx-drop-ic"><i data-lucide="loader-circle" class="sba-spin"></i></span><span class="min-w-0"><b>Adding ${_umAdding===1?'your song':_umAdding+' songs'}\u2026</b><small>The editor opens next so you can add cover art, credits and lyrics</small></span></div></section>`; };
async function umCommitQueue(){ umQSync(); if(!_umQ.length) return; umPvStop(); _umAdding=_umQ.length; umUpRender(); const ids=[];
  try{ for(const it of _umQ.slice()){ const d=it.dur||(it.file?await probeAudioDuration(it.file).catch(()=>0):0), id='u-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)+'-'+ids.length;
      const meta={title:String(it.title||'').trim().slice(0,120)||'New song',artist:String(it.artist||'').trim()||'You',album:'',genre:it.genre||'',featuring:'',writtenBy:'',producer:'',mixer:'',label:'',mood:'',videographer:'',creationDate:'',desc:'',explicit:false};
      await idbPut({id,meta,audioBlob:it.file||null,audioLink:it.url||'',audioType:it.file?(it.file.type||''):'',coverBlob:it.cover||null,coverLink:it.cover?'':(it.coverLink||''),coverType:it.cover?(it.cover.type||'image/jpeg'):'',duration:d||0,addedAt:Date.now()+ids.length});
      ids.push(id); if(/^blob:/.test(it.coverUrl||'')){ try{ URL.revokeObjectURL(it.coverUrl); }catch(e){} } _umQ=_umQ.filter(x=>x!==it); } }
  catch(e){ console.error('add songs failed',e); toast('Couldn\u2019t add every song',isQuotaError(e)?'Your device storage is full':'Storage error. Try again.'); }
  _umAdding=0; try{ await loadUserSongs(); }catch(e){} umUpRender(); if(!ids.length) return;
  _umNewN=ids.length; _umNew=ids.slice(1); umOpenNew(ids[0],1); toast(ids.length===1?'Song added':ids.length+' songs added','Fill in the details, then tap Save'); }
function umOpenNew(id,i){ state._teTab='details'; umEditOpen(id); const h=document.querySelector('#um-edit .um-ehead'); if(!h) return;
  const eb=h.querySelector('.st-eyebrow'); if(eb){ eb.innerHTML=`<span class="umx-new" data-testid="um-new-upload-chip"><i data-lucide="sparkles"></i>New upload${_umNewN>1?` \u00b7 ${i} of ${_umNewN}`:''}</span>`; icons(); }
  if(window.innerWidth>=900) setTimeout(()=>{ const t=document.getElementById('am-title'); if(t){ try{ t.focus({preventScroll:true}); t.select(); }catch(e){} } },320); }
const _umQAdd9zz=umQAdd; umQAdd=function(){ const n=_umQ.length; const r=_umQAdd9zz.apply(this,arguments); if(_umQ.length>n) umCommitQueue(); return r; };
const _umLA9zz=umLinkAdd; umLinkAdd=async function(){ const n=_umQ.length; const r=await _umLA9zz.apply(this,arguments); if(_umQ.length>n) umCommitQueue(); return r; };
const _sct9zz=saveCustomTrack; saveCustomTrack=async function(){ const r=await _sct9zz.apply(this,arguments);
  if(_umNew.length&&!(state.um&&state.um.edit)){ const id=_umNew.shift(), i=_umNewN-_umNew.length; setTimeout(()=>{ if(SONG_BY_ID[id]||USER_SONGS.some(s=>s.id===id)) umOpenNew(id,i); },260); } else if(!_umNew.length) _umNewN=0; return r; };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="um-edit-back"]'); if(!t||!_umNewN) return; const left=_umNew.length; _umNew=[]; _umNewN=0; if(left) toast('Your songs are saved','Edit the rest any time from your music'); },true);
