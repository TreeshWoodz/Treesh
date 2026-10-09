/* ---------- P9zx: Icon header photo. Phones fill with the mobile position (falls back to desktop), wide screens show the whole photo on a blurred copy ---------- */
const _pa9zx=parseArtists; parseArtists=function(doc){ const out=_pa9zx.apply(this,arguments), m={};
  try{ doc.querySelectorAll('article.artist').forEach(el=>{ const id=el.getAttribute('data-artist-id'); if(id) m[id]=(el.getAttribute('data-bg-pos-mobile')||'').trim(); }); }catch(e){}
  out.forEach(a=>{ a.bgPosMobile=m[a.id]||''; }); return out; };
/* same math as the M.A.D. tool: words and % as usual, legacy px offsets become a clamped % so the photo always fills */
const BN_KW={left:0,top:0,center:50,right:100,bottom:100};
function bnPosPct(v,iw,ih,cw,ch){ const t=String(v||'center').trim().toLowerCase().split(/\s+/).slice(0,2), out=[50,50], taken=[false,false];
  const s=iw&&ih&&cw&&ch?Math.max(cw/iw,ch/ih):0, over=[iw*s-cw,ih*s-ch], side=k=>k==='top'||k==='bottom'?1:k==='left'||k==='right'?0:-1;
  const val=(k,ax)=>{ let n=50; if(k in BN_KW) n=BN_KW[k]; else if(/%$/.test(k)) n=parseFloat(k); else if(/px$/.test(k)) n=over[ax]>0.5?-parseFloat(k)/over[ax]*100:50; return Math.max(0,Math.min(100,isNaN(n)?50:n)); };
  t.forEach(k=>{ const ax=side(k); if(ax>=0){ out[ax]=val(k,ax); taken[ax]=true; } });
  t.forEach(k=>{ if(side(k)>=0) return; const ax=taken[0]?1:0; if(taken[ax]) return; out[ax]=val(k,ax); taken[ax]=true; });
  return out.map(n=>Math.round(n*10)/10); }
function arHeroFitOne(bg){ const im=bg.querySelector('.ar-hero-photo'); if(!im) return;
  if(!im.complete||!im.naturalWidth){ if(!im._arw){ im._arw=1; im.addEventListener('load',()=>arHeroFitOne(bg),{once:true}); } return; }
  const cw=bg.clientWidth, ch=bg.clientHeight; if(!cw||!ch) return; const iw=im.naturalWidth, ih=im.naturalHeight, phone=innerWidth<640, r=(iw/ih)/(cw/ch);
  const whole=!phone&&(r<0.87||r>1.15), p=bnPosPct(phone?(bg.dataset.posM||bg.dataset.pos):bg.dataset.pos,iw,ih,cw,ch);
  bg.classList.toggle('is-whole',whole); bg.dataset.fit=whole?'whole':'fill'; bg.dataset.shown=p[0]+'% '+(whole?50:p[1])+'%';
  const S=im.style, M='linear-gradient('+(r<1?'90deg':'180deg')+',transparent,#000 9%,#000 91%,transparent)';
  if(whole){ const w=r<1?ch*iw/ih:cw, h=r<1?ch:cw*ih/iw; Object.assign(S,{position:'absolute',width:w+'px',height:h+'px',left:((cw-w)*p[0]/100)+'px',top:((ch-h)*(r<1?0.5:p[1]/100))+'px',objectFit:'cover',objectPosition:'50% 50%',webkitMaskImage:M,maskImage:M}); }
  else Object.assign(S,{position:'',width:'',height:'',left:'',top:'',webkitMaskImage:'',maskImage:'',objectFit:'cover',objectPosition:p[0]+'% '+p[1]+'%'});
  if(!bg._ro&&window.ResizeObserver){ bg._ro=new ResizeObserver(()=>{ clearTimeout(bg._rt); bg._rt=setTimeout(()=>{ if(bg.isConnected) arHeroFitOne(bg); },80); }); bg._ro.observe(bg); } }
function arHeroFit(){ document.querySelectorAll('[data-testid="artist-hero"] .ar-hero-bg').forEach(arHeroFitOne); }
const _rv9zx=renderView; renderView=function(){ const r=_rv9zx.apply(this,arguments); if(state.view==='artist') arHeroFit(); return r; };
