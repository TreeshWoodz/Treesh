/* ---------- P9zc: Edit profile, guests see Create account first, no @username until signed in, email + password fields ---------- */
function pfCredFields(){ const u=sbUser(); if(!u) return '';
  const f=(lab,ic,val,vid,act,tid)=>`<div><label class="mb-1.5 block text-xs uppercase tracking-wide text-white/50">${lab}</label><div class="pf-cred h-11 rounded-2xl border border-white/15 bg-white/5"><i data-lucide="${ic}" class="text-white/40"></i><span class="clamp-1 flex-1 text-sm"${vid?` id="${vid}" data-testid="${vid}"`:''}>${val}</span><button type="button" data-act="sb-auth-open" data-val="${act}" data-testid="${tid}" class="pf-cred-btn press">Change</button></div></div>`;
  return f('Email','mail',esc(u.email||''),'settings-email-value','email','settings-change-email')+f('Password','key-round','\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022','','newpw','settings-change-password'); }
const _sbUF9zc=sbUnameField; sbUnameField=function(){ if(!sbUser()) return ''; return _sbUF9zc.apply(this,arguments)+pfCredFields(); };
const _pfAcct9zc=pfAcctHtml; pfAcctHtml=function(){ const u=sbUser();
  if(!u){ if(!sbReady()) return _pfAcct9zc.apply(this,arguments);
    return `<section class="pfa-card pfa-guest" data-testid="pf-account-card"><div class="pfa-head"><span class="pfa-ic"><i data-lucide="user-plus"></i></span><div class="min-w-0 flex-1"><h3>Create your Treesh account</h3><p>Claim your @username, back up your profile and find friends on any device.</p></div></div><div class="pfa-foot"><button type="button" data-act="sb-auth-open" data-val="signup" data-testid="pf-acct-signup" class="sba-btn is-primary press"><i data-lucide="user-plus"></i>Create account</button><button type="button" data-act="sb-auth-open" data-val="signin" data-testid="pf-acct-signin" class="sba-btn press"><i data-lucide="log-in"></i>Sign in</button></div></section>`; }
  const t=document.createElement('div'); t.innerHTML=_pfAcct9zc.apply(this,arguments);
  t.querySelectorAll('[data-testid="pf-acct-email"],[data-testid="pf-acct-password"]').forEach(x=>x.remove());
  return t.innerHTML; };
const _sph9zc=settingsProfileHtml; settingsProfileHtml=function(editing){ const h=_sph9zc.apply(this,arguments); if(!editing||sbUser()) return h;
  const card='<div class="mt-6">'+pfAcctHtml()+'</div>', k='<h2 class="text-lg font-bold">Edit profile</h2></div>', i=h.indexOf(k);
  if(i<0||h.indexOf(card)<0) return h;
  const out=h.replace(card,''), j=out.indexOf(k)+k.length; return out.slice(0,j)+'<div class="mt-4" data-testid="pf-guest-account-top">'+pfAcctHtml()+'</div>'+out.slice(j); };
const _sbPaint9zc=sbPaint; sbPaint=function(){ const r=_sbPaint9zc.apply(this,arguments); try{ const e=document.getElementById('settings-email-value'), u=sbUser(); if(e&&u) e.textContent=u.email||''; }catch(x){} return r; };

/* ---------- P9zc: Instrum toolbar sticks exactly 6px under the top bar on phones ---------- */
function ixTpSync(){ const r=document.querySelector('.ix-root.is-ph'), tb=document.querySelector('header .topbar-surface'); if(!r||!tb) return; const h=tb.closest('header'); const b=(h?h.getBoundingClientRect().top:0)+tb.offsetTop+tb.offsetHeight; r.style.setProperty('--ixtp',Math.max(6,Math.round(b+6))+'px'); }
const _iar9zc=iAfterRender; iAfterRender=function(){ const r=_iar9zc.apply(this,arguments); try{ ixTpSync(); }catch(e){} return r; };
window.addEventListener('resize',()=>{ try{ ixTpSync(); }catch(e){} },{passive:true});

/* ---------- P9zc: Icons + Settings headings use the Games & Things heading style ---------- */
const _va9zc=viewArtists; viewArtists=function(){ return _va9zc.apply(this,arguments).replace('<p class="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">The Collective</p><h1 class="mt-1 text-3xl font-bold sm:text-4xl">The Icons</h1>','<p class="st3-hk">The Collective</p><h1 class="st3-h1" data-testid="icons-title"><span>The Icons</span></h1>'); };
const _sh9zc=settingsHeadHtml; settingsHeadHtml=function(){ return _sh9zc.apply(this,arguments).replace('<p class="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Treesh</p><h1 class="mt-1 text-3xl font-bold sm:text-4xl">Settings</h1>','<p class="st3-hk">Make it yours</p><h1 class="st3-h1" data-testid="settings-title"><span>Settings</span></h1>'); };
