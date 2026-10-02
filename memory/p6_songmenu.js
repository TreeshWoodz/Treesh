function openSongMenu(id){ const s=SONG_BY_ID[id]; if(!s) return; const fav=isFav(id), dis=isDisliked(id), hasLy=(s.lyrics||[]).some(l=>l.text&&l.text.trim());
  const q=(act,ic,label,on)=>`<button type="button" data-act="${act}" data-id="${id}" data-testid="song-menu-${act}" class="pm-q press${on?' on':''}"><span class="pm-q-ic"><i data-lucide="${ic}"></i></span><span class="pm-q-l">${label}</span></button>`;
  const it=(act,ic,label,o)=>pmItem(Object.assign({act,ic,label,attrs:`data-id="${id}"`,tid:'song-menu-'+act},o||{}));
  const inner=`${pmSongHead(s)}
  <div class="pm-qgrid">${q('m-play-next','list-end','Play next')}${q('m-add-queue','list-plus','Queue')}${q('like','heart',fav?'Liked':'Like',fav)}${q('m-share','share-2','Share')}</div>
  <div class="pm-list">${it('m-add-pl','list-music','Add to playlist',{chev:true})}${it('dislike','heart-crack',dis?'Remove dislike':'Dislike',{on:dis})}<div class="pm-sep"></div>${it('ls-open','captions',hasLy?'Edit or sync lyrics':'Add lyrics')}${s._user?it('lyrics-find','sparkles','Find lyrics online'):''}${s._user?`<div class="pm-sep"></div>${it('m-edit-details','pencil','Edit details')}${it('m-remove-upload','trash-2','Remove upload',{danger:true})}`:''}</div>`;
  $("#modal").innerHTML=modalWrap(inner,"song-menu","sm"); icons();
}

function openAddToPlaylist(songId){ state._addSong=songId; const s=SONG_BY_ID[songId];
  const list=state.playlists.map(pl=>{ const ids=pl.songIds||[]; const has=ids.includes(songId); const c=SONG_BY_ID[ids[0]]; return `<button type="button" data-act="atp-add" data-pl="${pl.id}" data-testid="atp-pl-${pl.id}" class="pm-item press${has?' on':''}"><span class="pm-item-ic pm-item-art">${c?img(c.coverArt,'h-full w-full object-cover'):'<i data-lucide="list-music"></i>'}</span><span class="pm-item-t"><span class="pm-item-l clamp-1">${esc(pl.name)}</span><span class="pm-item-d">${ids.length} song${ids.length!==1?'s':''}</span></span><span class="pm-tick${has?' on':''}"><i data-lucide="${has?'check':'plus'}"></i></span></button>`; }).join("");
  const inner=`${pmHead('list-music','Playlists','Add to playlist','atp-close')}
  ${s?`<div class="pm-chip-song"><span>${img(s.coverArt,'h-full w-full object-cover')}</span><span class="clamp-1 min-w-0"><b class="font-bold text-[rgb(var(--fgc))]">${esc(s.title)}</b> \u00b7 ${esc(s.artist)}</span></div>`:''}
  <button type="button" data-act="atp-new" data-testid="atp-new" class="pm-item pm-item-new press"><span class="pm-item-ic"><i data-lucide="plus"></i></span><span class="pm-item-t"><span class="pm-item-l">New playlist</span></span></button>
  <div class="pm-list max-h-72 overflow-y-auto soft-scroll" data-testid="atp-list">${list||'<div class="st-empty"><i data-lucide="list-music"></i>No playlists yet. Create one above.</div>'}</div>`;
  $("#modal").innerHTML=modalWrap(inner,"add-to-playlist","sm"); icons();
}

