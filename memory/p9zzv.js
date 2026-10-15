/* ---------- P9zzv: LyricFlow rich text. B / I / U / S style the words right in the editor (no ** symbols), saved with the line and shown in the player ---------- */
const RT_TOK={b:'**',i:'*',u:'__',s:'~~'}, RT_KEYS=['b','i','u','s'], RT_CMD={bold:'bold',italic:'italic',underline:'underline',strike:'strikeThrough'};
const RT_BLK=/^(DIV|P|LI|UL|OL|H[1-6]|BLOCKQUOTE|PRE|SECTION|ARTICLE|HEADER|FOOTER|TABLE|TR)$/;
const _lsIF9zzv=lsInlineFmt;
function rtEsc(t){ return String(t==null?'':t).replace(/[\\*_~]/g,'\\$&'); }
function rtTokens(md){ const s=String(md||''), out=[]; let buf='';
  const push=()=>{ if(buf){ out.push({x:buf}); buf=''; } };
  for(let k=0;k<s.length;){ const c=s[k], d=s.slice(k,k+2);
    if(c==='\\'&&k+1<s.length&&/[\\*_~]/.test(s[k+1])){ buf+=s[k+1]; k+=2; continue; }
    const f=d==='**'?'b':d==='__'?'u':d==='~~'?'s':c==='*'?'i':null;
    if(f){ push(); out.push({f,raw:f==='i'?'*':d}); k+=f==='i'?1:2; continue; }
    buf+=c; k++; }
  push(); const open={};
  out.forEach((t,j)=>{ if(!t.f) return; if(open[t.f]!=null){ out[open[t.f]].ok=1; t.ok=1; open[t.f]=null; } else open[t.f]=j; });
  return out.map(t=>t.f&&!t.ok?{x:t.raw}:t); }
function rtRuns(md){ const st={b:0,i:0,u:0,s:0}, runs=[];
  rtTokens(md).forEach(t=>{ if(t.f){ st[t.f]^=1; return; } const L=runs[runs.length-1];
    if(L&&RT_KEYS.every(k=>!!L[k]===!!st[k])) L.t+=t.x; else runs.push({t:t.x,b:!!st.b,i:!!st.i,u:!!st.u,s:!!st.s}); });
  return runs; }
function rtStrip(md){ return rtRuns(md).map(r=>r.t).join(''); }
function rtHasFmt(md){ return rtRuns(md).some(r=>r.b||r.i||r.u||r.s); }
function rtRunsHtml(runs,view){ const T=view?{b:'strong',i:'em',u:'u',s:'s'}:{b:'b',i:'i',u:'u',s:'s'};
  return runs.map(r=>{ let h=esc(r.t); ['s','u','i','b'].forEach(k=>{ if(r[k]) h=`<${T[k]}>${h}</${T[k]}>`; }); return h; }).join(''); }
function rtEdHtml(md){ return String(md||'').split('\n').map(l=>{ const sec=lsIsSection(rtStrip(l).trim()); return `<div${sec?' class="rt-sec"':''}>${rtRunsHtml(rtRuns(l))||'<br>'}</div>`; }).join(''); }
function rtFieldHtml(i,md){ md=String(md||''); return `<span data-ls-text="${i}" data-rt="1" contenteditable="true" role="textbox" aria-label="Lyric line" spellcheck="false" data-ph="(empty line)" data-testid="ls-line-text-${i}" class="ls-rt1 min-w-0 flex-1 text-[15px] text-white outline-none${md.trim()?'':' is-empty'}">${rtRunsHtml(rtRuns(md))}</span>`; }

/* the editor DOM <-> md text ("value"), with selection offsets in the same md space */
function rtFmt(el,f){ const t=el.tagName, g=Object.assign({},f);
  if(t==='B'||t==='STRONG') g.b=1; if(t==='I'||t==='EM') g.i=1; if(t==='U'||t==='INS') g.u=1; if(t==='S'||t==='STRIKE'||t==='DEL') g.s=1;
  if(el.getAttribute&&el.getAttribute('style')){ const st=el.style, w=st.fontWeight; if(w==='bold'||w==='bolder'||+w>=600) g.b=1; else if(w==='normal'||(+w&&+w<600)) g.b=0;
    if(st.fontStyle==='italic'||st.fontStyle==='oblique') g.i=1; else if(st.fontStyle==='normal') g.i=0;
    const d=String(st.textDecorationLine||st.textDecoration||''); if(/underline/.test(d)) g.u=1; if(/line-through/.test(d)) g.s=1; }
  return g; }
function rtLastIn(n,root){ for(let x=n;x&&x!==root;x=x.parentNode){ let s=x.nextSibling; while(s&&s.nodeType===3&&!s.data) s=s.nextSibling;
    if(s) return s.nodeType===1&&RT_BLK.test(s.tagName); if(x.parentNode&&x.parentNode!==root&&RT_BLK.test(x.parentNode.tagName||'')) return true; } return true; }
function rtLineMd(segs){ let out='', stack=[], p=0; const at=[];
  segs.forEach(sg=>{ const r=sg.f; let keep=0; while(keep<stack.length&&r[stack[keep]]) keep++;
    for(let j=stack.length-1;j>=keep;j--) out+=RT_TOK[stack[j]]; stack.length=keep;
    RT_KEYS.forEach(k=>{ if(r[k]&&!stack.includes(k)){ stack.push(k); out+=RT_TOK[k]; } });
    for(let j=0;j<sg.t.length;j++){ at[p++]=out.length; const ch=sg.t[j]; out+=/[\\*_~]/.test(ch)?'\\'+ch:ch; } });
  for(let j=stack.length-1;j>=0;j--) out+=RT_TOK[stack[j]]; at[p]=out.length; return {md:out,at,len:p}; }
function rtModel(root,pts,collapse){ pts=pts||[]; const L=[]; let cur=null, pend=0, any=false;
  const line=pt=>{ cur={segs:[],len:0,br:null,pt:pt||null}; L.push(cur); }; line();
  const flush=()=>{ if(pend){ line(); pend=0; } };
  const hit=(n,k)=>{ for(const t of pts){ if(t.l==null&&t.n===n&&t.o===k){ if(pend===1){ t.l=L.length; t.p=0; } else { t.l=L.length-1; t.p=cur.len; } } } };
  const walk=(n,f)=>{ const ch=n.childNodes;
    for(let k=0;k<ch.length;k++){ hit(n,k); const c=ch[k];
      if(c.nodeType===3){ let d=c.data; if(collapse) d=d.replace(/\s+/g,' '); if(!d) continue; flush(); any=true;
        for(const t of pts){ if(t.l==null&&t.n===c){ const nl=d.slice(0,Math.min(t.o,d.length)).split('\n'); t.l=L.length-1+nl.length-1; t.p=(nl.length>1?0:cur.len)+nl[nl.length-1].length; } }
        let off=0; d.split('\n').forEach((pc,pi)=>{ if(pi) line({n:c,o:off}); if(pc){ cur.segs.push({n:c,o:off,p:cur.len,t:pc.replace(/\u00a0/g,' '),f}); cur.len+=pc.length; } off+=pc.length+1; });
        continue; }
      if(c.nodeType!==1) continue; const tg=c.tagName;
      if(tg==='BR'){ flush(); any=true; if(!cur.br) cur.br=c; if(!rtLastIn(c,root)) line(); continue; }
      if(/^(SCRIPT|STYLE|TEMPLATE|META|LINK|TITLE)$/.test(tg)) continue;
      if(RT_BLK.test(tg)){ if(any) pend=1; any=true; walk(c,rtFmt(c,f)); pend=2; continue; }
      walk(c,rtFmt(c,f)); }
    hit(n,ch.length); };
  walk(root,{b:0,i:0,u:0,s:0});
  pts.forEach(t=>{ if(t.l==null){ t.l=L.length-1; t.p=cur.len; } });
  const M=L.map(ln=>rtLineMd(ln.segs)); let acc=0; const starts=M.map(m=>{ const s=acc; acc+=m.md.length+1; return s; });
  return {L,M,starts,md:M.map(m=>m.md).join('\n')}; }
function rtIdx(m,t){ const l=Math.max(0,Math.min(t.l,m.M.length-1)), mm=m.M[l]; return m.starts[l]+mm.at[Math.max(0,Math.min(t.p,mm.len))]; }
function rtLP(m,idx){ idx=Math.max(0,idx|0); let l=m.starts.length-1; while(l>0&&m.starts[l]>idx) l--; const mm=m.M[l], loc=idx-m.starts[l]; let p=0; while(p<mm.len&&mm.at[p+1]<=loc) p++; if(loc>=mm.at[mm.len]) p=mm.len; return {l,p}; }
function rtPt(m,idx,el){ const {l,p}=rtLP(m,idx), ln=m.L[l];
  if(ln){ for(const sg of ln.segs){ if(p>=sg.p&&p<=sg.p+sg.t.length) return {n:sg.n,o:sg.o+(p-sg.p)}; }
    if(ln.br) return {n:ln.br.parentNode,o:[...ln.br.parentNode.childNodes].indexOf(ln.br)}; if(ln.pt) return ln.pt;
    const last=ln.segs[ln.segs.length-1]; if(last) return {n:last.n,o:last.o+last.t.length}; }
  return {n:el,o:el.childNodes.length}; }
function rtSel(el){ const s=getSelection(); let r=null;
  if(s&&s.rangeCount&&el.contains(s.anchorNode)&&el.contains(s.focusNode)) r=s.getRangeAt(0); else if(el._rtR&&el.contains(el._rtR.startContainer)&&el.contains(el._rtR.endContainer)) r=el._rtR;
  if(!r){ const m=rtModel(el); return [m.md.length,m.md.length]; }
  const a={n:r.startContainer,o:r.startOffset}, b={n:r.endContainer,o:r.endOffset}, m=rtModel(el,[a,b]); return [rtIdx(m,a),rtIdx(m,b)]; }
function rtSetSel(el,a,b){ const m=rtModel(el); const A=rtPt(m,Math.min(a,b),el), B=rtPt(m,Math.max(a,b),el); try{ const r=document.createRange(); r.setStart(A.n,A.o); r.setEnd(B.n,B.o); el._rtR=r.cloneRange();
  if(document.activeElement===el||el.contains(document.activeElement)){ const s=getSelection(); s.removeAllRanges(); s.addRange(r); } }catch(e){} }
function rtEmpty(el){ el.classList.toggle('is-empty',!el.textContent.replace(/[\u200B\uFEFF\s]/g,'').length&&!el.querySelector('div + div')); }
function rtWrite(el,v){ v=lsTaToMd(String(v==null?'':v)); el.innerHTML=el.dataset.rt==='m'?rtEdHtml(v):rtRunsHtml(rtRuns(v.replace(/\n+/g,' '))); el._rtR=null; rtEmpty(el); }
function rtInit(el){ if(el._rt) return; el._rt=1;
  Object.defineProperty(el,'value',{configurable:true,get(){ const v=rtModel(el).md; return el.dataset.rt==='m'?v:v.replace(/\n/g,' '); },set(v){ rtWrite(el,v); }});
  Object.defineProperty(el,'selectionStart',{configurable:true,get(){ return rtSel(el)[0]; },set(v){ rtSetSel(el,v,Math.max(v,rtSel(el)[1])); }});
  Object.defineProperty(el,'selectionEnd',{configurable:true,get(){ return rtSel(el)[1]; },set(v){ rtSetSel(el,Math.min(rtSel(el)[0],v),v); }});
  el.setSelectionRange=(a,b)=>rtSetSel(el,a,b==null?a:b); el.select=()=>rtSetSel(el,0,1e9); rtEmpty(el); }
function rtInitAll(root){ (root||document).querySelectorAll('[data-rt]').forEach(rtInit); }
function rtSecMarks(el){ [...el.children].forEach(d=>{ if(d.tagName==='DIV') d.classList.toggle('rt-sec',lsIsSection((d.textContent||'').trim())); }); }
function rtFromHtml(html){ const d=document.createElement('div'); d.innerHTML=html; return rtModel(d).md; }

/* formatting commands */
function rtSaveSel(el){ const s=getSelection(); if(s.rangeCount&&el.contains(s.anchorNode)) el._rtR=s.getRangeAt(0).cloneRange(); }
function rtFocus(el){ if(document.activeElement!==el) try{ el.focus({preventScroll:true}); }catch(e){ el.focus(); }
  const s=getSelection(); if(el._rtR&&el.contains(el._rtR.startContainer)&&!(s.rangeCount&&el.contains(s.anchorNode)&&!s.isCollapsed)){ s.removeAllRanges(); s.addRange(el._rtR.cloneRange()); } }
function rtWordSel(){ const s=getSelection(); if(!s.rangeCount||!s.isCollapsed) return false; const r=s.getRangeAt(0), n=r.startContainer; if(n.nodeType!==3) return false;
  const d=n.data, w=c=>!!c&&/[\p{L}\p{N}'\u2019-]/u.test(c); let a=r.startOffset, b=a; while(a>0&&w(d[a-1])) a--; while(b<d.length&&w(d[b])) b++; if(a===b) return false;
  const x=document.createRange(); x.setStart(n,a); x.setEnd(n,b); s.removeAllRanges(); s.addRange(x); return true; }
function rtCmd(el,type){ if(!el||!RT_CMD[type]) return; rtFocus(el); try{ document.execCommand('styleWithCSS',false,false); }catch(e){}
  const w=rtWordSel(); try{ document.execCommand(RT_CMD[type],false,null); }catch(e){} if(w) try{ getSelection().collapseToEnd(); }catch(e){} rtSaveSel(el); rtBtnSync(); }
function rtBtnSync(){ const el=document.getElementById('ls-write'); if(!el||!el.isContentEditable) return; const s=getSelection(), inside=!!(s.rangeCount&&el.contains(s.anchorNode));
  Object.keys(RT_CMD).forEach(k=>{ const b=document.querySelector(`[data-testid="ls-md-${k}"]`); if(!b) return; let on=false; if(inside) try{ on=document.queryCommandState(RT_CMD[k]); }catch(e){} b.classList.toggle('is-on',on); b.setAttribute('aria-pressed',String(on)); }); }
function rtInsertMd(el,md){ const [a,b]=rtSel(el), v=el.value; el.value=v.slice(0,a)+md+v.slice(b); try{ el.focus({preventScroll:true}); }catch(e){} el.setSelectionRange(a+md.length,a+md.length); el.dispatchEvent(new Event('input',{bubbles:true})); }
function rtClipMd(dt,single){ let md='';
  const html=dt.getData('text/html'); if(html){ try{ const body=new DOMParser().parseFromString(html,'text/html').body; md=rtModel(body,null,true).md.split('\n').map(x=>x.trim()).join('\n').replace(/^\n+|\n+$/g,''); }catch(e){ md=''; } }
  if(!md){ md=rtEsc(lsTaToMd((dt.getData('text/plain')||'').replace(/\r\n?/g,'\n'))); }
  return single?md.replace(/\n+/g,' '):md; }
const rtEdOf=t=>t&&t.closest?t.closest('[data-rt]'):(t&&t.parentElement&&t.parentElement.closest('[data-rt]'));
document.addEventListener('paste',e=>{ const el=rtEdOf(e.target); if(!el||!el._rt||!e.clipboardData) return; e.preventDefault(); e.stopImmediatePropagation(); const md=rtClipMd(e.clipboardData,el.dataset.rt!=='m'); if(md) rtInsertMd(el,md); },true);
document.addEventListener('drop',e=>{ const el=rtEdOf(e.target); if(!el||!el._rt||!e.dataTransfer) return; e.preventDefault(); const md=rtClipMd(e.dataTransfer,el.dataset.rt!=='m'); if(md) rtInsertMd(el,md); },true);
document.addEventListener('keydown',e=>{ const el=rtEdOf(e.target); if(!el||!el._rt||e.isComposing) return; const k=(e.key||'').toLowerCase(), mod=e.metaKey||e.ctrlKey;
  if(mod&&!e.altKey){ if(!e.shiftKey&&(k==='b'||k==='i'||k==='u')){ e.preventDefault(); rtCmd(el,{b:'bold',i:'italic',u:'underline'}[k]); return; } if(e.shiftKey&&k==='x'){ e.preventDefault(); rtCmd(el,'strike'); return; } }
  if(e.key==='Enter'&&el.dataset.rt!=='m'){ e.preventDefault(); el.blur(); } },true);
document.addEventListener('input',e=>{ const el=rtEdOf(e.target); if(el&&el._rt) rtEmpty(el); },true);
document.addEventListener('selectionchange',()=>{ const s=getSelection(); if(!s||!s.rangeCount) return; const n=s.anchorNode, ed=n&&rtEdOf(n.nodeType===1?n:n.parentElement); if(!ed||!ed._rt) return; ed._rtR=s.getRangeAt(0).cloneRange(); if(ed.id==='ls-write') rtBtnSync(); });
document.addEventListener('focusout',e=>{ const t=e.target; if(t&&t.dataset&&t.dataset.lsvLines) t._snap=0; });

/* LyricFlow wiring */
lsMdToTa=function(s){ return lsTaToMd(s); };
lsInlineFmt=function(text){ return rtRunsHtml(rtRuns(lsTaToMd(text)),true); };
lsStripFmt=function(text){ return rtStrip(lsTaToMd(text)); };
lyFmt=function(l){ if(!l) return ''; if(l.md2&&rtStrip(l.md2)===l.text) return rtRunsHtml(rtRuns(l.md2),true); if(l.md&&lyMd(l)) return _lsIF9zzv(l.md); return esc(l.text||''); };
function lyLineHtml(s,l){ return lyFmt(l); }
function lyMdOf(l){ if(l.md2&&rtStrip(l.md2)===l.text) return l.md2; if(l.md&&lyMd(l)){ const m=rtFromHtml(_lsIF9zzv(l.md)); if(rtStrip(m)===l.text) return m; } return rtEsc(l.text); }
lsItemsFromSong=function(s){ const items=[]; let last=null;
  ((s&&s.lyrics)||[]).forEach(l=>{ if(l.sec&&l.sec!==last){ items.push({type:'section',text:rtEsc(l.sec)}); last=l.sec; }
    if(l.text&&String(l.text).trim()) items.push({type:'line',t:(typeof l.t==='number'?l.t:null),text:lyMdOf(l),explain:l.explain||'',words:(l.words&&l.words.length?l.words.slice():null)}); });
  return items; };
const _lsMk9zzv=lsMarkup; lsMarkup=function(type){ const ta=$('#ls-write'); if(ta&&ta.isContentEditable&&RT_CMD[type]) return rtCmd(ta,type); return _lsMk9zzv.apply(this,arguments); };
const _lsHl9zzv=lsHlSync; lsHlSync=function(){ const ta=$('#ls-write'); if(ta&&ta.isContentEditable){ rtSecMarks(ta); lsPrevSync(ta); return; } return _lsHl9zzv.apply(this,arguments); };
const _lsCp9zzv=lsCaretPx; lsCaretPx=function(ta){ if(!ta||!ta.isContentEditable) return _lsCp9zzv.apply(this,arguments);
  const r0=ta.getBoundingClientRect(), lh=parseFloat(getComputedStyle(ta).lineHeight)||28, s=getSelection(); let rg=(s.rangeCount&&ta.contains(s.anchorNode))?s.getRangeAt(0):ta._rtR, rc=null;
  if(rg){ const c=rg.cloneRange(); c.collapse(false); const rs=c.getClientRects(); rc=rs.length?rs[rs.length-1]:null;
    if(!rc||(!rc.height&&!rc.left)){ const sc=c.startContainer, n=sc.nodeType===1?(sc.childNodes[c.startOffset]||sc):sc.parentElement; const b=n&&n.getBoundingClientRect?n.getBoundingClientRect():null; rc=b?{left:b.left,top:b.top}:null; } }
  if(!rc) rc={left:r0.left+16,top:r0.top+14}; return {left:rc.left-r0.left, top:rc.top-r0.top, lh}; };
const _lsWB9zzv=lsWireBody; lsWireBody=function(){ try{ const b=document.getElementById('ls-body'); if(b) rtInitAll(b); }catch(e){ console.warn('rich text',e); } const r=_lsWB9zzv.apply(this,arguments); try{ rtBtnSync(); }catch(e){} return r; };
const _lsvR9zzv=lsvRender; lsvRender=function(){ const r=_lsvR9zzv.apply(this,arguments); try{ rtInitAll(document.getElementById('lsv')||document); }catch(e){} return r; };
try{ document.execCommand('defaultParagraphSeparator',false,'div'); }catch(e){}

/* ---------- P9zzv: LyricFlow, revert to the song's default lyrics (Write) or default timestamps (Sync) ---------- */
function lsDef(){ const ls=state.ls, s=ls&&!ls.isBlank&&SONG_BY_ID[ls.songId]; return s&&!s._user&&Array.isArray(s._ly0)?s._ly0:null; }
function lsRevLyBtn(){ if(!lsDef()) return ''; return `<button type="button" data-act="ls-rev-ly" data-testid="ls-revert-lyrics" title="Revert back to the default lyrics" aria-label="Revert back to the default lyrics" class="lsx-fb is-rev press"><i data-lucide="history"></i><span>Revert lyrics</span></button>`; }
function lsRevTsBtn(){ const d=lsDef(); if(!d||!d.some(l=>typeof l.t==='number'&&String(l.text||'').trim())) return ''; return `<button type="button" data-act="ls-rev-ts" data-testid="ls-revert-timestamps" class="ls-rev-ts press"><i data-lucide="history"></i><span>Revert to default timestamps</span></button>`; }
function lsRevCur(){ lsCommitEdits(); return (state.ls.items||[]).map(it=>Object.assign({},it,it.words?{words:it.words.slice()}:{})); }
function lsRevSame(a,b){ const f=X=>X.map(it=>it.type+'|'+String(it.text||'').trim()+'|'+(it.type==='line'?(it.t==null?'-':Math.round(it.t*100)):'')+'|'+(it.words&&it.words.length?it.words.length:0)).join('\n'); return f(a)===f(b); }
function lsRevLyItems(){ const d=lsDef(); if(!d) return null; const def=lsItemsFromSong({lyrics:d}), cur=lsRevCur().filter(it=>it.type==='line'), dl=def.filter(it=>it.type==='line');
  const al=lsAlignLines(cur,dl.map(it=>(it.text||'').trim())); let k=0;
  def.forEach(it=>{ if(it.type!=='line') return; const m=al[k++]; if(m&&m.item&&m.item.t!=null&&m.item.t!==it.t){ it.t=m.item.t; it.words=m.exact&&m.item.words?m.item.words.slice():null; } });
  return def; }
function lsRevTsItems(){ const d=lsDef(); if(!d) return null; const dl=lsItemsFromSong({lyrics:d}).filter(it=>it.type==='line'), cur=lsRevCur(), cl=cur.filter(it=>it.type==='line');
  const al=lsAlignLines(dl,cl.map(it=>(it.text||'').trim()));
  cl.forEach((it,k)=>{ const m=al[k]; if(!m||!m.item||m.item.t==null) return; it.t=m.item.t; it.words=m.exact&&m.item.words?m.item.words.slice():null; });
  return cur; }
function lsRevPersist(items,title,sub){ const ls=state.ls, s=SONG_BY_ID[ls.songId]; if(!s) return; const notes={}; (s.lyrics||[]).forEach(l=>{ if(l&&l.note&&l.text) notes[l.text]=l.note; });
  ls.items=items; const lines=lsBuildLyrics(); let hasNote=false; lines.forEach(l=>{ if(notes[l.text]){ l.note=notes[l.text]; hasNote=true; } });
  const def=s._ly0, sig=X=>(X||[]).filter(l=>!l.secOnly&&String(l.text||'').trim()).map(l=>[l.text,Math.round((+l.t||0)*100),l.sec||'',l.md2||'',(l.words||[]).length,l.explain||''].join('\u0001')).join('\n');
  if(!hasNote&&sig(lines)===sig(def)){ delete state.lyricEdits[s.id]; s.lyrics=def; } else { state.lyricEdits[s.id]=lines; s.lyrics=lines; }
  const ok=LS.set('treesh_lyric_edits',state.lyricEdits); try{ _karIdx=-1; }catch(e){}
  applyLyricEdits(); ls.items=lsItemsFromSong(s); ls.idx=lsFirstUnstamped(); ls.dirty=false; renderLS();
  try{ refreshDynamic(); }catch(e){ try{ if(state.npOpen) renderNP(); }catch(_){} }
  toast(ok?title:'Restored for now, but storage is full', ok?sub:'Free up space in Settings so this sticks'); }
function lsRevAsk(kind){ const ls=state.ls; if(!ls||!lsDef()) return; const ly=kind==='ly', next=ly?lsRevLyItems():lsRevTsItems(), cur=lsRevCur();
  if(!next) return; if(lsRevSame(next,cur)){ toast(ly?'Already the default lyrics':'Already the default timestamps',ly?'Nothing to revert':'Every line uses its original time'); return; }
  const empty=ly&&!lsDef().some(l=>String(l.text||'').trim());
  openConfirm(ly?'Revert to the default lyrics?':'Revert to the default timestamps?', ly?(empty?'This song has no lyrics of its own, so your lyrics will be removed.':'All your changes to the words of this song are removed and the original lyrics come back. Your custom timings stay.'):'Your custom timings for this song are removed and every line goes back to its original time. Your lyric text changes stay.',
    ()=>lsRevPersist(ly?lsRevLyItems():lsRevTsItems(), ly?'Default lyrics restored':'Default timestamps restored', ly?'Your timings were kept':'Your lyric changes were kept')); }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="ls-rev-ly"],[data-act="ls-rev-ts"]'); if(!t) return; e.preventDefault(); lsRevAsk(t.dataset.act==='ls-rev-ly'?'ly':'ts'); });
