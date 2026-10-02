function bdModalHtml(){
  const imgs=state.bgImages||[]; const count=imgs.filter(Boolean).length;
  if(!Array.isArray(state.bgMeta)) state.bgMeta=[];
  const focus=Math.min(state.bgFocus||0, Math.max(0,count-1));
  const S=state.bgSlide||{on:false,source:'all',order:'seq',time:8,fx:'fade',sel:[]};
  const dimPct=Math.round((state.bgDim!=null?state.bgDim:0.6)*100);
  bgNormText();
  const VW=Math.max(1,Math.round(window.innerWidth||16)), VH=Math.max(1,Math.round(window.innerHeight||9));
  const head=`<div class="st-head">
     <span class="st-head-ic"><i data-lucide="image"></i></span>
     <div class="min-w-0 flex-1"><p class="st-eyebrow">Backdrops</p><h3 class="st-title">Your wallpapers</h3></div>
     <span class="st-pill" data-testid="bd-count">${count}/9</span>
     <button data-act="modal-close" data-testid="bd-close" aria-label="Close" class="st-x press"><i data-lucide="x"></i></button>
   </div>`;
  const selMode=S.source==='sel';
  const tile=(i)=>{ const src=imgs[i]; const meta=state.bgMeta[i]||{}; const fcss=bgFilterCss(meta.filter||'none'); const isActive=(i===state.bgIndex); const inSel=(S.sel||[]).indexOf(i)>=0;
    const ta=(meta.texts||[]).filter(L=>(L.text||'').trim()); const first=ta.length?ta[0].text:((meta.text||'').trim());
    return `<div class="st-tile${i===focus?' on':''}" data-testid="bd-tile-${i}">
       <button data-act="bd-focus" data-idx="${i}" data-testid="bd-focus-${i}" class="press block aspect-[4/3] w-full"><img src="${src}" alt="Backdrop ${i+1}" draggable="false" class="h-full w-full object-cover" style="${fcss?`filter:${fcss}`:''}"></button>
       ${selMode?`<button data-act="bd-sel-toggle" data-idx="${i}" data-testid="bd-sel-${i}" aria-pressed="${inSel}" aria-label="Include backdrop ${i+1} in slideshow" class="st-tile-check press${inSel?' on':''}"><i data-lucide="check"></i></button>`:(isActive?`<span class="st-tile-badge"><i data-lucide="check"></i>Active</span>`:'')}
       <button data-act="bd-remove" data-idx="${i}" data-testid="bd-remove-${i}" aria-label="Remove backdrop ${i+1}" class="st-tile-x press"><i data-lucide="x"></i></button>
       ${first?`<span class="st-tile-cap">${esc(first)}${ta.length>1?' +'+(ta.length-1):''}</span>`:''}
     </div>`; };
  const addSlot = count<9 ? `<label data-testid="bd-add" class="st-tile-add press"><span class="flex flex-col items-center gap-1"><i data-lucide="image-plus"></i><span>Add</span></span><input type="file" accept="image/*" class="hidden bd-file-input"></label>` : '';
  const gallery=stCard('images','Gallery',count?'Tap a backdrop to edit it':'Add up to 9 images. Photos are optimized automatically.',`<div class="grid grid-cols-3 gap-2.5 lg:grid-cols-4" data-testid="bd-grid">${imgs.map((s,i)=>s?tile(i):'').join('')}${addSlot}</div>`,`<span class="st-pill">${count}/9</span>`,'bd-gallery');
  let preview;
  if(count){ const meta=state.bgMeta[focus]||{}; const fcss=bgFilterCss(meta.filter||'none'); const texts=bgNormTexts(focus); const selId=(bdSelLayer()||{}).id;
    const showPh = !texts.some(L=>(L.text||'').trim());
    const layersHtml=texts.map((L,i)=>`<div class="bd-ptext${L.id===selId?' bd-ptext-sel':''}" data-id="${L.id}" data-testid="bd-ptext-${i}" style="left:${L.x}%;top:${L.y}%;transform:translate(-50%,-50%) rotate(${L.rot||0}deg)${L.kind==='text'?`;text-align:${L.align};color:${L.color};font-family:${bgFontStack(L.font)}`:''}"><span class="bd-ptext-inner">${esc((L.text||'').trim()?L.text:'\u00A0')}</span><span class="bd-ph-handle bd-rot" data-rot aria-label="Rotate"><i data-lucide="rotate-cw" style="width:12px;height:12px"></i></span><span class="bd-ph-handle bd-rh" data-rh aria-label="Resize"><i data-lucide="move" style="width:12px;height:12px"></i></span></div>`).join('');
    preview=`<div class="st-stage" data-testid="bd-stage">
       <div class="st-stage-top"><span class="st-pill"><i data-lucide="monitor-smartphone"></i>Backdrop ${focus+1} \u00B7 your screen</span><span class="text-[10px] opacity-50">Drag \u00B7 pinch or scroll to size</span></div>
       <div id="bd-preview" data-testid="bd-preview" class="st-frame bd-frame relative mx-auto touch-none select-none" style="aspect-ratio:${VW}/${VH};width:min(100%,calc(var(--bd-h) * ${VW} / ${VH}))">
         <img src="${imgs[focus]}" alt="Preview" draggable="false" class="pointer-events-none absolute inset-0 h-full w-full object-cover" style="${fcss?`filter:${fcss}`:''}">
         ${state.bgOverlay?`<div class="pointer-events-none absolute inset-0" style="background:var(--app-bg);opacity:${Math.max(0.2,Math.min(0.9,state.bgDim!=null?state.bgDim:0.6))}"></div>`:''}
         <div id="bd-preview-ph" class="pointer-events-none absolute inset-0 grid place-items-center" style="${showPh?'':'display:none'}"><span class="rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur">Add text or a sticker</span></div>
         ${layersHtml}
       </div>
     </div>`;
  } else {
    preview=`<div class="st-stage" data-testid="bd-stage" style="position:static"><div class="st-empty-stage" data-testid="bd-empty"><span class="st-empty-ic"><i data-lucide="image-plus"></i></span><p class="text-base font-bold">Make Treesh yours</p><p class="max-w-xs text-xs opacity-60">Add a photo to use as your wallpaper, then dress it up with text, stickers and filters, or mix several into a slideshow.</p><label class="st-btn primary lg mt-3 cursor-pointer" data-testid="bd-add-hero"><i data-lucide="upload"></i>Add a photo<input type="file" accept="image/*" class="hidden bd-file-input"></label></div></div>`;
  }
  let editor='';
  if(count){ const meta=state.bgMeta[focus]||{}; const texts=bgNormTexts(focus); const sel=bdSelLayer(); const curF=meta.filter||'none';
    const filterTiles=BG_FILTERS.map(([id,label,css])=>`<button data-act="bd-filter" data-f="${id}" data-testid="bd-filter-${id}" aria-pressed="${curF===id}" class="st-filter press${curF===id?' on':''}"><span class="st-filter-th"><img data-bd-thumb alt="" draggable="false" style="${css?`filter:${css}`:''}"></span>${label}</button>`).join('');
    const layerChips=texts.map((L,i)=>`<button data-act="bd-text-select" data-id="${L.id}" data-testid="bd-layer-chip-${i}" aria-pressed="${!!(sel&&sel.id===L.id)}" class="st-chip${sel&&sel.id===L.id?' on':''}"><i data-lucide="${L.kind==='emoji'?'smile':'type'}"></i><span class="clamp-1">${esc((L.text||'').trim()||('Layer '+(i+1)))}</span></button>`).join('');
    const addTextChip = texts.length<10 ? `<button data-act="bd-text-add" data-testid="bd-text-add" class="st-chip dashed"><i data-lucide="plus"></i>Text</button>` : '';
    const emojiRow=BG_EMOJIS.map(em=>`<button data-act="bd-emoji-add" data-em="${em}" aria-label="Add ${em} sticker" class="st-emoji">${em}</button>`).join('');
    const fontChip=(id,name,stack)=>`<button data-act="bd-text-font" data-font="${id}" data-testid="bd-font-${id||'default'}" aria-pressed="${!!(sel&&(sel.font||'')===id)}" class="st-chip${sel&&(sel.font||'')===id?' on':''}"${stack?` style="font-family:${stack}"`:''}>${name}</button>`;
    const posBtn=(v,l)=>`<button data-act="bd-text-pos" data-v="${v}" data-testid="bd-text-pos-${v}">${l}</button>`;
    const alignBtn=(v,ic)=>`<button data-act="bd-text-align" data-v="${v}" data-testid="bd-text-align-${v}" aria-label="Align ${v}" aria-pressed="${!!(sel&&(sel.align||'center')===v)}" class="${sel&&(sel.align||'center')===v?'on':''}"><i data-lucide="${ic}"></i></button>`;
    let layerEditor='';
    if(sel){ const isText=sel.kind==='text';
      layerEditor=`<div class="st-layer-ed mt-3" data-testid="bd-text-controls">
         ${isText?`<input id="bd-text-input" data-testid="bd-text-input" value="${esc(sel.text||'')}" maxlength="80" placeholder="Type your words\u2026" class="st-input">
         <p class="st-sub">Font</p><div class="st-chips st-chips-scroll">${fontChip('','Default','')}${(typeof FONTS!=='undefined'?FONTS:[]).map(f=>fontChip(f.id,f.name,f.stack)).join('')}</div>`:`<p class="st-note"><i data-lucide="info"></i>Emoji sticker: drag it on the preview, pinch or scroll to resize, and use the top handle or Rotation to spin it.</p>`}
         <div class="mt-3 space-y-2">
           ${stRange({id:'bd-size',ic:'scaling',label:'Size',min:3,max:30,val:Math.round(sel.size),txt:Math.round(sel.size),vid:'bd-size-val',attrs:'oninput="bdSetTextSizeV(this.value)"',tid:'bd-text-size-slider'})}
           ${stRange({id:'bd-rot',ic:'rotate-cw',label:'Rotation',min:-180,max:180,val:Math.round(sel.rot),txt:Math.round(sel.rot)+'\u00B0',vid:'bd-rot-val',attrs:'oninput="bdSetTextRot(this.value)"',tid:'bd-text-rot'})}
           ${stRange({id:'bd-x',ic:'move-horizontal',label:'Left/right',min:2,max:98,val:Math.round(sel.x),txt:Math.round(sel.x)+'%',vid:'bd-x-val',attrs:'oninput="bdSetTextX(this.value)"',tid:'bd-text-x'})}
           ${stRange({id:'bd-y',ic:'move-vertical',label:'Up/down',min:4,max:96,val:Math.round(sel.y),txt:Math.round(sel.y)+'%',vid:'bd-y-val',attrs:'oninput="bdSetTextY(this.value)"',tid:'bd-text-y'})}
         </div>
         <div class="mt-3 flex flex-wrap items-center gap-2">
           ${isText?`<div class="st-seg min-w-[120px] flex-1">${alignBtn('left','align-left')}${alignBtn('center','align-center')}${alignBtn('right','align-right')}</div>`:''}
           <div class="st-seg min-w-[170px] flex-1">${posBtn('top','Top')}${posBtn('center','Middle')}${posBtn('bottom','Bottom')}</div>
           ${isText?`<label class="st-sw st-sw-pick on" title="Text color" style="background:${sel.color||'#ffffff'}"><input type="color" value="${sel.color||'#ffffff'}" oninput="bdSetTextColor(this.value);this.parentNode.style.background=this.value" data-testid="bd-text-color" aria-label="Text color"></label>`:''}
         </div>
         <button data-act="bd-text-delete" data-testid="bd-text-delete" class="st-btn danger mt-3"><i data-lucide="trash-2"></i>Delete this layer</button>
       </div>`;
    }
    editor=`<div class="space-y-3" data-testid="bd-editor">
       ${stCard('palette','Filter','A look for backdrop '+(focus+1),`<div class="st-filters">${filterTiles}</div><button data-act="bd-apply-filter-all" data-testid="bd-apply-filter-all" class="st-btn mt-3"><i data-lucide="copy"></i>Apply filter to all</button>`,'','bd-filter-card')}
       ${stCard('sticker','Text & stickers','Drag them around on the preview',`<p class="st-sub" style="margin-top:0">Layers</p><div class="st-chips">${layerChips}${addTextChip}</div><p class="st-sub">Stickers <span class="st-sub-note">tap to add</span></p><div class="st-emojis">${emojiRow}</div>${layerEditor}<button data-act="bd-apply-text-all" data-testid="bd-apply-text-all" class="st-btn mt-3"><i data-lucide="copy"></i>Copy layers to every backdrop</button>`,'','bd-layers-card')}
     </div>`;
  }
  const seg=(act,cur,opts,tidp)=>`<div class="st-seg">${opts.map(([v,l,ic])=>`<button data-act="${act}" data-v="${v}" data-testid="${tidp}-${v}" aria-pressed="${cur===v}" class="${cur===v?'on':''}">${ic?`<i data-lucide="${ic}"></i>`:''}${l}</button>`).join('')}</div>`;
  const slideBody = S.on ? `<div class="mt-3 border-t border-white/10 pt-1">
       <p class="st-sub">Images</p>${seg('bd-slide-source',S.source,[['all','All','layers'],['sel','Selected','check-square']],'bd-slide-source')}${selMode?'<p class="st-note mt-2"><i data-lucide="info"></i>Tick the backdrops in the gallery to include them.</p>':''}
       <p class="st-sub">Order</p>${seg('bd-slide-order',S.order,[['seq','Sequential','list-ordered'],['rand','Random','shuffle']],'bd-slide-order')}
       <p class="st-sub">Transition</p>${seg('bd-slide-fx',S.fx,[['fade','Fade'],['rotate','Rotate'],['flip','Flip']],'bd-slide-fx')}
       <div class="mt-3">${stRange({ic:'timer',label:'Every',min:2,max:30,val:Math.max(2,Math.min(30,+S.time||8)),txt:Math.max(2,Math.min(60,+S.time||8))+'s',vid:'bd-time-val',attrs:'oninput="bdSetTime(this.value)"',tid:'bd-slide-time'})}</div>
     </div>` : '';
  const slideshow=`<section class="st-card" data-testid="bd-slideshow">${stToggle('bd-slide-toggle','bd-slide-toggle',!!S.on,'images','Slideshow','Cycle through your backdrops automatically')}${slideBody}</section>`;
  const dim=`<section class="st-card" data-testid="bd-dim-section">${stToggle('toggle-bg-overlay','bd-overlay-toggle',!!state.bgOverlay,'contrast','Dim overlay','Darken the image so text stays readable')}${state.bgOverlay?`<div class="mt-3">${stRange({ic:'moon',label:'Darkness',min:20,max:90,val:dimPct,txt:dimPct+'%',vid:'bd-dim-val',attrs:'oninput="bdSetDim(this.value)"',tid:'bd-dim'})}</div>`:''}</section>`;
  const body=`<div class="st-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain soft-scroll" data-testid="bd-body"><div class="st-body"><div class="st-left">${preview}${gallery}</div><div class="st-opts">${editor}${slideshow}${dim}</div></div></div>`;
  return `<div data-act="modal-backdrop" data-testid="backdrops-modal" class="fixed inset-0 z-[210] grid place-items-center bg-black/60 p-2 backdrop-blur-sm backdrop-in sm:p-4"><div data-act="modal-stop" class="gl-modal st-modal glass-strong panel-in relative flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border-white/15 text-white sm:max-h-[calc(100dvh-2rem)]">${head}${body}</div></div>`;
}
