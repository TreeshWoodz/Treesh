/* ---------- P7: Now Playing look (aura, floating cover, lyrics peek) ---------- */
function npCoverBg(){ return LS.get('treesh_np_coverbg',false)===true; }
function npAuraOn(){ return LS.get('treesh_np_aura',true)!==false; }
function npVars(pal){ const c0=pal&&pal[0], c1=pal&&(pal[1]||pal[0]), c2=pal&&(pal[2]||pal[1]||pal[0]); return `--np-a:${rgb(c0,1)};--np-b:${c1?rgb(c1,1):'rgba(34,211,238,1)'};--np-c:${c2?rgb(c2,1):'rgba(255,45,120,1)'}`; }
function npBgHtml(s,lt){ const full=npCoverBg(), aura=npAuraOn();
  return `<div class="np-bg np-aura absolute inset-0 overflow-hidden${full?' is-cover':''}${aura?' is-moving':''}" data-testid="np-aura" data-cover-bg="${full}">${img(s.coverArt, full?'np-cover-full':'np-aura-img')}<span class="np-blob b1"></span><span class="np-blob b2"></span><span class="np-blob b3"></span><span class="np-veil${(lt&&!full)?' is-light':''}"></span></div>`; }
function npArtHtml(s,pal){ const c0=pal&&pal[0];
  return `<div data-act="toggle-vinyl" data-testid="np-artwork-toggle" role="button" tabindex="0" title="Tap to spin the record" class="np-art ${state.isPlaying?'is-playing':'is-paused'} w-[min(72vw,36vh,390px)] shrink-0 cursor-pointer lg:w-[min(38vw,46vh,460px)]" style="--glow:${rgb(c0,0.6)}"><div class="np-art-bob"><div class="np-art-float"><div class="np-art-img" data-testid="np-cover">${img(s.coverArt,'h-full w-full object-cover')}<span class="np-art-shine"></span></div><div class="np-art-refl" aria-hidden="true">${img(s.coverArt,'w-full object-cover')}</div></div></div></div>`; }
function npPeekLines(s){ const L=((s&&s.lyrics)||[]).filter(l=>l&&l.text&&l.text.trim()&&!l.secOnly); if(!L.length) return null; const synced=L.some(l=>l.t!=null); const t=state.currentTime||0; let i=-1;
  if(synced){ for(let k=0;k<L.length;k++){ if(L[k].t!=null&&L[k].t<=t+0.15) i=k; else if(L[k].t!=null&&L[k].t>t+0.15) break; } }
  const cur=i>=0?L[i].text:(synced?'\u266A':L[0].text); const next=i>=0?(L[i+1]?L[i+1].text:''):(synced?L[0].text:(L[1]?L[1].text:'')); return {cur,next,synced}; }
function npPeekHtml(s){ const p=npPeekLines(s);
  if(!p) return `<button data-act="toggle-lyrics" data-testid="np-lyrics-peek" class="np-peek is-empty press"><span class="np-peek-k"><i data-lucide="quote"></i>Lyrics</span><span class="np-peek-next">No lyrics yet. Tap to add some</span></button>`;
  return `<button data-act="toggle-lyrics" data-testid="np-lyrics-peek" class="np-peek press"><span class="np-peek-k"><i data-lucide="quote"></i>${p.synced?'Live lyrics':'Lyrics'}</span><span class="np-peek-cur" id="np-peek-cur" data-testid="np-peek-current">${esc(p.cur)}</span><span class="np-peek-next" id="np-peek-next">${esc(p.next)}</span></button>`; }
function npPeekUpdate(){ const el=document.getElementById('np-peek-cur'); if(!el) return; const p=npPeekLines(curSong()); if(!p) return; if(el.textContent!==p.cur){ el.textContent=p.cur; el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new'); const n=document.getElementById('np-peek-next'); if(n) n.textContent=p.next; } }
function npArtSync(){ const a=document.querySelector('#np .np-art'); if(!a) return; const on=!audio.paused; a.classList.toggle('is-playing',on); a.classList.toggle('is-paused',!on); }
function npSettingsHtml(tab){ return `<section data-testid="settings-player-look" class="${tab==='appearance'?'':'hidden'} rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"><div class="mb-1 flex items-center gap-2.5"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="disc-3" style="width:18px;height:18px"></i></span><h2 class="text-lg font-bold">Now Playing look</h2></div><p class="mb-4 pl-11 text-sm text-white/50">How the full-screen player looks while a song plays.</p><div class="space-y-2.5">${toggleCard('np-coverbg','settings-np-coverbg',npCoverBg(),'image','Cover art background','Fill the whole player with the song\u2019s cover art')}${toggleCard('np-aura','settings-np-aura',npAuraOn(),'sparkles','Moving aura','Slow color gradients pulled from the cover art')}</div></section>`; }

/* ---------- P7: Image Studio with custom shape (profile photo / banner) ---------- */
function cvApplyOpts(){ const o=_cv.opts; const W=(o.out&&o.out[0])||1000, H=(o.out&&o.out[1])||Math.round(W/(o.aspect||1)); const out=document.createElement('canvas'); out.width=W; out.height=H; const ctx=out.getContext('2d'); cvRender(ctx,W,H); _lh=_cv; const cb=o.onApply;
  cvBakeLayers(ctx,W).catch(()=>{}).then(()=>{ let d=''; try{ d=out.toDataURL('image/jpeg',o.q||0.86); }catch(e){ toast('Couldn\u2019t process image'); return; } closeModal2(); try{ cb(d); }catch(e){ console.error(e); } }); }
function pfSetBanner(f){ if(!/^image\//.test(f.type||'')){ toast('Pick an image file'); return; } if(f.size>20*1024*1024){ toast('Image too large','Use one under 20 MB'); return; }
  openCoverStudio(URL.createObjectURL(f),'Crop your profile banner',true,{aspect:3,out:[1500,500],q:0.85,applyLabel:'Use as banner',onApply:d=>{ assetPut('profile_banner',d).then(()=>{ if(typeof pfStashDraft==='function') pfStashDraft(); state.profileBanner=d; pfRerender(); toast('Banner updated'); }).catch(()=>toast('Couldn\u2019t save banner','Your device storage may be full')); }}); }

/* ---------- P7: actions + boot ---------- */
function p7Act2(act,t,e){ const id=t.dataset.id, val=t.dataset.val;
  switch(act){
    case 'np-coverbg': { const on=!npCoverBg(); LS.set('treesh_np_coverbg',on); if(state.npOpen) renderNP(); if(state.view==='settings') renderView(); toast(on?'Cover art background on':'Moving aura on'); break; }
    case 'np-aura': { const on=!npAuraOn(); LS.set('treesh_np_aura',on); if(state.npOpen) renderNP(); if(state.view==='settings') renderView(); toast(on?'Moving aura on':'Aura paused'); break; }
    case 'te-tab': teTab(val); break;
    case 'te-lyrics': teLyrics(val,id); break;
    case 'um-menu': umOpenMenu(id); break;
    case 'um-close': closeModal2(); break;
    case 'um-del': umConfirmDelete(id); break;
    case 'um-del-yes': closeModal2(); deleteUpload(id); break;
    case 'modal2-backdrop': if(t.hasAttribute('data-p7bd')&&e.target===t) closeModal2(); break;
    case 'w-clock-fmt': LS.set('treesh_clock24',!(LS.get('treesh_clock24',false)===true)); mkRefreshW('clock'); break;
    case 'wx-locate': wxLocate(); break;
    case 'wx-search-mode': { const w=wxS(); w.mode='search'; w.results=null; mkRefreshW('weather'); setTimeout(()=>{ const q=document.getElementById('mk-wx-q'); if(q) q.focus(); },60); break; }
    case 'wx-cancel': { const w=wxS(); w.mode=''; w.results=null; mkRefreshW('weather'); break; }
    case 'wx-search': { const q=document.getElementById('mk-wx-q'); wxSearch(q?q.value:''); break; }
    case 'wx-pick': wxPick(+t.dataset.i); break;
    case 'wx-unit': { const w=wxS(); w.unit=w.unit==='f'?'c':'f'; w.err=''; wxSave(); wxFetch(true); break; }
    case 'wx-refresh': { const w=wxS(); w.err=''; wxFetch(true); break; }
  }
  if(t.hasAttribute('data-um')) setTimeout(()=>{ const m2=document.querySelector('#modal2 [data-testid="upload-menu"]'); if(m2) closeModal2(); },0);
}
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(t) p7Act2(t.dataset.act,t,e); });
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target&&e.target.id==='mk-wx-q'){ e.preventDefault(); wxSearch(e.target.value); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.closest&&e.target.closest('.te-sheet')) state._teDirty=true; },true);
document.addEventListener('change',e=>{ if(e.target&&e.target.closest&&e.target.closest('.te-sheet')) state._teDirty=true; },true);
function p7SettingsIdx(){ if(window._p7Idx||typeof SETTINGS_INDEX==='undefined') return; window._p7Idx=true; SETTINGS_INDEX.push(
  {id:'np-coverbg',label:'Cover art background',desc:'Fill the Now Playing screen with the cover art',kw:'now playing player cover art background full screen wallpaper album',ic:'image',type:'toggle',get:()=>npCoverBg(),toggle:()=>{ LS.set('treesh_np_coverbg',!npCoverBg()); if(state.npOpen) renderNP(); }},
  {id:'np-aura',label:'Moving aura',desc:'Slow color gradients from the cover in Now Playing',kw:'now playing player aura gradient colors animation glow',ic:'sparkles',type:'toggle',get:()=>npAuraOn(),toggle:()=>{ LS.set('treesh_np_aura',!npAuraOn()); if(state.npOpen) renderNP(); }},
  {id:'go-models',label:'Treesh Models',desc:'Browse the models in Icons',kw:'models modeling comp card icons faces',ic:'aperture',type:'action',go:()=>{ closeSearch(); state.iconsTab='models'; LS.set('treesh_models_seen',true); setTimeout(()=>navigate('artists'),200); }},
  {id:'go-live-widgets',label:'Clock, date & weather widgets',desc:'Add live widgets to any page with Magic Markup',kw:'clock time date calendar weather forecast widget magic markup',ic:'cloud-sun',type:'action',go:()=>{ closeSearch(); setTimeout(()=>{ mkStart(); state.mkSheet='add'; mkRenderSheet(); },220); }}
); }
function p7Init(){ state.mdUnits=LS.get('treesh_md_units','in')==='cm'?'cm':'in'; try{ loadModels(); }catch(e){} try{ audio.addEventListener('timeupdate',npPeekUpdate); ['play','pause'].forEach(ev=>audio.addEventListener(ev,npArtSync)); }catch(e){} p7SettingsIdx(); setInterval(mkWTick,1000); }
