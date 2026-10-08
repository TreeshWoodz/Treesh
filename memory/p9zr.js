/* ---------- P9zr: Don't Get Caught (live), notify me for coming-soon games, arcade filters & game search ---------- */
(()=>{ if(GAME_BY_KEY.dgc) return; const g={key:'dgc', name:'Don\u2019t Get Caught', url:'https://treesh.app/games/dgc', mono:'D', a:'#e63946', b:'#4a0a10', age:'13+',
  added:'October 8, 2026', updated:'October 8, 2026', logo:P9ZM_ART.dgc_logo, banner:P9ZM_ART.dgc_banner,
  desc:'A horror mini-game gauntlet. Mr. Hush only kills what he sees, so freeze the second he turns around. The Hollow Bride hunts by sound, so keep it quiet. Survive every round with your crew. Just don\u2019t get caught.'};
  GAMES.push(g); GAME_BY_KEY.dgc=g; })();
['bronze-blitz','sonoku','ebonics'].forEach(k=>{ const g=GAME_BY_KEY[k]; if(g&&!g.added) g.added='October 8, 2026'; });

/* notify me when a coming-soon game goes live */
function gnList(){ const o=LS.get('treesh_game_notify',{}); return o&&typeof o==='object'?o:{}; }
function gnOn(k){ return !!gnList()[k]; }
function gnToggle(k){ const g=GAME_BY_KEY[k]; if(!g) return; const o=gnList(); if(o[k]) delete o[k]; else o[k]=Date.now(); LS.set('treesh_game_notify',o);
  const on=!!o[k]; document.querySelectorAll(`[data-gn="${k}"]`).forEach(b=>{ b.classList.toggle('is-on',on); b.setAttribute('aria-checked',on); const l=b.querySelector('.gn-l'); if(l) l.textContent=on?'Notifying':'Notify me'; });
  toast(on?'We\u2019ll let you know':'Notification off', on?g.name+' lands here the moment it\u2019s live':'You won\u2019t hear about '+g.name+' going live'); }
function gnChip(g){ const on=gnOn(g.key); return `<span role="switch" tabindex="0" aria-checked="${on}" aria-label="Notify me when ${esc(g.name)} is live" data-act="game-notify" data-key="${g.key}" data-gn="${g.key}" data-testid="game-notify-${g.key}" class="gn-chip${on?' is-on':''}"><i data-lucide="bell"></i><span class="gn-l">${on?'Notifying':'Notify me'}</span></span>`; }
setTimeout(()=>{ const o=gnList(); let ch=false; Object.keys(o).forEach(k=>{ const g=GAME_BY_KEY[k]; if(g&&!g.soon){ delete o[k]; ch=true; toast(g.name+' is live!','You asked us to tell you. Open Games to play it now.'); } }); if(ch) LS.set('treesh_game_notify',o); },2600);

const _gm3T9zr=gm3Tile; gm3Tile=function(g,i){ const h=_gm3T9zr.apply(this,arguments); return g&&g.soon?h.replace(`<span class="gm-soon-tag" data-testid="game-soon-badge-${g.key}">Soon</span>`,m=>m+gnChip(g)):h; };
const _ogi9zr=openGameInfo; openGameInfo=function(key){ const r=_ogi9zr.apply(this,arguments); const g=GAME_BY_KEY[key], m=document.getElementById('modal'); if(!g||!g.soon||!m) return r;
  const row=m.querySelector('[data-testid="game-info-soon-'+key+'"]'); const box=row&&row.parentElement;
  if(box&&!m.querySelector('[data-testid="game-info-notify-'+key+'"]')){ const on=gnOn(key); box.insertAdjacentHTML('beforebegin',`<div class="mb-3" data-gnrow>${npsSwitch('game-notify','game-info-notify-'+key,on,'bell','Notify me','Get a heads-up here the moment '+esc(g.name)+' is live').replace('data-act="game-notify"',`data-act="game-notify" data-key="${key}" data-gn="${key}"`)}</div>`); icons(); }
  return r; };

/* track opens for "Most played by you" */
const _ogf9zr=openGameFrame; openGameFrame=function(key){ const g=GAME_BY_KEY[key]; if(g&&!g.soon&&!isThingKey(key)){ const p=LS.get('treesh_arcade_plays',{})||{}; const x=p[key]||{n:0}; x.n=(x.n||0)+1; x.last=Date.now(); p[key]=x; LS.set('treesh_arcade_plays',p); } return _ogf9zr.apply(this,arguments); };

/* filters + search */
state.arf=state.arf||{f:'all',age:'',q:''};
const ARF=[['all','All','layout-grid'],['updated','Recently updated','refresh-cw'],['new','Newly added','sparkles'],['soon','Coming soon','hourglass'],['age','Age rating','shield-check'],['most','Most played by you','flame'],['az','A\u2013Z','arrow-down-a-z']];
const ARF_AGES=[['','Any rating'],['All','All ages'],['6+','6+'],['13+','13+']];
const arfAge=g=>{ const a=String(g.age||'').toUpperCase(); return /13/.test(a)?'13+':/^6/.test(a)?'6+':a==='ALL'?'All':a; };
const arfT=d=>{ const t=Date.parse(d||''); return isNaN(t)?0:t; };
function arfPlays(){ return LS.get('treesh_arcade_plays',{})||{}; }
function arfList(){ const F=state.arf, q=(F.q||'').trim().toLowerCase(); let L=GAMES.map((g,i)=>({g,i}));
  if(F.age) L=L.filter(x=>arfAge(x.g)===F.age);
  if(q) L=L.filter(x=>[x.g.name,x.g.desc,x.g.age,x.g.soon?'coming soon':''].join(' ').toLowerCase().includes(q));
  if(F.f==='updated'){ const top=Math.max(0,...GAMES.filter(g=>!g.soon).map(g=>arfT(g.updated))); L=L.filter(x=>!x.g.soon&&arfT(x.g.updated)>=top-30*864e5).sort((a,b)=>arfT(b.g.updated)-arfT(a.g.updated)||a.i-b.i); }
  else if(F.f==='new') L=L.filter(x=>x.g.added).sort((a,b)=>arfT(b.g.added)-arfT(a.g.added)||b.i-a.i);
  else if(F.f==='soon') L=L.filter(x=>x.g.soon);
  else if(F.f==='most'){ const p=arfPlays(); L=L.filter(x=>p[x.g.key]&&p[x.g.key].n).sort((a,b)=>p[b.g.key].n-p[a.g.key].n||(p[b.g.key].last||0)-(p[a.g.key].last||0)); }
  else if(F.f==='az') L=L.slice().sort((a,b)=>a.g.name.replace(/^the\s+/i,'').localeCompare(b.g.name.replace(/^the\s+/i,'')));
  return L.map(x=>x.g); }
function arfChips(){ const F=state.arf; return ARF.map(([id,l,ic])=>{ if(id==='age'){ const lab=F.age?(F.age==='All'?'All ages':'Ages '+F.age):l;
    return `<span class="arf-agew"><button type="button" data-act="arf-age" data-testid="arcade-filter-age" aria-haspopup="menu" aria-expanded="${!!state.arfMenu}" class="arf-chip press${F.age?' is-on':''}"><i data-lucide="${ic}"></i>${esc(lab)}<i data-lucide="chevron-down" class="arf-cv"></i></button></span>`; }
    return `<button type="button" data-act="arf-set" data-f="${id}" data-testid="arcade-filter-${id}" aria-pressed="${F.f===id}" class="arf-chip press${F.f===id?' is-on':''}"><i data-lucide="${ic}"></i>${l}</button>`; }).join(''); }
function arfMenuSync(){ let m=document.getElementById('arf-menu'); const b=document.querySelector('[data-testid="arcade-filter-age"]'), F=state.arf;
  if(!state.arfMenu||!b){ if(m) m.remove(); state.arfMenu=false; return; }
  if(!m){ m=document.createElement('div'); m.id='arf-menu'; m.className='arf-menu'; m.setAttribute('role','menu'); m.dataset.testid='arcade-age-menu'; document.body.appendChild(m); }
  m.innerHTML=ARF_AGES.map(([v,t])=>`<button type="button" role="menuitemradio" aria-checked="${F.age===v}" data-act="arf-age-set" data-v="${v}" data-testid="arcade-age-${v?v.replace('+','plus').toLowerCase():'any'}" class="arf-mi${F.age===v?' is-on':''}">${esc(t)}${F.age===v?'<i data-lucide="check"></i>':''}</button>`).join('');
  const r=b.getBoundingClientRect(); m.style.top=Math.round(r.bottom+8)+'px'; m.style.left=Math.round(Math.max(10,Math.min(r.left,innerWidth-m.offsetWidth-10)))+'px'; }
addEventListener('scroll',()=>{ if(state.arfMenu) arfMenuSync(); },{capture:true,passive:true});
function arfEmpty(){ const F=state.arf;
  if(F.f==='most'&&!F.q&&!F.age) return `<div class="arf-empty" data-testid="arcade-empty"><span class="arf-eo"><i data-lucide="flame"></i></span><b>No plays yet</b><small>Open any game and it lands here, most played first.</small><button type="button" data-act="arf-reset" data-testid="arcade-empty-reset" class="arf-chip press is-on">Browse all games</button></div>`;
  return `<div class="arf-empty" data-testid="arcade-empty"><span class="arf-eo"><i data-lucide="search-x"></i></span><b>${F.q?`No games match \u201c${esc(F.q)}\u201d`:F.f==='soon'&&!F.age?'Nothing on the way right now':'No games here yet'}</b><small>${F.f==='soon'&&!F.q&&!F.age?'Every Treesh game is live. New ones show up here first.':'Try another filter or clear your search.'}</small><button type="button" data-act="arf-reset" data-testid="arcade-empty-reset" class="arf-chip press is-on">Clear filters</button></div>`; }
function arfGridHtml(){ const L=arfList(); return L.length?L.map(gm3Tile).join(''):arfEmpty(); }
gamesArcadeHtml=function(){ const live=GAMES.filter(g=>!g.soon).length, F=state.arf;
  return `<section class="gm3-arc" data-testid="games-arcade"><div class="gm3-arc-h"><span class="st3-k" style="--ac:#f5c451;--ac2:#ffe08a"><i data-lucide="joystick" style="width:14px;height:14px"></i>Treesh Arcade</span><span class="gm3-count" data-testid="games-arcade-count">${live} live${GAMES.length>live?` \u00b7 ${GAMES.length-live} on the way`:''}</span>
    <label class="arf-search" data-testid="arcade-search-wrap"><i data-lucide="search"></i><input type="search" id="arf-q" data-testid="arcade-search" placeholder="Search games" autocomplete="off" enterkeyhint="search" value="${esc(F.q||'')}" aria-label="Search arcade games"><button type="button" data-act="arf-clear" data-testid="arcade-search-clear" aria-label="Clear search" class="arf-x${F.q?'':' hidden'}"><i data-lucide="x"></i></button></label></div>
    <div class="arf-chips no-scrollbar" role="toolbar" aria-label="Filter games" data-testid="arcade-filters">${arfChips()}</div>
    <div class="gm3-grid" id="arf-grid" data-testid="arcade-grid">${arfGridHtml()}</div></section>`; };
function arfRefresh(chips){ const g=document.getElementById('arf-grid'); if(g) g.innerHTML=arfGridHtml(); if(chips!==false){ const c=document.querySelector('[data-testid="arcade-filters"]'); if(c){ const sl=c.scrollLeft; c.innerHTML=arfChips(); c.scrollLeft=sl; } }
  const x=document.querySelector('[data-testid="arcade-search-clear"]'); if(x) x.classList.toggle('hidden',!state.arf.q); icons(); arfMenuSync(); icons(); }
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='arf-q'){ state.arf.q=e.target.value; arfRefresh(false); } });
document.addEventListener('keydown',e=>{ if(e.target&&e.target.id==='arf-q'&&e.key==='Escape'&&state.arf.q){ e.stopPropagation(); e.target.value=''; state.arf.q=''; arfRefresh(false); } },true);
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); const a=t&&t.dataset.act;
  if(state.arfMenu&&a!=='arf-age'&&a!=='arf-age-set'){ state.arfMenu=false; arfRefresh(); }
  if(!a) return;
  if(a==='game-notify'){ e.preventDefault(); e.stopPropagation(); gnToggle(t.dataset.key); }
  else if(a==='arf-set'){ state.arf.f=t.dataset.f; arfRefresh(); }
  else if(a==='arf-age'){ state.arfMenu=!state.arfMenu; arfRefresh(); }
  else if(a==='arf-age-set'){ state.arf.age=t.dataset.v||''; state.arfMenu=false; arfRefresh(); }
  else if(a==='arf-clear'){ state.arf.q=''; const i=document.getElementById('arf-q'); if(i){ i.value=''; i.focus(); } arfRefresh(false); }
  else if(a==='arf-reset'){ state.arf={f:'all',age:'',q:''}; const i=document.getElementById('arf-q'); if(i) i.value=''; arfRefresh(); } },true);
document.addEventListener('keydown',e=>{ const t=e.target; if(t&&t.dataset&&t.dataset.act==='game-notify'&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); e.stopPropagation(); gnToggle(t.dataset.key); } },true);
