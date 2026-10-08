/* ---------- P9ze: What's New mixes app updates with new music, and slides follow your finger ---------- */
const WNU=[
  {id:'whatsnext',art:'whatsnext_main',k:'Game update',t:'What\u2019s Next? 2.0',d:'Text with your favorite artists and finish their lyrics in a real chat thread.',chips:['Group chats','Hints','Glass & neon'],cta:'Play now',ic:'message-circle-more',a:'#9328ff',b:'#ff3d9a',go:'wn'},
  {id:'image',art:'image_main',k:'New studio',t:'Image Studio',d:'Design covers, posts and stickers with layers, text and filters.',chips:['Layers','Stickers','Filters'],cta:'Start creating',ic:'wand-sparkles',a:'#ff2d78',b:'#ffb347',go:'image'},
  {id:'accounts',art:'',k:'Treesh accounts',t:'Online accounts',d:'Back up your profile, claim your @username and find your friends.',chips:['Cloud backup','@username','Friends'],cta:'Create account',ic:'cloud',a:'#22d3ee',b:'#6d5bff',go:'acct'},
  {id:'instrum',art:'instrum_main',k:'Studio update',t:'Instrum Groovebox',d:'Big pads, swipeable bars and a full timeline when you need it.',chips:['16 pads','Vocals','Timeline'],cta:'Make a beat',ic:'sliders-horizontal',a:'#f5c451',b:'#ff6b3d',go:'instrum'},
  {id:'tot',art:'tot_main',k:'Game update',t:'This or That',d:'Pick a vibe, set your skips and crown your champion.',chips:['Genres','Skips','Run length'],cta:'Start a battle',ic:'swords',a:'#6d5bff',b:'#22d3ee',go:'tot'}];
const _bwn9ze=buildWhatsNew; buildWhatsNew=function(){ const m=_bwn9ze.apply(this,arguments)||[], u=WNU.map(x=>({kind:'update',u:x})), out=[];
  for(let i=0;i<Math.max(u.length,m.length);i++){ if(u[i]) out.push(u[i]); if(m[i]) out.push(m[i]); } return out.slice(0,12); };
function wnuSlide(x){ const u=x.u, signed=typeof sbUser==='function'&&sbUser(), art=u.art&&ST3_ART[u.art];
  return `<div class="wn-slide wnu w-full shrink-0 px-0.5" data-testid="whats-new-update-${u.id}"><div class="wnu-card dark-surface" style="--a:${u.a};--b:${u.b}">
    <span class="wnu-glow is-a"></span><span class="wnu-glow is-b"></span><span class="wnu-grid"></span>
    <div class="wnu-art">${art?`<img src="${art}" alt="" draggable="false">`:`<span class="wnu-glyph"><i data-lucide="${u.ic}"></i><b><i data-lucide="user-round"></i></b></span>`}</div>
    <div class="wnu-copy"><span class="wnu-k" style="--d:0"><i data-lucide="${u.ic}"></i>${u.k}<em>New</em></span><h3 class="wnu-t" style="--d:1">${u.t}</h3><p class="wnu-d" style="--d:2">${u.d}</p>
      <div class="wnu-chips" style="--d:3">${u.chips.map(c=>`<span>${c}</span>`).join('')}</div>
      <button type="button" data-act="wnu-go" data-val="${u.go}" data-testid="whats-new-cta-${u.id}" class="wnu-cta press" style="--d:4">${u.go==='acct'&&signed?'Open profile':u.cta}<i data-lucide="arrow-right"></i></button></div>
  </div></div>`; }
const _wns9ze=wnSlide; wnSlide=function(item){ return item&&item.kind==='update'?wnuSlide(item):_wns9ze.apply(this,arguments); };
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="wnu-go"]'); if(!t) return; const v=t.dataset.val; stopWN();
  if(v==='wn'||v==='tot') wlOpen(v); else if(v==='image') openImageStudioFree(); else if(v==='instrum') navigate('instrum');
  else if(v==='acct'){ if(sbUser()) openProfile(); else sbAuthOpen('signup'); } });

/* finger swipe */
function wnuSwipe(){ const vp=document.querySelector('.wn-viewport'), tr=document.getElementById('wn-track'); if(!vp||!tr||vp._sw) return; vp._sw=1;
  let x0=0, y0=0, dx=0, t0=0, on=false, lock=null, w=1;
  vp.addEventListener('touchstart',e=>{ if(e.touches.length!==1) return; const t=e.touches[0]; x0=t.clientX; y0=t.clientY; dx=0; t0=performance.now(); on=true; lock=null; w=vp.clientWidth||1; stopWN(); },{passive:true});
  vp.addEventListener('touchmove',e=>{ if(!on) return; const t=e.touches[0], mx=t.clientX-x0, my=t.clientY-y0;
    if(lock===null){ if(Math.abs(mx)<6&&Math.abs(my)<6) return; lock=Math.abs(mx)>Math.abs(my)?'x':'y'; if(lock==='x'){ tr.style.transition='none'; vp.classList.add('is-drag'); } }
    if(lock!=='x') return; if(e.cancelable) e.preventDefault(); const i=state.wnIndex||0, n=state._wnCount||1; dx=((i===0&&mx>0)||(i===n-1&&mx<0))?mx*0.35:mx;
    tr.style.transform=`translateX(calc(${-i*100}% + ${dx}px))`; },{passive:false});
  const end=()=>{ if(!on) return; on=false; vp.classList.remove('is-drag'); tr.style.transition='transform .55s cubic-bezier(.22,1,.36,1)';
    if(lock==='x'){ const v=Math.abs(dx)/Math.max(1,performance.now()-t0), go=Math.abs(dx)>w*0.16||v>0.45; vp._moved=Math.abs(dx)>8; goWN((state.wnIndex||0)+(go?(dx<0?1:-1):0)); setTimeout(()=>{ vp._moved=false; },80); }
    else startWN(); lock=null; };
  vp.addEventListener('touchend',end); vp.addEventListener('touchcancel',end);
  vp.addEventListener('click',e=>{ if(vp._moved){ e.preventDefault(); e.stopPropagation(); } },true); }
const _wire9ze=wireWN; wireWN=function(){ const r=_wire9ze.apply(this,arguments); try{ wnuSwipe(); }catch(e){} return r; };
