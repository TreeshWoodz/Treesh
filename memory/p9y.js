/* ---------- P9y: Instrum launch modal, Instrum phone layout (tabs), Magic Markup in the top bar, uploads on every device ---------- */
/* Instrum: no landing page, a launch modal opens or starts a project */
const _ixl={del:null,newAsk:false};
function ixBoot(){ if(state.instrum&&state.instrum.started) return true; const AC=window.AudioContext||window.webkitAudioContext; if(!AC){ toast('Audio not supported here'); return false; }
  try{ _iAC=new AC(); }catch(e){ toast('Audio not supported'); return false; } _iMaster=_iAC.createGain(); _iMaster.connect(_iAC.destination);
  state.instrum={started:true,project:instrumBlankProject(),playing:false,step:0,visStep:-1,fs:false,history:[],hi:-1,activePreset:null}; _iMaster.gain.value=state.instrum.project.master; iPushHistory(); return true; }
function ixGo(){ const S=state.instrum; if(!S) return; try{ _iAC.resume(); }catch(e){} S._opened=true; S._autoLaunch=false; S.selBars=null; S.selClips=[]; closeModal(); if(state.view!=='instrum') navigate('instrum'); else renderInstrum(true); }
function ixlMeta(b){ const v=(b.audioTracks||[]).length; return [(b.bpm||90)+' BPM',(b.bars||1)+' bar'+((b.bars||1)>1?'s':''),v?v+' vocal track'+(v>1?'s':''):''].filter(Boolean).join(' \u00b7 '); }
function ixlHtml(){ const S=state.instrum, cur=S&&S.started?S.project:null, beats=state.beats||[], dirty=cur&&iProjectDirty();
  const rows=beats.map((b,i)=>{ const ask=_ixl.del===b.id; return `<div class="ixl-row${ask?' is-ask':''}" style="--i:${Math.min(i,10)}" data-testid="ix-saved-${b.id}"><button type="button" data-ixl="open" data-id="${b.id}" data-testid="ix-saved-open-${b.id}" class="ixl-rb press"><span class="ixl-disc"><i data-lucide="disc-3"></i></span><span class="ixl-rt"><b class="clamp-1">${esc(b.name||'Untitled beat')}</b><small>${ixlMeta(b)}</small></span><span class="ixl-open">Open</span></button>${ask?`<button type="button" data-ixl="del-yes" data-id="${b.id}" data-testid="ix-saved-del-yes-${b.id}" class="ixl-del-yes press">Delete</button><button type="button" data-ixl="del-no" data-testid="ix-saved-del-no-${b.id}" class="ixl-x press" aria-label="Keep project"><i data-lucide="x"></i></button>`:`<button type="button" data-ixl="del" data-id="${b.id}" data-testid="ix-saved-del-${b.id}" class="ixl-x press" aria-label="Delete ${esc(b.name||'project')}"><i data-lucide="trash-2"></i></button>`}</div>`; }).join('');
  const pres=INSTRUM_PRESETS.map(pr=>`<button type="button" data-ixl="preset" data-id="${pr.id}" data-testid="ix-launch-preset-${pr.id}" class="ixl-chip press"><b>${esc(pr.name)}</b><small>${pr.bpm} BPM</small></button>`).join('');
  return `<div class="ixl" data-testid="ix-launch"><div class="ixl-head"><span class="ixl-ic"><i data-lucide="sliders-horizontal"></i></span><div class="min-w-0 flex-1"><p class="ixl-k">Instrum Studio</p><h3 class="ixl-t">Open or start a project</h3></div><button data-act="modal-close" aria-label="Close" data-testid="ix-launch-close" class="isa-x press"><i data-lucide="x"></i></button></div>
    ${_ixl.newAsk?`<div class="ixl-warn" data-testid="ix-launch-unsaved"><i data-lucide="circle-alert"></i><span class="min-w-0 flex-1">${esc(cur.name||'Your beat')} has unsaved changes.</span><button type="button" data-ixl="new-yes" data-testid="ix-launch-new-confirm" class="ixl-warn-b is-go press">Start new</button><button type="button" data-ixl="new-no" data-testid="ix-launch-new-cancel" class="ixl-warn-b press">Keep it</button></div>`:''}
    <div class="ixl-start${cur?' has-cur':''}">
      <button type="button" data-ixl="new" data-testid="ix-launch-new" class="ixl-new press"><span class="ixl-new-ic"><i data-lucide="plus"></i></span><span><b>New project</b><small>4 bars \u00b7 90 BPM \u00b7 drums and vocals</small></span></button>
      ${cur?`<button type="button" data-ixl="resume" data-testid="ix-launch-resume" class="ixl-card press"><i data-lucide="play"></i><span class="min-w-0"><b class="clamp-1">${esc(cur.name||'Untitled beat')}</b><small>Continue${dirty?' \u00b7 unsaved':''}</small></span></button>`:''}
      <button type="button" data-ixl="import" data-testid="ix-launch-import" class="ixl-card press"><i data-lucide="file-up"></i><span><b>Import file</b><small>Treesh beat (.json)</small></span></button>
    </div>
    <div class="ixl-sec"><p class="ixl-sl"><i data-lucide="wand-sparkles"></i>Start from a groove</p><div class="ixl-chips no-scrollbar">${pres}</div></div>
    <div class="ixl-sec"><p class="ixl-sl"><i data-lucide="folder-open"></i>Saved projects <span>${beats.length}</span></p>${beats.length?`<div class="ixl-list soft-scroll" data-testid="ix-saved-list">${rows}</div>`:`<div class="isa-empty" data-testid="ix-saved-empty"><i data-lucide="disc-3"></i><p>No saved projects yet.</p></div>`}</div></div>`; }
function ixLaunch(){ const m=$("#modal"); if(!m) return; _ixl.del=null; _ixl.newAsk=false; m.innerHTML=modalWrap(ixlHtml(),"ix-launch-modal","lg"); icons(); syncScrollLock(); }
function ixlRender(){ const box=document.querySelector('#modal [data-testid="ix-launch"]'); if(!box) return; box.outerHTML=ixlHtml(); icons(); }
function ixlNew(preset){ const had=!!(state.instrum&&state.instrum.started); if(!ixBoot()) return; if(had) iDoNewProject(); if(preset) iApplyPreset(preset); ixGo(); }
function ixlImport(){ const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
  inp.addEventListener('change',()=>{ const f=inp.files&&inp.files[0]; if(!f||!ixBoot()) return; ixGo(); iImportData(f); }); inp.click(); }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="ix-launch"]'); if(!t) return; e.stopPropagation(); ixLaunch(); },true);
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-ixl]'); if(!b) return; const a=b.dataset.ixl, id=b.dataset.id;
  if(a==='new'){ if(state.instrum&&state.instrum.started&&iProjectDirty()){ _ixl.newAsk=true; ixlRender(); return; } ixlNew(); }
  else if(a==='new-yes') ixlNew();
  else if(a==='new-no'){ _ixl.newAsk=false; ixlRender(); }
  else if(a==='preset'){ if(state.instrum&&state.instrum.started&&iProjectDirty()){ _ixl.newAsk=true; ixlRender(); return; } ixlNew(id); }
  else if(a==='resume') ixGo();
  else if(a==='import') ixlImport();
  else if(a==='open'){ if(!ixBoot()) return; iOpenLoad(id); ixGo(); }
  else if(a==='del'){ _ixl.del=id; ixlRender(); }
  else if(a==='del-no'){ _ixl.del=null; ixlRender(); }
  else if(a==='del-yes'){ const b0=(state.beats||[]).find(x=>x.id===id); state.beats=(state.beats||[]).filter(x=>x.id!==id); LS.set('treesh_beats',state.beats); if(state.instrum&&state.instrum.project&&state.instrum.project.id===id) state.instrum.project.id=null; _ixl.del=null; ixlRender(); toast('Project deleted',b0&&b0.name||''); } });
viewInstrum=function(){ if(!state.instrum||!state.instrum.started){ if(!ixBoot()) return `<div class="px-4 py-16 text-center text-white/60" data-testid="instrum-unsupported">Audio isn\u2019t supported in this browser.</div>`;
    const S=state.instrum; S._opened=true; S._autoLaunch=true; setTimeout(()=>{ if(state.instrum===S&&S._autoLaunch&&state.view==='instrum'&&!S.project.id&&!iProjectDirty()) ixLaunch(); S._autoLaunch=false; },80); }
  if(state.instrum.fs) return instrumFSPlaceholder(); return instrumStudioHtml(false); };
instrumOpenModal=function(){ ixLaunch(); };

/* Instrum on phones: transport on top, Timeline / Mixer / Arrange tabs at the bottom */
function ixTransportPhoneHtml(){ const S=state.instrum, p=S.project, on=!!S.aplaying, rec=!!S.recording, armed=!!S.armed, canU=S.history&&S.hi>0, canR=S.history&&S.hi<(S.history.length-1), sb=ixSecBar(p);
  return `<div class="studio-panel ix-tp ixp-tp mx-3${S.menu?' relative z-[80]':''}" data-testid="ix-transport"><div class="ixp-r1">
    <button data-act="ix-home" data-testid="ix-home" aria-label="Back to start" class="i-btn ixp-sq"><i data-lucide="skip-back" style="width:17px;height:17px"></i></button>
    <button data-act="ix-play" data-testid="instrum-play" aria-label="${on?'Pause':'Play'}" class="i-play-btn press shrink-0 ${on?'playing':''}"><i data-lucide="${on?'pause':'play'}" style="width:23px;height:23px" class="${on?'':'fill-current translate-x-[1px]'}"></i></button>
    <button data-act="i-rec" data-testid="idaw-record" aria-label="${rec?'Stop recording':'Record at the playhead'}" class="idaw-rec shrink-0 ${rec?'recording':''} ${armed?'armed':''}"><span class="dot"></span></button>
    <div class="ix-lcd ixp-lcd"><span id="i-audio-time" data-testid="ix-time" class="font-doto">${ixTimeTxt(S.playheadSec||0,p)}</span><span class="ix-lcd-sub" data-testid="ix-length">${p.bars} bar${p.bars>1?'s':''} \u00b7 ${iFmtTime(p.bars*sb)}</span></div></div>
   <div class="ixp-r2"><div class="ixp-bpm"><button data-act="i-bpm-dec" aria-label="Slower" data-testid="ix-bpm-dec" class="i-btn"><i data-lucide="minus" style="width:15px;height:15px"></i></button><label><input type="number" inputmode="numeric" min="40" max="220" value="${p.bpm}" data-act="i-bpm" data-testid="instrum-bpm" aria-label="Tempo" class="i-lcd font-doto"><span>BPM</span></label><button data-act="i-bpm-inc" aria-label="Faster" data-testid="ix-bpm-inc" class="i-btn"><i data-lucide="plus" style="width:15px;height:15px"></i></button></div>
    <button data-act="ix-loop" data-testid="ix-loop" aria-pressed="${!!p.loop}" aria-label="Loop the song" class="i-btn ixp-sq ${p.loop?'on':''}"><i data-lucide="repeat" style="width:17px;height:17px"></i></button>
    <button data-act="i-metronome" data-testid="instrum-metronome" aria-label="Metronome" class="i-btn ixp-sq ${p.metronome?'on':''}">${METRONOME_SVG}</button>
    <button data-act="i-undo" data-testid="instrum-undo" aria-label="Undo" class="i-btn ixp-sq" ${canU?'':'disabled'}><i data-lucide="undo-2" style="width:17px;height:17px"></i></button>
    <button data-act="i-redo" data-testid="instrum-redo" aria-label="Redo" class="i-btn ixp-sq" ${canR?'':'disabled'}><i data-lucide="redo-2" style="width:17px;height:17px"></i></button></div></div>`; }
function ixToolsPhoneHtml(){ const S=state.instrum, armed=!!S.armed, tracks=S.project.audioTracks||[], z=ixZ(S);
  return `<div class="ixp-tools no-scrollbar mx-3" data-testid="instrum-tools-row">
    <button data-act="i-arm" data-testid="idaw-arm" class="idaw-btn shrink-0 ${armed?'on':''}"><i data-lucide="mic" style="width:15px;height:15px"></i>${armed?'Mic on':'Mic'}</button>
    <button data-act="i-monitor" data-testid="idaw-monitor" class="idaw-btn shrink-0 ${S.monitor?'on':''}" ${armed?'':'disabled'}><i data-lucide="headphones" style="width:15px;height:15px"></i>Monitor</button>
    <div class="idaw-meter shrink-0" title="Input level"><div class="idaw-meter-fill" id="i-meter-fill"></div></div>
    <button data-act="i-audio-import" data-testid="idaw-import" class="idaw-btn shrink-0"><i data-lucide="upload" style="width:15px;height:15px"></i>Import</button>
    <button data-act="i-select-mode" data-testid="idaw-select" class="idaw-btn shrink-0 ${S.selectMode?'on':''}" ${tracks.length?'':'disabled'}><i data-lucide="box-select" style="width:15px;height:15px"></i>Select</button>
    <span class="ixp-zoom"><button data-act="ix-zoom" data-val="-1" data-testid="ix-zoom-out" aria-label="Zoom out" class="i-btn" ${z<=0?'disabled':''}><i data-lucide="zoom-out" style="width:16px;height:16px"></i></button><button data-act="ix-zoom" data-val="1" data-testid="ix-zoom-in" aria-label="Zoom in" class="i-btn" ${z>=IX_ZOOM.length-1?'disabled':''}><i data-lucide="zoom-in" style="width:16px;height:16px"></i></button></span>
    <input type="file" id="i-audio-file" accept="audio/*" class="hidden"></div>`; }
function ixArrPhoneHtml(){ const S=state.instrum, p=S.project, sel=S.selBars, sb=ixSecBar(p), tracks=p.audioTracks||[];
  const tiles=Array.from({length:p.bars},(_,b)=>{ const on=!!(sel&&b>=sel[0]&&b<=sel[1]); const hasA=tracks.some(tr=>(tr.clips||[]).some(c=>(c.start||0)<(b+1)*sb&&(c.start||0)+(c.dur||0)>b*sb));
    const cols=Array.from({length:16},(_,i)=>{ let n=0; p.tracks.forEach(tr=>{ if(tr.steps[b*16+i]) n++; }); return `<i${n?` class="on" style="height:${Math.min(100,28+n*18)}%"`:''}></i>`; }).join('');
    return `<button type="button" data-act="ix-bar" data-bar="${b}" data-testid="ix-arr-bar-${b}" aria-pressed="${on}" class="ixp-bar press${on?' on':''}"><span class="ixp-bar-t"><b>${b+1}</b>${hasA?'<i data-lucide="mic-vocal"></i>':''}</span><span class="ixp-bar-v">${cols}</span></button>`; }).join('');
  const op=(v,ic,l)=>`<button type="button" data-act="ix-arr" data-val="${v}" data-testid="ix-arr-${v}" class="ixp-op press${v==='del'?' is-del':''}"><i data-lucide="${ic}"></i>${l}</button>`;
  const n=sel?sel[1]-sel[0]+1:0;
  return `<div class="ixp-arr">${instrumPresetsHtml()}
    <section class="studio-panel ixp-card mx-3" data-testid="ix-song-card"><div class="ixp-ch"><b>Song</b><span>${p.bars} bar${p.bars>1?'s':''} \u00b7 ${iFmtTime(p.bars*sb)}</span></div>
      <div class="ixp-line"><span>Length</span><div class="ixp-step"><button data-act="ix-len" data-val="-1" data-testid="ix-len-sub" aria-label="Remove the last bar" class="i-btn"><i data-lucide="minus" style="width:15px;height:15px"></i></button><b data-testid="ix-bars-count">${p.bars}</b><button data-act="ix-len" data-val="1" data-testid="ix-len-add" aria-label="Add a bar" class="i-btn"><i data-lucide="plus" style="width:15px;height:15px"></i></button></div></div>
      <div class="ixp-line"><span>Swing</span><input type="range" min="0" max="0.6" step="0.05" value="${p.swing}" data-act="i-swing" data-testid="ix-swing" aria-label="Swing" class="i-slider"></div>
      <div class="ixp-2"><button data-act="i-clear" data-testid="instrum-clear" class="idaw-btn"><i data-lucide="eraser" style="width:15px;height:15px"></i>Clear drums</button><button data-act="i-random" data-testid="instrum-random" class="idaw-btn"><i data-lucide="dices" style="width:15px;height:15px"></i>Randomize</button></div></section>
    <section class="studio-panel ixp-card mx-3" data-testid="ix-bars-card"><div class="ixp-ch"><b>Bars</b>${sel?`<span class="ixp-sel" data-testid="ix-arr-label">${n>1?`Bars ${sel[0]+1}\u2013${sel[1]+1}`:`Bar ${sel[0]+1}`}</span><button data-act="ix-sel-clear" data-testid="ix-sel-clear" aria-label="Clear selection" class="ix-mini"><i data-lucide="x" style="width:14px;height:14px"></i></button>`:''}</div>
      <div class="ixp-bars">${tiles}</div>
      ${sel?`<div class="ixp-ops" data-testid="ix-arrange-bar">${op('dup','copy-plus','Duplicate')}${op('insert','between-vertical-start','Insert empty')}${op('fill','repeat-2','Repeat to end')}${op('clear','eraser','Clear beat')}${op('del','trash-2','Delete')}</div>`:''}</section></div>`; }
function ixTabsHtml(tab){ const t=(v,ic,l)=>`<button type="button" data-act="ix-ptab" data-val="${v}" data-testid="ix-tab-btn-${v}" role="tab" aria-selected="${tab===v}" class="ixp-tab press${tab===v?' on':''}"><i data-lucide="${ic}"></i><span>${l}</span></button>`;
  return `<nav class="ixp-tabs dark-surface" data-testid="ix-phone-tabs" role="tablist" aria-label="Studio sections">${t('tl','audio-lines','Timeline')}${t('mix','sliders-vertical','Mixer')}${t('arr','layout-template','Arrange')}</nav>`; }
const _ixSH9y=instrumStudioHtml; instrumStudioHtml=function(fs){ if(!ixPhone()) return _ixSH9y.apply(this,arguments);
  const S=state.instrum; ixEnsure(S.project); ixSetPPS(S); const opened=S._opened; S._opened=false; S._pageAnim=false; const tab=S.ptab||'tl';
  const body=tab==='mix'?ixMixerHtml():tab==='arr'?ixArrPhoneHtml():`${ixToolsPhoneHtml()}${ixSelBarHtml()}${ixTimelineHtml(fs)}`;
  const parts=`${ixTransportPhoneHtml()}<div class="ixp-body is-${tab}" data-testid="ix-tab-${tab}">${body}</div>${ixTabsHtml(tab)}`;
  if(fs) return `<div data-instrum-root class="ix-root is-fs is-ph flex h-full min-h-0 flex-col tr-fade-in"><div class="shrink-0">${instrumHeaderHtml(true)}</div><div class="ix-fs-body">${parts}</div></div>`;
  return `<div data-instrum-root class="ix-root is-ph -mx-4${opened?' i-open':''}" data-testid="instrum-studio">${instrumHeaderHtml(false)}<div class="ixp-stack">${parts}</div></div>`; };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-act="ix-ptab"]'); const S=state.instrum; if(!b||!S) return; if(S.ptab===b.dataset.val) return; S.ptab=b.dataset.val; renderInstrum(); if(!S.fs){ try{ window.scrollTo({top:0}); }catch(_){} } });
let _ixPh=ixPhone(), _ixRzT=0;
window.addEventListener('resize',()=>{ clearTimeout(_ixRzT); _ixRzT=setTimeout(()=>{ const ph=ixPhone(); if(ph===_ixPh) return; _ixPh=ph; const S=state.instrum; if(S&&S.started&&(state.view==='instrum'||S.fs)) renderInstrum(); },160); });

/* Magic Markup lives in the top bar, no floating button */
function mkTopShow(){ try{ return mkS().fab!==false||!!state.mkEdit; }catch(e){ return true; } }
function mkTopBtnHtml(){ if(!mkTopShow()) return ''; const on=!!state.mkEdit; return `<button type="button" data-act="mk-toggle" data-testid="topbar-markup-button" aria-pressed="${on}" aria-label="${on?'Finish Magic Markup':'Magic Markup: customize this page'}" title="Magic Markup" class="mk-top press grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10${on?' is-on':''}"><i data-lucide="${on?'check':'wand-sparkles'}" style="width:18px;height:18px"></i></button>`; }
function mkTopSync(){ const old=document.querySelector('[data-testid="topbar-markup-button"]'); const html=mkTopBtnHtml();
  if(old){ if(html) old.outerHTML=html; else old.remove(); }
  else if(html){ const s=document.querySelector('header [data-testid="open-search-overlay-button"]'); if(s) s.insertAdjacentHTML('beforebegin',html); } }
const _mkRC9y=mkRenderChrome; mkRenderChrome=function(){ const r=_mkRC9y.apply(this,arguments); const f=document.getElementById('mk-fab'); if(f&&f.innerHTML) f.innerHTML=''; mkTopSync(); icons(); return r; };

/* uploads on every device: pickers made in code get parked in the page (iPhone Safari drops detached ones), HEIC photos turn into JPEG */
(function(){ const ck=HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click=function(){ try{ if(this.type==='file'&&!this.isConnected&&document.body){ document.querySelectorAll('input.up-park').forEach(x=>{ if(x!==this) x.remove(); }); this.classList.add('up-park'); this.setAttribute('aria-hidden','true'); this.tabIndex=-1; document.body.appendChild(this); } }catch(e){} return ck.apply(this,arguments); }; })();
async function upHeicJpeg(f){ const nm=(f.name||'photo').replace(/\.(heic|heif)$/i,'')+'.jpg', mk=b=>new File([b],nm,{type:'image/jpeg',lastModified:Date.now()});
  const u=URL.createObjectURL(f);
  try{ if(await isDecodes(u)){ const im=new Image(); im.src=u; try{ await im.decode(); }catch(e){} const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight; c.getContext('2d').drawImage(im,0,0); const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.92)); if(b) return mk(b); } }catch(e){} finally{ try{ URL.revokeObjectURL(u); }catch(e){} }
  await isHeicLib(); const out=await window.heic2any({blob:f,toType:'image/jpeg',quality:.92}); return mk(Array.isArray(out)?out[0]:out); }
document.addEventListener('change',e=>{ const el=e.target; if(!el||el.tagName!=='INPUT'||el.type!=='file'||el._upPass) return; const fs=el.files?[...el.files]:[]; if(!fs.some(isHeic)) return;
  e.stopImmediatePropagation(); toast('Converting your photo','HEIC photos take a moment');
  Promise.all(fs.map(f=>isHeic(f)?upHeicJpeg(f):f)).then(out=>{ try{ const dt=new DataTransfer(); out.forEach(f=>dt.items.add(f)); el.files=dt.files; }catch(_){ try{ Object.defineProperty(el,'files',{value:out,configurable:true}); }catch(__){} }
    el._upPass=true; try{ el.dispatchEvent(new Event('change',{bubbles:true})); } finally{ el._upPass=false; } })
  .catch(()=>toast('Couldn\u2019t open that photo','Go online to convert HEIC photos, or pick a JPG')); },true);
