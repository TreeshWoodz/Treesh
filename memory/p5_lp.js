function cvRenderLayerPanel(){ const lp=lhPanel(); if(!lp||!_lh) return; const layers=_lh.layers; const sel=cvSelLayer();
  const chips=layers.map((L,i)=>`<button type="button" data-cvl-select="${L.id}" data-testid="${_lh.tid}-layer-chip-${i}" class="st-chip${sel&&sel.id===L.id?' on':''}"><i data-lucide="${L.kind==='emoji'?'smile':'type'}"></i><span class="clamp-1">${esc((L.text||'').trim()||('Layer '+(i+1)))}</span></button>`).join('');
  const addText=layers.length<10?`<button type="button" data-cvl-add-text data-testid="${_lh.tid}-add-text" class="st-chip dashed"><i data-lucide="plus"></i>Text</button>`:'';
  const emojis=BG_EMOJIS.map((em,i)=>`<button type="button" data-cvl-emoji="${em}" data-testid="${_lh.tid}-emoji-${i}" aria-label="Add ${em} sticker" class="st-emoji">${em}</button>`).join('');
  let editor=`<p class="st-empty" data-testid="${_lh.tid}-layers-empty"><i data-lucide="sparkles"></i>Add text or tap a sticker. Layers are saved into the final ${_lh.noun}.</p>`;
  if(sel){ const isText=sel.kind==='text';
    const fontChip=(id,name,stack)=>`<button type="button" data-cvl-font="${id}" data-testid="${_lh.tid}-font-${id||'default'}" class="st-chip${(sel.font||'')===id?' on':''}" ${stack?`style="font-family:${stack}"`:''}>${name}</button>`;
    const alignBtn=(v,ic)=>`<button type="button" data-cvl-align="${v}" data-testid="${_lh.tid}-align-${v}" aria-label="Align ${v}" class="${(sel.align||'center')===v?'on':''}"><i data-lucide="${ic}"></i></button>`;
    const posBtn=(v,l)=>`<button type="button" data-cvl-pos="${v}" data-testid="${_lh.tid}-pos-${v}">${l}</button>`;
    editor=`<div class="st-layer-ed" data-testid="${_lh.tid}-layer-controls">
      ${isText?`<input id="cv-l-text" data-testid="${_lh.tid}-text-input" value="${esc(sel.text||'')}" maxlength="80" placeholder="Type your words\u2026" class="st-input">
      <p class="st-sub">Font</p><div class="st-chips st-chips-scroll">${fontChip('','Default','')}${(typeof FONTS!=='undefined'?FONTS:[]).map(f=>fontChip(f.id,f.name,f.stack)).join('')}</div>`:`<p class="st-note"><i data-lucide="info"></i>Emoji sticker: drag it on the preview, pinch or scroll to resize, and use the top handle to spin it.</p>`}
      <div class="mt-3 space-y-2">${stRange({id:'cv-l-size',ic:'scaling',label:'Size',min:3,max:40,val:Math.round(sel.size),txt:Math.round(sel.size),vid:'cv-l-size-val',tid:_lh.tid+'-size'})}${stRange({id:'cv-l-rot',ic:'rotate-cw',label:'Rotation',min:-180,max:180,val:Math.round(sel.rot),txt:Math.round(sel.rot)+'\u00B0',vid:'cv-l-rot-val',tid:_lh.tid+'-rotation'})}</div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        ${isText?`<div class="st-seg min-w-[120px] flex-1">${alignBtn('left','align-left')}${alignBtn('center','align-center')}${alignBtn('right','align-right')}</div>`:''}
        <div class="st-seg min-w-[170px] flex-1">${posBtn('top','Top')}${posBtn('center','Middle')}${posBtn('bottom','Bottom')}</div>
        ${isText?`<label class="st-sw st-sw-pick on" title="Text color" style="background:${sel.color||'#ffffff'}"><input id="cv-l-color" type="color" value="${sel.color||'#ffffff'}" data-testid="${_lh.tid}-color" aria-label="Text color"></label>`:''}
      </div>
      <button type="button" data-cvl-del data-testid="${_lh.tid}-delete-layer" class="st-btn danger mt-3"><i data-lucide="trash-2"></i>Delete this layer</button>
    </div>`; }
  lp.innerHTML=`<div>
    <p class="st-sub" style="margin-top:0">Layers</p><div class="st-chips">${chips}${addText}</div>
    <p class="st-sub">Stickers <span class="st-sub-note">tap to add</span></p><div class="st-emojis">${emojis}</div>
    <div class="mt-3">${editor}</div></div>`;
  icons(); }
