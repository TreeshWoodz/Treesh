/* ---------- P9i: /confirm-signup, a Treesh page for Supabase email links (works on static hosting) ---------- */
const CF={on:/(^|[?&])route=confirm-signup(&|$)/.test(location.search)||/\/confirm-signup\/?(index\.html)?$/.test(location.pathname),st:'working',email:'',msg:'',reload:false,t:0};
const CF_Q=(()=>{ const q={}; try{ new URLSearchParams(location.search).forEach((v,k)=>{ q[k]=v; }); }catch(e){} return q; })();
if(CF.on){ try{ const keep=new URLSearchParams(location.search); ['route','token_hash','type','code','error','error_code','error_description'].forEach(k=>keep.delete(k)); const qs=keep.toString(); history.replaceState(null,'',location.pathname.replace(/confirm-signup\/?(index\.html)?$/,'')+(qs?'?'+qs:'')); }catch(e){} try{ CF.email=localStorage.getItem('sbx_last_email')||''; }catch(e){} }
function cfIsExpired(e){ const m=((e&&(e.error_code||e.code||''))+' '+((e&&(e.error_description||e.message||e.error))||'')); return /expired|invalid|otp|not found|already|flow state|jwt/i.test(m); }
function cfHtml(){ const s=CF.st;
  const V={working:['loader-circle','is-busy','Confirming your email\u2026','Hang tight, we\u2019re checking your link.'],
    ok:['circle-check','is-ok','Email confirmed!','Welcome to Treesh. You\u2019re signed in, and your profile, playlists and settings will sync across your devices.'],
    already:['circle-check','is-ok','You\u2019re all set','This email is already confirmed and you\u2019re signed in.'],
    expired:['clock-alert','is-warn','This link has expired','Confirmation links only work once and expire after a while. Enter your email and we\u2019ll send you a fresh one.'],
    error:['triangle-alert','is-warn','We couldn\u2019t confirm your email',CF.msg||'Something went wrong. Try the link again, or request a new one.']}[s];
  const mail=(s==='ok'||s==='already')&&CF.email?`<p class="cf-mail" data-testid="confirm-signup-email-chip"><i data-lucide="mail-check"></i><span>${esc(CF.email)}</span></p>`:'';
  const resend=(s==='expired'||s==='error')&&sb?`<form data-cf-resend class="cf-resend" novalidate><label class="sr-only" for="cf-email">Email</label><input id="cf-email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com" value="${esc(CF.email)}" data-testid="confirm-signup-email"><button type="submit" class="cf-btn press" data-testid="confirm-signup-resend"><i data-lucide="send"></i>Send new link</button></form><p id="cf-msg" class="cf-msg" role="status" aria-live="polite" data-testid="confirm-signup-msg"></p>`:'';
  const ret=s==='working'?'':`<div class="cf-acts"><button type="button" data-act="cf-return" data-testid="confirm-signup-return" class="cf-btn is-primary press">Return to Treesh<i data-lucide="arrow-right"></i></button></div>`;
  return `<div class="cf-bg" aria-hidden="true"><i></i><i></i><i></i></div><main class="cf-card" role="dialog" aria-modal="true" aria-labelledby="cf-t"><div class="cf-brand"><img src="${TREESH_LOGO}" alt="">Treesh</div><span class="cf-orb ${V[1]}" data-testid="confirm-signup-icon"><i data-lucide="${V[0]}"></i></span><h1 id="cf-t" class="cf-t" data-testid="confirm-signup-title">${V[2]}</h1><p class="cf-d" data-testid="confirm-signup-desc">${esc(V[3])}</p>${mail}${resend}${ret}<p class="cf-fine">Custom music always stays on your device.</p></main>`; }
function cfRender(){ let r=document.getElementById('cf-root'); if(!r){ r=document.createElement('div'); r.id='cf-root'; r.className='dark-surface'; r.setAttribute('data-testid','confirm-signup-page'); document.body.appendChild(r); }
  r.dataset.state=CF.st; r.innerHTML=cfHtml(); icons(); syncScrollLock(); }
function cfDone(st,msg,user){ clearTimeout(CF.t); CF.st=st; CF.msg=msg||''; if(user&&user.email){ CF.email=user.email; } if(st==='ok'||st==='already'){ try{ localStorage.removeItem('sbx_confirmed'); }catch(e){} } if(CF.on) cfRender(); }
function cfClose(){ if(CF.reload){ try{ sessionStorage.setItem('treesh_sb_hello','1'); sessionStorage.setItem('treesh_sb_rl',String(Date.now())); }catch(e){} location.reload(); return; }
  CF.on=false; const r=document.getElementById('cf-root'); if(r){ r.classList.add('is-out'); setTimeout(()=>{ r.remove(); syncScrollLock(); },300); }
  try{ sbRerender(); sbPaint(); }catch(e){} if(sbUser()&&state.profile) toast('Welcome to Treesh',state.profile.nickname||''); }
async function cfBoot(){ if(!CF.on) return; cfRender(); CF.t=setTimeout(()=>{ if(CF.st==='working') cfDone('error','This is taking longer than usual. Check your connection and try the link again.'); },15000);
  if(!sb){ cfDone('error',sbConfigured()?'Can\u2019t reach Treesh accounts right now. Check your connection and try the link again.':'Treesh accounts aren\u2019t switched on yet.'); return; }
  const cb=SB_CB||{};
  if(cb.type==='recovery'&&cb.access_token){ CF.on=false; clearTimeout(CF.t); const r=document.getElementById('cf-root'); if(r) r.remove(); syncScrollLock(); _sbHC9(cb); return; }
  const err=(cb.error||cb.error_description||cb.error_code)?cb:((CF_Q.error||CF_Q.error_description||CF_Q.error_code)?CF_Q:null);
  if(err){ cfDone(cfIsExpired(err)?'expired':'error',err.error_description||err.error); return; }
  try{
    if(cb.access_token&&cb.refresh_token){ const {data,error}=await sb.auth.setSession({access_token:cb.access_token,refresh_token:cb.refresh_token}); if(error) throw error; cfDone('ok','',data&&data.session&&data.session.user); return; }
    if(CF_Q.token_hash&&sb.auth.verifyOtp){ const {data,error}=await sb.auth.verifyOtp({token_hash:CF_Q.token_hash,type:CF_Q.type||'signup'}); if(error) throw error; cfDone('ok','',data&&(data.user||(data.session&&data.session.user))); return; }
    if(CF_Q.code&&sb.auth.exchangeCodeForSession){ const {data,error}=await sb.auth.exchangeCodeForSession(CF_Q.code); if(error) throw error; cfDone('ok','',data&&data.session&&data.session.user); return; }
    const g=sb.auth.getSession?await sb.auth.getSession():null; const u=g&&g.data&&g.data.session&&g.data.session.user; if(u){ cfDone('already','',u); return; }
    cfDone('expired');
  }catch(e){ cfDone(cfIsExpired(e)?'expired':'error',sbErrText(e)); } }
async function cfResend(){ const inp=document.getElementById('cf-email'), m=document.getElementById('cf-msg'), b=document.querySelector('[data-testid="confirm-signup-resend"]'); const em=((inp&&inp.value)||'').trim();
  const say=(k,t)=>{ if(m){ m.textContent=t; m.className='cf-msg'+(k?' is-'+k:''); } };
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){ say('err','Enter the email you signed up with.'); if(inp) inp.focus(); return; }
  if(!navigator.onLine){ say('err','You\u2019re offline. Connect to the internet and try again.'); return; }
  if(b) b.disabled=true; say('','Sending\u2026');
  try{ const {error}=await sb.auth.resend({type:'signup',email:em,options:{emailRedirectTo:SB_CONFIRM_URL}}); if(error) throw error; CF.email=em; try{ localStorage.setItem('sbx_last_email',em); }catch(e){} say('ok','Sent! Check your inbox for a new link.'); }
  catch(e){ say('err',sbErrText(e)); } finally{ if(b) b.disabled=false; } }
const _sbHC9=sbHandleCallback; sbHandleCallback=function(cb){ if(CF.on) return; return _sbHC9.apply(this,arguments); };
const _sbRl9=sbReload; sbReload=function(){ if(CF.on){ CF.reload=true; return; } return _sbRl9.apply(this,arguments); };
const _p9Init9=p9Init; p9Init=function(){ const r=_p9Init9.apply(this,arguments); try{ cfBoot(); }catch(e){ console.warn('confirm page',e); } return r; };
document.addEventListener('submit',e=>{ const f=e.target; if(f&&f.matches&&f.matches('form[data-cf-resend]')){ e.preventDefault(); cfResend(); } });
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="cf-return"]'); if(t) cfClose(); });
