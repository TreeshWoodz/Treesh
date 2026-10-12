/* ---------- P9zzo: Song Page (#/song/<id>) — big cover, play/shuffle, credits, lyrics preview, song facts, your stats, more from the artist, similar songs, share ---------- */
const SGP_STOP=new Set("the a an and or but to of in on at for with my your you me i im it its is are was be been am we they he she him her them our us this that so do dont just like got get oh yeah yea uh ooh ah la na no not up down all what when where who how why can cant will wont ill if then than out off too as from by into over ya yo ive youre thats aint gon gonna wanna".split(' '));
const SGP_COLS=['var(--treesh-purple)','#ff2d78','#22d3ee','#f5c451','#34d399','#fb923c','#a3e635','#60a5fa'];
const _sgpFx={};
function sgpLines(s){ return mkLyLines(s); }
function sgpFacts(s){ const L=sgpLines(s), key=s.id+':'+L.length+':'+L.reduce((n,l)=>n+l.text.length,0); if(_sgpFx[s.id]&&_sgpFx[s.id].key===key) return _sgpFx[s.id];
  const words=[], cnt={}, lc={}, by={}; let secs=0, prev='\u0000';
  L.forEach(l=>{ const ws=(String(l.text).toLowerCase().replace(/[\u2018\u2019]/g,"'").match(/[a-z0-9']+/g)||[]).map(w=>w.replace(/^'+|'+$/g,'').replace(/'/g,'')).filter(Boolean);
    ws.forEach(w=>{ words.push(w); if(w.length>2&&!SGP_STOP.has(w)) cnt[w]=(cnt[w]||0)+1; });
    const k=l.text.trim().toLowerCase(); lc[k]=(lc[k]||0)+1;
    const info=parseSection(l.sec,s), names=(info&&info.artists&&info.artists.length)?info.artists:[{name:s.artist,id:(s.artistIds||[])[0]||null}];
    names.forEach(a=>{ const b=by[a.name]||(by[a.name]={name:a.name,id:a.id||null,w:0,v:0}); b.w+=ws.length/names.length; }); });
  (s.lyrics||[]).forEach(l=>{ const k=l.sec||''; if(k!==prev){ if(k){ secs++; const info=parseSection(k,s); ((info&&info.artists)||[]).forEach(a=>{ if(by[a.name]) by[a.name].v++; }); } prev=k; } });
  const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||'', hk=Object.keys(lc).sort((a,b)=>lc[b]-lc[a])[0], hook=hk&&lc[hk]>1?{text:L.find(l=>l.text.trim().toLowerCase()===hk).text,n:lc[hk]}:null;
  const tot=words.length||1, share=Object.values(by).filter(b=>b.w>0).sort((a,b)=>b.w-a.w).map(b=>({...b,p:Math.round(b.w/tot*100)}));
  return _sgpFx[s.id]={key,lines:L.length,words:words.length,uniq:new Set(words).size,top,topN:cnt[top]||0,secs,hook,share,notes:(s.lyrics||[]).filter(l=>l.explain&&String(l.explain).trim()).length,synced:L.some(l=>l.t!=null&&l.t>0)}; }
function sgpAgo(ts){ if(!ts) return ''; const d=Math.floor((Date.now()-ts)/864e5); if(d<1) return swAgo(ts); if(d<7) return d+' day'+(d!==1?'s':'')+' ago'; return new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric',year:new Date(ts).getFullYear()===new Date().getFullYear()?undefined:'numeric'}); }
function sgpYou(s){ const log=(state.playLog||[]).filter(e=>e&&e.id===s.id), pc=state.playCounts||{}, plays=playCount(s.id), wk=Date.now()-7*864e5;
  const ranked=Object.keys(pc).filter(id=>pc[id]>0&&SONG_BY_ID[id]).sort((a,b)=>pc[b]-pc[a]), rank=plays?ranked.indexOf(s.id)+1:0;
  const disc=state.stars&&state.stars.newSongs&&state.stars.newSongs[s.id];
  return {plays,rank,of:ranked.length,last:log.length?log[log.length-1].ts:0,first:disc||(log[0]&&log[0].ts)||0,week:log.filter(e=>e.ts>=wk).length,lines:(state.favLyrics||[]).filter(x=>x.songId===s.id).length,liked:isFav(s.id)}; }
function sgpDur(s){ const d=plsDur(s); if(d) return d; if(!s._sgpTried&&s.audioUrl){ s._sgpTried=1; plsMeasure(s).then(v=>{ if(v){ _plsDurs[s.id]=Math.round(v); plsDurSave(); if(state.view==='song'&&state.param===s.id) renderView(); } }); } return 0; }
function sgpMore(s){ const aid=(s.artistIds||[])[0]; return (aid?artistSongs(aid):vis(SONGS.filter(x=>x.artist===s.artist))).filter(x=>x.id!==s.id); }
const SGP_GFAM={rap:['hiphop'],hiphop:['hiphop'],trap:['hiphop'],drill:['hiphop'],hippop:['hiphop','pop'],pop:['pop'],contemporarypop:['pop'],dance:['pop','dance'],edm:['dance'],house:['dance'],rb:['rnb'],randb:['rnb'],soul:['rnb'],rock:['rock'],alternative:['rock'],indie:['rock'],storytelling:['word'],spokenword:['word'],poetry:['word']};
const SGP_MSYN={romanic:'romantic',thrilled:'thrill',thrilling:'thrill',club:'party',hype:'party',sexy:'sensual',depressed:'sad',motivation:'inspirational',motivational:'inspirational'};
const SGP_MFAM={party:'up',fun:'up',happy:'up',dance:'up',playful:'up',thrill:'up',shock:'up',sensual:'soft',romantic:'soft',peaceful:'soft',angelic:'soft',hopeful:'soft',inspirational:'soft',sad:'dark',diss:'dark',savage:'dark',monster:'dark',trap:'dark'};
const _sgpWhy={};
/* mood is stored as "party,fun" or "happy party shock": one tag per word, typos fixed, no duplicates */
const MOOD_FIX={romanic:'romantic'};
function moodTags(s){ const seen=new Set(); return String((s&&typeof s==='object'?s.mood:s)||'').split(/[\s,;\/|&+]+/).map(w=>w.trim().toLowerCase()).filter(Boolean).map(w=>MOOD_FIX[w]||w).filter(w=>!seen.has(w)&&seen.add(w)); }
function sgpGenre(s){ const k=normKey(s.genre); return {k,fam:SGP_GFAM[k]||(k?[k]:[])}; }
function sgpMoods(s){ return [...new Set(String(s.mood||'').toLowerCase().split(/[^a-z]+/).filter(Boolean).map(w=>SGP_MSYN[w]||w))]; }
/* same genre family first (rap / hip hop / trap / hip pop are one family), ranked by shared mood tags, then era */
function sgpSimilar(s){ const mine=new Set(sgpMore(s).map(x=>x.id)), G=sgpGenre(s), M=sgpMoods(s), yr=sgpYear(s), why=_sgpWhy[s.id]={};
  if(!G.k&&!M.length) return [];
  return vis(SONGS.filter(x=>x.id!==s.id&&!mine.has(x.id)&&!isDisliked(x.id))).map(x=>{ const g=sgpGenre(x), m=sgpMoods(x), exact=!!G.k&&g.k===G.k, fam=!exact&&G.fam.some(f=>g.fam.includes(f)), shared=m.filter(t=>M.includes(t));
      if(G.k?!(exact||fam):!shared.length) return null;
      const mf=!shared.length&&M.length&&m.length&&m.some(t=>SGP_MFAM[t]&&M.some(u=>SGP_MFAM[u]===SGP_MFAM[t]));
      const clash=!!(M.length&&m.length&&!shared.length&&!mf); if(clash&&!exact) return null;
      const y=sgpYear(x), k=(exact?3:fam?1.6:0)+shared.length*1.4+(mf?.6:0)+(yr&&y?.4*(1-Math.min(Math.abs(yr-y),10)/10):0)+(x.treeshChoice?.1:0);
      why[x.id]=[exact||fam?x.genre:'',shared[0]||''].filter(Boolean).join(' \u00b7 ');
      return {x,k,clash}; }).filter(Boolean).sort((a,b)=>(a.clash-b.clash)||(b.k-a.k)).filter((o,i,arr)=>!o.clash||arr.filter(q=>!q.clash).length<4).slice(0,12).map(o=>o.x); }
function sgpYear(s){ const t=dateMs(s.creationDate); return t?new Date(t).getFullYear():''; }
function sgpLink(name,id){ const a=id?ARTIST_BY_ID[id]:(ARTISTS||[]).find(x=>normKey(x.name)===normKey(name)); return a?`<button type="button" data-act="artist-open" data-id="${a.id}" data-testid="song-page-artist-${a.id}" class="sgp-alink press">${esc(a.name)}</button>`:`<span class="sgp-alink is-plain">${esc(name)}</span>`; }
function sgpFeat(s){ return String(s.featuring||'').split(/\s*[,&\/+\u00d7]\s*|\s+(?:feat\.?|ft\.?|featuring|with|and|x)\s+/i).map(x=>x.trim()).filter(Boolean); }

function sgpHero(s,y,dur){ const cur=curSong(), on=!!(cur&&cur.id===s.id), playing=on&&state.isPlaying, fav=isFav(s.id), feat=sgpFeat(s), yr=sgpYear(s);
  const meta=[yr,s.genre,...moodTags(s),dur?fmt(dur):''].filter(Boolean).map(v=>`<span>${esc(v)}</span>`).join('');
  const badges=`${s.treeshChoice?`<span class="sgp-badge is-pick" data-testid="song-page-exclusive-badge"><i data-lucide="sparkles"></i>${s.exclusive?'Exclusive':'Treesh\u2019s Pick'}</span>`:''}${s.explicit?`<span class="sgp-badge is-e" data-testid="song-page-explicit-badge" title="Explicit">E</span>`:''}${s._user?`<span class="sgp-badge">Your upload</span>`:''}`;
  return `<section class="sgp-hero dark-surface${on?' is-on':''}${playing?' is-playing':''}" data-testid="song-page-hero">
    <div class="sgp-hero-bg" aria-hidden="true">${img(s.coverArt,'sgp-hero-fill','alt=""')}</div><span class="sgp-hero-shade" aria-hidden="true"></span>
    <div class="sgp-hero-in">
      <div class="sgp-cover-wrap"><span class="sgp-disc" aria-hidden="true"><span style="background-image:url('${esc(s.coverArt||'')}')"></span></span><button type="button" data-act="play" data-id="${s.id}" data-ctx="sgp:${s.id}" class="sgp-cover press" aria-label="${playing?'Pause':'Play'} ${esc(s.title)}" data-testid="song-page-cover-art">${img(s.coverArt,'h-full w-full object-cover',`alt="${esc(s.title)}"`)}<span class="sgp-cover-pp"><i data-lucide="${playing?'pause':'play'}" class="fill-current"></i></span>${on?'<span class="sgp-cover-eq eq"><span></span><span></span><span></span><span></span></span>':''}</button></div>
      <div class="sgp-hd">
        <p class="sgp-kicker"><i data-lucide="audio-lines"></i>Song${badges}</p>
        <h1 class="sgp-title" data-testid="song-page-title">${esc(s.title)}</h1>
        <p class="sgp-by" data-testid="song-page-artist-link">${sgpLink(s.artist,(s.artistIds||[])[0])}${feat.length?`<span class="sgp-feat" data-testid="song-page-featured-artists"><em>feat.</em>${feat.map(n=>sgpLink(n)).join('<i>,</i>')}</span>`:''}</p>
        ${meta?`<p class="sgp-meta">${meta}</p>`:''}
        <div class="sgp-stats"><span data-testid="song-page-hero-plays"><b>${fmtNum(y.plays)}</b>Your plays</span>${y.rank?`<span><b>#${y.rank}</b>Your rank</span>`:''}<span><b>${y.lines}</b>Saved lines</span></div>
        <div class="sgp-actions">
          <button type="button" data-act="play" data-id="${s.id}" data-ctx="sgp:${s.id}" data-testid="song-page-play" class="ar-btn primary press"><i data-lucide="${playing?'pause':'play'}" class="fill-current"></i><span class="sgp-play-l">${playing?'Pause':on?'Resume':'Play'}</span></button>
          <button type="button" data-act="sgp-shuffle" data-id="${s.id}" data-testid="song-page-shuffle" class="ar-btn press"><i data-lucide="shuffle"></i>Shuffle</button>
          <button type="button" data-act="like" data-id="${s.id}" data-testid="song-page-like" aria-label="${fav?'Unlike':'Like'}" aria-pressed="${fav}" class="ar-btn icon press tr-like${fav?' is-liked':''}"><i data-lucide="heart"${fav?' class="fill-current"':''}></i></button>
          <button type="button" data-act="m-add-pl" data-id="${s.id}" data-testid="song-page-add-playlist" aria-label="Add to playlist" class="ar-btn icon press"><i data-lucide="list-plus"></i></button>
          <button type="button" data-act="sgp-share" data-id="${s.id}" data-testid="song-page-share" aria-label="Share" class="ar-btn icon press"><i data-lucide="share-2"></i></button>
          ${s.videoId?`<button type="button" data-act="sgp-video" data-id="${s.id}" data-testid="song-page-video-btn" aria-label="Watch the video" class="ar-btn icon press"><i data-lucide="clapperboard"></i></button>`:''}
          <button type="button" data-act="songmenu" data-id="${s.id}" data-testid="song-page-more" aria-label="More options" class="ar-btn icon press"><i data-lucide="more-horizontal"></i></button>
        </div>
      </div>
    </div></section>`; }

function sgpLyrics(s){ const L=sgpLines(s), open=state._sgpLy===s.id, cur=curSong(), on=!!(cur&&cur.id===s.id);
  if(!L.length) return `<section class="sgp-card sgp-lyrics is-empty" data-testid="song-page-lyrics-preview"><div class="sgp-ch"><span class="sgp-ci"><i data-lucide="mic-vocal"></i></span><div><h2>Lyrics</h2><small>No lyrics for this song yet</small></div></div><p class="sgp-empty">Be the first to write them down and sync them to the beat.</p><div class="sgp-cta"><button type="button" data-act="ls-open" data-id="${s.id}" data-testid="song-page-add-lyrics" class="sgp-pill press"><i data-lucide="pen-line"></i>Add lyrics</button></div></section>`;
  const show=open?L:L.slice(0,8); let last='\u0000';
  const rows=show.map(l=>{ let h=''; if((l.sec||'')!==last){ last=l.sec||''; if(l.sec){ const info=parseSection(l.sec,s), who=(info&&info.artists||[]).map(a=>a.name).join(' & '); h=`<p class="sgp-sec"><b>${esc(info?info.role:l.sec)}</b>${who?`<span>${esc(who)}</span>`:''}</p>`; } }
    const i=(s.lyrics||[]).indexOf(l), saved=isFavLyric(s.id,i); return h+`<p class="sgp-line${saved?' is-saved':''}">${esc(l.text)}${saved?'<i data-lucide="heart" class="fill-current"></i>':''}</p>`; }).join('');
  return `<section class="sgp-card sgp-lyrics${open?' is-open':''}" data-testid="song-page-lyrics-preview"><div class="sgp-ch"><span class="sgp-ci"><i data-lucide="mic-vocal"></i></span><div><h2>Lyrics</h2><small>${L.length} line${L.length!==1?'s':''}${sgpFacts(s).synced?' \u00b7 synced to the beat':''}</small></div></div>
    <div class="sgp-ly-body">${rows}${!open&&L.length>8?'<span class="sgp-ly-fade" aria-hidden="true"></span>':''}</div>
    <div class="sgp-cta">${L.length>8?`<button type="button" data-act="sgp-ly-more" data-id="${s.id}" data-testid="song-page-lyrics-toggle" class="sgp-pill press"><i data-lucide="${open?'chevron-up':'chevron-down'}"></i>${open?'Show less':'Show all lyrics'}</button>`:''}<button type="button" data-act="sgp-sing" data-id="${s.id}" data-testid="song-page-open-lyrics" class="sgp-pill is-pri press"><i data-lucide="mic-vocal"></i>${on?'Open live lyrics':'Play with live lyrics'}</button></div></section>`; }

function sgpFactsHtml(s,dur){ const f=sgpFacts(s); if(!f.lines) return '';
  const tile=(tid,v,l,ic,wide)=>`<div class="sgp-fact${wide?' is-wide':''}" data-testid="${tid}"><i data-lucide="${ic}"></i><b>${v}</b><small>${l}</small></div>`;
  const bar=f.share.length>1?`<div class="sgp-share" data-testid="fact-verse-share-bar"><p class="sgp-k">Who wrote how much</p><div class="sgp-bar">${f.share.map((b,i)=>`<span style="--w:${Math.max(b.p,2)}%;--c:${SGP_COLS[i%SGP_COLS.length]};--i:${i}" title="${esc(b.name)} ${b.p}%"></span>`).join('')}</div><div class="sgp-legend">${f.share.map((b,i)=>`<span style="--c:${SGP_COLS[i%SGP_COLS.length]}"><i></i>${b.id?`<button type="button" data-act="artist-open" data-id="${b.id}" class="press">${esc(b.name)}</button>`:esc(b.name)}<b>${b.p}%</b><small>${b.v} part${b.v!==1?'s':''}</small></span>`).join('')}</div></div>`:'';
  const wpm=dur?Math.round(f.words/(dur/60)):0;
  return `<section class="sgp-card sgp-facts" data-testid="song-facts-container"><div class="sgp-ch"><span class="sgp-ci is-gold"><i data-lucide="scroll-text"></i></span><div><h2>Song Facts</h2><small>Counted straight from the lyrics</small></div></div>
    <div class="sgp-fgrid">${tile('fact-total-words',fmtNum(f.words),'Words','type')}${tile('fact-lines',f.lines,'Lines','list')}${tile('fact-unique-words',fmtNum(f.uniq),'Unique words','sparkle')}${tile('fact-sections',f.secs||1,f.secs===1?'Section':'Sections','layers')}${dur?tile('fact-duration',fmt(dur),'Length','timer'):''}${wpm?tile('fact-pace',wpm,'Words / min','gauge'):''}</div>
    ${f.top?`<div class="sgp-top" data-testid="fact-top-word"><p class="sgp-k">Most used word</p><p class="sgp-word">\u201c${esc(f.top)}\u201d <span>\u00d7${f.topN}</span></p></div>`:''}
    ${f.hook?`<div class="sgp-top" data-testid="fact-hook-line"><p class="sgp-k">Line you hear the most</p><p class="sgp-hook">\u201c${esc(f.hook.text)}\u201d <span>\u00d7${f.hook.n}</span></p></div>`:''}
    ${bar}${f.notes?`<p class="sgp-note"><i data-lucide="lightbulb"></i>${f.notes} line${f.notes!==1?'s have':' has'} the story behind ${f.notes!==1?'them':'it'}. Tap a lyric in the player to read it.</p>`:''}</section>`; }

function sgpYouHtml(s,y){ const st=(v,l,tid,ic)=>`<div class="sgp-ys" data-testid="${tid}"><i data-lucide="${ic}"></i><b class="font-doto">${v}</b><small>${l}</small></div>`;
  return `<section class="sgp-card sgp-you" data-testid="song-page-user-stats"><div class="sgp-ch"><span class="sgp-ci is-rose"><i data-lucide="chart-no-axes-column"></i></span><div><h2>Your stats</h2><small>${y.plays?'Just between you and this song':'You haven\u2019t played this one yet'}</small></div></div>
    <div class="sgp-ygrid">${st(fmtNum(y.plays),'Plays','user-play-count','play')}${st(y.week,'This week','user-week-plays','calendar-days')}${st(y.rank?'#'+y.rank:'\u2013',y.rank?'of '+y.of+' you play':'Your rank','user-rank-stat','trophy')}${st(y.lines,'Saved lines','user-saved-lines','quote')}</div>
    <div class="sgp-ylist">${y.last?`<p data-testid="user-last-played"><i data-lucide="history"></i>Last played <b>${esc(sgpAgo(y.last))}</b></p>`:''}${y.first?`<p data-testid="user-first-played"><i data-lucide="sparkles"></i>First heard <b>${esc(sgpAgo(y.first))}</b></p>`:''}<p data-testid="user-liked-state"><i data-lucide="heart"></i>${y.liked?'In your <b>Liked</b> songs':'Not liked yet'}</p></div></section>`; }

function sgpCreditsHtml(s){ const row=(l,v,tid,ic)=>v?`<div class="sgp-cr" data-testid="${tid}"><span><i data-lucide="${ic}"></i>${l}</span><b>${esc(v)}</b></div>`:'';
  const chips=[s.genre,...moodTags(s)].filter(Boolean); const about=s.desc||s.bio;
  const rows=row('Album',s.album,'credits-album-link','disc-3')+row('Released',s.creationDate,'credits-release-date','calendar')+row('Label',s.label,'credits-record-label','building-2')+row('Written by',s.writtenBy,'credits-written-by','pen-line')+row('Produced by',s.producer,'credits-producer','sliders-horizontal')+row('Mixed by',s.mixer,'credits-mixer','audio-waveform')+row('Video by',s.videographer,'credits-video-by','video')+row('Featuring',s.featuring,'credits-featuring','users');
  return `<section class="sgp-card sgp-credits" data-testid="song-credits-container"><div class="sgp-ch"><span class="sgp-ci is-cyan"><i data-lucide="info"></i></span><div><h2>Credits &amp; info</h2><small>Who made it happen</small></div></div>
    ${about?`<p class="sgp-about" data-testid="song-page-about">${esc(about)}</p>`:''}
    ${chips.length?`<div class="sgp-chips" data-testid="credits-genre-chips">${chips.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`:''}
    <div class="sgp-crs">${rows||`<p class="sgp-empty">No credits added yet.</p>`}</div>
    ${s.videoId?`<button type="button" data-act="sgp-video" data-id="${s.id}" data-testid="song-page-video-cta" class="sgp-pill press mt-3"><i data-lucide="clapperboard"></i>Watch the music video</button>`:''}</section>`; }

function sgpRow(title,sub,list,tid,ctx,why){ if(!list.length) return '';
  return `<section class="sgp-rel" data-testid="${tid}"><div class="sgp-rh"><h2 class="ar-h">${title}</h2>${sub?`<small>${sub}</small>`:''}</div><div class="sgp-scroll no-scrollbar" data-ctx="${ctx}">${list.slice(0,14).map((x,i)=>{ const on=curSong()&&curSong().id===x.id&&state.isPlaying;
    return `<div class="sgp-tile" style="--i:${i}"><div class="sgp-tile-media"><button type="button" data-act="song-open" data-id="${x.id}" data-testid="${tid}-open-${x.id}" class="sgp-tile-art press" aria-label="Open ${esc(x.title)}">${img(x.coverArt,'h-full w-full object-cover',`alt=""`)}</button><button type="button" data-act="play" data-id="${x.id}" data-testid="${tid}-play-${x.id}" class="sgp-tile-pp press" aria-label="Play ${esc(x.title)}"><i data-lucide="${on?'pause':'play'}" class="fill-current"></i></button></div><button type="button" data-act="song-open" data-id="${x.id}" class="sgp-tile-t"><b class="clamp-1">${esc(x.title)}</b><small class="clamp-1">${esc(x.artist)}</small>${why&&why[x.id]?`<span class="sgp-why" data-testid="${tid}-why-${x.id}">${esc(why[x.id])}</span>`:''}</button></div>`; }).join('')}</div></section>`; }

function viewSongPage(){ const s=SONG_BY_ID[state.param];
  if(!s) return `<div class="sgp" data-testid="song-page-root"><button data-act="back" data-testid="song-page-back-button" class="sgp-back press"><i data-lucide="arrow-left"></i>Back</button><div class="sgp-card sgp-missing" data-testid="song-page-missing"><i data-lucide="music-2"></i><h2>Song not found</h2><p>It may have been removed or renamed.</p><button data-act="nav-view" data-view="library" class="ar-btn primary press">Go home</button></div></div>`;
  const y=sgpYou(s), dur=sgpDur(s), more=sgpMore(s), sim=sgpSimilar(s); state.contextList=[s,...more];
  const pal=paletteCache.get(s.coverArt); if(pal===undefined) extractPalette(s.coverArt).then(p=>{ if(p) sgpTint(p); });
  const tint=pal&&pal[0]?` style="--sg1:${rgb(pal[0])};--sg2:${rgb(pal[1]||pal[0])}"`:'';
  return `<div class="sgp" data-testid="song-page-root" data-song="${esc(s.id)}"${tint}>
    <button type="button" data-act="back" data-testid="song-page-back-button" class="sgp-back press"><i data-lucide="arrow-left"></i>Back</button>
    ${sgpHero(s,y,dur)}
    <div class="sgp-grid"><div class="sgp-col">${sgpLyrics(s)}${sgpFactsHtml(s,dur)}</div><div class="sgp-col">${sgpYouHtml(s,y)}${sgpCreditsHtml(s)}</div></div>
    ${sgpRow('More from '+esc(s.artist),more.length+' song'+(more.length!==1?'s':''),more,'more-from-artist-row','artist:'+((s.artistIds||[])[0]||''))}
    ${sgpRow('Similar vibe',[s.genre,...moodTags(s)].filter(Boolean).map(esc).join(' \u00b7 '),sim,'similar-songs-row','sgp-sim:'+s.id,_sgpWhy[s.id])}
  </div>`; }
function sgpTint(p){ const r=document.querySelector('#view .sgp'); if(!r||!p||!p[0]) return; r.style.setProperty('--sg1',rgb(p[0])); r.style.setProperty('--sg2',rgb(p[1]||p[0])); }

function sgpOpen(id){ if(!SONG_BY_ID[id]) return; closeModal(); if(state.npOpen) closeNP(); if(state.queueOpen){ try{ closeQueue(); }catch(e){} } try{ if(document.getElementById('sx-root')) sxClose(); }catch(e){} state._sgpLy=null; navigate('song',id); }
const _rcl9zzo=resolveCtxList; resolveCtxList=function(tok){ if(tok&&tok.indexOf('sgp:')===0){ const s=SONG_BY_ID[tok.slice(4)]; return s?[s,...sgpMore(s)]:null; } if(tok&&tok.indexOf('sgp-sim:')===0){ const s=SONG_BY_ID[tok.slice(8)]; return s?sgpSimilar(s):null; } return _rcl9zzo.apply(this,arguments); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act, id=t.dataset.id, s=SONG_BY_ID[id];
  if(a==='song-open'){ e.preventDefault(); sgpOpen(id); return; }
  if(!s) return;
  if(a==='sgp-ly-more'){ state._sgpLy=state._sgpLy===id?null:id; renderView(); return; }
  if(a==='sgp-sing'){ const cur=curSong(); if(!(cur&&cur.id===id)) playSong(s,[s,...sgpMore(s)]); state.showLyrics=true; state.npOpen=true; renderNP(); return; }
  if(a==='sgp-shuffle'){ const list=[s,...sgpMore(s)]; state.shuffle=true; playSong(s,list); toast('Shuffling '+s.artist,'Starting with '+s.title); return; }
  if(a==='sgp-share'){ const url=location.origin+location.pathname+'#/song/'+encodeURIComponent(id), text=`Listen to \u201c${s.title}\u201d by ${s.artist} on Treesh`;
    if(navigator.share){ navigator.share({title:s.title,text,url}).catch(()=>{}); } else copyText(text+'\n'+url).then(ok=>toast(ok?'Song link copied':'Couldn\u2019t copy the link',s.title)); return; }
  if(a==='sgp-video'){ window.open('https://www.youtube.com/watch?v='+encodeURIComponent(s.videoId),'_blank','noopener'); return; } });

/* the song page button label follows play / pause */
const _upi9zzo=updatePlayIcons; updatePlayIcons=function(){ const r=_upi9zzo.apply(this,arguments); const root=document.querySelector('#view .sgp'); if(root){ const id=root.dataset.song, cur=curSong(), on=!!(cur&&cur.id===id), pl=on&&state.isPlaying;
    const l=root.querySelector('.sgp-play-l'); if(l) l.textContent=pl?'Pause':on?'Resume':'Play'; const h=root.querySelector('.sgp-hero'); if(h){ h.classList.toggle('is-on',on); h.classList.toggle('is-playing',pl); } } return r; };

/* where the page opens: a song's cover (cards, rows), the Now Playing cover and the song menu */
const _songCard9zzo=songCard; songCard=function(s){ const h=_songCard9zzo.apply(this,arguments); return h.replace('<div class="relative overflow-hidden rounded-xl">',`<div class="relative overflow-hidden rounded-xl sgp-hit" data-act="song-open" data-id="${s.id}" data-testid="song-card-cover-${s.id}" role="button" tabindex="0" aria-label="Open ${esc(s.title)}">`); };
const _songRow9zzo=songRow; songRow=function(s){ const h=_songRow9zzo.apply(this,arguments); const i=h.indexOf('<button data-act="'); if(i<0) return h; const j=h.indexOf('class="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">',i); if(j<0||j-i>200) return h;
  const seg=h.slice(i,j).replace(/data-act="[^"]*"/,'data-act="song-open"').replace(/ data-ctx="[^"]*"/,'')+`data-testid="song-row-cover-${s.id}" aria-label="Open ${esc(s.title)}" `;
  return h.slice(0,i)+seg+h.slice(j).replace(/(<span class="absolute inset-0 grid place-items-center bg-black\/40 opacity-0 group-hover:opacity-100"><i data-lucide=")[^"]*(")/,'$1arrow-up-right$2'); };
const _npArt9zzo=npArtHtml; npArtHtml=function(s){ const h=_npArt9zzo.apply(this,arguments); return s?h.replace('data-act="np-style-open"',`data-act="song-open" data-id="${s.id}"`).replace('aria-label="Change cover style"','aria-label="Open the song page"'):h; };
const _osm9zzo=openSongMenu; openSongMenu=function(id){ const r=_osm9zzo.apply(this,arguments); const l=document.querySelector('#modal .pm-list'); if(l&&SONG_BY_ID[id]&&!l.querySelector('[data-act="song-open"]')){ l.insertAdjacentHTML('afterbegin',pmItem({act:'song-open',ic:'disc-3',label:'View song page',desc:'Credits, lyrics, facts and your stats',attrs:`data-id="${id}"`,tid:'song-menu-song-page',chev:true,hot:true})); icons(); } return r; };
