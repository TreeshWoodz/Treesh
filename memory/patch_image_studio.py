import sys
P = "/app/single_html/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        print("MISMATCH", n, "for:", old[:140]); sys.exit(1)
    s = s.replace(old, new)

# --- rename ---
rep('{ icon:"crop", title:"Cover Art Studio", desc:"Crop, zoom, rotate, flip and add filters to your cover art before you save an upload." },',
    '{ icon:"image", title:"Image Studio", desc:"Crop, zoom, rotate, flip and filter your cover art, then add movable text and emoji stickers that are baked into the saved image." },')
rep("(stacked above #modal, e.g. Cover Art Studio)", "(stacked above #modal, e.g. Image Studio)")
rep("pending save, from Cover Art Studio */", "pending save, from Image Studio */")
rep("   COVER ART STUDIO (stacked #modal2) - crop / zoom / rotate / filters.",
    "   IMAGE STUDIO (stacked #modal2) - crop / zoom / rotate / filters + text & emoji layers.")
rep('<i data-lucide="sliders-horizontal" style="width:14px;height:14px"></i>Adjust cover</button>',
    '<i data-lucide="image" style="width:14px;height:14px"></i>Open in Image Studio</button>')

# --- state ---
rep("_cv={ zoom:1, rot:0, panX:0, panY:0, filter:'none', bright:1, contrast:1, sat:1, flip:false, src:src, ownSrc:!!ownSrc };",
    "_cv={ zoom:1, rot:0, panX:0, panY:0, filter:'none', bright:1, contrast:1, sat:1, flip:false, src:src, ownSrc:!!ownSrc, layers:[], sel:null };")

# --- header ---
rep('''<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="crop" style="width:20px;height:20px"></i></span>
      <div class="min-w-0"><h2 class="text-lg font-bold leading-tight">Cover Art Studio</h2>''',
    '''<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="image" style="width:20px;height:20px"></i></span>
      <div class="min-w-0"><h2 class="text-lg font-bold leading-tight" data-testid="image-studio-title">Image Studio</h2>''')

# --- body: wider preview, layer overlay, tabs ---
rep('''  const bodyGrid=`<div class="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,270px)_minmax(0,1fr)]">
      <div class="min-w-0">
        <div class="relative mx-auto w-full max-w-[270px]">''',
    '''  const bodyGrid=`<div class="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <div class="min-w-0">
        <div class="relative mx-auto w-full max-w-[300px]">''')
rep('''<div class="absolute inset-x-0 top-2/3 h-px bg-white/70"></div></div>
            <div id="cv-loading"''',
    '''<div class="absolute inset-x-0 top-2/3 h-px bg-white/70"></div></div>
            <div id="cv-layers" data-testid="image-studio-layers" class="pointer-events-none absolute inset-0"></div>
            <div id="cv-loading"''')
rep('''<i data-lucide="move" style="width:12px;height:12px"></i>Drag image to reposition</p>''',
    '''<i data-lucide="move" style="width:12px;height:12px"></i>Drag the image to reposition \\u00b7 drag layers to move them</p>''')
rep('''      <div class="min-w-0 space-y-3.5">
        ${cvSliderHtml('cv-zoom','zoom-in','Zoom',100,300,1,100,'1.0x')}''',
    '''      <div class="min-w-0 space-y-3.5">
        <div class="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1" data-testid="image-studio-tabs">
          <button type="button" data-cv-tab="adjust" data-testid="image-studio-tab-adjust" class="press flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold bg-[color:var(--treesh-purple)] text-white"><i data-lucide="sliders-horizontal" style="width:13px;height:13px"></i>Adjust</button>
          <button type="button" data-cv-tab="layers" data-testid="image-studio-tab-layers" class="press flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-white/60 hover:text-white"><i data-lucide="type" style="width:13px;height:13px"></i>Text &amp; stickers</button>
        </div>
        <div id="cv-pane-layers" class="hidden" data-testid="image-studio-layer-panel"><div id="cv-layer-panel"></div></div>
        <div id="cv-pane-adjust" class="space-y-3.5">
        ${cvSliderHtml('cv-zoom','zoom-in','Zoom',100,300,1,100,'1.0x')}''')
rep('''            ${cvSliderHtml('cv-sat','droplet','Saturation',0,200,1,100,'100%')}
          </div>
        </details>
      </div>
    </div>`;''',
    '''            ${cvSliderHtml('cv-sat','droplet','Saturation',0,200,1,100,'100%')}
          </div>
        </details>
        </div>
      </div>
    </div>`;''')
rep('''<i data-lucide="check" style="width:16px;height:16px"></i>Apply cover</button>''',
    '''<i data-lucide="check" style="width:16px;height:16px"></i>Apply image</button>''')
rep('''class="glass-strong panel-in relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-white/15 text-white">${header}''',
    '''class="glass-strong panel-in relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-white/15 text-white">${header}''')
rep('''  im.onload=()=>{ _cvImg=im; const ld=document.getElementById('cv-loading'); if(ld) ld.classList.add('hidden'); cvDraw(); };''',
    '''  im.onload=()=>{ _cvImg=im; const ld=document.getElementById('cv-loading'); if(ld) ld.classList.add('hidden'); cvDraw(); cvRenderLayers(); };''')

# --- wire tabs + layer panel ---
rep('''  const ap=document.getElementById('cv-apply'); if(ap) ap.addEventListener('click',cvApply);
}''',
    '''  const ap=document.getElementById('cv-apply'); if(ap) ap.addEventListener('click',cvApply);
  root.querySelectorAll('[data-cv-tab]').forEach(b=>b.addEventListener('click',()=>{ const t=b.getAttribute('data-cv-tab'); root.querySelectorAll('[data-cv-tab]').forEach(x=>{ const on=x===b; x.classList.toggle('bg-[color:var(--treesh-purple)]',on); x.classList.toggle('text-white',on); x.classList.toggle('text-white/60',!on); }); const pa=document.getElementById('cv-pane-adjust'), pl=document.getElementById('cv-pane-layers'); if(pa) pa.classList.toggle('hidden',t!=='adjust'); if(pl) pl.classList.toggle('hidden',t!=='layers'); if(t==='layers') cvRenderLayerPanel(); }));
  const lp=document.getElementById('cv-layer-panel'); if(lp){ lp.addEventListener('click',cvLayerPanelClick); lp.addEventListener('input',cvLayerPanelInput); }
  cvRenderLayerPanel();
}
/* ---- Image Studio layers: text + emoji stickers (drag / pinch / rotate), baked into the export ---- */
function cvSelLayer(){ if(!_cv) return null; const a=_cv.layers; if(!a.length){ _cv.sel=null; return null; } let L=a.find(x=>x.id===_cv.sel); if(!L){ L=a[a.length-1]; _cv.sel=L.id; } return L; }
function cvClampSize(v){ return Math.max(3,Math.min(40,Math.round(v*10)/10)); }
function cvNormRot(r){ return Math.round(((r%360)+540)%360-180); }
function cvLayerStyle(L,w){ return `left:${L.x}%;top:${L.y}%;transform:translate(-50%,-50%) rotate(${L.rot}deg);font-size:${L.size/100*w}px;${L.kind==='text'?`color:${L.color};text-align:${L.align};font-family:${bgFontStack(L.font)}`:''}`; }
function cvRenderLayers(){ const box=document.getElementById('cv-layers'); if(!box||!_cv) return; const w=box.clientWidth||300; const selId=(cvSelLayer()||{}).id;
  box.innerHTML=_cv.layers.map((L,i)=>`<div class="bd-ptext${L.id===selId?' bd-ptext-sel':''}" data-cvl-id="${L.id}" data-testid="image-studio-layer-${i}" style="pointer-events:auto;${cvLayerStyle(L,w)}"><span class="bd-ptext-inner">${esc((L.text||'').trim()?L.text:'\\u00A0')}</span><span class="bd-ph-handle bd-rot" data-rot aria-label="Rotate"><i data-lucide="rotate-cw" style="width:12px;height:12px"></i></span><span class="bd-ph-handle bd-rh" data-rh aria-label="Resize"><i data-lucide="move" style="width:12px;height:12px"></i></span></div>`).join('');
  icons(); cvBindLayers(); }
function cvStyleLayer(L){ const box=document.getElementById('cv-layers'); const el=box&&box.querySelector('[data-cvl-id="'+L.id+'"]'); if(!el) return; const w=box.clientWidth||300;
  el.style.left=L.x+'%'; el.style.top=L.y+'%'; el.style.transform='translate(-50%,-50%) rotate('+L.rot+'deg)'; el.style.fontSize=(L.size/100*w)+'px';
  if(L.kind==='text'){ el.style.color=L.color; el.style.textAlign=L.align; el.style.fontFamily=bgFontStack(L.font); }
  const inner=el.querySelector('.bd-ptext-inner'); if(inner) inner.textContent=(L.text||'').trim()?L.text:'\\u00A0'; }
function cvSyncLayerCtl(L){ const set=(id,v)=>{ const el=document.getElementById(id); if(el&&document.activeElement!==el) el.value=v; };
  set('cv-l-size',Math.round(L.size)); set('cv-l-rot',Math.round(L.rot));
  const sv=document.getElementById('cv-l-size-val'); if(sv) sv.textContent=Math.round(L.size); const rv=document.getElementById('cv-l-rot-val'); if(rv) rv.textContent=Math.round(L.rot)+'\\u00B0'; }
function cvBindLayers(){ const box=document.getElementById('cv-layers'); if(!box) return;
  box.querySelectorAll('[data-cvl-id]').forEach(el=>{ const pts=new Map(); let mode=null,sx=0,sy=0,bx=0,by=0,bs=0,pd=1,pa=0,ps=0,pr=0;
    const cur=()=>_cv&&_cv.layers.find(x=>x.id===el.getAttribute('data-cvl-id'));
    el.addEventListener('pointerdown',e=>{ const L=cur(); if(!L) return; e.preventDefault(); e.stopPropagation(); try{ el.setPointerCapture(e.pointerId); }catch(_){} pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(_cv.sel!==L.id){ _cv.sel=L.id; box.querySelectorAll('[data-cvl-id]').forEach(x=>x.classList.toggle('bd-ptext-sel',x===el)); cvRenderLayerPanel(); }
      if(pts.size>=2){ const p=[...pts.values()]; pd=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1; pa=Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x); ps=L.size; pr=L.rot; mode='pinch'; return; }
      if(e.target.closest('[data-rh]')){ mode='resize'; bs=L.size; sy=e.clientY; } else if(e.target.closest('[data-rot]')){ mode='rotate'; } else { mode='move'; bx=L.x; by=L.y; sx=e.clientX; sy=e.clientY; } });
    el.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); const L=cur(); if(!L) return; const r=box.getBoundingClientRect();
      if(mode==='pinch'&&pts.size>=2){ const p=[...pts.values()]; const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1; const a=Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x); L.size=cvClampSize(ps*d/pd); L.rot=cvNormRot(pr+(a-pa)*180/Math.PI); }
      else if(mode==='move'){ L.x=Math.max(2,Math.min(98,bx+(e.clientX-sx)/r.width*100)); L.y=Math.max(4,Math.min(96,by+(e.clientY-sy)/r.height*100)); }
      else if(mode==='resize'){ L.size=cvClampSize(bs+(e.clientY-sy)/r.height*100*0.6); }
      else if(mode==='rotate'){ const cx=r.left+L.x/100*r.width, cy=r.top+L.y/100*r.height; L.rot=cvNormRot(Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90); }
      else return;
      cvStyleLayer(L); cvSyncLayerCtl(L); e.preventDefault(); });
    const end=e=>{ pts.delete(e.pointerId); const L=cur(); if(mode==='pinch'&&pts.size===1&&L){ const p=[...pts.values()][0]; mode='move'; bx=L.x; by=L.y; sx=p.x; sy=p.y; } if(pts.size===0) mode=null; };
    el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
    el.addEventListener('wheel',e=>{ e.preventDefault(); const L=cur(); if(!L) return; L.size=cvClampSize(L.size+(e.deltaY<0?0.6:-0.6)); cvStyleLayer(L); cvSyncLayerCtl(L); },{passive:false});
  }); }
function cvRenderLayerPanel(){ const lp=document.getElementById('cv-layer-panel'); if(!lp||!_cv) return; const layers=_cv.layers; const sel=cvSelLayer();
  const chipCls=on=>`press inline-flex max-w-[150px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${on?'border-[color:var(--treesh-purple)] bg-[color:var(--treesh-purple)]/15 text-white':'border-white/12 bg-white/5 text-white/70 hover:bg-white/10'}`;
  const chips=layers.map((L,i)=>`<button type="button" data-cvl-select="${L.id}" data-testid="image-studio-layer-chip-${i}" class="${chipCls(sel&&sel.id===L.id)}"><i data-lucide="${L.kind==='emoji'?'smile':'type'}" style="width:12px;height:12px"></i><span class="clamp-1">${esc((L.text||'').trim()||('Layer '+(i+1)))}</span></button>`).join('');
  const addText=layers.length<10?`<button type="button" data-cvl-add-text data-testid="image-studio-add-text" class="press inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-white/25 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"><i data-lucide="plus" style="width:12px;height:12px"></i>Text</button>`:'';
  const emojis=BG_EMOJIS.map((em,i)=>`<button type="button" data-cvl-emoji="${em}" data-testid="image-studio-emoji-${i}" aria-label="Add ${em} sticker" class="press grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg leading-none hover:bg-white/10">${em}</button>`).join('');
  let editor=`<p class="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-3 py-4 text-center text-xs text-white/45" data-testid="image-studio-layers-empty">Add text or tap a sticker. Layers are saved into the final image.</p>`;
  if(sel){ const isText=sel.kind==='text';
    const fontChip=(id,name,stack)=>`<button type="button" data-cvl-font="${id}" data-testid="image-studio-font-${id||'default'}" class="press shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${(sel.font||'')===id?'border-[color:var(--treesh-purple)] bg-[color:var(--treesh-purple)]/15 text-white':'border-white/12 bg-white/5 text-white/70 hover:bg-white/10'}" ${stack?`style="font-family:${stack}"`:''}>${name}</button>`;
    const alignBtn=(v,ic)=>`<button type="button" data-cvl-align="${v}" data-testid="image-studio-align-${v}" class="press flex-1 inline-flex items-center justify-center rounded-lg px-2 py-1.5 ${(sel.align||'center')===v?'bg-[color:var(--treesh-purple)] text-white':'text-white/60 hover:text-white'}"><i data-lucide="${ic}" style="width:14px;height:14px"></i></button>`;
    const posBtn=(v,l)=>`<button type="button" data-cvl-pos="${v}" data-testid="image-studio-pos-${v}" class="press flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white/60 hover:bg-white/10 hover:text-white">${l}</button>`;
    editor=`<div class="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5" data-testid="image-studio-layer-controls">
      ${isText?`<input id="cv-l-text" data-testid="image-studio-text-input" value="${esc(sel.text||'')}" maxlength="80" placeholder="Type your words\\u2026" class="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[color:var(--treesh-purple)]">
      <div class="no-scrollbar -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-1">${fontChip('','Default','')}${(typeof FONTS!=='undefined'?FONTS:[]).map(f=>fontChip(f.id,f.name,f.stack)).join('')}</div>`:`<p class="text-[11px] text-white/50">Emoji sticker: drag it on the preview, pinch or scroll to resize, and use the top handle to spin it.</p>`}
      <div><div class="mb-0.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-white/40"><span>Size</span><span id="cv-l-size-val" class="font-doto text-white/70">${Math.round(sel.size)}</span></div><input id="cv-l-size" type="range" min="3" max="40" step="1" value="${Math.round(sel.size)}" data-testid="image-studio-size" class="w-full accent-[color:var(--treesh-purple)]"></div>
      <div><div class="mb-0.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-white/40"><span>Rotation</span><span id="cv-l-rot-val" class="font-doto text-white/70">${Math.round(sel.rot)}\\u00B0</span></div><input id="cv-l-rot" type="range" min="-180" max="180" step="1" value="${Math.round(sel.rot)}" data-testid="image-studio-rotation" class="w-full accent-[color:var(--treesh-purple)]"></div>
      <div class="flex flex-wrap items-center gap-2">
        ${isText?`<div class="flex min-w-[110px] flex-1 gap-1 rounded-lg border border-white/10 bg-white/5 p-1">${alignBtn('left','align-left')}${alignBtn('center','align-center')}${alignBtn('right','align-right')}</div>`:''}
        <div class="flex min-w-[150px] flex-1 gap-1 rounded-lg border border-white/10 bg-white/5 p-1">${posBtn('top','Top')}${posBtn('center','Middle')}${posBtn('bottom','Bottom')}</div>
        ${isText?`<label class="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/70"><span>Color</span><input id="cv-l-color" type="color" value="${sel.color||'#ffffff'}" data-testid="image-studio-color" class="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"></label>`:''}
      </div>
      <button type="button" data-cvl-del data-testid="image-studio-delete-layer" class="press inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20"><i data-lucide="trash-2" style="width:12px;height:12px"></i>Delete this layer</button>
    </div>`; }
  lp.innerHTML=`<div class="space-y-2.5">
    <div><p class="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/40">Layers</p><div class="no-scrollbar -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-1">${chips}${addText}</div></div>
    <div><p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/35">Tap a sticker to add it</p><div class="no-scrollbar -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-1">${emojis}</div></div>
    ${editor}</div>`;
  icons(); }
function cvAddLayer(L){ if(!_cv) return; if(_cv.layers.length>=10){ toast("Limit reached","Up to 10 layers per image"); return; } _cv.layers.push(L); _cv.sel=L.id; cvRenderLayers(); cvRenderLayerPanel(); }
function cvLayerPanelClick(e){ if(!_cv) return; const b=e.target.closest('button'); if(!b) return; const L=cvSelLayer();
  if(b.hasAttribute('data-cvl-select')){ _cv.sel=b.getAttribute('data-cvl-select'); cvRenderLayers(); cvRenderLayerPanel(); return; }
  if(b.hasAttribute('data-cvl-add-text')){ cvAddLayer({id:bgUID(),kind:'text',text:'Text',x:50,y:50,size:10,rot:0,color:'#ffffff',align:'center',font:''}); const ti=document.getElementById('cv-l-text'); if(ti){ ti.focus(); ti.select(); } return; }
  if(b.hasAttribute('data-cvl-emoji')){ cvAddLayer({id:bgUID(),kind:'emoji',text:b.getAttribute('data-cvl-emoji'),x:50,y:50,size:18,rot:0,color:'#ffffff',align:'center',font:''}); return; }
  if(!L) return;
  if(b.hasAttribute('data-cvl-font')){ L.font=b.getAttribute('data-cvl-font')||''; cvStyleLayer(L); cvRenderLayerPanel(); return; }
  if(b.hasAttribute('data-cvl-align')){ L.align=b.getAttribute('data-cvl-align'); cvStyleLayer(L); cvRenderLayerPanel(); return; }
  if(b.hasAttribute('data-cvl-pos')){ const v=b.getAttribute('data-cvl-pos'); L.y=(v==='top'?16:(v==='center'?50:84)); cvStyleLayer(L); return; }
  if(b.hasAttribute('data-cvl-del')){ const i=_cv.layers.findIndex(x=>x.id===L.id); if(i>=0){ _cv.layers.splice(i,1); _cv.sel=_cv.layers.length?_cv.layers[Math.max(0,i-1)].id:null; cvRenderLayers(); cvRenderLayerPanel(); } }
}
function cvLayerPanelInput(e){ const L=cvSelLayer(); if(!L) return; const t=e.target;
  if(t.id==='cv-l-text'){ L.text=t.value.slice(0,80); cvStyleLayer(L); const chip=document.querySelector('[data-cvl-select="'+L.id+'"] .clamp-1'); if(chip) chip.textContent=L.text.trim()||'Layer'; }
  else if(t.id==='cv-l-size'){ L.size=cvClampSize(+t.value); cvStyleLayer(L); cvSyncLayerCtl(L); }
  else if(t.id==='cv-l-rot'){ L.rot=cvNormRot(+t.value); cvStyleLayer(L); cvSyncLayerCtl(L); }
  else if(t.id==='cv-l-color'){ L.color=t.value; cvStyleLayer(L); }
}
function cvCanvasFont(L,px){ let fam=bgFontStack(L.font); if(fam.indexOf('var(')===0) fam="'Manrope',system-ui,sans-serif"; return (L.kind==='emoji'?'400 ':'800 ')+px+'px '+fam; }
function cvWrapLines(ctx,text,maxW){ const out=[]; String(text||'').split('\\n').forEach(par=>{ const words=par.split(' '); let line=''; words.forEach(w=>{ const t=line?line+' '+w:w; if(line && ctx.measureText(t).width>maxW){ out.push(line); line=w; } else line=t; }); out.push(line); }); return out; }
async function cvBakeLayers(ctx,S){ const layers=((_cv&&_cv.layers)||[]).filter(L=>(L.text||'').trim()); if(!layers.length) return;
  const box=document.getElementById('cv-layers'); const k=S/((box&&box.clientWidth)||300);
  try{ if(document.fonts&&document.fonts.load) await Promise.all(layers.map(L=>document.fonts.load(cvCanvasFont(L,Math.round(L.size/100*S)), L.text).catch(()=>null))); }catch(e){}
  layers.forEach(L=>{ const px=L.size/100*S; ctx.save(); ctx.font=cvCanvasFont(L,px); try{ if('letterSpacing' in ctx && L.kind==='text') ctx.letterSpacing=(-0.01*px)+'px'; }catch(e){}
    ctx.translate(L.x/100*S, L.y/100*S); ctx.rotate((L.rot||0)*Math.PI/180);
    const lines=cvWrapLines(ctx, L.text, S*0.92); const lh=px*1.1; const bw=Math.max(0,...lines.map(t=>ctx.measureText(t).width)); const total=lh*lines.length;
    const al=L.kind==='text'?(L.align||'center'):'center'; ctx.textAlign=al; ctx.textBaseline='middle'; const x=al==='left'?-bw/2:(al==='right'?bw/2:0);
    ctx.fillStyle=L.kind==='text'?(L.color||'#ffffff'):'#ffffff'; ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=14*k; ctx.shadowOffsetY=2*k;
    lines.forEach((t,i)=>ctx.fillText(t, x, -total/2+lh*(i+0.5))); ctx.restore(); }); }''')

# --- export: bake layers ---
rep('''  try{ cvRender(out.getContext('2d'), S); if(out.toBlob){ out.toBlob(b=>finish(b),'image/jpeg',0.9); } else { finish(_dataURLtoBlob(out.toDataURL('image/jpeg',0.9))); } }
  catch(e){ console.error('cover export failed',e); toast("Couldn\\u2019t process image"); }''',
    '''  try{ const ctx=out.getContext('2d'); cvRender(ctx, S); cvBakeLayers(ctx, S).catch(e=>console.warn('layer bake failed',e)).then(()=>{ try{ if(out.toBlob){ out.toBlob(b=>finish(b),'image/jpeg',0.9); } else { finish(_dataURLtoBlob(out.toDataURL('image/jpeg',0.9))); } }catch(e){ console.error('cover export failed',e); toast("Couldn\\u2019t process image"); } }); }
  catch(e){ console.error('cover export failed',e); toast("Couldn\\u2019t process image"); }''')

open(P, "w", encoding="utf-8").write(s)
print("OK")
