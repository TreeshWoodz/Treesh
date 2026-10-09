/* ---------- P9g: Treesh accounts (Supabase). Optional sign in; the profile syncs, localStorage stays the cache ---------- */
let _sbOut=false, _sbAssetRev=0, _sbAssetDone=-1, _sbBusy=false, _sbAgain=false, _sbJustAuthed=false, _sbMode='signin', _sbEmail='', _sbSentTo='', _sbUnameIn='';
const SB_UNAME=/^[a-z0-9_.]{3,20}$/;
const SB_HOME='https://treesh.app/', SB_CONFIRM_URL=(/(^|\.)treesh\.app$/.test(location.hostname)?SB_HOME:location.origin+location.pathname.replace(/[^/]*$/,''))+'confirm-signup';
const SB_OFFLINE='You\u2019re offline. Changes will sync when you\u2019re back.';
function sbReady(){ return !!sb; }
function sbConfigured(){ return SB_KEY!=='YOUR_SB_PUBLISHABLE_KEY'; }
function sbUser(){ return state.sbUser||null; }
function sbMeta(patch){ const m=Object.assign({pending:false,at:0,uid:null},LS.get('treesh_sb_meta',{})||{}); if(patch){ Object.assign(m,patch); LS.set('treesh_sb_meta',m); } return m; }
function sbSig(d){ return d?(d.length+':'+d.slice(-48)):''; }
function sbRedirect(){ return /(^|\.)treesh\.app$/.test(location.hostname)?SB_HOME:location.origin+location.pathname; }
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

/* ---- sync engine: profile row + a settings backup, at most once every 30s. Custom music never leaves this device ---- */
const SB_GAP=30000;
const SB_LOCAL=['treesh_sb_meta','treesh_mm_order','treesh_resume','treesh_wx','treesh_perf','treesh_perf_opts','treesh_eq_ios_ack'];
let _sbTimer=0, _sbLast=0, _sbDirty=false, _sbQuiet=false, _sbBootPending=null;
function sbSyncKey(k){ return !!k&&TRANSFER_PREFIXES.some(p=>k.indexOf(p)===0)&&!SB_LOCAL.includes(k)&&k!==CATALOG_KEY; }
function sbQuietSet(k,v){ _sbQuiet=true; try{ LS.set(k,v); }finally{ _sbQuiet=false; } }
(function(){ const _set=LS.set; LS.set=function(k,v){ const r=_set.call(LS,k,v); if(!_sbQuiet&&sbSyncKey(k)) sbDirty(); return r; }; })();
function sbSet(s,msg){ state.sbSync={s,msg:msg||''}; sbPaint(); }
function sbRerender(){ try{ renderShell(); renderView(); renderSidebarLibrary(); if(state.profileOpen) renderProfile(); }catch(e){} }
function sbDirty(){ if(!sb) return; if(!_sbDirty){ _sbDirty=true; sbMeta({pending:true}); } if(sbUser()) sbSchedule(false); }
function sbSchedule(now){ if(!sb||!sbUser()) return; if(!navigator.onLine){ sbSet('offline',SB_OFFLINE); return; }
  const wait=now?0:Math.max(2000,_sbLast+SB_GAP-Date.now());
  if(_sbTimer){ if(!now) return; clearTimeout(_sbTimer); }
  _sbTimer=setTimeout(()=>{ _sbTimer=0; sbPush(); },wait); }
function sbQueuePush(now){ if(!sb) return; sbDirty(); if(now) sbSchedule(true); }
function sbFlush(){ if(!sbUser()||!_sbDirty||_sbBusy||!navigator.onLine) return; clearTimeout(_sbTimer); _sbTimer=0; sbPush(); }
async function sbAvatarUpload(uid,d){ const b=await (await fetch(d)).blob(); const ext=((b.type||'image/jpeg').split('/')[1]||'jpg').replace('jpeg','jpg'); const path=uid+'/avatar.'+ext;
  const {error}=await sb.storage.from('avatars').upload(path,b,{upsert:true,contentType:b.type||'image/jpeg',cacheControl:'3600'}); if(error) throw error;
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl+'?v='+Date.now(); }
function sbAssetSig(list){ return list.map(r=>r.id+':'+sbSig(typeof r.value==='string'?r.value:JSON.stringify(r.value==null?'':r.value))).join('|'); }
const sbAssetOne=v=>sbSig(typeof v==='string'?v:JSON.stringify(v==null?'':v));
const sbAssetSigs=list=>{ const o={}; list.forEach(r=>{ if(r&&r.id) o[r.id]=sbAssetOne(r.value); }); return o; };
async function sbPayload(u,lsOnly){ const ls={};
  for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(sbSyncKey(k)){ try{ ls[k]=localStorage.getItem(k); }catch(e){} } }
  const m=sbMeta(); let assetsPath=m.assetsPath||null, assetSigs=m.assetBase||null;
  if(!lsOnly&&(_sbAssetDone!==_sbAssetRev||!m.assetSig)) try{ const rev=_sbAssetRev, all=((await assetAll())||[]).filter(r=>r&&r.id); const sig=sbAssetSig(all);
    if(sig!==m.assetSig){ const path=u.id+'/assets.json';
      if(all.length){ const data=await new Blob([JSON.stringify(all.map(r=>({id:r.id,value:r.value})))],{type:'application/json'}).arrayBuffer(); const {error}=await sb.storage.from('treesh-data').upload(path,data,{upsert:true,contentType:'application/json'}); if(error) throw error; assetsPath=path; }
      else assetsPath=null;
      assetSigs=sbAssetSigs(all); sbMeta({assetSig:sig,assetsPath,assetBase:assetSigs}); } _sbAssetDone=rev; }
  catch(e){ console.warn('Treesh sync: fonts & backgrounds skipped',e); }
  return {app:'treesh',type:'treesh-backup',v:5,exportedAt:new Date().toISOString(),localStorage:ls,assetsPath,assetSigs}; }
async function sbPush(){ const u=sbUser(); if(!sb||!u) return;
  if(_sbBusy){ _sbAgain=true; return; }
  if(!state.profile){ _sbDirty=true; sbMeta({pending:true}); return; }
  try{ const pu=localStorage.getItem('sbx_pending_uname'); if(pu){ if(!state.profile.username){ state.profile.username=pu; sbQuietSet('treesh_profile',state.profile); } localStorage.removeItem('sbx_pending_uname'); } }catch(e){}
  _sbBusy=true; _sbLast=Date.now(); _sbDirty=false; sbSet('saving'); let avErr=null;
  try{
    const p=Object.assign({},state.profile||{}); let av=p.avatarUrl||null;
    if(!p.avatar) av=null;
    else if(/^data:image\//.test(p.avatar)){ const sig=sbSig(p.avatar); if(sig!==p.avatarSig||!av){ try{ av=await sbAvatarUpload(u.id,p.avatar); p.avatarSig=sig; }catch(e){ avErr=e; av=p.avatarUrl||null; } } }
    else if(/^https?:/.test(p.avatar)) av=p.avatar;
    const pr=await sb.from('profiles').upsert({id:u.id,username:p.username||null,display_name:p.nickname||null,avatar_url:av,bio:p.bio||null}); if(pr.error) throw pr.error;
    const cur=state.profile; if(cur){ Object.assign(cur,{avatarUrl:av,avatarSig:p.avatarSig||'',usernameSynced:p.username||''}); sbQuietSet('treesh_profile',cur); }
    const payload=await sbPayload(u), at=new Date().toISOString();
    const {error}=await sb.from('user_data').upsert({user_id:u.id,data:payload,updated_at:at}); if(error) throw error;
    sbMeta({pending:_sbDirty||!!avErr,at:Date.now(),uid:u.id,cloudAt:Date.parse(at)});
    if(avErr){ console.warn('Treesh avatar',avErr); sbSet('error','Synced, but your photo didn\u2019t upload: '+sbErrText(avErr)); } else sbSet('synced');
  }catch(e){ sbFail(e); }
  finally{ _sbBusy=false; if(_sbAgain||_sbDirty){ _sbAgain=false; if(sbMeta().pending) sbSchedule(false); } } }
function sbFail(e){ const code=e&&e.code, msg=((e&&(e.message||''))+' '+((e&&e.details)||'')).trim();
  if(code==='23505'&&/username/i.test(msg)){ const p=state.profile||{}; const tried=p.username; p.username=p.usernameSynced||''; LS.set('treesh_profile',p);
    state._unameErr='@'+tried+' is taken. Try another one.'; state._pfDraft=Object.assign({},state._pfDraft||{},{uname:tried}); state.settingsEditProfile=true;
    toast('That username is taken','@'+tried+' belongs to someone else'); sbSet('error','@'+tried+' is taken, so your username wasn\u2019t changed.'); _sbAgain=true; sbRerender(); return; }
  sbMeta({pending:true});
  if(!navigator.onLine||sbIsNet(msg)){ sbSet('offline',SB_OFFLINE); return; }
  console.warn('Treesh sync',e); sbSet('error',sbErrText(e)); }
async function sbRestore(b){ if(!b||b.type!=='treesh-backup'||!b.localStorage||typeof b.localStorage!=='object') return false; const src=b.localStorage; let changed=false;
  const rm=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(sbSyncKey(k)&&!(k in src)) rm.push(k); }
  rm.forEach(k=>{ try{ localStorage.removeItem(k); changed=true; }catch(e){} });
  Object.keys(src).forEach(k=>{ if(!sbSyncKey(k)) return; const v=src[k]; try{ if(localStorage.getItem(k)===v) return; localStorage.setItem(k,v); changed=true; }catch(e){ if(isQuotaError(e)) notifyStorageFull(); } });
  if(b.assetsPath){ try{ const {data,error}=await sb.storage.from('treesh-data').download(b.assetsPath); if(error) throw error; const list=(JSON.parse(await data.text())||[]).filter(a=>a&&a.id);
      /* a banner, background or font this device changed since the last sync stays; everything else comes from the account */
      const m=sbMeta(), base=m.uid&&m.uid===(sbUser()||{}).id?m.assetBase:null, loc=base?sbAssetSigs(((await assetAll())||[]).filter(r=>r&&r.id)):null; let kept=false;
      for(const a of list){ if(loc&&a.id in loc){ if(loc[a.id]===sbAssetOne(a.value)) continue; if(loc[a.id]!==base[a.id]){ kept=true; continue; } } try{ await assetPut(a.id,a.value); changed=true; }catch(e){} }
      const all=((await assetAll())||[]).filter(r=>r&&r.id), cs=sbAssetSig(list); sbMeta({assetSig:cs,assetsPath:b.assetsPath,assetBase:sbAssetSigs(list)}); if(kept||sbAssetSig(all)!==cs){ _sbAssetRev++; sbDirty(); } }
    catch(e){ console.warn('Treesh sync: fonts & backgrounds not restored',e); } }
  return changed; }
async function sbPull(o){ o=o||{}; const u=sbUser(); if(!sb||!u) return 'none';
  state._sbPulled=Date.now(); sbSet('saving');
  try{ const m=sbMeta(), mine=m.uid===u.id; const pend=_sbBootPending!=null?_sbBootPending:(m.pending||_sbDirty); _sbBootPending=null;
    const [cr,pr]=await Promise.all([sb.from('user_data').select('updated_at').eq('user_id',u.id).maybeSingle(), sb.from('profiles').select('id,username,display_name,avatar_url,bio,created_at').eq('id',u.id).maybeSingle()]);
    if(pr.error) throw pr.error; if(cr.error) throw cr.error;
    state._sbHadProfile=!!pr.data;
    if(pr.data&&!(mine&&pend)) sbApply(pr.data);
    const cAt=(cr.data&&Date.parse(cr.data.updated_at||''))||0;
    if(!cr.data||(mine&&pend)){ await sbPush(); return 'pushed'; }
    if(mine&&m.cloudAt&&cAt<=m.cloudAt+1000){ sbMeta({at:Date.now()}); sbSet('synced'); return 'same'; }
    if(o.restore===false){ sbSet('synced'); return 'later'; }
    const full=await sb.from('user_data').select('data,updated_at').eq('user_id',u.id).maybeSingle(); if(full.error) throw full.error;
    const changed=await sbRestore(full.data&&full.data.data);
    _sbDirty=false; sbMeta({pending:false,at:Date.now(),uid:u.id,cloudAt:cAt}); sbSet('synced');
    return changed?'pulled':'same';
  }catch(e){ sbFail(e); return 'error'; } }
function sbReload(force){ let last=0; try{ last=+sessionStorage.getItem('treesh_sb_rl')||0; }catch(e){} if(!force&&Date.now()-last<30000){ sbRerender(); toast('Synced from your account'); return; }
  try{ sessionStorage.setItem('treesh_sb_rl',String(Date.now())); sessionStorage.setItem('treesh_sb_hello','1'); }catch(e){} toast('Synced from your account','Loading your Treesh\u2026'); setTimeout(()=>{ try{ location.reload(); }catch(e){} },700); }
function sbApply(r){ const before=JSON.stringify(state.profile||null); const p=Object.assign({},state.profile||{});
  p.nickname=r.display_name||p.nickname||'Treesh Fan'; p.username=r.username||''; p.usernameSynced=p.username; p.bio=r.bio||'';
  const c=Date.parse(r.created_at||''); if(c&&(!p.joined||c<p.joined)) p.joined=c;
  if(r.avatar_url){ if(r.avatar_url!==p.avatarUrl){ p.avatarUrl=r.avatar_url; p.avatar=r.avatar_url; p.avatarSig=''; sbCacheAvatar(r.avatar_url); } }
  else if(p.avatarUrl){ p.avatar=''; p.avatarUrl=null; p.avatarSig=''; }
  state.profile=p; sbQuietSet('treesh_profile',p); if(JSON.stringify(p)!==before) sbRerender(); }
function sbCacheAvatar(url){ fetch(url).then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{ if(b.size>400*1024) throw 0; return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(b); }); })
  .then(d=>{ const p=state.profile; if(!p||p.avatarUrl!==url) return; p.avatar=d; p.avatarSig=sbSig(d); sbQuietSet('treesh_profile',p); }).catch(()=>{}); }

/* ---- sign out: save to the account first, then reset this device to a fresh start ---- */
const SB_KEEP=['treesh_mm_order','treesh_um','treesh_wx','treesh_perf','treesh_perf_opts','treesh_eco','treesh_eq_ios_ack','treesh_cookie'];
async function sbSignOut(){ if(!sb||_sbOut) return; const u=sbUser(); _sbOut=true; toast('Signing out\u2026','Saving your profile to your account');
  if(u&&(_sbDirty||sbMeta().pending)){ clearTimeout(_sbTimer); _sbTimer=0; for(let i=0;i<40&&_sbBusy;i++) await new Promise(r=>setTimeout(r,250));
    if(navigator.onLine) await Promise.race([sbPush(),new Promise(r=>setTimeout(r,15000))]);
    if(sbMeta().pending){ _sbOut=false; openConfirm('Your latest changes aren\u2019t saved yet',navigator.onLine?'We couldn\u2019t reach your account. If you sign out now, changes since your last sync are lost. Cancel to keep them and try again.':'You\u2019re offline. If you sign out now, changes since your last sync are lost. Cancel and sign out when you\u2019re back online.',()=>{ _sbOut=true; sbSignOutNow(); }); return; } }
  sbSignOutNow(); }
async function sbSignOutNow(){ try{ audio.pause(); }catch(e){} try{ await sb.auth.signOut({scope:'local'}); }catch(e){} await sbResetDevice();
  try{ sessionStorage.setItem('treesh_signed_out','1'); }catch(e){} setTimeout(()=>{ try{ location.replace(location.pathname); }catch(e){ location.reload(); } },300); }
async function sbResetDevice(){ const keep=k=>SB_KEEP.includes(k)||k===CATALOG_KEY||k.indexOf('__mock')===0; const ks=[];
  for(let i=0;i<localStorage.length;i++) ks.push(localStorage.key(i)); ks.forEach(k=>{ if(k&&!keep(k)) try{ localStorage.removeItem(k); }catch(e){} });
  try{ await assetClear(); }catch(e){} try{ sessionStorage.clear(); }catch(e){}
  const si=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(this===localStorage) return; return si.call(this,k,v); }; }
['assetPut','assetDel','assetClear'].forEach(n=>{ const f=window[n]; if(typeof f==='function') window[n]=function(){ _sbAssetRev++; return f.apply(this,arguments); }; });

/* ---- auth events ---- */
function sbObOpen(){ return !!document.querySelector('#modal [data-ob-root]'); }
function sbCloseAuth(){ if(document.querySelector('#modal2 .sba-modal')) closeModal2(); }
async function sbSignedIn(u){ const mine=_sbJustAuthed; _sbJustAuthed=false; if(mine){ sbCloseAuth(); toast('Signed in',u.email||''); }
  const r=await sbPull({restore:true});
  if(r==='pulled'||(mine&&r!=='error'&&(state._sbHadProfile||(state.profile&&state.profile.nickname)))){ sbReload(mine); return; }
  if(sbObOpen()){ if(state._sbHadProfile&&state.profile){ closeModal(); try{ checkDailyStars(); }catch(e){} sbRerender(); toast('Welcome back',state.profile.nickname||''); setTimeout(()=>{ try{ wnMaybeAuto(state.view); }catch(e){} },600); } else { if(onboard.step===0) onboard.step=1; try{ renderOnboarding(); }catch(e){} } } }
function sbSignedOut(){ if(_sbOut) return; clearTimeout(_sbTimer); _sbTimer=0; _sbDirty=false; state.sbSync={s:'idle',msg:''}; toast('Signed out','Sign back in any time to sync again'); sbPaint(); if(state.profileOpen) renderProfile(); }
function sbHandleCallback(cb){ if(cb.error_description||cb.error){ setTimeout(()=>toast('That link didn\u2019t work',cb.error_description||cb.error),900); return; }
  if(!cb.access_token||!cb.refresh_token) return;
  sb.auth.setSession({access_token:cb.access_token,refresh_token:cb.refresh_token}).then(({error})=>{ if(error){ toast('Couldn\u2019t sign you in',sbErrText(error)); return; }
    if(cb.type==='recovery') setTimeout(()=>sbAuthOpen('newpw'),500); else if(cb.type==='signup'||cb.type==='email'||cb.type==='invite') setTimeout(()=>toast('Email confirmed','You\u2019re signed in and syncing'),700); }); }
function sbInit(){ state.sbSync=state.sbSync||{s:'idle',msg:''}; try{ if(localStorage.getItem('sbx_confirmed')){ localStorage.removeItem('sbx_confirmed'); setTimeout(()=>toast('Email confirmed','Your Treesh account is ready'),1200); } }catch(e){} try{ if(sessionStorage.getItem('treesh_signed_out')){ sessionStorage.removeItem('treesh_signed_out'); setTimeout(()=>toast('Signed out','Sign in any time to get your profile back'),900); } }catch(e){} try{ if(sessionStorage.getItem('treesh_sb_hello')){ sessionStorage.removeItem('treesh_sb_hello'); setTimeout(()=>toast('Welcome back',(state.profile&&state.profile.nickname)?'Your Treesh is synced, '+state.profile.nickname:'Your Treesh is synced'),900); } }catch(e){} if(!sb) return; _sbBootPending=!!sbMeta().pending; _sbDirty=_sbBootPending;
  sb.auth.onAuthStateChange((ev,session)=>{ const u=(session&&session.user)||null, prev=state.sbUser; state.sbUser=u;
    if(ev==='PASSWORD_RECOVERY') setTimeout(()=>sbAuthOpen('newpw'),0);
    if(u&&(!prev||prev.id!==u.id)) setTimeout(()=>sbSignedIn(u),0); else if(!u&&prev) setTimeout(sbSignedOut,0); else setTimeout(sbPaint,0); });
  if(SB_CB) sbHandleCallback(SB_CB);
  window.addEventListener('online',()=>{ if(sbUser()&&sbMeta().pending) sbSchedule(false); else if(sbUser()) sbSet('idle'); });
  window.addEventListener('offline',()=>{ if(sbUser()) sbSet('offline',SB_OFFLINE); });
  window.addEventListener('storage',e=>{ if(e.key&&sbSyncKey(e.key)) sbDirty(); });
  window.addEventListener('pagehide',sbFlush);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'){ sbFlush(); return; }
    if(sbUser()&&navigator.onLine&&!_sbBusy&&Date.now()-(state._sbPulled||0)>60000){ if(_sbDirty) sbSchedule(false); else sbPull({restore:audio.paused}).then(r=>{ if(r==='pulled') sbReload(); }); } }); }

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
  else if(!u) body=head('cloud','Back up your profile','Sign in to keep your profile, playlists and settings on any device. Your custom music always stays on this device.')+`<div class="sba-perks">${[['refresh-cw','Syncs across devices'],['wifi-off','Still works offline'],['shield-check','Only you can edit it']].map(([i,l])=>`<span><i data-lucide="${i}"></i>${l}</span>`).join('')}</div><div class="sba-acts">${btn('sb-auth-open','signin','sb-card-signin','log-in','Sign in','is-primary')}${btn('sb-auth-open','signup','sb-card-signup','user-plus','Create account')}</div>`;
  else body=`<div class="sba-user"><span class="sba-av">${p.avatar?img(p.avatar,'h-full w-full object-cover'):`<b>${esc((p.nickname||'T').charAt(0).toUpperCase())}</b>`}</span><div class="min-w-0 flex-1"><p class="sba-name clamp-1" data-testid="sb-card-name">${esc(p.nickname||'Treesh Fan')}</p><p class="sba-mail clamp-1" data-testid="sb-card-email">${p.username?'@'+esc(p.username)+' \u00b7 ':''}${esc(u.email||'')}</p></div>${sbPill()}</div>${st.msg&&st.s!=='saving'?`<p class="sba-note${st.s==='error'?' is-err':''}" data-testid="sb-sync-msg">${esc(st.msg)}</p>`:''}<div class="sba-acts">${btn('sb-sync-now','','sb-sync-now','refresh-cw','Sync now','is-primary')}${btn('sb-auth-open','email','sb-change-email','at-sign','Change email')}${btn('sb-auth-open','newpw','sb-change-pw','key-round','Change password')}${btn('sb-signout','','sb-signout','log-out','Sign out','is-danger')}</div><button type="button" data-act="sb-delete-open" data-testid="sb-delete-account" class="sba-del press"><i data-lucide="trash-2"></i>Delete account</button>`;
  return `<section data-testid="sb-account-card" class="sba-card"><span class="sba-glow" aria-hidden="true"></span>${body}</section>`; }

/* ---- sign in / create account sheet ---- */
function sbAuthOpen(mode){ _sbMode=mode||'signin'; _sbSentTo=''; sbAuthRender(); }
function sbAuthHtml(){ const m=_sbMode, off=!sbReady();
  const T={signin:['Welcome back','Sign in to sync your Treesh profile.'],signup:['Create your account','Back up your profile and use it on any device.'],reset:['Reset your password','We\u2019ll email you a link to choose a new one.'],newpw:['Choose a new password','Use at least 6 characters.'],sent:['Check your email',`We sent a confirmation link to ${esc(_sbSentTo)}. Open it to finish signing up.`],'sent-reset':['Check your email',`If there\u2019s an account for ${esc(_sbSentTo)}, a reset link is on its way.`]}[m]||['',''];
  const hero=ic=>`<div class="sba-hero"><span class="sba-orb"><i data-lucide="${ic}"></i></span></div><h3 class="sba-mt">${T[0]}</h3><p class="sba-md">${T[1]}</p>`;
  if(m==='sent'||m==='sent-reset') return `<div class="sba-modal" data-testid="sb-auth-sent">${hero('mail-check')}<div class="sba-col"><button type="button" data-act="sb-auth-mode" data-val="signin" data-testid="sb-auth-back-signin" class="sba-btn is-primary lg press">Back to sign in</button>${m==='sent'?`<button type="button" data-act="sb-resend" data-testid="sb-auth-resend" class="sba-btn lg press"><i data-lucide="mail"></i>Resend email</button>`:''}<button type="button" data-act="sb-auth-close" data-testid="sb-auth-done" class="sba-btn lg press">Done</button></div></div>`;
  const banner=off?`<div class="sba-banner" data-testid="sb-auth-offline"><i data-lucide="cloud-off"></i><span>${sbConfigured()?'Can\u2019t reach Treesh accounts. Check your connection and try again.':'Accounts aren\u2019t switched on yet. They\u2019ll work once the Supabase key is added.'}</span></div>`:'';
  const tabs=(m==='signin'||m==='signup')?`<div class="sba-tabs" role="tablist">${[['signin','Sign in'],['signup','Create account']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${m===k}" data-act="sb-auth-mode" data-val="${k}" data-testid="sb-auth-tab-${k}" class="sba-tab${m===k?' on':''}">${l}</button>`).join('')}</div>`:'';
  const email=m!=='newpw'?`<label class="sba-f"><span>Email</span><input id="sb-email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" value="${esc(_sbEmail)}" placeholder="you@example.com" data-testid="sb-auth-email"></label>`:'';
  const pw=m!=='reset'?`<label class="sba-f"><span>${m==='newpw'?'New password':'Password'}</span><span class="sba-pw"><input id="sb-pw" type="password" autocomplete="${m==='signin'?'current-password':'new-password'}" placeholder="${m==='signin'?'Your password':'At least 6 characters'}" data-testid="sb-auth-password"><button type="button" data-act="sb-pw-toggle" aria-label="Show password" data-testid="sb-auth-pw-toggle"><i data-lucide="eye"></i></button></span></label>`:'';
  const unf=m==='signup'?`<label class="sba-f"><span>Username</span><span class="sba-un"><b>@</b><input id="sb-uname" maxlength="20" autocapitalize="none" autocomplete="username" spellcheck="false" value="${esc(_sbUnameIn||((state.profile&&state.profile.username)||''))}" placeholder="yourname" data-testid="sb-auth-username"><i class="sba-un-st" id="sb-uname-st" aria-hidden="true"></i></span><span id="sb-uname-hint" class="sba-uhint" data-testid="sb-auth-username-hint">3\u201320 letters, numbers, _ or .</span></label>`:'';
  const cta={signin:'Sign in',signup:'Create account',reset:'Send reset link',newpw:'Update password'}[m];
  const foot=m==='signin'?`<button type="button" data-act="sb-auth-mode" data-val="reset" data-testid="sb-auth-forgot" class="sba-link">Forgot password?</button>`:m==='reset'?`<button type="button" data-act="sb-auth-mode" data-val="signin" data-testid="sb-auth-back" class="sba-link">Back to sign in</button>`:'';
  return `<div class="sba-modal" data-testid="sb-auth" data-mode="${m}">${hero(m==='newpw'||m==='reset'?'key-round':m==='signup'?'sparkles':'user-round')}${banner}${tabs}<form data-sb-form class="sba-form" novalidate>${unf}${email}${pw}<p id="sb-msg" class="sba-msg" role="status" aria-live="polite" data-testid="sb-auth-msg"></p><button type="submit" data-testid="sb-auth-submit" class="sba-btn is-primary lg press"${off?' disabled':''}><i data-lucide="loader-circle" class="sba-spin"></i><span>${cta}</span></button></form>${foot?`<div class="sba-foot">${foot}</div>`:''}<p class="sba-fine">Your profile, playlists and settings sync every 30 seconds. Custom music always stays on this device.</p></div>`; }
function sbAuthRender(mode){ if(mode) _sbMode=mode; const em=document.getElementById('sb-email'); if(em) _sbEmail=em.value.trim(); const un=document.getElementById('sb-uname'); if(un) _sbUnameIn=un.value.trim();
  const open=document.querySelector('#modal2 .sba-modal'); if(open){ const t=document.createElement('div'); t.innerHTML=sbAuthHtml(); open.replaceWith(t.firstElementChild); } else { $("#modal2").innerHTML=modal2Wrap(sbAuthHtml(),'sb-auth-modal'); syncScrollLock(); }
  icons(); if(window.innerWidth>=640){ const f=document.getElementById(_sbMode==='newpw'?'sb-pw':'sb-email'); if(f) setTimeout(()=>{ try{ f.focus(); }catch(e){} },80); } }
function sbMsg(kind,text){ const el=document.getElementById('sb-msg'); if(!el) return; el.textContent=text||''; el.className='sba-msg'+(kind==='err'?' is-err':kind==='ok'?' is-ok':''); }
function sbFormBusy(on){ const b=document.querySelector('#modal2 [data-testid="sb-auth-submit"]'); if(b){ b.disabled=!!on; b.classList.toggle('is-busy',!!on); } }
async function sbAuthSubmit(){ const m=_sbMode; const em=((document.getElementById('sb-email')||{}).value||'').trim(), pw=(document.getElementById('sb-pw')||{}).value||''; _sbEmail=em||_sbEmail;
  if(!sb) return sbMsg('err','Accounts aren\u2019t switched on yet.');
  if(m!=='newpw'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return sbMsg('err','Enter a valid email address.');
  if(m!=='reset'&&pw.length<6) return sbMsg('err','Passwords need at least 6 characters.');
  if(!navigator.onLine) return sbMsg('err','You\u2019re offline. Connect to the internet and try again.');
  let uname='';
  if(m==='signup'){ uname=String((document.getElementById('sb-uname')||{}).value||'').trim().replace(/^@+/,'').toLowerCase(); _sbUnameIn=uname;
    if(!uname) return sbMsg('err','Pick a username for your account.'); if(!SB_UNAME.test(uname)) return sbMsg('err','Usernames are 3\u201320 letters, numbers, _ or .');
    sbFormBusy(true); sbMsg('','Checking @'+uname+'\u2026'); const av=await sbUnameAvail(uname); sbFormBusy(false); unHint('sb-uname',av,uname);
    if(av==='taken') return sbMsg('err','@'+uname+' is already taken. Try another one.'); }
  sbMsg('',''); sbFormBusy(true);
  try{
    if(m==='signin'){ _sbJustAuthed=true; const {error}=await sb.auth.signInWithPassword({email:em,password:pw}); if(error){ _sbJustAuthed=false; throw error; } }
    else if(m==='signup'){ try{ localStorage.setItem('sbx_last_email',em); }catch(e){} _sbJustAuthed=true; const {data,error}=await sb.auth.signUp({email:em,password:pw,options:{emailRedirectTo:SB_CONFIRM_URL}}); if(error){ _sbJustAuthed=false; throw error; } if(uname){ if(state.profile){ state.profile.username=uname; LS.set('treesh_profile',state.profile); } else { try{ localStorage.setItem('sbx_pending_uname',uname); }catch(e){} } } if(!data.session){ _sbJustAuthed=false; _sbSentTo=em; sbAuthRender('sent'); return; } }
    else if(m==='reset'){ const {error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:sbRedirect()}); if(error) throw error; _sbSentTo=em; sbAuthRender('sent-reset'); return; }
    else if(m==='newpw'){ const {error}=await sb.auth.updateUser({password:pw}); if(error) throw error; closeModal2(); toast('Password updated','Use it next time you sign in'); }
  }catch(e){ sbMsg('err',sbErrText(e)); }
  finally{ sbFormBusy(false); } }
function sbWelcomeCta(){ if(onboard.guest) return `<button type="button" data-act="ob-next" data-testid="onboarding-next" class="obx-cta press obx-cta-xl w-full sm:w-auto">Continue <i data-lucide="arrow-right" style="width:18px;height:18px"></i></button>`;
  return `<div class="obx-wcta" data-testid="onboarding-auth-cta"><button type="button" data-act="sb-auth-open" data-val="signup" data-testid="onboarding-create-account" class="obx-cta press obx-cta-xl"><i data-lucide="user-plus" style="width:18px;height:18px"></i>Create account</button><button type="button" data-act="sb-auth-open" data-val="signin" data-testid="onboarding-signin" class="obx-cta press obx-cta-xl is-ghost"><i data-lucide="log-in" style="width:18px;height:18px"></i>Sign in</button></div>`; }
function sbObRow(){ if(sbUser()) return '';
  if(onboard.step===0&&!state.profile) return onboard.guest
    ?`<p class="obx-acct" data-testid="onboarding-account-row"><i data-lucide="user-round"></i><span>Exploring as a guest.</span><button type="button" data-act="sb-auth-open" data-val="signin" data-testid="onboarding-row-signin" class="obx-acct-btn press">Sign in</button><span class="obx-acct-or">or</span><button type="button" data-act="sb-auth-open" data-val="signup" data-testid="onboarding-row-signup" class="obx-acct-btn press">Create account</button></p>`
    :`<p class="obx-acct" data-testid="onboarding-account-row"><button type="button" data-act="ob-guest" data-testid="onboarding-guest" class="obx-acct-btn press">Continue as guest</button><span class="obx-acct-or">No signup, everything stays on this device.</span></p>`;
  if(onboard.step===4) return `<p class="obx-acct" data-testid="onboarding-account-row"><i data-lucide="hard-drive"></i><span>Saved on this device.</span><button type="button" data-act="sb-auth-open" data-val="signup" data-testid="onboarding-create-account" class="obx-acct-btn press">Create an account</button><span class="obx-acct-or">to use it anywhere.</span></p>`;
  return ''; }

/* ---- delete account: storage files, then the delete_user() function removes rows + the auth user ---- */
function sbDelHtml(){ return `<div class="sba-modal" data-testid="sb-delete-sheet"><div class="sba-hero"><span class="sba-orb is-danger"><i data-lucide="trash-2"></i></span></div><h3 class="sba-mt">Delete your account?</h3><p class="sba-md">This permanently removes your Treesh account, profile, photo, friends and synced backup from the cloud, then clears everything from this device too, including your custom music and settings.</p><form data-sb-del class="sba-form" novalidate><label class="sba-f"><span>Type DELETE to confirm</span><input id="sb-del-word" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DELETE" data-testid="sb-delete-input"></label><p id="sb-msg" class="sba-msg" role="status" aria-live="polite" data-testid="sb-delete-msg"></p><button type="submit" data-testid="sb-delete-confirm" class="sba-btn is-danger-fill lg press"><i data-lucide="loader-circle" class="sba-spin"></i><span>Delete forever</span></button><button type="button" data-act="sb-auth-close" data-testid="sb-delete-cancel" class="sba-btn lg press">Cancel</button></form></div>`; }
async function sbListAll(bucket,dir,depth){ const out=[]; const {data,error}=await sb.storage.from(bucket).list(dir,{limit:1000}); if(error) throw error;
  for(const it of (data||[])){ const p=dir+'/'+it.name; if(it.id==null&&depth>0) out.push(...await sbListAll(bucket,p,depth-1)); else if(it.id!=null) out.push(p); } return out; }
async function sbDeleteAccount(){ const u=sbUser(); if(!sb||!u) return; const w=((document.getElementById('sb-del-word')||{}).value||'').trim().toUpperCase();
  if(w!=='DELETE') return sbMsg('err','Type DELETE to confirm.'); if(!navigator.onLine) return sbMsg('err','You\u2019re offline. Connect to the internet and try again.');
  const b=document.querySelector('#modal2 [data-testid="sb-delete-confirm"]'); if(b){ b.disabled=true; b.classList.add('is-busy'); } sbMsg('','');
  clearTimeout(_sbTimer); _sbTimer=0; _sbDirty=false;
  try{
    for(const bk of ['avatars','treesh-data']){ try{ const files=await sbListAll(bk,u.id,3); if(files.length){ const {error}=await sb.storage.from(bk).remove(files); if(error) throw error; } }catch(e){ if(!/Bucket not found/i.test((e&&e.message)||'')) console.warn('Treesh delete files',bk,e); } }
    const {error}=await sb.rpc('delete_user'); if(error) throw error;
    try{ await sb.auth.signOut({scope:'local'}); }catch(e){}
    state.sbUser=null; state.sbSync={s:'idle',msg:''}; closeModal2(); toast('Account deleted','Clearing Treesh from this device\u2026');
    await sbWipeDevice(); setTimeout(()=>{ try{ location.replace(location.pathname); }catch(e){ location.reload(); } },900);
  }catch(e){ const m=(e&&e.message)||''; sbMsg('err',(e&&(e.code==='PGRST202'||e.code==='42883'))||/delete_user|Could not find the function/i.test(m)?'Account deletion isn\u2019t switched on yet. Run the delete_user SQL in Supabase.':sbErrText(e)); if(b){ b.disabled=false; b.classList.remove('is-busy'); } } }
function sbUnameField(uname){ const err=state._unameErr||''; return `<div><label class="mb-1.5 block text-xs uppercase tracking-wide text-white/50" for="set-uname">Username</label><div class="relative"><span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">@</span><input id="set-uname" data-testid="settings-username-input" value="${esc(uname)}" maxlength="20" autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="yourname" class="h-11 w-full rounded-2xl border ${err?'border-red-400/60':'border-white/15'} bg-white/5 pl-8 pr-4 text-sm outline-none focus:border-[color:var(--treesh-purple)]"></div><p id="set-uname-hint" data-testid="settings-username-hint" class="sba-uhint${err?' is-err':''}">${esc(err||(sbUser()?'Unique across Treesh. 3\u201320 letters, numbers, _ or .':'3\u201320 letters, numbers, _ or . Claimed when you sign in.'))}</p></div>`; }

document.addEventListener('submit',e=>{ const f=e.target; if(f&&f.matches&&f.matches('form[data-sb-form]')){ e.preventDefault(); sbAuthSubmit(); } else if(f&&f.matches&&f.matches('form[data-sb-del]')){ e.preventDefault(); sbDeleteAccount(); } });
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return;
  switch(t.dataset.act){
    case 'sb-auth-open': if(t.dataset.val==='newpw'&&!sbUser()){ sbAuthOpen('signin'); break; } sbAuthOpen(t.dataset.val); break;
    case 'sb-auth-mode': sbAuthRender(t.dataset.val); break;
    case 'ob-guest': onboard.guest=true; onboard.step=1; renderOnboarding(); break;
    case 'sb-delete-open': if(!sbUser()) break; $("#modal2").innerHTML=modal2Wrap(sbDelHtml(),'sb-delete-modal'); syncScrollLock(); icons(); break;
    case 'sb-resend': if(!sb||!_sbSentTo) break; t.disabled=true; sb.auth.resend({type:'signup',email:_sbSentTo,options:{emailRedirectTo:SB_CONFIRM_URL}}).then(({error})=>{ t.disabled=false; if(error) toast('Couldn\u2019t resend',sbErrText(error)); else toast('Email sent','Check your inbox for a new link'); }); break;
    case 'sb-auth-close': closeModal2(); break;
    case 'sb-pw-toggle': { const i=document.getElementById('sb-pw'); if(!i) break; const show=i.type==='password'; i.type=show?'text':'password'; t.setAttribute('aria-label',show?'Hide password':'Show password'); t.innerHTML=`<i data-lucide="${show?'eye-off':'eye'}"></i>`; icons(); break; }
    case 'sb-sync-now': if(!navigator.onLine){ sbSet('offline',SB_OFFLINE); break; } if(_sbBusy){ toast('Already syncing','Hang tight'); break; } if(_sbDirty||sbMeta().pending){ clearTimeout(_sbTimer); _sbTimer=0; sbPush().then(()=>{ if(state.sbSync&&state.sbSync.s==='synced') toast('Synced','Up to date on all your devices'); }); break; } sbPull({restore:true}).then(r=>{ if(r==='pulled') sbReload(); else if(r==='same'||r==='pushed') toast('Synced','Up to date on all your devices'); }); break;
    case 'sb-signout': if(!sb) break; openConfirm('Sign out?','We\u2019ll save everything to your account first, then reset Treesh to a fresh start. Your custom music stays. Sign back in any time to get it all back.',()=>{ sbSignOut(); }); break;
  } });
