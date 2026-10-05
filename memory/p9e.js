/* ---------- P9: playlist covers, up to three track covers stacked ---------- */
function plCovers(pl){ const seen=new Set(), out=[]; for(const id of (pl&&pl.songIds)||[]){ const s=SONG_BY_ID[id]; if(!s||!s.coverArt||seen.has(s.coverArt)) continue; seen.add(s.coverArt); out.push(s); if(out.length===3) break; } return out; }
function plStackHtml(pl,cls){ const c=plCovers(pl), n=c.length, tid=`data-testid="pl-stack-${esc(pl.id)}" data-count="${n}"`;
  if(!n) return `<span class="pls is-empty ${cls||''}" ${tid}><span class="pls-c pls-0"><i data-lucide="list-music"></i></span></span>`;
  return `<span class="pls ${cls||''}" ${tid}>${c.map((s,i)=>`<span class="pls-c pls-${i}">${img(s.coverArt,'h-full w-full object-cover')}</span>`).reverse().join('')}</span>`; }
function plCardArt(pl){ const c=plCovers(pl); return `<span class="pls-bg" aria-hidden="true">${c[0]?img(c[0].coverArt,'h-full w-full object-cover'):''}</span>${plStackHtml(pl,'pls-card')}`; }
