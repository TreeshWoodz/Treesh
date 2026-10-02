  const swc=(on)=>`st-sw${on?' on':''}`;
  const pickSw=(act,tid,val,on,title)=>`<label class="st-sw st-sw-pick${on?' on':''}" title="${title}" style="${on?`background:${val}`:''}"><input type="color" data-act="${act}" data-testid="${tid}" value="${val}" aria-label="${title}"></label>`;
  const modeBtn=(m,label,ic,active)=>`<button data-act="card-bg-mode" data-mode="${m}" data-testid="card-bg-mode-${m}" aria-pressed="${active}" class="${active?'on':''}"><i data-lucide="${ic}"></i>${label}</button>`;
  const themeSwatches=CARD_THEMES.map((t,i)=>`<button data-act="card-theme" data-i="${i}" aria-label="${t.name}" title="${t.name}" data-testid="card-theme-${i}" class="${swc(st.bgMode==='theme'&&i===st.theme)}" style="background:linear-gradient(135deg,${t.a},${t.b})"></button>`).join("");
  const shapeBtn=(sh,label)=>`<button data-act="card-cover-shape" data-shape="${sh}" data-testid="card-cover-shape-${sh}" aria-pressed="${st.coverShape===sh}" class="${st.coverShape===sh?'on':''}">${label}</button>`;
  const coverSrc=s.coverArt||FALLBACK;
  const filterCtl=`<div class="st-filters">${CARD_IMG_FILTERS.map(f=>`<button data-act="card-imgfilter" data-filter="${f.id}" data-testid="card-imgfilter-${f.id}" aria-pressed="${st.imgFilter===f.id}" class="st-filter press${st.imgFilter===f.id?' on':''}"><span class="st-filter-th"><img src="${esc(coverSrc)}" alt="" loading="lazy" draggable="false">${(f.ops||[]).map(o=>`<span style="background:${o.color};mix-blend-mode:${o.op};${o.alpha!=null?`opacity:${o.alpha}`:''}"></span>`).join('')}</span>${f.label}</button>`).join("")}</div>`;
  const bgControls = st.bgMode!=='cover'
    ? `<div class="st-sws">${themeSwatches}${pickSw('card-color','card-color',st.color,st.bgMode==='color','Custom color')}</div>`
    : `<p class="st-note mb-3"><i data-lucide="info"></i>Full-bleed cover art background. Some artwork may not be exportable.</p><p class="st-sub" style="margin-top:0">Image filter</p>${filterCtl}`;
  const OVS=['#000000','#1a1030','#3a0d6b','#7a2233','#155e75','#7a5f1e'];
  const _ov=(st.overlayColor||'').toLowerCase();
  const overlayCtl=`<div class="st-sws">${OVS.map(c=>`<button data-act="card-overlay" data-color="${c}" aria-label="Overlay ${c}" data-testid="card-overlay-${c.replace('#','')}" class="${swc(_ov===c)}" style="background:${c}"></button>`).join("")}${pickSw('card-overlay-custom','card-overlay-custom',st.overlayColor,!OVS.includes(_ov),'Custom overlay color')}</div>`;
  const slider=(act,label,ic,val,min,max,step,unit)=>stRange({ic,label,min,max,step,val,txt:(unit==='px'?Math.round(val)+'px':Math.round(val*100)+'%'),attrs:`data-act="${act}"`,tid:act,vattrs:`data-fill-label="${act}"`});
  const TCS=['#ffffff','#0b0b0d','#e9d8ff','#ffe9a8','#ffd0d0','#c8f5da','#bfe9ff'];
  const _tc=(st.textColor||'#ffffff').toLowerCase();
  const textColorCtl=`<div class="st-sws">${TCS.map(c=>`<button data-act="card-textcolor" data-color="${c}" aria-label="Text ${c}" data-testid="card-textcolor-${c.replace('#','')}" class="${swc(_tc===c)}" style="background:${c}"></button>`).join("")}${pickSw('card-textcolor-custom','card-textcolor-custom',st.textColor,!TCS.includes(_tc),'Custom text color')}</div>`;
  const fontCtl=`<div class="st-fonts">${CARD_FONTS.map(f=>`<button data-act="card-font" data-font="${f.fam}" data-testid="card-font-${f.label}" aria-pressed="${st.font===f.fam}" class="st-font press${st.font===f.fam?' on':''}"><b style="font-family:'${f.fam}',sans-serif">Aa</b><span>${f.label}</span></button>`).join("")}</div>`;
  const emptyLines = st.tab==='favorited'
    ? `<div class="st-empty"><i data-lucide="heart"></i>No favorited lines yet. Tap the heart in the menu on any lyric line.</div>`
    : st.tab==='all'
    ? `<div class="st-empty"><i data-lucide="music-2"></i>No lyrics available for this song.</div>`
    : `<div class="st-empty"><i data-lucide="list-checks"></i>Nothing on the card yet. Add lines from the Favorited or All tab.</div>`;
  const rowRemove=(l,k)=>{ const ln=(s.lyrics||[])[l.i]||{}; const disp=origLineTextFor(songId,l.i, l.text!=null?l.text:''); const edited=(ln.orig!=null && String(ln.orig)!==String(ln.text)); return `<div class="st-line"><span class="st-line-n">${k+1}</span><p class="min-w-0 flex-1 text-sm leading-snug">${esc(disp)}${edited?'<span class="st-tag-orig">original</span>':''}</p><button data-act="studio-remove" data-i="${l.i}" data-testid="studio-remove-${l.i}" aria-label="Remove" class="st-line-x press"><i data-lucide="x"></i></button></div>`; };
  const rowToggle=(l)=>{ const on=isStudioPicked(l.i); const disp=origLineTextFor(songId,l.i, l.text!=null?l.text:''); return `<button data-act="studio-toggle-pick" data-i="${l.i}" data-testid="studio-toggle-${l.i}" aria-pressed="${on}" class="st-line st-line-pick press${on?' on':''}"><span class="st-check"><i data-lucide="check"></i></span><span class="min-w-0 flex-1 text-sm leading-snug">${esc(disp)}</span></button>`; };
  let lineList;
  if(!list.length){ lineList=emptyLines; }
  else if(st.tab==='selected'){ lineList=list.slice(0,6).map(rowRemove).join(""); }
  else { lineList=list.map(rowToggle).join(""); }
  const tabBtn=(tb,label,n)=>`<button data-act="card-tab" data-tab="${tb}" data-testid="card-tab-${tb}" aria-pressed="${st.tab===tb}" class="${st.tab===tb?'on':''}">${label}${n?`<span class="st-count">${n}</span>`:''}</button>`;
  const tabsUi=`<div class="st-seg mb-3">${tabBtn('selected','Selected',selCount)}${tabBtn('favorited','Favorited',favCount)}${tabBtn('all','All',allCount)}</div>`;
  const offCls=cardN?'':' is-off';
  const lyricsCard=stCard('list-music','Lyrics on card','Up to 6 lines, in the order you pick them',`${tabsUi}${over?`<p class="st-warn">Cards show up to 6 lines, so only the first 6 are used.</p>`:''}<div class="max-h-[300px] overflow-y-auto soft-scroll pr-0.5">${lineList}</div>
      <div class="mt-3 border-t border-white/10 pt-3">${stToggle('card-lyric-move','card-lyric-move',!!st.lyricMove,st.lyricMove?'move':'lock',st.lyricMove?'Movable':'Auto-placed',st.lyricMove?'Drag the outlined lyric block on the preview':'Lyrics are centered automatically. Switch on to drag them')}${(st.lyricDX||st.lyricDY)?`<button data-act="card-lyric-reset" data-testid="card-lyric-reset" class="st-btn mt-2"><i data-lucide="rotate-ccw"></i>Reset position</button>`:''}</div>`,`<span class="st-pill" data-testid="lyric-card-count">${Math.min(cardN,6)}/6</span>`,'lyric-card-lines');
  const layersCard=stCard('sticker','Text & stickers','Extra words and emoji, baked into the image',`<div id="lc-layer-panel" data-testid="lyric-card-layer-panel"></div>`,'','lyric-card-layers-card');
  const bgCard=stCard('image','Background','Theme gradient, any color or the cover art',`<div class="st-seg mb-3">${modeBtn('fill','Color & Theme','palette', st.bgMode!=='cover')}${modeBtn('cover','Cover art','image', st.bgMode==='cover')}</div>${bgControls}
      <p class="st-sub">Overlay tint</p>${overlayCtl}
      <div class="mt-3">${slider('card-dim','Dim','moon',st.dim,0,0.85,0.05,'%')}</div>`,'','lyric-card-bg-card');
  const typeCard=stCard('type','Typography','Font, color and size of the lyrics',`${fontCtl}<p class="st-sub">Text color</p>${textColorCtl}<div class="mt-3">${slider('card-fontsize','Size','a-large-small',st.fontScale,0.7,1.4,0.05,'%')}</div>`,'','lyric-card-type-card');
  const badgeCard=stCard('disc-3','Cover art badge','Small cover beside the title. Shape applies to the badge only',`${stToggle('card-toggle-thumb','card-toggle-thumb',!!st.showThumb,st.showThumb?'check':'plus',st.showThumb?'Shown':'Add cover','Show the song artwork on the card')}${st.showThumb?`<div class="st-seg mt-3">${shapeBtn('circle','Circle')}${shapeBtn('rounded','Rounded')}${shapeBtn('full','Square')}</div>`:''}`,'','lyric-card-badge-card');
  const inner=`<div data-studio-root class="st-root">
    <div class="st-head">
      <span class="st-head-ic"><i data-lucide="quote"></i></span>
      <div class="min-w-0 flex-1"><p class="st-eyebrow">Lyric Card</p><p class="st-title clamp-1">${esc(s.title)} \u00B7 ${esc(s.artist)}</p></div>
      <button data-act="modal-close" aria-label="Close" data-testid="lyric-card-close" class="st-x press"><i data-lucide="x"></i></button>
    </div>
    <div id="lyric-studio-scroll" class="st-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
     <div class="st-body">
      <div class="st-left">
       <div class="st-stage" data-testid="lyric-card-preview">
        <div class="st-frame mx-auto w-full max-w-[min(100%,38vh)] md:max-w-none">
          <canvas id="lyric-canvas" width="1080" height="1080" class="block w-full"></canvas>
          <div id="lc-lyric-box" data-testid="lyric-card-lyric-box" class="lc-lyric-box ${st.lyricMove?'':'hidden'}"><span class="lc-lyric-tag"><i data-lucide="move" style="width:11px;height:11px"></i>Lyrics</span></div>
          <div id="lc-layers" data-testid="lyric-card-layers" class="pointer-events-none absolute inset-0"></div>
        </div>
       </div>
       <p class="st-hint hidden md:flex"><i data-lucide="eye"></i>Live preview \u00b7 drag layers to move them</p>
       <div class="hidden gap-2 md:flex">
         <button data-act="card-download" data-testid="card-download-side" class="st-btn lg flex-1${offCls}"><i data-lucide="download"></i>Download</button>
         <button data-act="card-share" data-testid="card-share-side" class="st-btn lg primary flex-1${offCls}"><i data-lucide="share-2"></i>Share</button>
       </div>
      </div>
      <div class="st-opts">
       ${lyricsCard}${layersCard}${bgCard}${typeCard}${badgeCard}
       <div class="flex gap-2 pt-1 md:hidden">
         <button data-act="card-download" data-testid="card-download" class="st-btn lg flex-1${offCls}"><i data-lucide="download"></i>Download</button>
         <button data-act="card-share" data-testid="card-share" class="st-btn lg primary flex-1${offCls}"><i data-lucide="share-2"></i>Share</button>
       </div>
      </div>
     </div>
    </div>
  </div>`;
  $("#modal").innerHTML=modalWrap(inner,"lyric-studio","studio"); icons();
