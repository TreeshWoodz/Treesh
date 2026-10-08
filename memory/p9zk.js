/* ---------- P9zk: nav order Icons, Library, Profile, Studios, Game (Settings up top), reorder in Magic Markup; mini player dismiss sticks; Icons-only quotes and voice tips; voice fixes ---------- */
NAV.splice(0,NAV.length,['artists','Icons','sparkles'],['library','Library','library-big'],['profile','Profile','circle-user-round'],['studios','Studios','layout-grid'],['game','Game','gamepad-2']);
MK_NAV.splice(0,MK_NAV.length,['artists','Icons','sparkles'],['library','Library','library-big'],['studios','Studios','layout-grid'],['game','Game','gamepad-2'],['settings','Settings','settings']);
MK_PAGE_LABEL.profile='Profile';
const NAV_LOCK=['profile','settings'];
function navOrderOf(list){ const o=mkS().navOrder, ord=Array.isArray(o)?o:[], base=NAV.map(n=>n[0]);
  const rank=id=>{ const i=ord.indexOf(id); if(i>=0) return i; const b=base.indexOf(id); return 100+(b<0?50:b); };
  return list.slice().sort((a,b)=>rank(a[0])-rank(b[0])); }
mkNav=function(list){ const hid=mkS().hidden; return navOrderOf(list.filter(n=>NAV_LOCK.includes(n[0])||!hid.includes(n[0]))); };
const _mkTP9zk=mkTogglePage; mkTogglePage=function(id){ if(id==='profile') return; return _mkTP9zk.apply(this,arguments); };

/* the Profile tab shows your picture; the desktop sidebar keeps its profile card instead */
function navProfileHtml(){ const p=state.profile||{}, on=!!state.profileOpen;
  return `<button data-act="open-profile" data-testid="nav-mobile-profile" aria-label="Profile" title="Profile" ${on?'aria-current="page"':''} class="gl-bnav-item nav-pf ${on?'is-active ':''}flex flex-1 min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors ${on?'text-[color:var(--treesh-purple)]':'text-white/55'}"><span class="nav-pf-av">${p.avatar?img(p.avatar,'h-full w-full object-cover'):`<b>${esc((p.nickname||'T').charAt(0).toUpperCase())}</b>`}</span><span class="nav-label max-w-full truncate">Profile</span></button>`; }
const _navItem9zk=navItem; navItem=function(v,label,ic,mobile){ if(v!=='profile') return _navItem9zk.apply(this,arguments); return mobile?navProfileHtml():''; };
function navPfSync(){ const b=document.querySelector('[data-testid="nav-mobile-profile"]'); if(!b) return; const on=!!state.profileOpen; b.classList.toggle('is-active',on); b.classList.toggle('text-[color:var(--treesh-purple)]',on); b.classList.toggle('text-white/55',!on); if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); }
const _openPf9zk=openProfile; openProfile=function(){ const r=_openPf9zk.apply(this,arguments); navPfSync(); return r; };
const _closePf9zk=closeProfile; closeProfile=function(){ const r=_closePf9zk.apply(this,arguments); navPfSync(); return r; };

/* Settings takes the header spot the profile picture had */
function hdrSettingsHtml(){ const on=state.view==='settings';
  return `<button data-act="nav" data-view="settings" aria-label="Settings" title="Settings" data-testid="open-settings-button" ${on?'aria-current="page"':''} class="press hdr-set relative grid h-11 w-11 shrink-0 place-items-center rounded-full border ${on?'is-on border-[color:var(--treesh-purple)] text-white':'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'}"><i data-lucide="settings" style="width:18px;height:18px"></i>${wnUnseen('settings')?wnBadge('settings'):''}</button>`; }
const _rShell9zk=renderShell; renderShell=function(){ const r=_rShell9zk.apply(this,arguments); const b=document.querySelector('#app header [data-testid="open-profile-button"]'); if(b){ b.outerHTML=hdrSettingsHtml(); icons(); } return r; };

/* Magic Markup > Pages: drag (or nudge) the navigation tabs into any order */
function mkNavEditHtml(){ const m=mkS();
  return `<p class="mk-lbl">Navigation bar</p><p class="mk-hint mb-2">Drag the handle to reorder. Settings lives in the top bar.</p><div class="space-y-1.5" data-reorder="mknav" data-no-swipe data-testid="mk-nav-order">${navOrderOf(NAV).map(([id,label,ic],i,a)=>`<div data-rid="${id}" class="mk-nav-row" data-testid="mk-nav-row-${id}"><span data-rhandle class="mk-nav-grip" role="img" aria-label="Drag ${label}" data-testid="mk-nav-grip-${id}"><i data-lucide="grip-vertical"></i></span><div class="min-w-0 flex-1">${mkSwitch('mk-page-toggle',id,'mk-page-toggle-'+id,id==='profile'||!m.hidden.includes(id),ic,label,'',id==='profile')}</div><span class="mk-nav-mv"><button type="button" data-act="mk-nav-move" data-id="${id}" data-val="-1" ${i===0?'disabled':''} aria-label="Move ${label} earlier" data-testid="mk-nav-up-${id}"><i data-lucide="chevron-up"></i></button><button type="button" data-act="mk-nav-move" data-id="${id}" data-val="1" ${i===a.length-1?'disabled':''} aria-label="Move ${label} later" data-testid="mk-nav-down-${id}"><i data-lucide="chevron-down"></i></button></span></div>`).join('')}</div>`; }
function navSetOrder(order){ const ids=NAV.map(n=>n[0]); const m=mkS(); m.navOrder=order.filter(id=>ids.includes(id)); mkSave(); renderShell(); renderView(); mkRenderSheet(); }
REORDER_CBS.mknav=order=>navSetOrder(order);
const _mkRS9zk=mkRenderSheet; mkRenderSheet=function(){ const r=_mkRS9zk.apply(this,arguments); const c=document.querySelector('[data-reorder="mknav"]'); if(c&&!c._rw){ c._rw=1; wireReorder(c); } return r; };
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="mk-nav-move"]'); if(!t||t.disabled) return; const o=navOrderOf(NAV).map(n=>n[0]), i=o.indexOf(t.dataset.id), j=i+(+t.dataset.val); if(i<0||j<0||j>=o.length) return; [o[i],o[j]]=[o[j],o[i]]; navSetOrder(o); });

/* swiping the mini player away means it stays away next time Treesh opens */
const _dismissMini9zk=dismissMini; dismissMini=function(){ const r=_dismissMini9zk.apply(this,arguments); _resSeek=null; try{ localStorage.removeItem('treesh_resume'); }catch(e){} return r; };

/* What's New only features Treesh releases, never your own uploads */
const _bwn9zk=buildWhatsNew; buildWhatsNew=function(){ const all=SONGS; SONGS=all.filter(s=>s&&!s._user&&!umIsUserId(s.id)); try{ return _bwn9zk.apply(this,arguments); } finally{ SONGS=all; } };

/* quotes widget: lines from the Icons' own songs (clean hooks only) */
const QUOTE_BAD=/\b(ass(es)?|shit\w*|fuck\w*|bitch\w*|nigg\w*|hoes?|dick\w*|puss(y|ies)|cunt|whore|slut\w*|motherf\w*|thot|cock|twerk\w*|bust|nut)\b/i;
let _mkqSig='';
function mkQuotesSync(){ const songs=SONGS.filter(s=>s&&!s._user&&!umIsUserId(s.id)&&Array.isArray(s.lyrics)&&s.lyrics.length); const sig=songs.length+':'+songs.reduce((n,s)=>n+s.lyrics.length,0); if(sig===_mkqSig) return; _mkqSig=sig;
  const out=[]; songs.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id))).forEach(s=>{ const cnt={}; s.lyrics.forEach(l=>{ const t=String((l&&l.text)||'').replace(/\s+/g,' ').trim(); if(t) cnt[t]=(cnt[t]||0)+1; });
    let best='', bs=-1; Object.keys(cnt).forEach(t=>{ const w=t.split(' ').length; if(w<4||w>14||t.length<16||t.length>95||/^[\[(]/.test(t)||QUOTE_BAD.test(t)) return; const sc=Math.min(cnt[t],4)*2+(w>=6&&w<=11?3:0); if(sc>bs){ bs=sc; best=t; } });
    if(best) out.push([best,(s.artist||'Treesh')+' \u00b7 '+s.title]); });
  MK_QUOTES.splice(0,MK_QUOTES.length,...(out.length?out:[['Welcome to the Woodz.','Treesh']])); }
const _mkWQ9zk=mkWQuote; mkWQuote=function(){ try{ mkQuotesSync(); }catch(e){} return _mkWQ9zk.apply(this,arguments); };
try{ mkQuotesSync(); }catch(e){}

/* voice tips name real Icons songs and artists */
let _vxTipRest=null;
function vxTipsSync(){ const g=VOICE_HELP.find(x=>x[0]==='Find & play'); if(!g) return; if(!_vxTipRest) _vxTipRest=g[1].filter(c=>!/^play (blinding lights|something by drake)$/.test(c));
  const s=SONGS.find(x=>x&&!x._user&&!umIsUserId(x.id)&&x.title&&!QUOTE_BAD.test(x.title)), a=ARTISTS.find(x=>x&&x.name&&x.role!=='Model')||ARTISTS[0], add=[];
  if(s) add.push('play '+s.title.toLowerCase()); if(a) add.push('play something by '+a.name.toLowerCase()); g[1]=[...add,..._vxTipRest]; }
const _vBody9zk=voiceBodyHtml; voiceBodyHtml=function(){ try{ vxTipsSync(); }catch(e){} return _vBody9zk.apply(this,arguments); };
const _vSet9zk=viewSettings; viewSettings=function(){ try{ vxTipsSync(); }catch(e){} return _vSet9zk.apply(this,arguments); };

/* voice: a tap on the orb always gets it listening again (even after a reply, a stuck spoken answer or a phone that blocked the auto restart) */
let _vxUserAt=0;
function vxListenNow(){ if(!recog) return; clearTimeout(_voiceRestartT); try{ window.speechSynthesis.cancel(); }catch(e){} _voiceSpeaking=false; _voicePaused=false; _voiceActive=true; _voiceNoMic=false; _vxUserAt=performance.now();
  try{ recog.start(); listening=true; _voiceMode='listening'; }catch(e){ if(e&&e.name==='InvalidStateError'){ listening=true; _voiceMode='listening'; } else { listening=false; _voiceRestartT=setTimeout(voiceListen,300); } } voiceRender(); }
voiceToggleMic=function(){ if(recog===null) initVoice(); if(!recog){ toast('Microphone unavailable here','You can still type a command below'); const inp=$('#voice-input'); if(inp) inp.focus(); return; }
  if(listening&&!_voicePaused&&!_voiceSpeaking&&_voiceMode==='listening'){ _voicePaused=true; clearTimeout(_voiceRestartT); try{ recog.abort(); }catch(e){} listening=false; _voiceMode='paused'; voiceRender(); return; }
  vxListenNow(); };
const _vOpen9zk=voiceOpen; voiceOpen=function(){ _vxUserAt=performance.now(); return _vOpen9zk.apply(this,arguments); };
const _initV9zk=initVoice; initVoice=function(){ const r=_initV9zk.apply(this,arguments); if(recog&&!recog._9zk){ recog._9zk=1; const oe=recog.onerror;
    recog.onerror=e=>{ const err=e&&e.error; if((err==='not-allowed'||err==='service-not-allowed')&&performance.now()-_vxUserAt>1500){ listening=false; _voicePaused=true; _voiceMode='paused'; clearTimeout(_voiceRestartT); voiceRender(); return; } return oe&&oe(e); }; }
  return r; };
