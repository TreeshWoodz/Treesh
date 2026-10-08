/* ---------- P9zf: library menus open as sheets (like the song menu) ---------- */
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('#modal [data-mclose]'); if(t) closeModal(); },true);
function mnSheet(ic,eyebrow,title,tid,items){ $('#modal').innerHTML=modalWrap(`${pmHead(ic,eyebrow,title,tid+'-close')}<div class="pm-list">${items}</div>`,tid,'sm'); icons(); syncScrollLock(); }
function mnIt(act,ic,label,attrs,tid,o){ return pmItem(Object.assign({act,ic,label,attrs:(attrs||'')+' data-mclose',tid},o||{})); }
function mmMenuOpen(){ const g=!!state.mineGrid;
  mnSheet('disc-3','Library','My Music','my-music-sheet',mnIt('mm-select-toggle','list-checks',state.mmSelect?'Done selecting':'Select tracks','','mm-sheet-select')+mnIt('add-music-open','plus','Add music','','mm-sheet-add')+mnIt('mine-view',g?'list':'layout-grid',g?'List view':'Grid view',`data-mode="${g?'list':'grid'}"`,'mm-sheet-view')); }
function libPlMenuOpen(){ mnSheet('list-music','Library','Playlists','lib-playlists-sheet',mnIt('new-playlist','plus','New playlist','','libpl-sheet-new')+mnIt('libpl-select-toggle','list-checks','Select &amp; delete','','libpl-sheet-select')+mnIt('libpl-reorder-toggle','arrow-up-down','Rearrange','','libpl-sheet-reorder')); }
function plMenuOpen(id){ const pl=plById(id); if(!pl) return; const n=(pl.songIds||[]).length, a=`data-id="${esc(pl.id)}"`;
  mnSheet('list-music','Playlist',esc(pl.name),'playlist-sheet',(n?mnIt('pl-play','play','Play',a,'pl-sheet-play')+mnIt('pl-shuffle','shuffle','Shuffle',a,'pl-sheet-shuffle'):'')+mnIt('pl-add-songs','list-plus','Add songs',a,'pl-sheet-add')+'<div class="pm-sep"></div>'+mnIt('pl-rename','pencil','Rename',a,'pl-sheet-rename')+mnIt('pl-delete','trash-2','Delete',a,'pl-sheet-delete',{danger:true})); }

/* ---------- P9zf: playlist shuffle + pick many songs at once ---------- */
function plShuffle(id){ const pl=plById(id); if(!pl) return; const songs=vis((pl.songIds||[]).map(x=>SONG_BY_ID[x]).filter(Boolean)); if(!songs.length){ toast('Playlist is empty'); return; }
  state.shuffle=true; try{ savePlayerPrefs(); }catch(e){} playSong(songs[Math.floor(Math.random()*songs.length)],songs); toast('Shuffling '+pl.name); }
let _pk=null;
function pkOpen(id){ const pl=plById(id); if(!pl) return; _pk={id,sel:[],q:''};
  const inner=`${pmHead('list-plus','Add songs',esc(pl.name),'pk-close')}<label class="pk-search"><i data-lucide="search"></i><input id="pk-q" type="search" placeholder="Search your library" autocomplete="off" enterkeyhint="search" data-testid="pk-search"></label>
    <div class="pk-bar"><p id="pk-count" data-testid="pk-count"></p><button type="button" data-act="pk-all" data-testid="pk-select-all" class="pk-all press">Select all</button></div>
    <div class="pk-list soft-scroll" id="pk-list" data-testid="pk-list"></div>
    <div class="pm-actions"><button type="button" data-act="modal-close" data-testid="pk-cancel" class="st-btn lg">Cancel</button><button type="button" data-act="pk-add" data-testid="pk-add" id="pk-add" class="st-btn lg primary" disabled>Add songs</button></div>`;
  $('#modal').innerHTML=modalWrap(inner,'playlist-picker','md'); pkList(); syncScrollLock();
  const q=$('#pk-q'); q.addEventListener('input',()=>{ _pk.q=q.value; pkList(); }); if(window.innerWidth>=1024) q.focus(); }
function pkPool(){ const pl=plById(_pk.id), have=new Set((pl&&pl.songIds)||[]), q=_pk.q.trim().toLowerCase(); let L=vis(SONGS).filter(s=>!have.has(s.id));
  if(q) L=L.filter(s=>[s.title,s.artist,s.album,s.genre].some(v=>String(v||'').toLowerCase().includes(q))); return L; }
function pkRow(s){ const on=_pk.sel.includes(s.id); return `<button type="button" data-act="pk-row" data-id="${esc(s.id)}" data-testid="pk-row-${esc(s.id)}" aria-pressed="${on}" class="pk-row press${on?' on':''}"><span class="pk-ck"><i data-lucide="check"></i></span><span class="pk-art">${img(s.coverArt,'h-full w-full object-cover')}</span><span class="pk-t"><b class="clamp-1">${esc(s.title)}</b><small class="clamp-1">${esc(s.artist)}</small></span></button>`; }
function pkList(){ const el=$('#pk-list'); if(!el) return; const L=pkPool(); el.innerHTML=L.length?L.map(pkRow).join(''):`<div class="st-empty" data-testid="pk-empty"><i data-lucide="search-x"></i>${_pk.q.trim()?'No songs match':'Every song is already in here'}</div>`; icons(); pkSync(); }
function pkSync(){ const n=_pk.sel.length, L=pkPool(), b=$('#pk-add'), c=$('#pk-count'), a=document.querySelector('[data-act="pk-all"]');
  if(b){ b.disabled=!n; b.textContent=n?`Add ${n} song${n!==1?'s':''}`:'Add songs'; } if(c) c.textContent=n?`${n} selected`:`${L.length} song${L.length!==1?'s':''}`;
  if(a){ a.hidden=!L.length; a.textContent=L.length&&L.every(s=>_pk.sel.includes(s.id))?'Clear':'Select all'; } }
function pkToggle(id,btn){ const i=_pk.sel.indexOf(id); if(i>=0) _pk.sel.splice(i,1); else _pk.sel.push(id); if(btn){ const on=i<0; btn.classList.toggle('on',on); btn.setAttribute('aria-pressed',on); } pkSync(); }
function pkAll(){ const L=pkPool(), all=L.length&&L.every(s=>_pk.sel.includes(s.id)); if(all){ const ids=new Set(L.map(s=>s.id)); _pk.sel=_pk.sel.filter(id=>!ids.has(id)); } else L.forEach(s=>{ if(!_pk.sel.includes(s.id)) _pk.sel.push(s.id); }); pkList(); }
function pkAdd(){ const pl=plById(_pk.id); if(!pl||!_pk.sel.length) return; const have=new Set(pl.songIds||[]), add=_pk.sel.filter(id=>!have.has(id)); pl.songIds=(pl.songIds||[]).concat(add); savePl(); closeModal(); refreshLists(); toast(`Added ${add.length} song${add.length!==1?'s':''}`,pl.name); _pk=null; }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act, id=t.dataset.id;
  if(a==='mm-menu-open') mmMenuOpen(); else if(a==='libpl-menu-open') libPlMenuOpen(); else if(a==='plx-menu'){ e.preventDefault(); e.stopPropagation(); plMenuOpen(id); }
  else if(a==='pl-shuffle') plShuffle(id); else if(a==='pl-add-songs') pkOpen(id);
  else if(_pk&&a==='pk-row') pkToggle(id,t); else if(_pk&&a==='pk-all') pkAll(); else if(_pk&&a==='pk-add') pkAdd();
  else if(a==='toggle-ptr'){ LS.set('treesh_ptr',!ptrOn()); toast(ptrOn()?'Pull to refresh on':'Pull to refresh off'); renderView(); } });

/* ---------- P9zf: mini player look (Magic Markup): glass / solid / accent, which controls, bottom / top / left / right ---------- */
const MP_DEF={th:'glass',pos:'bottom',prev:false,next:true,like:false,prog:true};
const MP_TH=['glass','solid','accent'], MP_POS=['bottom','top','left','right'];
function mpCfg(){ const c=Object.assign({},MP_DEF,LS.get('treesh_mini_look',null)||{}); if(!MP_TH.includes(c.th)) c.th='glass'; if(!MP_POS.includes(c.pos)) c.pos='bottom'; return c; }
function mpSet(k,v){ const c=Object.assign({},LS.get('treesh_mini_look',null)||{}); c[k]=v; LS.set('treesh_mini_look',c); renderMini(); mpSheetPaint(); }
function mpTop(){ const de=document.documentElement, h=document.querySelector('.gl-main > header'), r=h&&h.getBoundingClientRect(); de.style.setProperty('--mp-top',Math.max(8,Math.round(r&&r.height?r.bottom:64))+'px');
  const m=document.querySelector('#mini [data-mini-root]'); de.style.setProperty('--mp-h',(m&&mpCfg().pos==='top'?Math.round(m.getBoundingClientRect().height):0)+'px'); }
function mpApply(){ const de=document.documentElement, root=document.querySelector('#mini [data-mini-root]'), c=mpCfg();
  MP_POS.forEach(p=>{ if(p!=='bottom') de.classList.toggle('mp-'+p,!!root&&c.pos===p); });
  if(!root) return; root.dataset.mpTh=c.th; root.dataset.mpPos=c.pos; root.classList.toggle('mp-editing',!!state.mkEdit);
  const pp=root.querySelector('#mini-pp'), ctl=pp&&pp.parentElement, s=curSong();
  if(ctl&&!ctl.querySelector('[data-mp-x]')){
    if(c.prev) pp.insertAdjacentHTML('beforebegin','<button data-mp-x data-act="prev" data-testid="mini-player-prev-button" aria-label="Previous" class="mp-btn press"><i data-lucide="skip-back" style="width:18px;height:18px"></i></button>');
    if(c.like&&s) ctl.insertAdjacentHTML('afterbegin',`<button data-mp-x data-act="like" data-id="${esc(s.id)}" data-testid="mini-player-like-button" aria-label="Like" class="mp-btn tr-like${isFav(s.id)?' is-liked':''} press"><i data-lucide="heart" style="width:18px;height:18px"></i></button>`); }
  const nx=root.querySelector('[data-act="next"]'); if(nx){ nx.classList.toggle('mp-show',!!c.next); nx.classList.toggle('mp-hide',!c.next); }
  const sc=root.querySelector('[data-scrub="mini"]'); if(sc) sc.classList.toggle('mp-hide',!c.prog);
  icons(); requestAnimationFrame(mpTop); }
const _rm9zf=renderMini; renderMini=function(){ const r=_rm9zf.apply(this,arguments); mpApply(); return r; };
const _smh9zf=syncMiniH; syncMiniH=function(){ if(mpCfg().pos!=='bottom'&&document.querySelector('#mini [data-mini-root]')){ document.documentElement.style.setProperty('--mini-h','0px'); requestAnimationFrame(mpTop); return; } return _smh9zf.apply(this,arguments); };
window.addEventListener('resize',()=>{ if(mpCfg().pos==='top') mpTop(); },{passive:true});
function mpPreviewHtml(c){ const s=curSong()||SONGS[0]||{}, v=c.pos==='left'||c.pos==='right', ic=n=>`<i data-lucide="${n}"></i>`;
  return `<div class="mp-pv-wrap" data-testid="mk-mini-preview"><div class="mp-pv${v?' is-v':''}" data-mp-th="${c.th}"><div class="gl-mini"><div class="mp-pv-row"><span class="mp-pv-cov">${img(s.coverArt,'h-full w-full object-cover')}</span>${v?'':`<span class="mp-pv-t"><b class="clamp-1">${esc(s.title||'Song')}</b><small class="clamp-1">${esc(s.artist||'Artist')}</small></span>`}<span class="mp-pv-ctl">${c.like?ic('heart'):''}${c.prev?ic('skip-back'):''}<span class="mp-pv-pp">${ic('play')}</span>${c.next?ic('skip-forward'):''}${ic('chevron-up')}</span></div>${c.prog?'<span class="mp-pv-prog"><i></i></span>':''}</div></div></div>`; }
function mpSheetHtml(){ const c=mpCfg();
  return `${mpPreviewHtml(c)}${curSong()?'':'<p class="mk-hint" data-testid="mk-mini-empty">Play a song to see it on screen too.</p>'}
    <div class="mk-field"><p class="mk-lbl">Look</p>${mkSeg('mp-th',c.th,[['glass','Glass'],['solid','Solid'],['accent','Accent']],'mk-mini-th')}</div>
    <div class="mk-field"><p class="mk-lbl">Position</p>${mkSeg('mp-pos',c.pos,[['bottom','Bottom'],['top','Top'],['left','Left'],['right','Right']],'mk-mini-pos')}<p class="mk-hint">Left and right stand the player up along the side of the screen.</p></div>
    <div class="mk-field"><p class="mk-lbl">Controls</p><div class="space-y-2">${mkSwitch('mp-ctl','prev','mk-mini-prev',c.prev,'skip-back','Previous','Jump back a track')}${mkSwitch('mp-ctl','next','mk-mini-next',c.next,'skip-forward','Next','Skip to the next track')}${mkSwitch('mp-ctl','like','mk-mini-like',c.like,'heart','Like','Heart the song that\u2019s playing')}${mkSwitch('mp-ctl','prog','mk-mini-prog',c.prog,'minus','Progress bar','Thin bar you can drag to seek')}</div></div>
    <button type="button" data-act="mp-reset" data-testid="mk-mini-reset" class="mk-btn mt-1 w-full"><i data-lucide="rotate-ccw"></i>Reset mini player</button>`; }
function mpSheetPaint(){ if(!(state.mkEdit&&state.mkSheet==='mini')) return; const b=document.querySelector('#mk-sheet .mk-sheet-body'), y=b?b.scrollTop:0; mkRenderSheet(); const n=document.querySelector('#mk-sheet .mk-sheet-body'); if(n) n.scrollTop=y; }
const _mkRS9zf=mkRenderSheet; mkRenderSheet=function(){ if(state.mkEdit&&state.mkSheet==='mini'){ const el=mkRoot('mk-sheet'); el.innerHTML=mkSheetShell('mini','Mini player',mpSheetHtml()); icons(); mkTbSync(); return; } return _mkRS9zf.apply(this,arguments); };
function mpTbBtn(){ const tb=document.querySelector('#mk-toolbar .mk-tb'); if(!tb||tb.querySelector('[data-testid="mk-mini-button"]')) return; const on=state.mkSheet==='mini';
  const h=`<button type="button" data-act="mk-sheet" data-val="mini" data-testid="mk-mini-button" aria-pressed="${on}" title="Mini player" aria-label="Mini player" class="mk-tb-btn is-ic${on?' is-on':''}"><i data-lucide="disc-3" style="width:15px;height:15px"></i><span class="mk-tb-l">Player</span></button>`;
  const pg=tb.querySelector('[data-testid="mk-pages-button"]'); if(pg) pg.insertAdjacentHTML('beforebegin',h); else tb.insertAdjacentHTML('beforeend',h); icons(); }
const _mkRC9zf=mkRenderChrome; mkRenderChrome=function(){ const r=_mkRC9zf.apply(this,arguments); mpTbBtn(); mpApply(); return r; };
document.addEventListener('click',e=>{ if(!state.mkEdit) return; const m=e.target.closest&&e.target.closest('#mini [data-mini-root]'); if(!m) return; e.preventDefault(); e.stopPropagation();
  try{ if(typeof _mkd!=='undefined'&&_mkd.on) mkdOff(); }catch(x){} state.mkSheet='mini'; mkRenderSheet(); },true);
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act^="mp-"]'); if(!t) return; const a=t.dataset.act, v=t.dataset.val;
  if(a==='mp-th'&&MP_TH.includes(v)) mpSet('th',v); else if(a==='mp-pos'&&MP_POS.includes(v)) mpSet('pos',v);
  else if(a==='mp-ctl'&&Object.prototype.hasOwnProperty.call(MP_DEF,v)) mpSet(v,!mpCfg()[v]);
  else if(a==='mp-reset'){ LS.set('treesh_mini_look',{}); renderMini(); mpSheetPaint(); toast('Mini player reset'); } });

/* ---------- P9zf: performance mode on phones stops drawing the app behind full-screen views ---------- */
const CV_SEL='#np > *, #ls > *, #instrum-fs > *, #game-frame > *, #modal > [data-game-root], #modal > [data-wl-root], #modal [data-tot-root], [data-testid="sleep-overlay"], .um-panel';
let _cvOn=false, _cvSince=0, _cvHold=0;
function cvCovered(){ const W=innerWidth, H=innerHeight; for(const el of document.querySelectorAll(CV_SEL)){ const r=el.getBoundingClientRect(); if(r.left<=1&&r.top<=1&&r.right>=W-1&&r.bottom>=H-1) return true; } return false; }
function cvSet(on){ if(on===_cvOn) return; _cvOn=on; const de=document.documentElement; de.classList.toggle('cv-hide',on); de.classList.toggle('cv-keepmini',on&&!!(state.gameFrame&&state.gfMusic)); }
function cvUnhide(){ cvSet(false); _cvSince=0; _cvHold=performance.now()+900; }
setInterval(()=>{ if(!((document.documentElement.classList.contains('perf-mode')||document.documentElement.classList.contains('eco'))&&innerWidth<1024)){ cvSet(false); _cvSince=0; return; }
  if(!cvCovered()){ _cvSince=0; cvSet(false); return; } const now=performance.now(); if(!_cvSince) _cvSince=now; if(now-_cvSince>=450&&now>=_cvHold) cvSet(true); },300);
/* the page behind comes back as a close tap lands or a drag starts moving, never on touch-down (iOS treats content appearing under a finger as a hover and swallows the tap) */
document.addEventListener('click',e=>{ if(!_cvOn) return; const t=e.target; if(t.closest&&t.closest('[data-act*="close"],[data-act*="back"],[data-act*="exit"],[data-act*="min"],[data-mclose]')) cvUnhide(); },true);
let _cvPD=null;
document.addEventListener('pointerdown',e=>{ _cvPD=null; if(!_cvOn) return; const t=e.target; if(e.clientY<140||(t.closest&&t.closest('[class*="grab"],[data-sheet-drag],header'))) _cvPD={x:e.clientX,y:e.clientY}; },true);
const cvMove=(x,y)=>{ if(_cvPD&&_cvOn&&Math.abs(x-_cvPD.x)+Math.abs(y-_cvPD.y)>10){ _cvPD=null; cvUnhide(); } };
document.addEventListener('pointermove',e=>cvMove(e.clientX,e.clientY),{capture:true,passive:true});
document.addEventListener('touchmove',e=>{ const p=e.touches&&e.touches[0]; if(p) cvMove(p.clientX,p.clientY); },{capture:true,passive:true});
document.addEventListener('pointerup',()=>{ _cvPD=null; },true);
window.addEventListener('popstate',()=>{ if(_cvOn) cvUnhide(); },true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&_cvOn) cvUnhide(); },true);

/* ---------- P9zf: pull down at the top of a page to reload (phones, can be turned off) ---------- */
const PTR_TH=72;
function ptrOn(){ return LS.get('treesh_ptr',true)!==false; }
let _ptr=null, _ptrEl=null;
function ptrEl(){ if(!_ptrEl){ _ptrEl=document.createElement('div'); _ptrEl.id='ptr'; _ptrEl.setAttribute('aria-hidden','true'); _ptrEl.dataset.testid='pull-refresh'; _ptrEl.innerHTML='<span class="ptr-dot"><i data-lucide="refresh-cw"></i></span>'; document.body.appendChild(_ptrEl); icons(); } return _ptrEl; }
function ptrDraw(d){ const el=ptrEl(), ready=d>=PTR_TH; el.style.transform=`translate3d(-50%,${Math.round(d-56)}px,0)`; el.style.opacity=String(Math.min(1,d/36));
  if(ready&&!el.classList.contains('is-ready')){ try{ navigator.vibrate&&navigator.vibrate(8); }catch(x){} } el.classList.toggle('is-ready',ready); const ic=el.querySelector('svg'); if(ic) ic.style.transform=`rotate(${Math.round(d*3.2)}deg)`; }
document.addEventListener('touchstart',e=>{ _ptr=null; if(!ptrOn()||e.touches.length!==1||innerWidth>=1024||state.mkEdit) return; if((window.scrollY||document.documentElement.scrollTop||0)>2||overlaysOpen()) return;
  const t=e.target; if(t.closest&&t.closest('input,textarea,select,[contenteditable="true"],canvas,[data-no-ptr],[data-reorder],[data-rhandle],#mini,#toast,nav,.mk-ui,#ptr')) return; for(let n=t;n&&n.nodeType===1&&n!==document.body;n=n.parentElement){ if(n.scrollTop>0) return; } const p=e.touches[0]; _ptr={x0:p.clientX,y0:p.clientY,d:0,on:false}; },{passive:true});
document.addEventListener('touchmove',e=>{ if(!_ptr) return; const p=e.touches[0], dx=p.clientX-_ptr.x0, dy=p.clientY-_ptr.y0;
  if(!_ptr.on){ if((Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy))||dy<-4){ _ptr=null; return; } if(dy>10&&(window.scrollY||0)<=0){ _ptr.on=true; _ptr.y0=p.clientY; const el=ptrEl(); el.classList.remove('is-out','is-spin'); } else return; }
  _ptr.d=Math.max(0,Math.min(130,(p.clientY-_ptr.y0)*0.5)); ptrDraw(_ptr.d); },{passive:true});
function ptrEnd(cancel){ const P=_ptr; _ptr=null; if(!P||!P.on) return; const el=ptrEl();
  if(!cancel&&P.d>=PTR_TH){ el.classList.add('is-spin'); el.style.transform=`translate3d(-50%,${PTR_TH-50}px,0)`; try{ resSave(true); }catch(x){} setTimeout(()=>location.reload(),420); }
  else { el.classList.add('is-out'); el.classList.remove('is-ready'); el.style.transform='translate3d(-50%,-60px,0)'; el.style.opacity='0'; } }
document.addEventListener('touchend',()=>ptrEnd(false),{passive:true});
document.addEventListener('touchcancel',()=>ptrEnd(true),{passive:true});
if(typeof SETTINGS_INDEX!=='undefined') SETTINGS_INDEX.push({id:'ptr',label:'Pull to refresh',desc:'Pull down at the top of a page to reload Treesh',kw:'pull refresh reload swipe down gesture phone mobile',ic:'refresh-cw',type:'toggle',get:()=>ptrOn(),toggle:()=>{ LS.set('treesh_ptr',!ptrOn()); try{ if(state.view==='settings') renderView(); }catch(e){} }});

/* ---------- P9zf: Magic Markup toolbar fits any width (labels fold away first, extra tools move under More) ---------- */
const MK_TB_SPILL=['mk-pages-button','mk-mini-button','mk-layers-button','mk-draw-button','mk-theme-button'];
function mkTbOver(tb){ return tb.scrollWidth>tb.clientWidth+1; }
function mkTbFit(){ const tb=document.querySelector('#mk-toolbar .mk-tb'); if(!tb) return;
  tb.classList.remove('fit-1','fit-2','fit-3'); tb.querySelectorAll(':scope > .mk-spill').forEach(b=>b.classList.remove('mk-spill')); const old=tb.querySelector(':scope > .mk-tb-more'); if(old) old.remove();
  for(const c of ['fit-1','fit-2','fit-3']){ if(!mkTbOver(tb)) return; tb.classList.add(c); }
  const crowded=()=>mkTbOver(tb)||tb.querySelectorAll(':scope > .mk-tb-btn:not(.mk-spill), :scope > .mk-tb-more').length>6;
  if(!crowded()) return; const done=tb.querySelector(':scope > [data-testid="mk-done-button"]'); if(!done) return;
  done.insertAdjacentHTML('beforebegin','<span class="mk-tb-more"><button type="button" data-act="mk-tb-more" data-testid="mk-more-button" aria-label="More tools" title="More tools" aria-expanded="false" class="mk-tb-btn is-ic"><i data-lucide="ellipsis" style="width:16px;height:16px"></i></button><div class="mk-tb-pop" role="menu" data-testid="mk-more-menu"></div></span>'); icons();
  const pop=tb.querySelector('.mk-tb-pop');
  for(const id of MK_TB_SPILL){ const b=tb.querySelector(`:scope > [data-testid="${id}"]`); if(!b) continue; b.classList.add('mk-spill'); const c=b.cloneNode(true); c.classList.remove('mk-spill'); c.dataset.testid=id+'-more'; c.setAttribute('role','menuitem'); pop.prepend(c); if(!crowded()) break; }
  mkTbMoreSync(); }
function mkTbMoreSync(){ const m=document.querySelector('#mk-toolbar .mk-tb-more'); if(m) m.classList.toggle('has-on',!!m.querySelector('.mk-tb-pop .is-on')); }
function mkTbMoreShow(on){ const m=document.querySelector('#mk-toolbar .mk-tb-more'); if(!m) return; m.classList.toggle('is-open',on); const b=m.querySelector('[data-act="mk-tb-more"]'); if(b) b.setAttribute('aria-expanded',on); }
const _mkRCfit=mkRenderChrome; mkRenderChrome=function(){ const r=_mkRCfit.apply(this,arguments); mkTbFit(); return r; };
const _mkTS9zf=mkTbSync; mkTbSync=function(){ const r=_mkTS9zf.apply(this,arguments); mkTbMoreSync(); return r; };
document.addEventListener('click',e=>{ const m=document.querySelector('#mk-toolbar .mk-tb-more'); if(!m) return; const t=e.target.closest&&e.target.closest('[data-act="mk-tb-more"]');
  if(t){ e.preventDefault(); e.stopPropagation(); mkTbMoreShow(!m.classList.contains('is-open')); return; } if(m.classList.contains('is-open')) mkTbMoreShow(false); },true);
let _mkFitRaf=0; window.addEventListener('resize',()=>{ if(!state.mkEdit) return; cancelAnimationFrame(_mkFitRaf); _mkFitRaf=requestAnimationFrame(mkTbFit); },{passive:true});

/* ---------- P9zf: Bronze Blitz tile uses its studio art ---------- */
if(typeof ST3_ART!=='undefined'&&ST3_ART.bronze_main&&!ST3_ART['bronze-blitz_main']) ST3_ART['bronze-blitz_main']=ST3_ART.bronze_main;
