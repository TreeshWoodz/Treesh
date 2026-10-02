function openPerfMenu(name,id){ const ic=id?ARTIST_BY_ID[id]:null;
  const av=ic&&ic.image?img(ic.image,'h-full w-full object-cover'):`<span class="grid h-full w-full place-items-center text-3xl font-bold">${esc((name||'?').charAt(0).toUpperCase())}</span>`;
  const inner=`<div class="pm-perf"><div class="pm-perf-av"><span class="pm-perf-ring"></span><span class="pm-perf-img">${av}</span></div><p class="st-eyebrow mt-4">Featured artist</p><p class="pm-title mt-1 font-display text-xl" data-testid="perf-name">${esc(name)}</p>${ic?'':'<p class="pm-desc mt-1">Not a Treesh Icon yet</p>'}</div>
    <div class="pm-list mt-5">${pmItem({act:'song-facts',attrs:`data-name="${esc(name)}" data-id="${ic?ic.id:''}"`,tid:'perf-song-facts',ic:'scroll-text',label:'Song Facts',desc:'Their stats on this song',chev:true,hot:true})}${ic?pmItem({act:'artist-open',attrs:`data-id="${ic.id}"`,tid:'perf-view-icon',ic:'user',label:'View Icon',desc:'Open their Icon page',chev:true}):''}</div>
    <div class="pm-actions"><button type="button" data-act="modal-close" data-testid="perf-close" class="st-btn lg">Close</button></div>`;
  $("#modal").innerHTML=modalWrap(inner,"performer-menu","sm"); icons();
}
