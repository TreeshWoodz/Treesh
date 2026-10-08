/* ---------- P9x: status bubble above the profile photo (designs, colors, patterns, effects) ---------- */
const SB_DESIGNS=[['bubble','Bubble'],['cloud','Thought'],['comic','Comic'],['pixel','Pixel'],['neon','Neon'],['glass','Glass'],['sticky','Sticky note']];
const SB_FILLS=['#ffffff','#17141f','#9328ff','#ff2d78','#f5c451','#22d3ee','#34d399','#fb923c','#3b82f6','#fda4af'];
const SB_FX=[['none','None','circle-off'],['float','Float','wind'],['glow','Glow','sun'],['sparkle','Sparkle','sparkles'],['shimmer','Shimmer','wand-sparkles'],['wiggle','Wiggle','activity']];
function sbxNormS(v){ v=(v&&typeof v==='object')?v:{}; return {d:SB_DESIGNS.some(x=>x[0]===v.d)?v.d:'bubble',f:spHex(v.f,'#ffffff'),f2:spHex(v.f2,''),tc:spHex(v.tc,''),p:SP_PATTERNS.some(x=>x[0]===v.p)?v.p:'',pc:spHex(v.pc,'#ffffff'),fx:SB_FX.some(x=>x[0]===v.fx)?v.fx:'none'}; }
const _spNorm9x=spNorm; spNorm=function(s){ const o=_spNorm9x.apply(this,arguments); o.mood.s=sbxNormS(s&&s.mood&&s.mood.s); return o; };
function sbxLum(h){ const n=parseInt(String(h||'#ffffff').slice(1),16)||0; return ((n>>16&255)*.299+(n>>8&255)*.587+(n&255)*.114)/255; }
function sbxTc(s){ if(s.tc) return s.tc; if(s.d==='neon'||s.d==='glass') return '#ffffff'; const l=s.f2?(sbxLum(s.f)+sbxLum(s.f2))/2:sbxLum(s.f); return l>.62?'#17141f':'#ffffff'; }
function sbxBg(s){ return s.f2?`linear-gradient(135deg,${s.f},${s.f2})`:s.f; }
function sbxVars(s){ const pat=s.p?spPattern(s.p,s.pc,'transparent'):'none'; return `--sb-f:${s.f};--sb-f2:${s.f2||s.f};--sb-bg:${sbxBg(s)};--sb-tc:${sbxTc(s)};--sb-pat:${pat}`.replace(/"/g,'&quot;'); }
function sbxFonts(s){ try{ if(s.d==='pixel') loadGoogleFont('VT323'); if(s.d==='sticky') loadGoogleFont('Caveat:wght@400;700'); }catch(e){} }
function sbxText(S){ const m=SP_MOODS.find(x=>x[0]===S.mood.k), t=(S.mood.t||'').trim(); if(t) return {ic:m&&m[0]?m[2]:'',t}; if(m&&m[0]) return {ic:m[2],t:'Feeling '+m[1].toLowerCase()}; return null; }
function sbxHtml(S,mode){ const s=S.mood.s||sbxNormS(), x=sbxText(S);
  if(!x) return mode==='me'?`<button type="button" data-act="sbx-open" data-testid="profile-status-add" aria-label="Add a status" class="sbub is-ghost"><span class="sbub-in"><i data-lucide="plus"></i><span class="sbub-t">Status</span></span></button>`:'';
  const tid=mode==='me'?'profile-status-bubble':mode==='them'?'uprof-status-bubble':'editor-status-preview-bubble';
  const open=mode==='me'?`button type="button" data-act="sbx-open" aria-label="Edit your status"`:`div role="note"`, tag=mode==='me'?'button':'div';
  const sp=s.fx==='sparkle'?'<i class="sbub-sp s1"></i><i class="sbub-sp s2"></i><i class="sbub-sp s3"></i>':'';
  sbxFonts(s);
  return `<${open} data-testid="${tid}" class="sbub sb-d-${s.d} sb-fx-${s.fx}${s.p?' has-pat':''}" style="${sbxVars(s)}"><span class="sbub-in">${x.ic?`<i data-lucide="${x.ic}"></i>`:''}<span class="sbub-t" data-testid="${tid}-text">${esc(x.t)}</span></span><span class="sbub-tail" aria-hidden="true"></span>${sp}</${tag}>`; }
function sbxMount(av,html){ if(!av) return; let a=av.parentElement; if(!a||!a.classList.contains('sbub-anchor')){ a=document.createElement('span'); a.className='sbub-anchor'; av.parentNode.insertBefore(a,av); a.appendChild(av); }
  a.querySelectorAll(':scope > .sbub').forEach(n=>n.remove()); if(html) a.insertAdjacentHTML('beforeend',html); const fit=()=>{ if(av.offsetWidth) a.style.setProperty('--avc',Math.round(av.offsetWidth/2)+'px'); }; fit(); requestAnimationFrame(fit); if(window.ResizeObserver&&!a._ro){ a._ro=new ResizeObserver(fit); a._ro.observe(av); } }
spMoodHtml=function(){ return ''; };
function sbxOwn(){ const hero=document.querySelector('#profile-scroll [data-testid="settings-profile"]'), av=hero&&hero.querySelector('.pf-avatar'); if(!av) return; sbxMount(av,sbxHtml(spMine(),'me')); hero.classList.add('has-sbub'); icons(); }
function sbxThem(){ const d=_sxV&&_sxV.d; if(!d||!d.data) return; const row=document.querySelector('#sx-root .sx-hero-row'), av=row&&row.firstElementChild; if(!av) return; const h=sbxHtml(spNorm(d.data.space),'them'); if(!h) return; sbxMount(av,h); const hr=row.closest('.sx-hero'); if(hr) hr.classList.add('has-sbub'); icons(); }
const _spDO9x=spDecorateOwn; spDecorateOwn=function(){ const r=_spDO9x.apply(this,arguments); try{ if(!state.settingsEditProfile) sbxOwn(); }catch(e){ console.warn('status bubble',e); } return r; };
const _spDT9x=spDecorateThem; spDecorateThem=function(){ const r=_spDT9x.apply(this,arguments); try{ sbxThem(); }catch(e){ console.warn('status bubble',e); } return r; };

/* editor: its own Status tab */
SP_TABS.splice(1,0,['status','Status','message-circle']); (SP_TABS.find(x=>x[0]==='song')||[])[1]='Song';
const _spEB9x=spEdBody; spEdBody=function(){ if(_spEd&&_spEd.tab==='status') return sbxEdBody(); const h=_spEB9x.apply(this,arguments); if(_spEd&&_spEd.tab==='song'){ const i=h.indexOf('<p class="sp-k2 mt-5">Mood</p>'); if(i>0) return h.slice(0,i); } return h; };
function sbxAv(){ const p=state.profile||{}, a=p.avatar||p.avatarUrl||''; return a?`<img src="${esc(a)}" alt="">`:`<b>${esc(((p.nickname||'T')+'').charAt(0).toUpperCase())}</b>`; }
function sbxPvHtml(S){ return `<span class="sbub-anchor" style="--avc:32px">${sbxHtml(S,'pv')||'<span class="sbe-empty">Type a status to see your bubble</span>'}<span class="sbe-av">${sbxAv()}</span></span>`; }
function sbxEdBody(){ const S=state._spDraft; S.mood.s=sbxNormS(S.mood.s); const s=S.mood.s;
  const chip=(k,v,l,ic,on)=>`<button type="button" data-act="sbx-set" data-k="${k}" data-val="${esc(v)}" aria-pressed="${on}" data-testid="editor-status-${k}-${v||'none'}" class="sp-chip press${on?' on':''}">${ic?`<i data-lucide="${ic}"></i>`:''}${esc(l)}</button>`;
  const designs=SB_DESIGNS.map(([d,l])=>{ const o=Object.assign({},s,{d}); sbxFonts(o); return `<button type="button" data-act="sbx-set" data-k="d" data-val="${d}" aria-pressed="${s.d===d}" data-testid="editor-status-design-${d}" class="sbe-d press${s.d===d?' on':''}"><span class="sbe-d-pv"><span class="sbub is-mini sb-d-${d}${s.p?' has-pat':''}" style="${sbxVars(o)}"><span class="sbub-in"><span class="sbub-t">Hey!</span></span><span class="sbub-tail"></span></span></span><b>${l}</b></button>`; }).join('');
  const fills=SB_FILLS.map(c=>`<button type="button" data-act="sbx-set" data-k="f" data-val="${c}" aria-label="Color ${c}" aria-pressed="${s.f===c}" data-testid="editor-status-fill-${c.slice(1)}" class="sbe-sw${s.f===c?' on':''}" style="background:${c}"></button>`).join('')
    +`<label class="sbe-sw is-pick${SB_FILLS.includes(s.f)?'':' on'}" title="Custom color" style="background:conic-gradient(#ff2d78,#f59e0b,#34d399,#22d3ee,#9328ff,#ff2d78)"><input type="color" value="${s.f}" data-sbx="f" data-testid="editor-status-fill-custom" aria-label="Custom bubble color"></label>`;
  const pats=[['','None']].concat(SP_PATTERNS).map(([p,l])=>`<button type="button" data-act="sbx-set" data-k="p" data-val="${p}" aria-pressed="${s.p===p}" data-testid="editor-status-pattern-${p||'none'}" class="sp-pat press${s.p===p?' on':''}"><span style="${('background:'+(p?spPattern(p,s.pc,sbxBg(s)):sbxBg(s))).replace(/"/g,'&quot;')}"></span>${l}</button>`).join('');
  const tcv=s.tc||sbxTc(s);
  return `<div class="sbe-pv" data-testid="editor-status-preview"><span id="sbe-pv" class="sbe-pv-in">${sbxPvHtml(S)}</span></div>
    <label class="sp-f"><span>Status<em id="sbe-n">${(S.mood.t||'').length}/48</em></span><input value="${esc(S.mood.t)}" maxlength="48" placeholder="What\u2019s on your mind?" data-sbx="t" class="sp-in" data-testid="editor-mood-text"></label>
    <p class="sp-k2">Mood</p><div class="sp-chips">${SP_MOODS.map(([v,l,ic])=>chip('k',v,l,ic,S.mood.k===v)).join('')}</div>
    <p class="sp-k2">Design</p><div class="sbe-ds">${designs}</div>
    <p class="sp-k2">Color</p><div class="sbe-sws">${fills}</div>
    <div class="sbe-row"><label class="sp-tog"><input type="checkbox" data-sbx="grad" ${s.f2?'checked':''} data-testid="editor-status-gradient"><span>Gradient</span></label>${s.f2?`<label class="sbe-mc"><span>Blend into</span><input type="color" value="${s.f2}" data-sbx="f2" data-testid="editor-status-fill2"></label>`:''}</div>
    <p class="sp-k2">Pattern</p><div class="sp-pats sbe-pats">${pats}</div>
    ${s.p?`<div class="sbe-row"><label class="sbe-mc"><span>Pattern color</span><input type="color" value="${s.pc}" data-sbx="pc" data-testid="editor-status-pattern-color"></label></div>`:''}
    <p class="sp-k2">Text color</p><div class="sp-chips">${chip('tc','','Auto','wand-2',!s.tc)}<label class="sp-chip sbe-tc press${s.tc?' on':''}"><span class="sbe-tc-dot" style="background:${tcv}"></span>Custom<input type="color" value="${tcv}" data-sbx="tc" data-testid="editor-status-text-color" aria-label="Custom text color"></label></div>
    <p class="sp-k2">Effect</p><div class="sp-chips">${SB_FX.map(([v,l,ic])=>chip('fx',v,l,ic,s.fx===v)).join('')}</div>
    ${(S.mood.t||S.mood.k)?`<button type="button" data-act="sbx-clear" data-testid="editor-status-clear" class="sp-ed-btn press sp-up mt-4"><i data-lucide="trash-2"></i>Clear status</button>`:''}`; }
function sbxLive(){ const S=state._spDraft; if(!S) return; const pv=document.getElementById('sbe-pv'); if(pv) pv.innerHTML=sbxPvHtml(S); try{ sbxOwn(); }catch(e){} icons(); }
function sbxPair(f){ return f==='#ff2d78'?'#9328ff':'#ff2d78'; }
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-act="sbx-set"],[data-act="sbx-open"],[data-act="sbx-clear"]'); if(!b) return; const a=b.dataset.act;
  if(a==='sbx-open'){ e.stopPropagation(); if(_spEd){ _spEd.tab='status'; spEdPaint(true); } else spEdOpen('status'); return; }
  const S=state._spDraft; if(!S) return; S.mood.s=sbxNormS(S.mood.s);
  if(a==='sbx-clear'){ S.mood.t=''; S.mood.k=''; }
  else { const k=b.dataset.k, v=b.dataset.val; if(k==='k') S.mood.k=v; else S.mood.s[k]=v; }
  spEdPaint(); sbxLive(); });
document.addEventListener('input',e=>{ const t=e.target; if(!t||!t.dataset||!t.dataset.sbx) return; const S=state._spDraft; if(!S) return; S.mood.s=sbxNormS(S.mood.s); const k=t.dataset.sbx;
  if(k==='t'){ S.mood.t=t.value.slice(0,48); const n=document.getElementById('sbe-n'); if(n) n.textContent=S.mood.t.length+'/48'; }
  else if(k==='grad'){ S.mood.s.f2=t.checked?(S.mood.s.f2||sbxPair(S.mood.s.f)):''; spEdPaint(); }
  else S.mood.s[k]=t.value;
  sbxLive(); });
document.addEventListener('change',e=>{ const t=e.target; if(t&&t.dataset&&t.dataset.sbx&&t.type==='color') spEdPaint(); });

/* ---------- P9x: Image Studio Text tab uses the same sticker tiles as the Stickers tab ---------- */
function psStickerTiles(pre){ return `<p class="ps-sub">Treesh pack</p><div class="ps-pack">${MK_PACK.map(x=>`<button type="button" data-ps-pack="${x.id}" data-testid="${pre}-pack-${x.id}" aria-label="Add ${esc(x.name)}"><img src="${mkPackSrc(x.id)}" alt=""></button>`).join('')}</div><p class="ps-sub">Emoji</p><div class="ps-emoji">${BG_EMOJIS.map((e,i)=>`<button type="button" data-ps-emoji="${e}" data-testid="${pre}-emoji-${i}" aria-label="Add ${e} sticker">${e}</button>`).join('')}</div>`; }
const _cvRLP9x=cvRenderLayerPanel; cvRenderLayerPanel=function(){ const r=_cvRLP9x.apply(this,arguments);
  try{ const lp=lhPanel(); if(lp&&_cv&&_lh===_cv&&lp.closest('#modal2 .ps-root')){ const em=lp.querySelector('.st-emojis'); if(em){ const lab=em.previousElementSibling; const w=document.createElement('div'); w.className='ps-txt-stk'; w.setAttribute('data-testid','ps-text-stickers'); w.innerHTML=psStickerTiles('ps-text'); em.replaceWith(w); if(lab&&lab.classList.contains('st-sub')) lab.remove(); } } }catch(e){} return r; };

/* ---------- P9x: how-to hints are off by default, Settings > Appearance turns them on ---------- */
state.hintsOn=!!LS.get('treesh_hints',false);
const HX_RE=/^(tap|drag|hold|pinch|swipe|press|long[- ]press|double[- ]tap|scroll|click|hover|use the|use your)\b/i;
const HX_MUTED=/text-white\/(25|30|35|40|45|50|55|60)\b|\btext-xs\b|text-\[1[01]px\]|text-\[10px\]|opacity-50|-(sub|desc|note|hint|muted|fine|empty)\b|\bpm-desc\b/;
const HX_SKIP='button,a,label,input,select,textarea,[contenteditable="true"],[role="button"],#toast,.pm-toast,.np-line,.k-line,.kfs,.lsp-l,.ly-md,.sp-txt,.sx-bio,[data-ls-root] .ls-doc,[data-keep-hint]';
function hxIs(el){ if(el.hasAttribute('data-hint')) return false; const c=typeof el.className==='string'?el.className:''; if(!HX_MUTED.test(c)) return false; if(el.closest(HX_SKIP)) return false;
  if(el.querySelector('button,a,input,select,textarea,label,img,canvas,video,p,div,section,ul,ol,h1,h2,h3,h4')) return false; const t=(el.textContent||'').trim(); return !!t&&t.length<260&&HX_RE.test(t); }
function hxScan(root){ if(!root||root.nodeType!==1) return; const L=root.matches('p,small,span,div')?[root]:[]; root.querySelectorAll('p,small,span,div').forEach(n=>L.push(n)); for(const n of L){ try{ if(hxIs(n)) n.setAttribute('data-hint',''); }catch(e){} } }
let _hxQ=[], _hxRaf=0;
const _hxMO=new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes) if(n.nodeType===1) _hxQ.push(n); if(!_hxRaf&&_hxQ.length) _hxRaf=requestAnimationFrame(()=>{ _hxRaf=0; const q=_hxQ; _hxQ=[]; q.forEach(n=>{ if(n.isConnected) hxScan(n); }); }); });
function applyHints(){ document.documentElement.classList.toggle('hints-on',!!state.hintsOn); }
applyHints(); try{ _hxMO.observe(document.documentElement,{childList:true,subtree:true}); hxScan(document.body); }catch(e){}
const _vSet9x=viewSettings; viewSettings=function(){ const h=_vSet9x.apply(this,arguments); const k='<button data-act="toggle-whatsnew"'; const i=h.indexOf(k); if(i<0) return h;
  return h.slice(0,i)+toggleCard('toggle-hints','settings-toggle-hints',!!state.hintsOn,'lightbulb','Helpful hints','Show tips that explain how to use each feature')+h.slice(i); };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-act="toggle-hints"]'); if(!b) return; state.hintsOn=!state.hintsOn; LS.set('treesh_hints',state.hintsOn); applyHints(); toast(state.hintsOn?'Hints on':'Hints off'); try{ renderView(); }catch(err){} });
