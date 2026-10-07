/* ---------- P9j: Siri voice (orb rises from the bottom, no frame, no scrolling) ---------- */
let _vx3Type=false;
function vx3Mode(){ const m=_voiceMode; return (m==='denied'||m==='unsupported')?'off':m==='thinking'?'thinking':m==='speaking'?'speaking':m==='listening'?'listening':m==='paused'?'paused':'idle'; }
function vx3Status(){ const m=_voiceMode; return m==='denied'?'Microphone blocked':m==='unsupported'?'Voice not supported here':m==='paused'?'Paused \u00b7 tap the orb':m==='speaking'?'Speaking':m==='thinking'?'Working on it':m==='listening'?'Listening':'Tap the orb to talk'; }
function vx3Icon(){ const k=vx3Mode(); return k==='off'?'mic-off':k==='paused'?'mic-off':k==='thinking'?'loader':'mic'; }
function vx3Chips(){ const q=[["play my favorites","Play favorites"],["pause","Pause"],["next song","Next"],["shuffle","Shuffle"],["what's playing","What\u2019s playing"],["change theme to blue","Theme blue"],["dark mode","Dark mode"],["open studios","Studios"]];
  const macs=(_voiceMacros||[]).slice(0,6).map(mm=>`<button type="button" data-act="voice-run-macro" data-id="${mm.id}" class="vx3-chip is-mac press"><i data-lucide="wand-2"></i>${esc(mm.phrase)}</button>`).join('');
  return `<div class="vx3-chips no-scrollbar" data-testid="voice-chips"><button type="button" data-act="vx3-type" data-testid="voice-type-toggle" aria-pressed="${_vx3Type}" class="vx3-chip is-ic press${_vx3Type?' on':''}" aria-label="Type a command"><i data-lucide="keyboard"></i></button><button type="button" data-act="voice-help-toggle" data-testid="voice-help-toggle" class="vx3-chip is-ic press${_voiceHelp?' on':''}" aria-label="All commands"><i data-lucide="list"></i></button>${q.map(x=>`<button type="button" data-act="voice-run" data-cmd="${esc(x[0])}" class="vx3-chip press">${esc(x[1])}</button>`).join('')}${macs}</div>`; }
function vx3TypeRow(){ return _vx3Type?`<div class="vx3-type"><input id="voice-input" data-testid="voice-type-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type a command\u2026" value="${esc(_voiceTyped||'')}"><button type="button" data-act="voice-send" data-testid="voice-send-button" aria-label="Run command" class="press"><i data-lucide="arrow-up"></i></button></div>`:''; }
voiceBodyHtml=function(){ const m=_voiceMode, off=m==='denied'||m==='unsupported';
  const said=off?`<p data-testid="voice-live-transcript" class="vx-said is-dim">${m==='denied'?'Allow microphone access in your browser, or type a command.':'This browser can\u2019t hear you, but you can type or tap a command.'}</p>`
    :m==='listening'?`<p id="voice-utext" data-testid="voice-live-transcript" class="vx-said${_voiceLast.user?'':' is-dim'}">${_voiceLast.user?esc(_voiceLast.user):'Go ahead, I\u2019m listening\u2026'}</p>`
    :`<p data-testid="voice-live-transcript" class="vx-said${_voiceLast.user?'':' is-dim'}">${_voiceLast.user?'\u201C'+esc(_voiceLast.user)+'\u201D':'What can I do for you?'}</p>`;
  const reply=_voiceLast.reply?`<div class="vx-reply" data-testid="voice-reply"><span class="vx-reply-k"><i data-lucide="sparkles"></i>Treesh</span><p>${esc(_voiceLast.reply)}</p></div>`:'';
  return `<div class="vx3-head"><button type="button" data-act="voice-speak" data-testid="voice-speak-toggle" aria-label="Toggle spoken replies" class="vx-ic press${_voiceSpeak?' is-on':''}"><i data-lucide="${_voiceSpeak?'volume-2':'volume-x'}"></i></button><span class="vx3-brand">Treesh</span><button type="button" data-act="voice-cancel" aria-label="Close" data-testid="voice-close-button" class="vx-ic press"><i data-lucide="x"></i></button></div>
  <div class="vx3-words">${said}${reply}</div>
  <div class="vx3-dock">${_voiceHelp?`<div class="vx3-help no-scrollbar" data-testid="voice-help">${voiceHelpPanel()}</div>`:''}${vx3TypeRow()}${vx3Chips()}${off?`<button type="button" data-act="voice-retry" data-testid="voice-retry" class="vx3-retry press"><i data-lucide="rotate-ccw"></i>Try again</button>`:''}</div>`; };
showVoice=function(){ if($("#voice-ov")) return; const el=document.createElement('div'); el.id='voice-ov'; el.className='vx vx3'; el.dataset.mode=_voiceMode||'idle';
  el.innerHTML=`<div data-act="voice-cancel" class="vx-bd" data-testid="voice-backdrop"></div><div class="vx3-rise" aria-hidden="true"><i></i><i></i><i></i></div><div data-voice-panel data-testid="voice-listening-overlay" class="vx3-panel"><div data-voice-body class="vx3-body">${voiceBodyHtml()}</div><div class="vx3-orbwrap"><button type="button" data-act="voice-mic" data-testid="voice-listening-orb" aria-label="Toggle microphone" class="vx-orb press is-${vx3Mode()}"><span class="vx-blob b1"></span><span class="vx-blob b2"></span><span class="vx-blob b3"></span><span class="vx-blob b4"></span><span class="vx-core"><i data-lucide="${vx3Icon()}"></i></span></button><p class="vx-status" id="vx3-status" data-testid="voice-status">${esc(vx3Status())}</p></div></div>`;
  el.addEventListener('click',e=>{ const t=e.target; if(!t||!t.closest||t.closest('[data-act],button,input,textarea,select,a,label,.vx-said,.vx-reply,.vx3-dock,.vx3-head')) return; stopVoice(); });
  document.body.appendChild(el); icons(); syncScrollLock(); };
const _vxRender9=voiceRender;
voiceRender=function(){ const el=$("#voice-ov"); if(!el||!el.classList.contains('vx3')) return _vxRender9.apply(this,arguments); el.dataset.mode=_voiceMode||'idle';
  const body=el.querySelector('[data-voice-body]'); const ae=document.activeElement, typing=!!(ae&&ae.id==='voice-input'), caret=typing?ae.selectionStart:null;
  body.innerHTML=voiceBodyHtml();
  const o=el.querySelector('.vx-orb'); if(o){ o.className='vx-orb press is-'+vx3Mode(); const core=o.querySelector('.vx-core'); if(core&&core.dataset.ic!==vx3Icon()){ core.dataset.ic=vx3Icon(); core.innerHTML=`<i data-lucide="${vx3Icon()}"></i>`; } }
  const st=el.querySelector('#vx3-status'); if(st) st.textContent=vx3Status();
  icons(); if(typing){ const ni=$("#voice-input"); if(ni){ try{ ni.focus(); if(caret!=null) ni.setSelectionRange(caret,caret); }catch(e){} } } };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="vx3-type"]'); if(!t) return; _vx3Type=!_vx3Type; voiceRender(); if(_vx3Type) setTimeout(()=>{ const i=$("#voice-input"); if(i) i.focus(); },30); });

/* ---------- P9j: Magic Markup, tap anything inside a section (on by default) ---------- */
function mkdEnable(quiet){ if(_mkd.on||!state.mkEdit||!mkCurPage()) return; _mkd.on=true; _mkd.key=null; _mkd.el=null; _mkd.page=mkCurPage(); document.documentElement.classList.add('mkd-on'); mkdPanel(); mkdBoxLoop(); mkRenderChrome(); if(!quiet) toast('Tap anything to edit it','Text, buttons, pictures, any box'); }
const _mkSE9j=mkSetEdit; mkSetEdit=function(on){ const r=_mkSE9j.apply(this,arguments); if(on) setTimeout(()=>{ try{ if(!state.mkSheet) mkdEnable(true); }catch(e){} },60); return r; };

/* ---------- P9j: Lyric Studio, no Preview tab on desktop (the preview is already on the right) ---------- */
const _lsRB9j=lsRenderBody; lsRenderBody=function(){ const ls=state.ls; if(ls&&ls.mode==='preview'&&window.innerWidth>=1024){ ls.mode=ls.hasAudio?'sync':'write'; try{ lsSyncTabs(); }catch(e){} } return _lsRB9j.apply(this,arguments); };
window.addEventListener('resize',()=>{ const ls=state.ls; if(state.lsOpen&&ls&&ls.mode==='preview'&&window.innerWidth>=1024){ try{ lsRenderBody(); lsSyncTabs(); }catch(e){} } });

/* ---------- P9j: Image Studio from the Studios page ---------- */
function openImageStudioFree(){ const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return; if(!/^image\//.test(f.type||'')){ toast('Pick an image','PNG, JPG, WebP or GIF'); return; } if(f.size>25*1024*1024){ toast('Image too large','Use one under 25 MB'); return; }
    const u=URL.createObjectURL(f), base=(f.name||'image').replace(/\.[^.]+$/,'').slice(0,60)||'image'; const im=new Image();
    im.onload=()=>{ const A=(im.naturalWidth/im.naturalHeight)||1, W=Math.min(2400,im.naturalWidth||1200), H=Math.round(W/A);
      openCoverStudio(u,base,true,{aspect:A,out:[W,H],q:.92,title:'Image Studio',onApply:d=>{ const a=document.createElement('a'); a.href=d; a.download=base+'-treesh.jpg'; document.body.appendChild(a); a.click(); a.remove(); toast('Image saved','Find it in your downloads'); }}); };
    im.onerror=()=>{ try{ URL.revokeObjectURL(u); }catch(e){} toast('Couldn\u2019t open that image','Try a different file'); }; im.src=u; };
  inp.click(); }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="image-studio-open"]'); if(t&&!state.mkEdit) openImageStudioFree(); });

/* ---------- P9j: Games, desktop layouts ---------- */
const _gLy9=gameLyricsHtml; gameLyricsHtml=function(){ return `<div class="gx-land gx-wn" data-testid="game-wn-landing">${_gLy9.apply(this,arguments)}</div>`; };
const _gTot9=gameTotHtml; gameTotHtml=function(){ return `<div class="gx-land gx-tot" data-testid="game-tot-landing">${_gTot9.apply(this,arguments)}</div>`; };
function gxWnSide(){ const g=state.game; if(!g||!g.song) return ''; const s=g.song; return `<aside class="wn-side" data-testid="game-side"><div class="wn-side-art">${img(s.coverArt,'h-full w-full object-cover')}</div><p class="wn-side-k">Now guessing</p><h2 class="wn-side-t clamp-2">${esc(s.title)}</h2><p class="wn-side-a clamp-1">${esc(s.artist||'')}</p><div class="wn-side-stats"><div><b class="font-doto">${g.score||0}</b><span>Score</span></div><div><b class="font-doto">${g.streak||0}</b><span>Streak</span></div><div><b class="font-doto">${Math.min(g.round+1,g.targets.length)}/${g.targets.length}</b><span>Round</span></div></div></aside>`; }

/* ---------- P9j: profile badges fold away ---------- */
function pfBdgOpen(){ return !!LS.get('treesh_pf_badges_open',false); }
function pfBdgPeek(S){ const on=PF_BADGES.filter(b=>{ try{ return b.ok(S); }catch(e){ return false; } }); if(!on.length) return `<span class="pf-bdg-none">No badges yet. Keep listening to earn them.</span>`;
  return on.slice(0,7).map(b=>`<span class="pf-bdg-dot" title="${esc(b.label)}"><i data-lucide="${b.ic}"></i></span>`).join('')+(on.length>7?`<span class="pf-bdg-more">+${on.length-7}</span>`:''); }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="pf-badges-toggle"]'); if(!t) return; const sec=t.closest('.pf-bdg'); const open=!pfBdgOpen(); LS.set('treesh_pf_badges_open',open); if(sec) sec.classList.toggle('is-open',open); t.setAttribute('aria-expanded',String(open)); });

/* ---------- P9j: is this @username free? (asks Supabase) ---------- */
const _unCache=new Map(); let _unT=0, _unSeq=0;
async function sbUnameAvail(u){ u=String(u||'').trim().replace(/^@+/,'').toLowerCase(); if(!SB_UNAME.test(u)) return 'bad';
  const mine=(state.profile&&(state.profile.usernameSynced||''))||''; if(sbUser()&&u===mine) return 'mine';
  if(_unCache.has(u)) return _unCache.get(u); if(!sb||!navigator.onLine) return 'unknown';
  try{ const {data,error}=await sb.rpc('username_available',{name:u}); if(error) throw error; const r=data===false?'taken':'ok'; _unCache.set(u,r); return r; }
  catch(e){ console.warn('username check',e&&e.message); return 'unknown'; } }
function unHint(id,res,u){ const inp=document.getElementById(id); const h=document.getElementById(id==='sb-uname'?'sb-uname-hint':'set-uname-hint'); const st=document.getElementById(id==='sb-uname'?'sb-uname-st':'set-uname-st');
  const M={ok:['is-ok','@'+u+' is available'],mine:['is-ok','This is your username'],taken:['is-err','@'+u+' is taken. Try another one'],bad:['is-err','3\u201320 letters, numbers, _ or .'],unknown:['','Can\u2019t check right now. We\u2019ll check when you save'],busy:['is-busy','Checking @'+u+'\u2026'],empty:['','3\u201320 letters, numbers, _ or .']}[res]||['',''];
  if(h){ h.textContent=M[1]; h.className=(id==='sb-uname'?'sba-uhint':'sba-uhint')+(M[0]?' '+M[0]:''); }
  if(st){ st.className='sba-un-st'+(M[0]?' '+M[0]:''); }
  if(inp){ inp.classList.toggle('is-taken',res==='taken'||res==='bad'); inp.classList.toggle('is-free',res==='ok'||res==='mine'); } }
document.addEventListener('input',e=>{ const t=e.target; if(!t||(t.id!=='sb-uname'&&t.id!=='set-uname')) return; const id=t.id; const raw=t.value.replace(/^@+/,'').toLowerCase(); if(raw!==t.value){ const c=t.selectionStart; t.value=raw; try{ t.setSelectionRange(c,c); }catch(_){} }
  clearTimeout(_unT); if(!raw){ unHint(id,'empty',''); return; } if(!SB_UNAME.test(raw)){ unHint(id,'bad',raw); return; } unHint(id,'busy',raw); const seq=++_unSeq;
  _unT=setTimeout(async()=>{ const r=await sbUnameAvail(raw); if(seq===_unSeq) unHint(id,r,raw); },380); });

/* ---------- P9j: desktop profile = hero column + content column ---------- */
const _rpf9=renderProfile; renderProfile=function(){ const r=_rpf9.apply(this,arguments); try{ const sc=document.getElementById('profile-scroll'); if(sc&&!sc.querySelector(':scope > .pf-main')){ const kids=[...sc.children].filter(c=>!c.classList.contains('pf-panel-hero')); if(kids.length){ const m=document.createElement('div'); m.className='pf-main'; kids.forEach(k=>m.appendChild(k)); sc.appendChild(m); } } }catch(e){} return r; };
