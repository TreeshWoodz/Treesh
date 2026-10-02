function cvSliderHtml(id,icon,label,min,max,step,val,valTxt){ return stRange({id,ic:icon,label,min,max,step,val,txt:valTxt,vid:id+'-val',tid:id}); }
function openCoverStudio(src, label, ownSrc){
  if(!src){ return; }
  _cv={ zoom:1, rot:0, panX:0, panY:0, filter:'none', bright:1, contrast:1, sat:1, flip:false, src:src, ownSrc:!!ownSrc, layers:[], sel:null, boxId:'cv-layers', panelId:'cv-layer-panel', tid:'image-studio', noun:'image' }; _lh=_cv;
  _cvImg=null;
  const chips=CV_FILTERS.map(f=>{ const on=f.id==='none'; return `<button type="button" data-cv-filter="${f.id}" data-testid="cover-studio-filter-${f.id}" class="cv-chip st-filter press${on?' on':''}"><span class="st-filter-th"><img data-cv-thumb alt="" draggable="false" style="${f.css?`filter:${f.css}`:''}"></span>${f.name}</button>`; }).join('');
  const iconBtn=(id,ic,lbl)=>`<button type="button" id="${id}" data-testid="${id}" aria-label="${lbl}" title="${lbl}" class="st-iconbtn"><i data-lucide="${ic}"></i></button>`;
  const header=`<div class="st-head">
      <span class="st-head-ic"><i data-lucide="wand-2"></i></span>
      <div class="min-w-0 flex-1"><p class="st-eyebrow">Studio</p><h2 class="st-title" data-testid="image-studio-title">Image Studio</h2><p class="clamp-1 text-xs opacity-50">${esc(label||'Adjust your cover art')}</p></div>
      <button type="button" id="cv-cancel-x" aria-label="Close" data-testid="cover-studio-close" class="st-x press"><i data-lucide="x"></i></button>
    </div>`;
  const bodyGrid=`<div class="st-body">
      <div class="st-left">
        <div class="st-stage">
          <div class="st-frame relative mx-auto aspect-square w-full max-w-[min(100%,36vh)] md:max-w-[460px]">
            <canvas id="cv-canvas" width="720" height="720" data-testid="cover-studio-canvas" class="block h-full w-full max-w-full select-none" style="touch-action:none;cursor:grab"></canvas>
            <div class="pointer-events-none absolute inset-0 opacity-25"><div class="absolute inset-y-0 left-1/3 w-px bg-white/70"></div><div class="absolute inset-y-0 left-2/3 w-px bg-white/70"></div><div class="absolute inset-x-0 top-1/3 h-px bg-white/70"></div><div class="absolute inset-x-0 top-2/3 h-px bg-white/70"></div></div>
            <div id="cv-layers" data-testid="image-studio-layers" class="pointer-events-none absolute inset-0"></div>
            <div id="cv-loading" class="absolute inset-0 grid place-items-center bg-black/50 text-white/60"><i data-lucide="loader" class="animate-spin" style="width:24px;height:24px"></i></div>
          </div>
        </div>
        <div class="st-tools" data-testid="image-studio-tools">
          ${iconBtn('cv-rotate-left','rotate-ccw','Rotate left 90\u00b0')}
          ${iconBtn('cv-rotate-right','rotate-cw','Rotate right 90\u00b0')}
          ${iconBtn('cv-flip','flip-horizontal','Flip horizontally')}
          <button type="button" id="cv-reset" data-testid="cover-studio-reset" class="st-btn"><i data-lucide="rotate-ccw"></i>Reset</button>
        </div>
        <p class="st-hint"><i data-lucide="move"></i>Drag the image to reposition \u00b7 drag layers to move them</p>
      </div>
      <div class="st-opts">
        <div class="st-seg st-seg-lg" data-testid="image-studio-tabs">
          <button type="button" data-cv-tab="adjust" data-testid="image-studio-tab-adjust" class="on"><i data-lucide="sliders-horizontal"></i>Adjust</button>
          <button type="button" data-cv-tab="layers" data-testid="image-studio-tab-layers"><i data-lucide="type"></i>Text &amp; stickers</button>
        </div>
        <div id="cv-pane-layers" class="hidden" data-testid="image-studio-layer-panel">${stCard('sticker','Text & stickers','Layers are baked into the final image',`<div id="cv-layer-panel"></div>`)}</div>
        <div id="cv-pane-adjust" class="space-y-3">
          ${stCard('crop','Transform','Zoom in and straighten things out',`<div class="space-y-2">${cvSliderHtml('cv-zoom','zoom-in','Zoom',100,300,1,100,'1.0x')}${cvSliderHtml('cv-rot','rotate-cw','Rotate',-180,180,1,0,'0\u00b0')}</div>`)}
          ${stCard('palette','Filters','One-tap looks',`<div class="st-filters" data-testid="cover-studio-filters">${chips}</div>`)}
          ${stCard('sun','Fine-tune','Light and color',`<div class="space-y-2">${cvSliderHtml('cv-bright','sun','Brightness',50,150,1,100,'100%')}${cvSliderHtml('cv-contrast','contrast','Contrast',50,150,1,100,'100%')}${cvSliderHtml('cv-sat','droplet','Saturation',0,200,1,100,'100%')}</div>`)}
        </div>
      </div>
    </div>`;
  const footer=`<div class="st-foot">
      <button type="button" id="cv-cancel" data-testid="cover-studio-cancel" class="st-btn lg">Cancel</button>
      <button type="button" id="cv-apply" data-testid="cover-studio-apply" class="st-btn lg primary"><i data-lucide="check"></i>Apply image</button>
    </div>`;
  $("#modal2").innerHTML=`<div data-act="modal2-backdrop" data-testid="cover-studio" class="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-2 backdrop-blur-md backdrop-in sm:p-4"><div data-act="modal2-stop" class="gl-modal st-modal glass-strong panel-in relative flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border-white/15 text-white sm:max-h-[calc(100dvh-2rem)]">${header}<div class="st-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden soft-scroll">${bodyGrid}</div>${footer}</div></div>`;
  document.querySelectorAll('#modal2 [data-cv-thumb]').forEach(im=>{ im.src=src; });
  icons(); syncScrollLock();
  cvWire();
  const im=new Image();
  im.onload=()=>{ _cvImg=im; const ld=document.getElementById('cv-loading'); if(ld) ld.classList.add('hidden'); cvDraw(); cvRenderLayers(); };
  im.onerror=()=>{ toast("Couldn\u2019t load image","Try a different file"); closeModal2(); };
  try{ if(!/^blob:|^data:/.test(src)) im.crossOrigin='anonymous'; }catch(e){}
  im.src=src;
}
