/* ---------- P9zs: Smart search. One "Top results" view across songs, artists, lyrics, games, users & settings; quick filter chips, recent + trending, arrow-key nav; top on desktop, bottom on phones ---------- */
state.searchTab='top';
const SR_TABS=[['top','Top','sparkles'],['songs','Songs','music'],['artists','Artists','mic-vocal'],['lyrics','Lyrics','quote'],['games','Games','gamepad-2'],['users','Users','users-round'],['settings','Settings','settings']];
const SR_BUILTIN=[{key:'whatsnext',name:'What\u2019s Next?',desc:'Guess the next lyric by typing or saying it',built:'lyrics',a:'#9328ff',b:'#4d128f'},{key:'tot',name:'This or That',desc:'Two tracks enter, you pick the vibe',built:'tot',a:'#6d5bff',b:'#3b2bb8'}];
let _srK=-1, _srUP=null;
const srQ=()=>(state.searchQuery||'').trim();
const srD=s=>Date.parse(s&&s.creationDate||'')||0;

function srGameList(q){ const all=[...SR_BUILTIN.map(g=>Object.assign({},g,{logo:ST3_ART[g.key+'_main']||''})),...GAMES,...THINGS]; if(!q) return all;
  const qn=normStr(q); return all.map(g=>{ let sc=scoreFields([{text:g.name,weight:1}],q); if(sc<20) sc=0; if(!sc&&qn.length>=3&&normStr([g.label,g.desc,g.soon?'coming soon':''].join(' ')).includes(qn)) sc=15; return {g,sc}; }).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).map(x=>x.g); }
function srSetList(q){ const n=normStr(q); return n.length<3?[]:searchSettingsList(q).filter(it=>normStr([it.label,it.desc,it.kw].join(' ')).includes(n)); }
function srTrendSongs(){ const V=vis(SONGS), P=V.filter(s=>s.treeshChoice); return (P.length>=4?P:V).slice().sort((a,b)=>srD(b)-srD(a)).slice(0,4); }
function srTrending(){ const out=[], seen=new Set(), add=(q,ic)=>{ const k=(q||'').toLowerCase(); if(q&&!seen.has(k)){ seen.add(k); out.push({q,ic}); } };
  ARTISTS.slice().sort((a,b)=>vis(artistSongs(b.id)).length-vis(artistSongs(a.id)).length).slice(0,3).forEach(a=>add(a.name,'mic-vocal'));
  srTrendSongs().slice(0,2).forEach(s=>add(s.title,'music'));
  const ng=GAMES.filter(g=>g.added&&!g.soon).sort((a,b)=>Date.parse(b.added)-Date.parse(a.added))[0]; if(ng) add(ng.name,'gamepad-2');
  add('Lyric theme','swatch-book'); return out.slice(0,7); }

/* rows */
const srTag=t=>`<span class="sr-tag">${t}</span>`;
function srSongRow(s,q,tid){ const cur=curSong()&&curSong().id===s.id;
  return `<button type="button" data-act="search-play" data-id="${s.id}" data-testid="${tid||'search-top-song-'+s.id}" class="sr-row press${cur?' is-cur':''}"><span class="sr-art">${img(s.coverArt,'h-full w-full object-cover')}<span class="sr-pl"><i data-lucide="${cur&&state.isPlaying?'audio-lines':'play'}"></i></span></span><span class="sr-tx"><b class="clamp-1">${hlMatch(s.title,q)}${s.explicit?'<span class="sr-e">E</span>':''}</b><small class="clamp-1">${hlMatch(s.artist,q)}</small></span>${srTag('Song')}</button>`; }
function srArtistRow(a,q){ const n=vis(artistSongs(a.id)).length;
  return `<button type="button" data-act="search-open-artist" data-id="${a.id}" data-testid="search-top-artist-${a.id}" class="sr-row press"><span class="sr-art is-round">${img(a.image,'h-full w-full object-cover')}</span><span class="sr-tx"><b class="clamp-1">${hlMatch(a.name,q)}</b><small class="clamp-1">${esc(a.role||'Music Artist')} \u00b7 ${n} track${n!==1?'s':''}</small></span>${srTag('Artist')}</button>`; }
function srLyricRow(r,q){ return `<button type="button" data-act="search-play-lyric" data-id="${r.song.id}" data-i="${r.i}" data-t="${r.t}" data-testid="search-top-lyric-${r.song.id}-${r.i}" class="sr-row press"><span class="sr-art">${img(r.song.coverArt,'h-full w-full object-cover')}</span><span class="sr-tx"><b class="clamp-2 sr-quote">\u201c${hlMatch(r.line,q)}\u201d</b><small class="clamp-1">${esc(r.song.title)} \u00b7 ${esc(r.song.artist)}</small></span>${srTag('Lyric')}</button>`; }
function srGameRow(g,q,tid){ const thing=isThingKey(g.key), sub=g.built?'Treesh game':thing?(g.label||'Treesh Things'):g.soon?'Coming soon':(g.age?(g.age==='All'?'All ages':'Ages '+g.age):'Treesh Arcade');
  return `<button type="button" data-act="search-open-game" data-key="${g.key}"${g.built?` data-built="${g.built}"`:''} data-testid="${tid||'search-result-game-'+g.key}" class="sr-row press"><span class="sr-art" style="background:linear-gradient(135deg,${g.a||'#9328ff'},${g.b||'#4d128f'})">${g.logo?`<img src="${esc(g.logo)}" alt="" loading="lazy" class="h-full w-full ${g.built?'object-contain p-1':'object-cover'}">`:`<span class="sr-mono">${esc(g.mono||g.name.charAt(0))}</span>`}</span><span class="sr-tx"><b class="clamp-1">${hlMatch(g.name,q)}</b><small class="clamp-1">${esc(sub)}</small></span>${srTag(thing?'Thing':'Game')}</button>`; }
function srUserRow(u,q){ return `<button type="button" data-act="sx-open" data-u="${esc(u.username)}" data-testid="search-top-user-${esc(u.username)}" class="sr-row press">${sxAv(u,'sr-uav')}<span class="sr-tx"><b class="clamp-1">${hlMatch(u.display_name||u.username,q)}</b><small class="clamp-1">@${hlMatch(u.username,q)}</small></span>${srTag('User')}</button>`; }
function srSec(id,title,count,body,i){ return `<section class="sr-sec" data-testid="search-sec-${id}" style="--d:${(i||0)*45}ms"><div class="sr-sh"><h3>${title}${count?`<span class="sr-c">${count>99?'99+':count}</span>`:''}</h3>${count?`<button type="button" data-act="search-tab" data-tab="${id}" data-testid="search-see-all-${id}" class="sr-more press">See all<i data-lucide="arrow-right"></i></button>`:''}</div><div class="sr-list">${body}</div></section>`; }

/* users come back async */
function srUsers(q){ const qn=q.replace(/^@+/,'').toLowerCase(); if(!sb||qn.length<2) return {n:0,html:''};
  if(_sxQ.q!==qn){ sxSearchSoon(qn); srUsersPoll(qn); return {n:0,pend:true,html:`<div class="sr-row is-skel" data-testid="search-users-loading"><span class="sr-art is-round"></span><span class="sr-tx"><i></i><i></i></span></div>`}; }
  if(_sxQ.err||!_sxQ.res.length) return {n:0,html:''}; return {n:_sxQ.res.length,html:_sxQ.res.slice(0,3).map(u=>srUserRow(u,qn)).join('')}; }
function srUsersPoll(qn){ clearInterval(_srUP); let k=0; _srUP=setInterval(()=>{ if(++k>40||!state.searchOpen||state.searchTab!=='top'){ clearInterval(_srUP); return; }
  if(_sxQ.q===qn&&!_sxQ.pend){ clearInterval(_srUP); if(srQ().replace(/^@+/,'').toLowerCase()===qn){ const keep=_srK; refreshSearchResults(); if(keep>=0) srKSet(keep,true); } } },150); }

function srHit(q,songs,artists,games){ const n=normStr(q), a=artists[0], g=games[0], s=songs[0];
  if(a&&normStr(a.name).startsWith(n)) return {t:'artist',a}; if(g&&normStr(g.name).startsWith(n)) return {t:'game',g}; if(s) return {t:'song',s}; if(a) return {t:'artist',a}; if(g) return {t:'game',g}; return null; }
function srHitHtml(h,q){ let act,pic,name,kick,sub,cta,ic,round='';
  if(h.t==='song'){ const s=h.s; act=`data-act="search-play" data-id="${s.id}"`; pic=img(s.coverArt,'h-full w-full object-cover'); name=s.title; kick='Song'; sub=s.artist; cta='Play'; ic='play'; }
  else if(h.t==='artist'){ const a=h.a, n=vis(artistSongs(a.id)).length; act=`data-act="search-open-artist" data-id="${a.id}"`; pic=img(a.image,'h-full w-full object-cover'); name=a.name; kick='Artist'; sub=`${n} track${n!==1?'s':''}`; cta='View'; ic='arrow-up-right'; round=' is-round'; }
  else { const g=h.g; act=`data-act="search-open-game" data-key="${g.key}"${g.built?` data-built="${g.built}"`:''}`; pic=g.logo?`<img src="${esc(g.logo)}" alt="" class="h-full w-full ${g.built?'object-contain p-2':'object-cover'}">`:`<span class="sr-mono">${esc(g.mono||'?')}</span>`; name=g.name; kick=isThingKey(g.key)?'Thing':'Game'; sub=g.desc||''; cta='Open'; ic='gamepad-2'; }
  return `<button type="button" ${act} data-testid="search-top-hit" class="sr-hit press"><span class="sr-hit-pic${round}"${h.t==='game'?` style="background:linear-gradient(135deg,${h.g.a||'#9328ff'},${h.g.b||'#4d128f'})"`:''}>${pic}</span><span class="sr-tx"><small class="sr-k"><i data-lucide="sparkles"></i>Top result \u00b7 ${kick}</small><b class="clamp-1">${hlMatch(name,q)}</b><small class="clamp-1">${esc(sub)}</small></span><span class="sr-cta"><i data-lucide="${ic}"${ic==='play'?' class="fill-current"':''}></i>${cta}</span></button>`; }

function srTopHtml(){ const q=srQ(); if(!q) return srHomeHtml();
  const songs=searchSongsList(q), artists=searchArtistsList(q), lyrics=searchLyricsList(q), games=srGameList(q), sets=srSetList(q), users=srUsers(q);
  state._srC={songs:songs.length,artists:artists.length,lyrics:lyrics.length,games:games.length,users:users.n,settings:sets.length};
  if(!songs.length&&!artists.length&&!lyrics.length&&!games.length&&!sets.length&&!users.n&&!users.pend) return srNone(q);
  const hit=srHit(q,songs,artists,games); let i=0, h=`<div class="sr-top" data-testid="search-top-results">${hit?srHitHtml(hit,q):''}`;
  const S=songs.filter(s=>!(hit&&hit.t==='song'&&hit.s.id===s.id)).slice(0,4), A=artists.filter(a=>!(hit&&hit.t==='artist'&&hit.a.id===a.id)).slice(0,3), G=games.filter(g=>!(hit&&hit.t==='game'&&hit.g.key===g.key)).slice(0,3);
  if(S.length) h+=srSec('songs','Songs',songs.length,S.map(s=>srSongRow(s,q)).join(''),++i);
  if(A.length) h+=srSec('artists','Artists',artists.length,A.map(a=>srArtistRow(a,q)).join(''),++i);
  if(lyrics.length) h+=srSec('lyrics','Lyrics',lyrics.length,lyrics.slice(0,3).map(r=>srLyricRow(r,q)).join(''),++i);
  if(G.length) h+=srSec('games','Games',games.length,G.map(g=>srGameRow(g,q,'search-top-game-'+g.key)).join(''),++i);
  if(users.n||users.pend) h+=srSec('users','Users',users.n,users.html,++i);
  if(sets.length) h+=srSec('settings','Settings',sets.length,sets.slice(0,3).map(settingsResultRow).join(''),++i);
  return h+'</div>'; }
function srNone(q){ const tr=srTrending().slice(0,4); return `<div class="sr-none" data-testid="search-no-results"><span class="sr-none-ic"><i data-lucide="search-x"></i></span><b>Nothing matches \u201c${esc(q)}\u201d</b><small>Check the spelling, or try one of these</small><div class="sr-trend">${tr.map((t,i)=>`<button type="button" data-act="search-recent-chip" data-q="${esc(t.q)}" data-testid="search-none-try-${i}" class="sr-tchip press"><i data-lucide="${t.ic}"></i>${esc(t.q)}</button>`).join('')}</div></div>`; }
function srHomeHtml(){ const rc=state.recentSearches||[]; let h='<div class="sr-home" data-testid="search-home">', i=0;
  if(rc.length) h+=`<section class="sr-sec" data-testid="search-recent"><div class="sr-sh"><h3>Recent searches</h3><button type="button" data-act="search-recent-clear" data-testid="search-recent-clear-button" class="sr-more press">Clear</button></div><div class="sr-list">${rc.slice(0,6).map((r,k)=>`<div class="sr-rc"><button type="button" data-act="search-recent-chip" data-q="${esc(r)}" data-testid="search-recent-chip-${k}" class="sr-row press"><span class="sr-art sr-ic"><i data-lucide="history"></i></span><span class="sr-tx"><b class="clamp-1">${esc(r)}</b></span><i data-lucide="arrow-up-left" class="sr-chev"></i></button><button type="button" data-act="search-recent-del" data-q="${esc(r)}" data-testid="search-recent-del-${k}" aria-label="Remove ${esc(r)}" class="sr-del press"><i data-lucide="x"></i></button></div>`).join('')}</div></section>`;
  h+=`<section class="sr-sec" data-testid="search-trending" style="--d:${++i*45}ms"><div class="sr-sh"><h3><i data-lucide="trending-up"></i>Trending</h3></div><div class="sr-trend">${srTrending().map((t,k)=>`<button type="button" data-act="search-recent-chip" data-q="${esc(t.q)}" data-testid="search-trend-${k}" class="sr-tchip press"><i data-lucide="${t.ic}"></i>${esc(t.q)}</button>`).join('')}</div></section>`;
  const ts=srTrendSongs(); if(ts.length) h+=`<section class="sr-sec" data-testid="search-trending-songs" style="--d:${++i*45}ms"><div class="sr-sh"><h3>Hot on Treesh</h3></div><div class="sr-list">${ts.map(s=>srSongRow(s,'','search-trend-song-'+s.id)).join('')}</div></section>`;
  const J=[['arcade','Arcade','joystick','Every Treesh game'],['lyt','Lyric themes','swatch-book','Restyle your lyrics'],['users','Find people','users-round','Search by @username'],['settings','All settings','settings','Browse every option']];
  h+=`<section class="sr-sec" data-testid="search-jump" style="--d:${++i*45}ms"><div class="sr-sh"><h3>Jump to</h3></div><div class="sr-jump">${J.map(([k,l,ic,d])=>`<button type="button" data-act="search-go" data-go="${k}" data-testid="search-jump-${k}" class="sr-row sr-jb press"><span class="sr-art sr-ic"><i data-lucide="${ic}"></i></span><span class="sr-tx"><b class="clamp-1">${l}</b><small class="clamp-1">${d}</small></span></button>`).join('')}</div></section>`;
  return h+'</div>'; }
function srGamesHtml(){ const q=srQ(), L=srGameList(q); if(!L.length) return searchEmpty(q);
  return `<div class="sr-list pb-2" data-testid="search-games-results">${q?'':'<p class="sr-cap">All games</p>'}${L.map(g=>srGameRow(g,q)).join('')}</div>`; }
function srChipsHtml(){ const C=srQ()&&state.searchTab==='top'?state._srC:null;
  return SR_TABS.map(([id,l,ic])=>{ const on=state.searchTab===id, n=C&&id!=='top'?C[id]:0; return `<button type="button" role="tab" aria-selected="${on}" data-act="search-tab" data-tab="${id}" data-testid="search-toggle-${id}" class="sr-chip press${on?' is-on':''}"><i data-lucide="${ic}"></i>${l}${n?`<span class="sr-n">${n>99?'99+':n}</span>`:''}</button>`; }).join(''); }

/* keyboard nav */
const SR_KSEL='.sr-row:not(.is-skel),.sr-hit,[data-testid^="search-result-"],[data-testid^="search-setting-"]';
function srKMark(){ const r=document.getElementById('search-results'); if(!r) return; r.querySelectorAll(SR_KSEL).forEach((el,i)=>{ if(el.parentElement&&el.parentElement.closest('[data-kn]')) return; el.setAttribute('data-kn',''); if(!el.id) el.id='srk-'+i; }); }
function srKItems(){ return [...document.querySelectorAll('#search-results [data-kn]')].filter(e=>e.offsetParent); }
function srKSet(i,quiet){ const L=srKItems(), inp=document.getElementById('search-input'); L.forEach(e=>e.classList.remove('is-kn')); if(!L.length){ _srK=-1; return; }
  _srK=((i%L.length)+L.length)%L.length; const el=L[_srK]; el.classList.add('is-kn'); if(!quiet) el.scrollIntoView({block:'nearest'}); if(inp) inp.setAttribute('aria-activedescendant',el.id); }
function srKGo(el){ const go=el.matches('[data-act]')?el:(el.querySelector('[data-act^="search-play"]')||el.querySelector('[data-act]')); if(!go) return; const a=go.dataset.act;
  if(/^(sx-open|settings-search-go)$/.test(a)) pushRecent(state.searchQuery); go.click(); }
function srKeys(e){ const k=e.key;
  if(k==='ArrowDown'||k==='ArrowUp'){ const L=srKItems(); if(!L.length) return; e.preventDefault(); srKSet(_srK<0?(k==='ArrowDown'?0:L.length-1):_srK+(k==='ArrowDown'?1:-1)); }
  else if(k==='Enter'){ if(e.isComposing) return; const L=srKItems(), el=L[_srK]||(srQ()?L[0]:null); if(el){ e.preventDefault(); srKGo(el); } }
  else if(k==='Escape'){ e.preventDefault(); e.stopPropagation(); closeSearch(); } }

/* overlay */
renderSearchOverlay=function(){ const c=$("#searchlay"); const was=!!c.querySelector("[data-search-root]"); const res=searchResultsHtml();
  c.innerHTML=`<div data-search-root data-testid="search-overlay" class="sr2 fixed inset-0 z-[80] ${was?'':'search-enter'}">
    <div data-act="search-close" class="search-backdrop sr2-bd" data-testid="search-backdrop"></div>
    <div class="search-content sr2-panel" role="dialog" aria-modal="true" aria-label="Search">
      <div class="sr2-head"><p class="font-display sr2-title">Search</p><button type="button" data-act="search-close" aria-label="Close search" data-testid="search-close-button" class="sr2-x press"><i data-lucide="x"></i></button></div>
      <div id="search-results" class="sr2-results no-scrollbar" role="listbox" aria-label="Search results">${res}</div>
      <div id="search-dock" class="sr2-dock">
        <div id="search-recent-wrap" class="hidden"></div>
        <div class="sr2-field"><i data-lucide="search" class="sr2-fi"></i><input id="search-input" data-testid="search-overlay-input" type="text" role="combobox" aria-expanded="true" aria-controls="search-results" aria-autocomplete="list" value="${esc(state.searchQuery)}" placeholder="${esc(searchPlaceholder())}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" data-act="search-clear" aria-label="Clear" data-testid="search-clear-button" class="sr2-clr press ${state.searchQuery?'':'hidden'}"><i data-lucide="x"></i></button><button type="button" data-act="search-close" data-testid="search-esc-button" aria-label="Close search" class="sr2-esc press">esc</button></div>
        <div id="sr-chips" class="sr2-chips no-scrollbar" role="tablist" aria-label="Search filters" data-testid="search-filters">${srChipsHtml()}</div>
        <div id="search-filter-wrap" class="sr2-sub ${state.searchTab==='songs'?'':'hidden'}">${searchFilterBar()}</div>
      </div>
      <div class="sr2-foot" aria-hidden="true"><span><kbd>\u2191</kbd><kbd>\u2193</kbd>Move</span><span><kbd>\u21b5</kbd>Open</span><span><kbd>esc</kbd>Close</span><span class="ml-auto"><kbd>${/Mac|iPhone|iPad/.test(navigator.platform||'')?'\u2318':'Ctrl'}</kbd><kbd>K</kbd>Search anywhere</span></div>
    </div></div>`;
  icons(); srKMark(); _srK=-1;
  const inp=$("#search-input"); if(inp){ inp.focus(); const v=inp.value; inp.value=''; inp.value=v; inp.addEventListener('keydown',srKeys); }
  attachSearchViewport(); syncScrollLock(); };
const _srh9zs=searchResultsHtml; searchResultsHtml=function(){ if(state.searchTab==='top') return srTopHtml(); if(state.searchTab==='games') return srGamesHtml(); return _srh9zs.apply(this,arguments); };
const _sph9zs=searchPlaceholder; searchPlaceholder=function(){ return state.searchTab==='top'?'Search songs, artists, lyrics, games\u2026':state.searchTab==='games'?'Search games\u2026':_sph9zs.apply(this,arguments); };
searchRecentBar=function(){ return ''; };
updateSearchTabs=function(){ const ch=document.getElementById('sr-chips'); if(ch){ ch.innerHTML=srChipsHtml(); const a=ch.querySelector('.is-on'); if(a) a.scrollIntoView({block:'nearest',inline:'nearest'}); }
  const fw=$("#search-filter-wrap"); if(fw){ fw.innerHTML=searchFilterBar(); fw.classList.toggle('hidden',state.searchTab!=='songs'); } const inp=$("#search-input"); if(inp) inp.placeholder=searchPlaceholder(); icons(); };
const _rsr9zs=refreshSearchResults; refreshSearchResults=function(){ const r=_rsr9zs.apply(this,arguments); const ch=document.getElementById('sr-chips'); if(ch){ const sl=ch.scrollLeft; ch.innerHTML=srChipsHtml(); ch.scrollLeft=sl; }
  srKMark(); _srK=-1; const i=document.getElementById('search-input'); if(i) i.removeAttribute('aria-activedescendant'); icons(); return r; };
const _cs9zs=closeSearch; closeSearch=function(){ const r=_cs9zs.apply(this,arguments); state.searchTab='top'; state.searchFilter='all'; clearInterval(_srUP); return r; };

document.addEventListener('mousemove',e=>{ const el=e.target&&e.target.closest&&e.target.closest('#search-results [data-kn]'); if(!el||el.classList.contains('is-kn')) return; const L=srKItems(), i=L.indexOf(el); if(i>=0) srKSet(i,true); },{passive:true});
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t||!state.searchOpen) return; const a=t.dataset.act;
  if(a==='search-open-game'){ const k=t.dataset.key, b=t.dataset.built; pushRecent(state.searchQuery); closeSearch(true); if(b){ state.gameTab=b; navigate('game'); } else openGameInfo(k); }
  else if(a==='search-recent-del'){ e.stopPropagation(); const q=t.dataset.q; state.recentSearches=(state.recentSearches||[]).filter(x=>x!==q); LS.set('treesh_recent_searches',state.recentSearches); refreshSearchResults(); const inp=document.getElementById('search-input'); if(inp&&matchMedia('(min-width:768px)').matches) inp.focus(); }
  else if(a==='search-go'){ const g=t.dataset.go;
    if(g==='arcade'){ closeSearch(true); state.gameTab='games'; navigate('game'); setTimeout(()=>{ const el=document.querySelector('[data-testid="games-arcade"]'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); },380); }
    else if(g==='lyt'){ const it=SETTINGS_INDEX.find(x=>x.id==='lyt'); if(it) it.go(); }
    else { state.searchTab=g; updateSearchTabs(); refreshSearchResults(); } }
  else if(a==='search-tab'||a==='search-recent-chip'){ setTimeout(()=>{ const r=document.getElementById('search-results'); if(r) r.scrollTop=0; const inp=document.getElementById('search-input'); if(inp&&matchMedia('(min-width:768px)').matches) inp.focus(); },0); } });
document.addEventListener('keydown',e=>{ const k=e.key; if(!((e.metaKey||e.ctrlKey)&&(k==='k'||k==='K'))&&!(k==='/'&&!e.metaKey&&!e.ctrlKey&&!e.altKey)) return;
  const t=e.target, typing=t&&(t.isContentEditable||/^(input|textarea|select)$/i.test(t.tagName||''));
  if(k==='/'&&typing) return; if(state.searchOpen){ e.preventDefault(); const i=document.getElementById('search-input'); if(i){ i.focus(); i.select(); } return; }
  if(document.querySelector('#modal > *, #modal2 > *')||(state.gameFrame&&!state.gameFrame.min)) return; e.preventDefault(); openSearch(); });

/* What's New */
(function(){ const D='October 8, 2026', add=(k,sub,items,keep)=>{ const W=WHATS_NEW[k]; if(!W) return; W.v=(W.v||0)+1; W.date=D; if(sub) W.sub=sub; W.items=items.concat((W.items||[]).slice(0,keep)); };
  add('game','Don\u2019t Get Caught is live.',[
    {icon:'ghost',title:'Don\u2019t Get Caught is live',desc:'A horror mini-game gauntlet. Mr. Hush only kills what he sees, and The Hollow Bride hunts by sound. Freeze, stay quiet and survive. Ages 13+.'},
    {icon:'sliders-horizontal',title:'Arcade filters & search',desc:'Sort the Arcade by Recently updated, Newly added, Coming soon, age rating, Most played by you or A\u2013Z, or type a game\u2019s name in the search box.'},
    {icon:'bell',title:'Notify me',desc:'Coming-soon games get a Notify me button, and Treesh tells you when they go live.'}],3);
  add('player','',[
    {icon:'swatch-book',title:'Lyric themes',desc:'Tap the swatch next to the lyrics: Text Messages, Karaoke Neon, Typewriter, Notebook, Retro Terminal, Comic Bubbles or Polaroid Story. Pin a theme to one song if you like.'},
    {icon:'message-circle',title:'Lyrics as a group chat',desc:'Text Messages turns each line into a text bubble from the artist, with typing dots and read receipts. They\u2019re lyrics, not real messages.'},
    {icon:'palette',title:'Singer colors are optional',desc:'Lines on songs with more than one artist now use one color by default. Turn on Color lines by singer in the Lyric theme sheet.'},
    {icon:'image',title:'Themed lyric cards',desc:'Lyric cards can use any lyric theme as their style.'}],3);
  add('library','',[{icon:'search',title:'Smarter search',desc:'One search for songs, artists, lyrics, games, users and settings, with a top result, See all, recent and trending searches. Press Ctrl+K or / on a keyboard.'}],4); })();
