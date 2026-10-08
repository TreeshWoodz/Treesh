/* ---------- P9h: Now Playing, flick down from anywhere to close ---------- */
function wireNPSwipe(){ const root=$("#np [data-np-root]"); if(!root||root._sw) return; root._sw=1; let S=null;
  const scroller=el=>{ for(let n=el;n&&n!==root;n=n.parentElement){ const oy=getComputedStyle(n).overflowY; if((oy==='auto'||oy==='scroll')&&n.scrollHeight>n.clientHeight+1) return n; } return null; };
  root.addEventListener('touchstart',e=>{ S=null; if(e.touches.length!==1||state.karFull||state.lyricSelect||state.lyricsEdit) return; const t=e.target; if(!t||!t.closest||t.closest('input,textarea,select,[contenteditable="true"],[data-no-swipe]')) return;
    const sc=t.closest('[data-np-drag-zone]')?null:scroller(t); if(sc&&sc.scrollTop>2) return; const y=e.touches[0].clientY;
    S={x0:e.touches[0].clientX,y0:y,sc,on:false,dead:false,dy:0,pts:[[performance.now(),y]]}; },{passive:true});
  root.addEventListener('touchmove',e=>{ if(!S||S.dead) return; const tc=e.touches[0], dx=tc.clientX-S.x0, dy=tc.clientY-S.y0;
    if(!S.on){ if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){ S.dead=true; return; } if(dy<-6){ S.dead=true; return; } if(dy<8) return; if(S.sc&&S.sc.scrollTop>2){ S.dead=true; return; }
      S.on=true; S.y0=tc.clientY; root.classList.remove('np-entering'); root.style.animation='none'; root.style.transition='none'; root.style.willChange='transform'; }
    if(e.cancelable) e.preventDefault(); const d=Math.max(0,tc.clientY-S.y0), n=performance.now(); S.dy=d; S.pts.push([n,tc.clientY]); while(S.pts.length>2&&n-S.pts[0][0]>90) S.pts.shift();
    root.style.transform='translate3d(0,'+d+'px,0)'; },{passive:false});
  const end=()=>{ const s=S; S=null; if(!s||!s.on) return; const a=s.pts[0], b=s.pts[s.pts.length-1]; const v=(b[1]-a[1])/Math.max(1,b[0]-a[0]);
    if(s.dy>110||(v>.45&&s.dy>24)){ const h=root.offsetHeight||window.innerHeight; const ms=Math.round(Math.max(120,Math.min(230,(h-s.dy)/Math.max(v,1.4)))); root.style.transition='transform '+ms+'ms cubic-bezier(.2,.7,.3,1)'; root.style.transform='translate3d(0,'+h+'px,0)'; setTimeout(()=>{ closeNP(); if(!state.npOpen) $("#np").innerHTML=''; },ms); }
    else { root.style.transition='transform .38s cubic-bezier(.34,1.4,.64,1)'; root.style.transform=''; setTimeout(()=>{ root.style.transition=''; root.style.willChange=''; },400); } };
  root.addEventListener('touchend',end,{passive:true}); root.addEventListener('touchcancel',end,{passive:true}); }

/* ---------- P9h: voice, "change theme to blue" tints the accent, "dark mode" / "light mode" switch the app ---------- */
const VX_COLORS={purple:'#9328ff',violet:'#7a2cff',lavender:'#b58cff',indigo:'#6366f1',navy:'#3b5bdb',blue:'#60a5fa',sky:'#60a5fa',cyan:'#22d3ee',aqua:'#22d3ee',turquoise:'#22d3ee',teal:'#2dd4bf',green:'#34d399',emerald:'#34d399',mint:'#34d399',lime:'#a3e635',gold:'#c3ab69',amber:'#f59e0b',orange:'#f97316',yellow:'#facc15',coral:'#fb7185',peach:'#fb7185',pink:'#ff2d78',magenta:'#ff2d78',fuchsia:'#ff2d78',red:'#ef4444',crimson:'#e11d48',maroon:'#9f1239',rose:'#fb7185',brown:'#b45309',silver:'#cbd5e1',white:'#f8fafc',gray:'#94a3b8',grey:'#94a3b8'};
const VX_GLASS=[['aurora','aurora'],['candy','candy'],['neon','neon'],['frost','frost'],['sunset','sunset'],['bubble','bubble'],['classic','classic'],['midnight gold','gold']];
function vxAppMode(m){ state.theme=m; try{ LS.set('treesh_theme',m); }catch(e){} applyTheme(); try{ renderView(); renderNP(); }catch(e){} return m==='dark'?'Dark mode on.':'Light mode on.'; }
function vxThemeCmd(c){ c=String(c||'').toLowerCase().replace(/[?.!,]+$/,'').trim(); if(!c) return null;
  let col=null; for(const k in VX_COLORS){ if(new RegExp('\\b'+k+'\\b').test(c)){ col=k; break; } }
  const verb=/\b(make|set|change|turn|paint|switch|use|go|put)\b/.test(c), themeish=/\b(theme|accent|colou?r|tint|highlight|scheme)\b/.test(c);
  if(/\b(dark|night)\s*(mode|theme)\b|\bgo dark\b|\blights?\s*off\b/.test(c)||(verb&&!col&&/\b(to|on)?\s*dark$/.test(c))) return vxAppMode('dark');
  if(/\b(light|day|bright)\s*(mode|theme)\b|\bgo light\b|\blights?\s*on\b/.test(c)||(verb&&!col&&/\b(to|on)?\s*light$/.test(c))) return vxAppMode('light');
  if(/\b(background|wallpaper|card|cover)\b/.test(c)) return null;
  if(col&&(themeish||verb||c===col)){ const hex=VX_COLORS[col]; state.accent=hex; try{ LS.set('treesh_accent',hex); }catch(e){} applyAccent(hex); try{ renderView(); renderNP(); }catch(e){} return 'Accent colour set to '+col+'.'; }
  if(themeish||/\bglass\b/.test(c)){ const g=VX_GLASS.find(([w])=>new RegExp('\\b'+w+'\\b').test(c)); if(g){ glSetTheme(g[1]); const t=GL_THEMES.find(x=>x.id===g[1]); return 'Theme set to '+(t?t.name:g[0])+'.'; }
    if(/\b(theme|accent|colou?r)\b.*\bto\s+\w+/.test(c)) return 'I don\u2019t know that colour yet. Try blue, pink, gold, teal or purple, or say dark mode.'; }
  return null; }
const _vxExec9=voiceExec;
voiceExec=function(c){ const r=vxThemeCmd(c); return r!=null?r:_vxExec9.apply(this,arguments); };

/* ---------- P9h: Lyric Studio desktop, player in the left rail, preview matches Now Playing ---------- */
function lsDeskMode(){ const ls=state.ls; return !!(ls&&ls.hasAudio&&window.innerWidth>=1024&&(ls.mode==='write'||ls.mode==='sync')); }
function lsWideBody(){ const ls=state.ls; return !!ls&&(ls.mode==='write'||(ls.mode==='sync'&&window.innerWidth>=1024)); }
function lsRailPlayerHtml(){ const ls=state.ls, s=SONG_BY_ID[ls.songId], cov=s&&s.coverArt;
  return `<section class="lsx-card lsx-rp" data-testid="ls-rail-player"><div class="lsx-rp-top"><span class="lsx-rp-art">${cov?img(cov,'h-full w-full object-cover'):'<i data-lucide="music-4"></i>'}</span><span class="min-w-0 flex-1"><b class="clamp-1">${esc(ls.title||'Untitled')}</b><small class="clamp-1">${esc(ls.artist||ls.audioName||'')}</small></span><button data-act="ls-rate" id="ls-rate" aria-label="Playback speed" class="lsx-rp-rate press">${ls.rate}x</button></div>
   <input id="ls-seek" data-testid="ls-seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Seek" class="tr lsx-rp-seek"><div class="lsx-rp-t font-doto"><span id="ls-cur">0:00</span><span id="ls-dur">0:00</span></div>
   <div class="lsx-rp-ctl"><button data-act="ls-seek-back" aria-label="Back 10 seconds" class="lsx-rp-b press"><i data-lucide="rotate-ccw"></i><em>10</em></button><button data-act="ls-play" id="ls-play" data-testid="ls-play" aria-label="Play or pause" class="lsx-rp-pp press"><i data-lucide="${ls.playing?'pause':'play'}" style="width:20px;height:20px" class="fill-current"></i></button><button data-act="ls-seek-fwd" aria-label="Forward 10 seconds" class="lsx-rp-b press"><i data-lucide="rotate-cw"></i><em>10</em></button></div></section>`; }
function lsNpPrevHtml(lines){ const ls=state.ls||{}, s=ls.songId&&SONG_BY_ID[ls.songId], cov=s&&s.coverArt; const title=ls.title||'Untitled lyrics', artist=ls.artist||(state.profile&&state.profile.nickname)||'You';
  const ib=(ic,on)=>`<span class="lsnp-ib${on?' is-on':''}"><i data-lucide="${ic}"></i></span>`;
  return `<aside class="lsx-prev lsnp dark-surface" data-testid="ls-live-preview" aria-label="Now Playing preview"><div class="lsnp-bg" aria-hidden="true">${cov?`<img src="${esc(cov)}" alt="">`:''}<span></span></div>
   <div class="lsnp-top"><span class="lsnp-c"><i data-lucide="chevron-down"></i></span><div class="lsnp-k"><span>Now Playing</span><b class="clamp-1">${esc((s&&s.album)||title)}</b></div><span class="lsnp-live"><i></i>Preview</span></div>
   <div class="lsnp-song"><span class="lsnp-art">${cov?img(cov,'h-full w-full object-cover'):'<i data-lucide="music-2"></i>'}</span><span class="min-w-0"><b class="clamp-1">${esc(title)}</b><small class="clamp-1">${esc(artist)}</small></span></div>
   <div class="lsnp-ly ly-md no-scrollbar" id="ls-prev-body" data-testid="ls-preview-lines">${lines}</div>
   <div class="lsnp-dock"><div class="lsnp-seek"><span id="lsnp-fill"></span></div><div class="lsnp-t font-doto"><span id="lsnp-cur">0:00</span><span id="lsnp-dur">0:00</span></div>
    <div class="lsnp-tr">${ib('shuffle')}<span class="lsnp-sk"><i data-lucide="skip-back" class="fill-current"></i></span><button data-act="ls-play" id="lsnp-play" data-testid="ls-preview-play" aria-label="Play or pause" class="lsnp-pp press"><i data-lucide="${ls.playing?'pause':'play'}" class="fill-current"></i></button><span class="lsnp-sk"><i data-lucide="skip-forward" class="fill-current"></i></span>${ib('repeat')}</div></div>
   <div class="lsnp-acts">${ib('quote',true)}${ib('list-music')}${ib('list-plus')}${ib('info')}${ib('sliders-vertical')}</div></aside>`; }
function lsSyncPrevLines(){ const out=(state.ls.items||[]).map((x,i)=>x.type==='section'?`<p class="lsp-sec" data-i="${i}">${escT(String(x.text||'').replace(/^\[|\]$/g,''))}</p>`:((x.text||'').trim()?`<p class="lsp-l" data-i="${i}">${lsInlineFmt((x.text||'').trim())}</p>`:'')).join('');
  return out||'<p class="lsp-empty">No lines yet. Switch to Write to add lyrics.</p>'; }
const _lsBody9=lsBodyHtml;
lsBodyHtml=function(){ const ls=state.ls; if(!(ls&&ls.mode==='sync'&&lsDeskMode())) return _lsBody9.apply(this,arguments);
  const find=ls.isBlank?'':`<button data-act="lyrics-find" data-id="${ls.songId}" data-testid="ls-find-online" class="lsx-cta press"><i data-lucide="sparkles"></i>Find lyrics online</button>`;
  const tips=`<div class="lsx-card lsx-tips"><p class="lsx-lbl"><i data-lucide="info"></i>Timing tips</p><ul><li>Play the track and tap <b>Set time</b> (or press <b>Space</b>) as each line starts.</li><li>Tap a timestamp to jump there and fix it.</li><li>The preview shows exactly how it plays in Now Playing.</li></ul></div>`;
  return `<div class="lsx-write lsx-sync3"><aside class="lsx-rail" data-testid="ls-rail">${lsRailPlayerHtml()}${find}${tips}</aside><div class="lsx-center">${lsSyncHtml()}</div>${lsNpPrevHtml(lsSyncPrevLines())}</div>`; };
let _lsNpIdx=-1;
function lsNpTick(force){ const ls=state.ls; if(!state.lsOpen||!ls) return; const f=document.getElementById('lsnp-fill'); if(!f) return;
  const cur=_lsAudio.currentTime||0, dur=_lsAudio.duration||ls.dur||0; f.style.width=(dur?Math.min(100,cur/dur*100):0)+'%';
  const c=document.getElementById('lsnp-cur'), d=document.getElementById('lsnp-dur'); if(c) c.textContent=lsFmt(cur); if(d) d.textContent=lsFmt(dur);
  const pp=document.getElementById('lsnp-play'), want=ls.playing?'pause':'play'; if(pp&&pp.dataset.ic!==want){ pp.dataset.ic=want; pp.innerHTML=`<i data-lucide="${want}" class="fill-current"></i>`; icons(); }
  if(ls.mode!=='sync') return; const body=document.getElementById('ls-prev-body'); if(!body) return; const items=ls.items||[]; let idx=-1;
  items.forEach((x,i)=>{ if(x.type==='line'&&x.t!=null&&x.t<=cur+0.15&&(idx<0||x.t>=items[idx].t)) idx=i; });
  if(idx===_lsNpIdx&&!force) return; _lsNpIdx=idx; body.querySelectorAll('.is-on').forEach(e=>e.classList.remove('is-on'));
  const el=idx>=0&&body.querySelector('[data-i="'+idx+'"]'); if(el){ el.classList.add('is-on'); body.scrollTo({top:Math.max(0,el.offsetTop-body.clientHeight*0.4),behavior:force?'auto':'smooth'}); } }
_lsAudio.addEventListener('timeupdate',()=>lsNpTick()); ['play','pause','ended','loadedmetadata'].forEach(ev=>_lsAudio.addEventListener(ev,()=>setTimeout(()=>lsNpTick(true),0)));
const _lsRB9=lsRenderBody;
lsRenderBody=function(){ const ls=state.ls; if(ls&&state.lsOpen&&lsDeskMode()!==!!ls._rail){ renderLS(); return; } _lsRB9.apply(this,arguments); _lsNpIdx=-1; lsNpTick(true); };
let _lsRzT=0; window.addEventListener('resize',()=>{ clearTimeout(_lsRzT); _lsRzT=setTimeout(()=>{ const ls=state.ls; if(!state.lsOpen||!ls||lsDeskMode()===!!ls._rail) return; if(ls.mode==='write'){ const ta=$("#ls-write"); if(ta) ls.items=lsParseWriteText(ta.value,ls.items); } else { try{ lsCommitEdits(); }catch(e){} } renderLS(); },220); });

/* ---------- P9h: Music Manager, one glass studio to upload, browse and edit (custom music stays on this device) ---------- */
const UM_GEN=["Rap","Hip-Hop","R&B","Pop","Afrobeats","Drill","Trap","Rock","Electronic","Reggae","Country","Jazz","Gospel","Other"];
let _umQ=[], _umPv=null, _umDragT=0;
function umIsAudio(f){ return /^audio\//.test(f.type||'')||/\.(mp3|wav|m4a|aac|ogg|oga|flac|opus|webm)$/i.test(f.name||''); }
function umSize(b){ return b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB'; }
function umQMeta(it){ return (it.url?'Link \u00b7 '+umHost(it.url):umSize(it.file.size))+(it.dur?' \u00b7 '+fmt(it.dur):''); }
function umQCardHtml(it,i){ const g=UM_GEN.map(x=>`<option value="${esc(x)}" ${it.genre===x?'selected':''}>${esc(x)}</option>`).join(''); const on=_umPv&&_umPv.qid===it.qid&&!_umPv.a.paused;
  return `<article class="umx-qc" style="--d:${Math.min(i,10)*40}ms" data-testid="um-queue-card-${i}"><button type="button" data-act="um-q-cov-open" data-qid="${it.qid}" data-testid="um-queue-cover-${i}" aria-label="Add cover art" aria-expanded="${!!it.covOpen}" class="umx-qc-art press${it.covOpen?' on':''}">${it.coverUrl?`<img src="${it.coverUrl}" alt="">`:'<i data-lucide="image-plus"></i><span>Cover</span>'}</button>
   <div class="umx-qc-main"><div class="umx-qc-file"><i data-lucide="${it.url?'link-2':'file-audio-2'}"></i><span class="clamp-1">${esc(it.url?umLinkName(it.url):(it.file.name||'Audio file'))}</span><em id="umq-meta-${it.qid}">${umQMeta(it)}</em></div>
    <input data-q="title" data-qid="${it.qid}" value="${esc(it.title)}" placeholder="Track title" maxlength="120" class="umx-in" data-testid="um-queue-title-${i}">
    <div class="umx-qc-row"><input data-q="artist" data-qid="${it.qid}" value="${esc(it.artist)}" placeholder="Artist" maxlength="80" class="umx-in" data-testid="um-queue-artist-${i}"><select data-q="genre" data-qid="${it.qid}" aria-label="Genre" class="umx-in" data-testid="um-queue-genre-${i}"><option value="">Genre</option>${g}</select></div></div>
   <div class="umx-qc-side"><button type="button" data-act="um-q-play" data-qid="${it.qid}" data-ic="${on?'pause':'play'}" aria-label="Preview" data-testid="um-queue-play-${i}" class="umx-ib press"><i data-lucide="${on?'pause':'play'}"></i></button><button type="button" data-act="um-q-del" data-qid="${it.qid}" aria-label="Remove" data-testid="um-queue-remove-${i}" class="umx-ib is-x press"><i data-lucide="x"></i></button></div>${it.covOpen?umCovPanel(it,i):''}</article>`; }
function umUpHtml(){ const n=_umQ.length;
  return `<section class="umx-up${n?' has-q':''}" id="um-up" data-testid="um-upload">${umSrcTabs()}${_umSrc==='link'?umLinkForm(n):`<label for="um-files" class="umx-drop press" data-testid="um-dropzone"><span class="umx-drop-ic"><i data-lucide="upload"></i></span><span class="min-w-0"><b>${n?'Add more songs':'Drop your songs here'}</b><small>or tap to browse \u00b7 MP3, WAV, M4A, OGG, FLAC \u00b7 up to 30 MB each</small></span></label>`}
   <input id="um-files" type="file" multiple accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.oga,.flac,.opus" class="sr-only" data-testid="um-file-input">
   ${n?`<div class="umx-qhead"><p><b>${n}</b> ${n===1?'song':'songs'} ready. Add titles and covers, then save.</p><button type="button" data-act="um-q-clear" data-testid="um-queue-clear" class="umx-link press">Clear all</button></div><div class="umx-q" data-testid="um-queue">${_umQ.map(umQCardHtml).join('')}</div><div class="umx-qfoot"><button type="button" data-act="um-q-save" data-testid="um-queue-save" class="um-pill is-primary press"><i data-lucide="check"></i>Save ${n===1?'song':n+' songs'}</button></div>`:''}
   <p class="umx-note"><i data-lucide="hard-drive"></i>Custom music stays on this device. It never uploads to your Treesh account.</p></section>`; }
function umQSync(){ document.querySelectorAll('#um-up [data-q]').forEach(el=>{ const it=_umQ.find(x=>x.qid===el.dataset.qid); if(it) it[el.dataset.q]=el.value; }); }
function umUpRender(){ const el=document.getElementById('um-up'); if(!el) return; umQSync(); el.outerHTML=umUpHtml(); icons(); try{ pmEnhance(); }catch(e){} }
function umQAdd(list){ umQSync(); const files=[...(list||[])]; let bad=0, big=0;
  files.forEach(f=>{ if(!umIsAudio(f)){ bad++; return; } if(f.size>USER_MAX_BYTES){ big++; return; }
    const it={qid:'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),file:f,title:(f.name||'Track').replace(/\.[^.]+$/,'').replace(/_+/g,' ').trim(),artist:'You',genre:'',cover:null,coverUrl:'',dur:0}; _umQ.push(it);
    probeAudioDuration(f).then(d=>{ it.dur=d||0; const m=document.getElementById('umq-meta-'+it.qid); if(m) m.textContent=umQMeta(it); }).catch(()=>{}); });
  if(bad) toast(bad+' file'+(bad>1?'s':'')+' skipped','Only audio files can be added'); if(big) toast(big+' file'+(big>1?'s are':' is')+' too large','Max 30 MB per song');
  umUpRender(); }
function umPvStop(){ if(!_umPv) return; try{ _umPv.a.pause(); }catch(e){} if(/^blob:/.test(_umPv.u||'')){ try{ URL.revokeObjectURL(_umPv.u); }catch(e){} } _umPv=null; }
function umQPlayIcons(){ document.querySelectorAll('#um-up [data-act="um-q-play"]').forEach(b=>{ const ic=_umPv&&_umPv.qid===b.dataset.qid&&!_umPv.a.paused?'pause':'play'; if(b.dataset.ic!==ic){ b.dataset.ic=ic; b.innerHTML=`<i data-lucide="${ic}"></i>`; } }); icons(); }
function umQPlay(qid){ const it=_umQ.find(x=>x.qid===qid); if(!it) return; if(_umPv&&_umPv.qid===qid){ if(_umPv.a.paused) _umPv.a.play().catch(()=>{}); else _umPv.a.pause(); return; }
  umPvStop(); const u=it.url||URL.createObjectURL(it.file), a=new Audio(u); _umPv={qid,a,u}; try{ audio.pause(); }catch(e){} ['play','pause','ended'].forEach(ev=>a.addEventListener(ev,umQPlayIcons)); a.play().catch(()=>toast('Can\u2019t preview this file')); }
function umQCover(qid){ const it=_umQ.find(x=>x.qid===qid); if(!it) return; const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.className='sr-only'; document.body.appendChild(inp);
  inp.addEventListener('change',()=>{ const f=inp.files&&inp.files[0]; inp.remove(); if(!f) return; if(f.size>20*1024*1024){ toast('Image too large','Use one under 20 MB'); return; }
    openCoverStudio(URL.createObjectURL(f),'Cover for '+(it.title||'your song'),true,{out:[1000,1000],onApply:d=>{ umQSync(); try{ it.cover=_dataURLtoBlob(d); }catch(e){ return; } if(it.coverUrl){ try{ URL.revokeObjectURL(it.coverUrl); }catch(e){} } it.coverUrl=URL.createObjectURL(it.cover); it.coverLink=''; it.covOpen=false; umUpRender(); toast('Cover added'); }}); });
  inp.click(); }
async function umQSave(){ umQSync(); if(!_umQ.length) return; const miss=_umQ.find(x=>!String(x.title||'').trim());
  if(miss){ toast('Add a title for every song'); const el=document.querySelector('#um-up [data-q="title"][data-qid="'+miss.qid+'"]'); if(el) el.focus(); return; }
  const btn=document.querySelector('[data-act="um-q-save"]'); if(btn){ btn.disabled=true; btn.innerHTML='<i data-lucide="loader-circle" class="sba-spin"></i>Saving\u2026'; icons(); }
  umPvStop(); let n=0;
  try{ for(const it of _umQ.slice()){ const d=it.dur||(it.file?await probeAudioDuration(it.file).catch(()=>0):0); const id='u-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)+'-'+n;
      const meta={title:it.title.trim(),artist:String(it.artist||'').trim()||'You',album:'',genre:it.genre||'',featuring:'',writtenBy:'',producer:'',mixer:'',label:'',mood:'',videographer:'',creationDate:'',desc:'',explicit:false};
      await idbPut({id,meta,audioBlob:it.file||null,audioLink:it.url||'',audioType:it.file?(it.file.type||''):'',coverBlob:it.cover||null,coverLink:it.cover?'':(it.coverLink||''),coverType:it.cover?(it.cover.type||'image/jpeg'):'',duration:d||0,addedAt:Date.now()+n});
      n++; if(/^blob:/.test(it.coverUrl||'')){ try{ URL.revokeObjectURL(it.coverUrl); }catch(e){} } _umQ=_umQ.filter(x=>x!==it); }
    await loadUserSongs(); umUpRender(); toast(n+' song'+(n!==1?'s':'')+' added','Saved on this device');
  }catch(e){ console.error('save songs failed',e); if(n) try{ await loadUserSongs(); }catch(_){} toast('Couldn\u2019t save every song',isQuotaError(e)?'Your device storage is full':'Storage error. Try again.'); umUpRender(); } }
function openMusicManager(o){ o=o||{}; umS(); state.umOpen=true; state.um.edit=null; let r=document.getElementById('um-root'); if(!r){ r=document.createElement('div'); r.id='um-root'; document.body.appendChild(r); }
  r.innerHTML=`<div class="um-bd" data-testid="music-manager"><div class="um-panel umx dark-surface" role="dialog" aria-label="Music Manager"><span class="pm-grab" aria-hidden="true"></span><div class="um-scroll soft-scroll" id="um-scroll">${umHeaderHtml()}<div class="umx-wrap">${umUpHtml()}</div><div class="um-sticky" id="um-tools-wrap">${umToolsHtml()}</div><div id="um-body" class="um-body">${umBodyHtml()}</div></div><div class="um-edit" id="um-edit" hidden></div></div></div>`;
  icons(); syncScrollLock(); try{ pmEnhance(); }catch(e){} if(o.upload) setTimeout(()=>{ const z=document.getElementById('um-up'); if(z) z.classList.add('is-pulse'); },360); }
function openAddMusic(tab,editId){ if(editId){ umEditOpen(editId); return; } const open=state.umOpen&&document.getElementById('um-up');
  if(!open){ const m=document.getElementById('modal'); if(m&&m.childElementCount&&m.querySelector('[data-testid="custom-studio-dialog"],[data-testid="edit-track-sheet"]')) closeModal(); openMusicManager({upload:tab!=='manage'}); return; }
  if(tab==='manage') return; if(state.um&&state.um.edit) umEditClose(); const z=document.getElementById('um-up'); if(z) z.scrollIntoView({behavior:'smooth',block:'start'}); const f=document.getElementById('um-files'); if(f) f.click(); }
function umEditOpen(id){ const ed=SONG_BY_ID[id]||USER_SONGS.find(s=>s.id===id); if(!ed) return; if(!state.umOpen||!document.getElementById('um-edit')) openMusicManager();
  umS().edit=id; _amEditId=id; _amCoverBlob=null; umPvStop();
  const GEN=UM_GEN.slice(); if(ed.genre&&GEN.indexOf(ed.genre)<0) GEN.unshift(ed.genre); const genOpts=GEN.map(g=>`<option value="${esc(g)}" ${ed.genre===g?'selected':''}>${esc(g)}</option>`).join('');
  const hasCover=!!(ed.coverArt&&ed.coverArt!==FALLBACK), V=k=>(ed[k]!=null)?(''+ed[k]):'', exOn=!!ed.explicit;
  const html=amEditorHtml(ed,{genOpts,hasCover,V,exOn}).replace('data-act="modal-close" aria-label="Close" data-testid="custom-studio-close" class="te-x press"><i data-lucide="x"></i>','data-act="um-edit-back" aria-label="Back to your music" data-testid="um-edit-back" class="te-x press"><i data-lucide="arrow-left"></i>');
  const box=document.getElementById('um-edit'), sc=document.getElementById('um-scroll'); box.innerHTML=`<div class="te-sheet te-in-um" data-testid="edit-track-sheet">${html.replace('<header class="te-head">','<header class="te-head um-ehead" data-testid="um-edit-header">').replace('class="te-title clamp-1"','class="te-title um-title clamp-1"')}</div>`; box.hidden=false; if(sc) sc.hidden=true;
  const p=document.querySelector('#um-root .um-panel'); if(p) p.classList.add('is-edit'); icons(); try{ pmEnhance(); }catch(e){}
  const cov=document.getElementById('am-cover'); if(cov) cov.addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return; if(f.size>20*1024*1024){ toast('Image too large','Use one under 20 MB'); return; } openCoverStudio(URL.createObjectURL(f),f.name||'New cover art',true); });
  const aud=document.getElementById('am-audio'); if(aud) aud.addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; const nm=document.getElementById('am-audio-name'); if(f){ if(nm) nm.textContent=f.name; try{ amSetPreview(URL.createObjectURL(f),true,f.name); }catch(_){} } });
  amDestroyPreview(); if(ed.audioUrl) amSetPreview(ed.audioUrl,false,ed.title||'Current track'); amSetGlow(null); if(hasCover){ try{ avgColorFromUrl(ed.coverArt).then(amSetGlow); }catch(_){} } }
function umEditClose(){ const box=document.getElementById('um-edit'), sc=document.getElementById('um-scroll'); try{ amDestroyPreview(); }catch(e){} if(box){ box.innerHTML=''; box.hidden=true; } if(sc) sc.hidden=false;
  const p=document.querySelector('#um-root .um-panel'); if(p) p.classList.remove('is-edit'); if(state.um) state.um.edit=null; _amEditId=null; _amCoverBlob=null; umRefresh(); }
function teTab(v){ document.querySelectorAll('.te-tab').forEach(b=>{ const on=b.dataset.val===v; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); }); document.querySelectorAll('[data-te-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.tePane!==v)); const b=document.getElementById('te-body'); if(b) b.scrollTop=0; }
const _sct9=saveCustomTrack;
saveCustomTrack=async function(){ const inUm=!!(state.um&&state.um.edit&&document.querySelector('#um-edit [data-act="am-save"]')); const r=await _sct9.apply(this,arguments);
  if(inUm){ const b=document.querySelector('#um-edit [data-act="am-save"]'); if(b&&b.disabled) umEditClose(); } return r; };
const _cmm9=closeMusicManager;
closeMusicManager=function(){ umPvStop(); try{ amDestroyPreview(); }catch(e){} if(state.um) state.um.edit=null; _amEditId=null; return _cmm9.apply(this,arguments); };
document.addEventListener('change',e=>{ if(e.target&&e.target.id==='um-files'){ const f=e.target.files; if(f&&f.length) umQAdd(f); e.target.value=''; } });
document.addEventListener('dragover',e=>{ const p=e.target&&e.target.closest&&e.target.closest('#um-root .um-panel'); if(!p||p.classList.contains('is-edit')) return; e.preventDefault(); if(e.dataTransfer) e.dataTransfer.dropEffect='copy'; p.classList.add('umx-dragging'); clearTimeout(_umDragT); _umDragT=setTimeout(()=>p.classList.remove('umx-dragging'),200); });
document.addEventListener('drop',e=>{ const p=e.target&&e.target.closest&&e.target.closest('#um-root .um-panel'); if(!p) return; e.preventDefault(); p.classList.remove('umx-dragging'); if(p.classList.contains('is-edit')) return; const fs=e.dataTransfer&&e.dataTransfer.files; if(fs&&fs.length){ umQAdd(fs); const z=document.getElementById('um-up'); if(z) z.scrollIntoView({behavior:'smooth',block:'start'}); } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&state.um&&state.um.edit&&state.umOpen){ const m=document.getElementById('modal2'); if(m&&m.childElementCount) return; e.stopImmediatePropagation(); umEditClose(); } },true);
const _teL9=teLyrics;
teLyrics=function(mode,id){ if(!(state.um&&state.um.edit&&document.getElementById('um-edit'))) return _teL9.apply(this,arguments);
  const go=()=>{ if(mode==='find') openFindLyrics(id); else openLyricSync(id); };
  if(!state._teDirty&&!_amCoverBlob){ umEditClose(); setTimeout(go,120); return; }
  saveCustomTrack().then(()=>{ if(!(state.um&&state.um.edit)) setTimeout(go,120); }); };

/* ---------- P9h: Magic Markup deep edits. Tap any element to move, resize, hide or restyle it, saved per page ---------- */
const _mkd={on:false,prof:false,key:null,el:null,page:null,raf:0,tab:'style'};
const MKD_SKIP='.mk-ui,.mkd-ui,[data-mk-st],.mk-stickers,.mk-sec-layer,.mk-ph';
const MKD_INK=['#ffffff','#111111','#9328ff','#3b82f6','#22d3ee','#34d399','#f5c451','#f97316','#ff2d78'];
const MKD_SH={1:['Soft','0 12px 30px -10px rgba(0,0,0,.55)'],2:['Glow','0 0 0 1px color-mix(in srgb,var(--treesh-purple) 60%,transparent),0 0 34px -4px var(--treesh-purple)'],3:['Deep','0 28px 60px -18px rgba(0,0,0,.9)']};
const MKD_BD={1:['Line','1px solid rgba(255,255,255,.2)'],2:['Accent','2px solid var(--treesh-purple)'],3:['Dashed','2px dashed rgba(255,255,255,.45)']};
const MKD_FF={display:['Display',"'Special Gothic Expanded One','Manrope',sans-serif"],serif:['Serif',"'Playfair Display',Georgia,serif"],pixel:['Pixel',"'Doto',ui-monospace,monospace"],mono:['Mono','ui-monospace,SFMono-Regular,Menlo,monospace']};
const MKD_BG=['rgba(255,255,255,.1)','rgba(0,0,0,.45)','rgba(147,40,255,.3)','rgba(59,130,246,.3)','rgba(34,211,238,.28)','rgba(52,211,153,.28)','rgba(245,196,81,.3)','rgba(255,45,120,.3)'];
function mkdRoot(){ return _mkd.prof?document.getElementById('profile-scroll'):document.querySelector('#view [data-mk-page]'); }
function mkdPg(){ return _mkd.prof?'profile':mkCurPage(); }
function mkdLive(){ return _mkd.on&&(_mkd.prof||state.mkEdit); }
function mkdKids(n){ return [...n.children].filter(c=>!c.matches(MKD_SKIP)); }
function mkdKey(el){ const root=mkdRoot(); if(!root||!el||el===root||!root.contains(el)) return null; const path=[]; let n=el;
  while(n&&n!==root){ const tid=n.getAttribute&&n.getAttribute('data-testid'); if(tid){ const all=[...root.querySelectorAll('[data-testid="'+CSS.escape(tid)+'"]')]; return 'T:'+tid+':'+all.indexOf(n)+(path.length?'/'+path.reverse().join('/'):''); }
    const p=n.parentElement; if(!p) return null; const i=mkdKids(p).indexOf(n); if(i<0) return null; path.push(i); n=p; } return n===root&&path.length?'R:'+path.reverse().join('/'):null; }
function mkdFind(key){ const root=mkdRoot(); if(root&&key&&key.indexOf('R:')===0){ let n=root; for(const i of key.slice(2).split('/').map(Number)){ n=mkdKids(n)[i]; if(!n) return null; } return n; } const m=key&&/^T:(.+):(\d+)((?:\/\d+)*)$/.exec(key); if(!root||!m) return null; let n=root.querySelectorAll('[data-testid="'+CSS.escape(m[1])+'"]')[+m[2]]; if(!n) return null;
  for(const i of (m[3]?m[3].slice(1).split('/').map(Number):[])){ n=mkdKids(n)[i]; if(!n) return null; } return n; }
function mkdStore(page){ const P=mkPage(page); if(!P.deep||typeof P.deep!=='object') P.deep={}; return P.deep; }
function mkdCfg(){ const page=mkdPg(); if(!page||!_mkd.key) return null; const D=mkdStore(page); return D[_mkd.key]||(D[_mkd.key]={}); }
function mkdApplyEl(el,c,edit){ const st=el.style; if(el._mkdOrig==null) el._mkdOrig=st.cssText; st.cssText=el._mkdOrig; el.classList.remove('mkd-ghost','mkd-c'); if(el._mkdTxt!=null&&(!c||c.txt==null)){ el.textContent=el._mkdTxt; el._mkdTxt=null; } if(!c) return;
  const imp=(p,v)=>st.setProperty(p,v,'important');
  if(c.x||c.y){ imp('translate',(c.x||0)+'px '+(c.y||0)+'px'); if(getComputedStyle(el).position==='static') imp('position','relative'); imp('z-index','5'); }
  if(c.w){ imp('width',c.w+'px'); imp('max-width','none'); imp('flex','none'); }
  if(c.h){ imp('height',c.h+'px'); imp('min-height','0'); imp('overflow','hidden'); }
  if(c.sc&&c.sc!==100) imp('scale',String(c.sc/100));
  if(c.fs) imp('font-size',c.fs+'px'); if(c.fw) imp('font-weight','800'); if(c.ta) imp('text-align',c.ta);
  if(c.r!=null){ imp('border-radius',c.r+'px'); imp('overflow','hidden'); }
  if(c.op!=null&&c.op<100) imp('opacity',String(c.op/100));
  if(c.bg) imp('background',c.bg);
  if(c.c){ el.classList.add('mkd-c'); st.setProperty('--mkd-c',c.c); }
  if(c.pd!=null) imp('padding',c.pd+'px');
  if(c.rot) imp('rotate',c.rot+'deg');
  if(c.ls) imp('letter-spacing',(c.ls/100)+'em');
  if(c.sh&&MKD_SH[c.sh]) imp('box-shadow',MKD_SH[c.sh][1]);
  if(c.bd&&MKD_BD[c.bd]) imp('border',MKD_BD[c.bd][1]);
  if(c.ff&&MKD_FF[c.ff]) imp('font-family',MKD_FF[c.ff][1]);
  if(c.txt!=null&&mkdLeaf(el)){ if(el._mkdTxt==null) el._mkdTxt=el.textContent; el.textContent=c.txt; }
  if(c.hide){ if(edit) el.classList.add('mkd-ghost'); else imp('display','none'); } }
function mkdLeaf(el){ return !!el&&!el.children.length&&!/^(svg|img|input|textarea|select)$/i.test(el.tagName)&&(el._mkdTxt!=null||((el.textContent||'').trim().length>0&&el.textContent.length<300)); }
function mkdApply(){ if(_mkd.prof){ const pg=mkCurPage(); _mkd.prof=false; try{ const D=pg&&(mkS().pages[pg]||{}).deep; if(D) Object.keys(D).forEach(k=>{ const el=mkdFind(k); if(el) mkdApplyEl(el,D[k],false); }); }finally{ _mkd.prof=true; } return; }
  const page=mkCurPage(); const edit=!!state.mkEdit; if(!page){ if(_mkd.on) mkdOff(); return; }
  const D=(mkS().pages[page]||{}).deep; if(D) Object.keys(D).forEach(k=>{ const el=mkdFind(k); if(el) mkdApplyEl(el,D[k],edit); });
  if(!_mkd.on) return; if(!edit){ mkdOff(); return; } if(_mkd.page!==page){ _mkd.page=page; _mkd.key=null; } _mkd.el=_mkd.key?mkdFind(_mkd.key):null; document.documentElement.classList.add('mkd-on'); mkdPanel(); mkdBoxLoop(); }
function mkdName(n){ if(n.dataset&&n.dataset.mkId){ const lb=n.querySelector(':scope > .mk-bar .mk-bar-label'); return lb?lb.textContent:'Section'; } if(n.classList&&n.classList.contains('mk-inner')) return 'Content';
  const T={h1:'Heading',h2:'Heading',h3:'Heading',h4:'Heading',p:'Text',span:'Text',b:'Text',strong:'Text',em:'Text',small:'Text',img:'Image',button:'Button',a:'Link',svg:'Icon',input:'Field',section:'Card',article:'Card',ul:'List',li:'Item',label:'Label'};
  const k=T[n.tagName.toLowerCase()]||'Box'; const txt=k==='Image'||k==='Icon'?'':(n.innerText||'').trim().replace(/\s+/g,' '); return txt&&txt.length<=40?k+' \u201c'+txt.slice(0,24)+(txt.length>24?'\u2026':'')+'\u201d':k; }
function mkdChain(el){ const out=[]; const root=mkdRoot(); const blk=(el&&el.closest('[data-mk-id]'))||root; for(let n=el;n&&blk&&n!==root;n=n.parentElement){ if(!n.matches(MKD_SKIP)) out.unshift(n); if(n===blk) break; } return out; }
function mkdUi(){ let r=document.getElementById('mkd-ui'); if(!r){ r=document.createElement('div'); r.id='mkd-ui'; r.className='mkd-ui';
    r.innerHTML=`<div class="mkd-hov" aria-hidden="true"></div><div class="mkd-box" data-testid="mkd-box"><span class="mkd-tag"></span><button type="button" class="mkd-h mkd-h-move" data-mkd-drag="move" data-testid="mkd-move-handle" aria-label="Drag to move"><i data-lucide="move"></i></button><button type="button" class="mkd-h mkd-h-size" data-mkd-drag="size" data-testid="mkd-resize-handle" aria-label="Drag to resize"></button></div><div class="mkd-panel dark-surface" data-testid="mkd-panel"></div>`;
    document.body.appendChild(r); icons(); } return r; }
function mkdBox(){ const r=document.getElementById('mkd-ui'); if(!r) return; const b=r.querySelector('.mkd-box'), el=_mkd.el; if(!el||!el.isConnected){ b.style.display='none'; return; }
  const q=el.getBoundingClientRect(); b.style.display='block'; b.style.transform='translate('+q.left+'px,'+q.top+'px)'; b.style.width=q.width+'px'; b.style.height=q.height+'px'; }
function mkdBoxLoop(){ if(_mkd.raf) return; const f=()=>{ _mkd.raf=0; if(!_mkd.on) return; if(_mkd.prof&&!document.getElementById('profile-scroll')){ mkdOff(true); return; } mkdBox(); _mkd.raf=requestAnimationFrame(f); }; _mkd.raf=requestAnimationFrame(f); }
function mkdSl(k,label,min,max,val,unit){ return `<label class="mkd-sl"><span>${label}<b id="mkd-v-${k}">${val}${unit}</b></span><input type="range" class="tr" min="${min}" max="${max}" step="1" value="${val}" data-mkd="${k}" data-unit="${unit}" data-testid="mkd-slider-${k}"></label>`; }
function mkdPanel(){ const r=mkdUi(), p=r.querySelector('.mkd-panel'), el=_mkd.el; const c=(el&&mkdCfg())||{};
  const head=`<div class="mkd-ph"><span class="mkd-ph-ic"><i data-lucide="crosshair"></i></span><div class="min-w-0 flex-1"><p class="mkd-k">Edit any element</p><p class="mkd-t clamp-1" data-testid="mkd-selected">${el?esc(mkdName(el)):'Tap anything on the page to select it'}</p></div><button type="button" data-act="mkd-off" data-testid="mkd-close" aria-label="Stop selecting" class="mkd-x press"><i data-lucide="check"></i></button></div>`;
  if(!el){ p.innerHTML=head+`<p class="mkd-hint">Tap any title, text, button, picture, icon or box inside a section. You can then edit its text, move, rotate, resize, hide or restyle it. Use the path chips to jump to a parent. Changes save to this page only.</p>${Object.keys(mkdStore(mkdPg())).length?`<button type="button" data-act="mkd-reset-all" data-testid="mkd-reset-all" class="mkd-link press"><i data-lucide="rotate-ccw"></i>Undo every element edit on this page</button>`:''}`; icons(); return; }
  const chain=mkdChain(el); const crumbs=`<div class="mkd-crumbs no-scrollbar" data-testid="mkd-breadcrumb">${chain.map((n,i)=>`${i?'<i data-lucide="chevron-right" class="mkd-sep"></i>':''}<button type="button" data-act="mkd-crumb" data-i="${i}" data-testid="mkd-crumb-${i}" class="mkd-cr${n===el?' on':''}">${esc(mkdName(n).replace(/ \u201c.*$/,''))}</button>`).join('')}</div>`;
  const acts=`<div class="mkd-acts"><button type="button" data-act="mkd-parent" data-testid="mkd-parent" class="mkd-btn press"${chain.length<2?' disabled':''}><i data-lucide="arrow-up"></i>Parent</button><button type="button" data-act="mkd-hide" data-testid="mkd-hide" class="mkd-btn press${c.hide?' on':''}"><i data-lucide="${c.hide?'eye':'eye-off'}"></i>${c.hide?'Show':'Hide'}</button><button type="button" data-act="mkd-reset" data-testid="mkd-reset" class="mkd-btn press"><i data-lucide="rotate-ccw"></i>Reset</button></div>${el.closest('[data-mk-id]')?`<button type="button" data-act="mkd-section" data-testid="mkd-section" class="mkd-link press"><i data-lucide="layout-grid"></i>Section options (width, style, order)</button>`:''}`;
  const tabs=`<div class="mkd-tabs">${[['style','Style','palette'],['move','Move','move'],['size','Size','maximize-2']].map(([k,l,ic])=>`<button type="button" data-act="mkd-tab" data-val="${k}" data-testid="mkd-tab-${k}" class="mkd-tab${_mkd.tab===k?' on':''}"><i data-lucide="${ic}"></i>${l}</button>`).join('')}</div>`;
  const cs=getComputedStyle(el); let body='';
  if(_mkd.tab==='move') body=`<div class="mkd-pad"><button type="button" data-act="mkd-nudge" data-val="u" class="press" aria-label="Up" data-testid="mkd-nudge-u"><i data-lucide="arrow-up"></i></button><button type="button" data-act="mkd-nudge" data-val="l" class="press" aria-label="Left" data-testid="mkd-nudge-l"><i data-lucide="arrow-left"></i></button><span id="mkd-xy" data-testid="mkd-xy">${c.x||0}, ${c.y||0}</span><button type="button" data-act="mkd-nudge" data-val="r" class="press" aria-label="Right" data-testid="mkd-nudge-r"><i data-lucide="arrow-right"></i></button><button type="button" data-act="mkd-nudge" data-val="d" class="press" aria-label="Down" data-testid="mkd-nudge-d"><i data-lucide="arrow-down"></i></button></div>${mkdSl('rot','Rotate',-45,45,c.rot||0,'\u00b0')}<p class="mkd-hint">Or drag the <b>move</b> handle on the element. <button type="button" data-act="mkd-unset" data-val="x,y,rot" class="mkd-link press">Reset position</button></p>`;
  else if(_mkd.tab==='size'){ const q=el.getBoundingClientRect(); body=`<div class="mkd-wh"><div><span>Width</span><button type="button" data-act="mkd-dim" data-val="w,-16" class="press" data-testid="mkd-w-minus"><i data-lucide="minus"></i></button><b id="mkd-w">${c.w||Math.round(q.width)}</b><button type="button" data-act="mkd-dim" data-val="w,16" class="press" data-testid="mkd-w-plus"><i data-lucide="plus"></i></button></div><div><span>Height</span><button type="button" data-act="mkd-dim" data-val="h,-16" class="press" data-testid="mkd-h-minus"><i data-lucide="minus"></i></button><b id="mkd-h">${c.h||Math.round(q.height)}</b><button type="button" data-act="mkd-dim" data-val="h,16" class="press" data-testid="mkd-h-plus"><i data-lucide="plus"></i></button></div></div>${mkdSl('sc','Scale',50,200,c.sc||100,'%')}<p class="mkd-hint">Or drag the corner handle. <button type="button" data-act="mkd-unset" data-val="w,h,sc" class="mkd-link press">Reset size</button></p>`; }
  else { const fs=c.fs||Math.round(parseFloat(cs.fontSize)||16);
    const chips=(act,map,cur)=>`<div class="mkd-chips"><button type="button" data-act="${act}" data-val="" data-testid="${act}-none" class="mkd-chip press${cur?'':' on'}">None</button>${Object.keys(map).map(k=>`<button type="button" data-act="${act}" data-val="${k}" data-testid="${act}-${k}" class="mkd-chip press${String(cur)===String(k)?' on':''}">${map[k][0]}</button>`).join('')}</div>`;
    const leaf=mkdLeaf(el), txt=leaf?(c.txt!=null?c.txt:(el._mkdTxt!=null?el._mkdTxt:el.textContent)):'';
    body=`${leaf?`<p class="mkd-lbl">Text</p><input id="mkd-txt" class="mkd-in" maxlength="300" value="${esc(txt)}" data-testid="mkd-text-input" placeholder="Type new text">`:''}<p class="mkd-lbl">Font</p>${chips('mkd-ff',MKD_FF,c.ff||'')}<p class="mkd-lbl">Text colour</p><div class="mkd-sw">${['',...MKD_INK].map(h=>`<button type="button" data-act="mkd-col" data-val="${h}" data-testid="mkd-col-${h.replace('#','')||'none'}" class="press${(c.c||'')===h?' on':''}" style="${h?'--s:'+h:''}" aria-label="${h||'Original colour'}">${h?'':'<i data-lucide="x"></i>'}</button>`).join('')}</div>
     <p class="mkd-lbl">Background</p><div class="mkd-sw">${['',...MKD_BG].map((h,i)=>`<button type="button" data-act="mkd-bg" data-val="${h}" data-testid="mkd-bg-${i}" class="press${(c.bg||'')===h?' on':''}" style="${h?'--s:'+h:''}" aria-label="${h?'Background '+i:'No background'}">${h?'':'<i data-lucide="x"></i>'}</button>`).join('')}</div>
     ${mkdSl('fs','Text size',8,120,fs,'px')}<div class="mkd-row"><button type="button" data-act="mkd-bold" data-testid="mkd-bold" class="mkd-btn press${c.fw?' on':''}"><i data-lucide="bold"></i>Bold</button>${['left','center','right'].map(a=>`<button type="button" data-act="mkd-align" data-val="${a}" data-testid="mkd-align-${a}" aria-label="Align ${a}" class="mkd-btn is-ic press${c.ta===a?' on':''}"><i data-lucide="align-${a}"></i></button>`).join('')}</div>
     ${mkdSl('ls','Letter spacing',-10,40,c.ls||0,'')}${mkdSl('pd','Padding',0,80,c.pd!=null?c.pd:Math.round(parseFloat(cs.paddingTop)||0),'px')}${mkdSl('r','Corners',0,60,c.r!=null?c.r:Math.round(parseFloat(cs.borderTopLeftRadius)||0),'px')}${mkdSl('op','Opacity',10,100,c.op!=null?c.op:100,'%')}<p class="mkd-lbl">Shadow</p>${chips('mkd-sh',MKD_SH,c.sh||'')}<p class="mkd-lbl">Border</p>${chips('mkd-bd',MKD_BD,c.bd||'')}`; }
  p.innerHTML=head+crumbs+acts+tabs+`<div class="mkd-body">${body}</div>`; icons(); p.querySelectorAll('input[type=range]').forEach(x=>{ try{ fillSlider(x); }catch(e){} }); }
function mkdRefresh(){ const page=mkdPg(); if(!_mkd.el||!page) return; const c=mkdCfg(); mkdApplyEl(_mkd.el,c,true); mkdBox(); }
function mkdCommit(){ const page=mkdPg(); if(!page||!_mkd.key) return; const D=mkdStore(page), c=D[_mkd.key]; if(c){ Object.keys(c).forEach(k=>{ if(c[k]===''||c[k]==null||c[k]===false||(k==='sc'&&c[k]===100)||(k==='op'&&c[k]===100)||((k==='x'||k==='y'||k==='rot'||k==='ls')&&!c[k])) delete c[k]; }); if(!Object.keys(c).length) delete D[_mkd.key]; } mkSaveSoon(); }
function mkdSelect(el){ if(!el) return; const svg=el.closest('svg'); if(svg) el=svg; const key=mkdKey(el); if(!key) return; _mkd.key=key; _mkd.el=el; _mkd.page=mkdPg(); mkdPanel(); mkdBoxLoop(); }
function mkdToggle(){ if(_mkd.on){ mkdOff(); return; } if(!state.mkEdit) mkStart(); if(!mkCurPage()){ toast('Open Library, Icons, Studios or Game','Element editing works on those pages'); return; }
  _mkd.on=true; _mkd.key=null; _mkd.el=null; _mkd.page=mkCurPage(); state.mkSheet=null; state.mkSel=null; mkRenderSheet(); document.querySelectorAll('#view .mk-sel').forEach(x=>x.classList.remove('mk-sel'));
  document.documentElement.classList.add('mkd-on'); mkdPanel(); mkdBoxLoop(); mkRenderChrome(); toast('Tap anything to edit it','Move, resize, hide or restyle. Saved to this page'); }
function mkdOff(quiet){ const wasProf=_mkd.prof; _mkd.on=false; _mkd.prof=false; _mkd.key=null; _mkd.el=null; if(_mkd.raf){ cancelAnimationFrame(_mkd.raf); _mkd.raf=0; } const r=document.getElementById('mkd-ui'); if(r) r.remove(); document.documentElement.classList.remove('mkd-on'); mkSave(); if(wasProf){ try{ if(state.profileOpen) renderProfile(); }catch(e){} return; } if(!quiet&&state.mkEdit) mkRenderChrome(); }
function mkdTbBtn(){ if(!mkCurPage()||!MK_PAGES.includes(state.view)) return ''; return `<button type="button" data-act="mkd-toggle" data-testid="mk-deep-button" aria-pressed="${_mkd.on}" title="Select any element" aria-label="Select any element" class="mk-tb-btn is-ic${_mkd.on?' is-on':''}"><i data-lucide="crosshair" style="width:15px;height:15px"></i><span class="mk-tb-l">Select</span></button>`; }
function mkdDrag(e,mode){ const el=_mkd.el, c=mkdCfg(); if(!el||!c) return; e.preventDefault(); e.stopPropagation(); const x0=e.clientX, y0=e.clientY, sx=c.x||0, sy=c.y||0, k=(c.sc||100)/100, q=el.getBoundingClientRect(); const sw=c.w||Math.round(q.width/k), sh=c.h||Math.round(q.height/k);
  const mv=ev=>{ const dx=ev.clientX-x0, dy=ev.clientY-y0; if(mode==='move'){ c.x=Math.round(sx+dx); c.y=Math.round(sy+dy); } else { c.w=Math.max(16,Math.round(sw+dx/k)); c.h=Math.max(12,Math.round(sh+dy/k)); } mkdRefresh(); const xy=document.getElementById('mkd-xy'); if(xy) xy.textContent=(c.x||0)+', '+(c.y||0); };
  const up=()=>{ document.removeEventListener('pointermove',mv); document.removeEventListener('pointerup',up); document.removeEventListener('pointercancel',up); mkdCommit(); mkdPanel(); };
  document.addEventListener('pointermove',mv); document.addEventListener('pointerup',up); document.addEventListener('pointercancel',up); }
function mkdAct(act,t){ const v=t.dataset.val; const c=mkdCfg();
  switch(act){
    case 'mkd-toggle': mkdToggle(); return; case 'mkd-off': mkdOff(); return;
    case 'mkd-tab': _mkd.tab=v; mkdPanel(); return;
    case 'mkd-crumb': { const n=mkdChain(_mkd.el)[+t.dataset.i]; if(n) mkdSelect(n); return; }
    case 'mkd-parent': { const ch=mkdChain(_mkd.el); if(ch.length>1) mkdSelect(ch[ch.length-2]); return; }
    case 'mkd-section': { const blk=_mkd.el&&_mkd.el.closest('[data-mk-id]'); if(!blk) return; const id=blk.dataset.mkId; mkdOff(true); mkSelect(id); mkRenderChrome(); return; }
    case 'mkd-reset-all': openConfirm('Undo every element edit?','All moved, resized, hidden and restyled elements on this page go back to normal.',()=>{ const page=mkdPg(); if(page){ mkPage(page).deep={}; mkSave(); if(_mkd.prof) renderProfile(); else renderView(); } }); return;
  }
  if(!c) return;
  switch(act){
    case 'mkd-hide': c.hide=!c.hide; break;
    case 'mkd-reset': { const page=mkdPg(); delete mkdStore(page)[_mkd.key]; mkSave(); if(_mkd.prof){ const el=_mkd.el; if(el) mkdApplyEl(el,null,true); mkdPanel(); } else renderView(); toast('Element reset'); return; }
    case 'mkd-nudge': { const s=8; if(v==='u') c.y=(c.y||0)-s; if(v==='d') c.y=(c.y||0)+s; if(v==='l') c.x=(c.x||0)-s; if(v==='r') c.x=(c.x||0)+s; break; }
    case 'mkd-dim': { const [k,d]=v.split(','); const q=_mkd.el.getBoundingClientRect(), sc=(c.sc||100)/100; c[k]=Math.max(12,(c[k]||Math.round((k==='w'?q.width:q.height)/sc))+(+d)); break; }
    case 'mkd-unset': v.split(',').forEach(k=>delete c[k]); if(/w|h|x|y/.test(v)){ mkdCommit(); if(_mkd.prof){ mkdRefresh(); mkdPanel(); } else renderView(); return; } break;
    case 'mkd-ff': c.ff=v; break; case 'mkd-sh': c.sh=v; break; case 'mkd-bd': c.bd=v; break;
    case 'mkd-col': c.c=v; break; case 'mkd-bg': c.bg=v; break; case 'mkd-bold': c.fw=!c.fw; break; case 'mkd-align': c.ta=c.ta===v?'':v; break;
    default: return; }
  mkdRefresh(); mkdCommit(); mkdPanel(); }
window.addEventListener('click',e=>{ if(!mkdLive()) return; const t=e.target; if(!t||!t.closest||t.closest('.mkd-ui')) return; const root=mkdRoot(); if(!root||!root.contains(t)||t===root||t.closest(MKD_SKIP)) return; e.preventDefault(); e.stopPropagation(); mkdSelect(t); },true);
['pointerdown','mousedown','touchstart'].forEach(ev=>window.addEventListener(ev,e=>{ if(!mkdLive()) return; const t=e.target; if(!t||!t.closest||t.closest('.mkd-ui,.mk-ui')) return; const root=mkdRoot(); if(root&&root.contains(t)) e.stopPropagation(); },{capture:true,passive:true}));
document.addEventListener('pointerdown',e=>{ const h=e.target&&e.target.closest&&e.target.closest('[data-mkd-drag]'); if(h) mkdDrag(e,h.dataset.mkdDrag); });
let _mkdHovRaf=0; document.addEventListener('pointermove',e=>{ if(!_mkd.on||e.pointerType!=='mouse'||_mkdHovRaf) return; const t=e.target; _mkdHovRaf=requestAnimationFrame(()=>{ _mkdHovRaf=0; const r=document.getElementById('mkd-ui'); if(!r) return; const h=r.querySelector('.mkd-hov'), root=mkdRoot(); const ok=root&&t&&t.closest&&root.contains(t)&&t!==root&&!t.closest(MKD_SKIP); if(!ok){ h.style.display='none'; return; } const q=(t.closest('svg')||t).getBoundingClientRect(); h.style.display='block'; h.style.transform='translate('+q.left+'px,'+q.top+'px)'; h.style.width=q.width+'px'; h.style.height=q.height+'px'; }); },{passive:true});
document.addEventListener('input',e=>{ const s=e.target; if(!s||!s.dataset||!s.dataset.mkd) return; const c=mkdCfg(); if(!c) return; c[s.dataset.mkd]=+s.value; const b=document.getElementById('mkd-v-'+s.dataset.mkd); if(b) b.textContent=s.value+(s.dataset.unit||''); try{ fillSlider(s); }catch(_){} mkdRefresh(); });
document.addEventListener('change',e=>{ const s=e.target; if(s&&s.dataset&&s.dataset.mkd) mkdCommit(); if(s&&s.id==='mkd-txt') mkdCommit(); });
document.addEventListener('input',e=>{ const s=e.target; if(!s||s.id!=='mkd-txt') return; const c=mkdCfg(); if(!c||!_mkd.el) return; const orig=_mkd.el._mkdTxt!=null?_mkd.el._mkdTxt:_mkd.el.textContent; if(s.value===orig) delete c.txt; else c.txt=s.value; mkdRefresh(); });
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a.indexOf('mkd-')===0){ mkdAct(a,t); return; }
  switch(a){ case 'um-edit-back': umEditClose(); break; case 'um-q-save': umQSave(); break; case 'um-q-clear': umPvStop(); _umQ.forEach(x=>{ if(x.coverUrl) try{ URL.revokeObjectURL(x.coverUrl); }catch(_){} }); _umQ=[]; umUpRender(); break;
    case 'um-q-del': { if(_umPv&&_umPv.qid===t.dataset.qid) umPvStop(); umQSync(); _umQ=_umQ.filter(x=>x.qid!==t.dataset.qid); umUpRender(); break; }
    case 'um-q-play': umQPlay(t.dataset.qid); break; case 'um-q-cover': umQCover(t.dataset.qid); break;
    case 'mk-sheet': if(_mkd.on) mkdOff(); break; } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&_mkd.on) mkdOff(); });
const _mkAR9=mkAfterRender; mkAfterRender=function(){ _mkAR9.apply(this,arguments); try{ mkdApply(); }catch(e){ console.warn('mk deep',e); } };
const _mkRW9=mkRefreshW; mkRefreshW=function(){ const r=_mkRW9.apply(this,arguments); try{ mkdApply(); }catch(e){} return r; };
const _mkSE9=mkSetEdit; mkSetEdit=function(on){ if(!on&&_mkd.on) mkdOff(true); return _mkSE9.apply(this,arguments); };

/* ---------- P9h: What's New ---------- */
(function(){ const add=(k,date,sub,items,keep)=>{ const W=WHATS_NEW[k]; if(!W) return; W.v=(W.v||0)+1; W.date=date; if(sub) W.sub=sub; W.items=items.concat((W.items||[]).slice(0,keep)); };
  add('library','October 7, 2026','Smoother, synced and more you.',[
    {icon:'cloud',title:'Treesh accounts, lighter and faster',desc:'Your profile, playlists and settings sync quietly in the background about every 30 seconds. Custom music always stays on your device.'},
    {icon:'disc-3',title:'One Music Studio',desc:'Drag and drop songs, add a cover to each one and edit tracks without leaving the glass studio.'},
    {icon:'crosshair',title:'Magic Markup, element by element',desc:'Tap Select, then tap any title, button or picture to move, resize, hide or restyle it. Every page remembers its own edits.'},
    {icon:'mic-vocal',title:'A brand new voice assistant',desc:'A full-screen glowing orb. Say \u201cchange theme to blue\u201d for a new accent or \u201cdark mode\u201d to switch the look.'},
    {icon:'cloud-sun',title:'Bigger widgets on desktop',desc:'Weather and calendar widgets now scale up on large screens.'}],2);
  add('player','October 7, 2026','',[{icon:'chevron-down',title:'Flick to close',desc:'Flick Now Playing down from anywhere and it closes right away.'}],3);
  add('lyricstudio','October 7, 2026','',[{icon:'monitor-play',title:'Desktop studio layout',desc:'On big screens the player sits in the left column while you write or sync, and the preview looks exactly like Now Playing.'}],2);
  add('settings','October 7, 2026','',[{icon:'mail',title:'Confirm your email in style',desc:'New accounts get a Treesh confirmation page that signs you right in.'},{icon:'trash-2',title:'Delete your account',desc:'Remove your Treesh account and cloud backup any time from Settings, Account.'}],3); })();
