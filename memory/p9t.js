/* ---------- P9t: Instrum Studio, one timeline (drum lanes + vocal tracks), mixer, arrangement, full-song WAV ---------- */
const IX_MAX=32, IX_ZOOM=[14,20,26,34];
let _ixMix=null, _ixCol=[], _ixBpmT=0;
const _ixIRs={};
const ixPhone=()=>window.innerWidth<640;
function ixHeadW(){ return ixPhone()?112:176; }
function ixZ(S){ return (S&&S.zoom!=null)?S.zoom:(ixPhone()?1:2); }
function ixSW(S){ return IX_ZOOM[Math.max(0,Math.min(IX_ZOOM.length-1,ixZ(S)))]; }
function ixSecBar(p){ return 240/((p&&p.bpm)||90); }
function ixSetPPS(S){ IDAW_PPS=ixSW(S)*16/ixSecBar(S.project); }
function ixClipEnd(p){ let e=0; (p.audioTracks||[]).forEach(tr=>(tr.clips||[]).forEach(c=>{ e=Math.max(e,(c.start||0)+(c.dur||0)); })); return e; }
function ixResize(p,bars,tile){ bars=Math.max(1,Math.min(IX_MAX,bars|0)); const n=bars*16; p.tracks.forEach(tr=>{ const o=Array.isArray(tr.steps)?tr.steps:[]; const ns=new Array(n); for(let i=0;i<n;i++) ns[i]=i<o.length?!!o[i]:(tile&&o.length?!!o[i%o.length]:false); tr.steps=ns; }); p.bars=bars; }
function ixEnsure(p){ if(!p||!Array.isArray(p.tracks)) return; iNormalizeAudioTracks(p);
  p.tracks.forEach(tr=>{ if(tr.pan==null) tr.pan=0; if(tr.rev==null) tr.rev=0; if(tr.vol==null) tr.vol=0.85; }); p.audioTracks.forEach(tr=>{ if(tr.pan==null) tr.pan=0; if(tr.rev==null) tr.rev=0; });
  if(p.loop==null) p.loop=true; p.bars=Math.max(1,Math.min(IX_MAX,(p.bars|0)||1));
  const need=Math.min(IX_MAX,Math.ceil(ixClipEnd(p)/ixSecBar(p)-1e-6));
  if(!(p.v>=2)){ ixResize(p,Math.max(p.bars,need),true); p.v=2; }
  else if(need>p.bars||p.tracks.some(tr=>!Array.isArray(tr.steps)||tr.steps.length!==p.bars*16)) ixResize(p,Math.max(p.bars,need),false); }
function instrumBlankProject(){ const bars=4,total=bars*16; return { id:null, name:"Untitled beat", v:2, bpm:90, bars, swing:0, master:0.9, metronome:false, loop:true, tracks: INSTRUM_KIT.map(k=>Object.assign({vol:0.85,pan:0,rev:0,mute:false,solo:false,steps:new Array(total).fill(false)},k)), audioTracks: [] }; }
function ixAnySolo(p){ return p.tracks.some(t=>t.solo)||(p.audioTracks||[]).some(t=>t.solo); }
function ixOn(tr,solo){ return !tr.mute&&(!solo||tr.solo); }
function ixPanTxt(v){ v=+v||0; if(Math.abs(v)<0.03) return 'C'; return (v<0?'L':'R')+Math.round(Math.abs(v)*100); }
function ixTimeTxt(pos,p){ const sb=ixSecBar(p); pos=Math.max(0,pos||0); return (Math.floor(pos/sb)+1)+'.'+(Math.floor((pos%sb)/(sb/4))+1)+' \u00b7 '+iFmtTime(pos); }

/* ---- mixer graph: channel = in -> pan -> out(mute) -> dest, plus a post-fader reverb send ---- */
function ixIR(ctx){ const k=ctx.sampleRate; if(_ixIRs[k]) return _ixIRs[k]; const len=Math.floor(k*2.4); const b=ctx.createBuffer(2,len,k); for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); } return _ixIRs[k]=b; }
function ixRevIn(ctx,dest){ const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=200; const cv=ctx.createConvolver(); cv.buffer=ixIR(ctx); const g=ctx.createGain(); g.gain.value=0.85; hp.connect(cv); cv.connect(g); g.connect(dest); return hp; }
function ixChan(ctx,dest,rev,tr,on){ const inp=ctx.createGain(), out=ctx.createGain(), send=ctx.createGain(); let pan=null; if(ctx.createStereoPanner){ pan=ctx.createStereoPanner(); pan.pan.value=tr.pan||0; inp.connect(pan); pan.connect(out); } else inp.connect(out); out.gain.value=on?1:0; out.connect(dest); send.gain.value=tr.rev||0; out.connect(send); send.connect(rev); return {inp,out,pan,send}; }
function ixBuildMix(ctx,dest,p){ const rev=ixRevIn(ctx,dest), solo=ixAnySolo(p), m={ctx,rev,d:[],a:{}};
  p.tracks.forEach((tr,i)=>{ m.d[i]=ixChan(ctx,dest,rev,tr,ixOn(tr,solo)); });
  (p.audioTracks||[]).forEach(tr=>{ const ch=ixChan(ctx,dest,rev,tr,ixOn(tr,solo)); const g=ctx.createGain(); g.gain.value=tr.vol==null?0.9:tr.vol; g.connect(ch.inp); const fx=iBuildFxChain(ctx,tr.fx); fx.output.connect(g); ch.g=g; ch.fx=fx.input; m.a[tr.id]=ch; });
  return m; }
function ixMixLive(){ const m=_ixMix, S=state.instrum; if(!m||!S) return; const p=S.project, solo=ixAnySolo(p), t=m.ctx.currentTime;
  const up=(ch,tr)=>{ if(!ch) return; ch.out.gain.setTargetAtTime(ixOn(tr,solo)?1:0,t,0.015); if(ch.pan) ch.pan.pan.setTargetAtTime(tr.pan||0,t,0.02); ch.send.gain.setTargetAtTime(tr.rev||0,t,0.02); if(ch.g) ch.g.gain.setTargetAtTime(tr.vol==null?0.9:tr.vol,t,0.02); };
  p.tracks.forEach((tr,i)=>up(m.d[i],tr)); (p.audioTracks||[]).forEach(tr=>up(m.a[tr.id],tr)); }
function ixMixDrop(){ const m=_ixMix; _ixMix=null; if(!m) return; const k=n=>{ try{ if(n) n.disconnect(); }catch(e){} }; m.d.forEach(c=>{ k(c.out); k(c.send); }); Object.values(m.a).forEach(c=>{ k(c.out); k(c.send); k(c.g); }); k(m.rev); }
function ixSchedAudio(ctx,m,p,base,from,nodes){ (p.audioTracks||[]).forEach(tr=>{ const ch=m.a[tr.id]; if(!ch) return; (tr.clips||[]).forEach(c=>{ const buf=_iBufCache[c.mediaId]; if(!buf) return; const rate=c.rate>0?c.rate:1, s=c.start||0, d=c.dur||0; if(s+d<=from+0.005) return;
    const off0=Math.max(0,Math.min(c.offset||0,buf.duration)); const len0=Math.max(0.02,Math.min(c.len!=null?c.len:buf.duration,buf.duration-off0)); const into=Math.max(0,from-s), lead=into*rate; if(lead>=len0) return;
    const src=ctx.createBufferSource(); src.buffer=buf; src.playbackRate.value=rate; let inp=ch.fx; if(c.fx&&typeof c.fx==='object'){ const cf=iBuildFxChain(ctx,c.fx); cf.output.connect(ch.g); inp=cf.input; } src.connect(inp);
    try{ src.start(base+s+into, off0+lead, len0-lead); }catch(e){} nodes.push(src); }); }); }

/* ---- one transport for drums + audio ---- */
async function ixPlay(from){ const S=state.instrum; if(!S||!_iAC||S.aplaying||S._starting) return; S._starting=true; const p=S.project; ixEnsure(p);
  try{ await _iAC.resume(); }catch(e){} try{ await iEnsureBuffers(); }catch(e){} S._starting=false; if(state.instrum!==S||S.aplaying) return;
  const sb=ixSecBar(p), ss=sb/16, end=p.bars*sb; let pos=Math.max(0,from!=null?from:(S.playheadSec||0)); if(pos>=end-0.03&&!S.recording) pos=0;
  iAudioStopNodes(); _iAudioNodes=[]; ixMixDrop(); _ixMix=ixBuildMix(_iAC,_iMaster||_iAC.destination,p);
  const t0=_iAC.currentTime+0.08, base=t0-pos; S._bases=[base]; S.audioT0=base; S._t0perf=performance.now()+80; S.playheadSec=pos;
  ixSchedAudio(_iAC,_ixMix,p,base,pos,_iAudioNodes);
  const st=Math.ceil(pos/ss-1e-6); S.step=st; S.nextTime=base+st*ss; S._loopOn=!!p.loop&&!S.recording; S._tail=false;
  S.playing=true; S.aplaying=true; S.visStep=-1; iSchedule(); ixVisual(); iUpdateTransport(); }
function iSchedule(){ const S=state.instrum; if(!S||!S.playing||!_ixMix) return; const ctx=_iAC, p=S.project, ss=ixSecBar(p)/16, total=p.bars*16, solo=ixAnySolo(p);
  while(S.nextTime<ctx.currentTime+0.12){ let step=S.step;
    if(step>=total){ if(S._loopOn){ step=0; const nb=S.nextTime; S._bases.push(nb); if(S._bases.length>4) S._bases.shift(); ixSchedAudio(ctx,_ixMix,p,nb,0,_iAudioNodes); } else { S._tail=true; break; } }
    const t=S.nextTime+((step%2===1)?p.swing*ss*0.6:0);
    p.tracks.forEach((tr,i)=>{ if(tr.steps[step]&&ixOn(tr,solo)&&_ixMix.d[i]) iTrigger(tr,t,ctx,_ixMix.d[i].inp); });
    if(p.metronome&&step%4===0) iClick(S.nextTime,step%16===0,ctx,_iMaster);
    S.nextTime+=ss; S.step=step+1; }
  if(!S._tail) S.timer=setTimeout(iSchedule,25); }
function ixVisual(){ const S=state.instrum; if(!S||!S.aplaying) return; const now=_iAC.currentTime, p=S.project; let base=S._bases[0]; S._bases.forEach(b=>{ if(b<=now+0.001) base=b; }); S.audioT0=base;
  const sb=ixSecBar(p), end=p.bars*sb, pos=now-base;
  if(!S._loopOn&&!S.recording&&pos>=end){ ixStop(false); return; }
  if(pos>=0){ S.playheadSec=pos; iAudioSetPlayhead(pos); const st=Math.floor(pos/(sb/16)); const vs=st<p.bars*16?st:-1; if(vs!==S.visStep){ S.visStep=vs; iHighlightCol(vs); } }
  S.audioRAF=requestAnimationFrame(ixVisual); }
function ixStop(keep){ const S=state.instrum; if(!S) return; const was=S.aplaying||S.playing; S.playing=false; S.aplaying=false; S._starting=false; clearTimeout(S.timer); if(S.audioRAF) cancelAnimationFrame(S.audioRAF); if(S.raf) cancelAnimationFrame(S.raf);
  iAudioStopNodes(); ixMixDrop(); iHighlightCol(-1); if(!keep) S.playheadSec=0; iAudioSetPlayhead(S.playheadSec||0); if(was) iUpdateTransport(); }
function iPlay(){ ixPlay(); }
function iStop(){ ixStop(true); }
async function iTransportPlay(){ const S=state.instrum; if(!S) return; if(S.aplaying) ixStop(true); else ixPlay(); }
function iTransportStop(){ ixStop(true); }
function ixRestart(){ const S=state.instrum; if(!S||!S.aplaying) return; const pos=S.playheadSec||0; ixStop(true); ixPlay(pos); }
function iUpdateTransport(){ const S=state.instrum, on=!!(S&&S.aplaying); document.querySelectorAll('[data-act="ix-play"]').forEach(b=>{ b.classList.toggle('playing',on); b.setAttribute('aria-label',on?'Pause':'Play'); b.innerHTML=`<i data-lucide="${on?'pause':'play'}" style="width:23px;height:23px" class="${on?'':'fill-current translate-x-[1px]'}"></i>`; }); icons(); }
function iHighlightCol(col){ _ixCol.forEach(e=>e.classList.remove('instrum-col-play')); _ixCol=[]; if(col<0) return; const w=document.getElementById('i-lanes-wrap'); if(!w) return; _ixCol=[...w.querySelectorAll('.instrum-cell[data-step="'+col+'"]')]; _ixCol.forEach(e=>e.classList.add('instrum-col-play')); }
function iAudioSetPlayhead(pos){ const S=state.instrum, ph=document.getElementById('i-playhead'); if(!ph||!S) return; const x=Math.max(0,(pos||0)*IDAW_PPS); ph.style.transform='translateX('+x+'px)';
  const sc=document.getElementById('i-audio-scroll'); if(sc&&S.aplaying){ const w=sc.clientWidth-ixHeadW(), l=sc.scrollLeft; if(x<l||x>l+w-30) sc.scrollLeft=Math.max(0,x-w*0.25); }
  if(!S.recording){ const el=document.getElementById('i-audio-time'); if(el) el.textContent=ixTimeTxt(pos,S.project); } }

/* ---- recording lands at the playhead while the song plays ---- */
async function iToggleRecord(){ const S=state.instrum; if(!S) return; if(S.recording){ iStopRecording(); return; } if(!S.armed){ await iArmMic(); if(!S.armed) return; } ixRecStart(); }
function ixRecStart(){ const S=state.instrum; if(S.aplaying) ixStop(true); const pos=Math.max(0,S.playheadSec||0); S.backing=false; iStartRecording(); if(!S.recording) return; _iRecStartAt=pos; S._recPos=pos; S._recPerf=performance.now(); S._recLead=0;
  ixPlay(pos).then(()=>{ if(S._t0perf) S._recLead=Math.max(0,Math.min(1.5,(S._t0perf-S._recPerf)/1000)); }); }
const _ixSR0=iStopRecording; iStopRecording=function(){ const S=state.instrum; const was=!!(S&&S.recording); _ixSR0.apply(this,arguments); if(was&&S){ if(S.aplaying) ixStop(true); S.playheadSec=S._recPos||0; iAudioSetPlayhead(S.playheadSec); } };
async function iFinalizeRecording(blob){ const S=state.instrum; if(!S) return; if(!blob||!blob.size){ toast("Nothing recorded"); return; } const mediaId="iclip_"+instrumUID();
  try{ await idbPut({id:mediaId,audioBlob:blob,audioType:blob.type||"audio/webm",meta:{kind:"instrum-clip"},addedAt:Date.now()}); }catch(e){}
  let buf=null; try{ const ab=await blob.arrayBuffer(); buf=await _iAC.decodeAudioData(ab.slice(0)); _iBufCache[mediaId]=buf; }catch(e){}
  const dur=buf?buf.duration:0, peaks=buf?iComputePeaks(buf):[]; iNormalizeAudioTracks(S.project); let tr=(S.project.audioTracks||[]).find(t=>t.id===_iRecTrackId); if(!tr) tr=iAddAudioTrack();
  const lead=Math.min(S._recLead||0,Math.max(0,dur-0.1)), len=Math.max(0.05,dur-lead);
  const clip={ id:instrumUID(), name:"Take "+((tr.clips||[]).length+1), mediaId, start:_iRecStartAt||0, dur:len, offset:lead, len, rate:1, buflen:dur, peaks }; tr.clips.push(clip); S._recLead=0;
  iPushHistory(); renderInstrum(); toast("Take saved",clip.name+" \u00b7 "+iFmtTime(len)); }

/* ---- presets fill the whole song, length + arrangement edits ---- */
function iApplyPreset(id){ const pr=allPresets().find(x=>x.id===id); if(!pr) return; const S=state.instrum; if(!S) return; const p=S.project; if(S.aplaying) ixStop(true); ixEnsure(p);
  const pb=Math.max(1,Math.min(IX_MAX,pr.bars||1)); if(p.bars<pb) ixResize(p,pb,false); const pl=pb*16, total=p.bars*16; p.bpm=pr.bpm; p.swing=pr.swing||0;
  p.tracks.forEach(tr=>{ const arr=(pr.pat&&pr.pat[tr.type])||[]; const on=new Set(arr); tr.steps=Array.from({length:total},(_,i)=>on.has(i%pl)); if(tr.melodic&&pr.notes&&pr.notes[tr.type]) tr.note=pr.notes[tr.type]; });
  S.activePreset=id; iPushHistory(); renderInstrum(); toast("Preset loaded",pr.name+" \u00b7 "+pr.bpm+" BPM \u00b7 every bar"); }
function iSetBars(b){ const S=state.instrum; if(!S) return; if(S.aplaying) ixStop(true); ixResize(S.project,b,false); S.activePreset=null; ixEnsure(S.project); iPushHistory(); renderInstrum(); }
function ixLen(d){ const S=state.instrum; const p=S.project; const need=Math.max(1,Math.ceil(ixClipEnd(p)/ixSecBar(p)-1e-6)); const nb=p.bars+d;
  if(nb>IX_MAX){ toast("That\u2019s the longest song for now",IX_MAX+" bars"); return; } if(nb<need){ toast("Your audio reaches bar "+need,"Move or trim it first"); return; } if(nb<1) return;
  if(S.aplaying) ixStop(true); ixResize(p,nb,false); if(S.selBars&&S.selBars[1]>=nb) S.selBars=null; iPushHistory(); renderInstrum(); }
function ixSelBar(i){ const S=state.instrum; const s=S.selBars; if(!s) S.selBars=[i,i]; else if(i<s[0]||i>s[1]) S.selBars=[Math.min(s[0],i),Math.max(s[1],i)]; else if(s[0]===s[1]) S.selBars=null; else S.selBars=[i,i]; renderInstrum(); }
function ixBarsOp(op){ const S=state.instrum; const p=S.project; const sel=S.selBars; if(!sel) return; if(S.aplaying) ixStop(true); const [a,b]=sel, n=b-a+1, sb=ixSecBar(p), s0=a*sb, s1=(b+1)*sb, len=n*sb;
  const inSel=c=>(c.start||0)>=s0-1e-6&&(c.start||0)<s1-1e-6, shift=(from,dx)=>(p.audioTracks||[]).forEach(tr=>(tr.clips||[]).forEach(c=>{ if((c.start||0)>=from-1e-6) c.start=Math.max(0,(c.start||0)+dx); }));
  let msg='';
  if(op==='dup'||op==='insert'){ if(p.bars+n>IX_MAX){ toast("No room left","Songs can be up to "+IX_MAX+" bars"); return; }
    const copies=[]; if(op==='dup') (p.audioTracks||[]).forEach(tr=>(tr.clips||[]).forEach(c=>{ if(inSel(c)) copies.push([tr,Object.assign(JSON.parse(JSON.stringify(c)),{id:instrumUID(),start:(c.start||0)+len})]); }));
    shift(s1,len); p.tracks.forEach(tr=>{ const seg=op==='dup'?tr.steps.slice(a*16,(b+1)*16):new Array(n*16).fill(false); tr.steps.splice((b+1)*16,0,...seg); }); p.bars+=n; copies.forEach(([tr,c])=>tr.clips.push(c));
    S.selBars=[b+1,b+n]; msg=op==='dup'?(n>1?n+' bars duplicated':'Bar duplicated'):(n>1?n+' empty bars added':'Empty bar added'); }
  else if(op==='fill'){ const from=(b+1)*16, total=p.bars*16; if(from>=total){ toast("Nothing after this","Add bars first, then repeat"); return; } p.tracks.forEach(tr=>{ for(let i=from;i<total;i++) tr.steps[i]=tr.steps[a*16+((i-from)%(n*16))]; }); msg='Beat repeated to the end'; }
  else if(op==='clear'){ p.tracks.forEach(tr=>{ for(let i=a*16;i<(b+1)*16;i++) tr.steps[i]=false; }); msg='Beat cleared'; }
  else if(op==='del'){ if(p.bars-n<1){ toast("Keep at least one bar"); return; } (p.audioTracks||[]).forEach(tr=>{ tr.clips=(tr.clips||[]).filter(c=>!inSel(c)); }); shift(s1,-len); p.tracks.forEach(tr=>tr.steps.splice(a*16,n*16)); p.bars-=n; S.selBars=null; msg=n>1?n+' bars deleted':'Bar deleted'; }
  S.activePreset=null; iPushHistory(); renderInstrum(); if(msg) toast(msg); }
function ixTempoChanged(){ const S=state.instrum; if(!S) return; ixEnsure(S.project); if(S.aplaying) ixRestart(); renderInstrum(); }
const _ixBpm0=iBpmStep; iBpmStep=function(d){ _ixBpm0.apply(this,arguments); clearTimeout(_ixBpmT); _ixBpmT=setTimeout(ixTempoChanged,380); };

/* ---- full song WAV: drums + vocals, pan, reverb, FX ---- */
async function iExportWav(){ const S=state.instrum; if(!S) return; const p=S.project; ixEnsure(p);
  try{ toast("Rendering WAV\u2026",p.name); if(_iAC) await iEnsureBuffers(); const sr=(_iAC&&_iAC.sampleRate)||44100, sb=ixSecBar(p), ss=sb/16, total=p.bars*16;
    const hasClips=(p.audioTracks||[]).some(t=>(t.clips||[]).length); const loops=(!hasClips&&p.bars<=2)?2:1; const dur=p.bars*sb*loops+2.4;
    const off=new OfflineAudioContext(2,Math.max(1,Math.ceil(sr*dur)),sr); const m=off.createGain(); m.gain.value=p.master; m.connect(off.destination); const mix=ixBuildMix(off,m,p); const solo=ixAnySolo(p);
    for(let L=0;L<loops;L++){ for(let s=0;s<total;s++){ const t=(L*total+s)*ss+((s%2===1)?p.swing*ss*0.6:0); p.tracks.forEach((tr,i)=>{ if(tr.steps[s]&&ixOn(tr,solo)) iTrigger(tr,t,off,mix.d[i].inp); }); } if(hasClips) ixSchedAudio(off,mix,p,L*total*ss,0,[]); }
    const buf=await off.startRendering(); const blob=new Blob([encodeWAV(buf)],{type:"audio/wav"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=(p.name||"beat").replace(/[^a-z0-9]+/gi,"_").replace(/^_|_$/g,"")+".wav"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000);
    toast("WAV downloaded",p.name+" \u00b7 "+iFmtTime(p.bars*sb*loops)); }catch(e){ console.error(e); toast("Export failed"); } }

/* ---- keep the timeline scroll + live mix across re-renders ---- */
function renderInstrum(animate){ const sc=document.getElementById('i-audio-scroll'); const sl=sc?sc.scrollLeft:0, st=sc?sc.scrollTop:0;
  if(state.instrum&&state.instrum.fs) renderInstrumFS(); else renderView(animate); iRenderMenu();
  const n=document.getElementById('i-audio-scroll'); if(n){ n.scrollLeft=sl; n.scrollTop=st; } ixMixLive(); requestAnimationFrame(iAfterRender); }

/* ---- HTML ---- */
function ixMs(act,attr,label,on,name){ return `<button data-act="${act}" ${attr} aria-label="${label==='M'?'Mute':'Solo'} ${esc(name)}" class="ix-msb press${on?(label==='M'?' is-m':' is-s'):''}">${label}</button>`; }
function ixTransportHtml(){ const S=state.instrum, p=S.project, on=!!S.aplaying, rec=!!S.recording, armed=!!S.armed, canU=S.history&&S.hi>0, canR=S.history&&S.hi<(S.history.length-1), tools=!S.toolsMin, tracks=p.audioTracks||[], sb=ixSecBar(p);
  const main=`<div class="ix-tp-main no-scrollbar">
    <button data-act="ix-home" data-testid="ix-home" aria-label="Back to start" class="tip i-btn h-11 w-11 shrink-0" data-tip="Back to start"><i data-lucide="skip-back" style="width:17px;height:17px"></i></button>
    <button data-act="ix-play" data-testid="instrum-play" aria-label="${on?'Pause':'Play'}" class="i-play-btn press shrink-0 ${on?'playing':''}"><i data-lucide="${on?'pause':'play'}" style="width:23px;height:23px" class="${on?'':'fill-current translate-x-[1px]'}"></i></button>
    <button data-act="i-rec" data-testid="idaw-record" aria-label="${rec?'Stop recording':'Record at the playhead'}" title="${rec?'Stop recording':'Record at the playhead'}" class="idaw-rec shrink-0 ${rec?'recording':''} ${armed?'armed':''}"><span class="dot"></span></button>
    <div class="ix-lcd shrink-0"><span id="i-audio-time" data-testid="ix-time" class="font-doto">${ixTimeTxt(S.playheadSec||0,p)}</span><span class="ix-lcd-sub" data-testid="ix-length">${p.bars} bar${p.bars>1?'s':''} \u00b7 ${iFmtTime(p.bars*sb)}</span></div>
    <div class="flex h-11 shrink-0 items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 px-1">
      <button data-act="i-bpm-dec" aria-label="Slower" data-testid="ix-bpm-dec" class="i-btn h-8 w-8 border-0 bg-transparent"><i data-lucide="minus" style="width:15px;height:15px"></i></button>
      <div class="px-0.5 text-center leading-none"><input type="number" inputmode="numeric" min="40" max="220" value="${p.bpm}" data-act="i-bpm" data-testid="instrum-bpm" class="i-lcd font-doto w-10 bg-transparent text-center text-xl font-bold outline-none"><span class="block text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40">BPM</span></div>
      <button data-act="i-bpm-inc" aria-label="Faster" data-testid="ix-bpm-inc" class="i-btn h-8 w-8 border-0 bg-transparent"><i data-lucide="plus" style="width:15px;height:15px"></i></button>
    </div>
    <button data-act="ix-loop" data-testid="ix-loop" aria-pressed="${!!p.loop}" aria-label="Loop the song" class="tip i-btn h-11 w-11 shrink-0 ${p.loop?'on':''}" data-tip="Loop song"><i data-lucide="repeat" style="width:17px;height:17px"></i></button>
    <button data-act="i-metronome" data-testid="instrum-metronome" aria-label="Metronome" class="tip i-btn h-11 w-11 shrink-0 ${p.metronome?'on':''}" data-tip="Metronome">${METRONOME_SVG}</button>
    <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
      <button data-act="i-undo" data-testid="instrum-undo" aria-label="Undo" class="tip i-btn h-11 w-11" data-tip="Undo" ${canU?'':'disabled'}><i data-lucide="undo-2" style="width:17px;height:17px"></i></button>
      <button data-act="i-redo" data-testid="instrum-redo" aria-label="Redo" class="tip i-btn h-11 w-11" data-tip="Redo" ${canR?'':'disabled'}><i data-lucide="redo-2" style="width:17px;height:17px"></i></button>
      <span class="mx-0.5 h-6 w-px bg-white/10"></span>
      <button data-act="ix-mixer" data-testid="ix-mixer-toggle" aria-pressed="${!!S.mixer}" class="i-btn h-11 shrink-0 gap-1.5 px-2.5 sm:px-3.5 text-sm font-semibold ${S.mixer?'on':''}"><i data-lucide="sliders-vertical" style="width:17px;height:17px"></i><span class="hidden sm:inline">Mixer</span></button>
      <button data-act="i-tools-toggle" data-testid="instrum-tools-toggle" aria-label="${tools?'Hide tools':'Show tools'}" aria-expanded="${tools}" class="i-btn h-11 shrink-0 gap-1.5 px-2.5 sm:px-3.5 text-sm font-semibold ${tools?'on':''}"><i data-lucide="wrench" style="width:16px;height:16px"></i><span class="hidden sm:inline">Tools</span><i data-lucide="chevron-down" style="width:13px;height:13px" class="transition-transform ${tools?'rotate-180':''}"></i></button>
    </div></div>`;
  const z=ixZ(S);
  const row=tools?`<div class="ix-tp-tools tr-fade-in no-scrollbar" data-testid="instrum-tools-row">
    <div class="ix-tg-grp"><span class="ix-tg-l">Vocals</span>
      <button data-act="i-arm" data-testid="idaw-arm" class="idaw-btn shrink-0 ${armed?'on':''}"><i data-lucide="mic" style="width:15px;height:15px"></i>${armed?'Mic ready':'Arm mic'}</button>
      <button data-act="i-monitor" data-testid="idaw-monitor" class="idaw-btn shrink-0 ${S.monitor?'on':''}" ${armed?'':'disabled'}><i data-lucide="headphones" style="width:15px;height:15px"></i>Monitor</button>
      <div class="idaw-meter shrink-0" title="Input level"><div class="idaw-meter-fill" id="i-meter-fill"></div></div>
      <button data-act="i-audio-add" data-testid="idaw-add-track" class="idaw-btn shrink-0"><i data-lucide="plus" style="width:15px;height:15px"></i>Track</button>
      <button data-act="i-audio-import" data-testid="idaw-import" class="idaw-btn shrink-0"><i data-lucide="upload" style="width:15px;height:15px"></i>Import</button>
      <button data-act="i-select-mode" data-testid="idaw-select" class="idaw-btn shrink-0 ${S.selectMode?'on':''}" ${tracks.length?'':'disabled'}><i data-lucide="box-select" style="width:15px;height:15px"></i>Select</button>
      <input type="file" id="i-audio-file" accept="audio/*" class="hidden"></div>
    <div class="ix-tg-grp"><span class="ix-tg-l">Beat</span>
      <div class="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5"><i data-lucide="waves" style="width:14px;height:14px" class="text-white/45"></i><span class="text-[9px] font-semibold uppercase tracking-wide text-white/40">Swing</span><input type="range" min="0" max="0.6" step="0.05" value="${p.swing}" data-act="i-swing" data-testid="ix-swing" aria-label="Swing" class="i-slider w-16"></div>
      <button data-act="i-clear" data-testid="instrum-clear" aria-label="Clear all drums" class="tip i-btn h-10 w-10 shrink-0" data-tip="Clear drums"><i data-lucide="eraser" style="width:16px;height:16px"></i></button>
      <button data-act="i-random" data-testid="instrum-random" aria-label="Randomize drums" class="tip i-btn h-10 w-10 shrink-0" data-tip="Randomize"><i data-lucide="dices" style="width:16px;height:16px"></i></button></div>
    <div class="ix-tg-grp"><span class="ix-tg-l">Zoom</span>
      <button data-act="ix-zoom" data-val="-1" data-testid="ix-zoom-out" aria-label="Zoom out" class="i-btn h-10 w-10 shrink-0" ${z<=0?'disabled':''}><i data-lucide="zoom-out" style="width:16px;height:16px"></i></button>
      <button data-act="ix-zoom" data-val="1" data-testid="ix-zoom-in" aria-label="Zoom in" class="i-btn h-10 w-10 shrink-0" ${z>=IX_ZOOM.length-1?'disabled':''}><i data-lucide="zoom-in" style="width:16px;height:16px"></i></button></div>
    <div class="ix-tg-grp"><span class="ix-tg-l">Master</span>
      <input type="range" min="0" max="1" step="0.05" value="${p.master}" data-act="i-master" data-testid="ix-master" aria-label="Master volume" class="i-slider w-20">
      <button data-act="i-export" data-testid="ix-export" class="idaw-btn shrink-0 is-acc"><i data-lucide="download" style="width:15px;height:15px"></i>Export WAV</button></div>
  </div>`:'';
  return `<div class="studio-panel ix-tp mx-3 sm:mx-4 p-2.5 sm:p-3 ${S.menu?'relative z-[80]':''}" data-testid="ix-transport">${main}${row}</div>`; }
function ixArrangeHtml(){ const S=state.instrum, s=S.selBars; if(!s) return ''; const n=s[1]-s[0]+1;
  const b=(v,ic,l)=>`<button data-act="ix-arr" data-val="${v}" data-testid="ix-arr-${v}" class="idaw-selchip"><i data-lucide="${ic}" style="width:14px;height:14px"></i>${l}</button>`;
  return `<div class="studio-panel ix-arrbar mx-3 sm:mx-4" data-testid="ix-arrange-bar"><span class="ix-arr-t"><i data-lucide="layout-template" style="width:14px;height:14px"></i><span data-testid="ix-arr-label">${n>1?`Bars ${s[0]+1}\u2013${s[1]+1}`:`Bar ${s[0]+1}`}</span></span><div class="ix-arr-acts no-scrollbar">${b('dup','copy-plus','Duplicate')}${b('insert','between-vertical-start','Insert empty')}${b('fill','repeat-2','Repeat to end')}${b('clear','eraser','Clear beat')}${b('del','trash-2','Delete')}</div><button data-act="ix-sel-clear" data-testid="ix-sel-clear" aria-label="Clear selection" class="ix-mini"><i data-lucide="x" style="width:14px;height:14px"></i></button></div>`; }
function ixSelBarHtml(){ const S=state.instrum, tracks=S.project.audioTracks||[]; if(!(tracks.length&&S.selectMode)) return ''; const selN=(S.selClips||[]).length, cbN=(S.clipboard||[]).length; const c=(act,ic,l,dis)=>`<button data-act="${act}" data-testid="idaw-${act.replace('i-','')}" class="idaw-selchip" ${dis?'disabled':''}><i data-lucide="${ic}" style="width:14px;height:14px"></i>${l}</button>`;
  return `<div class="studio-panel mx-3 sm:mx-4 p-2.5 ix-selbox" data-testid="idaw-selbar"><div class="mb-2 flex items-center gap-2 text-[11px] font-semibold text-white/70"><i data-lucide="box-select" style="width:13px;height:13px" class="text-[color:var(--treesh-purple)]"></i><span class="min-w-0 flex-1 truncate">${selN?(selN+" clip"+(selN>1?"s":"")+" selected"):"Tap clips to select \u00b7 hold an empty lane to drag-select"}</span><button data-act="i-select-mode" data-testid="idaw-select-done" class="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/70 hover:bg-white/20">Done</button></div>
    <div class="idaw-selbar mb-2 pb-1">${c('i-sel-copy','copy','Copy',!selN)}${c('i-sel-paste','clipboard-paste','Paste'+(cbN?' ('+cbN+')':''),!cbN)}${c('i-sel-delete','trash-2','Delete',!selN)}${c('i-sel-all','check-check','All',false)}${c('i-sel-none','x','Clear',!selN)}</div>
    <p class="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/40">Clip FX ${selN?'':'\u00b7 select clips first'}</p>
    <div class="idaw-selbar pb-1">${IDAW_FX.map(f=>`<button data-act="i-sel-fx" data-fx="${f.id}" data-testid="idaw-sel-fx-${f.id}" class="idaw-selchip" ${selN?'':'disabled'}>${f.name}</button>`).join("")}<button data-act="i-sel-fx-clear" data-testid="idaw-sel-fx-clear" class="idaw-selchip" ${selN?'':'disabled'}><i data-lucide="eraser" style="width:14px;height:14px"></i>No FX</button></div></div>`; }
function ixClipHtml(tr,c,sel){ const left=(c.start||0)*IDAW_PPS, w=Math.max(30,(c.dur||0)*IDAW_PPS), isSel=sel.indexOf(c.id)>=0, rate=c.rate||1, hasFx=!!(c.fx&&typeof c.fx==="object");
  return `<div class="idaw-clip${isSel?' is-sel':''}" data-clip data-tid="${tr.id}" data-cid="${c.id}" data-testid="idaw-clip-${c.id}" style="left:${left}px;width:${w}px;border-color:${tr.color};background:${tr.color}22"><canvas data-wave="${c.id}" data-tid="${tr.id}" data-cid="${c.id}"></canvas><div class="idaw-clip-top"><span class="idaw-clip-name">${esc(c.name||"Take")}</span>${hasFx?`<span class="idaw-clip-rate" title="Clip FX">FX</span>`:''}${rate!==1?`<span class="idaw-clip-rate">${rate.toFixed(2)}\u00d7</span>`:''}<button class="idaw-clip-del" data-act="i-clip-del" data-tid="${tr.id}" data-cid="${c.id}" aria-label="Delete clip"><i data-lucide="x" style="width:11px;height:11px"></i></button></div><div class="idaw-h idaw-h-l" data-htype="trim-l" data-tid="${tr.id}" data-cid="${c.id}" title="Trim start"></div><div class="idaw-h idaw-h-r" data-htype="trim-r" data-tid="${tr.id}" data-cid="${c.id}" title="Trim end"></div><span class="idaw-speed" data-htype="speed" data-tid="${tr.id}" data-cid="${c.id}" title="Drag sideways to change speed"><i data-lucide="gauge" style="width:9px;height:9px"></i>${rate.toFixed(2)}\u00d7</span>${isSel?`<span class="idaw-sel-check"><i data-lucide="check" style="width:11px;height:11px"></i></span>`:''}</div>`; }
function ixTimelineHtml(fs){ const S=state.instrum, p=S.project, sw=ixSW(S), bw=sw*16, total=p.bars*16, W=total*sw+48, hw=ixHeadW(), tracks=p.audioTracks||[], sel=S.selBars;
  if(tracks.length&&!tracks.some(t=>t.id===S.armedTrack)) S.armedTrack=tracks[0].id;
  const H=[], R=[]; const bars=Array.from({length:p.bars},(_,b)=>b);
  H.push(`<div class="ix-h ix-r-ruler ix-corner"><span class="ix-k">Bars</span><button data-act="ix-len" data-val="-1" data-testid="ix-len-sub" aria-label="Remove the last bar" class="ix-mini"><i data-lucide="minus" style="width:12px;height:12px"></i></button><b data-testid="ix-bars-count">${p.bars}</b><button data-act="ix-len" data-val="1" data-testid="ix-len-add" aria-label="Add a bar" class="ix-mini"><i data-lucide="plus" style="width:12px;height:12px"></i></button></div>`);
  R.push(`<div class="ix-l ix-r-ruler ix-ruler" data-ix-ruler data-testid="ix-ruler" title="Tap to move the playhead">${bars.map(b=>`<span class="ix-rb" style="left:${b*bw}px;width:${bw}px"><b>${b+1}</b></span>`).join('')}</div>`);
  const hits=bars.map(b=>{ let n=0; p.tracks.forEach(tr=>{ for(let i=b*16;i<(b+1)*16;i++) if(tr.steps[i]) n++; }); return n; });
  if(!ixPhone()) H.push(`<div class="ix-h ix-r-arr ix-hl"><i data-lucide="layout-template" style="width:13px;height:13px"></i><span>Arrange</span></div>`);
  if(!ixPhone()) R.push(`<div class="ix-l ix-r-arr">${bars.map(b=>{ const on=sel&&b>=sel[0]&&b<=sel[1]; const hasA=tracks.some(tr=>(tr.clips||[]).some(c=>(c.start||0)<(b+1)*ixSecBar(p)&&(c.start||0)+(c.dur||0)>b*ixSecBar(p))); return `<button data-act="ix-bar" data-bar="${b}" data-testid="ix-arr-bar-${b}" aria-pressed="${!!on}" class="ix-ab${on?' on':''}" style="left:${b*bw+2}px;width:${bw-4}px"><span class="ix-ab-fill" style="width:${Math.min(100,Math.round(hits[b]/1.6))}%"></span><b>${b+1}</b>${hasA?'<i data-lucide="mic-vocal" style="width:10px;height:10px"></i>':''}</button>`; }).join('')}</div>`);
  H.push(`<button data-act="ix-drums" data-testid="ix-drums-toggle" aria-expanded="${!S.drumsMin}" class="ix-h ix-r-grp ix-grp-h press"><i data-lucide="chevron-${S.drumsMin?'right':'down'}" style="width:13px;height:13px"></i><i data-lucide="drum" style="width:13px;height:13px"></i><span>Drums</span><em>${p.tracks.length}</em></button>`);
  if(S.drumsMin){ const marks=[]; for(let i=0;i<total;i++){ const tr=p.tracks.find(t=>t.steps[i]); if(tr) marks.push(`<i style="left:${i*sw+sw/2-2}px;background:${tr.color}"></i>`); } R.push(`<div class="ix-l ix-r-grp ix-sum" data-testid="ix-drums-summary">${marks.join('')}</div>`); }
  else { R.push(`<div class="ix-l ix-r-grp"></div>`);
    p.tracks.forEach((tr,ti)=>{ H.push(`<div class="ix-h ix-r-drum ix-dh chan-strip" style="--tr-cell:${tr.color}" data-testid="ix-drum-head-${ti}"><span class="ix-dic" style="background:${tr.color}26;color:${tr.color}"><i data-lucide="${tr.icon||'circle'}" style="width:12px;height:12px"></i></span><span class="ix-dn clamp-1">${esc(tr.name)}</span>${tr.melodic?`<select data-act="i-note" data-ti="${ti}" aria-label="${esc(tr.name)} note" data-testid="ix-note-${ti}" class="ix-note">${INSTRUM_NOTES.map(n=>`<option ${n===tr.note?'selected':''}>${n}</option>`).join('')}</select>`:''}<span class="ix-ms">${ixMs('i-mute',`data-ti="${ti}" data-testid="ix-mute-d-${ti}"`,'M',tr.mute,tr.name)}${ixMs('i-solo',`data-ti="${ti}" data-testid="ix-solo-d-${ti}"`,'S',tr.solo,tr.name)}</span></div>`);
      let cells=''; for(let si=0;si<total;si++) cells+=`<button data-act="i-step" data-ti="${ti}" data-step="${si}" data-testid="ix-step-${ti}-${si}" aria-label="${esc(tr.name)} step ${si+1}" class="instrum-cell${tr.steps[si]?' on':''}${si%16===0?' ix-b0':(si%4===0?' ix-b4':'')}"></button>`;
      R.push(`<div class="ix-l ix-r-drum ix-cells${tr.mute?' is-muted':''}" style="--tr-cell:${tr.color}">${cells}</div>`); }); }
  H.push(`<div class="ix-h ix-r-grp ix-grp-h is-static"><i data-lucide="mic-vocal" style="width:13px;height:13px"></i><span>${ixPhone()?'Vocals':'Vocals &amp; audio'}</span><em>${tracks.length}</em></div>`); R.push(`<div class="ix-l ix-r-grp"></div>`);
  const selC=(S.selClips||[]).filter(id=>tracks.some(tr=>(tr.clips||[]).some(c=>c.id===id))); S.selClips=selC;
  tracks.forEach(tr=>{ const isT=tr.id===S.armedTrack; const fxName=(IDAW_FX.find(f=>f.id===(tr.fx&&tr.fx.preset))||{}).name||'Clean';
    H.push(`<div class="ix-h ix-r-aud ix-ah chan-strip${isT?' is-target':''}" style="--tr-cell:${tr.color}" data-testid="ix-vocal-head-${tr.id}"><div class="ix-ah-top"><input value="${esc(tr.name)}" data-act="i-atrack-name" data-tid="${tr.id}" maxlength="20" aria-label="Track name" data-testid="ix-track-name-${tr.id}" class="ix-an"><button data-act="i-atrack-del" data-tid="${tr.id}" data-testid="ix-track-del-${tr.id}" aria-label="Delete track" class="ix-mini is-danger"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button></div><div class="ix-ah-bot"><button data-act="i-atrack-select" data-tid="${tr.id}" data-testid="ix-track-target-${tr.id}" aria-pressed="${isT}" aria-label="Record into ${esc(tr.name)}" title="Record into this track" class="ix-tgt${isT?' on':''}"><i data-lucide="mic" style="width:11px;height:11px"></i></button>${ixMs('i-atrack-mute',`data-tid="${tr.id}" data-testid="ix-mute-a-${tr.id}"`,'M',tr.mute,tr.name)}${ixMs('i-atrack-solo',`data-tid="${tr.id}" data-testid="ix-solo-a-${tr.id}"`,'S',tr.solo,tr.name)}<span class="ix-fxt clamp-1">${fxName}</span></div></div>`);
    R.push(`<div class="idaw-lane ix-r-aud" data-lane data-tid="${tr.id}" style="width:${W}px;--idaw-beat:${sw*4}px">${(tr.clips||[]).map(c=>ixClipHtml(tr,c,selC)).join('')}</div>`); });
  H.push(`<div class="ix-h ix-r-add"><button data-act="i-audio-add" data-testid="ix-add-track" class="ix-add press"><i data-lucide="plus" style="width:13px;height:13px"></i>Track</button></div>`);
  R.push(`<div class="ix-l ix-r-add">${tracks.length?'':`<span class="ix-hint" data-testid="ix-vocals-empty"><i data-lucide="mic" style="width:13px;height:13px"></i>Press the red button to record at the playhead while your beat plays, or import audio.</span>`}</div>`);
  const selOv=sel?`<div class="ix-selov" style="left:${sel[0]*bw}px;width:${(sel[1]-sel[0]+1)*bw}px"></div>`:'';
  return `<div class="studio-panel ix-tl mx-3 sm:mx-4${fs?' is-fs':''}" data-testid="ix-timeline"><div id="i-audio-scroll" class="ix-scroll soft-scroll"><div class="ix-grid" style="grid-template-columns:${hw}px ${W}px;--sw:${sw}px;--bw:${bw}px"><div class="ix-heads">${H.join('')}</div><div id="i-lanes-wrap" class="ix-lanes" style="width:${W}px">${R.join('')}${selOv}<div id="i-playhead"></div></div></div></div></div>`; }
function ixMixerHtml(){ const S=state.instrum, p=S.project, tracks=p.audioTracks||[], target=iTargetTrack();
  const strip=(kind,key,tr,name,color,ms)=>{ const at=kind==='d'?`data-ti="${key}"`:`data-tid="${key}"`; return `<div class="ix-strip${tr.mute?' is-muted':''}" style="--c:${color}" data-testid="ix-strip-${kind}-${key}">
    <p class="ix-sn"><span class="ix-sdot"></span><span class="clamp-1">${esc(name)}</span></p><div class="ix-ms">${ms}</div>
    <label class="ix-kn"><span>Pan <b>${ixPanTxt(tr.pan)}</b></span><input type="range" min="-1" max="1" step="0.05" value="${tr.pan||0}" data-act="ix-pan" data-kind="${kind}" ${at} data-testid="ix-pan-${kind}-${key}" class="i-slider" aria-label="${esc(name)} pan"></label>
    <label class="ix-kn"><span>Reverb <b>${Math.round((tr.rev||0)*100)}%</b></span><input type="range" min="0" max="1" step="0.05" value="${tr.rev||0}" data-act="ix-rev" data-kind="${kind}" ${at} data-testid="ix-rev-${kind}-${key}" class="i-slider" aria-label="${esc(name)} reverb"></label>
    ${kind==='a'?`<select data-act="ix-fx" data-tid="${key}" data-testid="ix-fx-${key}" aria-label="${esc(name)} FX" class="ix-fxsel">${IDAW_FX.map(f=>`<option value="${f.id}" ${(tr.fx&&tr.fx.preset)===f.id?'selected':''}>${f.name}</option>`).join('')}</select>`:''}
    <div class="ix-fd"><input type="range" min="0" max="1" step="0.02" value="${tr.vol==null?0.85:tr.vol}" data-act="${kind==='d'?'i-vol':'i-atrack-vol'}" ${at} data-testid="ix-vol-${kind}-${key}" class="fader-v" aria-label="${esc(name)} volume"><span data-ix-vol>${Math.round((tr.vol==null?0.85:tr.vol)*100)}</span></div></div>`; };
  const d=p.tracks.map((tr,i)=>strip('d',i,tr,tr.name,tr.color,ixMs('i-mute',`data-ti="${i}"`,'M',tr.mute,tr.name)+ixMs('i-solo',`data-ti="${i}"`,'S',tr.solo,tr.name))).join('');
  const a=tracks.map(tr=>strip('a',tr.id,tr,tr.name,tr.color,ixMs('i-atrack-mute',`data-tid="${tr.id}"`,'M',tr.mute,tr.name)+ixMs('i-atrack-solo',`data-tid="${tr.id}"`,'S',tr.solo,tr.name))).join('');
  const master=`<div class="ix-strip is-master" data-testid="ix-strip-master"><p class="ix-sn"><i data-lucide="gauge" style="width:12px;height:12px"></i><span>Master</span></p><p class="ix-mhint">Everything ends up here</p><div class="ix-fd"><input type="range" min="0" max="1" step="0.02" value="${p.master}" data-act="i-master" data-testid="ix-vol-master" class="fader-v" aria-label="Master volume"><span data-ix-mvol>${Math.round(p.master*100)}</span></div><button data-act="i-export" data-testid="ix-mixer-export" class="idaw-btn is-acc w-full"><i data-lucide="download" style="width:14px;height:14px"></i>WAV</button></div>`;
  const fx=target?`<div class="ix-vfx" data-testid="idaw-fx-panel"><div class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-white/60"><i data-lucide="wand-2" style="width:13px;height:13px" class="text-[color:var(--treesh-purple)]"></i>Vocal FX<span class="text-white/30">\u00b7</span><span class="text-white/80">${esc(target.name)}</span><span class="rounded-full bg-[color:var(--treesh-purple)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[color:var(--treesh-purple)]">live + playback</span></div><div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">${IDAW_FX.map(f=>{ const on=target.fx&&target.fx.preset===f.id; return `<button data-act="i-fx-preset" data-tid="${target.id}" data-fx="${f.id}" data-testid="idaw-fx-${f.id}" class="press shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${on?'border-[color:var(--treesh-purple)] bg-[color:var(--treesh-purple)]/20 text-white':'border-white/12 bg-white/5 text-white/60 hover:bg-white/10'}">${f.name}</button>`; }).join('')}</div><div class="mt-1.5 flex items-center gap-2"><span class="text-[10px] font-semibold uppercase tracking-wide text-white/40">Mix</span><input type="range" min="0" max="1" step="0.05" value="${target.fx?target.fx.mix:0.35}" data-act="i-fx-mix" data-tid="${target.id}" aria-label="FX mix" class="i-slider min-w-0 flex-1"><span id="i-fx-mix-val" class="w-9 text-right font-doto text-[11px] text-white/60">${Math.round((target.fx?target.fx.mix:0.35)*100)}%</span></div></div>`:'';
  return `<div class="studio-panel ix-mixer mx-3 sm:mx-4 p-3" data-testid="ix-mixer"><div class="mb-2.5 flex items-center gap-2"><i data-lucide="sliders-vertical" style="width:15px;height:15px" class="text-[color:var(--treesh-purple)]"></i><p class="text-[11px] font-bold uppercase tracking-wide text-white/55">Mixer</p><span class="text-[11px] text-white/35">Volume, pan, mute/solo and reverb for every track</span><button data-act="ix-mixer" data-testid="ix-mixer-close" aria-label="Close mixer" class="ix-mini ml-auto"><i data-lucide="x" style="width:14px;height:14px"></i></button></div><div class="ix-strips no-scrollbar"><div class="ix-sgrp"><p class="ix-sgl"><i data-lucide="drum" style="width:11px;height:11px"></i>Drums</p><div class="ix-srow">${d}</div></div>${tracks.length?`<div class="ix-sgrp"><p class="ix-sgl"><i data-lucide="mic-vocal" style="width:11px;height:11px"></i>Vocals</p><div class="ix-srow">${a}</div></div>`:''}<div class="ix-sgrp"><p class="ix-sgl">&nbsp;</p><div class="ix-srow">${master}</div></div></div>${fx}</div>`; }
function instrumStudioHtml(fs){ const S=state.instrum; ixEnsure(S.project); ixSetPPS(S); const opened=S._opened; S._opened=false; S._pageAnim=false;
  const parts=`${ixTransportHtml()}${instrumPresetsHtml()}${ixArrangeHtml()}${ixSelBarHtml()}${ixTimelineHtml(fs)}${S.mixer?ixMixerHtml():''}`;
  if(fs) return `<div data-instrum-root class="ix-root is-fs flex h-full min-h-0 flex-col tr-fade-in"><div class="shrink-0">${instrumHeaderHtml(true)}</div><div class="ix-fs-body">${parts}</div></div>`;
  return `<div data-instrum-root class="ix-root -mx-4 pb-8 sm:-mx-6 lg:-mx-8${opened?' i-open':''}" data-testid="instrum-studio">${instrumHeaderHtml(false)}<div class="space-y-3">${parts}</div></div>`; }
function instrumLanding(){ return `<div class="flex min-h-[64vh] flex-col items-center justify-center px-4 py-10 text-center" data-testid="instrum-landing">
  <button data-act="nav" data-view="studios" data-testid="instrum-back-studios" class="press absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 sm:left-6 sm:top-6"><i data-lucide="arrow-left" style="width:14px;height:14px"></i>Studios</button>
  <div class="relative mb-6 grid h-24 w-24 place-items-center rounded-[28px] bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)] glow-purple"><i data-lucide="sliders-horizontal" style="width:44px;height:44px"></i></div>
  <p class="font-display text-[11px] uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Instrum Studio</p>
  <h1 class="mt-2 text-4xl font-extrabold sm:text-5xl">Instrum</h1>
  <p class="mx-auto mt-3 max-w-md text-white/55">Your pocket studio on one timeline. Program drums, record vocals over your beat, mix every track and export the whole song. Everything runs in your browser.</p>
  <div class="mt-5 flex flex-wrap justify-center gap-2 text-xs text-white/50">${["Drums + vocals, one timeline","Mixer with pan & reverb","Arrange bars","Record at the playhead","Export the song to WAV"].map(c=>`<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">${c}</span>`).join("")}</div>
  <button data-act="instrum-start" data-testid="instrum-start" class="press mt-7 inline-flex items-center gap-2 rounded-2xl bg-[color:var(--treesh-purple)] px-7 py-3.5 text-base font-bold text-white glow-purple"><i data-lucide="play" style="width:18px;height:18px"></i>Open Studio</button>
</div>`; }
function instrumFaqModal(){ const q=(t,a)=>`<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p class="mb-1 flex items-center gap-2 text-sm font-bold"><i data-lucide="circle-help" style="width:15px;height:15px" class="text-[color:var(--treesh-purple)]"></i>${t}</p><p class="text-sm leading-relaxed text-white/65">${a}</p></div>`;
  const inner=`<div class="mb-3 flex items-center gap-2"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="graduation-cap" style="width:18px;height:18px"></i></span><h3 class="text-lg font-bold">Studio guide &amp; FAQ</h3><button data-act="modal-close" aria-label="Close" data-testid="instrum-faq-close" class="press ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-white/75 hover:bg-white/10"><i data-lucide="x" style="width:18px;height:18px"></i></button></div>
    <div class="max-h-[65vh] space-y-2.5 overflow-y-auto no-scrollbar pr-0.5">
      ${q('One timeline','Drum lanes and vocal tracks share the same timeline. Press Play to hear everything together. Tap the bar numbers at the top to move the playhead.')}
      ${q('Making a beat','Tap the cells in each drum lane to place hits. Every bar can be different. Tap a preset to fill the whole song with a groove, then tweak it.')}
      ${q('Recording vocals','Press the red button. Treesh records into the track with the mic icon lit, starting at the playhead, while your beat plays. Use headphones to avoid echo.')}
      ${q('Arranging your song','Tap the numbered blocks in the Arrange row to select bars. You can duplicate them, insert empty bars, repeat a part to the end, clear the beat or delete bars. Vocals move with the bars.')}
      ${q('Mixer','Open the Mixer to set volume, pan, mute/solo and reverb for every drum lane and vocal track. Pick a vocal FX for each track too.')}
      ${q('Saving & exporting','Use File to save, open or back up a project. Export WAV renders the whole song, drums and vocals, with your mix.')}
    </div>`;
  $("#modal").innerHTML=modalWrap(inner,"instrum-faq-modal","lg"); icons(); }

/* ---- events ---- */
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act; const S=state.instrum; if(!S||!S.project) return;
  if(a==='i-fx-preset'&&S.aplaying){ setTimeout(ixRestart,0); return; }
  if(a.indexOf('ix-')!==0) return; const p=S.project;
  switch(a){
    case 'ix-play': S.aplaying?ixStop(true):ixPlay(); break;
    case 'ix-home': { const was=S.aplaying; ixStop(false); if(was) ixPlay(0); break; }
    case 'ix-loop': p.loop=!p.loop; if(S.aplaying) S._loopOn=p.loop&&!S.recording; iPushHistory(); renderInstrum(); toast(p.loop?'Loop on':'Loop off',p.loop?'The song repeats from the top':'Playback stops at the end'); break;
    case 'ix-mixer': S.mixer=!S.mixer; renderInstrum(); break;
    case 'ix-zoom': { const sc=document.getElementById('i-audio-scroll'); const sec=sc?sc.scrollLeft/IDAW_PPS:0; S.zoom=Math.max(0,Math.min(IX_ZOOM.length-1,ixZ(S)+(+t.dataset.val))); renderInstrum(); const n=document.getElementById('i-audio-scroll'); if(n) n.scrollLeft=sec*IDAW_PPS; break; }
    case 'ix-drums': S.drumsMin=!S.drumsMin; renderInstrum(); break;
    case 'ix-bar': ixSelBar(+t.dataset.bar); break;
    case 'ix-sel-clear': S.selBars=null; renderInstrum(); break;
    case 'ix-arr': ixBarsOp(t.dataset.val); break;
    case 'ix-len': ixLen(+t.dataset.val); break; } });
document.addEventListener('click',e=>{ const r=e.target&&e.target.closest&&e.target.closest('[data-ix-ruler]'); const S=state.instrum; if(!r||!S) return; const q=r.getBoundingClientRect(); const ss=ixSecBar(S.project)/16; const sec=Math.round(Math.max(0,(e.clientX-q.left)/IDAW_PPS)/ss)*ss;
  if(S.aplaying){ ixStop(true); S.playheadSec=sec; ixPlay(sec); } else { S.playheadSec=sec; iAudioSetPlayhead(sec); } });
document.addEventListener('input',e=>{ const el=e.target; if(!el||!el.dataset) return; const a=el.dataset.act; const S=state.instrum; if(!S||!S.project) return; const p=S.project;
  if(a==='ix-pan'||a==='ix-rev'){ const tr=el.dataset.kind==='a'?(p.audioTracks||[]).find(x=>x.id===el.dataset.tid):p.tracks[+el.dataset.ti]; if(!tr) return; tr[a==='ix-pan'?'pan':'rev']=+el.value; const b=el.parentElement&&el.parentElement.querySelector('b'); if(b) b.textContent=a==='ix-pan'?ixPanTxt(tr.pan):Math.round(tr.rev*100)+'%'; ixMixLive(); return; }
  if(a==='i-vol'||a==='i-atrack-vol'){ const s=el.closest('.ix-strip'); const v=s&&s.querySelector('[data-ix-vol]'); if(v) v.textContent=Math.round(+el.value*100); ixMixLive(); return; }
  if(a==='i-master'){ document.querySelectorAll('[data-ix-mvol]').forEach(v=>v.textContent=Math.round(+el.value*100)); document.querySelectorAll('[data-act="i-master"]').forEach(x=>{ if(x!==el) x.value=el.value; }); } });
document.addEventListener('change',e=>{ const el=e.target; if(!el||!el.dataset) return; const a=el.dataset.act; const S=state.instrum; if(!S||!S.project) return;
  if(a==='ix-pan'||a==='ix-rev') iPushHistory();
  else if(a==='ix-fx'){ const tr=(S.project.audioTracks||[]).find(x=>x.id===el.dataset.tid); if(tr){ if(!tr.fx) tr.fx={preset:'clean',mix:0.35}; tr.fx.preset=el.value; iPushHistory(); if(S.armedTrack===tr.id) iRebuildMonitorFx(); if(S.aplaying) ixRestart(); renderInstrum(); } }
  else if(a==='i-bpm') ixTempoChanged(); });
document.addEventListener('keydown',e=>{ const S=state.instrum; if(e.code!=='Space'||!S||!S.started||!(state.view==='instrum'||S.fs)) return; const tg=(e.target&&e.target.tagName)||''; if(/INPUT|TEXTAREA|SELECT/.test(tg)||(e.target&&e.target.isContentEditable)) return; const m=document.getElementById('modal'), m2=document.getElementById('modal2'); if((m&&m.childElementCount)||(m2&&m2.childElementCount)) return; e.preventDefault(); S.aplaying?ixStop(true):ixPlay(); });
(function(){ const W=WHATS_NEW&&WHATS_NEW.instrum; if(!W) return; W.v=(W.v||0)+1; W.date='October 8, 2026'; W.sub='Beat Maker and Vocals are now one studio.'; W.items=[
  {icon:'audio-lines',title:'One timeline for everything',desc:'Drum lanes and vocal tracks now sit on the same timeline and play together. Every bar of your beat can be different.'},
  {icon:'mic',title:'Record over your beat',desc:'Press the red button and Treesh records at the playhead while the song plays.'},
  {icon:'sliders-vertical',title:'A real mixer',desc:'Volume, pan, mute/solo and reverb for every drum lane and vocal track.'},
  {icon:'layout-template',title:'Arrange your song',desc:'Select bars to duplicate, insert, repeat or delete them. Vocals move with the bars.'},
  {icon:'download',title:'Export the whole song',desc:'WAV export now includes your vocals, FX and mix. Older beats and takes open right in the new timeline.'}].concat((W.items||[]).slice(0,2)); })();
