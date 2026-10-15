/* ---------- P9zzq: LyricFlow Verses panel. Every [bracket] section side by side, group by artist, merge, add a line to many, preview + save ---------- */
let _lsvN=0; const lsvId=()=>'v'+(++_lsvN);
const LSV_TYPE_C={verse:'var(--treesh-purple)',hook:'#f5c451',chorus:'#f5c451',refrain:'#f5c451','pre-chorus':'#ff8fb1',bridge:'#3ad6e8',intro:'#9aa3b5',outro:'#9aa3b5',interlude:'#9aa3b5',breakdown:'#ff7a45'};
const LSV_TYPE_I={verse:'mic-vocal',hook:'repeat',chorus:'repeat',refrain:'repeat','pre-chorus':'trending-up',bridge:'git-merge',intro:'log-in',outro:'log-out',interlude:'pause',breakdown:'zap'};
function lsvSplit(label){ const m=String(label||'').match(/^([^:]*?)(?:\s*:\s*(.*))?$/); const type=((m&&m[1])||'').trim(); const who=(m&&m[2]?m[2]:'').split(/\s*(?:&|,|\+|\/)\s*|\s+(?:and|x|with)\s+/i).map(x=>x.trim()).filter(Boolean); return {type,who}; }
function lsvBase(type){ return String(type||'').replace(/\s*[x\u00d7]\s*\d+\s*$/i,'').replace(/\s*#?\d+\s*$/,'').trim().toLowerCase(); }
function lsvJoin(type,who){ return who.length?`${type||'Section'}: ${who.join(' & ')}`:(type||'Section'); }
function lsvMain(){ const s=state.ls&&SONG_BY_ID[state.ls.songId]; return ((s&&s.artist)||(state.ls&&state.ls.artist)||'').trim(); }
function lsvParse(md){ const out=[]; let cur=null;
  String(md||'').split(/\r?\n/).forEach(raw=>{ const l=raw.replace(/\s+$/,''); if(!l.trim()) return;
    if(lsIsSection(l)){ cur={id:lsvId(),label:lsSectionLabel(l),lines:[]}; out.push(cur); return; }
    if(!cur){ cur={id:lsvId(),label:'',lines:[]}; out.push(cur); } cur.lines.push(l.trim()); });
  return out; }
const lsvLines=b=>b.lines.map(x=>String(x).trim()).filter(Boolean);
function lsvText(blocks){ return blocks.filter(b=>b.label.trim()||lsvLines(b).length).map(b=>(b.label.trim()?'['+b.label.trim()+']'+(lsvLines(b).length?'\n':''):'')+lsvLines(b).join('\n')).join('\n\n'); }
function lsvColor(b){ const t=lsvBase(lsvSplit(b.label).type); return LSV_TYPE_C[t]||'var(--treesh-purple)'; }
function lsvWho(b){ const w=lsvSplit(b.label).who; return w.length?w:(lsvMain()?[lsvMain()]:[]); }
function lsvSnap(){ const v=state.lsv; v.hist.push(JSON.stringify(v.blocks)); if(v.hist.length>100) v.hist.shift(); v.fut=[]; v.dirty=true; lsvHistUi(); }
function lsvHistUi(){ const v=state.lsv; if(!v) return; const u=document.querySelector('#lsv [data-testid="lsv-undo"]'), r=document.querySelector('#lsv [data-testid="lsv-redo"]'); if(u) u.disabled=!v.hist.length; if(r) r.disabled=!(v.fut&&v.fut.length); }
function lsvDupes(blocks){ const g={}; blocks.forEach(b=>{ const t=lsvBase(lsvSplit(b.label).type); if(!t||t==='verse') return; (g[t]=g[t]||[]).push(b); });
  return Object.entries(g).filter(([t,l])=>l.length>1&&new Set(l.map(b=>lsvSplit(b.label).who.join('&').toLowerCase())).size>1).map(([t,l])=>({t,ids:l.map(b=>b.id),name:lsvSplit(l[0].label).type.replace(/\s*[x\u00d7]?\s*\d+\s*$/i,'')||t})); }
function lsvMergeLabel(sel){ const first=lsvSplit(sel[0].label); const who=[]; sel.forEach(b=>lsvSplit(b.label).who.forEach(n=>{ if(!who.some(x=>x.toLowerCase()===n.toLowerCase())) who.push(n); })); return lsvJoin(first.type,who); }

function lsvOpen(){ if(!state.ls||state.ls.mode!=='write') return; const ta=$("#ls-write"); const md=lsTaToMd(ta?ta.value:lsItemsToText(state.ls.items));
  state.lsv={blocks:lsvParse(md),orig:md,sel:{},group:LS.get('treesh_lsv_group','order')==='artist'?'artist':'order',layout:LS.get('treesh_lsv_layout','lanes')==='grid'?'grid':'lanes',zoom:lsvClampZ(+LS.get('treesh_lsv_zoom',1)||1),prev:false,hist:[],fut:[],dirty:false,sheet:null};
  if(!state.lsv.blocks.length) state.lsv.blocks.push({id:lsvId(),label:'Verse 1',lines:[]});
  lsvRender(true); }
function lsvClose(force){ const v=state.lsv; if(!v) return; if(v.dirty&&!force){ v.sheet={k:'leave'}; lsvRender(); return; }
  const el=document.getElementById('lsv'); state.lsv=null; if(!el) return; el.classList.add('is-out'); setTimeout(()=>el.remove(),260); const b=document.querySelector('[data-testid="ls-verses-open"]'); if(b) try{ b.focus({preventScroll:true}); }catch(e){} }
function lsvSave(){ const v=state.lsv; if(!v) return; const ta=$("#ls-write"); if(!ta){ lsvClose(true); return; }
  ta.value=lsMdToTa(lsvText(v.blocks)); ta.dispatchEvent(new Event('input',{bubbles:true})); try{ lsHlSync(); }catch(e){}
  lsvClose(true); lsSave(); lsvBadge(); }

function lsvCard(b,i,grouped){ const v=state.lsv, on=!!v.sel[b.id], sp=lsvSplit(b.label), base=lsvBase(sp.type), n=lsvLines(b).length, who=lsvWho(b);
  const chips=who.map(p=>`<span class="lsv-who-c" style="--pc:${performerColor(p)}"><i></i>${esc(p)}</span>`).join('')+(!sp.who.length&&who.length?'<em>untagged</em>':'');
  const mv=grouped?'':`<button type="button" data-act="lsv-move" data-id="${b.id}" data-d="-1" data-testid="lsv-move-left-${i}" aria-label="Move left" title="Move left" class="lsv-mini press"${i===0?' disabled':''}><i data-lucide="chevron-left"></i></button><button type="button" data-act="lsv-move" data-id="${b.id}" data-d="1" data-testid="lsv-move-right-${i}" aria-label="Move right" title="Move right" class="lsv-mini press"${i===v.blocks.length-1?' disabled':''}><i data-lucide="chevron-right"></i></button>`;
  return `<article class="lsv-card${on?' is-sel':''}" data-lsv-card="${b.id}" data-kin="${esc(base||'x')}" data-testid="lsv-card-${i}" style="--c:${lsvColor(b)};--i:${Math.min(i,12)}">
    <header class="lsv-ch"><button type="button" data-act="lsv-sel" data-id="${b.id}" data-testid="lsv-select-${i}" role="checkbox" aria-checked="${on}" aria-label="Select section" class="lsv-check press"><i data-lucide="check"></i></button>
      <span class="lsv-ti"><i data-lucide="${LSV_TYPE_I[base]||'text'}"></i><em class="lsv-num">${i+1}</em></span>
      <span class="lsv-lab"><span class="lsv-br">[</span><input data-lsv-label="${b.id}" data-testid="lsv-label-${i}" value="${esc(b.label)}" placeholder="Untitled" spellcheck="false" aria-label="Section label"><span class="lsv-br">]</span></span></header>
    <div class="lsv-who">${chips}</div>
    <div data-lsv-lines="${b.id}" data-testid="lsv-lines-${i}" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Section lines" data-rt="m" spellcheck="false" data-ph="Write the lines for this section\u2026" class="lsv-ta lsv-rt no-scrollbar${b.lines.join('').trim()?'':' is-empty'}">${rtEdHtml(b.lines.join('\n'))}</div>
    <footer class="lsv-cf"><small data-lsv-count="${b.id}">${n} line${n!==1?'s':''}</small><span class="flex-1"></span>${mv}<button type="button" data-act="lsv-dup" data-id="${b.id}" data-testid="lsv-duplicate-${i}" aria-label="Duplicate" title="Duplicate" class="lsv-mini press"><i data-lucide="copy"></i></button><button type="button" data-act="lsv-del" data-id="${b.id}" data-testid="lsv-delete-${i}" aria-label="Delete section" title="Delete" class="lsv-mini is-del press"><i data-lucide="trash-2"></i></button></footer></article>`; }
function lsvTrack(){ const v=state.lsv; const idx=b=>v.blocks.indexOf(b);
  const add=`<button type="button" data-act="lsv-add" data-testid="lsv-add-section" class="lsv-add press"><i data-lucide="plus"></i><b>New section</b><small>Adds a [Verse] at the end</small></button>`;
  if(v.group!=='artist') return v.blocks.map((b,i)=>lsvCard(b,i,false)).join('')+add;
  const lanes=[]; v.blocks.forEach(b=>{ const k=lsvWho(b).join(' & ')||'Untagged'; let ln=lanes.find(x=>x.k===k); if(!ln){ ln={k,list:[]}; lanes.push(ln); } ln.list.push(b); });
  return lanes.map((ln,li)=>`<section class="lsv-lane" data-testid="lsv-lane-${li}" style="--pc:${performerColor(ln.k)}"><div class="lsv-lane-h"><span class="lsv-lane-n"><i></i>${esc(ln.k)}</span><small>${ln.list.length} section${ln.list.length!==1?'s':''}</small><button type="button" data-act="lsv-sel-lane" data-ids="${ln.list.map(b=>b.id).join(',')}" data-testid="lsv-lane-select-${li}" class="lsv-lane-b press">Select all</button></div><div class="lsv-lane-cards">${ln.list.map(b=>lsvCard(b,idx(b),true)).join('')}</div></section>`).join('')+add; }
function lsvPrev(){ const v=state.lsv, txt=lsvText(v.blocks), o=lsvParse(v.orig); const L=bs=>bs.reduce((a,b)=>a+lsvLines(b).length,0);
  const dl=L(v.blocks)-L(o), ds=v.blocks.length-o.length; const sum=[ds?`${ds>0?'+':''}${ds} section${Math.abs(ds)!==1?'s':''}`:'',dl?`${dl>0?'+':''}${dl} line${Math.abs(dl)!==1?'s':''}`:''].filter(Boolean).join(' \u00b7 ')||(v.dirty?'Labels or order changed':'No changes yet');
  const body=txt.split('\n').map(l=>{ const t=l.trim(); if(!t) return '<span class="lsv-pgap"></span>'; if(lsIsSection(t)){ const lab=lsSectionLabel(t); return `<p class="lsv-psec" style="--c:${lsvColor({label:lab})}">${esc(lab)}</p>`; } return `<p class="lsv-pl">${lsInlineFmt(t)}</p>`; }).join('');
  return `<div class="lsv-prev" data-testid="lsv-preview"><div class="lsv-prev-in"><p class="lsv-prev-k"><i data-lucide="eye"></i>Preview<span data-testid="lsv-preview-summary">${esc(sum)}</span></p>${body||'<p class="lsv-pl is-empty">Nothing here yet.</p>'}</div></div>`; }
function lsvSheet(){ const v=state.lsv, s=v.sheet; if(!s) return ''; const sel=v.blocks.filter(b=>v.sel[b.id]);
  let inner='';
  if(s.k==='merge'){ const lab=s.label!=null?s.label:lsvMergeLabel(sel);
    inner=`<p class="lsv-sk">Merge ${sel.length} sections</p><h3>How should they come together?</h3>
      <div class="lsv-sel-list">${sel.map(b=>`<span style="--c:${lsvColor(b)}">[${esc(b.label||'Untitled')}]</span>`).join('<i data-lucide="plus"></i>')}</div>
      <label class="lsv-fl">New label<span class="lsv-lab is-big"><span class="lsv-br">[</span><input id="lsv-merge-label" data-testid="lsv-merge-label" value="${esc(lab)}" spellcheck="false"><span class="lsv-br">]</span></span></label>
      <button type="button" data-act="lsv-merge-do" data-mode="one" data-testid="lsv-merge-one" class="lsv-opt press"><span class="lsv-opt-i"><i data-lucide="combine"></i></span><span><b>Merge into one section</b><small>All the lines go into one section, where the first one sits. The others are removed.</small></span></button>
      <button type="button" data-act="lsv-merge-do" data-mode="label" data-testid="lsv-merge-label-only" class="lsv-opt press"><span class="lsv-opt-i"><i data-lucide="tags"></i></span><span><b>Share one label</b><small>Every section keeps its own lines and place. They all get the new label.</small></span></button>`; }
  else if(s.k==='line'){ inner=`<p class="lsv-sk">Add a line to ${sel.length} section${sel.length!==1?'s':''}</p><h3>Write it once, add it everywhere</h3>
      <input id="lsv-line-input" data-testid="lsv-line-input" class="lsv-in" placeholder="e.g. (Yeah, yeah)" value="${esc(s.text||'')}" spellcheck="false">
      <div class="lsv-seg is-full" role="radiogroup"><button type="button" data-act="lsv-line-pos" data-val="end" data-testid="lsv-line-end" role="radio" aria-checked="${s.pos!=='start'}" class="press">At the end</button><button type="button" data-act="lsv-line-pos" data-val="start" data-testid="lsv-line-start" role="radio" aria-checked="${s.pos==='start'}" class="press">At the start</button></div>
      <button type="button" data-act="lsv-line-do" data-testid="lsv-line-add" class="lsv-go press"><i data-lucide="list-plus"></i>Add to ${sel.length} section${sel.length!==1?'s':''}</button>`; }
  else if(s.k==='leave'){ inner=`<p class="lsv-sk">Unsaved changes</p><h3>Save your verse changes?</h3><p class="lsv-sp">Your edits in this panel are not in the lyrics yet.</p>
      <button type="button" data-act="lsv-save" data-testid="lsv-leave-save" class="lsv-go press"><i data-lucide="check"></i>Save changes</button>
      <button type="button" data-act="lsv-discard" data-testid="lsv-leave-discard" class="lsv-opt is-plain press"><span><b>Discard</b></span></button>`; }
  return `<div class="lsv-sheet" data-testid="lsv-sheet-${s.k}"><button type="button" data-act="lsv-sheet-close" class="lsv-sheet-bd" aria-label="Close" tabindex="-1"></button><div class="lsv-sheet-in" role="dialog" aria-modal="true"><button type="button" data-act="lsv-sheet-close" data-testid="lsv-sheet-close" aria-label="Close" class="lsv-x press"><i data-lucide="x"></i></button>${inner}</div></div>`; }
function lsvRender(first){ const v=state.lsv, root=document.querySelector('[data-ls-root]'); if(!v||!root) return;
  let el=document.getElementById('lsv'); const tr=el&&el.querySelector('.lsv-track'); const sx=tr?tr.scrollLeft:0, sy=tr?tr.scrollTop:0;
  if(!el){ el=document.createElement('div'); el.id='lsv'; el.className='lsv'; el.setAttribute('data-testid','ls-verses-panel'); root.appendChild(el); }
  const L=v.blocks.reduce((a,b)=>a+lsvLines(b).length,0), sel=v.blocks.filter(b=>v.sel[b.id]).length, dup=lsvDupes(v.blocks);
  const seg=(val,ic,l)=>`<button type="button" data-act="lsv-group" data-val="${val}" data-testid="lsv-group-${val}" role="radio" aria-checked="${v.group===val}" class="press"><i data-lucide="${ic}"></i><span>${l}</span></button>`;
  const lay=(val,ic,l)=>`<button type="button" data-act="lsv-layout" data-val="${val}" data-testid="lsv-layout-${val}" role="radio" aria-checked="${v.layout===val}" title="${l}" aria-label="${l}" class="press is-ic"><i data-lucide="${ic}"></i></button>`;
  const grid=v.layout==='grid';
  const zoomUi=`<div class="lsv-zoom" data-testid="lsv-zoom"><button type="button" data-act="lsv-zoom" data-d="-1" data-testid="lsv-zoom-out" aria-label="Zoom out" title="Zoom out" class="press"><i data-lucide="minus"></i></button><button type="button" data-act="lsv-zoom-fit" data-testid="lsv-zoom-fit" title="Fit everything" class="lsv-zoom-v press"><span data-testid="lsv-zoom-value">${Math.round(v.zoom*100)}%</span></button><button type="button" data-act="lsv-zoom" data-d="1" data-testid="lsv-zoom-in" aria-label="Zoom in" title="Zoom in" class="press"><i data-lucide="plus"></i></button></div>`;
  const hints=!v.prev&&dup.length?`<div class="lsv-hints no-scrollbar" data-testid="lsv-hints">${dup.map((d,i)=>`<button type="button" data-act="lsv-dupe" data-ids="${d.ids.join(',')}" data-testid="lsv-dupe-${i}" class="lsv-hint press"><i data-lucide="sparkles"></i><span><b>${d.ids.length} ${esc(d.name)}s</b> with different artists</span><em>Merge</em></button>`).join('')}</div>`:'';
  const map=v.prev?'':`<div class="lsv-map no-scrollbar" data-testid="lsv-map">${v.blocks.map((b,i)=>{ const t=lsvSplit(b.label).type||'Untitled'; const ab=t.split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase(); return `<button type="button" data-act="lsv-jump" data-id="${b.id}" data-testid="lsv-map-${i}" title="${esc(b.label||'Untitled')}" class="lsv-dot press${v.sel[b.id]?' is-sel':''}" style="--c:${lsvColor(b)}">${esc(ab)}</button>`; }).join('')}</div>`;
  const selbar=sel&&!v.prev?`<div class="lsv-selbar" data-testid="lsv-selbar"><span class="lsv-selc"><b data-testid="lsv-sel-count">${sel}</b> selected</span><button type="button" data-act="lsv-sel-clear" data-testid="lsv-sel-clear" class="lsv-sb press"><i data-lucide="x"></i>Clear</button><span class="flex-1"></span><button type="button" data-act="lsv-line-open" data-testid="lsv-add-line" class="lsv-sb press"><i data-lucide="list-plus"></i><span>Add a line</span></button><button type="button" data-act="lsv-merge-open" data-testid="lsv-merge" class="lsv-sb is-pri press"${sel<2?' disabled title="Pick two or more"':''}><i data-lucide="combine"></i><span>Merge</span></button></div>`:'';
  el.className='lsv'+(first?' is-in':'')+(v.prev?' is-prev':'');
  el.innerHTML=`<div class="lsv-head"><button type="button" data-act="lsv-close" data-testid="lsv-close" aria-label="Close verses" class="lsx-ic lg press"><i data-lucide="x"></i></button>
      <div class="lsv-tt"><p class="lsx-kick">LyricFlow</p><h2>Verses</h2><small data-testid="lsv-summary">${v.blocks.length} section${v.blocks.length!==1?'s':''} \u00b7 ${L} line${L!==1?'s':''}</small></div>
      <div class="lsv-hacts"><div class="lfh" role="group" aria-label="Edit history"><button type="button" data-act="lsv-undo" data-testid="lsv-undo" onmousedown="event.preventDefault()" aria-label="Undo" title="Undo (${lfhMac()?'\u2318Z':'Ctrl+Z'})" class="lfh-b press"${v.hist.length?'':' disabled'}><i data-lucide="undo-2"></i></button><button type="button" data-act="lsv-redo" data-testid="lsv-redo" onmousedown="event.preventDefault()" aria-label="Redo" title="Redo (${lfhMac()?'\u21e7\u2318Z':'Ctrl+Y'})" class="lfh-b press"${v.fut&&v.fut.length?'':' disabled'}><i data-lucide="redo-2"></i></button></div>
      <button type="button" data-act="lsv-prev" data-testid="lsv-preview-toggle" aria-pressed="${v.prev}" class="lsv-pv press${v.prev?' is-on':''}"><i data-lucide="${v.prev?'columns-3':'eye'}"></i><span>${v.prev?'Sections':'Preview'}</span></button>
      <button type="button" data-act="lsv-save" data-testid="lsv-save" class="lsx-save press"><i data-lucide="check"></i>Save</button></div></div>
    ${v.prev?'':`<div class="lsv-bar no-scrollbar"><div class="lsv-seg" role="radiogroup" aria-label="Arrange">${seg('order','list-ordered','In order')}${seg('artist','users','By artist')}</div><span class="flex-1"></span><div class="lsv-seg" role="radiogroup" aria-label="Layout">${lay('lanes','columns-3','Side by side')}${lay('grid','layout-grid','Connected grid')}</div>${zoomUi}</div>${map}`}${hints}
    ${v.prev?lsvPrev():`<div class="lsv-track no-scrollbar${v.group==='artist'?' is-grouped':''}${grid?' is-grid':''}${v.zoom<.95?' is-zoomed':''}" data-testid="lsv-track" style="--z:${v.zoom}"><div class="lsv-z" data-testid="lsv-zoom-layer">${lsvTrack()}${grid?'<svg class="lsv-links" data-testid="lsv-links" aria-hidden="true"></svg>':''}</div></div>`}${selbar}${lsvSheet()}`;
  icons(); const t2=el.querySelector('.lsv-track'); if(t2){ t2.scrollLeft=sx; t2.scrollTop=sy; lsvWireTrack(t2); }
  el.querySelectorAll('.lsv-ta').forEach(lsvFit); if(grid) requestAnimationFrame(lsvLinks);
  const fi=el.querySelector('#lsv-line-input,#lsv-merge-label'); if(fi&&v.sheet&&!v.sheet._f){ v.sheet._f=1; setTimeout(()=>{ try{ fi.focus(); if(fi.id==='lsv-merge-label') fi.select(); }catch(e){} },60); } }
function lsvFit(ta){ if(!ta) return; ta.style.height='auto'; ta.style.height=Math.max(96,ta.scrollHeight+2)+'px'; }
function lsvClampZ(z){ return Math.max(.35,Math.min(1.4,Math.round(z*100)/100)); }
function lsvSetZoom(z,cx,cy,commit){ const v=state.lsv, tr=document.querySelector('#lsv .lsv-track'); if(!v||!tr) return; z=lsvClampZ(z); const z0=v.zoom; if(z===z0&&!commit) return;
  const r=tr.getBoundingClientRect(); const px=cx==null?r.width/2:cx-r.left, py=cy==null?r.height/2:cy-r.top; const k=z/z0;
  const nx=(tr.scrollLeft+px)*k-px, ny=(tr.scrollTop+py)*k-py; v.zoom=z; tr.style.setProperty('--z',z); tr.classList.toggle('is-zoomed',z<.95); tr.scrollLeft=nx; tr.scrollTop=ny;
  const lab=document.querySelector('[data-testid="lsv-zoom-value"]'); if(lab) lab.textContent=Math.round(z*100)+'%';
  if(v.layout==='grid') lsvLinksSoon(); if(commit) LS.set('treesh_lsv_zoom',z); }
let _lsvLT=0; function lsvLinksSoon(){ cancelAnimationFrame(_lsvLT); _lsvLT=requestAnimationFrame(lsvLinks); }
function lsvFit2(){ const v=state.lsv, tr=document.querySelector('#lsv .lsv-track'), zl=tr&&tr.querySelector('.lsv-z'); if(!zl) return; let z=1.4;
  for(; z>.35; z=Math.round((z-.05)*100)/100){ tr.style.setProperty('--z',z); if(v.layout==='grid'?tr.scrollHeight<=tr.clientHeight+2:tr.scrollWidth<=tr.clientWidth+2) break; }
  v.zoom=1; lsvSetZoom(z,null,null,true); tr.scrollLeft=0; tr.scrollTop=0; }
function lsvLinks(){ const v=state.lsv, svg=document.querySelector('#lsv .lsv-links'), zl=svg&&svg.parentElement; if(!v||!svg) return; const W=zl.scrollWidth, H=zl.scrollHeight; svg.setAttribute('width',W); svg.setAttribute('height',H); svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const boxes=v.blocks.map(b=>{ const c=zl.querySelector(`[data-lsv-card="${b.id}"]`); if(!c) return null; let x=0,y=0,n=c; while(n&&n!==zl){ x+=n.offsetLeft; y+=n.offsetTop; n=n.offsetParent; } return {x,y,w:c.offsetWidth,h:c.offsetHeight,c:lsvColor(b)}; });
  const rows={}; boxes.forEach(b=>{ if(!b) return; const k=Math.round(b.y/8); rows[k]=Math.max(rows[k]||0,b.y+b.h); });
  let d=''; const R=14;
  for(let i=0;v.group!=='artist'&&i<boxes.length-1;i++){ const a=boxes[i], b=boxes[i+1]; if(!a||!b) continue; const col=a.c;
    if(Math.abs(a.y-b.y)<8&&b.x>a.x){ const y=a.y+30; d+=`<path d="M${a.x+a.w+3},${y} H${b.x-6} M${b.x-12},${y-5} L${b.x-6},${y} L${b.x-12},${y+5}" stroke="${col}"/>`; continue; }
    const bot=rows[Math.round(a.y/8)]||a.y+a.h, my=bot+(b.y-bot)/2, ax=a.x+a.w/2, bx=b.x+b.w/2, dir=bx<ax?-1:1, r=Math.min(R,Math.abs(bx-ax)/2,Math.max(2,(b.y-bot)/2-2));
    d+=`<path d="M${ax},${a.y+a.h+3} V${my-r} Q${ax},${my} ${ax+dir*r},${my} H${bx-dir*r} Q${bx},${my} ${bx},${my+r} V${b.y-6} M${bx-5},${b.y-12} L${bx},${b.y-6} L${bx+5},${b.y-12}" stroke="${col}"/>`; }
  svg.innerHTML=`<g class="lsv-flow">${d}</g><g class="lsv-kinl"></g>`; }
function lsvKin(card){ const svg=document.querySelector('#lsv .lsv-links'); document.querySelectorAll('#lsv .lsv-card.is-kin').forEach(c=>c.classList.remove('is-kin')); const g=svg&&svg.querySelector('.lsv-kinl'); if(g) g.innerHTML=''; if(!card) return;
  const k=card.dataset.kin; if(!k||k==='x') return; const kin=[...document.querySelectorAll(`#lsv .lsv-card[data-kin="${k}"]`)].filter(c=>c!==card); if(!kin.length) return; kin.forEach(c=>c.classList.add('is-kin')); card.classList.add('is-kin');
  if(!g) return; const zl=svg.parentElement; const pos=c=>{ let x=0,y=0,n=c; while(n&&n!==zl){ x+=n.offsetLeft; y+=n.offsetTop; n=n.offsetParent; } return {x:x+c.offsetWidth/2,y:y+18}; }; const a=pos(card);
  g.innerHTML=kin.map(c=>{ const b=pos(c), mx=(a.x+b.x)/2, my=Math.min(a.y,b.y)-40-Math.abs(a.x-b.x)*.08; return `<path d="M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}" stroke="${card.style.getPropertyValue('--c')||'var(--treesh-purple)'}"/>`; }).join(''); }
function lsvWireTrack(tr){ if(tr._w) return; tr._w=1;
  tr.addEventListener('wheel',e=>{ const v=state.lsv; if(!v) return;
    if(e.ctrlKey||e.metaKey){ e.preventDefault(); lsvSetZoom(v.zoom*Math.exp(-Math.max(-25,Math.min(25,e.deltaY))*.01),e.clientX,e.clientY); clearTimeout(tr._zt); tr._zt=setTimeout(()=>LS.set('treesh_lsv_zoom',v.zoom),300); return; }
    if(v.layout==='grid'||Math.abs(e.deltaX)>Math.abs(e.deltaY)) return;
    const card=!e.shiftKey&&e.target.closest&&e.target.closest('.lsv-card'); if(card&&card.scrollHeight>card.clientHeight+2) return;
    e.preventDefault(); const dy=e.deltaY*(e.deltaMode===1?32:e.deltaMode===2?tr.clientWidth:1);
    if(Math.abs(dy)<40){ tr._tx=null; tr.scrollLeft+=dy; return; }
    const max=tr.scrollWidth-tr.clientWidth; tr._tx=Math.max(0,Math.min(max,(tr._tx==null?tr.scrollLeft:tr._tx)+dy*1.2));
    if(!tr._raf){ tr.classList.add('is-wheel'); const step=()=>{ if(tr._tx==null){ tr._raf=0; tr.classList.remove('is-wheel'); return; } const d=tr._tx-tr.scrollLeft, s0=tr.scrollLeft; if(Math.abs(d)<1.5){ tr.scrollLeft=tr._tx; tr._tx=null; tr._raf=0; tr.classList.remove('is-wheel'); return; } tr.scrollLeft+=Math.sign(d)*Math.max(2,Math.abs(d)*.22); if(tr.scrollLeft===s0) tr._tx=null; tr._raf=requestAnimationFrame(step); }; tr._raf=requestAnimationFrame(step); } },{passive:false});
  let p0=null; const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY), mid=t=>[(t[0].clientX+t[1].clientX)/2,(t[0].clientY+t[1].clientY)/2];
  tr.addEventListener('touchstart',e=>{ if(e.touches.length===2&&state.lsv){ p0={d:dist(e.touches),z:state.lsv.zoom}; tr.classList.add('is-pinch'); } },{passive:true});
  tr.addEventListener('touchmove',e=>{ if(!p0||e.touches.length!==2) return; e.preventDefault(); const m=mid(e.touches); lsvSetZoom(p0.z*dist(e.touches)/p0.d,m[0],m[1]); },{passive:false});
  const end=e=>{ if(p0&&(!e.touches||e.touches.length<2)){ p0=null; tr.classList.remove('is-pinch'); if(state.lsv) LS.set('treesh_lsv_zoom',state.lsv.zoom); } };
  tr.addEventListener('touchend',end); tr.addEventListener('touchcancel',end);
  ['gesturestart','gesturechange'].forEach(k=>tr.addEventListener(k,e=>e.preventDefault(),{passive:false}));
  tr.addEventListener('mouseover',e=>{ const c=e.target.closest&&e.target.closest('.lsv-card'); if(c!==tr._kc){ tr._kc=c; lsvKin(c); } });
  tr.addEventListener('mouseleave',()=>{ tr._kc=null; lsvKin(null); }); }
function lsvBlk(id){ return state.lsv&&state.lsv.blocks.find(b=>b.id===id); }
function lsvMergeDo(mode){ const v=state.lsv; const sel=v.blocks.filter(b=>v.sel[b.id]); if(sel.length<2) return; const inp=document.getElementById('lsv-merge-label'); const lab=((inp&&inp.value)||lsvMergeLabel(sel)).replace(/^\[|\]$/g,'').trim(); lsvSnap();
  if(mode==='one'){ const keep=sel[0], seen=[JSON.stringify(lsvLines(keep))]; keep.lines=lsvLines(keep);
    sel.slice(1).forEach(b=>{ const k=JSON.stringify(lsvLines(b)); if(!seen.includes(k)){ keep.lines.push(...lsvLines(b)); seen.push(k); } v.blocks.splice(v.blocks.indexOf(b),1); });
    keep.label=lab; v.sel={}; v.sel[keep.id]=true; toast('Merged into one section','['+lab+']'); }
  else { sel.forEach(b=>{ b.label=lab; }); toast(sel.length+' sections share one label','['+lab+']'); }
  v.sheet=null; lsvRender(); setTimeout(()=>lsvJump(sel[0].id),40); }
function lsvJump(id){ const c=document.querySelector(`#lsv [data-lsv-card="${id}"]`); if(!c) return; c.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}); c.classList.remove('is-flash'); void c.offsetWidth; c.classList.add('is-flash'); }
function lsvBadge(){ const b=document.querySelector('[data-testid="ls-verses-count"]'), ta=$("#ls-write"); if(!b||!ta) return; const n=ta.value.split('\n').filter(l=>lsIsSection(l.replace(/[\u200B\uFEFF]/g,''))).length; b.textContent=n; b.classList.toggle('hidden',!n); }

function lsvAct(act,t){ const v=state.lsv; if(act==='ls-verses-open'){ lsvOpen(); return; } if(!v) return; const id=t.dataset.id;
  switch(act){
    case 'lsv-close': lsvClose(); break;
    case 'lsv-discard': lsvClose(true); break;
    case 'lsv-save': lsvSave(); break;
    case 'lsv-prev': v.prev=!v.prev; v.sheet=null; lsvRender(); break;
    case 'lsv-group': v.group=t.dataset.val==='artist'?'artist':'order'; LS.set('treesh_lsv_group',v.group); lsvRender(); break;
    case 'lsv-layout': v.layout=t.dataset.val==='grid'?'grid':'lanes'; LS.set('treesh_lsv_layout',v.layout); lsvRender(); break;
    case 'lsv-zoom': lsvSetZoom(v.zoom+(+t.dataset.d||0)*.1,null,null,true); break;
    case 'lsv-zoom-fit': lsvFit2(); break;
    case 'lsv-undo': case 'lsv-redo': { const un=act==='lsv-undo', from=un?v.hist:(v.fut=v.fut||[]), to=un?(v.fut=v.fut||[]):v.hist; const h=from.pop(); if(h==null) break; to.push(JSON.stringify(v.blocks));
      const ae=document.activeElement, fk=ae&&ae.dataset?(ae.dataset.lsvLines?['lines',ae.dataset.lsvLines]:ae.dataset.lsvLabel?['label',ae.dataset.lsvLabel]:null):null;
      v.blocks=JSON.parse(h); const ids=new Set(v.blocks.map(b=>b.id)); Object.keys(v.sel).forEach(k=>{ if(!ids.has(k)) delete v.sel[k]; }); v.dirty=lsvText(v.blocks)!==lsvText(lsvParse(v.orig)); v.sheet=null; lsvRender();
      const f=fk&&document.querySelector(`#lsv [data-lsv-${fk[0]}="${fk[1]}"]`); if(f) try{ f.focus({preventScroll:true}); if(f.setSelectionRange) f.setSelectionRange(1e9,1e9); }catch(e){}
      const hb=document.querySelector(`#lsv [data-testid="${act}"]`); if(hb){ hb.classList.remove('is-pop'); void hb.offsetWidth; hb.classList.add('is-pop'); } break; }
    case 'lsv-sel': { if(v.sel[id]) delete v.sel[id]; else v.sel[id]=true; lsvRender(); break; }
    case 'lsv-sel-lane': { const ids=(t.dataset.ids||'').split(',').filter(Boolean); const all=ids.every(x=>v.sel[x]); ids.forEach(x=>{ if(all) delete v.sel[x]; else v.sel[x]=true; }); lsvRender(); break; }
    case 'lsv-sel-clear': v.sel={}; lsvRender(); break;
    case 'lsv-dupe': { v.sel={}; (t.dataset.ids||'').split(',').forEach(x=>{ if(x) v.sel[x]=true; }); v.sheet={k:'merge'}; lsvRender(); break; }
    case 'lsv-merge-open': if(v.blocks.filter(b=>v.sel[b.id]).length>1){ v.sheet={k:'merge'}; lsvRender(); } break;
    case 'lsv-merge-do': lsvMergeDo(t.dataset.mode); break;
    case 'lsv-line-open': v.sheet={k:'line',pos:'end',text:''}; lsvRender(); break;
    case 'lsv-line-pos': { const inp=document.getElementById('lsv-line-input'); v.sheet.text=inp?inp.value:v.sheet.text; v.sheet.pos=t.dataset.val; v.sheet._f=0; lsvRender(); break; }
    case 'lsv-line-do': { const inp=document.getElementById('lsv-line-input'); const txt=((inp&&inp.value)||'').trim(); if(!txt){ toast('Type a line first'); if(inp) inp.focus(); break; }
      const sel=v.blocks.filter(b=>v.sel[b.id]); lsvSnap(); sel.forEach(b=>{ b.lines=lsvLines(b); if(v.sheet.pos==='start') b.lines.unshift(txt); else b.lines.push(txt); }); v.sheet=null; lsvRender(); toast('Line added to '+sel.length+' section'+(sel.length!==1?'s':''),txt); break; }
    case 'lsv-sheet-close': v.sheet=null; lsvRender(); break;
    case 'lsv-add': { lsvSnap(); const n=v.blocks.filter(b=>lsvBase(lsvSplit(b.label).type)==='verse').length+1; const b={id:lsvId(),label:'Verse '+n,lines:[]}; v.blocks.push(b); if(v.group==='artist'){ v.group='order'; } lsvRender(); setTimeout(()=>{ lsvJump(b.id); const ta=document.querySelector(`#lsv [data-lsv-lines="${b.id}"]`); if(ta) try{ ta.focus({preventScroll:true}); }catch(e){} },60); break; }
    case 'lsv-dup': { const b=lsvBlk(id); if(!b) break; lsvSnap(); const c={id:lsvId(),label:b.label,lines:b.lines.slice()}; v.blocks.splice(v.blocks.indexOf(b)+1,0,c); lsvRender(); setTimeout(()=>lsvJump(c.id),40); break; }
    case 'lsv-del': { const b=lsvBlk(id); if(!b) break; lsvSnap(); v.blocks.splice(v.blocks.indexOf(b),1); delete v.sel[id]; lsvRender(); toast('Section removed','Tap undo to bring it back'); break; }
    case 'lsv-move': { const b=lsvBlk(id); if(!b) break; const i=v.blocks.indexOf(b), j=i+(+t.dataset.d||0); if(j<0||j>=v.blocks.length) break; lsvSnap(); v.blocks.splice(i,1); v.blocks.splice(j,0,b); lsvRender(); setTimeout(()=>lsvJump(b.id),30); break; }
    case 'lsv-jump': lsvJump(id); break;
  } }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act; if(a==='ls-verses-open'||a.indexOf('lsv-')===0){ if(t.disabled) return; lsvAct(a,t); } });
document.addEventListener('input',e=>{ const t=e.target; if(!t||!state.lsv) return;
  if(t.dataset&&t.dataset.lsvLabel){ const b=lsvBlk(t.dataset.lsvLabel); if(!b) return; if(!t._snap){ lsvSnap(); t._snap=1; } clearTimeout(t._snapT); t._snapT=setTimeout(()=>{ t._snap=0; },900); b.label=t.value.replace(/^\[|\]$/g,''); lsvCardMeta(b,t.closest('.lsv-card')); return; }
  if(t.dataset&&t.dataset.lsvLines){ const b=lsvBlk(t.dataset.lsvLines); if(!b) return; if(!t._snap){ lsvSnap(); t._snap=1; } clearTimeout(t._snapT); t._snapT=setTimeout(()=>{ t._snap=0; },900); b.lines=t.value.split('\n'); lsvFit(t); if(state.lsv.layout==='grid') lsvLinksSoon(); const n=lsvLines(b).length, c=document.querySelector(`#lsv [data-lsv-count="${b.id}"]`); if(c) c.textContent=n+' line'+(n!==1?'s':''); } });
function lsvCardMeta(b,card){ if(!card) return; const sp=lsvSplit(b.label), who=lsvWho(b); card.style.setProperty('--c',lsvColor(b)); const w=card.querySelector('.lsv-who'); if(w) w.innerHTML=who.map(p=>`<span class="lsv-who-c" style="--pc:${performerColor(p)}"><i></i>${esc(p)}</span>`).join('')+(!sp.who.length&&who.length?'<em>untagged</em>':'');
  const d=document.querySelector(`#lsv [data-act="lsv-jump"][data-id="${b.id}"]`); if(d){ d.style.setProperty('--c',lsvColor(b)); d.textContent=(sp.type||'Untitled').split(/\s+/).map(x=>x[0]).join('').slice(0,3).toUpperCase(); d.title=b.label||'Untitled'; } }
document.addEventListener('change',e=>{ const t=e.target; if(state.lsv&&t&&t.dataset&&(t.dataset.lsvLabel||t.dataset.lsvLines)) t._snap=0; });
document.addEventListener('keydown',e=>{ if(!state.lsv) return; if(e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); if(state.lsv.sheet){ state.lsv.sheet=null; lsvRender(); } else lsvClose(); return; }
  if(e.key==='Enter'&&state.lsv.sheet){ if(e.target.id==='lsv-line-input'){ e.preventDefault(); lsvAct('lsv-line-do',e.target); } else if(e.target.id==='lsv-merge-label'){ e.preventDefault(); } } },true);
window.addEventListener('resize',()=>{ if(state.lsv&&state.lsv.layout==='grid') lsvLinksSoon(); });
document.addEventListener('input',e=>{ if(!e.target||e.target.id!=='ls-write') return; lsvBadge(); const f=document.querySelector('[data-testid="ls-find-online"]'); if(f) f.classList.toggle('hidden',!!e.target.value.replace(/[\u200B\uFEFF\s]/g,'')); });

function lsvBtnHtml(){ const n=String(lsItemsToText(state.ls&&state.ls.items)).split('\n').filter(lsIsSection).length;
  return `<button type="button" data-act="ls-verses-open" data-testid="ls-verses-open" title="See every section side by side" class="lsx-fb lsv-open press"><i data-lucide="columns-3"></i><span>Verses</span><b data-testid="ls-verses-count" class="${n?'':'hidden'}">${n}</b></button>`; }
const _rLS9q=renderLS; renderLS=function(){ const r=_rLS9q.apply(this,arguments); if(state.lsv){ if(!state.lsOpen||!state.ls||state.ls.mode!=='write') state.lsv=null; else lsvRender(); } return r; };
const _cLS9q=closeLS; closeLS=function(){ if(state.lsv){ lsvClose(); if(state.lsv) return; } return _cLS9q.apply(this,arguments); };
