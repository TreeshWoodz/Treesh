/* ---------- P9p: birthdays (startup celebration + profile indicators) ---------- */
function bdMd(b){ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(b||'')); return m&&+m[2]>=1&&+m[2]<=12&&+m[3]>=1&&+m[3]<=31?m[2]+'-'+m[3]:''; }
function bdIsToday(md){ if(!/^\d{2}-\d{2}$/.test(String(md||''))) return false; const n=new Date(), t=String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0'); if(md===t) return true;
  const y=n.getFullYear(), leap=(y%4===0&&y%100!==0)||y%400===0; return md==='02-29'&&!leap&&t==='02-28'; }
function bdMine(){ return bdIsToday(bdMd((state.profile||{}).birthday)); }
function bdAge(b){ const y=+String(b||'').slice(0,4), n=new Date().getFullYear()-y; return y>1900&&n>0&&n<120?n:0; }
function bdOrd(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }

let _bdRaf=0;
function bdOpen(){ if(document.getElementById('bd-ov')) return; const p=state.profile||{}; const nick=p.nickname&&p.nickname!=='Treesh Fan'?p.nickname:'superstar', age=bdAge(p.birthday), z=zodiac(p.birthday||''), zi=z?ZH_IC[ZH_SIGNS.findIndex(x=>x[1]===z)]||'sparkle':'';
  const el=document.createElement('div'); el.id='bd-ov'; el.className='bd-ov'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-labelledby','bd-title'); el.setAttribute('data-testid','birthday-modal');
  el.innerHTML=`<div class="bd-bd" data-act="bd-close" data-testid="birthday-backdrop"></div><div class="bd-balloons" aria-hidden="true">${[0,1,2,3,4,5,6].map(i=>`<span class="bd-bl b${i}"></span>`).join('')}</div><canvas class="bd-fx" aria-hidden="true"></canvas>
   <div class="bd-card" data-testid="birthday-card"><span class="bd-shine" aria-hidden="true"></span>
     <button type="button" data-act="bd-close" class="bd-x press" aria-label="Close" data-testid="birthday-close"><i data-lucide="x"></i></button>
     <button type="button" data-act="bd-wish" class="bd-cake" aria-label="Make a wish and blow out the candles" data-testid="birthday-cake"><span class="bd-candles"><i></i><i></i><i></i></span><span class="bd-tier t2"></span><span class="bd-tier t1"></span><span class="bd-plate"></span></button>
     <p class="bd-k font-doto" data-testid="birthday-kicker">${age?'Turning '+age+' today':'It\u2019s your day'}</p>
     <h2 id="bd-title" class="bd-t" data-testid="birthday-title">Happy Birthday,<span>${esc(nick)}!</span></h2>
     <p class="bd-s" id="bd-sub" data-testid="birthday-sub">${age?'Happy '+bdOrd(age)+'! ':''}Everyone at Treesh is celebrating you. Make a wish, then tap the cake to blow out the candles.</p>
     ${z?`<span class="bd-z" data-testid="birthday-zodiac"><i data-lucide="${zi}"></i>A very ${esc(z)} birthday</span>`:''}
     <div class="bd-acts"><button type="button" data-act="bd-play" class="bd-btn is-primary press" data-testid="birthday-play"><i data-lucide="party-popper"></i>Play a party mix</button><button type="button" data-act="bd-close" class="bd-btn press" data-testid="birthday-thanks">Thank you!</button></div>
   </div>`;
  document.body.appendChild(el); icons(); const cv=el.querySelector('.bd-fx'); if(!bdCalm()) requestAnimationFrame(()=>bdConfetti(cv,null)); setTimeout(()=>{ const b=el.querySelector('[data-testid="birthday-thanks"]'); if(b) try{ b.focus({preventScroll:true}); }catch(e){} },500); }
function bdCalm(){ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
function bdClose(){ const el=document.getElementById('bd-ov'); if(!el||el.classList.contains('is-out')) return; el.classList.add('is-out'); setTimeout(()=>{ cancelAnimationFrame(_bdRaf); _bdRaf=0; el.remove(); },320); }
function bdWish(){ const el=document.getElementById('bd-ov'); if(!el) return; const first=!el.classList.contains('is-wished'); el.classList.add('is-wished');
  if(first){ const s=document.getElementById('bd-sub'); if(s) s.textContent='Wish made. Here\u2019s to your best year yet!'; const k=el.querySelector('.bd-k'); if(k) k.textContent='Wish granted'; }
  const c=el.querySelector('.bd-cake').getBoundingClientRect(); if(!bdCalm()) bdConfetti(el.querySelector('.bd-fx'),{x:c.left+c.width/2,y:c.top+c.height*.3}); }
function bdConfetti(cv,at){ if(!cv) return; const ctx=cv.getContext('2d'), dpr=Math.min(2,window.devicePixelRatio||1), W=cv.clientWidth, H=cv.clientHeight; if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); } ctx.setTransform(dpr,0,0,dpr,0,0);
  const acc=(getComputedStyle(document.documentElement).getPropertyValue('--treesh-purple')||'').trim()||'#a78bfa', C=['#ff2d78','#ffd23f','#22d3ee','#34d399','#fb923c',acc,'#ffffff'], P=cv._p||(cv._p=[]), R=Math.random;
  const add=(x,y,vx,vy)=>P.push({x,y,vx,vy,w:5+R()*7,h:8+R()*8,r:R()*6.28,vr:(R()-.5)*.3,c:C[(R()*C.length)|0],k:(R()*3)|0,ph:R()*6.28});
  if(at){ for(let i=0;i<110;i++){ const a=R()*6.28, s=4+R()*9; add(at.x,at.y,Math.cos(a)*s,Math.sin(a)*s-5); } }
  else { for(let i=0;i<70;i++){ const l=i%2===0, s=9+R()*9, a=(l?-1.1:-2.04)+(R()-.5)*.6; add(l?-10:W+10,H*.72,Math.cos(a)*s,Math.sin(a)*s); } cv._rain=performance.now()+3800; }
  if(_bdRaf) return; let f=0;
  const step=()=>{ f++; ctx.clearRect(0,0,W,H); if(cv._rain&&performance.now()<cv._rain&&f%2===0) for(let i=0;i<3;i++) add(R()*W,-20,(R()-.5)*1.5,1+R()*2);
    for(let i=P.length-1;i>=0;i--){ const q=P[i]; q.vy+=.16; q.vx*=.985; q.vy*=.985; q.x+=q.vx+Math.sin(f*.05+q.ph)*.7; q.y+=q.vy; q.r+=q.vr; if(q.y>H+30){ P.splice(i,1); continue; }
      ctx.save(); ctx.translate(q.x,q.y); ctx.rotate(q.r); ctx.fillStyle=q.c; if(q.k===0) ctx.fillRect(-q.w/2,-q.h/2,q.w,q.h*Math.abs(Math.cos(f*.08+q.ph))); else if(q.k===1){ ctx.beginPath(); ctx.arc(0,0,q.w/2.4,0,6.28); ctx.fill(); } else { ctx.fillRect(-q.w*.9,-1.6,q.w*1.8,3.2); } ctx.restore(); }
    if(P.length&&document.getElementById('bd-ov')) _bdRaf=requestAnimationFrame(step); else { _bdRaf=0; ctx.clearRect(0,0,W,H); } };
  _bdRaf=requestAnimationFrame(step); }
function bdCheck(){ if(!bdMine()) return; const yr=String(new Date().getFullYear()); if(localStorage.getItem('treesh_bday_seen')===yr) return; let n=0;
  const tick=()=>{ if(!bdMine()||localStorage.getItem('treesh_bday_seen')===yr) return; if(overlaysOpen()||document.querySelector('[data-testid="onboarding-footer"]')){ if(++n<60) setTimeout(tick,1500); return; } localStorage.setItem('treesh_bday_seen',yr); bdOpen(); };
  setTimeout(tick,900); }
const _p9Init9p=p9Init; p9Init=function(){ const r=_p9Init9p.apply(this,arguments); bdCheck(); return r; };

/* own profile: birthday chip (tap to replay the celebration) */
const _sph9p=settingsProfileHtml; settingsProfileHtml=function(editing){ const h=_sph9p.apply(this,arguments); if(editing||!bdMine()) return h;
  return h.replace('<div class="tl-row">','<div class="tl-row"><button type="button" data-act="bd-open" data-testid="profile-birthday-chip" class="bd-chip press"><i data-lucide="cake"></i>Happy birthday!</button>'); };

document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act^="bd-"]'); if(!t) return; const a=t.dataset.act;
  if(a==='bd-open'){ bdOpen(); return; } if(a==='bd-close'){ bdClose(); return; } if(a==='bd-wish'){ bdWish(); return; }
  if(a==='bd-play'){ const pool=vis(SONGS); bdClose(); if(!pool.length) return; state.shuffle=true; playSong(pool[Math.floor(Math.random()*pool.length)],pool); toast('Party mode on','Shuffling your library. Happy birthday!'); } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&document.getElementById('bd-ov')){ e.stopPropagation(); bdClose(); } },true);
