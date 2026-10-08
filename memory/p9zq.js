/* ---------- P9zq: Lyric Card styles that match the lyric themes (Classic keeps every existing option) ---------- */
const LC_IMG={};
function lcImg(url){ if(!url) return null; let r=LC_IMG[url]; if(r) return r; r=LC_IMG[url]={ok:false,img:null}; const im=new Image(); im.crossOrigin='anonymous';
  im.onload=()=>{ r.ok=true; r.img=im; try{ drawLyricCard(); }catch(e){} }; im.onerror=()=>{ r.bad=true; }; im.src=url; return r; }
function lcGroups(s){ const L=s.lyrics||[], groups=[]; let cur=null;
  cardLines().forEach(x=>{ const ln=L[x.i]||{}, text=origLineTextFor(s.id,x.i,x.text!=null?x.text:''); if(!text||!text.trim()||/^\s*\[[^\]]*\]\s*$/.test(text)) return;
    const sec=ln.sec||null; if(!cur||cur.sec!==sec){ cur={sec,i:x.i,lines:[]}; groups.push(cur); } cur.lines.push(text); });
  groups.forEach(g=>{ const by=wcLineBy(s,L,g.i); g.by=by; g.face=by?wcByFace(by,s):s; });
  return groups.length?groups:[{sec:null,lines:['Add lyrics to feature\u2026'],face:s,by:null}]; }
function lcRand(seed){ let a=0; for(const c of String(seed)) a=(a*31+c.charCodeAt(0))|0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function lcFit(ctx,lines,font,maxW,maxH,lhK,start,min){ let fs=start, rows=[];
  for(;fs>=min;fs-=2){ ctx.font=font(fs); rows=lines.flatMap(t=>wrapCanvasText(ctx,[t],maxW)); if(rows.length*fs*lhK<=maxH) break; } if(fs<min){ fs=min; ctx.font=font(fs); rows=lines.flatMap(t=>wrapCanvasText(ctx,[t],maxW)); } return {fs,rows}; }
function lcAvatar(ctx,face,x,y,r){ const src=wnAvSrc(face), rec=src?lcImg(src):null; ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.closePath();
  const g=ctx.createLinearGradient(x,y-r,x,y+r); g.addColorStop(0,'#a1a1a8'); g.addColorStop(1,'#636369'); ctx.fillStyle=g; ctx.fill();
  if(rec&&rec.ok){ ctx.clip(); drawImageCover(ctx,rec.img,x-r,y-r,r*2,r*2); } else { ctx.fillStyle='#fff'; ctx.font=`700 ${Math.round(r*0.78)}px Manrope, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(wnIni(face.artist||face.title||'T'),x,y+1); }
  ctx.restore(); ctx.textAlign='left'; ctx.textBaseline='alphabetic'; }
function lcBox(st,x,y,w,h){ st._lb={x:x+(+st.lyricDX||0),y:y+(+st.lyricDY||0),w:Math.max(60,w),h:Math.max(40,h)}; }
const lcMove=(ctx,st)=>ctx.translate(+st.lyricDX||0,+st.lyricDY||0);
const lcFlat=G=>G.flatMap(g=>g.lines);
const W1=1080;

const LCP={
chat(ctx,s,st,G){ const bg=ctx.createLinearGradient(0,0,0,W1); bg.addColorStop(0,'#0c0b16'); bg.addColorStop(1,'#050509'); ctx.fillStyle=bg; ctx.fillRect(0,0,W1,W1);
  const gl=ctx.createRadialGradient(540,0,40,540,0,620); gl.addColorStop(0,'rgba(147,40,255,.32)'); gl.addColorStop(1,'rgba(147,40,255,0)'); ctx.fillStyle=gl; ctx.fillRect(0,0,W1,W1);
  lcAvatar(ctx,s,540,96,52); ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.font='700 32px Manrope, sans-serif'; ctx.fillText(wcGroupName([s]).slice(0,40),540,190);
  ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='500 22px Manrope, sans-serif'; ctx.fillText('Text Message \u00b7 '+(s.title||'').slice(0,34),540,224); ctx.textAlign='left';
  ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(0,256,W1,2);
  const X=150, MAXW=700, TOP=290, AV=34, me=getComputedStyle(document.documentElement).getPropertyValue('--treesh-purple').trim()||'#9328ff';
  const lay=fs=>{ ctx.font=`500 ${fs}px Manrope, sans-serif`; let h=0; const out=G.map((g,gi)=>{ const showName=G.length>1||!!g.by; const bs=g.lines.map(t=>{ const rows=wrapCanvasText(ctx,[t],MAXW-56); const w=Math.min(MAXW,Math.max(...rows.map(r=>ctx.measureText(r).width))+56); return {rows,w,h:rows.length*fs*1.3+34}; });
      const gh=(showName?36:0)+bs.reduce((a,b)=>a+b.h,0)+(bs.length-1)*8; h+=gh+(gi?26:0); return {g,bs,showName}; }); return {out,h:h+92}; };
  let fs=50, L=lay(fs); while(fs>22&&L.h>650){ fs-=2; L=lay(fs); }
  ctx.save(); lcMove(ctx,st); let y=TOP+Math.max(0,(650-L.h)/2); lcBox(st,AV*2,y,MAXW+X-AV*2,L.h);
  L.out.forEach((o,gi)=>{ if(gi) y+=26; if(o.showName){ ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='600 24px Manrope, sans-serif'; ctx.fillText((o.g.face.artist||'Artist').slice(0,40),X+14,y+24); y+=36; }
    o.bs.forEach((b,bi)=>{ const last=bi===o.bs.length-1; ctx.save(); ctx.fillStyle='#2a2930'; ctx.beginPath(); const r=34, x=X, w=b.w, h=b.h; ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,last?10:r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=2; ctx.stroke(); ctx.restore();
      ctx.fillStyle='#fff'; ctx.font=`500 ${fs}px Manrope, sans-serif`; ctx.textBaseline='top'; b.rows.forEach((row,k)=>ctx.fillText(row,X+28,y+17+k*fs*1.3+fs*0.08)); ctx.textBaseline='alphabetic';
      if(last) lcAvatar(ctx,o.g.face,X-AV-16,y+b.h-AV,AV); y+=b.h+(last?0:8); }); });
  y+=22; ctx.fillStyle='#2a2930'; roundRectPath(ctx,X,y,128,64,32); ctx.fill(); [0,1,2].forEach(k=>{ ctx.beginPath(); ctx.arc(X+38+k*26,y+32,8,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${.35+k*.2})`; ctx.fill(); });
  ctx.restore();
  ctx.fillStyle=me; ctx.font='800 22px Manrope, sans-serif'; ctx.fillText('T R E E S H   \u00b7   L Y R I C S',96,1030); ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='600 22px Manrope, sans-serif'; ctx.fillText(((s.title||'')+' \u00b7 '+(s.artist||'')).slice(0,46),984,1030); ctx.textAlign='left'; },
neon(ctx,s,st,G){ ctx.fillStyle='#07020f'; ctx.fillRect(0,0,W1,W1); const hz=760;
  const sun=ctx.createRadialGradient(540,hz,10,540,hz,420); sun.addColorStop(0,'rgba(255,45,120,.45)'); sun.addColorStop(1,'rgba(255,45,120,0)'); ctx.fillStyle=sun; ctx.fillRect(0,0,W1,W1);
  ctx.strokeStyle='rgba(255,45,120,.4)'; ctx.lineWidth=2; for(let i=-12;i<=12;i++){ ctx.beginPath(); ctx.moveTo(540,hz); ctx.lineTo(540+i*140,W1); ctx.stroke(); } for(let k=1;k<9;k++){ const yy=hz+Math.pow(k/8,2)*(W1-hz); ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(W1,yy); ctx.stroke(); }
  const glow=(t,x,y,c)=>{ ctx.shadowColor=c; ctx.shadowBlur=44; ctx.fillText(t,x,y); ctx.shadowBlur=14; ctx.fillText(t,x,y); ctx.shadowBlur=0; };
  ctx.textAlign='center'; ctx.font='800 28px Manrope, sans-serif'; ctx.fillStyle='#d9fbff'; glow('T R E E S H   \u00b7   N E O N',540,120,'#22d3ee');
  const lines=lcFlat(G).map(t=>t.toUpperCase()); const F=fs=>`800 ${fs}px Manrope, sans-serif`; const fit=lcFit(ctx,lines,F,880,520,1.24,92,30);
  ctx.save(); lcMove(ctx,st); let y=200+Math.max(0,(520-fit.rows.length*fit.fs*1.24)/2)+fit.fs; lcBox(st,100,y-fit.fs,880,fit.rows.length*fit.fs*1.24);
  ctx.font=F(fit.fs); fit.rows.forEach((r,i)=>{ const c=i%2?'#22d3ee':'#ff2d78'; ctx.fillStyle=i%2?'#effdff':'#fff0f7'; glow(r,540,y,c); y+=fit.fs*1.24; }); ctx.restore();
  ctx.font='800 42px Manrope, sans-serif'; ctx.fillStyle='#fff0f7'; glow((s.title||'').slice(0,30),540,960,'#ff2d78'); ctx.font='700 28px Manrope, sans-serif'; ctx.fillStyle='#effdff'; glow((s.artist||'').slice(0,40),540,1008,'#22d3ee'); ctx.textAlign='left'; },
type(ctx,s,st,G){ const R=lcRand(s.id); ctx.fillStyle='#f3ead7'; ctx.fillRect(0,0,W1,W1); for(let i=0;i<1600;i++){ ctx.fillStyle=`rgba(90,60,20,${.04+R()*.08})`; ctx.fillRect(R()*W1,R()*W1,1+R()*2,1+R()*2); }
  const vg=ctx.createRadialGradient(540,500,300,540,540,780); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(110,80,30,.35)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W1,W1);
  const FAM="'Special Elite', 'Courier New', monospace"; ctx.fillStyle='#9a2b1f'; ctx.font=`32px ${FAM}`; ctx.fillText('TREESH LYRICS',110,150); ctx.textAlign='right'; ctx.fillText('No. '+(100+Math.floor(R()*900)),970,150); ctx.textAlign='left'; ctx.fillStyle='#1d1a17'; ctx.fillRect(110,172,860,3);
  const F=fs=>`${fs}px ${FAM}`, fit=lcFit(ctx,lcFlat(G),F,860,600,1.5,64,26);
  ctx.save(); lcMove(ctx,st); let y=250+Math.max(0,(600-fit.rows.length*fit.fs*1.5)/2)+fit.fs; lcBox(st,110,y-fit.fs,860,fit.rows.length*fit.fs*1.5); ctx.font=F(fit.fs);
  fit.rows.forEach(r=>{ let x=110; for(const ch of r){ ctx.fillStyle=`rgba(29,26,23,${.78+R()*.22})`; ctx.fillText(ch,x+(R()-.5)*1.4,y+(R()-.5)*1.6); x+=ctx.measureText(ch).width; } y+=fit.fs*1.5; });
  const lr=fit.rows[fit.rows.length-1]||''; ctx.fillStyle='#1d1a17'; ctx.fillRect(110+ctx.measureText(lr).width+6,y-fit.fs*1.5-fit.fs*0.78,fit.fs*0.5,fit.fs*0.95); ctx.restore();
  ctx.fillStyle='#3a332c'; ctx.font=`30px ${FAM}`; ctx.fillText(('\u2014 '+(s.title||'')+', '+(s.artist||'')).slice(0,44),110,960);
  ctx.save(); ctx.translate(900,930); ctx.rotate(-0.21); ctx.strokeStyle='rgba(179,38,30,.8)'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(0,0,72,0,Math.PI*2); ctx.stroke(); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,60,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(179,38,30,.85)'; ctx.font=`26px ${FAM}`; ctx.textAlign='center'; ctx.fillText('TREESH',0,9); ctx.restore(); ctx.textAlign='left'; },
note(ctx,s,st,G){ ctx.fillStyle='#fdfbf3'; ctx.fillRect(0,0,W1,W1); ctx.fillStyle='rgba(59,130,246,.32)'; for(let y=232;y<W1;y+=64) ctx.fillRect(0,y,W1,2); ctx.fillStyle='rgba(239,68,68,.6)'; ctx.fillRect(150,0,3,W1);
  for(let y=70;y<W1;y+=110){ ctx.beginPath(); ctx.arc(70,y,16,0,Math.PI*2); ctx.fillStyle='#e6dfcb'; ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=2; ctx.stroke(); }
  const FAM="'Caveat', 'Comic Sans MS', cursive"; ctx.fillStyle='#dc2626'; ctx.font=`700 52px ${FAM}`; ctx.fillText(('\u201c'+(s.title||'')+'\u201d').slice(0,34),186,160);
  ctx.strokeStyle='#dc2626'; ctx.lineWidth=4; ctx.beginPath(); const hx=950, hy=130; ctx.moveTo(hx,hy+22); ctx.bezierCurveTo(hx-46,hy-10,hx-20,hy-44,hx,hy-16); ctx.bezierCurveTo(hx+20,hy-44,hx+46,hy-10,hx,hy+22); ctx.stroke();
  const F=fs=>`700 ${fs}px ${FAM}`; let fs=60, rows=[]; for(;fs>=32;fs-=2){ ctx.font=F(fs); rows=lcFlat(G).flatMap(t=>wrapCanvasText(ctx,[t],820)); if(rows.length*64<=640) break; }
  ctx.save(); lcMove(ctx,st); const y0=232+64*Math.max(0,Math.floor((10-rows.length)/2)); lcBox(st,186,y0-46,820,rows.length*64); ctx.font=F(fs);
  if(rows[0]){ ctx.fillStyle='rgba(253,224,71,.75)'; ctx.save(); ctx.translate(180,y0-30); ctx.rotate(-0.012); ctx.fillRect(0,0,ctx.measureText(rows[0]).width+24,30); ctx.restore(); }
  rows.forEach((r,i)=>{ ctx.fillStyle='#1f3a93'; ctx.fillText(r,190,y0-12+i*64); }); ctx.restore();
  ctx.textAlign='right'; ctx.fillStyle='#1f3a93'; ctx.font=`700 44px ${FAM}`; ctx.fillText(('\u2014 '+(s.artist||'')).slice(0,36),980,1010); ctx.textAlign='left'; ctx.fillStyle='rgba(31,58,147,.55)'; ctx.font=`700 26px ${FAM}`; ctx.fillText('treesh lyrics',186,1010); },
term(ctx,s,st,G){ const bg=ctx.createRadialGradient(540,540,80,540,540,820); bg.addColorStop(0,'#06301a'); bg.addColorStop(1,'#010805'); ctx.fillStyle=bg; ctx.fillRect(0,0,W1,W1);
  const FAM="'VT323', 'Courier New', monospace", sh=(c,b)=>{ ctx.shadowColor=c; ctx.shadowBlur=b; };
  const hd='treesh@lyrics:~$ cat "'+(s.title||'song').slice(0,40)+'.txt"'; let hf=40; ctx.font=`${hf}px ${FAM}`; while(hf>22&&ctx.measureText(hd).width>920){ hf-=2; ctx.font=`${hf}px ${FAM}`; } ctx.fillStyle='#7dffa0'; sh('rgba(51,255,102,.7)',12); ctx.fillText(hd,80,130); ctx.fillStyle='rgba(125,255,160,.6)'; ctx.font=`32px ${FAM}`; ctx.fillText(('-- '+(s.artist||'')+' --').slice(0,50),80,176);
  const F=fs=>`${fs}px ${FAM}`, fit=lcFit(ctx,lcFlat(G).map(t=>'> '+t),F,920,640,1.15,78,32);
  ctx.save(); lcMove(ctx,st); let y=240+fit.fs; lcBox(st,80,240,920,fit.rows.length*fit.fs*1.15); ctx.font=F(fit.fs);
  fit.rows.forEach((r,i)=>{ const last=i===fit.rows.length-1; ctx.fillStyle=last?'#c8ffd6':'#33ff66'; sh(last?'rgba(51,255,102,.95)':'rgba(51,255,102,.55)',last?18:10); ctx.fillText(r,80,y); if(last){ ctx.fillStyle='#33ff66'; ctx.fillRect(80+ctx.measureText(r).width+8,y-fit.fs*0.72,fit.fs*0.5,fit.fs*0.82); } y+=fit.fs*1.15; }); ctx.restore();
  sh('transparent',0); ctx.fillStyle='rgba(0,0,0,.28)'; for(let yy=0;yy<W1;yy+=4) ctx.fillRect(0,yy,W1,2);
  ctx.font=`34px ${FAM}`; ctx.fillStyle='#7dffa0'; sh('rgba(51,255,102,.6)',10); ctx.fillText('treesh@lyrics:~$ exit 0',80,1010); ctx.textAlign='right'; ctx.fillText('TREESH',1000,1010); ctx.textAlign='left'; sh('transparent',0); },
comic(ctx,s,st,G){ ctx.fillStyle='#ffd84a'; ctx.fillRect(0,0,W1,W1); ctx.fillStyle='rgba(255,80,140,.45)'; for(let y=0;y<W1;y+=20) for(let x=(y/20)%2?10:0;x<W1;x+=20){ ctx.beginPath(); ctx.arc(x,y,3.4,0,Math.PI*2); ctx.fill(); }
  const FAM="'Bangers', Impact, sans-serif";
  ctx.save(); ctx.translate(880,150); ctx.beginPath(); for(let i=0;i<28;i++){ const a=i/28*Math.PI*2, r=i%2?78:128; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fillStyle='#ff4d8d'; ctx.fill(); ctx.lineWidth=7; ctx.strokeStyle='#111'; ctx.stroke(); ctx.rotate(-0.18); ctx.font=`44px ${FAM}`; ctx.textAlign='center'; ctx.lineWidth=8; ctx.strokeText('TREESH!',0,14); ctx.fillStyle='#fff'; ctx.fillText('TREESH!',0,14); ctx.restore(); ctx.textAlign='left';
  const lines=lcFlat(G).map(t=>t.toUpperCase()), F=fs=>`${fs}px ${FAM}`; let fs=66, L=[];
  const lay=()=>{ ctx.font=F(fs); L=lines.map(t=>{ const rows=wrapCanvasText(ctx,[t],700); return {rows,w:Math.max(...rows.map(r=>ctx.measureText(r).width))+70,h:rows.length*fs*1.1+44}; }); return L.reduce((a,b)=>a+b.h+40,0); };
  while(fs>26&&lay()>620) fs-=2;
  ctx.save(); lcMove(ctx,st); let y=280+Math.max(0,(620-L.reduce((a,b)=>a+b.h+40,0))/2); lcBox(st,80,y,920,L.reduce((a,b)=>a+b.h+40,0));
  L.forEach((b,i)=>{ const right=i%2===1, x=right?W1-80-b.w:80; ctx.save(); ctx.translate(x+b.w/2,y+b.h/2); ctx.rotate(right?0.02:-0.02); ctx.translate(-b.w/2,-b.h/2);
    ctx.fillStyle='#111'; roundRectPath(ctx,10,10,b.w,b.h,40); ctx.fill(); ctx.fillStyle=i===L.length-1?'#fff7a8':'#fff'; roundRectPath(ctx,0,0,b.w,b.h,40); ctx.fill(); ctx.lineWidth=7; ctx.strokeStyle='#111'; ctx.stroke();
    ctx.beginPath(); const tx=right?b.w-70:50; ctx.moveTo(tx,b.h-4); ctx.lineTo(tx+(right?24:-6),b.h+30); ctx.lineTo(tx+30,b.h-4); ctx.closePath(); ctx.fillStyle=i===L.length-1?'#fff7a8':'#fff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle='#111'; ctx.font=F(fs); ctx.textBaseline='top'; b.rows.forEach((r,k)=>ctx.fillText(r,35,22+k*fs*1.1)); ctx.textBaseline='alphabetic'; ctx.restore(); y+=b.h+40; }); ctx.restore();
  ctx.fillStyle='#111'; ctx.fillRect(0,930,W1,150); ctx.fillStyle='#ffd84a'; ctx.font=`58px ${FAM}`; ctx.fillText((s.title||'').toUpperCase().slice(0,26),80,1002); ctx.fillStyle='#fff'; ctx.font=`34px ${FAM}`; ctx.fillText((s.artist||'').toUpperCase().slice(0,40),80,1048); },
pola(ctx,s,st,G){ const R=lcRand(s.id+'p'); const bg=ctx.createLinearGradient(0,0,W1,W1); bg.addColorStop(0,'#b98a5a'); bg.addColorStop(1,'#80592f'); ctx.fillStyle=bg; ctx.fillRect(0,0,W1,W1);
  for(let i=0;i<2200;i++){ ctx.fillStyle=R()>.5?`rgba(40,20,5,${.1+R()*.2})`:`rgba(255,230,190,${.06+R()*.12})`; ctx.beginPath(); ctx.arc(R()*W1,R()*W1,.8+R()*2.2,0,Math.PI*2); ctx.fill(); }
  const card=(cx,cy,rot,w,h)=>{ ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot); ctx.shadowColor='rgba(0,0,0,.55)'; ctx.shadowBlur=40; ctx.shadowOffsetY=18; ctx.fillStyle='#fbfaf5'; ctx.fillRect(-w/2,-h/2,w,h); ctx.shadowColor='transparent'; return ()=>ctx.restore(); };
  card(575,480,0.09,640,860)();
  const done=card(540,488,-0.05,700,880), pw=620, ph=540, px=-pw/2, py=-440+40; const rec=lcImg(s.coverArt);
  if(rec&&rec.ok){ drawImageCover(ctx,rec.img,px,py,pw,ph); ctx.fillStyle='rgba(255,200,120,.08)'; ctx.fillRect(px,py,pw,ph); } else { const g=ctx.createLinearGradient(px,py,px+pw,py+ph); g.addColorStop(0,'#3a0d6b'); g.addColorStop(1,'#9328ff'); ctx.fillStyle=g; ctx.fillRect(px,py,pw,ph); }
  const FAM="'Permanent Marker', 'Comic Sans MS', cursive", F=fs=>`${fs}px ${FAM}`, fit=lcFit(ctx,lcFlat(G),F,600,250,1.22,52,20);
  ctx.save(); lcMove(ctx,st); ctx.fillStyle='#2a2622'; ctx.font=F(fit.fs); ctx.textAlign='center'; let y=py+ph+24+fit.fs+Math.max(0,(250-fit.rows.length*fit.fs*1.22)/2); fit.rows.forEach(r=>{ ctx.fillText(r,0,y); y+=fit.fs*1.22; }); ctx.restore(); lcBox(st,190,560,700,300);
  ctx.fillStyle='rgba(255,246,214,.78)'; [[-250,-440,-0.5],[250,-440,0.45]].forEach(([x,y,r])=>{ ctx.save(); ctx.translate(x,y); ctx.rotate(r); ctx.fillRect(-70,-18,140,36); ctx.restore(); }); done(); ctx.textAlign='left';
  ctx.fillStyle='rgba(255,246,230,.9)'; ctx.font=`26px ${FAM}`; ctx.fillText(((s.title||'')+' \u00b7 '+(s.artist||'')).slice(0,44),70,1050); ctx.textAlign='right'; ctx.font='800 20px Manrope, sans-serif'; ctx.fillText('T R E E S H',1010,1050); ctx.textAlign='left'; } };

const _dlc9zq=drawLyricCard; drawLyricCard=function(){ const st=state.studio; if(!st||!LCP[st.lyt]) return _dlc9zq.apply(this,arguments);
  const cv=$("#lyric-canvas"), s=SONG_BY_ID[st.songId]; if(!cv||!s) return; lytFont(st.lyt); const ctx=cv.getContext('2d');
  const paint=()=>{ try{ ctx.save(); ctx.clearRect(0,0,W1,W1); ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.shadowBlur=0; LCP[st.lyt](ctx,s,st,lcGroups(s)); ctx.restore(); }catch(e){ console.warn('card style',e); } lcSyncLyricBox(); };
  paint(); if(LYT_FAM[st.lyt]&&!_lytFOK[st.lyt]) lytFontReady(st.lyt).then(()=>{ if(state.studio===st) paint(); }); };
const _ols9zq=openLyricStudio; openLyricStudio=function(id){ const r=_ols9zq.apply(this,arguments); const st=state.studio;
  if(st&&st.lyt===undefined){ const d=lytFor(SONG_BY_ID[id]); st.lyt=d==='classic'?null:d; if(st.lyt) return openLyricStudio(id); }
  try{ lcStyleCard(); }catch(e){ console.warn('card styles',e); } return r; };
function lcStyleCard(){ const st=state.studio, opts=document.querySelector('#modal [data-studio-root] .st-opts'); if(!st||!opts||opts.querySelector('[data-testid="lyric-card-style-card"]')) return; const cur=LCP[st.lyt]?st.lyt:'classic';
  opts.insertAdjacentHTML('afterbegin',stCard('swatch-book','Style','Pick a look that matches your lyric theme',`<div class="lc-styles">${LYT.map(t=>`<button type="button" data-act="lc-style" data-val="${t.id}" data-testid="card-style-${t.id}" aria-pressed="${cur===t.id}" class="lc-style press${cur===t.id?' on':''}"><span class="nps-prev lyt-prev">${lytPrev(t.id)}</span><span class="lc-style-n">${t.name}</span></button>`).join('')}</div>${cur!=='classic'?'<p class="st-note" style="margin-top:12px"><i data-lucide="info"></i>This style brings its own colors and fonts. Pick Classic to change the background, type and cover badge.</p>':''}`,`<span class="st-pill" data-testid="lyric-card-style-name">${esc(lytName(cur))}</span>`,'lyric-card-style-card'));
  if(cur!=='classic') ['lyric-card-bg-card','lyric-card-type-card','lyric-card-badge-card'].forEach(t=>{ const el=opts.querySelector(`[data-testid="${t}"]`); if(el) el.classList.add('hidden'); }); icons(); }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="lc-style"]'); if(!t||!state.studio) return; state.studio.lyt=t.dataset.val==='classic'?null:t.dataset.val; lytFont(t.dataset.val); openLyricStudio(state.studio.songId); });
