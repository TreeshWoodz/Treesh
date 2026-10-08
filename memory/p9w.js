/* ---------- P9w: Studios redesign (3D floating art, pointer + phone tilt) + image picker that works on every device ---------- */
const ST3_ART=__P9W_ART__;
const ST3=[
  {id:'instrum',mk:'studio-instrum',act:'ix-launch',view:'',testid:'studios-open-instrum',ic:'sliders-horizontal',ac:'#9328ff',ac2:'#c88bff',kicker:'Audio DAW',title:'Instrum Studio',desc:'Drums and vocals on one timeline. Program beats, record over them, mix every track and export the whole song.',chips:['Drums + vocals','Mixer','Arrange bars','Export WAV'],cta:'Open Instrum'},
  {id:'image',mk:'studio-image',act:'image-studio-open',view:'',testid:'studios-open-image',ic:'wand-sparkles',ac:'#ff2d78',ac2:'#ff85b3',kicker:'Photo editor',title:'Image Studio',desc:'Start a blank canvas or open a photo. Crop, adjust, filter, draw and stack text and stickers in layers.',chips:['Blank canvas','Layers','Filters','Text & stickers'],cta:'Open Image Studio'},
  {id:'lyric',mk:'studio-lyric',act:'ls-picker',view:'',testid:'studios-open-lyric',ic:'captions',ac:'#f5c451',ac2:'#ffe08a',kicker:'Songwriting',title:'LyricFlow',desc:'Write, time and sync lyrics to any track. Get rhyme ideas, preview in the player and add your own explanations.',chips:['Write & sync','Rhyme helper','Preview','LRC import & export'],cta:'Open LyricFlow'},
  {id:'music',mk:'studio-music',act:'manage-uploads',view:'',testid:'studios-open-music',ic:'disc-3',ac:'#14b8c4',ac2:'#7ff0f5',kicker:'Your music',title:'Custom Music Studio',desc:'Upload your own songs, give them covers, lyrics and credits, then play them right next to the catalog.',chips:['Upload songs','Covers & credits','Lyrics','Grid or list'],cta:'Open Music Studio'}
];
function st3Still(){ const h=document.documentElement.classList; return h.contains('perf-mode')||h.contains('a11y-reduce-motion')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }
function st3NeedsPerm(){ return !!state.gyroOn&&typeof gyNeedsPerm==='function'&&gyNeedsPerm()&&!_gy.perm&&!document.documentElement.classList.contains('perf-mode'); }
function st3Card(o,i){ const beats=(state.beats||[]).length, recs=(typeof _isRec!=='undefined'&&_isRec)?_isRec.length:0, mus=(typeof USER_SONGS!=='undefined'&&USER_SONGS)?USER_SONGS.length:0, art=o.art||o.id, sat=ST3_ART[art+'_sat'];
  const extra=o.extra!=null?o.extra:o.id==='instrum'?(beats?`${beats} saved beat${beats!==1?'s':''}`:'Start fresh'):o.id==='image'&&recs?`${recs} recent project${recs!==1?'s':''}`:o.id==='music'&&mus?`${mus} track${mus!==1?'s':''}`:'';
  const chips=o.chips.concat(extra?[extra]:[]).map((c,k)=>`<span class="st3-chip${k===o.chips.length?' is-live':''}">${esc(c)}</span>`).join('');
  return `<button type="button" data-act="${o.act}"${o.view?` data-view="${o.view}"`:''}${o.val?` data-val="${o.val}"`:''}${o.key?` data-key="${o.key}"`:''} data-testid="${o.testid}" data-st3="${o.id}" class="st3${o.cls?' '+o.cls:''}" style="--ac:${o.ac};--ac2:${o.ac2};--i:${i}">
    <span class="st3-bg" aria-hidden="true"></span><span class="st3-sheen" aria-hidden="true"></span>
    <span class="st3-in">
      <span class="st3-stage" aria-hidden="true" data-testid="studios-art-${o.id}"><span class="st3-sway"><span class="st3-rig">
        <span class="st3-orb"></span><span class="st3-ring"></span><span class="st3-shadow"></span>
        <span class="st3-l is-main"><img src="${ST3_ART[art+'_main']}" alt="" draggable="false" class="st3-main"></span>
        ${sat?`<span class="st3-l is-sat"><img src="${sat}" alt="" draggable="false" class="st3-sat"></span>`:''}
        <span class="st3-l is-fx"><i class="st3-sp s1"></i><i class="st3-sp s2"></i><i class="st3-sp s3"></i></span>
      </span></span></span>
      <span class="st3-body">
        <span class="st3-k"><i data-lucide="${o.ic}" style="width:14px;height:14px"></i>${o.kicker}</span>
        <span class="st3-t" role="heading" aria-level="2">${o.title}</span>
        <span class="st3-d">${o.desc}</span>
        <span class="st3-chips">${chips}</span>
        <span class="st3-cta">${o.cta}<i data-lucide="arrow-up-right" style="width:17px;height:17px"></i></span>
      </span>
    </span>
  </button>`; }
viewStudios=function(){ _st3.base=null;
  const head=`<div class="st3-head" data-testid="studios-head">
      <div class="min-w-0">
        <p class="st3-hk">Create on Treesh</p>
        <h1 class="st3-h1"><span>Studios</span></h1>
        <p class="st3-hs">Your pocket creative suite. Make beats, edit photos, write lyrics and manage your own music.</p>
      </div>
      ${st3NeedsPerm()?`<button type="button" data-act="st3-tilt" data-testid="studios-tilt-btn" class="st3-tilt press"><i data-lucide="smartphone" style="width:15px;height:15px"></i>Tilt to explore</button>`:''}
    </div>`;
  return mkFromMarkers('studios', `<div class="space-y-7" data-testid="studios-view">
    <!--mk:studios-head-->${head}
    ${ST3.map((o,i)=>`<!--mk:${o.mk}-->${st3Card(o,i)}`).join('\n')}
  </div>`, {tid:'studios-view', w:{'studio-instrum':'full','studio-image':'half','studio-lyric':'half','studio-music':'full'}}); };

/* tilt: pointer on desktop, gyro on phones */
const _st3={raf:0,base:null,gyro:false};
function st3T(c){ return c._t||(c._t={x:0,y:0,tx:0,ty:0}); }
function st3Loop(){ let live=false;
  document.querySelectorAll('.st3').forEach(c=>{ const s=st3T(c); s.x+=(s.tx-s.x)*.1; s.y+=(s.ty-s.y)*.1; if(Math.abs(s.tx-s.x)>.002||Math.abs(s.ty-s.y)>.002) live=true; else { s.x=s.tx; s.y=s.ty; }
    c.style.setProperty('--ry',(s.x*16).toFixed(2)+'deg'); c.style.setProperty('--rx',(-s.y*12).toFixed(2)+'deg'); c.style.setProperty('--px',(s.x*14).toFixed(1)+'px'); c.style.setProperty('--py',(s.y*10).toFixed(1)+'px'); });
  _st3.raf=live?requestAnimationFrame(st3Loop):0; }
function st3Kick(){ if(!_st3.raf) _st3.raf=requestAnimationFrame(st3Loop); }
document.addEventListener('pointermove',e=>{ if(e.pointerType==='touch'||st3Still()) return; const c=e.target&&e.target.closest&&e.target.closest('.st3'); if(!c) return; const r=c.getBoundingClientRect(); const nx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)), ny=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1)); const s=st3T(c); s.tx=nx; s.ty=ny;
  c.style.setProperty('--mx',((nx+1)*50).toFixed(1)+'%'); c.style.setProperty('--my',((ny+1)*50).toFixed(1)+'%'); st3Kick(); },{passive:true});
document.addEventListener('pointerout',e=>{ const c=e.target&&e.target.closest&&e.target.closest('.st3'); if(!c||(e.relatedTarget&&c.contains(e.relatedTarget))) return; const s=st3T(c); s.tx=0; s.ty=0; st3Kick(); });
function st3Gyro(e){ if((state.view!=='studios'&&state.view!=='game')||e.gamma==null||st3Still()||!gyAllowed()) return; if(!_st3.gyro){ _st3.gyro=true; document.documentElement.classList.add('st3-gyro'); const b=document.querySelector('[data-act="st3-tilt"]'); if(b) b.remove(); }
  if(!_st3.base) _st3.base={b:e.beta||0,g:e.gamma||0}; const gx=Math.max(-1,Math.min(1,(e.gamma-_st3.base.g)/22)), by=Math.max(-1,Math.min(1,((e.beta||0)-_st3.base.b)/22));
  document.querySelectorAll('.st3').forEach(c=>{ const s=st3T(c); s.tx=gx; s.ty=by; }); st3Kick(); }
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-act="st3-tilt"]'); if(!b) return; e.stopPropagation(); gyRequest(()=>b.remove()); },true);

/* image picker: input lives in the page (iPhone Safari drops detached pickers), HEIC photos get converted */
const IS_EXT=/\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)$/i;
function isOkImg(f){ return /^image\//.test(f.type||'')||IS_EXT.test(f.name||''); }
function isHeic(f){ return /hei[cf]/i.test(f.type||'')||/\.(heic|heif)$/i.test(f.name||''); }
function isPickImage(cb){ const old=document.getElementById('is-pick-inp'); if(old) old.remove();
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.id='is-pick-inp'; inp.setAttribute('data-testid','is-file-input'); inp.setAttribute('aria-hidden','true'); inp.tabIndex=-1;
  inp.style.cssText='position:fixed;left:-300vw;top:0;width:1px;height:1px;opacity:0;pointer-events:none;'; document.body.appendChild(inp);
  inp.addEventListener('change',()=>{ const f=inp.files&&inp.files[0]; setTimeout(()=>{ try{ inp.remove(); }catch(e){} },0); if(f) cb(f); });
  inp.addEventListener('cancel',()=>{ try{ inp.remove(); }catch(e){} }); inp.click(); }
function isDecodes(u){ return new Promise(r=>{ const im=new Image(); im.onload=()=>r(im.naturalWidth>0); im.onerror=()=>r(false); im.src=u; }); }
let _heicP=null;
function isHeicLib(){ if(window.heic2any) return Promise.resolve(); if(!_heicP) _heicP=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js'; s.async=true; s.onload=()=>res(); s.onerror=()=>{ _heicP=null; s.remove(); rej(new Error('heic')); }; document.head.appendChild(s); }); return _heicP; }
async function isFileUrl(f){ const u=URL.createObjectURL(f); if(await isDecodes(u)) return u; try{ URL.revokeObjectURL(u); }catch(e){} if(!isHeic(f)) throw new Error('decode');
  toast('Converting your photo','HEIC photos take a moment'); await isHeicLib(); const b=await window.heic2any({blob:f,toType:'image/jpeg',quality:.92}); return URL.createObjectURL(Array.isArray(b)?b[0]:b); }
function isTakeFile(f,open){ if(!isOkImg(f)){ toast('Pick an image','JPG, PNG, WebP, GIF or HEIC'); return; } if(f.size>25*1024*1024){ toast('Image too large','Use one under 25 MB'); return; }
  const name=(f.name||'Image').replace(/\.[^.]+$/,'').slice(0,60)||'Image';
  isFileUrl(f).then(u=>open(u,name)).catch(()=>toast('Couldn\u2019t open that image',isHeic(f)?'Go online to convert HEIC photos, or pick a JPG':'Try a JPG or PNG')); }
isFileOpen=function(){ isPickImage(f=>{ closeModal(); isTakeFile(f,(u,name)=>isOpenProject({src:u,own:true,name})); }); };
