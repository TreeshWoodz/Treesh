/* ---------- P9zzu: Photocap pro. Photo layers, blend modes, hue + blur, history panel, paint bucket, remove background, wheel scroll + two-finger layer gestures ---------- */
PS_ADJ.push(['hue','Hue','rainbow',-180,180],['blur','Blur','droplets',0,100]);
PS_TOOLS.push(['history','History','history']);
PS_BRUSH.push(['fill','Fill','paint-bucket']);
const PC_BLENDS=[['normal','Normal'],['multiply','Multiply'],['screen','Screen'],['overlay','Overlay'],['soft-light','Soft light'],['hard-light','Hard light'],['darken','Darken'],['lighten','Lighten'],['color-dodge','Color dodge'],['color-burn','Color burn'],['difference','Difference'],['exclusion','Exclusion'],['hue','Hue'],['saturation','Saturation'],['color','Color'],['luminosity','Luminosity']];
const PC_MAX=20, _pcBlobs=new Map(), _pcFillC=new Map();
function pcSelLayer(){ return _cv?(_cv.layers||[]).find(x=>x.id===_cv.sel&&!x.hidden)||null:null; }
function pcStore(c,png){ return new Promise(res=>{ try{ c.toBlob(b=>{ if(!b){ res(null); return; } const u=URL.createObjectURL(b); _pcBlobs.set(u,b); res(u); },png?'image/png':'image/jpeg',.92); }catch(e){ res(null); } }); }
function pcBlobData(b){ return new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>res(''); r.readAsDataURL(b); }); }
async function pcInline(st){ const urls=[...new Set(st.match(/blob:[^"\\]+/g)||[])]; for(const u of urls){ const b=_pcBlobs.get(u); if(b){ const d=await pcBlobData(b); if(d) st=st.split(u).join(d); } } return st; }
function pcBlobify(src){ if(!/^data:/.test(src||'')||src.length<20000) return src; const b=_dataURLtoBlob(src); if(!b) return src; const u=URL.createObjectURL(b); _pcBlobs.set(u,b); return u; }

/* hue + blur in the pixel pipeline (works on iPhone Safari, no ctx.filter) */
function pcHue(d,deg){ const a=deg*Math.PI/180, c=Math.cos(a), s=Math.sin(a);
  const m=[.213+c*.787-s*.213,.715-c*.715-s*.715,.072-c*.072+s*.928,.213-c*.213+s*.143,.715+c*.285+s*.14,.072-c*.072-s*.283,.213-c*.213-s*.787,.715-c*.715+s*.715,.072+c*.928+s*.072];
  for(let i=0;i<d.length;i+=4){ const r=d[i], g=d[i+1], b=d[i+2]; d[i]=m[0]*r+m[1]*g+m[2]*b; d[i+1]=m[3]*r+m[4]*g+m[5]*b; d[i+2]=m[6]*r+m[7]*g+m[8]*b; } }
function pcBoxH(s,t,W,H,r){ const k=1/(2*r+1); for(let y=0;y<H;y++){ const o=y*W*4; for(let c=0;c<3;c++){ let a=0; for(let x=-r;x<=r;x++) a+=s[o+Math.min(W-1,Math.max(0,x))*4+c]; for(let x=0;x<W;x++){ t[o+x*4+c]=a*k; a+=s[o+Math.min(W-1,x+r+1)*4+c]-s[o+Math.max(0,x-r)*4+c]; } } } }
function pcBoxV(s,t,W,H,r){ const k=1/(2*r+1), R=W*4; for(let x=0;x<W;x++){ for(let c=0;c<3;c++){ const o=x*4+c; let a=0; for(let y=-r;y<=r;y++) a+=s[o+Math.min(H-1,Math.max(0,y))*R]; for(let y=0;y<H;y++){ t[o+y*R]=a*k; a+=s[o+Math.min(H-1,y+r+1)*R]-s[o+Math.max(0,y-r)*R]; } } } }
function pcBlur(d,W,H,r){ const a=Float32Array.from(d), b=new Float32Array(d.length), rr=Math.max(1,Math.round(r/1.4)); for(let p=0;p<2;p++){ pcBoxH(a,b,W,H,rr); pcBoxV(b,a,W,H,rr); } for(let i=0;i<d.length;i+=4){ d[i]=a[i]; d[i+1]=a[i+1]; d[i+2]=a[i+2]; } }
const _psPx9zzu=psPixels; psPixels=function(ctx,W,H,p){ const r=_psPx9zzu.apply(this,arguments); const hue=+p.hue||0, bl=+p.blur||0; if((!hue&&!bl)||!_cv||_cv.taint) return r; let id; try{ id=ctx.getImageData(0,0,W,H); }catch(e){ return r; }
  if(hue) pcHue(id.data,hue); if(bl) pcBlur(id.data,W,H,Math.max(1,Math.round(bl/100*Math.max(W,H)*.02))); ctx.putImageData(id,0,0); return r; };
const _psCF9zzu=psCssFilter; psCssFilter=function(p){ return _psCF9zzu.apply(this,arguments)+` hue-rotate(${+p.hue||0}deg) blur(${((+p.blur||0)/100*6).toFixed(2)}px)`; };

/* layers: photos, blend modes, bigger sizes, up to 20 */
const _ccs9zzu=cvClampSize; cvClampSize=function(v){ if(_cv&&_lh===_cv) return Math.max(2,Math.min(100,Math.round(v*10)/10)); return _ccs9zzu.apply(this,arguments); };
const _cal9zzu=cvAddLayer; cvAddLayer=function(L){ if(_cv&&_lh===_cv){ if(_lh.layers.length>=PC_MAX){ toast('Layer limit reached','Up to '+PC_MAX+' layers per image'); return; } _lh.layers.push(L); _lh.sel=L.id; cvRenderLayers(); cvRenderLayerPanel(); return; } return _cal9zzu.apply(this,arguments); };
const _cvRL9zzu=cvRenderLayers; cvRenderLayers=function(){ const r=_cvRL9zzu.apply(this,arguments); try{ const box=lhBox(); if(box&&_lh===_cv) _cv.layers.forEach(L=>{ const el=box.querySelector('[data-cvl-id="'+L.id+'"]'); if(el){ el.style.mixBlendMode=L.blend||''; el.classList.toggle('is-photo',!!L.photo); } }); }catch(e){} return r; };
const _isln9zzu=islName; islName=function(L,i){ if(L.photo) return L.name||'Image'; return _isln9zzu.apply(this,arguments); };
psBake=async function(ctx,W,H){ const layers=(_cv.layers||[]).filter(L=>!L.hidden&&(L.kind==='img'?L.src:(L.text||'').trim())); if(!layers.length) return; const box=document.getElementById('cv-layer-box'); const k=W/((box&&box.clientWidth)||300);
  try{ if(document.fonts&&document.fonts.load) await Promise.all(layers.filter(L=>L.kind!=='img').map(L=>document.fonts.load(cvCanvasFont(L,Math.round(L.size/100*W)),L.text).catch(()=>null))); }catch(e){}
  for(const L of layers){ const px=L.size/100*W; ctx.save(); ctx.globalAlpha=L.op!=null?Math.max(0,Math.min(1,L.op/100)):1; ctx.globalCompositeOperation=L.blend&&L.blend!=='normal'?L.blend:'source-over'; ctx.translate(L.x/100*W,L.y/100*H); ctx.rotate((L.rot||0)*Math.PI/180);
    if(L.kind==='img'){ const im=await psLoadImg(L.src); if(im){ const w=px*2.4, h=w*((im.naturalHeight||1)/(im.naturalWidth||1)); ctx.drawImage(im,-w/2,-h/2,w,h); } ctx.restore(); continue; }
    ctx.font=cvCanvasFont(L,px); const lines=cvWrapLines(ctx,L.text,W*.92); const lh=px*1.1; const bw=Math.max(0,...lines.map(t=>ctx.measureText(t).width)); const total=lh*lines.length; const al=L.kind==='text'?(L.align||'center'):'center'; ctx.textAlign=al; ctx.textBaseline='middle'; const x=al==='left'?-bw/2:(al==='right'?bw/2:0);
    ctx.fillStyle=L.kind==='text'?(L.color||'#ffffff'):'#ffffff'; ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=14*k; ctx.shadowOffsetY=2*k; lines.forEach((t,i)=>ctx.fillText(t,x,-total/2+lh*(i+.5))); ctx.restore(); } };
function pcAddPhotos(){ if(!_cv) return; const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.multiple=true;
  inp.onchange=async()=>{ const fs=[...(inp.files||[])].filter(f=>/^image\//.test(f.type||'')).slice(0,8); if(!fs.length){ toast('Pick an image','PNG, JPG, WebP or GIF'); return; } for(const f of fs){ if(f.size>25*1024*1024){ toast('Image too large','Use one under 25 MB'); continue; } await pcAddFile(f); } };
  inp.click(); }
async function pcAddFile(f){ const u=URL.createObjectURL(f), im=await psLoadImg(u); URL.revokeObjectURL(u); if(!im||!_cv){ toast('Couldn\u2019t open that image','Try a different file'); return; }
  const iw=im.naturalWidth||1, ih=im.naturalHeight||1, k=Math.min(1,1600/Math.max(iw,ih)), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(iw*k)); c.height=Math.max(1,Math.round(ih*k)); c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  const src=await pcStore(c,/png|webp|gif|svg/.test(f.type||'')); if(!src||!_cv) return; let fw=.7; const fh=fw*_cv.A*ih/iw; if(fh>.85) fw=.85*iw/(ih*_cv.A);
  const n=(_cv.layers||[]).filter(x=>x.photo).length; cvAddLayer({id:bgUID(),kind:'img',photo:true,name:(f.name||'Image').replace(/\.[^.]+$/,'').slice(0,40)||'Image',src,text:'',x:50+(n%4)*3,y:50+(n%4)*3,size:Math.round(fw*100/2.4*10)/10,rot:0,color:'#ffffff',align:'center',font:''});
  psSnap(); if(_cv.tool!=='layers') psTool('layers'); else islRender(); toast('Image added','Drag, pinch or twist it on the canvas'); }

/* remove background: auto from the edges, or tap a colour on the layer */
const pcDist=(d,i,r,g,b)=>{ const x=d[i]-r, y=d[i+1]-g, z=d[i+2]-b; return Math.sqrt((x*x+y*y+z*z)/3); };
const pcSoft=(dist,tol)=>dist<=tol*.55?0:Math.min(1,(dist-tol*.55)/(tol*.45));
function pcKeyEdges(d,W,H,tol){ const B=[]; for(let x=0;x<W;x++) B.push(x,(H-1)*W+x); for(let y=1;y<H-1;y++) B.push(y*W,y*W+W-1);
  const med=k=>{ const a=B.map(p=>d[p*4+k]).sort((m,n)=>m-n); return a[a.length>>1]; }, r=med(0), g=med(1), b=med(2), N=W*H, seen=new Uint8Array(N), st=new Int32Array(N); let sp=0, n=0;
  B.forEach(p=>{ if(!seen[p]){ seen[p]=1; if(d[p*4+3]>0&&pcDist(d,p*4,r,g,b)<=tol) st[sp++]=p; } });
  while(sp){ const p=st[--sp], i=p*4; d[i+3]=d[i+3]*pcSoft(pcDist(d,i,r,g,b),tol); n++; const x=p%W;
    for(const q of [x>0?p-1:-1,x<W-1?p+1:-1,p-W,p+W]){ if(q<0||q>=N||seen[q]) continue; seen[q]=1; if(d[q*4+3]>0&&pcDist(d,q*4,r,g,b)<=tol) st[sp++]=q; } }
  return n; }
function pcKeyColor(d,W,H,tol,pt){ const px=Math.min(W-1,Math.max(0,Math.floor(pt[0]*W))), py=Math.min(H-1,Math.max(0,Math.floor(pt[1]*H))); let r=0,g=0,b=0,c=0;
  for(let y=Math.max(0,py-1);y<=Math.min(H-1,py+1);y++) for(let x=Math.max(0,px-1);x<=Math.min(W-1,px+1);x++){ const i=(y*W+x)*4; r+=d[i]; g+=d[i+1]; b+=d[i+2]; c++; } r/=c; g/=c; b/=c; let n=0;
  for(let i=0;i<d.length;i+=4){ if(!d[i+3]) continue; const dist=pcDist(d,i,r,g,b); if(dist<=tol){ d[i+3]=d[i+3]*pcSoft(dist,tol); n++; } } return n; }
async function pcBgRun(L,mode,pt){ if(!_cv||_cv.pcBusy||!L||L.kind!=='img') return; _cv.pcBusy=true; islRender(); const base=mode==='auto'?(L.src0||L.src):L.src, im=await psLoadImg(base);
  const done=()=>{ if(_cv){ _cv.pcBusy=false; islRender(); } };
  if(!im||!_cv){ toast('Couldn\u2019t read this image'); done(); return; } const c=document.createElement('canvas'); c.width=im.naturalWidth||1; c.height=im.naturalHeight||1; const x=c.getContext('2d'); x.drawImage(im,0,0); let id;
  try{ id=x.getImageData(0,0,c.width,c.height); }catch(e){ toast('Can\u2019t edit this sticker','It comes from another site'); done(); return; }
  const tol=(_cv.pcTol||36)*2.55, n=mode==='auto'?pcKeyEdges(id.data,c.width,c.height,tol):pcKeyColor(id.data,c.width,c.height,tol,pt);
  if(!n){ toast('Nothing to remove','Try a higher tolerance'); done(); return; } x.putImageData(id,0,0); const u=await pcStore(c,true); if(!u||!_cv){ done(); return; }
  if(!L.src0) L.src0=L.src; L.src=u; L.pcMode=mode; _cv.pcBusy=false; cvRenderLayers(); psSnap(); islRender(); toast(mode==='auto'?'Background removed':'Colour removed',Math.round(n/(c.width*c.height)*100)+'% of the image is see-through now'); }
function pcPickUi(){ const r=document.querySelector('#modal2 .ps-root'); if(r) r.classList.toggle('is-picking',!!(_cv&&_cv.pcPick)); }
function pcPickAt(e){ const L=pcSelLayer(); _cv.pcPick=false; pcPickUi(); islRender(); if(!L||L.kind!=='img') return; const box=document.getElementById('cv-layer-box'), img=box&&box.querySelector('[data-cvl-id="'+L.id+'"] img'); if(!img) return;
  const r=box.getBoundingClientRect(), dx=e.clientX-(r.left+L.x/100*r.width), dy=e.clientY-(r.top+L.y/100*r.height), a=-(L.rot||0)*Math.PI/180, ux=dx*Math.cos(a)-dy*Math.sin(a), uy=dx*Math.sin(a)+dy*Math.cos(a), fx=ux/img.offsetWidth+.5, fy=uy/img.offsetHeight+.5;
  if(fx<0||fx>1||fy<0||fy>1){ toast('Tap on the selected image','Pick the colour you want gone'); return; } pcBgRun(L,'pick',[fx,fy]); }

/* layers panel: Image button, blend mode, remove background */
const _islR9zzu=islRender; islRender=function(){ const r=_islR9zzu.apply(this,arguments); const pane=document.querySelector('#ps-panel .isl'); if(!pane||!_cv) return r; const L=(_cv.layers||[]).find(x=>x.id===_cv.sel), busy=_cv.pcBusy?' disabled':'';
  const t=pane.querySelector('[data-testid="isl-add-text"]'); if(t) t.insertAdjacentHTML('beforebegin',`<button type="button" data-pc="add-photo" data-testid="isl-add-photo" class="ps-chip"><i data-lucide="image-plus"></i>Image</button>`);
  const op=pane.querySelector('.isl-op'); if(op&&L){ let h=`<div class="isl-op pc-blend"><span>Blend</span><select data-pc-blend data-testid="isl-blend" class="pc-sel" aria-label="Blend mode">${PC_BLENDS.map(([k,l])=>`<option value="${k}"${(L.blend||'normal')===k?' selected':''}>${l}</option>`).join('')}</select></div>`;
    if(L.kind==='img'){ const tol=_cv.pcTol||36; h+=`<div class="pc-bgr" data-testid="pc-bg-remove"><p class="ps-sub">Remove background</p><div class="ps-row"><button type="button" data-pc="bg-auto" data-testid="pc-bg-auto" class="ps-chip"${busy}><i data-lucide="${_cv.pcBusy?'loader':'eraser'}"></i>${_cv.pcBusy?'Working\u2026':'Auto remove'}</button><button type="button" data-pc="bg-pick" data-testid="pc-bg-pick" aria-pressed="${!!_cv.pcPick}" class="ps-chip${_cv.pcPick?' on':''}"${busy}><i data-lucide="pipette"></i>Tap a colour</button>${L.src0?`<button type="button" data-pc="bg-restore" data-testid="pc-bg-restore" class="ps-chip"${busy}><i data-lucide="rotate-ccw"></i>Restore</button>`:''}</div>
      <div class="isl-op mt-2"><span>Tolerance</span><input type="range" min="4" max="100" step="1" value="${tol}" data-pc-tol data-testid="pc-bg-tolerance" class="i-slider" aria-label="Tolerance"><b data-pc-tolv>${tol}</b></div>${_cv.pcPick?`<p class="pc-pick-note" data-testid="pc-pick-note"><i data-lucide="pipette"></i>Now tap the colour on the image you want gone.</p>`:''}</div>`; }
    op.insertAdjacentHTML('afterend',h); }
  icons(); pane.querySelectorAll('input[type=range]').forEach(s=>{ try{ fillSlider(s); }catch(e){} }); return r; };

/* history panel */
function pcKind(L){ return L?(L.photo?'image':L.kind==='text'?'text':L.kind==='emoji'?'emoji':'sticker'):'layer'; }
function pcHistLabel(a,b){ if(!a||!b) return ['Edit','pencil']; const aa=a.adj||{}, ba=b.adj||{}, ak=Object.keys(Object.assign({},aa,ba)).filter(k=>(aa[k]||0)!==(ba[k]||0));
  if(ak.length===1){ const A=PS_ADJ.find(x=>x[0]===ak[0]); return [A?A[1]:'Adjust',A?A[2]:'sliders-horizontal']; } if(ak.length) return ['Adjustments','sliders-horizontal'];
  if(a.filter!==b.filter) return ['Filter: '+((PS_FILTERS.find(f=>f.id===b.filter)||{}).name||b.filter),'aperture']; if(a.fstr!==b.fstr) return ['Filter strength','aperture'];
  if(a.A!==b.A) return ['Crop','crop']; if(a.rot!==b.rot) return ['Straighten','ruler']; if(a.q!==b.q) return ['Rotate','rotate-ccw']; if(a.flipH!==b.flipH||a.flipV!==b.flipV) return ['Flip','flip-horizontal-2']; if(a.zoom!==b.zoom) return ['Zoom','zoom-in']; if(a.panX!==b.panX||a.panY!==b.panY) return ['Move photo','move'];
  const sa=a.strokes||[], sb=b.strokes||[]; if(sb.length>sa.length){ const s=sb[sb.length-1]; return s.b==='fill'?['Paint bucket','paint-bucket']:s.b==='eraser'?['Eraser','eraser']:['Brush stroke','brush']; } if(sb.length<sa.length) return [sb.length?'Remove strokes':'Clear drawing','eraser'];
  if(!!a.inkOff!==!!b.inkOff) return [b.inkOff?'Hide drawing':'Show drawing','eye'];
  const la=a.layers||[], lb=b.layers||[]; if(lb.length>la.length) return ['Add '+pcKind(lb.find(x=>!la.some(y=>y.id===x.id))),'plus']; if(lb.length<la.length) return ['Delete '+pcKind(la.find(x=>!lb.some(y=>y.id===x.id))),'trash-2'];
  if(la.map(x=>x.id).join()!==lb.map(x=>x.id).join()) return ['Reorder layers','layers'];
  for(const L of lb){ const P=la.find(y=>y.id===L.id)||{}, k=pcKind(L);
    if(P.src!==L.src) return [L.src0?(L.pcMode==='pick'?'Remove colour':'Remove background'):'Restore image','eraser']; if((P.blend||'normal')!==(L.blend||'normal')) return ['Blend: '+((PC_BLENDS.find(x=>x[0]===(L.blend||'normal'))||[])[1]||L.blend),'blend'];
    if(P.op!==L.op) return ['Opacity','circle-dashed']; if(!!P.hidden!==!!L.hidden) return [(L.hidden?'Hide ':'Show ')+k,L.hidden?'eye-off':'eye']; if(P.text!==L.text) return ['Edit text','type'];
    if(P.font!==L.font||P.color!==L.color||P.align!==L.align) return ['Text style','type']; if(P.size!==L.size||P.rot!==L.rot) return ['Resize / rotate '+k,'scaling']; if(P.x!==L.x||P.y!==L.y) return ['Move '+k,'move']; }
  return ['Edit','pencil']; }
function pcHistHtml(){ const H=_cv.hist||[], F=(_cv.fut||[]).slice().reverse(), all=H.concat(F), cur=H.length-1; let prev=null;
  const rows=all.map((s,i)=>{ let o=null; try{ o=JSON.parse(s); }catch(e){} const lab=i===0?['Original','image']:pcHistLabel(prev,o); prev=o; return {i,lab}; }).reverse();
  return `<div class="pch" data-testid="ps-history-panel"><div class="isl-head"><p>History <span data-testid="ps-history-count">${all.length}</span></p><button type="button" data-ps="undo" data-testid="ps-history-undo" class="ps-chip"${cur<1?' disabled':''}><i data-lucide="undo-2"></i>Undo</button><button type="button" data-ps="redo" data-testid="ps-history-redo" class="ps-chip"${F.length?'':' disabled'}><i data-lucide="redo-2"></i>Redo</button></div>
    <ol class="pch-list" data-testid="ps-history-list">${rows.map(({i,lab})=>`<li><button type="button" data-pc="hist" data-i="${i}" data-testid="ps-hist-${i}" aria-current="${i===cur}" class="pch-row${i===cur?' on':''}${i>cur?' is-future':''}" style="--d:${Math.min(rows.length-1-i,12)*0}ms"><span class="pch-ic"><i data-lucide="${lab[1]}"></i></span><span class="pch-n clamp-1">${esc(lab[0])}</span><em>${i===cur?'Now':i>cur?'Undone':i===0?'Start':'#'+i}</em></button></li>`).join('')}</ol>
    <p class="ps-hint"><i data-lucide="history"></i>Tap a step to jump back to it. A new change clears the undone steps.</p></div>`; }
function pcHistGo(j){ if(!_cv) return; const H=_cv.hist, F=_cv.fut; j=Math.max(0,Math.min(H.length+F.length-1,j)); if(j===H.length-1) return; while(H.length-1>j) F.push(H.pop()); while(H.length-1<j&&F.length) H.push(F.pop()); psRestore(H[H.length-1]); psHistBtns(); }

/* paint bucket */
function pcFlood(d,W,H,x0,y0,tol){ const N=W*H, m=new Uint8Array(N), i0=(y0*W+x0)*4, r0=d[i0], g0=d[i0+1], b0=d[i0+2], t2=tol*tol*3; const ok=p=>{ const i=p*4, a=d[i]-r0, b=d[i+1]-g0, c=d[i+2]-b0; return a*a+b*b+c*c<=t2; };
  const st=[y0*W+x0]; while(st.length){ let p=st.pop(); if(m[p]) continue; const y=(p/W)|0; let x=p-y*W; while(x>0&&!m[p-1]&&ok(p-1)){ p--; x--; } let up=false, dn=false;
    for(;x<W&&!m[p]&&ok(p);x++,p++){ m[p]=1; if(y>0){ const q=p-W; if(!m[q]&&ok(q)){ if(!up){ st.push(q); up=true; } } else up=false; } if(y<H-1){ const q=p+W; if(!m[q]&&ok(q)){ if(!dn){ st.push(q); dn=true; } } else dn=false; } } }
  return m; }
function pcFill(e){ const cv=document.getElementById('cv-canvas'); if(!cv||!_cv) return; const r=cv.getBoundingClientRect(), W=cv.width, H=cv.height, x=Math.floor((e.clientX-r.left)/r.width*W), y=Math.floor((e.clientY-r.top)/r.height*H); if(x<0||y<0||x>=W||y>=H) return;
  let id; try{ id=cv.getContext('2d').getImageData(0,0,W,H); }catch(err){ toast('Can\u2019t fill this photo','It comes from another site'); return; }
  const m=pcFlood(id.data,W,H,x,y,(_cv.fillTol==null?15:_cv.fillTol)*2.55), out=document.createElement('canvas'); out.width=W; out.height=H; const o=out.getContext('2d'), od=o.createImageData(W,H), hx=String(_cv.ink||'#ffffff').replace('#',''), cr=parseInt(hx.slice(0,2),16)||0, cg=parseInt(hx.slice(2,4),16)||0, cb=parseInt(hx.slice(4,6),16)||0; let n=0;
  for(let p=0;p<W*H;p++){ const px=p%W; if(m[p]||(px>0&&m[p-1])||(px<W-1&&m[p+1])||(p>=W&&m[p-W])||(p<W*H-W&&m[p+W])){ const i=p*4; od.data[i]=cr; od.data[i+1]=cg; od.data[i+2]=cb; od.data[i+3]=255; n++; } }
  o.putImageData(od,0,0); let url=''; try{ url=out.toDataURL('image/png'); }catch(err){ return; } _pcFillC.set(url,out); _cv.strokes.push({b:'fill',c:_cv.ink,img:url}); psQueue(); psSnap(); if(n>W*H*.97) toast('Filled the whole canvas','Lower the tolerance to fill less'); }
function pcFillImg(s){ let im=_pcFillC.get(s.img); if(im) return im.complete===false?null:im; im=new Image(); im.onload=()=>{ psQueue(); }; im.src=s.img; _pcFillC.set(s.img,im); return null; }
const _psStroke9zzu=psStroke; psStroke=function(c,s,W,H){ if(s&&s.b==='fill'){ const im=s.img&&pcFillImg(s); if(im) c.drawImage(im,0,0,W,H); return; } return _psStroke9zzu.apply(this,arguments); };
const _psGet9zzu=psGet; psGet=function(k){ if(k==='tol') return _cv.fillTol==null?15:_cv.fillTol; return _psGet9zzu.apply(this,arguments); };
const _psSet9zzu=psSet; psSet=function(k,v){ if(k==='tol'){ _cv.fillTol=v; return; } return _psSet9zzu.apply(this,arguments); };
const _psFmt9zzu=psFmt; psFmt=function(k,v){ if(k==='tol') return v+'%'; return _psFmt9zzu.apply(this,arguments); };

/* tool panels: history, fill options, Add image on the Stickers tab */
const _psRT9zzu=psRenderTool; psRenderTool=function(){ const r=_psRT9zzu.apply(this,arguments); const pane=document.querySelector('#ps-panel .ps-pane'); if(!pane||!_cv) return r; const t=_cv.tool;
  if(t==='history'){ pane.innerHTML=pcHistHtml(); icons(); const on=pane.querySelector('.pch-row.on'); if(on) try{ on.scrollIntoView({block:'nearest'}); }catch(e){} }
  else if(t==='draw'&&_cv.brush==='fill'){ const dw=pane.querySelector('[data-dial="ink"]'), wrap=dw&&dw.closest('.ps-dial-wrap'); if(wrap) wrap.outerHTML=psDialHtml('tol',0,100,'Fill tolerance'); const cl=pane.querySelector('[data-testid="ps-ink-clear"]'); if(cl) cl.lastChild.textContent='Clear drawing & fills';
    const h=pane.querySelector('.ps-hint'); if(h) h.innerHTML='<i data-lucide="paint-bucket"></i>Tap an area to fill it with the colour. Higher tolerance fills more.'; else pane.insertAdjacentHTML('beforeend','<p class="ps-hint"><i data-lucide="paint-bucket"></i>Tap an area to fill it with the colour. Higher tolerance fills more.</p>'); icons(); }
  else if(t==='stickers'){ pane.insertAdjacentHTML('afterbegin',`<button type="button" data-pc="add-photo" data-testid="ps-add-photo" class="pc-addimg press"><span><i data-lucide="image-plus"></i></span><b>Add an image</b><small>Photos and PNGs become their own layer</small></button>`); icons(); }
  const root=document.querySelector('#modal2 .ps-root'); if(root) root.dataset.brush=_cv.brush||''; pcStageWire(); return r; };

/* stage: paint bucket taps, colour picking, two fingers resize + twist the selected layer anywhere */
function pcStageWire(){ const st=document.getElementById('ps-stage'); if(!st||st._pc) return; st._pc=1; const P=new Map(), blk=new Set(); let g=null;
  st.addEventListener('pointerdown',e=>{ if(!_cv) return;
    if(_cv.pcPick&&e.isPrimary){ e.stopPropagation(); e.preventDefault(); pcPickAt(e); return; }
    if(_cv.tool==='draw'&&_cv.brush==='fill'&&e.isPrimary&&e.target&&e.target.id==='cv-canvas'){ e.stopPropagation(); e.preventDefault(); pcFill(e); return; }
    if(e.pointerType!=='touch') return; P.set(e.pointerId,{x:e.clientX,y:e.clientY}); const L=pcSelLayer();
    if(P.size===2&&L&&['layers','text','stickers'].includes(_cv.tool)){ const p=[...P.values()]; g={L,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1,a:Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x),s:L.size,r:L.rot||0}; P.forEach((v,k)=>blk.add(k)); e.stopPropagation(); } },true);
  st.addEventListener('pointermove',e=>{ if(P.has(e.pointerId)) P.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(!blk.has(e.pointerId)) return; e.stopPropagation(); e.preventDefault(); if(!g||P.size<2) return;
    const p=[...P.values()], d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1, a=Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x); g.L.size=cvClampSize(g.s*d/g.d); g.L.rot=cvNormRot(g.r+(a-g.a)*180/Math.PI); cvStyleLayer(g.L); try{ cvSyncLayerCtl(g.L); }catch(_){} },true);
  const end=e=>{ P.delete(e.pointerId); blk.delete(e.pointerId); if(g&&P.size<2){ g=null; psSnap(); } }; st.addEventListener('pointerup',end,true); st.addEventListener('pointercancel',end,true);
  st.addEventListener('wheel',e=>{ if(!_cv||!e.shiftKey) return; const el=e.target.closest&&e.target.closest('[data-cvl-id]'); if(!el) return; const L=(_cv.layers||[]).find(x=>x.id===el.dataset.cvlId); if(!L) return; e.preventDefault(); e.stopPropagation(); L.rot=cvNormRot((L.rot||0)+(e.deltaY>0?3:-3)); cvStyleLayer(L); try{ cvSyncLayerCtl(L); }catch(_){} clearTimeout(st._wt); st._wt=setTimeout(()=>psSnap(),300); },{capture:true,passive:false}); }

/* saved projects keep photo layers; reopened ones go back to light blob URLs */
const _ips9zzu=isProjSaved; isProjSaved=async function(d){ const s=window._isSnap; if(s&&s.st&&s.st.indexOf('blob:')>=0){ try{ s.st=await pcInline(s.st); }catch(e){} } return _ips9zzu.call(this,d); };
const _psSnap9zzu=psSnap; psSnap=function(init){ const r=_psSnap9zzu.apply(this,arguments); if(init&&_cv){ let ch=false; (_cv.layers||[]).forEach(L=>{ if(L.kind!=='img') return; const a=pcBlobify(L.src), b=L.src0?pcBlobify(L.src0):L.src0; if(a!==L.src||b!==L.src0){ L.src=a; if(b) L.src0=b; ch=true; } }); if(ch){ _cv.hist=[psState()]; _cv.fut=[]; cvRenderLayers(); psHistBtns(); } } return r; };

/* clicks + inputs */
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-pc]'); if(!b||!_cv||b.disabled) return; const a=b.dataset.pc, L=(_cv.layers||[]).find(x=>x.id===_cv.sel);
  if(a==='add-photo') pcAddPhotos();
  else if(a==='hist') pcHistGo(+b.dataset.i);
  else if(a==='bg-auto') pcBgRun(L,'auto');
  else if(a==='bg-pick'){ _cv.pcPick=!_cv.pcPick; pcPickUi(); islRender(); }
  else if(a==='bg-restore'&&L&&L.src0){ L.src=L.src0; delete L.src0; delete L.pcMode; cvRenderLayers(); psSnap(); islRender(); toast('Original image back'); } });
document.addEventListener('change',e=>{ const t=e.target; if(!t||!_cv) return; const L=(_cv.layers||[]).find(x=>x.id===_cv.sel);
  if(t.hasAttribute&&t.hasAttribute('data-pc-blend')&&L){ L.blend=t.value==='normal'?undefined:t.value; cvRenderLayers(); psSnap(); }
  if(t.hasAttribute&&t.hasAttribute('data-pc-tol')&&L&&L.pcMode==='auto'&&L.src0) pcBgRun(L,'auto'); });
document.addEventListener('input',e=>{ const t=e.target; if(!t||!_cv||!t.hasAttribute||!t.hasAttribute('data-pc-tol')) return; _cv.pcTol=+t.value; const v=document.querySelector('[data-pc-tolv]'); if(v) v.textContent=t.value; try{ fillSlider(t); }catch(_){} });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&_cv&&_cv.pcPick){ e.preventDefault(); e.stopImmediatePropagation(); _cv.pcPick=false; pcPickUi(); islRender(); } },true);

/* desktop: the mouse wheel scrolls Photocap's sideways rows; on a dial it nudges the value */
function pcSmoothX(el,dy){ const max=el.scrollWidth-el.clientWidth; el._tx=Math.max(0,Math.min(max,(el._tx==null?el.scrollLeft:el._tx)+dy)); if(el._raf) return;
  const step=()=>{ if(el._tx==null){ el._raf=0; return; } const d=el._tx-el.scrollLeft, s0=el.scrollLeft; if(Math.abs(d)<1.5){ el.scrollLeft=el._tx; el._tx=null; el._raf=0; return; } el.scrollLeft+=Math.sign(d)*Math.max(2,Math.abs(d)*.22); if(el.scrollLeft===s0) el._tx=null; el._raf=requestAnimationFrame(step); }; el._raf=requestAnimationFrame(step); }
document.addEventListener('wheel',e=>{ if(e.ctrlKey||e.defaultPrevented) return; const el=e.target&&e.target.closest&&e.target.closest('.ps-root :is(.ps-adj-row,.ps-fl-row,.ps-tools,.ps-dial,.ps-inks,.st-chips-scroll,.isl-blends), .isa-sizes'); if(!el) return;
  if(Math.abs(e.deltaX)>Math.abs(e.deltaY)||el.scrollWidth<=el.clientWidth+1) return; e.preventDefault(); let dy=e.deltaY*(e.deltaMode===1?32:e.deltaMode===2?el.clientWidth:1);
  if(el.classList.contains('ps-dial')){ const ppu=+el.dataset.ppu||6; el.scrollLeft+=Math.abs(dy)<40?dy*.5:Math.sign(dy)*ppu*(e.shiftKey?10:2); return; }
  if(Math.abs(dy)<40){ el._tx=null; el.scrollLeft+=dy; } else pcSmoothX(el,dy*1.2); },{passive:false});
