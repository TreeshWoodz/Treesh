/* ---------- P9g: Treesh accounts (Supabase). Optional sign in; the profile syncs, localStorage stays the cache ---------- */
let _sbBusy=false, _sbAgain=false, _sbJustAuthed=false, _sbMode='signin', _sbEmail='', _sbSentTo='';
const SB_UNAME=/^[a-z0-9_.]{3,20}$/;
const SB_OFFLINE='You\u2019re offline. Changes will sync when you\u2019re back.';
function sbReady(){ return !!sb; }
function sbConfigured(){ return SB_KEY!=='YOUR_SB_PUBLISHABLE_KEY'; }
function sbUser(){ return state.sbUser||null; }
function sbMeta(patch){ const m=Object.assign({pending:false,at:0,uid:null},LS.get('treesh_sb_meta',{})||{}); if(patch){ Object.assign(m,patch); LS.set('treesh_sb_meta',m); } return m; }
function sbSig(d){ return d?(d.length+':'+d.slice(-48)):''; }
function sbRedirect(){ return location.origin+location.pathname; }
function sbIsNet(m){ return /Failed to fetch|NetworkError|Load failed|network/i.test(m||''); }
function sbUname(v,fallback){ if(v==null) return fallback||''; const u=String(v).trim().replace(/^@+/,'').toLowerCase(); if(!u) return '';
  if(!SB_UNAME.test(u)){ state._unameErr='Use 3\u201320 letters, numbers, _ or .'; const h=document.getElementById('set-uname-hint'); if(h){ h.textContent=state._unameErr; h.classList.add('is-err'); } toast('Check your username','3\u201320 letters, numbers, _ or .'); return false; }
  state._unameErr=''; return u; }
function sbErrText(e){ const m=(e&&(e.message||e.error_description))||String(e||''); const c=e&&e.code;
  if(/Invalid login credentials/i.test(m)) return 'That email and password don\u2019t match.';
  if(/Email not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link.';
  if(/rate limit|too many/i.test(m)||(e&&e.status===429)) return 'Too many tries. Wait a minute and try again.';
  if(/already registered/i.test(m)) return 'That email already has an account. Sign in instead.';
  if(sbIsNet(m)) return 'Can\u2019t reach Treesh accounts. Check your connection.';
  if(/Bucket not found/i.test(m)) return 'the avatars storage bucket is missing';
  if(c==='42501'||/row-level security|permission denied/i.test(m)) return 'Permission denied. Check the access rules (RLS) in Supabase.';
  if(c==='42P01'||c==='PGRST205'||/does not exist|Could not find the table/i.test(m)) return 'The profiles table wasn\u2019t found in Supabase.';
  if(/Password should be/i.test(m)) return 'Passwords need at least 6 characters.';
  return m||'Something went wrong. Try again.'; }

/* ---- sync engine ---- */
function sbSet(s,msg){ state.sbSync={s,msg:msg||''}; sbPaint(); }
function sbRerender(){ try{ renderShell(); renderView(); renderSidebarLibrary(); if(state.profileOpen) renderProfile(); }catch(e){} }
function sbQueuePush(){ if(!sb) return; sbMeta({pending:true}); if(!sbUser()) return; if(!navigator.onLine){ sbSet('offline',SB_OFFLINE); return; } sbPush(); }
async function sbAvatarUpload(uid,d){ const b=await (await fetch(d)).blob(); const ext=((b.type||'image/jpeg').split('/')[1]||'jpg').replace('jpeg','jpg'); const path=uid+'/avatar.'+ext;
  const {error}=await sb.storage.from('avatars').upload(path,b,{upsert:true,contentType:b.type||'image/jpeg',cacheControl:'3600'}); if(error) throw error;
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl+'?v='+Date.now(); }
async function sbPush(){ const u=sbUser(); if(!sb||!u) return; if(_sbBusy){ _sbAgain=true; return; } _sbBusy=true; sbSet('saving'); let warn='';
  try{ const p=Object.assign({},state.profile||{}); let av=p.avatarUrl||null;
    if(!p.avatar) av=null;
    else if(/^data:image\//.test(p.avatar)){ const sig=sbSig(p.avatar); if(sig!==p.avatarSig||!av){ try{ av=await sbAvatarUpload(u.id,p.avatar); p.avatarSig=sig; }catch(e){ warn='Your photo didn\u2019t upload ('+sbErrText(e)+'). Everything else synced.'; } } }
    else if(/^https?:/.test(p.avatar)) av=p.avatar;
    const {error}=await sb.from('profiles').upsert({id:u.id,username:p.username||null,display_name:p.nickname||null,avatar_url:av,bio:p.bio||null});
    if(error) throw error;
    const cur=state.profile||{}; Object.assign(cur,{avatarUrl:av,avatarSig:p.avatarSig||'',usernameSynced:p.username||''}); state.profile=cur; LS.set('treesh_profile',cur);
    sbMeta({pending:false,at:Date.now(),uid:u.id}); sbSet(warn?'error':'synced',warn);
  }catch(e){ sbFail(e); }
  finally{ _sbBusy=false; if(_sbAgain){ _sbAgain=false; setTimeout(sbPush,0); } } }
function sbFail(e){ const code=e&&e.code, msg=((e&&(e.message||''))+' '+((e&&e.details)||'')).trim();
  if(code==='23505'&&/username/i.test(msg)){ const p=state.profile||{}; const tried=p.username; p.username=p.usernameSynced||''; LS.set('treesh_profile',p);
    state._unameErr='@'+tried+' is taken. Try another one.'; state._pfDraft=Object.assign({},state._pfDraft||{},{uname:tried}); state.settingsEditProfile=true;
    toast('That username is taken','@'+tried+' belongs to someone else'); sbSet('error','@'+tried+' is taken, so your username wasn\u2019t changed.'); _sbAgain=true; sbRerender(); return; }
  sbMeta({pending:true});
  if(!navigator.onLine||sbIsNet(msg)){ sbSet('offline',SB_OFFLINE); return; }
  console.warn('Treesh sync',e); sbSet('error',sbErrText(e)); }
async function sbPull(){ const u=sbUser(); if(!sb||!u) return 'none'; state._sbPulled=Date.now(); sbSet('saving');
  try{ const {data,error}=await sb.from('profiles').select('id,username,display_name,avatar_url,bio,created_at').eq('id',u.id).maybeSingle(); if(error) throw error;
    const m=sbMeta();
    if(!data){ if(state.profile){ await sbPush(); return 'pushed'; } sbSet('idle'); return 'empty'; }
    if(m.pending&&m.uid===u.id&&state.profile){ await sbPush(); return 'pushed'; }
    sbApply(data); sbMeta({pending:false,at:Date.now(),uid:u.id}); sbSet('synced'); return 'pulled';
  }catch(e){ sbFail(e); return 'error'; } }
function sbApply(r){ const before=JSON.stringify(state.profile||null); const p=Object.assign({},state.profile||{});
  p.nickname=r.display_name||p.nickname||'Treesh Fan'; p.username=r.username||''; p.usernameSynced=p.username; p.bio=r.bio||'';
  const c=Date.parse(r.created_at||''); if(c&&(!p.joined||c<p.joined)) p.joined=c;
  if(r.avatar_url){ if(r.avatar_url!==p.avatarUrl){ p.avatarUrl=r.avatar_url; p.avatar=r.avatar_url; p.avatarSig=''; sbCacheAvatar(r.avatar_url); } }
  else if(p.avatarUrl){ p.avatar=''; p.avatarUrl=null; p.avatarSig=''; }
  state.profile=p; LS.set('treesh_profile',p); if(JSON.stringify(p)!==before) sbRerender(); }
function sbCacheAvatar(url){ fetch(url).then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{ if(b.size>400*1024) throw 0; return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(b); }); })
  .then(d=>{ const p=state.profile; if(!p||p.avatarUrl!==url) return; p.avatar=d; p.avatarSig=sbSig(d); LS.set('treesh_profile',p); }).catch(()=>{}); }

/* ---- auth events ---- */
function sbObOpen(){ return !!document.querySelector('#modal [data-ob-root]'); }
function sbCloseAuth(){ if(document.querySelector('#modal2 .sba-modal')) closeModal2(); }
async function sbSignedIn(u){ const mine=_sbJustAuthed; _sbJustAuthed=false; if(mine){ sbCloseAuth(); toast('Signed in',u.email||''); }
  const r=await sbPull();
  if(sbObOpen()){ if(r==='pulled'&&state.profile){ closeModal(); try{ checkDailyStars(); }catch(e){} sbRerender(); toast('Welcome back',state.profile.nickname||''); setTimeout(()=>{ try{ wnMaybeAuto(state.view); }catch(e){} },600); } else { try{ renderOnboarding(); }catch(e){} } } }
function sbSignedOut(){ state.sbSync={s:'idle',msg:''}; sbMeta({uid:null,pending:false}); toast('Signed out','Your profile stays on this device'); sbPaint(); if(state.profileOpen) renderProfile(); }
function sbHandleCallback(cb){ if(cb.error_description||cb.error){ setTimeout(()=>toast('That link didn\u2019t work',cb.error_description||cb.error),900); return; }
  if(!cb.access_token||!cb.refresh_token) return;
  sb.auth.setSession({access_token:cb.access_token,refresh_token:cb.refresh_token}).then(({error})=>{ if(error){ toast('Couldn\u2019t sign you in',sbErrText(error)); return; }
    if(cb.type==='recovery') setTimeout(()=>sbAuthOpen('newpw'),500); else if(cb.type==='signup'||cb.type==='email'||cb.type==='invite') setTimeout(()=>toast('Email confirmed','You\u2019re signed in and syncing'),700); }); }
function sbInit(){ state.sbSync=state.sbSync||{s:'idle',msg:''}; if(!sb) return;
  sb.auth.onAuthStateChange((ev,session)=>{ const u=(session&&session.user)||null, prev=state.sbUser; state.sbUser=u;
    if(ev==='PASSWORD_RECOVERY') setTimeout(()=>sbAuthOpen('newpw'),0);
    if(u&&(!prev||prev.id!==u.id)) setTimeout(()=>sbSignedIn(u),0); else if(!u&&prev) setTimeout(sbSignedOut,0); else setTimeout(sbPaint,0); });
  if(SB_CB) sbHandleCallback(SB_CB);
  window.addEventListener('online',()=>{ if(sbUser()&&sbMeta().pending) sbPush(); else if(sbUser()) sbSet('idle'); });
  window.addEventListener('offline',()=>{ if(sbUser()) sbSet('offline',SB_OFFLINE); });
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'&&sbUser()&&navigator.onLine&&Date.now()-(state._sbPulled||0)>60000) sbPull(); }); }

/* ---- Settings: account card ---- */
function sbPaint(){ const el=document.querySelector('[data-testid="sb-account-card"]'); if(!el) return; const t=document.createElement('div'); t.innerHTML=sbAccountCardHtml('account'); if(t.firstElementChild){ el.replaceWith(t.firstElementChild); icons(); } }
function sbPill(){ const st=state.sbSync||{s:'idle'}, m=sbMeta();
  const P={saving:['loader-circle','Syncing\u2026','is-busy'],offline:['wifi-off','Waiting for internet','is-wait'],error:['triangle-alert','Needs attention','is-err'],synced:['cloud-check','Synced'+(m.at?' \u00b7 '+swAgo(m.at):''),'is-ok']};
  const k=P[st.s]||(m.pending?P.offline:(m.at?P.synced:['cloud','Signed in','is-ok']));
  return `<span class="sba-pill ${k[2]}" data-testid="sb-sync-status"><i data-lucide="${k[0]}"></i>${k[1]}</span>`; }
function sbAccountCardHtml(tab){ if(tab!=='account') return ''; const u=sbUser(), p=state.profile||{}, st=state.sbSync||{s:'idle'};
  const head=(ic,title,sub)=>`<div class="sba-head"><span class="sba-ic"><i data-lucide="${ic}"></i></span><div class="min-w-0 flex-1"><h2 class="sba-t">${title}</h2><p class="sba-s">${sub}</p></div></div>`;
  const btn=(act,val,tid,ic,label,cls)=>`<button type="button" data-act="${act}"${val?` data-val="${val}"`:''} data-testid="${tid}" class="sba-btn press${cls?' '+cls:''}"><i data-lucide="${ic}"></i>${label}</button>`;
  let body;
  if(!sbReady()) body=head('cloud-off','Treesh account',sbConfigured()?'Can\u2019t reach Treesh accounts right now. Your profile is safe on this device. Try again when you\u2019re back online.':'Accounts aren\u2019t switched on yet. Your profile is saved on this device for now.')+`<div class="sba-acts">${btn('sb-auth-open','signin','sb-card-signin','log-in','Sign in','is-primary')}</div>`;
  else if(!u) body=head('cloud','Back up your profile','Sign in to keep your name, @username, photo and bio on any device. As a guest, everything stays on this device.')+`<div class="sba-perks">${[['refresh-cw','Syncs across devices'],['wifi-off','Still works offline'],['shield-check','Only you can edit it']].map(([i,l])=>`<span><i data-lucide="${i}"></i>${l}</span>`).join('')}</div><div class="sba-acts">${btn('sb-auth-open','signin','sb-card-signin','log-in','Sign in','is-primary')}${btn('sb-auth-open','signup','sb-card-signup','user-plus','Create account')}</div>`;
  else body=`<div class="sba-user"><span class="sba-av">${p.avatar?img(p.avatar,'h-full w-full object-cover'):`<b>${esc((p.nickname||'T').charAt(0).toUpperCase())}</b>`}</span><div class="min-w-0 flex-1"><p class="sba-name clamp-1" data-testid="sb-card-name">${esc(p.nickname||'Treesh Fan')}</p><p class="sba-mail clamp-1" data-testid="sb-card-email">${p.username?'@'+esc(p.username)+' \u00b7 ':''}${esc(u.email||'')}</p></div>${sbPill()}</div>${st.msg&&st.s!=='saving'?`<p class="sba-note${st.s==='error'?' is-err':''}" data-testid="sb-sync-msg">${esc(st.msg)}</p>`:''}<div class="sba-acts">${btn('sb-sync-now','','sb-sync-now','refresh-cw','Sync now','is-primary')}${btn('sb-auth-open','newpw','sb-change-pw','key-round','Change password')}${btn('sb-signout','','sb-signout','log-out','Sign out','is-danger')}</div>`;
  return `<section data-testid="sb-account-card" class="sba-card"><span class="sba-glow" aria-hidden="true"></span>${body}</section>`; }

/* ---- sign in / create account sheet ---- */
function sbAuthOpen(mode){ _sbMode=mode||'signin'; _sbSentTo=''; sbAuthRender(); }
function sbAuthHtml(){ const m=_sbMode, off=!sbReady();
  const T={signin:['Welcome back','Sign in to sync your Treesh profile.'],signup:['Create your account','Back up your profile and use it on any device.'],reset:['Reset your password','We\u2019ll email you a link to choose a new one.'],newpw:['Choose a new password','Use at least 6 characters.'],sent:['Check your email',`We sent a confirmation link to ${esc(_sbSentTo)}. Open it to finish signing up.`],'sent-reset':['Check your email',`If there\u2019s an account for ${esc(_sbSentTo)}, a reset link is on its way.`]}[m]||['',''];
  const hero=ic=>`<div class="sba-hero"><span class="sba-orb"><i data-lucide="${ic}"></i></span></div><h3 class="sba-mt">${T[0]}</h3><p class="sba-md">${T[1]}</p>`;
  if(m==='sent'||m==='sent-reset') return `<div class="sba-modal" data-testid="sb-auth-sent">${hero('mail-check')}<div class="sba-col"><button type="button" data-act="sb-auth-mode" data-val="signin" data-testid="sb-auth-back-signin" class="sba-btn is-primary lg press">Back to sign in</button><button type="button" data-act="sb-auth-close" data-testid="sb-auth-done" class="sba-btn lg press">Done</button></div></div>`;
  const banner=off?`<div class="sba-banner" data-testid="sb-auth-offline"><i data-lucide="cloud-off"></i><span>${sbConfigured()?'Can\u2019t reach Treesh accounts. Check your connection and try again.':'Accounts aren\u2019t switched on yet. They\u2019ll work once the Supabase key is added.'}</span></div>`:'';
  const tabs=(m==='signin'||m==='signup')?`<div class="sba-tabs" role="tablist">${[['signin','Sign in'],['signup','Create account']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${m===k}" data-act="sb-auth-mode" data-val="${k}" data-testid="sb-auth-tab-${k}" class="sba-tab${m===k?' on':''}">${l}</button>`).join('')}</div>`:'';
  const email=m!=='newpw'?`<label class="sba-f"><span>Email</span><input id="sb-email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" value="${esc(_sbEmail)}" placeholder="you@example.com" data-testid="sb-auth-email"></label>`:'';
  const pw=m!=='reset'?`<label class="sba-f"><span>${m==='newpw'?'New password':'Password'}</span><span class="sba-pw"><input id="sb-pw" type="password" autocomplete="${m==='signin'?'current-password':'new-password'}" placeholder="${m==='signin'?'Your password':'At least 6 characters'}" data-testid="sb-auth-password"><button type="button" data-act="sb-pw-toggle" aria-label="Show password" data-testid="sb-auth-pw-toggle"><i data-lucide="eye"></i></button></span></label>`:'';
  const cta={signin:'Sign in',signup:'Create account',reset:'Send reset link',newpw:'Update password'}[m];
  const foot=m==='signin'?`<button type="button" data-act="sb-auth-mode" data-val="reset" data-testid="sb-auth-forgot" class="sba-link">Forgot password?</button>`:m==='reset'?`<button type="button" data-act="sb-auth-mode" data-val="signin" data-testid="sb-auth-back" class="sba-link">Back to sign in</button>`:'';
  return `<div class="sba-modal" data-testid="sb-auth" data-mode="${m}">${hero(m==='newpw'||m==='reset'?'key-round':m==='signup'?'sparkles':'user-round')}${banner}${tabs}<form data-sb-form class="sba-form" novalidate>${email}${pw}<p id="sb-msg" class="sba-msg" role="status" aria-live="polite" data-testid="sb-auth-msg"></p><button type="submit" data-testid="sb-auth-submit" class="sba-btn is-primary lg press"${off?' disabled':''}><i data-lucide="loader-circle" class="sba-spin"></i><span>${cta}</span></button></form>${foot?`<div class="sba-foot">${foot}</div>`:''}<p class="sba-fine">Only your name, @username, photo and bio sync. Everything else stays on this device.</p></div>`; }
function sbAuthRender(mode){ if(mode) _sbMode=mode; const em=document.getElementById('sb-email'); if(em) _sbEmail=em.value.trim();
  const open=document.querySelector('#modal2 .sba-modal'); if(open){ const t=document.createElement('div'); t.innerHTML=sbAuthHtml(); open.replaceWith(t.firstElementChild); } else { $("#modal2").innerHTML=modal2Wrap(sbAuthHtml(),'sb-auth-modal'); syncScrollLock(); }
  icons(); if(window.innerWidth>=640){ const f=document.getElementById(_sbMode==='newpw'?'sb-pw':'sb-email'); if(f) setTimeout(()=>{ try{ f.focus(); }catch(e){} },80); } }
function sbMsg(kind,text){ const el=document.getElementById('sb-msg'); if(!el) return; el.textContent=text||''; el.className='sba-msg'+(kind==='err'?' is-err':kind==='ok'?' is-ok':''); }
function sbFormBusy(on){ const b=document.querySelector('#modal2 [data-testid="sb-auth-submit"]'); if(b){ b.disabled=!!on; b.classList.toggle('is-busy',!!on); } }
async function sbAuthSubmit(){ const m=_sbMode; const em=((document.getElementById('sb-email')||{}).value||'').trim(), pw=(document.getElementById('sb-pw')||{}).value||''; _sbEmail=em||_sbEmail;
  if(!sb) return sbMsg('err','Accounts aren\u2019t switched on yet.');
  if(m!=='newpw'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return sbMsg('err','Enter a valid email address.');
  if(m!=='reset'&&pw.length<6) return sbMsg('err','Passwords need at least 6 characters.');
  if(!navigator.onLine) return sbMsg('err','You\u2019re offline. Connect to the internet and try again.');
  sbMsg('',''); sbFormBusy(true);
  try{
    if(m==='signin'){ _sbJustAuthed=true; const {error}=await sb.auth.signInWithPassword({email:em,password:pw}); if(error){ _sbJustAuthed=false; throw error; } }
    else if(m==='signup'){ _sbJustAuthed=true; const {data,error}=await sb.auth.signUp({email:em,password:pw,options:{emailRedirectTo:sbRedirect()}}); if(error){ _sbJustAuthed=false; throw error; } if(!data.session){ _sbJustAuthed=false; _sbSentTo=em; sbAuthRender('sent'); return; } }
    else if(m==='reset'){ const {error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:sbRedirect()}); if(error) throw error; _sbSentTo=em; sbAuthRender('sent-reset'); return; }
    else if(m==='newpw'){ const {error}=await sb.auth.updateUser({password:pw}); if(error) throw error; closeModal2(); toast('Password updated','Use it next time you sign in'); }
  }catch(e){ sbMsg('err',sbErrText(e)); }
  finally{ sbFormBusy(false); } }
function sbObRow(){ if(sbUser()) return ''; if(onboard.step===0&&!state.profile) return `<p class="obx-acct" data-testid="onboarding-account-row"><span>Already on Treesh?</span><button type="button" data-act="sb-auth-open" data-val="signin" data-testid="onboarding-signin" class="obx-acct-btn press">Sign in</button><span class="obx-acct-or">or begin as a guest</span></p>`;
  if(onboard.step===4) return `<p class="obx-acct" data-testid="onboarding-account-row"><i data-lucide="hard-drive"></i><span>Saved on this device.</span><button type="button" data-act="sb-auth-open" data-val="signup" data-testid="onboarding-create-account" class="obx-acct-btn press">Create an account</button><span class="obx-acct-or">to use it anywhere.</span></p>`;
  return ''; }
function sbUnameField(uname){ const err=state._unameErr||''; return `<div><label class="mb-1.5 block text-xs uppercase tracking-wide text-white/50" for="set-uname">Username</label><div class="relative"><span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">@</span><input id="set-uname" data-testid="settings-username-input" value="${esc(uname)}" maxlength="20" autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="yourname" class="h-11 w-full rounded-2xl border ${err?'border-red-400/60':'border-white/15'} bg-white/5 pl-8 pr-4 text-sm outline-none focus:border-[color:var(--treesh-purple)]"></div><p id="set-uname-hint" data-testid="settings-username-hint" class="sba-uhint${err?' is-err':''}">${esc(err||(sbUser()?'Unique across Treesh. 3\u201320 letters, numbers, _ or .':'3\u201320 letters, numbers, _ or . Claimed when you sign in.'))}</p></div>`; }

document.addEventListener('submit',e=>{ const f=e.target; if(f&&f.matches&&f.matches('form[data-sb-form]')){ e.preventDefault(); sbAuthSubmit(); } });
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return;
  switch(t.dataset.act){
    case 'sb-auth-open': if(t.dataset.val==='newpw'&&!sbUser()){ sbAuthOpen('signin'); break; } sbAuthOpen(t.dataset.val); break;
    case 'sb-auth-mode': sbAuthRender(t.dataset.val); break;
    case 'sb-auth-close': closeModal2(); break;
    case 'sb-pw-toggle': { const i=document.getElementById('sb-pw'); if(!i) break; const show=i.type==='password'; i.type=show?'text':'password'; t.setAttribute('aria-label',show?'Hide password':'Show password'); t.innerHTML=`<i data-lucide="${show?'eye-off':'eye'}"></i>`; icons(); break; }
    case 'sb-sync-now': if(!navigator.onLine){ sbSet('offline',SB_OFFLINE); break; } sbPull().then(r=>{ if(r==='pulled'||r==='pushed') toast('Profile synced','Up to date on all your devices'); }); break;
    case 'sb-signout': if(!sb) break; openConfirm('Sign out?','Your profile stays on this device. Sign back in any time to sync it again.',()=>{ sb.auth.signOut({scope:'local'}); }); break;
  } });
