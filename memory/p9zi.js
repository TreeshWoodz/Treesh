/* ---------- P9zi: Eco mode. Same Treesh look, lighter work. Turns itself on for older phones ---------- */
SB_LOCAL.push('treesh_eco','treesh_eco_ask','treesh_eco_user'); SB_KEEP.push('treesh_eco_ask','treesh_eco_user');
state.eco=!!LS.get('treesh_eco',false);
window._ecoT=window._ecoT||{};
const ECO_BLUR=10;
function ecoOn(){ return !!(state.eco&&!state.perfMode); }
/* decorative loops (beat glow, starfield, visualizer) draw every other frame; the starfield stops while a full screen covers it */
function ecoSkip(k){ if(!ecoOn()) return false; if(k==='stars'&&(document.hidden||document.documentElement.classList.contains('cv-hide'))) return true; const t=performance.now(), T=window._ecoT; if(t-(T[k]||0)<30) return true; T[k]=t; return false; }
function ecoSel(x){ if(!x||x.indexOf('html.eco')>=0) return ''; if(/^html\b/.test(x)) return x.replace(/^html/,'html.eco'); if(/^:root\b/.test(x)) return x.replace(/^:root/,':root.eco'); return 'html.eco '+x; }
/* one pass over the app's CSS: cap heavy glass blur, stop endless animations that repaint (glows, shimmers) but keep cheap motion */
let _ecoBuilt=false;
function ecoRules(){ if(_ecoBuilt) return; _ecoBuilt=true; const out=[], heavy=new Set(), cheap=/^(transform|opacity|translate|scale|rotate|offset|offset-.*|animation-timing-function|visibility|--.*)$/;
  const sheets=[...document.styleSheets].filter(s=>{ try{ return !!s.cssRules; }catch(e){ return false; } });
  const walk=(rules,fn)=>{ for(const r of rules){ if(r.type===1||r.type===7) fn(r); else if(r.cssRules) walk(r.cssRules,fn); } };
  sheets.forEach(s=>walk(s.cssRules,r=>{ if(r.type!==7) return; for(const k of r.cssRules){ for(let i=0;i<k.style.length;i++){ if(!cheap.test(k.style[i])){ heavy.add(r.name); return; } } } }));
  const cap=v=>v.replace(/blur\(\s*([\d.]+)px\s*\)/g,(m,n)=>'blur('+Math.min(+n,ECO_BLUR)+'px)');
  sheets.forEach(s=>walk(s.cssRules,r=>{ if(r.type!==1||!r.selectorText) return; const st=r.style;
    const bf=st.getPropertyValue('backdrop-filter')||st.getPropertyValue('-webkit-backdrop-filter'), tb=st.getPropertyValue('--tw-backdrop-blur');
    const an=st.getPropertyValue('animation-name'), it=st.getPropertyValue('animation-iteration-count');
    const blurFix=bf&&/blur\(/.test(bf)&&cap(bf)!==bf, twFix=tb&&/blur\(/.test(tb)&&cap(tb)!==tb, animFix=an&&/infinite/.test(it||'')&&an.split(',').some(n=>heavy.has(n.trim()));
    if(!blurFix&&!twFix&&!animFix) return; const sel=r.selectorText.split(',').map(x=>ecoSel(x.trim())).filter(Boolean).join(','); if(!sel) return;
    let d=''; if(blurFix){ const v=cap(bf); d+='backdrop-filter:'+v+' !important;-webkit-backdrop-filter:'+v+' !important;'; } if(twFix) d+='--tw-backdrop-blur:'+cap(tb)+';'; if(animFix) d+='animation:none !important;';
    out.push(sel+'{'+d+'}'); }));
  let el=document.getElementById('eco-rules'); if(!el){ el=document.createElement('style'); el.id='eco-rules'; document.head.appendChild(el); } el.textContent=out.join('\n'); }
function ecoApply(){ document.documentElement.classList.toggle('eco',ecoOn()); if(ecoOn()) (window.requestIdleCallback||setTimeout)(ecoRules,{timeout:600}); }
/* src 'auto' = Treesh decided; anything else is the person's own choice and auto never overrides it */
function ecoSet(on,src){ state.eco=!!on; LS.set('treesh_eco',state.eco); if(src!=='auto') LS.set('treesh_eco_user',state.eco?'on':'off');
  if(state.eco&&state.perfMode){ state.perfMode=false; LS.set('treesh_perf',false); applyPerfMode(); }
  ecoApply(); if(src!=='auto') toast(state.eco?'Eco mode on':'Eco mode off',state.eco?'Same look, lighter and smoother':'Full effects are back'); try{ if(state.view==='settings') renderView(); }catch(e){} }
const _apm9zi=applyPerfMode; applyPerfMode=function(){ const r=_apm9zi.apply(this,arguments); ecoApply(); return r; };

/* settings card with a live smoothness meter */
function ecoCardHtml(){ const on=ecoOn(), auto=on&&!LS.get('treesh_eco_user',null);
  return `<section class="eco-card${on?' on':''}" data-testid="eco-card"><span class="eco-leaf" aria-hidden="true"><i data-lucide="leaf"></i></span><div class="eco-txt"><b>Eco mode <em class="eco-tag" data-testid="eco-tag">${auto?'Auto':on?'On':'New'}</em></b><small>Same Treesh look, lighter on your phone. Softer glass, calmer effects and smoother scrolling. ${auto?'Turned on for you because this phone runs smoother with it.':'Turns on by itself on older phones like iPhone 11.'}</small>
   <div class="eco-meter" data-testid="eco-meter"><span class="eco-fps"><b id="eco-fps" data-testid="eco-fps">--</b> fps</span><span class="eco-bar"><i id="eco-bar"></i></span><em id="eco-word" data-testid="eco-smoothness">Measuring\u2026</em></div></div>
   <button type="button" role="switch" aria-checked="${on}" aria-label="Eco mode" data-act="eco-toggle" data-testid="eco-toggle" class="eco-sw press"><i></i></button></section>`; }
const _vSet9zi=viewSettings; viewSettings=function(){ const h=_vSet9zi.apply(this,arguments); const k='<button data-act="perf-mode-toggle"'; return h.indexOf(k)<0?h:h.replace(k,ecoCardHtml()+k); };
let _ecoMeter=0;
function ecoMeterLoop(){ if(_ecoMeter) return; let n=0, t0=performance.now(), last=t0, worst=0;
  const tick=t=>{ const fps=document.getElementById('eco-fps'); if(!fps){ _ecoMeter=0; return; } n++; worst=Math.max(worst,t-last); last=t;
    if(t-t0>=700){ const v=Math.round(n*1000/(t-t0)), w=v>=55&&worst<40?'Silky':v>=45?'Smooth':v>=30?'A bit busy':'Struggling'; fps.textContent=v; const b=document.getElementById('eco-bar'); if(b){ b.style.transform='scaleX('+Math.min(1,v/60).toFixed(2)+')'; b.dataset.lvl=v>=50?'ok':v>=35?'mid':'low'; } const wd=document.getElementById('eco-word'); if(wd) wd.textContent=w; n=0; t0=t; worst=0; }
    _ecoMeter=requestAnimationFrame(tick); }; _ecoMeter=requestAnimationFrame(tick); }
new MutationObserver(()=>{ if(!_ecoMeter&&document.getElementById('eco-fps')) ecoMeterLoop(); }).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a==='eco-toggle'){ ecoSet(!ecoOn()); return; }
  if(a==='eco-ask-yes'){ ecoAskClose(); return; }
  if(a==='eco-ask-no'){ ecoAskClose(); ecoSet(false); return; }
  if(a==='perf-mode-toggle'&&state.eco) setTimeout(()=>{ if(state.perfMode){ state.eco=false; LS.set('treesh_eco',false); ecoApply(); } },0); },true);
if(typeof SETTINGS_INDEX!=='undefined') SETTINGS_INDEX.push({id:'eco',label:'Eco mode',desc:'Same look, lighter and smoother on older phones',kw:'eco battery lag laggy slow smooth performance iphone old phone optimize',ic:'leaf',type:'toggle',get:()=>ecoOn(),toggle:()=>ecoSet(!ecoOn())});

/* automatic: older iPhones (2x screens like iPhone 11, XR, SE) and low-memory Android phones start in Eco; others get a quick smoothness check */
function ecoDevice(){ const ua=navigator.userAgent||'', dpr=window.devicePixelRatio||1, mem=navigator.deviceMemory||0, cores=navigator.hardwareConcurrency||0;
  if(/iPhone|iPod/.test(ua)&&dpr<=2) return true;
  return /Android/.test(ua)&&((mem>0&&mem<=4)||(cores>0&&cores<=4)); }
function ecoMayAuto(){ return !state.eco&&!state.perfMode&&!LS.get('treesh_eco_user',null)&&innerWidth<1024; }
function ecoAskClose(){ LS.set('treesh_eco_ask',1); const el=document.getElementById('eco-ask'); if(el){ el.classList.add('is-out'); setTimeout(()=>el.remove(),260); } }
function ecoNotice(){ if(document.getElementById('eco-ask')||LS.get('treesh_eco_ask',0)) return; const el=document.createElement('div'); el.id='eco-ask'; el.className='eco-ask dark-surface'; el.setAttribute('role','status'); el.setAttribute('data-testid','eco-auto-notice');
  el.innerHTML=`<span class="eco-leaf" aria-hidden="true"><i data-lucide="leaf"></i></span><div class="eco-txt"><b>Eco mode is on</b><small>We made Treesh lighter on this phone so it stays smooth. Same look. Change it any time in Settings.</small></div><div class="eco-ask-acts"><button type="button" data-act="eco-ask-no" data-testid="eco-auto-off" class="eco-ask-btn press">Turn off</button><button type="button" data-act="eco-ask-yes" data-testid="eco-auto-keep" class="eco-ask-btn is-on press">Keep it</button></div>`;
  document.body.appendChild(el); icons(); setTimeout(()=>{ if(document.getElementById('eco-ask')===el) ecoAskClose(); },12000); }
function ecoNoticeSoon(){ let n=0; const iv=setInterval(()=>{ if(++n>60){ clearInterval(iv); return; } if(!state.profile||document.hidden||document.querySelector('#modal [data-ob-root]')) return; clearInterval(iv); ecoNotice(); },2500); }
function ecoAutoOn(){ if(!ecoMayAuto()) return; ecoSet(true,'auto'); ecoNoticeSoon(); }
function ecoProbe(){ if(!ecoMayAuto()||document.hidden) return; let n=0, t0=0, last=0, long=0;
  const tick=t=>{ if(document.hidden) return; if(!t0){ t0=last=t; } n++; if(t-last>50) long++; last=t; if(t-t0<3000){ requestAnimationFrame(tick); return; } const fps=n*1000/(t-t0); if(fps<45||long>8) ecoAutoOn(); };
  requestAnimationFrame(tick); }
if(ecoMayAuto()&&ecoDevice()) ecoAutoOn(); else setTimeout(ecoProbe,6000);
ecoApply();
