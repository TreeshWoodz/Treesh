/* ---------- P9u: Image Studio launch (blank canvas, open, recent projects) + Layers panel ---------- */
const IS_SIZES=[['square','Square',1080,1080],['portrait','Portrait',1080,1350],['story','Story',1080,1920],['wide','Wide',1920,1080],['banner','Banner',1500,500]];
const IS_FILLS=['#ffffff','#111111','#9328ff','#ff2d78','#f5c451','#22d3ee','#34d399','#1e1b4b'];
const _isL={size:'square',fill:'#ffffff'};
PS_TOOLS.push(['layers','Layers','layers']);
function isAgo(t){ try{ return swAgo(t); }catch(e){ return ''; } }
function isLaunchHtml(){ const rec=_isRec.slice(0,6);
  const sizes=IS_SIZES.map(([id,l,w,h])=>{ const k=Math.min(26/w,26/h); return `<button type="button" data-isa="size" data-val="${id}" data-testid="is-size-${id}" aria-pressed="${_isL.size===id}" class="isa-size${_isL.size===id?' on':''}"><span class="isa-shape" style="width:${Math.round(w*k)}px;height:${Math.round(h*k)}px"></span><b>${l}</b><small>${w}\u00d7${h}</small></button>`; }).join('');
  const fills=IS_FILLS.map(c=>`<button type="button" data-isa="fill" data-val="${c}" data-testid="is-fill-${c.slice(1)}" aria-label="Background ${c}" class="isa-fill${_isL.fill===c?' on':''}" style="background:${c}"></button>`).join('')+`<label class="isa-fill is-pick" title="Custom colour" style="background:conic-gradient(#ff2d78,#f59e0b,#34d399,#22d3ee,#9328ff,#ff2d78)"><input type="color" id="isa-fill-pick" value="${_isL.fill}" data-testid="is-fill-custom" aria-label="Custom background colour"></label>`;
  const recent=rec.length?`<div class="isa-rec" data-testid="is-recent-grid">${rec.map((x,i)=>`<div class="isa-ri" style="--i:${i}"><button type="button" data-isa="recent" data-id="${x.id}" data-testid="is-recent-${i}" class="isa-rb press" aria-label="Open ${esc(x.name||'recent project')}"><img src="${x.thumb}" alt="" loading="lazy"><span class="isa-rm"><b class="clamp-1">${esc(x.name||(x.src?'Project':'Edited image'))}</b><small>${isAgo(x.at)}${x.src?' \u00b7 layers kept':''}</small></span></button><button type="button" data-isa="recent-del" data-id="${x.id}" data-testid="is-recent-del-${i}" class="isa-rx" aria-label="Remove from recent"><i data-lucide="x"></i></button></div>`).join('')}</div>`
    :`<div class="isa-empty" data-testid="is-recent-empty"><i data-lucide="images"></i><p>Your last 6 projects show up here, ready to keep editing.</p></div>`;
  return `<div class="isa" data-testid="is-launch"><div class="isa-head"><span class="isa-ic"><i data-lucide="wand-sparkles"></i></span><div class="min-w-0 flex-1"><p class="isa-k">Image Studio</p><h3 class="isa-t">What are we making?</h3></div><button data-act="modal-close" aria-label="Close" data-testid="is-launch-close" class="isa-x press"><i data-lucide="x"></i></button></div>
    <div class="isa-start">
      <section class="isa-card is-blank" data-testid="is-blank-card"><div class="isa-ch"><i data-lucide="square-dashed"></i><div><b>New blank canvas</b><small>Pick a size and a background</small></div></div><div class="isa-sizes no-scrollbar">${sizes}</div><div class="isa-fills">${fills}</div><button type="button" data-isa="blank" data-testid="is-new-blank" class="isa-go press"><i data-lucide="plus"></i>Create canvas</button></section>
      <button type="button" data-isa="open" data-testid="is-open-image" class="isa-card is-open press"><span class="isa-oi"><i data-lucide="image-plus"></i></span><b>Open image</b><small>JPG, PNG, WebP or GIF up to 25 MB</small><span class="isa-pill"><i data-lucide="upload"></i>Choose a photo</span></button>
    </div>
    <div class="isa-sec"><p class="isa-sl"><i data-lucide="history"></i>Recent projects <span>${rec.length}/6</span></p>${recent}</div></div>`; }
function isLaunch(){ const m=$("#modal"); if(!m) return; m.innerHTML=modalWrap(isLaunchHtml(),"is-launch-modal","lg"); icons(); }
function openImageStudioFree(){ isLaunch(); }
function isPickPhoto(){ isLaunch(); }
function isFileOpen(){ const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return; if(!/^image\//.test(f.type||'')){ toast('Pick an image','PNG, JPG, WebP or GIF'); return; } if(f.size>25*1024*1024){ toast('Image too large','Use one under 25 MB'); return; }
    const u=URL.createObjectURL(f), name=(f.name||'Image').replace(/\.[^.]+$/,'').slice(0,60)||'Image'; closeModal(); isOpenProject({src:u,own:true,name}); };
  inp.click(); }
function isBlank(){ const z=IS_SIZES.find(x=>x[0]===_isL.size)||IS_SIZES[0]; const c=document.createElement('canvas'); c.width=z[2]; c.height=z[3]; const x=c.getContext('2d'); x.fillStyle=_isL.fill; x.fillRect(0,0,c.width,c.height);
  closeModal(); isOpenProject({src:c.toDataURL('image/png'),name:z[1]+' canvas',blank:true}); }
function isOpenProject(o){ const im=new Image(); im.onload=()=>{ const A=(im.naturalWidth/im.naturalHeight)||1, W=Math.min(2400,im.naturalWidth||1200), H=Math.round(W/A);
    openCoverStudio(o.src,o.name||'Image',!!o.own,{aspect:A,out:[W,H],q:.92,title:'Image Studio',applyLabel:'Save image',isProj:{id:o.id||null,name:o.name||'Image',blank:!!o.blank},onApply:d=>isProjSaved(d)});
    if(_cv){ _cv.tool=o.st?'layers':(o.blank?'draw':'adjust'); if(o.st) _cv._pendingSt=o.st; psRenderTool(); } };
  im.onerror=()=>{ toast('Couldn\u2019t open that image','Try a different file'); }; im.src=o.src; }
function isProjSaved(d){ const snap=window._isSnap||{}; window._isSnap=null; const pj=snap.pj||{}; const im=new Image();
  im.onload=()=>{ const S=220, k=Math.min(1,S/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.width*k)); c.height=Math.max(1,Math.round(im.height*k)); c.getContext('2d').drawImage(im,0,0,c.width,c.height); let th=''; try{ th=c.toDataURL('image/jpeg',.8); }catch(e){}
    const id=pj.id||('isr'+Date.now().toString(36)); const rec={id,at:Date.now(),thumb:th,d,name:pj.name||'Image'}; if(snap.src){ rec.src=snap.src; rec.st=snap.st; rec.blank=!!pj.blank; }
    _isRec=[rec].concat(_isRec.filter(x=>x.id!==id)).slice(0,6); assetPut('is_recent',_isRec).catch(()=>toast('Couldn\u2019t keep a copy','Your device storage is full')); swRefresh('imagestudio'); isResult(d,null); };
  im.src=d; }
function isBaseData(){ if(!_cv||!_cvImg) return ''; if(/^data:/.test(_cv.src)&&_cv.src.length<7e6) return _cv.src; try{ const iw=_cvImg.naturalWidth, ih=_cvImg.naturalHeight, k=Math.min(1,2048/Math.max(iw,ih)); const c=document.createElement('canvas'); c.width=Math.round(iw*k); c.height=Math.round(ih*k); c.getContext('2d').drawImage(_cvImg,0,0,c.width,c.height); return c.toDataURL('image/jpeg',.92); }catch(e){ return /^https?:/.test(_cv.src)?_cv.src:''; } }
const _cvA9u=cvApply; cvApply=function(){ try{ if(_cv&&_cv.opts&&_cv.opts.isProj){ window._isSnap={pj:_cv.opts.isProj,src:isBaseData(),st:psState()}; } }catch(e){ window._isSnap=null; } return _cvA9u.apply(this,arguments); };
const _psSnap9u=psSnap; psSnap=function(init){ if(init&&_cv&&_cv._pendingSt){ const s=_cv._pendingSt; _cv._pendingSt=null; try{ const t=_cv.tool; psRestore(s); _cv.tool=t; psRenderTool(); }catch(e){} } return _psSnap9u.apply(this,arguments); };
function psState(){ return JSON.stringify({zoom:_cv.zoom,rot:_cv.rot,q:_cv.q,flipH:_cv.flipH,flipV:_cv.flipV,panX:+_cv.panX.toFixed(4),panY:+_cv.panY.toFixed(4),adj:_cv.adj,filter:_cv.filter,fstr:_cv.fstr,strokes:_cv.strokes,layers:_cv.layers,inkOff:!!_cv.inkOff}); }
function psInk(ctx,W,H,fresh){ if(_cv.inkOff) return; const list=_cv.strokes.concat(_psLive?[_psLive]:[]); if(!list.length) return; let oc=fresh?null:_psInkC; if(!oc||oc.width!==W||oc.height!==H){ oc=document.createElement('canvas'); oc.width=W; oc.height=H; if(!fresh) _psInkC=oc; } const c=oc.getContext('2d'); c.clearRect(0,0,W,H); list.forEach(s=>psStroke(c,s,W,H)); ctx.drawImage(oc,0,0); }
async function psBake(ctx,W,H){ const layers=(_cv.layers||[]).filter(L=>!L.hidden&&(L.kind==='img'?L.src:(L.text||'').trim())); if(!layers.length) return; const box=document.getElementById('cv-layer-box'); const k=W/((box&&box.clientWidth)||300);
  try{ if(document.fonts&&document.fonts.load) await Promise.all(layers.filter(L=>L.kind!=='img').map(L=>document.fonts.load(cvCanvasFont(L,Math.round(L.size/100*W)),L.text).catch(()=>null))); }catch(e){}
  for(const L of layers){ const px=L.size/100*W; ctx.save(); ctx.globalAlpha=L.op!=null?Math.max(0,Math.min(1,L.op/100)):1; ctx.translate(L.x/100*W,L.y/100*H); ctx.rotate((L.rot||0)*Math.PI/180);
    if(L.kind==='img'){ const im=await psLoadImg(L.src); if(im){ const w=px*2.4, h=w*((im.naturalHeight||1)/(im.naturalWidth||1)); ctx.drawImage(im,-w/2,-h/2,w,h); } ctx.restore(); continue; }
    ctx.font=cvCanvasFont(L,px); const lines=cvWrapLines(ctx,L.text,W*.92); const lh=px*1.1; const bw=Math.max(0,...lines.map(t=>ctx.measureText(t).width)); const total=lh*lines.length; const al=L.kind==='text'?(L.align||'center'):'center'; ctx.textAlign=al; ctx.textBaseline='middle'; const x=al==='left'?-bw/2:(al==='right'?bw/2:0);
    ctx.fillStyle=L.kind==='text'?(L.color||'#ffffff'):'#ffffff'; ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=14*k; ctx.shadowOffsetY=2*k; lines.forEach((t,i)=>ctx.fillText(t,x,-total/2+lh*(i+.5))); ctx.restore(); } }
const _cvRL9u=cvRenderLayers; cvRenderLayers=function(){ const r=_cvRL9u.apply(this,arguments); try{ const box=lhBox(); if(box&&_lh) _lh.layers.forEach(L=>{ const el=box.querySelector('[data-cvl-id="'+L.id+'"]'); if(!el) return; el.style.display=L.hidden?'none':''; el.style.opacity=L.op!=null?String(L.op/100):''; }); }catch(e){} return r; };
const _cvRLP9u=cvRenderLayerPanel; cvRenderLayerPanel=function(){ const r=_cvRLP9u.apply(this,arguments); if(_cv&&_lh===_cv&&_cv.tool==='layers') islRender(); return r; };
const _psRT9u=psRenderTool; psRenderTool=function(){ const r=_psRT9u.apply(this,arguments); if(_cv&&_cv.tool==='layers') islRender(); return r; };
function islName(L,i){ if(L.kind==='text') return (L.text||'').trim()||('Text '+(i+1)); if(L.kind==='emoji') return 'Emoji '+(L.text||''); return 'Sticker'; }
function islRender(){ const pane=document.querySelector('#ps-panel .ps-pane'); if(!pane||!_cv) return; const L=_cv.layers||[], sel=_cv.sel, n=L.length; const ink=(_cv.strokes||[]).length;
  const row=(Ly,i)=>{ const on=Ly.id===sel; const th=Ly.kind==='img'?`<img src="${esc(Ly.src||'')}" alt="">`:(Ly.kind==='emoji'?`<b>${esc(Ly.text||'')}</b>`:`<b class="is-t" style="color:${Ly.color||'#fff'}">Aa</b>`);
    return `<li class="isl-row${on?' on':''}${Ly.hidden?' is-off':''}" data-testid="isl-row-${i}"><button type="button" data-isl="sel" data-id="${Ly.id}" data-testid="isl-sel-${i}" class="isl-main"><span class="isl-th">${th}</span><span class="isl-n clamp-1">${esc(islName(Ly,i))}</span></button><button type="button" data-isl="vis" data-id="${Ly.id}" data-testid="isl-vis-${i}" aria-label="${Ly.hidden?'Show':'Hide'} layer" class="isl-b"><i data-lucide="${Ly.hidden?'eye-off':'eye'}"></i></button><button type="button" data-isl="up" data-id="${Ly.id}" data-testid="isl-up-${i}" aria-label="Move up" class="isl-b" ${i===n-1?'disabled':''}><i data-lucide="chevron-up"></i></button><button type="button" data-isl="down" data-id="${Ly.id}" data-testid="isl-down-${i}" aria-label="Move down" class="isl-b" ${i===0?'disabled':''}><i data-lucide="chevron-down"></i></button><button type="button" data-isl="del" data-id="${Ly.id}" data-testid="isl-del-${i}" aria-label="Delete layer" class="isl-b is-del"><i data-lucide="trash-2"></i></button></li>`; };
  const list=L.map((x,i)=>({x,i})).reverse().map(o=>row(o.x,o.i)).join('');
  const s=L.find(x=>x.id===sel); const op=s?(s.op!=null?s.op:100):100;
  pane.innerHTML=`<div class="isl" data-testid="ps-layers-panel"><div class="isl-head"><p>Layers <span>${n+2}</span></p><button type="button" data-isl="add-text" data-testid="isl-add-text" class="ps-chip"><i data-lucide="type"></i>Text</button><button type="button" data-ps-tool="stickers" data-testid="isl-add-sticker" class="ps-chip"><i data-lucide="sticker"></i>Sticker</button></div>
    <ul class="isl-list">${list}<li class="isl-row is-fixed${_cv.inkOff?' is-off':''}" data-testid="isl-row-drawing"><button type="button" data-ps-tool="draw" class="isl-main"><span class="isl-th"><i data-lucide="brush"></i></span><span class="isl-n">Drawing <small>${ink} stroke${ink!==1?'s':''}</small></span></button><button type="button" data-isl="ink-vis" data-testid="isl-vis-drawing" aria-label="${_cv.inkOff?'Show':'Hide'} drawing" class="isl-b"><i data-lucide="${_cv.inkOff?'eye-off':'eye'}"></i></button><button type="button" data-isl="ink-clear" data-testid="isl-clear-drawing" aria-label="Clear drawing" class="isl-b is-del" ${ink?'':'disabled'}><i data-lucide="eraser"></i></button></li>
    <li class="isl-row is-fixed is-base" data-testid="isl-row-base"><span class="isl-main"><span class="isl-th"><i data-lucide="${_cv.opts&&_cv.opts.isProj&&_cv.opts.isProj.blank?'square':'image'}"></i></span><span class="isl-n">${_cv.opts&&_cv.opts.isProj&&_cv.opts.isProj.blank?'Canvas':'Photo'} <small>Background</small></span></span><span class="isl-lock"><i data-lucide="lock"></i></span></li></ul>
    ${s?`<div class="isl-op"><span>Opacity</span><input type="range" min="5" max="100" step="1" value="${op}" data-isl-op data-testid="isl-opacity" class="i-slider" aria-label="Layer opacity"><b id="isl-op-v">${op}%</b></div>${s.kind==='text'?`<button type="button" data-ps-tool="text" data-testid="isl-edit-text" class="ps-chip mt-2"><i data-lucide="pencil"></i>Edit text &amp; font</button>`:''}`:`<p class="ps-hint"><i data-lucide="layers"></i>Tap a layer to select it. Hide, reorder or delete layers here. Top of the list sits on top.</p>`}</div>`;
  icons(); }
function islAct(a,id){ if(!_cv) return; const L=_cv.layers||[]; const i=L.findIndex(x=>x.id===id);
  if(a==='sel'){ _cv.sel=id; cvRenderLayers(); islRender(); return; }
  if(a==='add-text'){ cvAddLayer({id:bgUID(),kind:'text',text:'Text',x:50,y:50,size:10,rot:0,color:'#ffffff',align:'center',font:''}); psSnap(); islRender(); return; }
  if(a==='ink-vis'){ _cv.inkOff=!_cv.inkOff; psQueue(); psSnap(); islRender(); return; }
  if(a==='ink-clear'){ _cv.strokes=[]; psQueue(); psSnap(); islRender(); toast('Drawing cleared'); return; }
  if(i<0) return;
  if(a==='vis'){ L[i].hidden=!L[i].hidden; }
  else if(a==='up'&&i<L.length-1){ [L[i],L[i+1]]=[L[i+1],L[i]]; }
  else if(a==='down'&&i>0){ [L[i],L[i-1]]=[L[i-1],L[i]]; }
  else if(a==='del'){ L.splice(i,1); if(_cv.sel===id) _cv.sel=null; toast('Layer deleted'); }
  cvRenderLayers(); psSnap(); islRender(); }
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-isl]'); if(!b||!_cv) return; islAct(b.dataset.isl,b.dataset.id); });
document.addEventListener('input',e=>{ const s=e.target; if(!s||!s.hasAttribute||!s.hasAttribute('data-isl-op')||!_cv) return; const L=(_cv.layers||[]).find(x=>x.id===_cv.sel); if(!L) return; L.op=+s.value; const v=document.getElementById('isl-op-v'); if(v) v.textContent=s.value+'%'; try{ fillSlider(s); }catch(_){} cvRenderLayers(); });
document.addEventListener('change',e=>{ const s=e.target; if(s&&s.hasAttribute&&s.hasAttribute('data-isl-op')&&_cv) psSnap(); });
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-isa]'); if(!b) return; const a=b.dataset.isa;
  if(a==='size'){ _isL.size=b.dataset.val; isLaunch(); }
  else if(a==='fill'){ _isL.fill=b.dataset.val; isLaunch(); }
  else if(a==='blank') isBlank();
  else if(a==='open') isFileOpen();
  else if(a==='recent'){ const r=_isRec.find(x=>x.id===b.dataset.id); if(!r) return; closeModal(); if(r.src) isOpenProject({id:r.id,src:r.src,name:r.name,st:r.st,blank:r.blank}); else isOpenProject({id:r.id,src:r.d,name:r.name||'Edited image'}); }
  else if(a==='recent-del'){ _isRec=_isRec.filter(x=>x.id!==b.dataset.id); assetPut('is_recent',_isRec).catch(()=>{}); swRefresh('imagestudio'); isLaunch(); toast('Removed from recent projects'); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='isa-fill-pick') _isL.fill=e.target.value; });
document.addEventListener('change',e=>{ if(e.target&&e.target.id==='isa-fill-pick'){ _isL.fill=e.target.value; isLaunch(); } });
window.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="is-recent-edit"]'); if(!t) return; const r=_isRec.find(x=>x.id===t.dataset.id); if(!r||!r.src) return; e.stopPropagation(); e.preventDefault(); const res=document.getElementById('is-result'); if(res) res.innerHTML=''; isOpenProject({id:r.id,src:r.src,name:r.name,st:r.st,blank:r.blank}); },true);
