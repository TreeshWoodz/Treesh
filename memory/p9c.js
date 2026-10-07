/* ---------- P9: brand assets (embedded so they work offline) ---------- */
const TREESH_LOGO=(d=>{ try{ const b=atob(d.split(',')[1]), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return URL.createObjectURL(new Blob([u],{type:'image/webp'})); }catch(e){ return d; } })('__P9_LOGO__');
const OB_AVATARS=__P9_AVATARS__;

/* ---------- P9: pick up where you left off ---------- */
const P9_RES='treesh_resume'; let _resT=0, _resPending=null, _resSeek=null, _resId=null;
function resSave(force){ const s=curSong(); if(!s||_resSeek!=null) return; const now=Date.now(); if(!force&&now-_resT<2500) return; _resT=now;
  const d=audio.duration||0; let t=audio.currentTime||0; if(d&&isFinite(d)&&d-t<3) t=0;
  try{ LS.set(P9_RES,{id:s.id,t:Math.round(t*10)/10,q:state.queue.slice(0,400).map(x=>x.id),b:state.shuffle?(state.base||[]).slice(0,400).map(x=>x.id):null,at:now}); }catch(e){} }
function resRestore(){ if(curSong()){ _resPending=null; return; } const r=_resPending||LS.get(P9_RES,null); if(!r||!r.id) return; const s=SONG_BY_ID[r.id]; if(!s){ _resPending=r; return; } _resPending=null;
  const get=id=>SONG_BY_ID[id]; let q=(r.q||[]).map(get).filter(Boolean); let i=q.findIndex(x=>x.id===r.id); if(i<0){ q=[s]; i=0; }
  state.queue=q; const b=(r.b||[]).map(get).filter(Boolean); state.base=b.length?b:q.slice();
  const t=+r.t||0; loadIndex(i,q,false); state.currentTime=t; if(t>1){ _resSeek=t; _resId=s.id; try{ audio.currentTime=t; }catch(e){} }
  renderMini(); try{ updateProgress(); }catch(e){}
  if(t>2) toast('Welcome back','Tap play to continue '+s.title+' at '+fmt(t)); }
function resSeekNow(){ if(_resSeek==null) return; const cs=curSong(); if(!cs||cs.id!==_resId){ _resSeek=null; return; } const t=_resSeek; if(Math.abs((audio.currentTime||0)-t)>1.2){ try{ audio.currentTime=t; }catch(e){} } }
function resInit(){
  ['loadedmetadata','canplay','play','playing'].forEach(ev=>audio.addEventListener(ev,resSeekNow));
  audio.addEventListener('timeupdate',()=>{ if(_resSeek!=null){ const cs=curSong(); if(!cs||cs.id!==_resId){ _resSeek=null; } else { if(!audio.paused&&Math.abs((audio.currentTime||0)-_resSeek)<2) _resSeek=null; return; } } resSave(); });
  audio.addEventListener('pause',()=>resSave(true)); audio.addEventListener('loadstart',()=>setTimeout(()=>resSave(true),0));
  window.addEventListener('pagehide',()=>resSave(true)); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') resSave(true); });
  const _lus=loadUserSongs; loadUserSongs=async function(){ const r=await _lus.apply(this,arguments); if(_resPending) resRestore(); return r; }; }

/* ---------- P9: top artist on the profile always has a face ---------- */
function pfTopArtist(k){ if(k.indexOf('n:')!==0) return ARTIST_BY_ID[k]||null; const name=k.slice(2); const nk=normKey(name);
  const a=(ARTISTS||[]).find(x=>normKey(x.name)===nk); if(a) return a; const s=SONGS.find(x=>normKey(x.artist)===nk&&x.coverArt); return {name,image:s?s.coverArt:''}; }

/* ---------- P9: Siri-style voice assistant ---------- */
function showVoice(){ if($("#voice-ov")) return; const el=document.createElement("div"); el.id="voice-ov"; el.className="vx vx2 tr-fade-in"; el.dataset.mode=_voiceMode||'idle';
  el.innerHTML=`<div data-act="voice-cancel" class="vx-bd" data-testid="voice-backdrop"></div><div class="vx-aura" aria-hidden="true"><i></i><i></i><i></i></div><div class="vx-edge" aria-hidden="true"><i></i></div><div class="vx-edge vx-edge-soft" aria-hidden="true"><i></i></div><div data-voice-panel data-testid="voice-listening-overlay" class="vx-panel tr-panel-in"><span class="vx-grab" aria-hidden="true"></span><div data-voice-body class="vx-body no-scrollbar">${voiceBodyHtml()}</div></div>`;
  el.addEventListener('click',e=>{ const t=e.target; if(!t||!t.closest||t.closest('[data-act],button,input,textarea,select,a,label,summary,.vx-said,.vx-reply,.vx-dock')) return; stopVoice(); });
  document.body.appendChild(el); icons(); syncScrollLock(); }
function voiceRender(){ const el=$("#voice-ov"); if(!el) return; el.dataset.mode=_voiceMode||'idle'; const body=el.querySelector("[data-voice-body]"); if(!body) return; const ae=document.activeElement; const wasTyping=!!(ae&&ae.id==="voice-input"); const caret=wasTyping?ae.selectionStart:null; body.innerHTML=voiceBodyHtml(); icons(); if(wasTyping){ const ni=$("#voice-input"); if(ni){ try{ ni.focus(); if(caret!=null) ni.setSelectionRange(caret,caret); }catch(e){} } } }
function voiceHeader(title, sub){ return `<div class="vx-head"><button data-act="voice-speak" data-testid="voice-speak-toggle" aria-label="Toggle spoken replies" title="Spoken replies" class="vx-ic press${_voiceSpeak?' is-on':''}"><i data-lucide="${_voiceSpeak?'volume-2':'volume-x'}"></i></button><div class="vx-title"><p>${esc(title)}</p>${sub?`<span data-testid="voice-status">${esc(sub)}</span>`:''}</div><button data-act="voice-cancel" aria-label="Close" data-testid="voice-close-button" class="vx-ic press"><i data-lucide="x"></i></button></div>`; }
function voiceOrb(mode,icon){ return `<button data-act="voice-mic" data-testid="voice-listening-orb" aria-label="Toggle microphone" class="vx-orb press is-${mode}"><span class="vx-blob b1"></span><span class="vx-blob b2"></span><span class="vx-blob b3"></span><span class="vx-blob b4"></span><span class="vx-core"><i data-lucide="${icon}"></i></span></button>`; }
function voiceControls(){ return `<div class="vx-ctrls"><button data-act="voice-mic" data-testid="voice-mic-toggle" class="vx-btn press"><i data-lucide="${_voicePaused?'mic':'pause'}"></i>${_voicePaused?'Resume':'Pause mic'}</button><button data-act="voice-cancel" data-testid="voice-cancel-button" class="vx-btn is-primary press"><i data-lucide="check"></i>Done</button></div>`; }
function voiceBodyHtml(){ const mode=_voiceMode;
  if(mode==="denied"||mode==="unsupported"){ const M=mode==="denied"?["Microphone blocked","Allow microphone access in your browser, then try again. You can still type or tap a command."]:["Voice not supported","This browser can\u2019t hear you, but you can still type or tap any command."];
    return `${voiceHeader("Treesh","")}<div class="vx-stage"><div class="vx-words"><p class="vx-said is-dim">${M[1]}</p></div>${voiceOrb('off','mic-off')}<p class="vx-status" data-testid="voice-status">${esc(M[0])}</p></div><div class="vx-dock">${voiceTypeRow()}${voiceChips()}${voiceHelpPanel()}<div class="vx-ctrls"><button data-act="voice-cancel" class="vx-btn press">Close</button><button data-act="voice-retry" data-testid="voice-retry" class="vx-btn is-primary press"><i data-lucide="rotate-ccw"></i>Try again</button></div></div>`; }
  const listening=mode==="listening", speaking=mode==="speaking", thinking=mode==="thinking", paused=mode==="paused";
  const status=paused?"Paused. Tap the orb to resume":speaking?"Speaking\u2026":thinking?"Working on it\u2026":listening?"Listening\u2026":"Tap the orb to talk";
  const said=listening?`<p id="voice-utext" data-testid="voice-live-transcript" class="vx-said${_voiceLast.user?'':' is-dim'}">${_voiceLast.user?esc(_voiceLast.user):'Say something like \u201Cplay my favorites\u201D'}</p>`
    :`<p data-testid="voice-live-transcript" class="vx-said${_voiceLast.user?'':' is-dim'}">${_voiceLast.user?'\u201C'+esc(_voiceLast.user)+'\u201D':'Tap a command below, or the orb to speak'}</p>`;
  const reply=_voiceLast.reply?`<div class="vx-reply" data-testid="voice-reply"><span class="vx-reply-k"><i data-lucide="sparkles"></i>Treesh</span><p>${esc(_voiceLast.reply)}</p></div>`:'';
  return `${voiceHeader("Treesh","")}<div class="vx-stage"><div class="vx-words">${said}${reply}</div>${voiceOrb(thinking?'thinking':speaking?'speaking':listening?'listening':paused?'paused':'idle',paused?'mic-off':thinking?'loader':'mic')}<p class="vx-status" data-testid="voice-status">${esc(status)}</p></div><div class="vx-dock">${voiceTypeRow()}${voiceChips()}${voiceHelpPanel()}${voiceControls()}</div>`; }

/* ---------- P9: legal pages open in the window viewer ---------- */
GAME_BY_KEY['legal-privacy']={key:'legal-privacy',name:'Privacy Policy',url:'privacy.html',mono:'P',a:'#9328ff',b:'#3b0d73',label:'Treesh Legal'};
GAME_BY_KEY['legal-terms']={key:'legal-terms',name:'Terms of Use',url:'terms.html',mono:'T',a:'#6d28d9',b:'#1e1b4b',label:'Treesh Legal'};

/* ---------- P9: swipe sheets down with a mouse too (grab handles) ---------- */
function p9MouseSheetDrag(){ document.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse'||e.button) return; const h=e.target&&e.target.closest&&e.target.closest('.pm-grab,.mk-sheet-grab,.vx-grab,.zh-grab'); if(!h) return;
  const p=h.closest('.pm-panel,#profile-panel,.mk-sheet,.um-panel,[data-voice-panel],.zh-sheet'); if(!p) return; e.preventDefault(); const y0=e.clientY; let dy=0, t0=performance.now(); p.classList.remove('panel-in'); p.classList.add('pm-dragging'); p.style.transition='none'; p.style.animation='none'; const bd=sheetBackdrop(p);
  const mv=ev=>{ dy=Math.max(0,ev.clientY-y0); p.style.transform='translate3d(0,'+dy+'px,0)'; if(bd) bd.style.opacity=String(Math.max(.2,1-dy/650)); };
  const up=()=>{ document.removeEventListener('pointermove',mv); document.removeEventListener('pointerup',up); p.classList.remove('pm-dragging'); const v=dy/Math.max(1,performance.now()-t0);
    if(dy>110||(v>.5&&dy>40)){ p.style.transition='transform .22s cubic-bezier(.4,0,1,1)'; p.style.transform='translate3d(0,110%,0)'; if(bd){ bd.style.transition='opacity .22s ease'; bd.style.opacity='0'; } setTimeout(()=>sheetClose(p),190); }
    else { p.style.transition='transform .4s cubic-bezier(.34,1.4,.64,1)'; p.style.transform=''; if(bd){ bd.style.transition='opacity .3s ease'; bd.style.opacity=''; } setTimeout(()=>{ p.style.transition=''; if(bd) bd.style.transition=''; },420); } };
  document.addEventListener('pointermove',mv); document.addEventListener('pointerup',up); }); }

/* ---------- P9: Lyric Studio, styled editor + light mode ---------- */
function lsLight(){ return LS.get('treesh_ls_light',false)===true; }
function lyMd(l){ return !!(l&&l.md&&lsStripFmt(l.md)===l.text); }
function lyFmt(l){ return lyMd(l)?lsInlineFmt(l.md):esc(l?l.text:''); }
const escT=v=>String(v==null?'':v).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function lsHlLine(line){ if(lsIsSection(line)) return `<span class="lsh-sec">${escT(line)}</span>`;
  let h=escT(line);
  h=h.replace(/\u200B([^\u200B\n]*)\u200B/g,'\u200B<span class="lsh-b">$1</span>\u200B').replace(/\uFEFF([^\uFEFF\n]*)\uFEFF/g,'\uFEFF<span class="lsh-i">$1</span>\uFEFF');
  h=h.replace(/\*\*([^*\n]+)\*\*/g,'<span class="lsh-m">**</span><span class="lsh-b">$1</span><span class="lsh-m">**</span>');
  h=h.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,'$1<span class="lsh-m">*</span><span class="lsh-i">$2</span><span class="lsh-m">*</span>');
  h=h.replace(/\((\u00d7\d+|x\d+)\)/g,'<span class="lsh-rep">($1)</span>');
  h=h.replace(/\(([^()\n]+)\)/g,(m,a)=>/^(\u00d7|x)\d+$/.test(a)?m:`<span class="lsh-ad">(${a})</span>`);
  return h; }
function lsHlHtml(text){ return String(text||'').split('\n').map(lsHlLine).join('\n')+'\n\u200b'; }
function lsHlSync(){ const ta=$("#ls-write"), hl=$("#ls-write-hl"); if(!ta||!hl) return; hl.innerHTML=lsHlHtml(ta.value); hl.scrollTop=ta.scrollTop; hl.classList.toggle('is-empty',!ta.value); lsPrevSync(ta); }
function lsWriteHtml(){
  const txt=lsItemsToText(state.ls.items);
  const TAGCHIPS=[['Verse',true],['Chorus',false],['Pre-Chorus',false],['Hook',false],['Bridge',false],['Intro',false],['Outro',false],['Refrain',false]];
  const chip=(attrs,tid,label,col)=>`<button ${attrs} data-testid="${tid}" class="lsx-tag press"><span style="${col?'color:'+col:''}">[</span>${label}<span style="${col?'color:'+col:''}">]</span></button>`;
  const sectionChips=TAGCHIPS.map(([tag,num])=>chip(`data-act="ls-insert-tag" data-tag="${tag}" data-num="${num?1:0}"`,'ls-tag-'+tag,tag+(num?' #':''))).join('');
  const perf=lsPerformerOptions(); let performers=perf.all.slice(); const combined=perf.group||(perf.all.length>1?perf.all.join(' & '):null);
  if(combined&&!performers.some(p=>p.toLowerCase()===combined.toLowerCase())) performers.push(combined);
  const perfRows=performers.map((p,pi)=>{ const col=performerColor(p); return `<div class="lsx-perf"><span class="lsx-perf-n" style="--c:${col}" title="${esc(p)}"><i style="background:${col}"></i>${esc(p)}</span><div class="no-scrollbar lsx-row">${[['Verse',1],['Hook',0],['Chorus',0],['Bridge',0]].map(([t,num])=>chip(`data-act="ls-insert-tag" data-tag="${t}" data-num="${num?1:0}" data-suffix="${esc(p)}" title="Insert [${t}${num?' #':''}: ${esc(p)}]"`,'ls-perf-'+pi+'-'+t,t+(num?' #':''),col)).join('')}</div></div>`; }).join('');
  const tagPanel=`<details class="ls-tags lsx-card lsx-tags" ${(state.lsTagsOpen==null?window.innerWidth>=1024:state.lsTagsOpen)?'open':''}><summary data-testid="ls-tags-summary" class="lsx-sum press"><i data-lucide="tags"></i>Song sections${perf.group?`<span class="lsx-pill">${esc(perf.group)}</span>`:''}<span class="ml-auto flex items-center gap-1.5"><button data-act="ls-tips-toggle" data-testid="ls-tips-toggle" onclick="event.preventDefault()" aria-label="Writing tips" title="Writing tips" class="lsx-ic press"><i data-lucide="info"></i></button><i data-lucide="chevron-down" class="lsx-chev"></i></span></summary><div class="lsx-tags-in"><div class="no-scrollbar lsx-row">${sectionChips}</div>${performers.length?`<p class="lsx-lbl"><i data-lucide="mic-2"></i>Performers</p>${perfRows}`:''}</div></details>`;
  const tipsPanel=`<div id="ls-tips-panel" data-testid="ls-tips-panel" class="lsx-card lsx-tips ${state.lsTipsOpen?'':'hidden'}"><p class="lsx-lbl"><i data-lucide="info"></i>Writing tips</p><ul><li>Write <b>one lyric per line</b>. Mark sections like <code>[Verse 1]</code> or <code>[Chorus x2]</code>.</li><li>Select words, then tap <b>B</b> or <i>I</i>. Bold and italic show in the player too.</li><li>Ad-libs in <code>(brackets)</code> are tinted so they stand apart.</li></ul></div>`;
  const fb=(md,ic,title,label,extra)=>`<button data-act="ls-md" data-md="${md}" data-testid="ls-md-${md}" title="${title}" aria-label="${title}" class="lsx-fb press${extra||''}">${ic?`<i data-lucide="${ic}"></i>`:''}${label?`<span>${label}</span>`:''}</button>`;
  const markupBar=`<div class="lsx-format no-scrollbar" data-testid="ls-format-bar">${fb('bold','bold','Bold','')}${fb('italic','italic','Italic','')}<span class="lsx-sep"></span>${fb('adlib','','Ad-lib in brackets','( )')}${fb('quote','quote','Quote','')}${fb('caps','case-upper','UPPERCASE','')}${fb('lower','case-lower','lowercase','')}<span class="lsx-sep"></span>${fb('repeat','repeat-2','Repeat this line','\u00d72')}${fb('pause','','Pause or breath','\u2026')}${fb('hold','','Held note','\u2014')}<span class="lsx-sep"></span>${fb('explain','lightbulb','Explain this line, shown in the player','Explain',' is-accent')}</div>`;
  const audioRow=state.ls.isBlank?(state.ls.hasAudio
    ?`<div class="lsx-card lsx-audio"><span class="lsx-audio-ic"><i data-lucide="music-4"></i></span><span class="min-w-0 flex-1 clamp-1 text-xs font-semibold">${esc(state.ls.audioName||'Audio attached')}</span><button data-act="ls-add-audio" data-testid="ls-replace-audio" class="lsx-chip press">Replace</button><button data-act="ls-remove-audio" data-testid="ls-remove-audio" aria-label="Remove audio" class="lsx-ic press"><i data-lucide="x"></i></button></div>`
    :`<button data-act="ls-add-audio" data-testid="ls-add-audio" class="lsx-cta press"><i data-lucide="music-4"></i>Add audio to time your lyrics</button>`):'';
  const audioInput=state.ls.isBlank?`<input id="ls-audio-file" type="file" accept="audio/*" class="hidden">`:'';
  const findBtn=state.ls.isBlank?'':`<button data-act="lyrics-find" data-id="${state.ls.songId}" data-testid="ls-find-online" class="lsx-cta press"><i data-lucide="sparkles"></i>Find lyrics online</button>`;
  const rhymeToggle=`<button data-act="ls-rhyme-toggle" data-testid="ls-rhyme-toggle" role="switch" aria-checked="${state.lsRhymesOn}" title="Floating rhyme suggestions appear above your cursor as you type" class="lsx-chip press${state.lsRhymesOn?' is-on':''}"><i data-lucide="mic-vocal"></i>Rhymes ${state.lsRhymesOn?'on':'off'}</button>`;
  return `<div class="lsx-write">${audioInput}<aside class="lsx-rail" data-testid="ls-rail">${lsDeskMode()?lsRailPlayerHtml():''}${audioRow}${findBtn}${tagPanel}${tipsPanel}${lsStatsHtml(txt)}</aside>
    <div class="lsx-center"><div class="lsx-paper"><div class="lsx-paper-top">${markupBar}</div>
      <div class="lsx-ed"><div id="ls-write-hl" class="lsx-hl" aria-hidden="true">${lsHlHtml(lsMdToTa(txt))}</div><textarea id="ls-write" data-testid="ls-write-textarea" spellcheck="false" autocorrect="off" placeholder="[Verse 1]\nType or paste your lyrics here\u2026\nOne line at a time" class="lsx-ta no-scrollbar">${escT(lsMdToTa(txt))}</textarea><div id="ls-rhyme-pop" data-testid="ls-rhyme-pop" onmousedown="event.preventDefault()" class="ls-rhyme-pop absolute left-0 top-0 z-30 hidden w-[min(280px,calc(100%-8px))]"></div></div></div>
    <div class="lsx-foot"><span id="ls-write-count" class="lsx-count">${txt.split(/\r?\n/).filter(l=>l.trim()).length} lines</span>${rhymeToggle}${state.ls.hasAudio?`<button data-act="ls-goto-sync" data-testid="ls-goto-sync" class="lsx-go press">Continue to timing<i data-lucide="arrow-right"></i></button>`:''}</div></div>${lsPrevHtml(txt)}</div>`; }
function lsStats(txt){ let lines=0, words=0, secs=0; String(txt||'').split(/\r?\n/).forEach(l=>{ const t=l.trim(); if(!t) return; if(lsIsSection(t)){ secs++; return; } lines++; words+=lsStripFmt(t).split(/\s+/).filter(Boolean).length; }); return {lines,words,secs}; }
function lsStatsHtml(txt){ const S=lsStats(txt); return `<div class="lsx-card lsx-stats" data-testid="ls-stats"><p class="lsx-lbl"><i data-lucide="chart-no-axes-column"></i>This draft</p><div class="lsx-stat-row"><span><b class="font-doto" id="ls-st-lines">${S.lines}</b>lines</span><span><b class="font-doto" id="ls-st-words">${S.words}</b>words</span><span><b class="font-doto" id="ls-st-secs">${S.secs}</b>sections</span></div></div>`; }
function lsPrevLines(txt){ const out=[]; String(txt||'').split(/\r?\n/).forEach((l,i)=>{ const t=l.trim(); if(!t){ out.push(`<span class="lsp-gap" data-i="${i}"></span>`); return; } if(lsIsSection(t)){ out.push(`<p class="lsp-sec" data-i="${i}">${escT(t.replace(/^\[|\]$/g,''))}</p>`); return; } out.push(`<p class="lsp-l" data-i="${i}">${lsInlineFmt(t)}</p>`); }); return out.some(x=>x.indexOf('lsp-gap')<0)?out.join(''):'<p class="lsp-empty">Start typing. Your lyrics show up here styled just like the player.</p>'; }
function lsPrevHtml(txt){ return lsNpPrevHtml(lsPrevLines(txt)); }
let _lsPrevTxt=null;
function lsPrevSync(ta){ const body=document.getElementById('ls-prev-body'); if(!body||!ta||window.innerWidth<1024) return; const v=ta.value;
  if(v!==_lsPrevTxt||!body._p9){ _lsPrevTxt=v; body._p9=1; body.innerHTML=lsPrevLines(v); const S=lsStats(v); [['lines',S.lines],['words',S.words],['secs',S.secs]].forEach(([k,n])=>{ const e=document.getElementById('ls-st-'+k); if(e) e.textContent=n; }); }
  const li=v.slice(0,ta.selectionStart||0).split('\n').length-1; const cur=body.querySelector('.is-on'), el=body.querySelector('[data-i="'+li+'"]'); if(cur&&cur!==el) cur.classList.remove('is-on'); if(el&&!el.classList.contains('is-on')){ el.classList.add('is-on'); body.scrollTo({top:Math.max(0,el.offsetTop-body.clientHeight*0.38),behavior:'smooth'}); } }
function renderLS(){
  const c=$("#ls"); if(!c) return;
  if(!state.lsOpen||!state.ls){ c.innerHTML=""; return; }
  const ls=state.ls, lt=lsLight();
  if(!ls.hasAudio&&ls.mode!=='write') ls.mode='write';
  const tab=(id,label,ic)=>`<button data-act="ls-mode" data-mode="${id}" data-testid="ls-tab-${id}" role="tab" aria-selected="${ls.mode===id}" class="ls-tab lsx-tab press"><i data-lucide="${ic}"></i>${label}</button>`;
  const title=ls.isBlank?`<button id="ls-doc-title" data-act="ls-doc-rename" data-testid="ls-doc-title" class="lsx-doc press"><span class="clamp-1">${esc(ls.title||'Untitled lyrics')}</span><i data-lucide="pencil"></i></button>`:`<p class="lsx-doc clamp-1">${esc(ls.title||'Untitled')} <span>\u00b7 ${esc(ls.artist||'')}</span></p>`;
  const header=`<div class="lsx-head"><button data-act="ls-close" data-testid="ls-close" aria-label="Close" class="lsx-ic lg press"><i data-lucide="chevron-down"></i></button>
     <div class="min-w-0 flex-1"><p class="lsx-kick">${ls.isBlank?'Lyric Draft':'Lyric Studio'}<span id="ls-dirty" class="${ls.dirty?'':'hidden'} lsx-dot" title="Unsaved changes"></span></p>${title}</div>
     <button data-act="ls-theme" data-testid="ls-theme-toggle" aria-label="${lt?'Dark mode':'Light mode'}" title="${lt?'Dark paper':'Light paper'}" class="lsx-ic lg press"><i data-lucide="${lt?'moon':'sun'}"></i></button>
     <button data-act="ls-import" data-testid="ls-import" aria-label="Import lyrics" title="Import" class="lsx-ic lg press"><i data-lucide="import"></i></button>
     <button data-act="ls-export" data-testid="ls-export" aria-label="Export LRC" title="Export" class="lsx-ic lg press"><i data-lucide="file-down"></i></button>
     <button data-act="ls-save" data-testid="ls-save" class="lsx-save press"><i data-lucide="check"></i>Save</button></div>`;
  const tabs=ls.hasAudio?`<div class="lsx-tabs" role="tablist">${tab('write','Write','pencil')}${tab('sync','Sync','clock')}${tab('preview','Preview','play')}</div>`:'';
  const rail=lsDeskMode(); ls._rail=rail;
  c.innerHTML=`<div data-ls-root data-testid="lyric-studio" data-ls-theme="${lt?'light':'dark'}" class="lsx ${lt?'lsx-light':'lsx-dark dark-surface'} fixed inset-0 z-[200] flex flex-col">
     <div class="lsx-bg" aria-hidden="true"><i></i><i></i></div>
     <div class="lsx-shell relative z-10 mx-auto flex h-[100dvh] w-full max-w-3xl flex-col">
       <div class="ls-slide shrink-0" style="animation-delay:0ms">${header}</div>
       ${tabs?`<div class="ls-slide shrink-0" style="animation-delay:55ms">${tabs}</div>`:''}
       <div id="ls-body" class="ls-slide min-h-0 flex-1 overflow-hidden px-3 sm:px-5${lsWideBody()?'':' lsx-narrow'}" style="animation-delay:110ms">${lsBodyHtml()}</div>
       ${ls.hasAudio&&!rail?`<div class="ls-slide shrink-0" style="animation-delay:165ms">${lsBarHtml()}</div>`:''}
     </div></div>`;
  icons(); lsWireBody(); syncScrollLock(); lsNpTick(true); }
function lsWireHl(){ const ta=$("#ls-write"); if(!ta||ta._hl) return; ta._hl=1; const hl=$("#ls-write-hl"); ['input','keyup','select','cut','paste','click','focus'].forEach(ev=>ta.addEventListener(ev,()=>requestAnimationFrame(lsHlSync))); ta.addEventListener('scroll',()=>{ if(hl) hl.scrollTop=ta.scrollTop; },{passive:true}); lsHlSync(); }

/* ---------- P9: actions ---------- */
function p9Act(act,t){ const val=t.dataset.val;
  switch(act){
    case 'mk-is-pick': isPickPhoto(); break;
    case 'is-result-close': { const r=document.getElementById('is-result'); if(r) r.innerHTML=''; break; }
    case 'is-recent-open': { const rec=_isRec.find(x=>x.id===t.dataset.id); if(rec) isResult(rec.d,rec); break; }
    case 'is-recent-edit': { const rec=_isRec.find(x=>x.id===t.dataset.id); if(!rec) break; const r=document.getElementById('is-result'); if(r) r.innerHTML=''; isEditImage(rec.d,false); break; }
    case 'is-recent-del': { _isRec=_isRec.filter(x=>x.id!==t.dataset.id); assetPut('is_recent',_isRec).catch(()=>{}); const r=document.getElementById('is-result'); if(r) r.innerHTML=''; swRefresh('imagestudio'); toast('Removed from recent edits'); break; }
    case 'sw-beat-open': { const id=t.dataset.id; navigate('instrum'); if(state.view!=='instrum') break; instrumStart(); if(state.instrum&&state.instrum.started) iLoadProject(id); break; }
    case 'is-result-share': isShare(); break;
    case 'mk-mw': mkCfgSet({mw:val==='full'?'':val}); break;
    case 'p9-search': state.searchQuery=val||''; openSearch(); break;
    case 'legal-open': openGameFrame(val); break;
    case 'ls-theme': { const on=!lsLight(); LS.set('treesh_ls_light',on); if(state.ls&&state.ls.mode==='write'){ const ta=$("#ls-write"); if(ta) state.ls.items=lsParseWriteText(ta.value,state.ls.items); } renderLS(); toast(on?'Light paper':'Dark paper','Lyric Studio look saved'); break; }
  } }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(t) p9Act(t.dataset.act,t); });

function p9SettingsIdx(){ if(window._p9Idx||typeof SETTINGS_INDEX==='undefined') return; window._p9Idx=true; SETTINGS_INDEX.push(
  {id:'np-style',label:'Player style',desc:'Classic, record player, CD, polaroid, glass, beat pulse and more',kw:'now playing player cover art style vinyl record cd circle polaroid glass pulse minimal full screen look',ic:'disc-3',type:'action',go:()=>{ closeSearch(); setTimeout(()=>{ if(curSong()){ state.npOpen=true; renderNP(); setTimeout(npsOpen,350); } else goSettingSection('appearance','Now Playing look'); },220); }},
  {id:'np-peek',label:'Live lyrics in the player',desc:'Lyrics glow word by word under the song title',kw:'live lyrics karaoke words glow player now playing peek sing along',ic:'mic-vocal',type:'toggle',get:()=>npPeekOn(),toggle:()=>{ LS.set('treesh_np_peek',!npPeekOn()); if(state.npOpen) renderNP(); }},
  {id:'ls-light',label:'Lyric Studio light paper',desc:'Write lyrics on a light page',kw:'lyric studio light mode paper white theme writing',ic:'sun',type:'toggle',get:()=>lsLight(),toggle:()=>{ LS.set('treesh_ls_light',!lsLight()); if(state.lsOpen) renderLS(); }},
  {id:'sb-account',label:'Treesh account',desc:'Sign in, sync your profile to any device, sign out',kw:'account sign in login log in sign up register create account email password cloud sync backup username devices sign out logout',ic:'cloud',type:'action',go:()=>goSettingSection('account')},
  {id:'zodiac-hub',label:'Zodiac, numerology & fortune',desc:'Daily horoscope, life path, tarot and fortune cookie',kw:'zodiac astrology horoscope star sign numerology life path fortune cookie tarot moon chinese compatibility',ic:'sparkles',type:'action',go:()=>{ closeSearch(); setTimeout(zhOpen,220); }}
); }
function p9Init(){ if(window._p9On) return; window._p9On=true; try{ const _lwb=lsWireBody; lsWireBody=function(){ const r=_lwb.apply(this,arguments); try{ const b=document.getElementById('ls-body'); if(b&&state.ls) b.classList.toggle('lsx-narrow',!lsWideBody()); if(state.ls&&state.ls.mode==='write') lsWireHl(); const sk=document.getElementById('ls-seek'); if(sk&&!sk._p9w){ sk._p9w=1; lsWireBar(); } lsNpTick(true); }catch(e){} return r; }; }catch(e){} setTimeout(()=>{ try{ resRestore(); }catch(e){ console.warn('p9 restore',e); } },0); try{ resInit(); }catch(e){ console.warn('p9 resume',e); } try{ p9SettingsIdx(); }catch(e){} try{ mkRaysSync(); }catch(e){} try{ p9MouseSheetDrag(); }catch(e){} try{ isRecLoad(); }catch(e){} try{ sbInit(); }catch(e){ console.warn('accounts',e); } }
