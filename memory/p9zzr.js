/* ---------- P9zzr: M.A.D. for verified Icons, edit buttons, Play the vibe ---------- */
function madIconId(){ const m=stMe(); return m&&m.verified&&m.verified_icon?String(m.verified_icon):''; }
function madCan(){ return stRole()==='admin'||!!madIconId(); }
function madCanArtist(id){ return !!id&&(stRole()==='admin'||madIconId()===String(id)); }
function madCanSong(s){ if(!s||s._user) return false; if(stRole()==='admin') return true; const me=madIconId(); return !!me&&(s.artistIds||[]).some(x=>String(x)===me); }
const MAD_GO=`function(t){ var nk=function(x){ return String(x||'').toLowerCase().replace(/[^a-z0-9]/g,''); };
  if(t.type==='song'){ var L=state.catalog.songs, s=L.find(function(x){ return nk(x.title)===nk(t.title)&&nk(x.artist)===nk(t.artist); })||L.find(function(x){ return nk(x.title)===nk(t.title); }); if(!s) return 'missing'; if(t.what==='lyrics'&&typeof openLyrics==='function') openLyrics(s); else startEdit(s); return 'ok'; }
  if(t.type==='artist'){ var a=(state.roster||[]).find(function(x){ return String(x.id)===String(t.id); }); if(!a) return 'missing'; openArtistDrawer(a); return 'ok'; } return 'missing'; }`;
function madBridge(tg){ let n=0; const name=tg.type==='song'?'\u201c'+tg.title+'\u201d':'your Icon page';
  const fail=()=>toast('Find '+name+' in M.A.D.','It opens on the home screen. Sign in there if it asks.');
  const tick=()=>{ if(!state.gameFrame||state.gameFrame.key!=='mad') return; const f=document.getElementById('gf-frame'); let w=null;
    try{ w=f&&f.contentWindow; if(!w||!w.document||!w.document.body) throw 0; }catch(e){ if(++n<4){ setTimeout(tick,700); return; } fail(); return; }
    let ready=false; try{ ready=!!w.eval("typeof state!=='undefined'&&!!state.catalog&&state.catalog.songs.length>0&&(state.roster||[]).length>0"); }catch(e){}
    if(!ready){ if(++n<60) setTimeout(tick,500); else fail(); return; }
    let r=''; try{ r=w.eval('('+MAD_GO+')('+JSON.stringify(tg)+')'); }catch(e){ r=''; } if(r!=='ok') fail(); };
  setTimeout(tick,800); }
madOpen=function(tg){ if(!madCan()){ toast('M.A.D. is for Treesh admins and verified Icons'); return; } state.gfMusic=false;
  state.gameFrame={key:'mad',name:'M.A.D.',url:MAD_URL,min:false,a:'#38bdf8',b:'#1e3a8a',mono:'M',label:stRole()==='admin'?'Treesh admin tools':'Your Icon tools'}; renderGameFrame(); syncScrollLock(); if(tg&&tg.type) madBridge(tg); };
function madEditBtn(act,id,tid,cls,label){ return `<button type="button" data-act="${act}" data-id="${esc(id)}" data-testid="${tid}" title="Edit in M.A.D." class="${cls} mad-edit press"><i data-lucide="pencil"></i>${label||'Edit'}</button>`; }

/* settings: a verified Icon gets their own M.A.D. card */
const _sac9zzr=sbAccountCardHtml; sbAccountCardHtml=function(tab){ const h=_sac9zzr.apply(this,arguments); const ic=madIconId(), a=ic&&ARTIST_BY_ID[ic]; if(!h||!ic||stRole()==='admin') return h;
  return h+`<section class="sba-card mad-card" data-testid="icon-mad-card"><div class="sba-head"><span class="sba-ic is-mad"><i data-lucide="wrench"></i></span><div class="min-w-0 flex-1"><h2 class="sba-t">Your Icon page</h2><p class="sba-s">You\u2019re verified as <b>${esc(a?a.name:'a Treesh Icon')}</b>. Edit your page, songs and lyrics in M.A.D. Treesh admins review changes before they go live.</p></div></div><div class="sba-acts"><button type="button" data-act="mad-open" data-testid="icon-open-mad" class="sba-btn is-primary press"><i data-lucide="wrench"></i>Open M.A.D.</button>${a?`<button type="button" data-act="artist-open" data-id="${esc(a.id)}" data-testid="icon-view-page" class="sba-btn press"><i data-lucide="badge-check"></i>View my page</button>`:''}</div></section>`; };

/* edit buttons: Icon page, song page, song menu, people's profiles */
const _vad9zzr=viewArtistDetail; viewArtistDetail=function(){ const h=_vad9zzr.apply(this,arguments); const a=ARTIST_BY_ID[state.param]; if(!a||!madCanArtist(a.id)) return h;
  return h.replace(`<button data-act="ar-share" data-id="${a.id}"`,madEditBtn('mad-edit-artist',a.id,'artist-edit-mad','ar-btn')+`<button data-act="ar-share" data-id="${a.id}"`); };
const _sgh9zzr=sgpHero; sgpHero=function(s){ const h=_sgh9zzr.apply(this,arguments); if(!madCanSong(s)) return h;
  return h.replace(`<button type="button" data-act="sgp-share" data-id="${s.id}"`,madEditBtn('mad-edit-song',s.id,'song-page-edit','ar-btn')+`<button type="button" data-act="sgp-share" data-id="${s.id}"`); };
const _osm9zzr=openSongMenu; openSongMenu=function(id){ const r=_osm9zzr.apply(this,arguments); const s=SONG_BY_ID[id], l=document.querySelector('#modal .pm-list');
  if(l&&madCanSong(s)&&!l.querySelector('[data-act="mad-edit-song"]')){ const after=l.querySelector('[data-act="song-open"]'); const html=pmItem({act:'mad-edit-song',ic:'pencil',label:'Edit in M.A.D.',desc:stRole()==='admin'?'Details, cover, audio and lyrics':'Your song, reviewed by Treesh admins',attrs:`data-id="${id}"`,tid:'song-menu-edit-mad',chev:true});
    if(after) after.insertAdjacentHTML('afterend',html); else l.insertAdjacentHTML('afterbegin',html); icons(); } return r; };
const _sxR9zzr=sxRender; sxRender=function(){ const r=_sxR9zzr.apply(this,arguments); try{ const d=_sxV&&_sxV.d, top=document.querySelector('#sx-root .sx-top-r');
    if(top&&d&&d.mod&&d.relation!=='self'&&!top.querySelector('[data-act="mod-edit"]')){ const g=top.querySelector('[data-act="mod-open"]'); const b=`<button type="button" data-act="mod-edit" aria-label="Edit profile" title="Edit profile" data-testid="user-profile-edit" class="sx-x press is-mod"><i data-lucide="pencil"></i></button>`; if(g) g.insertAdjacentHTML('beforebegin',b); else top.insertAdjacentHTML('afterbegin',b); icons(); } }catch(e){} return r; };

/* Play the vibe: the Similar vibe list, starting with this song */
const _vsp9zzr=viewSongPage; viewSongPage=function(){ const h=_vsp9zzr.apply(this,arguments); const s=SONG_BY_ID[state.param]; if(!s) return h; const i=h.indexOf('data-testid="similar-songs-row"'); if(i<0) return h; const j=h.indexOf('</div><div class="sgp-scroll',i); if(j<0) return h;
  return h.slice(0,j)+`<button type="button" data-act="sgp-play-vibe" data-id="${s.id}" data-testid="song-page-play-vibe" class="sgp-vibe press"><i data-lucide="audio-lines"></i>Play the vibe</button>`+h.slice(j); };

document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act, id=t.dataset.id;
  if(a==='mad-edit-song'){ const s=SONG_BY_ID[id]; if(!s) return; closeModal(); madOpen({type:'song',title:s.title,artist:s.artist}); return; }
  if(a==='mad-edit-artist'){ madOpen({type:'artist',id}); return; }
  if(a==='mod-edit'){ modOpen(); if(_mod){ _mod.tab='profile'; modPaint(); } return; }
  if(a==='sgp-play-vibe'){ const s=SONG_BY_ID[id]; if(!s) return; const list=[s,...sgpSimilar(s).filter(x=>x.id!==s.id)]; state.shuffle=false; playSong(s,list); toast('Playing the vibe',list.length+' songs \u00b7 starting with '+s.title); return; } });
