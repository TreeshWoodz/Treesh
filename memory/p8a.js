/* ---------- P8: Image Studio, a full photo editor (pixel pipeline works on iPhone Safari) ---------- */
const PS_ADJ=[['exposure','Exposure','sun',-100,100],['brightness','Brightness','sun-medium',-100,100],['contrast','Contrast','contrast',-100,100],['highlights','Highlights','sunrise',-100,100],['shadows','Shadows','moon',-100,100],['saturation','Saturation','droplet',-100,100],['vibrance','Vibrance','sparkles',-100,100],['warmth','Warmth','thermometer-sun',-100,100],['tint','Tint','palette',-100,100],['fade','Fade','cloud-fog',0,100],['sharpen','Sharpen','triangle',0,100],['vignette','Vignette','circle-dot',0,100],['grain','Grain','scan-line',0,100]];
const PS_FILTERS=[
  {id:'none',name:'Original'},
  {id:'vivid',name:'Vivid',a:{saturation:30,contrast:14,vibrance:25}},
  {id:'golden',name:'Golden',a:{warmth:40,saturation:12,exposure:6,fade:6}},
  {id:'arctic',name:'Arctic',a:{warmth:-40,tint:-6,contrast:8,exposure:4}},
  {id:'noir',name:'Noir',mono:1,a:{contrast:32,shadows:-10}},
  {id:'silver',name:'Silver',mono:1,a:{contrast:-8,fade:22,exposure:6}},
  {id:'vintage',name:'Vintage',sepia:.75,a:{fade:16,contrast:-6,vignette:30}},
  {id:'film',name:'Film',a:{fade:30,saturation:-18,contrast:-8,warmth:10,grain:28}},
  {id:'dream',name:'Dream',a:{exposure:12,saturation:14,tint:12,fade:14,contrast:-10}},
  {id:'drama',name:'Drama',a:{contrast:42,shadows:-18,highlights:-22,saturation:-12,vignette:45,sharpen:20}},
  {id:'neon',name:'Neon',a:{saturation:55,tint:22,contrast:22,vibrance:20}},
  {id:'sunset',name:'Sunset',a:{warmth:50,tint:16,saturation:18,fade:8}},
  {id:'matte',name:'Matte',a:{fade:34,contrast:-16,shadows:18,saturation:-6}},
  {id:'lofi',name:'Lo-fi',a:{contrast:28,saturation:22,vignette:50,grain:32}},
  {id:'chrome',name:'Chrome',a:{contrast:22,saturation:16,highlights:-12,sharpen:24,vibrance:10}}
];
const PS_TOOLS=[['crop','Crop','crop'],['adjust','Adjust','sliders-horizontal'],['filters','Filters','aperture'],['text','Text','type'],['stickers','Stickers','sticker'],['draw','Draw','brush']];
const PS_INK=['#ffffff','#111111','#ff2d78','#f59e0b','#fde047','#34d399','#22d3ee','#3b82f6','#9328ff'];
const PS_BRUSH=[['pen','Pen','pen-line'],['marker','Marker','highlighter'],['neon','Neon','zap'],['eraser','Eraser','eraser']];
let _psRAF=0, _psLive=null, _psKey='', _psBase=null, _psInkC=null, _psWheelT=0, _psRO=null;
function psBlank(){ const a={}; PS_ADJ.forEach(x=>a[x[0]]=0); return a; }
function openCoverStudio(src,label,ownSrc,opts){ opts=opts||null; if(_cv){ try{ cvTeardown(); }catch(e){} }
  _cv={src,ownSrc:!!ownSrc,label:label||'',opts,A:(opts&&opts.aspect)||1,zoom:1,rot:0,q:0,flipH:false,flipV:false,panX:0,panY:0,adj:psBlank(),filter:'none',fstr:100,strokes:[],layers:[],sel:null,boxId:'cv-layer-box',panelId:'cv-layer-panel',tid:'cover-studio',noun:'image',tool:'adjust',adjKey:'exposure',brush:'pen',ink:'#ffffff',inkSize:8,hist:[],fut:[],compare:false,taint:false};
  _lh=_cv; _cvImg=null; _psKey=''; _psLive=null;
  $("#modal2").innerHTML=psShellHtml(); icons(); syncScrollLock(); psWire(); psRenderTool();
  const im=new Image();
  im.onload=()=>{ if(!_cv) return; _cvImg=im; psFit(); psSnap(true); const ld=document.getElementById('cv-loading'); if(ld) ld.classList.add('hidden'); psDraw(); cvRenderLayers(); if(_cv.tool==='filters') psThumbs(); };
  im.onerror=()=>{ toast("Couldn\u2019t load image","Try a different file"); closeModal2(); };
  try{ if(!/^blob:|^data:/.test(src)) im.crossOrigin='anonymous'; }catch(e){}
  im.src=src; }
function psShellHtml(){ const o=_cv.opts||{};
  return `<div data-act="modal2-backdrop" data-testid="cover-studio" class="ps-root dark-surface" role="dialog" aria-label="Image Studio" data-tool="${_cv.tool}">
  <header class="ps-top"><button type="button" id="cv-cancel" data-testid="cover-studio-cancel" class="ps-tbtn">Cancel</button>
   <div class="ps-title"><p class="ps-eyebrow"><i data-lucide="wand-sparkles"></i>Image Studio</p><h2 data-testid="image-studio-title" class="clamp-1">${esc(_cv.label||'Edit image')}</h2></div>
   <div class="ps-acts"><button type="button" data-ps="undo" data-testid="ps-undo" class="ps-ic" aria-label="Undo" disabled><i data-lucide="undo-2"></i></button><button type="button" data-ps="redo" data-testid="ps-redo" class="ps-ic" aria-label="Redo" disabled><i data-lucide="redo-2"></i></button><button type="button" data-ps-compare data-testid="ps-compare" class="ps-ic" aria-label="Hold to compare with the original" title="Hold to see the original"><i data-lucide="eye"></i></button><button type="button" id="cv-apply" data-testid="cover-studio-apply" class="ps-done"><i data-lucide="check"></i><span>${esc(o.applyLabel||'Done')}</span></button></div></header>
  <div class="ps-main"><div class="ps-stage" id="ps-stage"><div class="ps-frame${o.round?' is-round':''}" id="ps-frame" data-testid="ps-frame">
    <canvas id="cv-canvas" data-testid="cover-studio-canvas" class="ps-canvas"></canvas><div id="cv-layer-box" class="ps-layers" data-testid="cover-studio-layer-box"></div><div class="ps-grid" aria-hidden="true"></div>${o.round?'<div class="cv-round-mask pointer-events-none absolute inset-0" data-testid="ps-round-mask"></div>':''}
    <div id="cv-loading" class="ps-loading"><span class="ps-spin"></span></div><span class="ps-cmp-tag">Original</span></div></div>
   <aside class="ps-side"><div class="ps-panel soft-scroll" id="ps-panel" data-testid="ps-panel"></div><nav class="ps-tools no-scrollbar" data-testid="ps-tools">${PS_TOOLS.map(([id,l,ic])=>`<button type="button" data-ps-tool="${id}" data-testid="ps-tool-${id}" class="ps-tool${_cv.tool===id?' on':''}"><i data-lucide="${ic}"></i><span>${l}</span></button>`).join('')}</nav></aside></div></div>`; }
function psFit(){ const st=document.getElementById('ps-stage'), fr=document.getElementById('ps-frame'), cv=document.getElementById('cv-canvas'); if(!st||!fr||!cv||!_cv) return; const A=_cv.A; const sw=st.clientWidth-24, sh=st.clientHeight-24; if(sw<40||sh<40) return; let w=Math.min(sw,sh*A), h=w/A; fr.style.width=Math.round(w)+'px'; fr.style.height=Math.round(h)+'px';
  const dpr=Math.min(2,window.devicePixelRatio||1); let W=Math.round(Math.min(1100,w*dpr)), H=Math.round(W/A); const cap=900000; if(W*H>cap){ const k=Math.sqrt(cap/(W*H)); W=Math.round(W*k); H=Math.round(H*k); } if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; _psKey=''; }
  psDraw(); cvRenderLayers(); }
function psQueue(){ if(_psRAF) return; _psRAF=requestAnimationFrame(()=>{ _psRAF=0; psDraw(); }); }
function cvDraw(){ psQueue(); }
function psParams(){ const f=PS_FILTERS.find(x=>x.id===_cv.filter)||PS_FILTERS[0]; const k=_cv.fstr/100; const p=Object.assign({},_cv.adj); if(f.a) Object.keys(f.a).forEach(key=>{ p[key]=(p[key]||0)+f.a[key]*k; }); p.mono=(f.mono||0)*k; p.sepia=(f.sepia||0)*k; return p; }
function psNeutral(p){ return PS_ADJ.every(([k])=>!p[k])&&!p.mono&&!p.sepia; }
function psCssFilter(p){ return `brightness(${(Math.pow(2,p.exposure/100*1.4)*(1+p.brightness/100*.3)).toFixed(3)}) contrast(${(1+p.contrast/100*.8).toFixed(3)}) saturate(${((1+p.saturation/100)*(1+p.vibrance/200)).toFixed(3)}) sepia(${p.sepia||0}) grayscale(${p.mono||0})`; }
function psGeoDraw(ctx,W,H,exp){ const img=_cvImg; const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,W,H); ctx.fillStyle='#0a0a0c'; ctx.fillRect(0,0,W,H);
  const th=(_cv.q*90+_cv.rot)*Math.PI/180, c=Math.abs(Math.cos(th)), s=Math.abs(Math.sin(th)); const k=Math.max((W*c+H*s)/iw,(W*s+H*c)/ih)*_cv.zoom;
  const co=Math.cos(th), si=Math.sin(th); let tx=_cv.panX*W, ty=_cv.panY*H; let lx=tx*co+ty*si, ly=-tx*si+ty*co; const mx=Math.max(0,(k*iw-(W*c+H*s))/2), my=Math.max(0,(k*ih-(W*s+H*c))/2);
  lx=Math.max(-mx,Math.min(mx,lx)); ly=Math.max(-my,Math.min(my,ly)); tx=lx*co-ly*si; ty=lx*si+ly*co; if(!exp){ _cv.panX=tx/W; _cv.panY=ty/H; }
  if(_cv.taint){ try{ ctx.filter=psCssFilter(psParams()); }catch(e){} }
  ctx.translate(W/2+tx,H/2+ty); ctx.rotate(th); ctx.scale(k*(_cv.flipH?-1:1),k*(_cv.flipV?-1:1)); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(img,-iw/2,-ih/2,iw,ih); ctx.restore(); }
function psSharpen(d,W,H,amt){ const src=new Uint8ClampedArray(d); const k=amt*1.2, row=W*4; for(let y=1;y<H-1;y++){ for(let x=1;x<W-1;x++){ const i=(y*W+x)*4; for(let c=0;c<3;c++){ const j=i+c; d[j]=src[j]*(1+4*k)-k*(src[j-4]+src[j+4]+src[j-row]+src[j+row]); } } } }
function psPixels(ctx,W,H,p){ if(psNeutral(p)||_cv.taint) return; let id; try{ id=ctx.getImageData(0,0,W,H); }catch(e){ _cv.taint=true; return; } const d=id.data;
  if(p.sharpen>0) psSharpen(d,W,H,p.sharpen/100);
  const ex=Math.pow(2,p.exposure/100*1.4), br=p.brightness/100*.22, ct=p.contrast>=0?1+p.contrast/100*.9:1+p.contrast/100*.6, hi=p.highlights/100*.4, sh=p.shadows/100*.4, sat=1+p.saturation/100, vib=p.vibrance/100*1.2, wm=p.warmth/100*.14, tn=p.tint/100*.1, fd=p.fade/100, vg=p.vignette/100, gr=p.grain/100*.16, mono=p.mono||0, sep=p.sepia||0;
  const cx=W/2, cy=H/2, inv=1/Math.max(1,cx*cx+cy*cy); let seed=12345;
  for(let y=0,i=0;y<H;y++){ const dy=(y-cy)*(y-cy); for(let x=0;x<W;x++,i+=4){ let r=d[i]/255, g=d[i+1]/255, b=d[i+2]/255;
    if(ex!==1){ r*=ex; g*=ex; b*=ex; } if(br){ r+=br; g+=br; b+=br; } if(wm){ r+=wm; b-=wm; } if(tn){ g-=tn; r+=tn*.5; b+=tn*.5; }
    let L=.2126*r+.7152*g+.0722*b;
    if(hi||sh){ const hm=L>.5?Math.min(1,(L-.5)*2):0, sm=L<.5?Math.min(1,(.5-L)*2):0; const dl=hi*hm*hm+sh*sm*sm; r+=dl; g+=dl; b+=dl; L+=dl; }
    if(ct!==1){ r=(r-.5)*ct+.5; g=(g-.5)*ct+.5; b=(b-.5)*ct+.5; L=(L-.5)*ct+.5; }
    if(sat!==1){ r=L+(r-L)*sat; g=L+(g-L)*sat; b=L+(b-L)*sat; }
    if(vib){ const mx=Math.max(r,g,b), mn=Math.min(r,g,b); const a=1+vib*(1-Math.min(1,(mx-mn)*1.5)); r=L+(r-L)*a; g=L+(g-L)*a; b=L+(b-L)*a; }
    if(sep){ const sr=r*.393+g*.769+b*.189, sg=r*.349+g*.686+b*.168, sb=r*.272+g*.534+b*.131; r+=(sr-r)*sep; g+=(sg-g)*sep; b+=(sb-b)*sep; }
    if(mono){ const l=.2126*r+.7152*g+.0722*b; r+=(l-r)*mono; g+=(l-g)*mono; b+=(l-b)*mono; }
    if(fd){ r=r*(1-fd*.28)+fd*.11; g=g*(1-fd*.28)+fd*.11; b=b*(1-fd*.28)+fd*.12; }
    if(vg){ const dd=((x-cx)*(x-cx)+dy)*inv; const v=1-vg*.85*Math.max(0,Math.min(1,(dd-.2)/.8)); r*=v; g*=v; b*=v; }
    if(gr){ seed=(seed*1664525+1013904223)>>>0; const n=((seed>>>8)/16777216-.5)*gr; r+=n; g+=n; b+=n; }
    d[i]=r*255; d[i+1]=g*255; d[i+2]=b*255; } }
  ctx.putImageData(id,0,0); }
function psStroke(c,s,W,H){ const P=s.pts; if(!P.length) return; c.save(); c.lineCap='round'; c.lineJoin='round'; const w=s.s/400*W;
  if(s.b==='eraser'){ c.globalCompositeOperation='destination-out'; c.strokeStyle='#000'; c.lineWidth=w*2.2; }
  else if(s.b==='marker'){ c.globalAlpha=.45; c.strokeStyle=s.c; c.lineWidth=w*2.6; }
  else if(s.b==='neon'){ c.shadowColor=s.c; c.shadowBlur=w*3; c.strokeStyle=s.c; c.lineWidth=w*1.4; }
  else { c.strokeStyle=s.c; c.lineWidth=w; }
  c.beginPath(); c.moveTo(P[0][0]*W,P[0][1]*H); if(P.length===1) c.lineTo(P[0][0]*W+.1,P[0][1]*H); for(let i=1;i<P.length-1;i++){ const mx=(P[i][0]+P[i+1][0])/2*W, my=(P[i][1]+P[i+1][1])/2*H; c.quadraticCurveTo(P[i][0]*W,P[i][1]*H,mx,my); } if(P.length>1){ const L=P[P.length-1]; c.lineTo(L[0]*W,L[1]*H); } c.stroke();
  if(s.b==='neon'){ c.shadowBlur=0; c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=w*.45; c.stroke(); }
  c.restore(); }
function psInk(ctx,W,H,fresh){ const list=_cv.strokes.concat(_psLive?[_psLive]:[]); if(!list.length) return; let oc=fresh?null:_psInkC; if(!oc||oc.width!==W||oc.height!==H){ oc=document.createElement('canvas'); oc.width=W; oc.height=H; if(!fresh) _psInkC=oc; } const c=oc.getContext('2d'); c.clearRect(0,0,W,H); list.forEach(s=>psStroke(c,s,W,H)); ctx.drawImage(oc,0,0); }
function psDraw(){ const cv=document.getElementById('cv-canvas'); if(!cv||!_cvImg||!_cv) return; const W=cv.width, H=cv.height, ctx=cv.getContext('2d');
  if(_cv.compare){ psGeoDraw(ctx,W,H); return; }
  const key=JSON.stringify([W,H,_cv.zoom,_cv.rot,_cv.q,_cv.flipH,_cv.flipV,_cv.panX.toFixed(4),_cv.panY.toFixed(4),_cv.adj,_cv.filter,_cv.fstr]);
  if(key!==_psKey||!_psBase){ psGeoDraw(ctx,W,H); psPixels(ctx,W,H,psParams()); if(!_psBase) _psBase=document.createElement('canvas'); _psBase.width=W; _psBase.height=H; _psBase.getContext('2d').drawImage(cv,0,0); _psKey=JSON.stringify([W,H,_cv.zoom,_cv.rot,_cv.q,_cv.flipH,_cv.flipV,_cv.panX.toFixed(4),_cv.panY.toFixed(4),_cv.adj,_cv.filter,_cv.fstr]); }
  else { ctx.clearRect(0,0,W,H); ctx.drawImage(_psBase,0,0); }
  psInk(ctx,W,H); cv.style.filter=_cv.taint?psCssFilter(psParams()):''; }
/* history */
function psState(){ return JSON.stringify({zoom:_cv.zoom,rot:_cv.rot,q:_cv.q,flipH:_cv.flipH,flipV:_cv.flipV,panX:+_cv.panX.toFixed(4),panY:+_cv.panY.toFixed(4),adj:_cv.adj,filter:_cv.filter,fstr:_cv.fstr,strokes:_cv.strokes,layers:_cv.layers}); }
function psSnap(init){ if(!_cv) return; const s=psState(); if(init){ _cv.hist=[s]; _cv.fut=[]; } else if(_cv.hist[_cv.hist.length-1]!==s){ _cv.hist.push(s); if(_cv.hist.length>60) _cv.hist.shift(); _cv.fut=[]; } psHistBtns(); }
function psHistBtns(){ const u=document.querySelector('#modal2 [data-ps="undo"]'), r=document.querySelector('#modal2 [data-ps="redo"]'); if(u) u.disabled=!_cv||_cv.hist.length<2; if(r) r.disabled=!_cv||!_cv.fut.length; }
function psRestore(s){ const o=JSON.parse(s); Object.assign(_cv,o); _lh=_cv; _cv.sel=null; cvRenderLayers(); psRenderTool(); psQueue(); }
function psUndo(){ if(!_cv||_cv.hist.length<2) return; _cv.fut.push(_cv.hist.pop()); psRestore(_cv.hist[_cv.hist.length-1]); psHistBtns(); }
function psRedo(){ if(!_cv||!_cv.fut.length) return; const s=_cv.fut.pop(); _cv.hist.push(s); psRestore(s); psHistBtns(); }
/* values + dials */
function psGet(k){ if(k==='zoom') return Math.round(_cv.zoom*100); if(k==='rot') return Math.round(_cv.rot); if(k==='fstr') return _cv.fstr; if(k==='ink') return _cv.inkSize; return _cv.adj[k]||0; }
function psSet(k,v){ if(k==='zoom') _cv.zoom=v/100; else if(k==='rot') _cv.rot=v; else if(k==='fstr') _cv.fstr=v; else if(k==='ink') _cv.inkSize=v; else _cv.adj[k]=v; }
function psFmt(k,v){ if(k==='zoom') return (v/100).toFixed(2)+'\u00d7'; if(k==='rot') return v+'\u00b0'; if(k==='fstr'||k==='ink') return String(v); return (v>0?'+':'')+v; }
function psDialHtml(k,min,max,label){ const ppu=k==='rot'?8:k==='zoom'?2:k==='ink'?10:6; const v=psGet(k); const stp=[1,2,5,10].find(x=>x*ppu>=6)||10;
  return `<div class="ps-dial-wrap"><div class="ps-dial-head"><span>${label}</span><b data-ps-val="${k}" data-testid="ps-val-${k}">${psFmt(k,v)}</b></div><div class="ps-dial" data-dial="${k}" data-min="${min}" data-max="${max}" data-ppu="${ppu}" data-testid="ps-dial-${k}"><div class="ps-dial-in"><span class="ps-dial-pad"></span><div class="ps-dial-track" style="width:${(max-min)*ppu+2}px;--mi:${stp*ppu}px;--ma:${stp*ppu*5}px"></div><span class="ps-dial-pad"></span></div></div><span class="ps-dial-mark"></span></div>`; }
function psValUi(k){ const v=psGet(k); document.querySelectorAll('#ps-panel [data-ps-val="'+k+'"]').forEach(el=>el.textContent=psFmt(k,v)); const ch=document.querySelector('#ps-panel [data-ps-adj="'+k+'"]'); if(ch){ const m=(PS_ADJ.find(x=>x[0]===k)||[])[4]||100; ch.classList.toggle('is-set',!!v); ch.querySelector('.ps-adj-ring').style.setProperty('--p',(Math.abs(v)/m*100)+'%'); } }
function psDialWire(){ document.querySelectorAll('#ps-panel .ps-dial').forEach(el=>{ const k=el.dataset.dial, min=+el.dataset.min, max=+el.dataset.max, ppu=+el.dataset.ppu; const half=el.clientWidth/2; el.querySelectorAll('.ps-dial-pad').forEach(p=>p.style.width=half+'px');
    const set=()=>{ el._lock=true; el.scrollLeft=(psGet(k)-min)*ppu; setTimeout(()=>{ el._lock=false; },60); }; el._set=set; set();
    el.addEventListener('scroll',()=>{ if(el._lock) return; let v=Math.round(min+el.scrollLeft/ppu); const home=k==='zoom'?100:0; if(k!=='fstr'&&k!=='ink'&&Math.abs(v-home)<=1) v=home; v=Math.max(min,Math.min(max,v)); if(v!==psGet(k)){ psSet(k,v); psValUi(k); psQueue(); } clearTimeout(el._t); el._t=setTimeout(()=>psSnap(),320); },{passive:true});
    el.addEventListener('dblclick',()=>{ psSet(k,k==='zoom'?100:k==='fstr'?100:0); set(); psValUi(k); psQueue(); psSnap(); }); }); }
function psSyncDials(){ document.querySelectorAll('#ps-panel .ps-dial').forEach(el=>{ if(el._set) el._set(); psValUi(el.dataset.dial); }); }
/* tool panels */
function psRenderTool(){ const p=document.getElementById('ps-panel'); if(!p||!_cv) return; const t=_cv.tool; const root=document.querySelector('#modal2 .ps-root'); if(root) root.dataset.tool=t;
  document.querySelectorAll('#modal2 [data-ps-tool]').forEach(b=>b.classList.toggle('on',b.dataset.psTool===t));
  let h='';
  if(t==='crop') h=`<div class="ps-row">${[['rotl','rotate-ccw','Rotate'],['flipH','flip-horizontal-2','Flip'],['flipV','flip-vertical-2','Flip vertical'],['crop-reset','rotate-ccw-square','Reset']].map(([a,ic,l])=>`<button type="button" data-ps="${a}" data-testid="ps-${a}" class="ps-chip${(a==='flipH'&&_cv.flipH)||(a==='flipV'&&_cv.flipV)?' on':''}"><i data-lucide="${ic}"></i>${l}</button>`).join('')}</div>${psDialHtml('rot',-45,45,'Straighten')}${psDialHtml('zoom',100,500,'Zoom')}<p class="ps-hint"><i data-lucide="move"></i>Drag the photo to reposition. Pinch or scroll to zoom.</p>`;
  else if(t==='adjust'){ const k=_cv.adjKey, A=PS_ADJ.find(x=>x[0]===k)||PS_ADJ[0];
    h=`<div class="ps-adj-row no-scrollbar" id="ps-adj-row">${PS_ADJ.map(([key,l,ic,mn,mx])=>{ const v=_cv.adj[key]||0; return `<button type="button" data-ps-adj="${key}" data-testid="ps-adj-${key}" class="ps-adj${key===k?' on':''}${v?' is-set':''}"><span class="ps-adj-ring" style="--p:${Math.abs(v)/mx*100}%"><i data-lucide="${ic}"></i></span><span>${l}</span></button>`; }).join('')}</div>${psDialHtml(k,A[3],A[4],A[1])}<div class="ps-row mt-2"><button type="button" data-ps="auto" data-testid="ps-auto" class="ps-chip"><i data-lucide="wand-2"></i>Auto enhance</button><button type="button" data-ps="adj-reset" data-testid="ps-adj-reset" class="ps-chip"><i data-lucide="rotate-ccw"></i>Reset adjustments</button></div>`; }
  else if(t==='filters') h=`<div class="ps-fl-row no-scrollbar" id="ps-fl-row">${PS_FILTERS.map(f=>`<button type="button" data-ps-filter="${f.id}" data-testid="ps-filter-${f.id}" class="ps-fl${_cv.filter===f.id?' on':''}"><span class="ps-fl-img"><img data-ps-thumb="${f.id}" alt=""></span><span>${f.name}</span></button>`).join('')}</div>${_cv.filter!=='none'?psDialHtml('fstr',0,100,'Strength'):'<p class="ps-hint"><i data-lucide="aperture"></i>Pick a look, then fine-tune its strength.</p>'}`;
  else if(t==='text') h=`<div id="cv-layer-panel" class="ps-layer-panel" data-testid="ps-text-panel"></div>`;
  else if(t==='stickers') h=`<p class="ps-sub">Treesh pack</p><div class="ps-pack">${MK_PACK.map(x=>`<button type="button" data-ps-pack="${x.id}" data-testid="ps-pack-${x.id}" aria-label="Add ${esc(x.name)}"><img src="${mkPackSrc(x.id)}" alt=""></button>`).join('')}</div><p class="ps-sub">Emoji</p><div class="ps-emoji">${BG_EMOJIS.map((e,i)=>`<button type="button" data-ps-emoji="${e}" data-testid="ps-emoji-${i}">${e}</button>`).join('')}</div><p class="ps-hint"><i data-lucide="hand"></i>Drag stickers on the photo. Pinch to resize and spin.</p>`;
  else if(t==='draw') h=`<div class="ps-row">${PS_BRUSH.map(([id,l,ic])=>`<button type="button" data-ps-brush="${id}" data-testid="ps-brush-${id}" class="ps-chip${_cv.brush===id?' on':''}"><i data-lucide="${ic}"></i>${l}</button>`).join('')}</div><div class="ps-inks">${PS_INK.map(c=>`<button type="button" data-ps-ink="${c}" data-testid="ps-ink-${c.slice(1)}" class="ps-ink${_cv.ink===c?' on':''}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}<label class="ps-ink is-pick" style="background:conic-gradient(#ff2d78,#f59e0b,#34d399,#22d3ee,#9328ff,#ff2d78)"><input type="color" id="ps-ink-pick" value="${_cv.ink}" aria-label="Custom colour"></label></div>${psDialHtml('ink',2,40,'Brush size')}<div class="ps-row mt-2"><button type="button" data-ps="ink-clear" data-testid="ps-ink-clear" class="ps-chip"><i data-lucide="trash-2"></i>Clear drawing</button></div><p class="ps-hint"><i data-lucide="brush"></i>Draw right on the photo with your finger.</p>`;
  p.innerHTML=`<div class="ps-pane" data-testid="ps-pane-${t}">${h}</div>`; icons();
  if(t==='text'){ const lp=document.getElementById('cv-layer-panel'); if(lp){ lp.addEventListener('click',e=>{ cvLayerPanelClick(e); setTimeout(()=>psSnap(),0); }); lp.addEventListener('input',cvLayerPanelInput); lp.addEventListener('change',()=>psSnap()); } _lh=_cv; cvRenderLayerPanel(); }
  requestAnimationFrame(()=>{ psDialWire(); const row=document.getElementById('ps-adj-row'); const on=row&&row.querySelector('.on'); if(on) row.scrollLeft=on.offsetLeft-row.clientWidth/2+on.clientWidth/2; if(t==='filters') psThumbs(); }); }
function psThumbs(){ if(!_cvImg||!_cv) return; const S=128, W=S, H=Math.round(S/_cv.A); const base=document.createElement('canvas'); base.width=W; base.height=H; const bx=base.getContext('2d'); const px=_cv.panX, py=_cv.panY; psGeoDraw(bx,W,H,true); _cv.panX=px; _cv.panY=py;
  const saved={f:_cv.filter,s:_cv.fstr}; let i=0; const step=()=>{ if(!_cv) return; const f=PS_FILTERS[i++]; if(!f){ _cv.filter=saved.f; _cv.fstr=saved.s; return; } const im=document.querySelector('#ps-panel [data-ps-thumb="'+f.id+'"]'); if(im){ const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); x.drawImage(base,0,0); _cv.filter=f.id; _cv.fstr=100; psPixels(x,W,H,psParams()); try{ im.src=c.toDataURL('image/jpeg',.72); }catch(e){} } _cv.filter=saved.f; _cv.fstr=saved.s; setTimeout(step,0); }; step(); }
function psTool(t){ if(!_cv) return; _cv.tool=t; psRenderTool(); setTimeout(psFit,30); }
function psAct(a){ if(!_cv) return;
  if(a==='undo') return psUndo(); if(a==='redo') return psRedo();
  if(a==='rotl'){ _cv.q=(_cv.q+3)%4; } else if(a==='flipH'){ _cv.flipH=!_cv.flipH; } else if(a==='flipV'){ _cv.flipV=!_cv.flipV; }
  else if(a==='crop-reset'){ Object.assign(_cv,{zoom:1,rot:0,q:0,flipH:false,flipV:false,panX:0,panY:0}); }
  else if(a==='auto'){ Object.assign(_cv.adj,{exposure:6,contrast:12,highlights:-10,shadows:14,vibrance:20,saturation:4,sharpen:12}); toast('Auto enhance applied','Tweak any slider to fine-tune'); }
  else if(a==='adj-reset'){ _cv.adj=psBlank(); }
  else if(a==='ink-clear'){ _cv.strokes=[]; }
  if(['rotl','flipH','flipV','crop-reset','auto','adj-reset'].includes(a)) psRenderTool(); else psSyncDials();
  psQueue(); psSnap(); }
function psAddLayer(L){ cvAddLayer(Object.assign({id:bgUID(),x:50,y:50,rot:0,color:'#ffffff',align:'center',font:''},L)); psSnap(); toast('Sticker added','Drag it on the photo'); }
function psWire(){ const root=document.querySelector('#modal2 .ps-root'); if(!root) return;
  root.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||!root.contains(b)) return;
    if(b.id==='cv-cancel') return closeModal2(); if(b.id==='cv-apply') return cvApply();
    if(b.dataset.psTool) return psTool(b.dataset.psTool); if(b.dataset.ps) return psAct(b.dataset.ps);
    if(b.dataset.psAdj){ _cv.adjKey=b.dataset.psAdj; const row=document.getElementById('ps-adj-row'); const sl=row?row.scrollLeft:0; psRenderTool(); requestAnimationFrame(()=>{ const r=document.getElementById('ps-adj-row'); if(r) r.scrollLeft=sl; }); return; }
    if(b.dataset.psFilter){ _cv.filter=b.dataset.psFilter; if(_cv.filter!=='none'&&_cv.fstr<5) _cv.fstr=100; const row=document.getElementById('ps-fl-row'); const sl=row?row.scrollLeft:0; psRenderTool(); requestAnimationFrame(()=>{ const r=document.getElementById('ps-fl-row'); if(r) r.scrollLeft=sl; }); psQueue(); psSnap(); return; }
    if(b.dataset.psBrush){ _cv.brush=b.dataset.psBrush; psRenderTool(); return; }
    if(b.dataset.psInk){ _cv.ink=b.dataset.psInk; if(_cv.brush==='eraser') _cv.brush='pen'; psRenderTool(); return; }
    if(b.dataset.psPack) return psAddLayer({kind:'img',src:mkPackSrc(b.dataset.psPack),text:'',size:16});
    if(b.dataset.psEmoji) return psAddLayer({kind:'emoji',text:b.dataset.psEmoji,size:18}); });
  root.addEventListener('input',e=>{ if(e.target.id==='ps-ink-pick'){ _cv.ink=e.target.value; if(_cv.brush==='eraser') _cv.brush='pen'; } });
  root.addEventListener('change',e=>{ if(e.target.id==='ps-ink-pick') psRenderTool(); });
  const cmp=root.querySelector('[data-ps-compare]'); const on=v=>{ if(!_cv) return; _cv.compare=v; root.classList.toggle('is-compare',v); psDraw(); };
  cmp.addEventListener('pointerdown',e=>{ e.preventDefault(); on(true); }); ['pointerup','pointerleave','pointercancel'].forEach(ev=>cmp.addEventListener(ev,()=>{ if(_cv&&_cv.compare) on(false); }));
  const box=document.getElementById('cv-layer-box'); if(box) box.addEventListener('pointerup',()=>setTimeout(()=>psSnap(),0));
  const cv=document.getElementById('cv-canvas'); const pts=new Map(); let st=null;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]; };
  cv.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_){} pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(_cv.tool==='draw'){ if(pts.size===1){ _psLive={b:_cv.brush,c:_cv.ink,s:_cv.inkSize,pts:[pos(e)]}; psQueue(); } else _psLive=null; return; }
    if(pts.size===2){ const p=[...pts.values()]; st={m:'pinch',d0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1,z0:_cv.zoom}; } else st={m:'pan',sx:e.clientX,sy:e.clientY,px:_cv.panX,py:_cv.panY}; document.getElementById('ps-frame').classList.add('is-moving'); });
  cv.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(_cv.tool==='draw'){ if(_psLive){ _psLive.pts.push(pos(e)); psQueue(); } return; }
    if(!st) return; const r=cv.getBoundingClientRect();
    if(st.m==='pinch'&&pts.size>=2){ const p=[...pts.values()]; const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1; _cv.zoom=Math.max(1,Math.min(5,st.z0*d/st.d0)); psSyncDials(); }
    else if(st.m==='pan'){ _cv.panX=st.px+(e.clientX-st.sx)/r.width; _cv.panY=st.py+(e.clientY-st.sy)/r.height; }
    psQueue(); });
  const end=e=>{ pts.delete(e.pointerId);
    if(_cv&&_cv.tool==='draw'){ if(_psLive&&pts.size===0){ _cv.strokes.push(_psLive); _psLive=null; psQueue(); psSnap(); } return; }
    if(pts.size===0&&st){ st=null; const f=document.getElementById('ps-frame'); if(f) f.classList.remove('is-moving'); psSnap(); }
    else if(pts.size===1&&st&&st.m==='pinch'){ const p=[...pts.values()][0]; st={m:'pan',sx:p.x,sy:p.y,px:_cv.panX,py:_cv.panY}; } };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
  cv.addEventListener('wheel',e=>{ if(!_cv||_cv.tool==='draw') return; e.preventDefault(); _cv.zoom=Math.max(1,Math.min(5,_cv.zoom*(e.deltaY<0?1.06:.94))); psSyncDials(); psQueue(); clearTimeout(_psWheelT); _psWheelT=setTimeout(()=>psSnap(),300); },{passive:false});
  try{ if(_psRO) _psRO.disconnect(); _psRO=new ResizeObserver(()=>psFit()); _psRO.observe(document.getElementById('ps-stage')); }catch(e){ window.addEventListener('resize',psFit); } }
document.addEventListener('keydown',e=>{ if(!_cv||!document.querySelector('#modal2 .ps-root')) return; const tag=(e.target&&e.target.tagName)||''; if(tag==='INPUT'||tag==='TEXTAREA') return; if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); if(e.shiftKey) psRedo(); else psUndo(); } });
/* export */
function psLoadImg(src){ return new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src; }); }
async function psBake(ctx,W,H){ const layers=(_cv.layers||[]).filter(L=>L.kind==='img'?L.src:(L.text||'').trim()); if(!layers.length) return; const box=document.getElementById('cv-layer-box'); const k=W/((box&&box.clientWidth)||300);
  try{ if(document.fonts&&document.fonts.load) await Promise.all(layers.filter(L=>L.kind!=='img').map(L=>document.fonts.load(cvCanvasFont(L,Math.round(L.size/100*W)),L.text).catch(()=>null))); }catch(e){}
  for(const L of layers){ const px=L.size/100*W; ctx.save(); ctx.translate(L.x/100*W,L.y/100*H); ctx.rotate((L.rot||0)*Math.PI/180);
    if(L.kind==='img'){ const im=await psLoadImg(L.src); if(im){ const w=px*2.4, h=w*((im.naturalHeight||1)/(im.naturalWidth||1)); ctx.drawImage(im,-w/2,-h/2,w,h); } ctx.restore(); continue; }
    ctx.font=cvCanvasFont(L,px); const lines=cvWrapLines(ctx,L.text,W*.92); const lh=px*1.1; const bw=Math.max(0,...lines.map(t=>ctx.measureText(t).width)); const total=lh*lines.length; const al=L.kind==='text'?(L.align||'center'):'center'; ctx.textAlign=al; ctx.textBaseline='middle'; const x=al==='left'?-bw/2:(al==='right'?bw/2:0);
    ctx.fillStyle=L.kind==='text'?(L.color||'#ffffff'):'#ffffff'; ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=14*k; ctx.shadowOffsetY=2*k; lines.forEach((t,i)=>ctx.fillText(t,x,-total/2+lh*(i+.5))); ctx.restore(); } }
async function psExport(W,H){ const out=document.createElement('canvas'); out.width=W; out.height=H; const ctx=out.getContext('2d'); psGeoDraw(ctx,W,H,true); psPixels(ctx,W,H,psParams()); psInk(ctx,W,H,true); await psBake(ctx,W,H); return out; }
function cvApply(){ if(!_cv||!_cvImg){ closeModal2(); return; } const o=_cv.opts||{}; const btn=document.getElementById('cv-apply'); if(btn){ btn.disabled=true; btn.classList.add('is-busy'); }
  const W=(o.out&&o.out[0])||(_cv.A>1.2?1500:1000), H=(o.out&&o.out[1])||Math.round(W/_cv.A);
  psExport(W,H).then(out=>{ if(o.onApply){ let d=''; try{ d=out.toDataURL('image/jpeg',o.q||.88); }catch(e){ toast('Couldn\u2019t process image','This picture can\u2019t be edited here'); if(btn) btn.disabled=false; return; } const cb=o.onApply; closeModal2(); try{ cb(d); }catch(e){ console.error(e); } return; }
    const finish=blob=>{ if(!blob){ toast("Couldn\u2019t process image"); if(btn) btn.disabled=false; return; } _amCoverBlob=blob; if(_amCoverURL){ try{ URL.revokeObjectURL(_amCoverURL); }catch(e){} } _amCoverURL=URL.createObjectURL(blob);
      const pv=document.getElementById('am-cover-preview'), ph=document.getElementById('am-cover-ph'); if(pv){ pv.src=_amCoverURL; pv.style.display='block'; } if(ph) ph.style.display='none';
      const adj=document.getElementById('am-adjust-cover'); if(adj) adj.classList.remove('hidden'); document.querySelectorAll('#modal .te-thumb,#modal .te-hero-bg').forEach(el=>{ el.innerHTML='<img src="'+_amCoverURL+'" alt="">'; }); try{ avgColorFromUrl(_amCoverURL).then(amSetGlow); }catch(e){} state._teDirty=true; toast("Cover art updated"); closeModal2(); };
    try{ if(out.toBlob) out.toBlob(b=>finish(b),'image/jpeg',.9); else finish(_dataURLtoBlob(out.toDataURL('image/jpeg',.9))); }catch(e){ console.error('cover export failed',e); toast("Couldn\u2019t process image"); if(btn) btn.disabled=false; } })
  .catch(e=>{ console.error(e); toast("Couldn\u2019t process image"); if(btn) btn.disabled=false; }); }
function cvTeardown(){ if(_cv&&_cv.ownSrc&&_cv.src){ try{ URL.revokeObjectURL(_cv.src); }catch(e){} } _cv=null; _cvImg=null; _psBase=null; _psInkC=null; _psKey=''; try{ if(_psRO) _psRO.disconnect(); }catch(e){} }
