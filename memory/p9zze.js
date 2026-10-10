/* ---------- P9zze: playlist songs sort & filters. The sort is saved on each playlist (syncs with the account), filters reset when you leave.
   Play and Shuffle use exactly the songs you see, in that order ---------- */
SB_LOCAL.push('treesh_durs');
const PLS_SORTS=[['custom','Custom order','grip-vertical'],['added','Recently added','clock'],['title','Title A\u2013Z','arrow-down-a-z'],['artist','Artist','mic-vocal'],['played','Most played','flame'],['release','Newest release','calendar'],['duration','Duration','timer']];
const PLS_REV={added:'Oldest added',title:'Title Z\u2013A',artist:'Artist Z\u2013A',played:'Least played',release:'Oldest release',duration:'Longest first'};
const PLS_LBL=Object.fromEntries(PLS_SORTS.map(x=>[x[0],x[1]]));
let _plsF=null, _plsPop=null;
const plsCur=()=>state.view==='playlist'?plById(state.param):null;
const plsT=s=>String(s.title||'');
const plsCmpS=(a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'});
const plsAll=pl=>vis(((pl&&pl.songIds)||[]).map(id=>SONG_BY_ID[id]).filter(Boolean));
const plsHasLy=s=>(s.lyrics||[]).some(l=>l.text&&l.text.trim());
const plsArtists=s=>[...new Set([s.artist,...String(featuredNames(s)||'').split(WC_SPLIT)].map(x=>String(x||'').trim()).filter(Boolean))];
const plsGenres=s=>s.genre?[String(s.genre).trim()]:[];
const plsMoods=s=>String(s.mood||'').split(',').map(x=>x.trim()).filter(Boolean);
const plsLabel=pl=>pl.sort&&pl.sort!=='custom'&&pl.sortRev?PLS_REV[pl.sort]:PLS_LBL[pl.sort||'custom']||'Custom order';

/* when each song joined the playlist (older playlists: their order is the order songs were added) */
function plsAdded(pl){ if(!pl.added||typeof pl.added!=='object'){ const t0=+pl.createdAt||0, a={}; (pl.songIds||[]).forEach((id,i)=>{ a[id]=t0+i; }); pl.added=a; } return pl.added; }
(state.playlists||[]).forEach(plsAdded);
const _savePl9zze=savePl; savePl=function(){ const now=Date.now();
  (state.playlists||[]).forEach(pl=>{ const a=plsAdded(pl), ids=pl.songIds||[], have=new Set(ids); ids.forEach((id,i)=>{ if(a[id]==null) a[id]=now+i; }); Object.keys(a).forEach(id=>{ if(!have.has(id)) delete a[id]; }); });
  return _savePl9zze.apply(this,arguments); };

/* song lengths: remembered once a song plays, measured on demand for the Duration sort */
const _plsDurs=(()=>{ try{ return JSON.parse(localStorage.getItem('treesh_durs')||'{}')||{}; }catch(e){ return {}; } })();
const plsDur=s=>(+s.duration)||_plsDurs[s.id]||0;
let _plsDurT=0, _plsPT=0; const _plsProbing=new Set();
function plsDurSave(){ clearTimeout(_plsDurT); _plsDurT=setTimeout(()=>{ try{ localStorage.setItem('treesh_durs',JSON.stringify(_plsDurs)); }catch(e){} },800); }
audio.addEventListener('loadedmetadata',()=>{ const s=curSong(), d=audio.duration; if(s&&!s._user&&isFinite(d)&&d>0&&_plsDurs[s.id]!==Math.round(d)){ _plsDurs[s.id]=Math.round(d); plsDurSave(); } });
function plsMeasure(s){ return new Promise(res=>{ const a=new Audio(); let done=false, t=0; const fin=d=>{ if(done) return; done=true; clearTimeout(t); a.removeAttribute('src'); try{ a.load(); }catch(e){} res(d); };
  t=setTimeout(()=>fin(0),10000); a.preload='metadata'; a.muted=true; a.addEventListener('loadedmetadata',()=>fin(isFinite(a.duration)?a.duration:0)); a.addEventListener('error',()=>fin(0)); a.src=s.audioUrl; }); }
function plsProbe(songs){ const need=songs.filter(s=>!plsDur(s)&&s.audioUrl&&!_plsProbing.has(s.id)); if(!need.length) return; need.forEach(s=>_plsProbing.add(s.id)); let i=0;
  const next=()=>{ if(i>=need.length) return; const s=need[i++]; plsMeasure(s).then(d=>{ if(d){ _plsDurs[s.id]=Math.round(d); plsDurSave(); } _plsProbing.delete(s.id); s._plsTried=true; clearTimeout(_plsPT); _plsPT=setTimeout(()=>{ const pl=plsCur(); if(pl&&pl.sort==='duration') plsPaint(); },250); next(); }); };
  for(let k=0;k<3;k++) next(); }

function plsSorted(pl,songs){ const k=pl.sort||'custom'; if(k==='custom') return songs.slice();
  const idx=new Map((pl.songIds||[]).map((id,i)=>[id,i])), A=plsAdded(pl), byT=(a,b)=>plsCmpS(plsT(a),plsT(b));
  const C={added:(a,b)=>((A[b.id]||0)-(A[a.id]||0))||(idx.get(b.id)-idx.get(a.id)),title:byT,artist:(a,b)=>plsCmpS(a.artist||'',b.artist||'')||byT(a,b),
    played:(a,b)=>(playCount(b.id)-playCount(a.id))||byT(a,b),release:(a,b)=>(dateMs(b.creationDate)-dateMs(a.creationDate))||byT(a,b),duration:(a,b)=>(plsDur(a)-plsDur(b))||byT(a,b)}[k]||byT;
  const known=k==='release'?s=>dateMs(s.creationDate)>0:k==='duration'?s=>plsDur(s)>0:()=>true;
  const K=songs.filter(known).sort(C), U=songs.filter(s=>!known(s)).sort(byT); if(pl.sortRev) K.reverse(); return K.concat(U); }
function plsFil(pl){ if(!_plsF||_plsF.id!==pl.id) _plsF={id:pl.id,q:'',artist:'',tag:'',lyrics:false,clean:false,unplayed:false}; return _plsF; }
const plsOn=F=>!!(F&&(F.q.trim()||F.artist||F.tag||F.lyrics||F.clean||F.unplayed));
function plsMatch(s,F){ if(F.lyrics&&!plsHasLy(s)) return false; if(F.clean&&s.explicit) return false; if(F.unplayed&&playCount(s.id)>0) return false;
  if(F.artist&&!plsArtists(s).some(a=>a.toLowerCase()===F.artist.toLowerCase())) return false;
  if(F.tag){ const v=F.tag.slice(2).toLowerCase(); if(!(F.tag[0]==='g'?plsGenres(s):plsMoods(s)).some(x=>x.toLowerCase()===v)) return false; }
  const q=F.q.trim().toLowerCase(); return !q||[s.title,s.album,s.genre,s.mood,...plsArtists(s)].some(v=>String(v||'').toLowerCase().includes(q)); }
function plsView(pl){ const all=plsAll(pl), F=_plsF&&_plsF.id===pl.id&&plsOn(_plsF)?_plsF:null; return plsSorted(pl,F?all.filter(s=>plsMatch(s,F)):all); }
const _rcl9zze=resolveCtxList; resolveCtxList=function(tok){ if(tok&&tok.indexOf('pl:')===0){ const pl=plById(tok.slice(3)); if(pl) return plsView(pl); } return _rcl9zze.apply(this,arguments); };
plShuffle=function(id){ const pl=plById(id); if(!pl) return; const songs=plsView(pl); if(!songs.length){ toast(plsAll(pl).length?'No songs match your filters':'Playlist is empty'); return; }
  state.shuffle=true; try{ savePlayerPrefs(); }catch(e){} playSong(songs[Math.floor(Math.random()*songs.length)],songs); toast('Shuffling '+pl.name,songs.length<plsAll(pl).length?songs.length+' of '+plsAll(pl).length+' songs':''); };
/* dragging only reorders the songs on screen; songs hidden here keep their place */
REORDER_CBS.pl=order=>{ const pl=plById(state.param); if(!pl) return; const ids=pl.songIds||[], shown=new Set(order), it=order.filter(x=>ids.includes(x))[Symbol.iterator]();
  pl.songIds=ids.map(id=>shown.has(id)?(it.next().value||id):id); savePl(); toast('Playlist reordered'); refreshDynamic(); };

/* ----- page ----- */
const plsBtn=(act,tid,ic,label,cls,extra)=>`<button type="button" data-act="${act}" data-testid="${tid}" class="${cls} press"${extra||''}><i data-lucide="${ic}"></i>${label}</button>`;
function plsSortHtml(pl){ const k=pl.sort||'custom';
  return `<button type="button" data-act="pls-pop" data-val="sort" data-testid="playlist-sort-btn" aria-haspopup="menu" aria-expanded="false" class="pls-sortbtn press${k!=='custom'?' on':''}"><i data-lucide="arrow-up-down"></i><span class="pls-sl" data-testid="playlist-sort-label">${esc(plsLabel(pl))}</span><i data-lucide="chevron-down" class="pls-cv"></i></button>${k!=='custom'?`<button type="button" data-act="pls-rev" data-testid="playlist-sort-reverse" aria-label="Reverse order" title="Reverse order" class="pls-ic press${pl.sortRev?' on':''}"><i data-lucide="arrow-down-up"></i></button>`:''}`; }
function plsChip(act,val,label,on,tid,o){ o=o||{}; return `<button type="button" data-act="${act}" data-val="${esc(val)}" data-testid="${tid}" aria-pressed="${on}"${o.pop?' aria-haspopup="menu" aria-expanded="false"':''} class="pls-chip press${on?' on':''}">${o.ic?`<i data-lucide="${o.ic}"></i>`:''}<span class="clamp-1">${esc(label)}</span>${o.pop?'<i data-lucide="chevron-down" class="pls-cv"></i>':''}</button>`; }
function plsChipsHtml(pl,all){ const F=plsFil(pl), arts=new Set(all.flatMap(plsArtists).map(a=>a.toLowerCase())), tags=all.some(s=>plsGenres(s).length||plsMoods(s).length);
  const tag=F.tag?F.tag.slice(2):'';
  return (arts.size>1||F.artist?plsChip('pls-pop','artist',F.artist||'Artist',!!F.artist,'playlist-filter-artist',{ic:'mic-vocal',pop:1}):'')
    +(tags||F.tag?plsChip('pls-pop','tag',tag||'Genre & mood',!!F.tag,'playlist-filter-tag',{ic:'tags',pop:1}):'')
    +(all.some(plsHasLy)||F.lyrics?plsChip('pls-tog','lyrics','Has lyrics',F.lyrics,'playlist-filter-lyrics',{ic:'quote'}):'')
    +(explicitOK()&&all.some(s=>s.explicit)||F.clean?plsChip('pls-tog','clean','Hide explicit',F.clean,'playlist-filter-clean',{ic:'shield-check'}):'')
    +plsChip('pls-tog','unplayed','Unplayed',F.unplayed,'playlist-filter-unplayed',{ic:'circle-dashed'})
    +(plsOn(F)?`<button type="button" data-act="pls-clear" data-testid="playlist-filters-clear" class="pls-clr press"><i data-lucide="x"></i>Clear</button>`:''); }
function plsMeta(pl,s){ const k=pl.sort||'custom'; let t='';
  if(k==='added'){ const a=plsAdded(pl)[s.id]; t=a>1e12?swAgo(a):''; }
  else if(k==='played'){ const n=playCount(s.id); t=n?n+(n===1?' play':' plays'):'Unplayed'; }
  else if(k==='release'){ const d=dateMs(s.creationDate); t=d?new Date(d).toLocaleDateString(undefined,{month:'short',year:'numeric'}):'No date'; }
  else if(k==='duration'){ const d=plsDur(s); t=d?fmt(d):(_plsProbing.has(s.id)?'\u2026':'\u2013:\u2013\u2013'); }
  return t?`<span class="pls-meta" data-testid="playlist-row-meta-${esc(s.id)}">${esc(t)}</span>`:''; }
function plsBodyHtml(pl,all){ const F=plsFil(pl), on=plsOn(F), k=pl.sort||'custom', L=plsView(pl), drag=k==='custom'&&!on;
  state.contextList=L; if(k==='duration') setTimeout(()=>plsProbe(all),0);
  const note=k!=='custom'?`<div class="pls-note" data-testid="playlist-sort-note"><i data-lucide="arrow-up-down"></i><p>Sorted by <b>${esc(plsLabel(pl))}</b>${k==='duration'&&all.some(s=>!plsDur(s)&&!s._plsTried)?'<small data-testid="playlist-measuring">Measuring song lengths\u2026</small>':''}</p><span class="pls-note-acts">${plsBtn('pls-custom','playlist-sort-custom','undo-2','Back to custom order','pls-mini')}${plsBtn('pls-save','playlist-sort-save','save','Save this order','pls-mini is-primary')}</span></div>`:'';
  const cnt=on?`<p class="pls-count" data-testid="playlist-filter-count">Showing <b>${L.length}</b> of ${all.length} song${all.length===1?'':'s'}${k==='custom'?' \u00b7 clear filters to drag songs around':''}</p>`:'';
  if(!L.length) return note+cnt+`<div class="pls-empty" data-testid="playlist-filter-empty"><i data-lucide="search-x"></i><p class="font-semibold">No songs match</p><p class="text-sm text-white/50">Try another search or filter.</p>${plsBtn('pls-clear','playlist-filter-empty-clear','x','Clear filters','pls-mini')}</div>`;
  return note+cnt+`<div class="space-y-1.5" data-plid="${pl.id}"${drag?' data-reorder="pl"':''} data-testid="playlist-song-list">${L.map((s,i)=>`<div data-rid="${s.id}" class="pls-row flex items-center gap-1.5">${drag?`<span data-rhandle data-testid="pl-drag-${s.id}" aria-label="Drag to reorder" class="grid h-9 w-6 shrink-0 place-items-center rounded-lg text-white/30 hover:text-white/70"><i data-lucide="grip-vertical" style="width:16px;height:16px"></i></span>`:''}<div class="min-w-0 flex-1">${songRow(s,i,true,null,{ctx:'pl:'+pl.id})}</div>${plsMeta(pl,s)}</div>`).join('')}</div>`; }
const _vpd9zze=viewPlaylistDetail; viewPlaylistDetail=function(){ const h=_vpd9zze.apply(this,arguments), pl=plById(state.param), i=h.indexOf('<div class="flex items-center gap-2.5" data-testid="playlist-actions">'); if(!pl||i<0) return h;
  const all=plsAll(pl), F=plsFil(pl), id=esc(pl.id);
  const bar=`<div class="pls-bar" data-testid="playlist-toolbar"><div class="pls-acts" data-testid="playlist-actions"><button data-act="playall-context" data-ctx="pl:${id}" data-testid="playlist-play" class="press inline-flex items-center gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 glow-purple"><i data-lucide="play" class="fill-current" style="width:16px;height:16px"></i> Play</button><button data-act="pl-shuffle" data-id="${id}" data-testid="playlist-shuffle" class="press inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"><i data-lucide="shuffle" style="width:16px;height:16px"></i> Shuffle</button><button data-act="pl-add-songs" data-id="${id}" data-testid="playlist-add-songs" aria-label="Add songs" title="Add songs" class="press ml-auto grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10"><i data-lucide="list-plus" style="width:17px;height:17px"></i></button></div>
    <div class="pls-row2"><label class="pls-search"><i data-lucide="search"></i><input id="pls-q" type="search" value="${esc(F.q)}" placeholder="${window.innerWidth<640?'Search songs':'Search this playlist'}" autocomplete="off" enterkeyhint="search" aria-label="Search this playlist" data-testid="playlist-search"><button type="button" data-act="pls-q-clear" data-testid="playlist-search-clear" aria-label="Clear search" class="pls-qx press"${F.q?'':' hidden'}><i data-lucide="x"></i></button></label><div id="pls-sort" class="pls-sortwrap">${plsSortHtml(pl)}</div></div>
    <div id="pls-chips" class="pls-chips no-scrollbar" data-testid="playlist-filters">${plsChipsHtml(pl,all)}</div></div>`;
  return h.slice(0,i)+bar+`<div id="pls-body" data-testid="playlist-songs-area">${plsBodyHtml(pl,all)}</div></div>`; };
function plsPaint(){ const pl=plsCur(), body=document.getElementById('pls-body'); if(!pl||!body) return; const all=plsAll(pl);
  body.innerHTML=plsBodyHtml(pl,all); const c=document.getElementById('pls-chips'); if(c) c.innerHTML=plsChipsHtml(pl,all); const so=document.getElementById('pls-sort'); if(so) so.innerHTML=plsSortHtml(pl);
  const qx=document.querySelector('[data-act="pls-q-clear"]'); if(qx) qx.hidden=!plsFil(pl).q; const rl=body.querySelector('[data-reorder]'); if(rl) wireReorder(rl); icons(); }

/* ----- menus: anchored on computers, a sheet on phones ----- */
function plsPopHtml(kind,pl){ const F=plsFil(pl), all=plsAll(pl), it=(act,val,label,on,tid,ic,n)=>`<button type="button" role="menuitemradio" aria-checked="${on}" data-act="${act}" data-val="${esc(val)}" data-testid="${tid}" class="pls-opt press${on?' on':''}">${ic?`<i data-lucide="${ic}"></i>`:'<span class="pls-dot"></span>'}<span class="min-w-0 flex-1 clamp-1">${esc(label)}</span>${n!=null?`<small>${n}</small>`:''}<i data-lucide="check" class="pls-ck"></i></button>`;
  const head=t=>`<div class="pls-pop-h"><span class="pls-grab" aria-hidden="true"></span><p>${t}</p></div>`, count=list=>{ const m=new Map(); list.forEach(v=>{ const k=v.toLowerCase(); const x=m.get(k)||{v,n:0}; x.n++; m.set(k,x); }); return [...m.values()].sort((a,b)=>b.n-a.n||plsCmpS(a.v,b.v)); };
  if(kind==='sort') return head('Sort songs')+PLS_SORTS.map(([k,l,ic])=>it('pls-sort-set',k,l,(pl.sort||'custom')===k,'playlist-sort-opt-'+k,ic)).join('');
  if(kind==='artist') return head('Artist')+it('pls-artist','','Any artist',!F.artist,'playlist-artist-opt-any','users')+count(all.flatMap(plsArtists)).map((x,i)=>it('pls-artist',x.v,x.v,F.artist.toLowerCase()===x.v.toLowerCase(),'playlist-artist-opt-'+i,'',x.n)).join('');
  const G=count(all.flatMap(plsGenres)), M=count(all.flatMap(plsMoods)), sec=(t,L,p)=>L.length?`<p class="pls-pop-s">${t}</p>`+L.map((x,i)=>it('pls-tag',p+':'+x.v,x.v,F.tag.toLowerCase()===(p+':'+x.v).toLowerCase(),'playlist-tag-opt-'+p+'-'+i,'',x.n)).join(''):'';
  return head('Genre &amp; mood')+it('pls-tag','','Any genre or mood',!F.tag,'playlist-tag-opt-any','tags')+sec('Genre',G,'g')+sec('Mood',M,'m'); }
function plsPopClose(){ const w=document.getElementById('pls-pop'); if(w) w.remove(); if(_plsPop&&_plsPop.btn) _plsPop.btn.setAttribute('aria-expanded','false'); _plsPop=null; }
function plsPopOpen(kind,btn){ const pl=plsCur(); plsPopClose(); if(!pl) return; const mob=window.innerWidth<640, w=document.createElement('div');
  w.id='pls-pop'; w.className='pls-pop-wrap'+(mob?' is-sheet':''); w.innerHTML=`<div class="pls-pop soft-scroll" role="menu" data-testid="playlist-pop-${kind}">${plsPopHtml(kind,pl)}</div>`; document.body.appendChild(w);
  const p=w.firstElementChild; if(!mob){ const r=btn.getBoundingClientRect(), pw=Math.min(280,window.innerWidth-24); p.style.width=pw+'px'; p.style.top=Math.min(r.bottom+8,window.innerHeight-160)+'px'; p.style.left=Math.max(12,Math.min(r.left,window.innerWidth-pw-12))+'px'; p.style.maxHeight=Math.max(160,window.innerHeight-r.bottom-24)+'px'; }
  btn.setAttribute('aria-expanded','true'); _plsPop={kind,btn}; icons(); const on=p.querySelector('.pls-opt.on'); if(on&&on.scrollIntoView) try{ on.scrollIntoView({block:'nearest'}); }catch(e){} }
const _rv9zze=renderView; renderView=function(){ plsPopClose(); if(state.view!=='playlist'||(_plsF&&_plsF.id!==state.param)) _plsF=null; return _rv9zze.apply(this,arguments); };
window.addEventListener('scroll',()=>{ if(_plsPop&&window.innerWidth>=640) plsPopClose(); },{passive:true});
window.addEventListener('resize',()=>{ if(_plsPop) plsPopClose(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&_plsPop){ e.preventDefault(); e.stopImmediatePropagation(); const b=_plsPop.btn; plsPopClose(); try{ b.focus(); }catch(_){} } },true);

document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act]'), w=document.getElementById('pls-pop');
  if(w&&!(t&&w.contains(t))&&!(e.target.closest&&e.target.closest('.pls-pop'))){ const same=t&&_plsPop&&t===_plsPop.btn; plsPopClose(); if(same) return; }
  if(!t) return; const a=t.dataset.act, v=t.dataset.val, pl=plsCur(); if(!pl||a.indexOf('pls-')!==0) return; const F=plsFil(pl);
  switch(a){
    case 'pls-pop': plsPopOpen(v,t); break;
    case 'pls-sort-set': pl.sort=v==='custom'?'custom':v; delete pl.sortRev; savePl(); plsPopClose(); plsPaint(); break;
    case 'pls-rev': pl.sortRev=!pl.sortRev; savePl(); plsPaint(); break;
    case 'pls-artist': F.artist=v||''; plsPopClose(); plsPaint(); break;
    case 'pls-tag': F.tag=v||''; plsPopClose(); plsPaint(); break;
    case 'pls-tog': if(v in F) F[v]=!F[v]; plsPaint(); break;
    case 'pls-clear': Object.assign(F,{q:'',artist:'',tag:'',lyrics:false,clean:false,unplayed:false}); { const q=document.getElementById('pls-q'); if(q) q.value=''; } plsPaint(); break;
    case 'pls-q-clear': { F.q=''; const q=document.getElementById('pls-q'); if(q){ q.value=''; try{ q.focus(); }catch(_){} } plsPaint(); break; }
    case 'pls-custom': pl.sort='custom'; delete pl.sortRev; savePl(); plsPaint(); break;
    case 'pls-save': { const L=plsSorted(pl,plsAll(pl)).map(s=>s.id), on=new Set(L); pl.songIds=L.concat((pl.songIds||[]).filter(id=>!on.has(id))); pl.sort='custom'; delete pl.sortRev; savePl(); toast('Saved as your custom order',pl.name); renderView(); renderSidebarLibrary(); break; }
  } });
let _plsQT=0;
/* Play means in order: it turns shuffle off before the song starts */
document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('[data-testid="playlist-play"]')&&state.shuffle){ state.shuffle=false; try{ savePlayerPrefs(); }catch(_){} } },true);
document.addEventListener('input',e=>{ if(!e.target||e.target.id!=='pls-q') return; const pl=plsCur(); if(!pl) return; plsFil(pl).q=e.target.value; clearTimeout(_plsQT); _plsQT=setTimeout(plsPaint,120); });
