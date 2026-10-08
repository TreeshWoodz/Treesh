/* ---------- P9zu: Text Messages chat clips. A 15 second 9:16 video (1080x1920) with the song's audio, starting at your first picked line ---------- */
const CLIP_W=1080, CLIP_H=1920, CLIP_SEC=15, CLIP_TOP=392, CLIP_BOT=1560, CLIP_X=150, CLIP_MAXW=760, CLIP_FS=46;
let _clip=null;
const clipEase=p=>{ const c1=1.70158, c3=c1+1; return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2); };
const clipFmt=t=>{ t=Math.max(0,Math.floor(t)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); };
function clipTimed(s){ const L=(s&&s.lyrics)||[]; return new Set(L.filter(l=>l&&typeof l.t==='number'&&l.t>0).map(l=>Math.round(l.t*10))).size>=3; }
function clipStart(s){ const P=cardLines().map(x=>x.i).sort((a,b)=>a-b), L=s.lyrics||[]; const l=L[P[0]]; return l&&typeof l.t==='number'?Math.max(0,l.t-0.35):0; }
function clipItems(s,t0){ const L=s.lyrics||[], out=[];
  L.forEach((l,i)=>{ if(!l||typeof l.t!=='number') return; const tt=l.t-t0; if(tt<0||tt>=CLIP_SEC-0.4) return; const text=origLineTextFor(s.id,i,l.text!=null?l.text:''); if(!text||!text.trim()||/^\s*\[[^\]]*\]\s*$/.test(text)) return;
    const by=wcLineBy(s,L,i), face=by?wcByFace(by,s):s; out.push({t:tt,text:text.trim(),face,key:normKey(face.artist||'')}); });
  return out; }
function clipLayout(ctx,items){ const multi=new Set(items.map(x=>x.key)).size>1, LH=CLIP_FS*1.3; let y=0, prev=null;
  ctx.font=`500 ${CLIP_FS}px Manrope, sans-serif`;
  items.forEach((it,k)=>{ const rows=wrapCanvasText(ctx,[it.text],CLIP_MAXW-60); it.rows=rows; it.w=Math.min(CLIP_MAXW,Math.max(...rows.map(r=>ctx.measureText(r).width))+60); it.h=rows.length*LH+38;
    const newGroup=k===0||it.key!==prev; it.name=multi&&newGroup; y+=k===0?0:(newGroup?30:10); if(it.name) y+=42; it.y=y; y+=it.h; prev=it.key; });
  items.forEach((it,k)=>{ const n=items[k+1]; it.lastOfGroup=!n||n.key!==it.key; }); return items; }
function clipStatic(s,items){ const c=document.createElement('canvas'); c.width=CLIP_W; c.height=CLIP_H; const ctx=c.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,0,CLIP_H); bg.addColorStop(0,'#0d0b18'); bg.addColorStop(1,'#050509'); ctx.fillStyle=bg; ctx.fillRect(0,0,CLIP_W,CLIP_H);
  const gl=ctx.createRadialGradient(540,0,60,540,0,900); gl.addColorStop(0,'rgba(147,40,255,.34)'); gl.addColorStop(1,'rgba(147,40,255,0)'); ctx.fillStyle=gl; ctx.fillRect(0,0,CLIP_W,1000);
  const faces=[]; const seen=new Set(); [s,...items.map(x=>x.face)].forEach(f=>{ const k=normKey(f.artist||''); if(!seen.has(k)){ seen.add(k); faces.push(f); } });
  const F=faces.slice(0,3), R=70, gap=R*1.25, x0=540-(F.length-1)*gap/2; F.forEach((f,i)=>{ ctx.save(); ctx.beginPath(); ctx.arc(x0+i*gap,150,R+5,0,Math.PI*2); ctx.fillStyle='#0d0b18'; ctx.fill(); ctx.restore(); lcAvatar(ctx,f,x0+i*gap,150,R); });
  ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.font='700 46px Manrope, sans-serif'; const nm=faces.map(f=>f.artist||'Artist'); ctx.fillText((nm.length<=3?nm.join(', ').replace(/, ([^,]*)$/,' & $1'):nm.slice(0,2).join(', ')+' +'+(nm.length-2)).slice(0,38),540,282);
  ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='500 30px Manrope, sans-serif'; ctx.fillText(('Text Message \u00b7 '+(s.title||'')).slice(0,44),540,330); ctx.textAlign='left';
  ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(0,368,CLIP_W,2);
  lcChatDisclaimer(ctx,s,1792);
  const me=getComputedStyle(document.documentElement).getPropertyValue('--treesh-purple').trim()||'#9328ff';
  ctx.fillStyle=me; ctx.font='800 24px Manrope, sans-serif'; ctx.fillText('T R E E S H   \u00b7   L Y R I C S',96,1868); ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font='600 24px Manrope, sans-serif'; ctx.fillText('treesh.app',984,1868); ctx.textAlign='left';
  return c; }
function clipBubble(ctx,x,y,w,h,tail){ const r=36; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,tail?10:r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function clipDraw(C,tau,dt){ const {ctx,items,s}=C, LH=CLIP_FS*1.3, AREA=CLIP_BOT-CLIP_TOP;
  ctx.drawImage(C.bg,0,0);
  let n=0; while(n<items.length&&items[n].t<=tau) n++; const vis=items.slice(0,n), nx=items[n], last=vis[vis.length-1];
  let H=last?last.y+last.h:0; const typing=nx&&nx.t-tau<=1.5&&(nx.t-(last?last.t:-9))>1.0;
  let ty=0; if(typing){ ty=H+(last?(nx.key!==last.key?30:10):0)+(nx.name?42:0); H=ty+88; } else if(last) H+=56;
  if(C.hs==null) C.hs=H; C.hs+=(H-C.hs)*(1-Math.exp(-(dt||0.033)*9)); if(Math.abs(H-C.hs)<0.5) C.hs=H;
  ctx.save(); ctx.beginPath(); ctx.rect(0,CLIP_TOP,CLIP_W,AREA); ctx.clip(); const oy=CLIP_BOT-30-C.hs;
  vis.forEach((it,k)=>{ const y=oy+it.y; if(y+it.h<CLIP_TOP-60||y>CLIP_BOT+60) return; const p=Math.min(1,(tau-it.t)/0.34), e=clipEase(p), sc=0.72+0.28*e, a=Math.min(1,p*2.4);
    if(it.name){ ctx.globalAlpha=a; ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='600 28px Manrope, sans-serif'; ctx.fillText((it.face.artist||'Artist').slice(0,36),CLIP_X+16,y-14); }
    ctx.save(); ctx.globalAlpha=a; ctx.translate(CLIP_X,y+it.h); ctx.scale(sc,sc); ctx.translate(-CLIP_X,-(y+it.h));
    const tail=it.lastOfGroup||k===vis.length-1; ctx.fillStyle='#2a2930'; clipBubble(ctx,CLIP_X,y,it.w,it.h,tail); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font=`500 ${CLIP_FS}px Manrope, sans-serif`; ctx.textBaseline='top'; it.rows.forEach((row,j)=>ctx.fillText(row,CLIP_X+30,y+19+j*LH+CLIP_FS*0.08)); ctx.textBaseline='alphabetic'; ctx.restore();
    const showAv=(it.lastOfGroup&&!(typing&&nx.key===it.key&&k===vis.length-1))||(k===vis.length-1&&!(typing&&nx.key===it.key));
    if(showAv){ ctx.globalAlpha=a; lcAvatar(ctx,it.face,CLIP_X-54,y+it.h-38,38); } ctx.globalAlpha=1; });
  if(typing){ const y=oy+ty, p=Math.min(1,(1.5-(nx.t-tau))/0.25); ctx.globalAlpha=Math.max(0,p); if(nx.name){ ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='600 28px Manrope, sans-serif'; ctx.fillText((nx.face.artist||'Artist').slice(0,36),CLIP_X+16,y-14); }
    ctx.fillStyle='#2a2930'; clipBubble(ctx,CLIP_X,y,148,82,true); ctx.fill(); [0,1,2].forEach(k=>{ const b=Math.sin(tau*7-k*0.9); ctx.beginPath(); ctx.arc(CLIP_X+44+k*30,y+41-Math.max(0,b)*8,10,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${.38+Math.max(0,b)*.45})`; ctx.fill(); });
    lcAvatar(ctx,nx.face,CLIP_X-54,y+82-38,38); ctx.globalAlpha=1; }
  else if(last){ const y=oy+last.y+last.h+40; ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font='600 26px Manrope, sans-serif'; ctx.fillText('Read '+clipFmt(C.t0+last.t),CLIP_X+16,y); }
  ctx.restore();
  const fade=ctx.createLinearGradient(0,CLIP_TOP,0,CLIP_TOP+70); fade.addColorStop(0,'rgba(10,9,19,1)'); fade.addColorStop(1,'rgba(10,9,19,0)'); ctx.fillStyle=fade; ctx.fillRect(0,CLIP_TOP,CLIP_W,70);
  /* now playing strip */
  const px=90, py=1592, pw=900, ph=110; ctx.fillStyle='rgba(255,255,255,.06)'; roundRectPath(ctx,px,py,pw,ph,32); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.1)'; ctx.lineWidth=2; ctx.stroke();
  const cov=lcImg(s.coverArt); ctx.save(); roundRectPath(ctx,px+18,py+17,76,76,16); ctx.clip(); if(cov&&cov.ok) drawImageCover(ctx,cov.img,px+18,py+17,76,76); else { ctx.fillStyle='#2a2930'; ctx.fillRect(px+18,py+17,76,76); } ctx.restore();
  ctx.fillStyle='#fff'; ctx.font='700 30px Manrope, sans-serif'; ctx.fillText((s.title||'').slice(0,30),px+114,py+48); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='500 24px Manrope, sans-serif'; ctx.fillText((s.artist||'').slice(0,40),px+114,py+82);
  const me=getComputedStyle(document.documentElement).getPropertyValue('--treesh-purple').trim()||'#9328ff', bx=px+560, bw=300, prog=Math.max(0,Math.min(1,tau/CLIP_SEC));
  ctx.fillStyle='rgba(255,255,255,.14)'; roundRectPath(ctx,bx,py+52,bw,8,4); ctx.fill(); ctx.fillStyle=me; roundRectPath(ctx,bx,py+52,Math.max(8,bw*prog),8,4); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='600 22px Manrope, sans-serif'; ctx.textAlign='right'; ctx.fillText(clipFmt(C.t0+tau),bx+bw,py+92); ctx.textAlign='left'; }

/* overlay */
function clipOverlay(html){ let r=document.getElementById('clip-root'); if(!r){ r=document.createElement('div'); r.id='clip-root'; document.body.appendChild(r); } r.innerHTML=`<div class="clip-bd" data-testid="clip-backdrop"></div><div class="clip-panel" role="dialog" aria-modal="true" aria-label="Chat clip" data-testid="clip-panel">${html}</div>`; icons(); return r; }
function clipCloseUi(){ const r=document.getElementById('clip-root'); if(!r) return; if(_clip&&_clip.url){ try{ URL.revokeObjectURL(_clip.url); }catch(e){} } r.classList.add('is-out'); setTimeout(()=>r.remove(),220); _clip=null; }
function clipPickMime(){ if(typeof MediaRecorder==='undefined') return null; const L=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']; for(const m of L){ try{ if(MediaRecorder.isTypeSupported(m)) return m; }catch(e){} } return ''; }
function clipCleanup(C){ cancelAnimationFrame(C.raf); clearTimeout(C.wd); try{ C.el.pause(); }catch(e){} try{ C.el.removeAttribute('src'); C.el.load(); }catch(e){} try{ (C.vs&&C.vs.getTracks()||[]).forEach(t=>t.stop()); }catch(e){} try{ C.ac&&C.ac.close(); }catch(e){} }
function clipRecord(){ const st=state.studio, s=st&&SONG_BY_ID[st.songId]; if(!s) return;
  if(!cardLines().length){ toast('Pick a line first','Your clip starts at the first line you pick'); return; }
  if(!clipTimed(s)){ toast('This song needs timed lyrics','Sync the lyrics in Lyric Studio to make a chat clip'); return; }
  const mime=clipPickMime(), cvTest=document.createElement('canvas'); if(mime===null||!cvTest.captureStream){ toast('Video export isn\u2019t supported here','Try the latest Safari or Chrome'); return; }
  /* everything audio-related starts inside the tap so phones allow it */
  const AC=window.AudioContext||window.webkitAudioContext, ac=AC?new AC():null; try{ ac&&ac.resume(); }catch(e){}
  const el=new Audio(); el.crossOrigin='anonymous'; el.preload='auto'; el.setAttribute('playsinline',''); el.src=s.audioUrl; let unlock=null; try{ unlock=el.play(); }catch(e){}
  const wasPlaying=!audio.paused; if(wasPlaying){ try{ audio.pause(); }catch(e){} }
  const t0=clipStart(s), items=clipItems(s,t0);
  const C=_clip={s,t0,items,el,ac,mime,wasPlaying,hs:null,cancel:false,chunks:[]};
  clipOverlay(`<div class="clip-head"><span class="clip-k"><i data-lucide="clapperboard"></i>Chat clip</span><button type="button" data-act="clip-cancel" data-testid="clip-cancel" class="clip-x press" aria-label="Cancel"><i data-lucide="x"></i></button></div>
    <div class="clip-stage"><canvas id="clip-canvas" width="${CLIP_W}" height="${CLIP_H}" data-testid="clip-canvas"></canvas></div>
    <div class="clip-prog" data-testid="clip-progress"><div class="clip-bar"><i id="clip-bar-fill"></i></div><p id="clip-status" data-testid="clip-status">Getting the song ready\u2026</p></div>`);
  const cv=document.getElementById('clip-canvas'); C.cv=cv; C.ctx=cv.getContext('2d');
  (async()=>{ try{
    if(unlock&&unlock.then) await unlock.catch(()=>{}); try{ el.pause(); }catch(e){}
    await Promise.race([new Promise(r=>{ if(el.readyState>=1) r(); else el.addEventListener('loadedmetadata',r,{once:true}); }),new Promise(r=>setTimeout(r,9000))]);
    if(C.cancel) return; try{ el.currentTime=t0; }catch(e){}
    await Promise.race([new Promise(r=>el.addEventListener('seeked',r,{once:true})),new Promise(r=>setTimeout(r,2500))]);
    const faces=[s,...items.map(x=>x.face)]; faces.forEach(f=>{ const u=wnAvSrc(f); if(u) lcImg(u); }); lcImg(s.coverArt);
    await new Promise(r=>setTimeout(r,500)); try{ await document.fonts.load('600 40px Manrope'); }catch(e){}
    if(C.cancel) return; const lctx=document.createElement('canvas').getContext('2d'); clipLayout(lctx,items); C.bg=clipStatic(s,items); clipDraw(C,0,0);
    let tracks=[]; C.vs=cv.captureStream(30); tracks=tracks.concat(C.vs.getVideoTracks());
    let audioOk=false; if(ac){ try{ const src=ac.createMediaElementSource(el), dst=ac.createMediaStreamDestination(); src.connect(dst); src.connect(ac.destination); tracks=tracks.concat(dst.stream.getAudioTracks()); audioOk=true; }catch(e){ console.warn('clip audio',e); } }
    const rec=new MediaRecorder(new MediaStream(tracks),mime?{mimeType:mime,videoBitsPerSecond:5000000,audioBitsPerSecond:160000}:{}); C.rec=rec;
    rec.ondataavailable=e=>{ if(e.data&&e.data.size) C.chunks.push(e.data); };
    const stopped=new Promise(r=>rec.onstop=r);
    rec.start(500); const st0=performance.now(); let lastT=0, prevNow=st0;
    if(audioOk){ try{ await el.play(); }catch(e){ audioOk=false; } }
    const status=document.getElementById('clip-status'), fill=document.getElementById('clip-bar-fill');
    await new Promise(done=>{ const tick=now=>{ if(C.cancel){ done(); return; } const dt=Math.min(0.1,(now-prevNow)/1000); prevNow=now;
        let tau=audioOk&&!el.paused?el.currentTime-t0:(now-st0)/1000; if(audioOk&&el.paused&&lastT>0) tau=lastT+dt; tau=Math.max(lastT,tau); lastT=tau;
        clipDraw(C,Math.min(tau,CLIP_SEC),dt); if(fill) fill.style.width=Math.min(100,tau/CLIP_SEC*100)+'%'; if(status) status.textContent=`Recording ${clipFmt(tau)} / ${clipFmt(CLIP_SEC)}${audioOk?'':' \u00b7 no sound'}`;
        if(tau>=CLIP_SEC||el.ended||(now-st0)/1000>CLIP_SEC+6){ done(); return; } C.raf=requestAnimationFrame(tick); }; C.raf=requestAnimationFrame(tick); });
    try{ rec.state!=='inactive'&&rec.stop(); }catch(e){} await Promise.race([stopped,new Promise(r=>setTimeout(r,3000))]); clipCleanup(C);
    if(C.cancel) return;
    const type=(rec.mimeType||mime||'video/webm').split(';')[0]; const blob=new Blob(C.chunks,{type}); if(!blob.size) throw new Error('empty');
    C.blob=blob; C.ext=/mp4/.test(type)?'mp4':'webm'; C.url=URL.createObjectURL(blob); C.audioOk=audioOk; clipResult(C);
  }catch(e){ console.warn('clip',e); clipCleanup(C); if(!C.cancel){ clipCloseUi(); toast('Couldn\u2019t make the clip','Try again, or pick a different line'); } }
  finally{ if(C.wasPlaying&&!C.resumed){ C.resumed=true; try{ const p=audio.play(); p&&p.catch&&p.catch(()=>{}); }catch(e){} } } })(); }
function clipResult(C){ const can=!!(navigator.canShare&&window.File&&navigator.canShare({files:[new File([C.blob],'x.'+C.ext,{type:C.blob.type})]}));
  clipOverlay(`<div class="clip-head"><span class="clip-k"><i data-lucide="sparkles"></i>Your chat clip</span><button type="button" data-act="clip-close" data-testid="clip-close" class="clip-x press" aria-label="Close"><i data-lucide="x"></i></button></div>
    <div class="clip-stage"><video src="${C.url}" data-testid="clip-video" controls playsinline loop autoplay></video></div>
    <p class="clip-note"><i data-lucide="info"></i>15s \u00b7 9:16 \u00b7 ${C.ext.toUpperCase()}${C.audioOk?' with the song':' (no sound)'}. The clip says these aren\u2019t real messages from the artist.</p>
    <div class="clip-acts"><button type="button" data-act="clip-save" data-testid="clip-save" class="st-btn lg flex-1"><i data-lucide="download"></i>Save video</button>${can?`<button type="button" data-act="clip-share" data-testid="clip-share" class="st-btn lg primary flex-1"><i data-lucide="share-2"></i>Share</button>`:''}</div>`);
  const v=document.querySelector('#clip-root video'); if(v){ v.muted=false; const p=v.play(); if(p&&p.catch) p.catch(()=>{ v.muted=true; v.play().catch(()=>{}); }); } }
function clipName(C){ return `treesh-chat-${slug(C.s.title)||'clip'}.${C.ext}`; }
function clipSave(C){ const a=document.createElement('a'); a.href=C.url; a.download=clipName(C); document.body.appendChild(a); a.click(); a.remove(); toast('Clip saved','Find it in your downloads'); }
async function clipShare(C){ const f=new File([C.blob],clipName(C),{type:C.blob.type}); try{ await navigator.share({files:[f],title:C.s.title,text:`${C.s.title} \u00b7 ${C.s.artist} on Treesh`}); }catch(e){ if(!(e&&e.name==='AbortError')) clipSave(C); } }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act^="clip-"],[data-act="lc-clip"]'); if(!t) return; const a=t.dataset.act;
  if(a==='lc-clip') clipRecord();
  else if(a==='clip-cancel'){ if(_clip){ _clip.cancel=true; try{ _clip.rec&&_clip.rec.state!=='inactive'&&_clip.rec.stop(); }catch(e){} clipCleanup(_clip); if(_clip.wasPlaying&&!_clip.resumed){ _clip.resumed=true; try{ audio.play(); }catch(e){} } } clipCloseUi(); }
  else if(a==='clip-close') clipCloseUi();
  else if(a==='clip-save'&&_clip) clipSave(_clip);
  else if(a==='clip-share'&&_clip) clipShare(_clip); });
/* the Video button sits next to Download and Share when the Text Messages style is on */
const _lsc9zu=lcStyleCard; lcStyleCard=function(){ const r=_lsc9zu.apply(this,arguments); const st=state.studio; if(!st||st.lyt!=='chat') return r;
  document.querySelectorAll('#modal [data-studio-root] [data-act="card-download"]').forEach(dl=>{ const side=dl.dataset.testid==='card-download-side'; if(dl.parentElement.querySelector('[data-act="lc-clip"]')) return;
    dl.insertAdjacentHTML('beforebegin',`<button data-act="lc-clip" data-testid="card-video${side?'-side':''}" class="st-btn lg flex-1${dl.classList.contains('is-off')?' is-off':''}" title="15 second video for Stories, Reels and TikTok"><i data-lucide="clapperboard"></i>Video</button>`); });
  icons(); return r; };
