/* ---------- P6: menu & popup kit ---------- */
function pmItem(o){ return `<button type="button" data-act="${o.act}" ${o.attrs||''}${o.tid?` data-testid="${o.tid}"`:''} class="pm-item press${o.sm?' sm':''}${o.on?' on':''}${o.hot?' hot':''}${o.danger?' is-danger':''}"><span class="pm-item-ic"><i data-lucide="${o.ic}"></i></span><span class="pm-item-t"><span class="pm-item-l">${o.label}</span>${o.desc?`<span class="pm-item-d">${o.desc}</span>`:''}</span>${o.right||''}${o.chev?'<i data-lucide="chevron-right" class="pm-item-chev"></i>':''}</button>`; }
function pmHead(ic,eyebrow,title,tid){ return `<div class="pm-head"><span class="pm-head-ic"><i data-lucide="${ic}"></i></span><div class="min-w-0 flex-1"><p class="st-eyebrow">${eyebrow}</p><h3 class="pm-title clamp-1">${title}</h3></div><button type="button" data-act="modal-close" aria-label="Close" data-testid="${tid||'modal-close-x'}" class="st-x"><i data-lucide="x"></i></button></div>`; }
function pmSongHead(s){ return `<div class="pm-song" data-testid="song-menu-head"><span class="pm-song-bg" style="background-image:url('${esc(s.coverArt||'')}')"></span><span class="pm-song-art">${img(s.coverArt,'h-full w-full object-cover')}</span><span class="min-w-0 flex-1"><span class="st-eyebrow block">${s._user?'Your upload':'Song'}</span><span class="pm-song-t clamp-1">${esc(s.title)}</span><span class="pm-song-a clamp-1">${esc(s.artist)}</span></span><button type="button" data-act="modal-close" aria-label="Close" data-testid="song-menu-close" class="st-x"><i data-lucide="x"></i></button></div>`; }

/* custom glass dropdowns: the native <select> stays in the DOM (hidden) so every existing reader/listener keeps working */
const PM_CHEV='<svg class="pm-sel-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const PM_CHECK='<svg class="pm-dd-ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const _pmValDesc=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
let _pmDD=null;
function pmEnhance(){ if(_pmDD&&!_pmDD.b.isConnected) pmDDClose(); document.querySelectorAll('select:not([data-pm]):not([multiple])').forEach(pmSelWrap); }
function pmSlug(v){ return String(v==null||v===''?'none':v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'opt'; }
function pmSelSync(sel){ const b=sel._pmBtn; if(!b) return; const o=sel.options[sel.selectedIndex]; const v=b.querySelector('.pm-sel-v'); if(v){ v.textContent=o?o.textContent:''; v.classList.toggle('is-ph',!o||(o.value===''&&sel.selectedIndex===0)); } b.disabled=!!sel.disabled; }
function pmSelWrap(sel){ sel.setAttribute('data-pm','1');
  const b=document.createElement('button'); b.type='button';
  b.className=(sel.getAttribute('class')||'')+' pm-sel'+(/text-\[(9|10|11)px\]|text-xs/.test(sel.className)?' is-xs':'');
  b.setAttribute('aria-haspopup','listbox'); b.setAttribute('aria-expanded','false');
  const lab=sel.labels&&sel.labels[0]&&sel.labels[0].querySelector('span'); const al=sel.getAttribute('aria-label')||(lab&&lab.textContent.trim())||''; if(al) b.setAttribute('aria-label',al);
  b.setAttribute('data-testid', sel.dataset.testid?sel.dataset.testid+'-button':sel.id?sel.id+'-dropdown':(sel.dataset.act||'select')+(sel.dataset.ti!=null?'-'+sel.dataset.ti:'')+'-dropdown');
  b.innerHTML='<span class="pm-sel-v"></span>'+PM_CHEV;
  sel.classList.add('pm-native'); sel.tabIndex=-1; sel.setAttribute('aria-hidden','true');
  sel.parentNode.insertBefore(b,sel); sel._pmBtn=b;
  try{ Object.defineProperty(sel,'value',{configurable:true,get(){ return _pmValDesc.get.call(this); },set(v){ _pmValDesc.set.call(this,v); pmSelSync(this); }}); }catch(e){}
  sel.addEventListener('change',()=>pmSelSync(sel));
  b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); if(_pmDD&&_pmDD.sel===sel){ pmDDClose(true); return; } pmDDOpen(sel,b); });
  b.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); if(!_pmDD) pmDDOpen(sel,b); } });
  pmSelSync(sel); }
function pmDDOpen(sel,b){ pmDDClose(); const mob=window.innerWidth<640; const title=b.getAttribute('aria-label')||'';
  const dd=document.createElement('div'); dd.className='pm-dd dark-surface'; dd.setAttribute('role','listbox'); dd.setAttribute('data-testid','pm-dropdown');
  dd.innerHTML=(title?`<p class="pm-dd-title">${esc(title)}</p>`:'')+[...sel.options].map((o,i)=>{ const on=i===sel.selectedIndex; return `<button type="button" role="option" data-pm-i="${i}" data-testid="pm-option-${pmSlug(o.value)}" aria-selected="${on}" ${o.disabled?'disabled':''} class="pm-dd-opt${on?' on':''}${(o.value===''&&i===0)?' is-ph':''}"><span class="min-w-0 flex-1 truncate">${esc(o.textContent)}</span>${PM_CHECK}</button>`; }).join('');
  let bd=null; if(mob){ bd=document.createElement('div'); bd.className='pm-dd-bd'; bd.setAttribute('data-testid','pm-dropdown-backdrop'); document.body.appendChild(bd); }
  document.body.appendChild(dd);
  if(!mob){ const r=b.getBoundingClientRect(); dd.style.minWidth=Math.max(r.width,160)+'px'; const h=dd.offsetHeight; const below=window.innerHeight-r.bottom-12, above=r.top-12; const up=h>below&&above>below; const maxH=Math.max(140,Math.min(340,up?above:below)); dd.style.maxHeight=maxH+'px'; let left=r.left; const ww=dd.offsetWidth; if(left+ww>window.innerWidth-8) left=window.innerWidth-8-ww; dd.style.left=Math.max(8,left)+'px'; if(up){ dd.classList.add('up'); dd.style.top=Math.max(8,r.top-6-Math.min(h,maxH))+'px'; } else dd.style.top=(r.bottom+6)+'px'; }
  b.setAttribute('aria-expanded','true'); _pmDD={sel,b,dd,bd};
  const cur=dd.querySelector('.pm-dd-opt.on')||dd.querySelector('.pm-dd-opt'); if(cur){ try{ cur.scrollIntoView({block:'nearest'}); cur.focus({preventScroll:true}); }catch(e){} }
  dd.addEventListener('click',e=>{ e.stopPropagation(); const o=e.target.closest('[data-pm-i]'); if(o&&!o.disabled) pmDDPick(+o.dataset.pmI); });
  if(bd) bd.addEventListener('click',e=>{ e.stopPropagation(); pmDDClose(true); });
  setTimeout(()=>{ if(_pmDD&&_pmDD.dd===dd){ document.addEventListener('pointerdown',pmDDOutside,true); document.addEventListener('keydown',pmDDKey,true); window.addEventListener('resize',pmDDClose); document.addEventListener('scroll',pmDDScroll,true); } },0); }
function pmDDPick(i){ const d=_pmDD; if(!d) return; const sel=d.sel; const changed=sel.selectedIndex!==i; sel.selectedIndex=i; pmSelSync(sel); pmDDClose(true); if(changed){ sel.dispatchEvent(new Event('input',{bubbles:true})); sel.dispatchEvent(new Event('change',{bubbles:true})); } }
function pmDDClose(focusBtn){ const d=_pmDD; if(!d) return; _pmDD=null; d.b.setAttribute('aria-expanded','false'); d.dd.remove(); if(d.bd) d.bd.remove(); document.removeEventListener('pointerdown',pmDDOutside,true); document.removeEventListener('keydown',pmDDKey,true); window.removeEventListener('resize',pmDDClose); document.removeEventListener('scroll',pmDDScroll,true); if(focusBtn===true&&d.b.isConnected){ try{ d.b.focus({preventScroll:true}); }catch(e){} } }
function pmDDOutside(e){ const d=_pmDD; if(!d) return; if(d.dd.contains(e.target)||d.b.contains(e.target)||(d.bd&&e.target===d.bd)) return; pmDDClose(); const sw=ev=>{ ev.stopPropagation(); ev.preventDefault(); document.removeEventListener('click',sw,true); }; document.addEventListener('click',sw,true); setTimeout(()=>document.removeEventListener('click',sw,true),450); }
function pmDDScroll(e){ const d=_pmDD; if(d&&!d.dd.contains(e.target)) pmDDClose(); }
function pmDDKey(e){ const d=_pmDD; if(!d) return; const list=[...d.dd.querySelectorAll('.pm-dd-opt:not([disabled])')]; const i=list.indexOf(document.activeElement);
  if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); pmDDClose(true); }
  else if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Home'||e.key==='End'){ e.preventDefault(); e.stopPropagation(); const n=e.key==='Home'?0:e.key==='End'?list.length-1:Math.max(0,Math.min(list.length-1,i<0?0:i+(e.key==='ArrowDown'?1:-1))); if(list[n]) list[n].focus(); }
  else if(e.key==='Tab'){ pmDDClose(); }
  else if(e.key===' '||e.key==='Enter'){ e.stopPropagation(); } }

/* phones: drag a sheet down by its grab handle to close it */
document.addEventListener('pointerdown',e=>{ if(window.innerWidth>=640||(e.button&&e.button>0)) return; const g=e.target&&e.target.closest&&e.target.closest('.pm-grab'); if(!g) return; const p=g.closest('.pm-panel'); if(!p) return; const bd=p.parentElement; const y0=e.clientY, t0=performance.now(); let dy=0, moved=false;
  const mv=ev=>{ dy=Math.max(0,ev.clientY-y0); if(!moved&&dy>4){ moved=true; p.classList.add('pm-dragging'); } if(moved){ ev.preventDefault(); p.style.transform='translateY('+dy+'px)'; if(bd) bd.style.opacity=String(Math.max(.4,1-dy/520)); } };
  const up=()=>{ document.removeEventListener('pointermove',mv); document.removeEventListener('pointerup',up); document.removeEventListener('pointercancel',up); if(!moved) return; p.classList.remove('pm-dragging'); const v=dy/Math.max(1,performance.now()-t0);
    if(dy>110||(v>.6&&dy>40)){ p.style.setProperty('--pm-dy',dy+'px'); p.style.transform=''; if(bd&&/backdrop$/.test(bd.dataset.act||'')) bd.click(); }
    else { p.style.transition='transform .38s cubic-bezier(.34,1.4,.64,1)'; p.style.transform=''; if(bd) bd.style.opacity=''; setTimeout(()=>{ p.style.transition=''; },400); } };
  document.addEventListener('pointermove',mv,{passive:false}); document.addEventListener('pointerup',up); document.addEventListener('pointercancel',up); },true);
