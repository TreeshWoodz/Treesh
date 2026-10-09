/* ---------- P9zp: Lyric themes in the player. Classic stays the default; Text Messages, Neon, Typewriter, Notebook, Terminal, Comic and Polaroid are one tap away ---------- */
const LYT=[
  {id:'classic',name:'Classic',ic:'align-left',desc:'The Treesh look you know'},
  {id:'chat',name:'Text Messages',ic:'message-circle',desc:'Lines land like texts from the artist'},
  {id:'neon',name:'Karaoke Neon',ic:'zap',desc:'Glowing signs that flicker on'},
  {id:'type',name:'Typewriter',ic:'keyboard',desc:'Each line gets typed out on paper'},
  {id:'note',name:'Notebook',ic:'notebook-pen',desc:'Handwritten on lined paper'},
  {id:'term',name:'Retro Terminal',ic:'terminal',desc:'Green screen, blinking cursor'},
  {id:'comic',name:'Comic Bubbles',ic:'message-square-quote',desc:'Pop-art speech bubbles'},
  {id:'pola',name:'Polaroid Story',ic:'camera',desc:'Every line is a snapshot'}];
const LYT_FONTS={type:'Special+Elite',note:'Caveat:wght@500;700',term:'VT323',comic:'Bangers',pola:'Permanent+Marker'};
const LYT_FAM={type:"'Special Elite'",note:"'Caveat'",term:"'VT323'",comic:"'Bangers'",pola:"'Permanent Marker'"};
const lytName=id=>(LYT.find(t=>t.id===id)||LYT[0]).name;
function lytAll(){ const v=LS.get('treesh_lyt','classic'); return LYT.some(t=>t.id===v)?v:'classic'; }
function lytPins(){ const p=LS.get('treesh_lyt_song',null); return p&&typeof p==='object'&&!Array.isArray(p)?p:{}; }
function lytFor(s){ const p=s&&lytPins()[s.id]; return p&&LYT.some(t=>t.id===p)?p:lytAll(); }
function lytFont(id){ if(LYT_FONTS[id]) loadGoogleFont(LYT_FONTS[id]); }
const _lytFP={}, _lytFOK={};
function lytFontReady(id){ const g=LYT_FONTS[id]; if(!g||!document.fonts) return Promise.resolve(); if(_lytFP[id]) return _lytFP[id]; lytFont(id);
  const l=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>x.href.indexOf('family='+g.split(':')[0])>=0);
  const css=new Promise(r=>{ if(!l||l.sheet) return r(); l.addEventListener('load',r,{once:true}); l.addEventListener('error',r,{once:true}); setTimeout(r,5000); });
  return _lytFP[id]=css.then(()=>Promise.all([document.fonts.load('40px '+LYT_FAM[id]),document.fonts.load('700 40px '+LYT_FAM[id])])).then(()=>{ _lytFOK[id]=true; }).catch(()=>{}); }
const lytSynced=s=>(s.lyrics||[]).some(l=>typeof l.t==='number'&&l.t>0);
const lytHasText=s=>(s.lyrics||[]).some(l=>l.text&&l.text.trim());

/* apply to the lyric list after every render */
let _lytIdx=-2;
function lytApply(){ const c=document.getElementById('np-lyrics'), reg=document.getElementById('np-lyric-region'), s=curSong();
  const id=(!c||!s||state.karaoke||state.lyricsEdit||state.lyricSelect)?'classic':lytFor(s);
  if(reg) reg.dataset.lyt=id; if(!c) return; c.dataset.lyt=id; _lytIdx=-2; c.classList.toggle('lyt-on',id!=='classic');
  if(id==='classic') return; lytFont(id);
  c.classList.toggle('lyt-progressive',(id==='chat'||id==='term')&&lytSynced(s));
  c.querySelectorAll('[data-line-wrap]').forEach(w=>{ const l=(s.lyrics||[])[+w.dataset.lineWrap]; if(l&&l.secOnly) w.classList.add('lyt-sec'); });
  if(id==='chat') lytChatBuild(c,s);
  if(id==='term'&&!c.querySelector('.lyt-term-head')) c.insertAdjacentHTML('afterbegin',`<div class="lyt-term-head" aria-hidden="true">treesh@lyrics:~$ play "${esc(s.title||'')}" --by "${esc(s.artist||'')}"</div>`);
  if(id==='pola') c.style.setProperty('--lyt-cover',`url("${String(s.coverArt||FALLBACK).replace(/"/g,'%22')}")`);
  lytTick(true); }
function lytChatBuild(c,s){ const L=s.lyrics||[], t=wcTheme(), cfg=wcCfg();
  c.classList.add('wc-root'); c.dataset.wcf=t.f; c.dataset.glow=cfg.glow; c.dataset.ts=cfg.ts; c.dataset.live=cfg.live; wcVars(t).split(';').forEach(d=>{ const k=d.indexOf(':'); if(k>0) c.style.setProperty(d.slice(0,k),d.slice(k+1)); });
  c.querySelectorAll('[data-line-wrap]:not(.lyt-sec):not(.wc-row)').forEach(w=>{ const i=+w.dataset.lineWrap; if(L[i]&&WC_TAG.test(L[i].text||'')){ w.classList.add('lyt-sec'); return; } const by=wcLineBy(s,L,i), face=by?wcByFace(by,s):s;
    const col=w.querySelector(':scope > .relative'); if(!col) return; w.classList.add('wc-row','is-a'); w.dataset.who=wcWho(face);
    col.classList.add('wc-col'); col.insertAdjacentHTML('afterbegin',`<span class="wc-name">${esc(face.artist||'Artist')}</span>`);
    const b=col.querySelector('.np-line'); if(b) b.classList.add('wc-b'); const p=w.querySelector(':scope > [data-detail-panel]'); if(p) col.appendChild(p);
    w.insertAdjacentHTML('afterbegin',wnAv(false,face)); });
  if(!c.querySelector('.lyt-start')){ const crew=wcPeople([s]);
    c.insertAdjacentHTML('afterbegin',`<div class="wc-start lyt-start" data-testid="lyt-chat-start"><span class="wc-gav is-big">${crew.slice(0,4).map(x=>wnAv(false,x)).join('')}</span><p><b>${esc(wcGroupName([s]))}</b></p><p class="lyt-start-sub">${esc(s.title||'')} \u00b7 Text Message</p>${wcLines(s).length>=4?`<button type="button" data-act="lyt-wn-play" data-testid="lyt-chat-play-wn" class="lyt-wn-cta press"><i data-lucide="gamepad-2"></i><span>Play What\u2019s Next</span></button>`:''}</div>`); icons(); } }

/* chat + terminal: lines arrive as they're sung */
function lytNext(L,i){ for(let j=i+1;j<L.length;j++){ const l=L[j]; if(l&&!l.secOnly&&l.text&&l.text.trim()) return j; } return -1; }
function lytRegroup(c){ const rows=[...c.children].filter(x=>!x.classList.contains('lyt-fut')), key=x=>x&&x.classList.contains('wc-row')?'a:'+(x.dataset.who||''):null;
  rows.forEach((r,i)=>{ const k=key(r); if(!k) return; const nk=key(rows[i+1]); r.classList.toggle('g-cont',key(rows[i-1])===k); r.classList.toggle('g-mid',nk===k); r.classList.toggle('g-join',nk===k); }); }
function lytScrollEnd(c){ if(Date.now()<_lyricUserScrollUntil||_lyricMenuHold) return; c.scrollTo({top:c.scrollHeight,behavior:'smooth'}); }
function lytTypingSync(c,s,L,idx,t){ const j=lytNext(L,idx), nt=j>=0?L[j].t:null;
  const show=typeof nt==='number'&&nt-t>0&&nt-t<=1.8&&(idx<0||nt-(L[idx].t||0)>1.1); let ty=document.getElementById('lyt-typing');
  if(!show){ if(ty){ ty.remove(); lytRegroup(c); } return; } if(ty&&ty.dataset.j===String(j)) return; if(ty) ty.remove();
  const by=wcLineBy(s,L,j), face=by?wcByFace(by,s):s;
  const html=`<div class="wc-row is-a wc-in" id="lyt-typing" data-j="${j}" data-who="${esc(wcWho(face))}" data-testid="lyt-typing">${wnAv(false,face)}<div class="wc-col"><span class="wc-name">${esc(face.artist||'Artist')}</span><div class="wc-b wc-dots" aria-label="typing"><i></i><i></i><i></i></div></div></div>`;
  const nw=c.querySelector(`[data-line-wrap="${j}"]`); if(nw) nw.insertAdjacentHTML('beforebegin',html); else c.insertAdjacentHTML('beforeend',html); lytRegroup(c); lytScrollEnd(c); }

/* typewriter + terminal: the active line is typed out */
let _lytTT=0;
function lytChars(btn){ if(btn._lytCh) return btn._lytCh; const out=[];
  const walk=n=>{ [...n.childNodes].forEach(x=>{ if(x.nodeType===3){ if(!x.nodeValue) return; const f=document.createDocumentFragment(); for(const ch of x.nodeValue){ const sp=document.createElement('span'); sp.className='lyt-ch on'; sp.textContent=ch; f.appendChild(sp); out.push(sp); } x.replaceWith(f); } else if(x.nodeType===1&&!x.classList.contains('lyric-ex-ind')) walk(x); }); };
  walk(btn); btn._lytCh=out; return out; }
function lytType(btn,ms){ clearInterval(_lytTT); document.querySelectorAll('#np-lyrics .lyt-typing').forEach(x=>{ x.classList.remove('lyt-typing'); (x._lytCh||[]).forEach(c=>c.classList.add('on')); });
  if(!btn||state.perfMode||document.documentElement.classList.contains('a11y-reduce-motion')) return; const ch=lytChars(btn); if(!ch.length) return;
  ch.forEach(c=>c.classList.remove('on')); btn.classList.add('lyt-typing'); let k=0; const step=Math.max(14,Math.min(70,ms/ch.length));
  _lytTT=setInterval(()=>{ if(k>=ch.length||!btn.isConnected){ clearInterval(_lytTT); btn.classList.remove('lyt-typing'); return; } ch[k++].classList.add('on'); },step); }

function lytTick(force){ const c=document.getElementById('np-lyrics'); if(!c||!c.classList.contains('lyt-on')) return; const s=curSong(); if(!s) return;
  const id=c.dataset.lyt, L=s.lyrics||[], t=state.currentTime||0, prog=c.classList.contains('lyt-progressive'); let idx=-1;
  for(let i=0;i<L.length;i++){ if(L[i].t<=t+0.15) idx=i; else break; }
  if(idx!==_lytIdx||force){ const prev=_lytIdx; _lytIdx=idx;
    c.querySelectorAll('[data-line-wrap]').forEach(w=>{ const i=+w.dataset.lineWrap; w.classList.toggle('lyt-act',i===idx); w.classList.toggle('lyt-past',i<idx); w.classList.toggle('lyt-fut',i>idx); });
    const w=idx>=0?c.querySelector(`[data-line-wrap="${idx}"]`):null, btn=w&&!w.classList.contains('lyt-sec')?w.querySelector('.np-line'):null;
    if(id==='type'||id==='term'){ const j=lytNext(L,idx), gap=(j>=0&&typeof L[j].t==='number'&&idx>=0)?(L[j].t-L[idx].t)*1000:1600; lytType(!force&&idx>prev?btn:null,Math.max(300,Math.min(1500,gap*0.55))); }
    if(id==='chat'){ c.querySelectorAll('.lyt-rr').forEach(x=>x.remove()); c.querySelectorAll('.wc-b.is-live').forEach(x=>x.classList.remove('is-live'));
      if(btn){ btn.classList.add('is-live'); const col=w.querySelector('.wc-col'); if(col) col.insertAdjacentHTML('beforeend',`<span class="wc-note lyt-rr" data-testid="lyt-read">Read ${fmt(L[idx].t||0)}</span>`);
        if(!force&&idx>prev){ w.classList.add('wc-in'); setTimeout(()=>w.classList.remove('wc-in'),700); } }
      lytRegroup(c); }
    if(prog) lytScrollEnd(c); }
  if(id==='chat'&&prog) lytTypingSync(c,s,L,idx,t); }

const _rnp9zp=renderNP; renderNP=function(){ const r=_rnp9zp.apply(this,arguments); try{ lytApply(); }catch(e){ console.warn('lyric theme',e); } return r; };
const _rlr9zp=refreshLyricsRegion; refreshLyricsRegion=function(){ const r=_rlr9zp.apply(this,arguments); try{ lytApply(); }catch(e){ console.warn('lyric theme',e); } return r; };
const _rll9zp=refreshLyricLine; refreshLyricLine=function(){ const r=_rll9zp.apply(this,arguments); try{ lytApply(); }catch(e){} return r; };
const _ulh9zp=updateLyricHighlight; updateLyricHighlight=function(){ const r=_ulh9zp.apply(this,arguments); try{ lytTick(); }catch(e){} return r; };

/* picker: a sheet in the player, a row in Options, a card in Settings */
function lytPrev(id){ return `<span class="lyp lyp-${id}" aria-hidden="true"><i></i><i class="on"></i><i></i></span>`; }
function lytTiles(cur,scope,tidp){ return LYT.map(t=>`<button type="button" data-act="lyt-set" data-val="${t.id}"${scope?` data-scope="${scope}"`:''} data-testid="${tidp}-${t.id}" aria-pressed="${cur===t.id}" title="${esc(t.desc)}" class="nps-tile lyt-tile press${cur===t.id?' is-on':''}"><span class="nps-prev lyt-prev" style="--lyt-cover:url('${esc((curSong()||{}).coverArt||FALLBACK)}')">${lytPrev(t.id)}</span><span class="nps-l">${t.name}</span>${t.id==='classic'?'<span class="lyt-def">Default</span>':''}${cur===t.id?'<span class="nps-check"><i data-lucide="check"></i></span>':''}</button>`).join(''); }
function lytSheetHtml(still){ const s=curSong(), pinned=!!(s&&lytPins()[s.id]), cur=lytFor(s);
  return `<div class="nps-bd" data-act="np-style-close" data-testid="lyt-backdrop"></div><div class="nps-sheet${still?' is-still':''}" role="dialog" aria-label="Lyric theme" data-testid="lyt-sheet"><div class="nps-head" data-nps-drag><span class="nps-grab"></span><div class="flex items-center justify-between gap-3"><div><p class="nps-k">Lyrics</p><h3 class="nps-t">Lyric theme</h3></div><button type="button" data-act="np-style-close" data-testid="lyt-close" aria-label="Close" class="nps-x press"><i data-lucide="x"></i></button></div></div>
    <div class="nps-scroll"><div class="nps-grid lyt-grid">${lytTiles(cur,'','lyt-opt')}</div><div class="nps-opts">${s?npsSwitch('lyt-pin','lyt-pin-toggle',pinned,'pin','Only for this song',pinned?`${esc(s.title)} keeps ${esc(lytName(cur))}. Other songs use ${esc(lytName(lytAll()))}`:`Pin the theme you pick to ${esc(s.title)}`):''}${lytMulti(s)?npsSwitch('lyt-duet','lyt-duet-toggle',duetOn(),'palette','Color lines by singer','Each artist on this song gets their own color'):''}</div><p class="lyt-foot">Tap any line to jump there. Hold a line for its menu.</p></div></div>`; }
function lytOpen(){ closeLyricPop(); let r=document.getElementById('nps-root'); if(!r){ r=document.createElement('div'); r.id='nps-root'; document.body.appendChild(r); }
  state.npsOpen=true; r.className=''; r.dataset.kind='lyt'; r.setAttribute('style',npVars(state.palette)); r.innerHTML=lytSheetHtml(false); icons(); npsWireDrag(); }
function lytSheetSync(){ const r=document.getElementById('nps-root'); if(!r||r.dataset.kind!=='lyt'||!state.npsOpen) return; const sc=r.querySelector('.nps-scroll'), top=sc?sc.scrollTop:0;
  r.innerHTML=lytSheetHtml(true); icons(); npsWireDrag(); const n=r.querySelector('.nps-scroll'); if(n) n.scrollTop=top; }
const _npsO9zp=npsOpen; npsOpen=function(){ const r=document.getElementById('nps-root'); if(r) r.dataset.kind='nps'; return _npsO9zp.apply(this,arguments); };
const _npsS9zp=npsSync; npsSync=function(){ const r=document.getElementById('nps-root'); if(r&&r.dataset.kind==='lyt') return lytSheetSync(); return _npsS9zp.apply(this,arguments); };
function lytRefresh(){ if(state.npOpen&&state.showLyrics) refreshLyricsRegion(); lytSheetSync(); if(state.view==='settings') try{ renderView(); }catch(e){} }
function lytSet(id,all){ if(!LYT.some(t=>t.id===id)) return; const s=curSong(), pins=lytPins(); lytFont(id);
  if(!all&&s&&pins[s.id]){ pins[s.id]=id; LS.set('treesh_lyt_song',pins); toast(lytName(id)+' theme','Pinned to '+s.title); }
  else { LS.set('treesh_lyt',id); toast(lytName(id)+' theme',id==='classic'?'Back to the default look':'Used for every song'); }
  lytRefresh(); }
function lytPin(){ const s=curSong(); if(!s) return; const pins=lytPins();
  if(pins[s.id]){ delete pins[s.id]; LS.set('treesh_lyt_song',pins); toast('Unpinned',s.title+' follows your theme again'); }
  else { pins[s.id]=lytFor(s); LS.set('treesh_lyt_song',pins); toast('Pinned to this song','Pick a theme and only '+s.title+' uses it'); }
  lytRefresh(); }

/* singer colors are opt-in (Settings > Duet colors, or the toggle in this sheet) */
state.duetColors=LS.get('treesh_duet_colors',false)===true; _duetCache={lines:null}; duetOn=function(){ return state.duetColors===true; };
const _lytMC={};
function lytMulti(s){ if(!s) return false; const k=s.id+'|'+(s.lyrics||[]).length; if(_lytMC[k]!==undefined) return _lytMC[k]; const was=state.duetColors, c=_duetCache; let m=false;
  state.duetColors=true; _duetCache={lines:null}; try{ m=!!duetInfo(s); }catch(e){} state.duetColors=was; _duetCache=c; return _lytMC[k]=m; }
function lytDuet(){ state.duetColors=!duetOn(); LS.set('treesh_duet_colors',state.duetColors); _duetCache={lines:null}; try{ _karSongSig=''; }catch(e){}
  if(state.npOpen) renderNP(); lytSheetSync(); toast(state.duetColors?'Singer colors on':'Singer colors off',state.duetColors?'Each artist gets their own color':'Lyrics use one color'); }

const LYT_BTN=(tid,cls)=>`<button data-act="lyt-open" data-testid="${tid}" aria-label="Lyric theme" title="Lyric theme" class="${cls}"><i data-lucide="swatch-book" style="width:17px;height:17px"></i></button>`;
const _lth9zp=lyricToolsHtml; lyricToolsHtml=function(s){ const h=_lth9zp.apply(this,arguments); if(!s||state.lyricsEdit||state.lyricSelect||!lytHasText(s)) return h;
  return h.replace('<button data-act="lyrics-tools-menu"',LYT_BTN('lyt-open-button','press lg:hidden grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-white/80 hover:bg-white/10')+'<button data-act="lyrics-tools-menu"'); };
const _ltd9zp=lyricToolsDesktopRow; lyricToolsDesktopRow=function(s){ const h=_ltd9zp.apply(this,arguments); if(!h||!s||!lytHasText(s)) return h;
  return h.replace('<div class="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">','<div class="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">'+LYT_BTN('lyt-open-button-d',`press grid h-10 w-10 place-items-center rounded-full border ${lytFor(s)!=='classic'?'border-white/25 bg-white/20 text-white':'border-white/12 bg-black/45 text-white/85'} backdrop-blur-md hover:bg-white/15`)); };
const _oltm9zp=openLyricToolsMenu; openLyricToolsMenu=function(){ const r=_oltm9zp.apply(this,arguments); const pop=document.getElementById('lyric-pop'), s=curSong();
  if(pop&&s&&lytHasText(s)){ pop.insertAdjacentHTML('afterbegin',`<button data-act="lyt-open" data-testid="lyrictool-lyt-open" class="pm-item sm press"><span class="pm-item-ic"><i data-lucide="swatch-book"></i></span><span class="pm-item-t"><span class="pm-item-l">Lyric theme</span><span class="pm-item-d">${esc(lytName(lytFor(s)))}</span></span></button><div class="pm-sep"></div>`); icons();
    const rc=pop.getBoundingClientRect(); if(rc.bottom>innerHeight-8) pop.style.top=Math.max(8,innerHeight-8-rc.height)+'px'; } return r; };
const _nps9zp=npSettingsHtml; npSettingsHtml=function(tab){ return _nps9zp.apply(this,arguments)+`<section data-testid="settings-lyric-theme" class="${tab==='appearance'?'':'hidden'} rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"><div class="mb-1 flex items-center gap-2.5"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="swatch-book" style="width:18px;height:18px"></i></span><h2 class="text-lg font-bold">Lyric theme</h2></div><p class="mb-4 pl-11 text-sm text-white/50">How lyrics look in the player. Classic is the default. Pin a different theme to one song from the theme button in the lyrics view.</p><div class="nps-grid nps-grid-set lyt-grid" style="${npVars(state.palette)}">${lytTiles(lytAll(),'all','settings-lyt')}</div></section>`; };
SETTINGS_INDEX.push({id:'lyt',label:'Lyric theme',desc:'Text Messages, Neon, Typewriter, Notebook, Terminal, Comic or Polaroid lyrics',kw:'lyrics theme text message chat imessage neon typewriter notebook handwritten terminal comic polaroid style look',ic:'swatch-book',type:'action',go:()=>{ state.settingsTab='appearance'; closeSearch(); setTimeout(()=>{ try{ navigate('settings'); }catch(e){} setTimeout(()=>{ const el=document.querySelector('[data-testid="settings-lyric-theme"]'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); },350); },60); }});

document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act;
  if(a==='lyt-open') lytOpen(); else if(a==='lyt-set') lytSet(t.dataset.val,t.dataset.scope==='all'); else if(a==='lyt-pin') lytPin(); else if(a==='lyt-duet') lytDuet(); });
