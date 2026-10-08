/* ---------- P9v: Magic Markup drawing (pen, highlighter, eraser per page) + roomier phone panels ---------- */
const MKP_INK=['#ff2d78','#9328ff','#3b82f6','#22d3ee','#34d399','#f5c451','#ffffff','#111111'];
const _mkp={on:false,tool:'pen',color:'#ff2d78',size:6,colors:false,live:null,ro:null,pg:null};
let _mkPeek=false, _mkSheetV=null;
const mkpPhone=()=>window.innerWidth<640;
function mkpPageEl(){ return document.querySelector('#view [data-mk-page]'); }
function mkpKey(){ return mkpPhone()?'inkM':'ink'; }
function mkpList(page,make){ const P=page&&mkS().pages[page]; if(!P){ if(!make) return []; } const Q=make?mkPage(page):P; const k=mkpKey(); if(!Array.isArray(Q[k])){ if(!make) return []; Q[k]=[]; } return Q[k]; }
function mkpScroller(el){ for(let n=el&&el.parentElement;n&&n!==document.body;n=n.parentElement){ const o=getComputedStyle(n).overflowY; if((o==='auto'||o==='scroll')&&n.scrollHeight>n.clientHeight+2) return n; } return document.scrollingElement||document.documentElement; }
function mkpPath(c,P,sx,sy){ c.beginPath(); c.moveTo(P[0][0]*sx,P[0][1]*sy); if(P.length===1) c.lineTo(P[0][0]*sx+.1,P[0][1]*sy); for(let i=1;i<P.length-1;i++){ const mx=(P[i][0]+P[i+1][0])/2*sx, my=(P[i][1]+P[i+1][1])/2*sy; c.quadraticCurveTo(P[i][0]*sx,P[i][1]*sy,mx,my); } if(P.length>1){ const L=P[P.length-1]; c.lineTo(L[0]*sx,L[1]*sy); } c.stroke(); }
function mkpStyle(c,s,lw,preview){ c.lineCap='round'; c.lineJoin='round';
  if(s.t==='er'){ if(preview){ c.strokeStyle='rgba(255,255,255,.35)'; c.setLineDash([6,6]); c.lineWidth=lw*2.4; } else { c.globalCompositeOperation='destination-out'; c.strokeStyle='#000'; c.lineWidth=lw*2.4; } }
  else if(s.t==='hl'){ c.globalAlpha=.34; c.strokeStyle=s.c; c.lineWidth=lw*3.2; }
  else { c.strokeStyle=s.c; c.lineWidth=lw; } }
function mkpCanvas(pg){ let cv=pg.querySelector(':scope > canvas.mkp-cv'); if(!cv){ cv=document.createElement('canvas'); cv.className='mkp-cv'; cv.setAttribute('aria-hidden','true'); cv.setAttribute('data-testid','mk-ink-canvas'); pg.appendChild(cv); } return cv; }
function mkpDraw(){ const pg=mkpPageEl(); if(!pg) return; const list=mkpList(pg.dataset.mkPage,false); let cv=pg.querySelector(':scope > canvas.mkp-cv'); if(!list.length){ if(cv) cv.remove(); return; } cv=mkpCanvas(pg);
  const w=pg.clientWidth, h=Math.max(pg.offsetHeight,1); const k=Math.max(.5,Math.min(window.devicePixelRatio||1,2,Math.sqrt(12e6/Math.max(1,w*h)))); const W=Math.round(w*k), H=Math.round(h*k);
  if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; } cv.style.width=w+'px'; cv.style.height=h+'px'; const c=cv.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,W,H); c.setTransform(k,0,0,k,0,0);
  list.forEach(s=>{ if(!s.p||!s.p.length) return; c.save(); mkpStyle(c,s,s.s*w,false); mkpPath(c,s.p,w,w); c.restore(); }); }
function mkpSync(){ const pg=mkpPageEl(); if(_mkp.ro&&_mkp.pg!==pg){ try{ _mkp.ro.disconnect(); }catch(e){} _mkp.ro=null; }
  if(pg&&!_mkp.ro&&window.ResizeObserver){ let t=0; _mkp.ro=new ResizeObserver(()=>{ clearTimeout(t); t=setTimeout(mkpDraw,90); }); _mkp.ro.observe(pg); } _mkp.pg=pg; mkpDraw();
  if(_mkp.on&&(!pg||!state.mkEdit)) mkpOff(true); else if(_mkp.on) mkpUi(); }
function mkpLive(){ let o=document.getElementById('mkp-live'); if(!o){ o=document.createElement('canvas'); o.id='mkp-live'; o.setAttribute('data-testid','mk-draw-surface'); document.body.appendChild(o); mkpWireLive(o); } const k=Math.min(2,window.devicePixelRatio||1); o.width=Math.round(window.innerWidth*k); o.height=Math.round(window.innerHeight*k); o._k=k; o.classList.toggle('is-hand',_mkp.tool==='hand'); return o; }
function mkpLiveDraw(){ const o=document.getElementById('mkp-live'); const L=_mkp.live; if(!o) return; const c=o.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,o.width,o.height); if(!L||!L.cp.length) return; c.setTransform(o._k,0,0,o._k,0,0); c.save(); mkpStyle(c,L,L.s*L.w,true); mkpPath(c,L.cp,1,1); c.restore(); }
function mkpWireLive(o){
  o.addEventListener('pointerdown',e=>{ if(!_mkp.on||_mkp.tool==='hand') return; const pg=mkpPageEl(); if(!pg) return; e.preventDefault(); try{ o.setPointerCapture(e.pointerId); }catch(_){} const r=pg.getBoundingClientRect(), w=pg.clientWidth||1;
    _mkp.live={t:_mkp.tool,c:_mkp.color,s:_mkp.size/w,w,id:e.pointerId,cp:[[e.clientX,e.clientY]],p:[[(e.clientX-r.left)/w,(e.clientY-r.top)/w]]}; mkpLiveDraw(); });
  o.addEventListener('pointermove',e=>{ const L=_mkp.live; if(!L||L.id!==e.pointerId) return; const lc=L.cp[L.cp.length-1]; if(Math.hypot(e.clientX-lc[0],e.clientY-lc[1])<1.6) return; const pg=mkpPageEl(); if(!pg) return; const r=pg.getBoundingClientRect(); L.cp.push([e.clientX,e.clientY]); L.p.push([(e.clientX-r.left)/L.w,(e.clientY-r.top)/L.w]); mkpLiveDraw(); });
  const end=e=>{ const L=_mkp.live; if(!L||L.id!==e.pointerId) return; _mkp.live=null; mkpLiveDraw(); const pg=mkpPageEl(); if(!pg) return; const list=mkpList(pg.dataset.mkPage,true); const r4=v=>Math.round(v*1e4)/1e4;
    list.push({t:L.t,c:L.c,s:r4(L.s),p:L.p.map(([x,y])=>[r4(x),r4(y)])}); if(list.length>400) list.splice(0,list.length-400); mkSaveSoon(); mkpDraw(); mkpUi(); };
  o.addEventListener('pointerup',end); o.addEventListener('pointercancel',end);
  o.addEventListener('wheel',e=>{ e.preventDefault(); mkpScroller(mkpPageEl()).scrollBy(0,e.deltaY); },{passive:false}); }
function mkpUi(){ let u=document.getElementById('mkp-ui'); if(!_mkp.on){ if(u) u.remove(); return; } if(!u){ u=document.createElement('div'); u.id='mkp-ui'; u.className='mkp-ui mk-ui dark-surface'; u.setAttribute('data-testid','mk-draw-toolbar'); document.body.appendChild(u); }
  const pg=mkpPageEl(), n=pg?mkpList(pg.dataset.mkPage,false).length:0;
  const tl=(id,ic,l)=>`<button type="button" data-mkp="tool" data-val="${id}" data-testid="mk-draw-${id}" aria-pressed="${_mkp.tool===id}" title="${l}" aria-label="${l}" class="mkp-b${_mkp.tool===id?' on':''}"><i data-lucide="${ic}"></i><span>${l}</span></button>`;
  u.innerHTML=`${_mkp.colors?`<div class="mkp-cols" data-testid="mk-draw-colors">${MKP_INK.map(c=>`<button type="button" data-mkp="color" data-val="${c}" data-testid="mk-draw-color-${c.slice(1)}" aria-label="Colour ${c}" class="mkp-sw${_mkp.color===c?' on':''}" style="background:${c}"></button>`).join('')}<label class="mkp-sw is-pick" title="Custom colour" style="background:conic-gradient(#ff2d78,#f59e0b,#34d399,#22d3ee,#9328ff,#ff2d78)"><input type="color" id="mkp-pick" value="${_mkp.color}" aria-label="Custom colour"></label><label class="mkp-size"><span>Size</span><input type="range" min="2" max="28" step="1" value="${_mkp.size}" id="mkp-size" data-testid="mk-draw-size" class="tr"><b id="mkp-size-v">${_mkp.size}</b></label></div>`:''}
  <div class="mkp-row no-scrollbar">${tl('pen','pen-line','Pen')}${tl('hl','highlighter','Highlighter')}${tl('er','eraser','Eraser')}${tl('hand','hand','Scroll')}<span class="mkp-sep"></span><button type="button" data-mkp="colors" data-testid="mk-draw-color-toggle" aria-expanded="${_mkp.colors}" aria-label="Colour and size" class="mkp-dot${_mkp.colors?' on':''}"><span style="background:${_mkp.color};width:${Math.max(8,Math.min(20,_mkp.size+4))}px;height:${Math.max(8,Math.min(20,_mkp.size+4))}px"></span></button><button type="button" data-mkp="undo" data-testid="mk-draw-undo" aria-label="Undo stroke" class="mkp-b is-ic" ${n?'':'disabled'}><i data-lucide="undo-2"></i></button><button type="button" data-mkp="clear" data-testid="mk-draw-clear" aria-label="Clear drawing" class="mkp-b is-ic" ${n?'':'disabled'}><i data-lucide="trash-2"></i></button><button type="button" data-mkp="done" data-testid="mk-draw-done" class="mkp-done"><i data-lucide="check"></i><span>Done</span></button></div>`;
  icons(); const o=document.getElementById('mkp-live'); if(o) o.classList.toggle('is-hand',_mkp.tool==='hand'); }
function mkpOn(){ const pg=mkpPageEl(); if(!pg||!state.mkEdit){ toast('Drawing works on pages you can customize'); return; } try{ if(_mkd.on) mkdOff(true); }catch(e){} if(state.mkSheet){ state.mkSheet=null; mkRenderSheet(); }
  _mkp.on=true; document.documentElement.classList.add('mkp-on'); mkpLive(); mkpUi(); mkRenderChrome(); toast('Draw on this page',mkpPhone()?'Saved for your phone layout. Use Scroll to move around.':'Saved with this page. Scroll with your mouse wheel.'); }
function mkpOff(quiet){ _mkp.on=false; _mkp.live=null; _mkp.colors=false; document.documentElement.classList.remove('mkp-on'); const o=document.getElementById('mkp-live'); if(o) o.remove(); mkpUi(); mkSave(); if(!quiet&&state.mkEdit) mkRenderChrome(); }
function mkpAct(a,v){ const pg=mkpPageEl(); const page=pg&&pg.dataset.mkPage;
  if(a==='tool'){ _mkp.tool=v; mkpUi(); }
  else if(a==='color'){ _mkp.color=v; if(_mkp.tool==='er'||_mkp.tool==='hand') _mkp.tool='pen'; mkpUi(); }
  else if(a==='colors'){ _mkp.colors=!_mkp.colors; mkpUi(); }
  else if(a==='undo'){ const L=mkpList(page,false); if(L.length){ L.pop(); mkSaveSoon(); mkpDraw(); mkpUi(); } }
  else if(a==='clear'){ if(!mkpList(page,false).length) return; openConfirm('Clear the drawing?','Every stroke on this page'+(mkpPhone()?' (phone layout)':'')+' will be removed.',()=>{ const P=mkPage(page); P[mkpKey()]=[]; mkSave(); mkpDraw(); mkpUi(); toast('Drawing cleared'); }); }
  else if(a==='done') mkpOff(); }
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-mkp]'); if(!b) return; mkpAct(b.dataset.mkp,b.dataset.val); });
document.addEventListener('input',e=>{ const t=e.target; if(!t) return; if(t.id==='mkp-size'){ _mkp.size=+t.value; const v=document.getElementById('mkp-size-v'); if(v) v.textContent=t.value; try{ fillSlider(t); }catch(_){} } else if(t.id==='mkp-pick'){ _mkp.color=t.value; if(_mkp.tool==='er'||_mkp.tool==='hand') _mkp.tool='pen'; } });
document.addEventListener('change',e=>{ const t=e.target; if(t&&(t.id==='mkp-size'||t.id==='mkp-pick')) mkpUi(); });
document.addEventListener('keydown',e=>{ if(!_mkp.on) return; if(e.key==='Escape') mkpOff(); else if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); mkpAct('undo'); } });
window.addEventListener('resize',()=>{ if(_mkp.on) mkpLive(); });
const _mkdTb9v=mkdTbBtn; mkdTbBtn=function(){ const h=_mkdTb9v.apply(this,arguments); if(!h) return h; return h+`<button type="button" data-act="mkp-toggle" data-testid="mk-draw-button" aria-pressed="${_mkp.on}" title="Draw on this page" aria-label="Draw on this page" class="mk-tb-btn is-ic${_mkp.on?' is-on':''}"><i data-lucide="pen-tool" style="width:15px;height:15px"></i><span class="mk-tb-l">Draw</span></button>`; };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a==='mkp-toggle'){ _mkp.on?mkpOff():mkpOn(); return; }
  if(a==='mkp-peek'){ mkPeekSet(!_mkPeek); return; }
  if(_mkp.on&&(a==='mk-sheet'||a==='mkd-toggle')) mkpOff(true); });
const _mkAR9v=mkAfterRender; mkAfterRender=function(){ const r=_mkAR9v.apply(this,arguments); try{ mkpSync(); }catch(e){ console.warn('mk ink',e); } return r; };
const _mkSE9v=mkSetEdit; mkSetEdit=function(on){ if(!on&&_mkp.on) mkpOff(true); if(!on) mkPeekSet(false); return _mkSE9v.apply(this,arguments); };

/* ---- phones: panels shrink to a peek bar so the page stays visible, and picked items scroll into view ---- */
function mkPeekSet(v){ _mkPeek=!!v; document.documentElement.classList.toggle('mk-peek',_mkPeek); document.querySelectorAll('[data-act="mkp-peek"]').forEach(b=>{ b.setAttribute('aria-expanded',String(!_mkPeek)); b.setAttribute('aria-label',_mkPeek?'Show the panel':'Shrink the panel'); const i=b.querySelector('svg,i'); if(i) i.style.transform=_mkPeek?'rotate(180deg)':''; }); }
function mkPeekBtn(){ return `<button type="button" data-act="mkp-peek" data-testid="mk-peek-toggle" aria-expanded="${!_mkPeek}" aria-label="${_mkPeek?'Show the panel':'Shrink the panel'}" class="mk-peek-btn"><i data-lucide="chevron-down" style="width:16px;height:16px;${_mkPeek?'transform:rotate(180deg)':''}"></i></button>`; }
const _mkSS9v=mkSheetShell; mkSheetShell=function(v,title,body){ return _mkSS9v.apply(this,arguments).replace('<button type="button" data-act="mk-sheet-close"',mkPeekBtn()+'<button type="button" data-act="mk-sheet-close"'); };
const _mkRS9v=mkRenderSheet; mkRenderSheet=function(){ const v=state.mkEdit?state.mkSheet:null; if(v!==_mkSheetV){ _mkSheetV=v; if(_mkPeek) mkPeekSet(false); } const r=_mkRS9v.apply(this,arguments); if(v&&state.mkSel) mkFit(document.querySelector('#view [data-mk-id="'+CSS.escape(state.mkSel)+'"]')); return r; };
const _mkdP9v=mkdPanel; mkdPanel=function(){ const r=_mkdP9v.apply(this,arguments); try{ const h=document.querySelector('#mkd-ui .mkd-panel .mkd-ph'); if(h&&!h.querySelector('[data-act="mkp-peek"]')){ const last=h.lastElementChild; const tmp=document.createElement('span'); tmp.innerHTML=mkPeekBtn(); h.insertBefore(tmp.firstElementChild,last); icons(); } }catch(e){} return r; };
const _mkdS9v=mkdSelect; mkdSelect=function(el){ const r=_mkdS9v.apply(this,arguments); if(_mkPeek) mkPeekSet(false); mkFit(_mkd.el); return r; };
function mkFit(el){ if(!el||window.innerWidth>=768) return; setTimeout(()=>{ if(!el.isConnected) return; const r=el.getBoundingClientRect(); const pan=document.querySelector('#mkd-ui .mkd-panel')||document.querySelector('#mk-sheet .mk-sheet'); const tb=document.querySelector('.mk-tb'); const top=(tb?tb.getBoundingClientRect().bottom:60)+12; const bot=(pan?pan.getBoundingClientRect().top:window.innerHeight)-12; if(bot-top<40) return;
  if(r.top>=top&&r.bottom<=bot) return; const room=bot-top; const target=r.height<room?top+(room-r.height)/2:top; mkpScroller(el).scrollBy({top:r.top-target,behavior:'smooth'}); },60); }
document.addEventListener('touchmove',e=>{ if(_mkPeek||!state.mkEdit||window.innerWidth>=768) return; const t=e.target; if(!t||!t.closest||t.closest('.mk-sheet,.mkd-ui,.mk-tb,.mkp-ui,.mk-ph,[data-mk-st]')) return; if(document.documentElement.classList.contains('mk-dragging')) return; if(!document.querySelector('#mk-sheet .mk-sheet,#mkd-ui .mkd-panel')) return; mkPeekSet(true); },{passive:true});
document.addEventListener('click',e=>{ const g=e.target&&e.target.closest&&e.target.closest('.mk-sheet-grab'); if(g&&window.innerWidth<768) mkPeekSet(!_mkPeek); });
