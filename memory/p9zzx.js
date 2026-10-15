/* ---------- P9zzx: LyricFlow undo / redo. One history for Write, Sync and Verses (100 steps), cleared when the editor closes ---------- */
const LFH={ls:null,st:[],i:-1,t:0,mute:0,typing:0,pend:false,saved:''}, LFH_MAX=100;
const lfhMac=()=>/Mac|iPhone|iPad|iPod/.test(navigator.platform||navigator.userAgent||'');
function lfhKey(items,title){ return JSON.stringify((items||[]).map(it=>[it.type,String(it.text||''),it.type==='line'?(it.t==null?null:Math.round(it.t*100)):0,it.explain||'',it.words&&it.words.length?it.words:null]))+'\u0001'+(title||''); }
function lfhSnap(){ const ls=state.ls; if(!ls) return null; let txt=null;
  if(ls.mode==='write'){ const ta=$('#ls-write'); if(ta){ txt=ta.value; ls.items=lsParseWriteText(txt,ls.items); } } else if(ls.mode==='sync') lsSyncTextInputs();
  const items=JSON.parse(JSON.stringify(ls.items||[])); return {k:lfhKey(items,ls.title),items,title:ls.title||'',txt}; }
const lfhSame=(a,b)=>a.k===b.k&&(a.txt==null||b.txt==null||a.txt===b.txt);
function lfhClear(){ clearTimeout(LFH.t); LFH.t=0; LFH.ls=null; LFH.st=[]; LFH.i=-1; LFH.pend=false; LFH.saved=''; }
function lfhReset(){ lfhClear(); LFH.ls=state.ls; if(state.ls){ const s=lfhSnap(); LFH.st=[s]; LFH.i=0; LFH.saved=state.ls.dirty?'':s.k; } lfhUi(); }
function lfhRec(){ clearTimeout(LFH.t); LFH.t=0; LFH.pend=false; const ls=state.ls; if(!ls||LFH.mute) return false; if(LFH.ls!==ls){ lfhReset(); return false; }
  const s=lfhSnap(), cur=LFH.st[LFH.i]; if(cur&&lfhSame(cur,s)){ if(s.txt!=null) cur.txt=s.txt; lfhUi(); return false; }
  LFH.st.length=LFH.i+1; LFH.st.push(s); while(LFH.st.length>LFH_MAX+1) LFH.st.shift(); LFH.i=LFH.st.length-1; lfhUi(); return true; }
function lfhSoon(ms){ clearTimeout(LFH.t); LFH.t=setTimeout(lfhRec,ms||0); }
function lfhUi(){ const u=document.querySelector('[data-testid="ls-undo"]'), r=document.querySelector('[data-testid="ls-redo"]');
  if(u) u.disabled=!(LFH.i>0||LFH.pend); if(r) r.disabled=!(LFH.i<LFH.st.length-1&&!LFH.pend); }
function lfhBtns(){ const m=lfhMac(); return `<div class="lfh" role="group" aria-label="Edit history" data-testid="ls-history"><button type="button" data-act="ls-undo" data-testid="ls-undo" onmousedown="event.preventDefault()" aria-label="Undo" title="Undo (${m?'\u2318Z':'Ctrl+Z'})" class="lfh-b press" disabled><i data-lucide="undo-2"></i></button><button type="button" data-act="ls-redo" data-testid="ls-redo" onmousedown="event.preventDefault()" aria-label="Redo" title="Redo (${m?'\u21e7\u2318Z':'Ctrl+Y'})" class="lfh-b press" disabled><i data-lucide="redo-2"></i></button></div>`; }
function lfhCaret(ta,old,nv){ let a=0; while(a<old.length&&a<nv.length&&old[a]===nv[a]) a++; let b=0; while(b<old.length-a&&b<nv.length-a&&old[old.length-1-b]===nv[nv.length-1-b]) b++; return nv.length-b; }
function lfhApply(s){ const ls=state.ls; if(!ls||!s) return; LFH.mute++;
  try{ ls.items=JSON.parse(JSON.stringify(s.items)); ls.title=s.title; if(ls.idx>=ls.items.length) ls.idx=ls.items.length-1;
    const tEl=document.getElementById('ls-doc-title'); if(tEl&&ls.isBlank){ const sp=tEl.querySelector('.clamp-1'); (sp||tEl).textContent=ls.title||'Untitled lyrics'; }
    if(ls.mode==='write'){ const ta=$('#ls-write'); if(ta){ const old=ta.value, nv=s.txt!=null?s.txt:lsTaToMd(lsItemsToText(ls.items)), foc=document.activeElement===ta;
        ta.value=nv; ta.dispatchEvent(new Event('input',{bubbles:true})); try{ lsHlSync(); }catch(e){}
        const pos=lfhCaret(ta,old,nv); if(foc) ta.setSelectionRange(pos,pos);
        const li=nv.slice(0,pos).split('\n').length-1, row=ta.children[li]; if(row) row.scrollIntoView({block:'nearest',behavior:state.perfMode?'auto':'smooth'}); } }
    else { const box=$('#ls-lines'), top=box?box.scrollTop:0; lsRenderBody(); const b2=$('#ls-lines'); if(b2) b2.scrollTop=top; }
    ls.dirty=s.k!==LFH.saved; const d=$('#ls-dirty'); if(d) d.classList.toggle('hidden',!ls.dirty);
  } finally { LFH.mute--; }
  clearTimeout(LFH.t); LFH.t=0; LFH.pend=false; lfhUi(); }
function lfhGo(d){ if(!state.ls) return; if(LFH.ls!==state.ls) lfhReset(); lfhRec(); const j=LFH.i+d; if(j<0||j>=LFH.st.length) return;
  LFH.i=j; lfhApply(LFH.st[j]); const b=document.querySelector(`[data-testid="ls-${d<0?'undo':'redo'}"]`); if(b){ b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); } }

/* record: structural edits right away, typing in short word-sized steps */
const _lsMD9zzx=lsMarkDirty; lsMarkDirty=function(){ const r=_lsMD9zzx.apply(this,arguments); if(state.ls&&!LFH.mute&&!LFH.typing) lfhSoon(); return r; };
const lfhField=t=>!!(t&&t.closest&&(t.id==='ls-write'||(t.dataset&&t.dataset.lsText!=null&&t.closest('#ls-lines'))));
document.addEventListener('input',e=>{ if(state.lsOpen&&!LFH.mute&&lfhField(e.target)) LFH.typing=1; },true);
document.addEventListener('input',e=>{ if(!LFH.typing) return; LFH.typing=0; const it=e.inputType||'';
  const brk=/^(insertParagraph|insertLineBreak|insertFromPaste|insertFromDrop|deleteByCut|format)/.test(it)||/\s/.test(e.data||'');
  LFH.pend=true; lfhUi(); lfhSoon(brk?0:650); });
document.addEventListener('click',e=>{ if(!LFH.t||!state.lsOpen) return; const a=e.target&&e.target.closest&&e.target.closest('[data-ls-root] [data-act]'); if(a&&!/^ls-(undo|redo)$/.test(a.dataset.act)) lfhRec(); },true);
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="ls-undo"],[data-act="ls-redo"]'); if(!t||t.disabled) return; e.preventDefault(); lfhGo(t.dataset.act==='ls-undo'?-1:1); });
function lfhKeyAct(e){ const t=e.target; if(t&&t.closest&&t.closest('#lsv-line-input,#lsv-merge-label')) return null; if(t&&t!==document.body&&t.closest&&!t.closest('[data-ls-root]')) return null; return t; }
document.addEventListener('keydown',e=>{ if(!state.lsOpen||!state.ls||e.isComposing) return; if(!(e.metaKey||e.ctrlKey)||e.altKey) return; const k=(e.key||'').toLowerCase();
  const redo=(k==='z'&&e.shiftKey)||(k==='y'&&!e.shiftKey), undo=k==='z'&&!e.shiftKey; if(!undo&&!redo) return;
  const t=lfhKeyAct(e); if(t===null) return; e.preventDefault(); e.stopImmediatePropagation();
  if(state.lsv) lsvAct(redo?'lsv-redo':'lsv-undo',t||document.body); else lfhGo(redo?1:-1); },true);
document.addEventListener('beforeinput',e=>{ if(!state.lsOpen||(e.inputType!=='historyUndo'&&e.inputType!=='historyRedo')) return; if(lfhKeyAct(e)===null) return;
  e.preventDefault(); const redo=e.inputType==='historyRedo'; if(state.lsv) lsvAct(redo?'lsv-redo':'lsv-undo',e.target); else lfhGo(redo?1:-1); },true);

/* history starts when a document opens, survives re-renders, saves move the "saved" point, closing clears it */
const _rLS9zzx=renderLS; renderLS=function(){ const r=_rLS9zzx.apply(this,arguments); try{ if(!state.lsOpen||!state.ls) lfhClear(); else if(LFH.ls!==state.ls) lfhReset(); else { lfhRec(); if(!state.ls.dirty) LFH.saved=LFH.st[LFH.i].k; lfhUi(); } }catch(e){ console.warn('ls history',e); } return r; };
const _lsSv9zzx=lsSave; lsSave=function(){ const r=_lsSv9zzx.apply(this,arguments); try{ if(state.ls&&!state.ls.dirty&&LFH.ls===state.ls){ lfhRec(); LFH.saved=LFH.st[LFH.i].k; } }catch(e){} return r; };
const _cLS9zzx=closeLS; closeLS=function(){ const r=_cLS9zzx.apply(this,arguments); if(!state.ls) lfhClear(); return r; };
const _lsRB9zzx=lsRenderBody; lsRenderBody=function(){ const r=_lsRB9zzx.apply(this,arguments); lfhUi(); return r; };
