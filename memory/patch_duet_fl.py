import sys
P = "/app/single_html/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        print("MISMATCH", n, "for:", old[:160]); sys.exit(1)
    s = s.replace(old, new)

# ================= DUET COLORS =================
rep('  xf: Object.assign({sec:6, mode:"auto"}, LS.get("treesh_xf", {})), karGlow: LS.get("treesh_kar_glow", "accent"),',
    '  xf: Object.assign({sec:6, mode:"auto"}, LS.get("treesh_xf", {})), karGlow: LS.get("treesh_kar_glow", "accent"), duetColors: LS.get("treesh_duet_colors", true),')

rep('function karaokeStageHtml(){', r'''/* ---------- Duet colors: color lines by who's singing (from section labels like "Verse 2: Artist B") ---------- */
const DUET_COLORS=["#4fd1ff","#ffb347","#7cf29a","#ff6fb5","#ffe066","#b58cff","#ff7a59","#5ef2e0"];
let _duetCache={lines:null, on:null, map:null};
function duetOn(){ return state.duetColors!==false; }
function duetInfo(s){ if(!s) return null; const lines=s.lyrics||[]; const on=duetOn(); if(_duetCache.lines===lines && _duetCache.on===on && _duetCache.sid===s.id) return _duetCache.map;
  let map=null;
  if(on){ const mainK=normKey(s.artist||""), names={}, order=[], memo={};
    const keysFor=(sec)=>{ if(!sec) return null; if(memo[sec]!==undefined) return memo[sec]; const info=parseSection(sec,s); const ks=((info&&info.artists)||[]).map(a=>a&&a.name).filter(Boolean).map(n=>{ const k=normKey(n); if(!names[k]){ names[k]=n; order.push(k); } return k; }); return (memo[sec]=ks.length?ks:null); };
    const used=new Set(); lines.forEach(l=>{ if(l.secOnly||!(l.text&&String(l.text).trim())) return; (keysFor(l.sec)||[mainK]).forEach(k=>used.add(k)); });
    if([...used].some(k=>k!==mainK)){
      const colors={}; colors[mainK]="var(--treesh-purple)"; let ci=0; order.forEach(k=>{ if(k!==mainK && !colors[k]) colors[k]=DUET_COLORS[ci++%DUET_COLORS.length]; });
      const legendKeys=[mainK,...order.filter(k=>k!==mainK)].filter(k=>used.has(k));
      map={ mainK, colors, legend:legendKeys.map(k=>({k, name:names[k]||s.artist||"Artist", color:colors[k]})),
        lineVars:(l)=>{ const ks=keysFor(l.sec)||[mainK]; const c1=colors[ks[0]]||colors[mainK]; const c2=ks[1]?(colors[ks[1]]||c1):c1; return {c1,c2,keys:ks}; } };
    } }
  _duetCache={lines, on, sid:s.id, map}; return map; }
function duetAttrs(du,l){ if(!du||!l) return {cls:"", style:""}; const v=du.lineVars(l); return {cls:" k-duo", style:`--kp:${v.c1};--kp2:${v.c2};`}; }
function duetLegendHtml(du){ if(!du) return ""; return du.legend.map(x=>`<span class="kduo-chip" data-duo-k="${esc(x.k)}"><i style="background:${x.color};box-shadow:0 0 10px ${x.color}"></i>${esc(x.name)}</span>`).join(""); }
function karaokeStageHtml(){''')
rep('<div id="kstage-countin" class="kcount"><span></span><span></span><span></span><span></span></div><div id="kstage-scroll" class="kstage-scroll"></div></div></div>`; }',
    '<div id="kstage-countin" class="kcount"><span></span><span></span><span></span><span></span></div><div id="kstage-scroll" class="kstage-scroll"></div><div id="kduo-legend" class="kduo-legend" data-testid="duet-legend"></div></div></div>`; }')
rep('let _karRAF=null, _karSpans=null, _karLineEls=[], _karTimes=[], _karLines=[], _karSongSig="",',
    'let _karLineKeys=[], _karRAF=null, _karSpans=null, _karLineEls=[], _karTimes=[], _karLines=[], _karSongSig="",')
rep("  const sig=(s?s.id:'')+'|'+lines.length;\n  if(sig===_karSongSig && _karLineEls.length===lines.length && scroll.childElementCount){ return true; }",
    "  const sig=(s?s.id:'')+'|'+lines.length+'|'+(duetOn()?1:0);\n  if(sig===_karSongSig && _karLineEls.length===lines.length && scroll.childElementCount){ return true; }")
rep('''  scroll.innerHTML=lines.map((l,i)=>`<div class="k-line${(l.text||"").length>64?" k-long":""}" data-k="${i}">${buildChars(l.text||"")}</div>`).join("");''',
    '''  const du=duetInfo(s);
  scroll.innerHTML=lines.map((l,i)=>{ const da=duetAttrs(du,l); return `<div class="k-line${(l.text||"").length>64?" k-long":""}${da.cls}" data-k="${i}"${da.style?` style="${da.style}"`:""}>${buildChars(l.text||"")}</div>`; }).join("");
  _karLineKeys=du?lines.map(l=>du.lineVars(l).keys):[];
  const lg=document.getElementById("kduo-legend"); if(lg) lg.innerHTML=duetLegendHtml(du);''')
rep('''    const el=_karLineEls[idx]; if(el){ const target=(stage.clientHeight/2)-(el.offsetTop+el.offsetHeight/2); scroll.style.transform="translateY("+target+"px)"; }''',
    '''    const el=_karLineEls[idx]; if(el){ const target=(stage.clientHeight/2)-(el.offsetTop+el.offsetHeight/2); scroll.style.transform="translateY("+target+"px)"; }
    if(_karLineKeys.length){ const ks=_karLineKeys[idx]||[]; document.querySelectorAll("#kduo-legend .kduo-chip").forEach(c=>c.classList.toggle("on", ks.indexOf(c.getAttribute("data-duo-k"))>=0)); }''')
# regular lyrics view
rep('''    <button data-act="${act}" data-t="${l.t}" data-i="${i}" class="np-line select-text block w-full text-left py-1.5 text-2xl font-bold tracking-tight sm:text-3xl leading-snug text-white/40 hover:text-white/70">${esc(l.text)}${inds}</button>''',
    '''    <button data-act="${act}" data-t="${l.t}" data-i="${i}" class="np-line select-text block w-full text-left py-1.5 text-2xl font-bold tracking-tight sm:text-3xl leading-snug text-white/40 hover:text-white/70${_da.cls?" l-duo":""}"${_da.style?` style="${_da.style}"`:""}>${esc(l.text)}${inds}</button>''')
rep("  const act=expandable?'lyric-detail':'lyric-seek';",
    "  const act=expandable?'lyric-detail':'lyric-seek';\n  const _da=duetAttrs(duetInfo(s), l);")
# settings toggle + handler + search
rep("      ${toggleCard('perf-opt-show','perf-show-toggle',perfOpts().show,'eye','Show performer badge','Display the active artist while lyrics play')}",
    "      ${toggleCard('perf-opt-show','perf-show-toggle',perfOpts().show,'eye','Show performer badge','Display the active artist while lyrics play')}\n      <div class=\"mt-2\">${toggleCard('toggle-duet-colors','duet-colors-toggle',duetOn(),'palette','Duet colors','Color each singer\\u2019s lines in lyrics and karaoke')}</div>")
rep('    case "kfs-glow": {',
    '''    case "toggle-duet-colors": { state.duetColors=!duetOn(); LS.set("treesh_duet_colors", state.duetColors); _duetCache={lines:null}; _karSongSig=""; if(state.npOpen) renderNP(); if(state.view==="settings") renderView(); toast(state.duetColors?"Duet colors on":"Duet colors off"); break; }
    case "kfs-glow": {''')
rep("  { id:'crossfade', label:'Crossfade',",
    "  { id:'duet-colors', label:'Duet colors', desc:'Color each singer\\u2019s lines in lyrics and karaoke', kw:'duet colors singers featured artist feature verse karaoke lyrics color who is singing', ic:'palette', type:'toggle', get:()=>duetOn(), toggle:()=>settingsRunAct('toggle-duet-colors') },\n  { id:'crossfade', label:'Crossfade',")
# CSS
rep('  /* ===== Lyric Card Studio: sticky preview + movable lyric block ===== */', '''  /* ===== Duet colors ===== */
  .k-line.k-duo{ color:color-mix(in srgb, var(--kp) 42%, rgba(255,255,255,0.42)); }
  .k-line.k-duo.active .k-char{ color:color-mix(in srgb, var(--kp) 34%, rgba(255,255,255,0.34)); }
  .k-line.k-duo.active .k-char.lit{ color:color-mix(in srgb, var(--kp) 45%, #fff); text-shadow:0 0 16px var(--kp), 0 0 40px var(--kp2); }
  .k-line.k-duo.active .k-char.lit-edge{ color:#fff; text-shadow:0 0 12px var(--kp2); }
  .k-line.k-duo.past .k-char.lit{ color:color-mix(in srgb, var(--kp) 45%, rgba(255,255,255,0.32)); text-shadow:none; }
  html.theme-light .k-line.k-duo{ color:color-mix(in srgb, var(--kp) 55%, rgba(0,0,0,0.45)); }
  html.theme-light .k-line.k-duo.active .k-char{ color:color-mix(in srgb, var(--kp) 40%, rgba(0,0,0,0.35)); }
  html.theme-light .k-line.k-duo.active .k-char.lit{ color:color-mix(in srgb, var(--kp) 72%, #000); text-shadow:0 0 14px color-mix(in srgb, var(--kp) 40%, transparent); }
  [data-np-root].kfs .k-line.k-duo{ color:color-mix(in srgb, var(--kp) 45%, rgba(255,255,255,0.5)); }
  [data-np-root].kfs .k-line.k-duo.active .k-char{ color:color-mix(in srgb, var(--kp) 30%, rgba(255,255,255,0.3)); }
  [data-np-root].kfs .k-line.k-duo.active .k-char.lit{ color:color-mix(in srgb, var(--kp) 40%, #fff); text-shadow:0 0 16px var(--kp), 0 0 44px var(--kp2), 0 0 90px var(--kp2); }
  #np-lyrics .np-line.l-duo{ color:color-mix(in srgb, var(--kp) 50%, rgba(255,255,255,0.36)); }
  #np-lyrics .np-line.l-duo.text-white{ color:color-mix(in srgb, var(--kp) 62%, #fff); text-shadow:0 2px 26px color-mix(in srgb, var(--kp) 55%, transparent) !important; }
  html.theme-light #np-lyrics .np-line.l-duo{ color:color-mix(in srgb, var(--kp) 55%, rgba(0,0,0,0.4)); }
  html.theme-light #np-lyrics .np-line.l-duo.text-white{ color:color-mix(in srgb, var(--kp) 75%, #000); }
  .kduo-legend{ position:absolute; left:0; right:0; bottom:10px; z-index:15; display:flex; flex-wrap:wrap; justify-content:center; gap:6px; padding:0 10px; pointer-events:none; }
  .kduo-legend:empty{ display:none; }
  .kduo-chip{ display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:999px; background:rgba(0,0,0,0.38); border:1px solid rgba(255,255,255,0.12); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); font-size:11px; font-weight:700; color:rgba(255,255,255,0.6); transition:color .3s ease, background-color .3s ease, transform .3s ease, border-color .3s ease; }
  .kduo-chip i{ display:inline-block; width:8px; height:8px; border-radius:999px; }
  .kduo-chip.on{ color:#fff; background:rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.28); transform:scale(1.06); }
  html.theme-light .kduo-chip{ background:rgba(255,255,255,0.7); color:rgba(0,0,0,0.6); border-color:rgba(0,0,0,0.1); }
  html.theme-light .kduo-chip.on{ color:#000; background:#fff; }
  html.theme-light [data-np-root].kfs .kduo-chip{ background:rgba(0,0,0,0.38); color:rgba(255,255,255,0.65); border-color:rgba(255,255,255,0.12); }
  html.theme-light [data-np-root].kfs .kduo-chip.on{ color:#fff; background:rgba(255,255,255,0.14); }

  /* ===== Lyric Card Studio: sticky preview + movable lyric block ===== */''')

# ================= BETTER LYRIC SEARCH =================
rep('function renderFindLyrics(){ const id=state._flId; const s=SONG_BY_ID[id]; if(!s) return; const busy=state._flBusy, res=state._flResults;',
    r'''/* Clean up lrclib results: drop credits/junk, turn [Chorus]/[Verse: Artist] into sections, tidy text, dedupe. */
function cleanFoundLyrics(item){
  const stats={junk:0, sections:0, tidied:0, dupes:0};
  const SEC_WORDS="verse|chorus|hook|pre-?chorus|post-?chorus|bridge|intro|outro|refrain|interlude|breakdown|drop|skit|spoken|outro chorus";
  const raw=[];
  if(item.syncedLyrics){ String(item.syncedLyrics).split(/\r?\n/).forEach(line=>{ const tags=line.match(/\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?\]/g); const text=line.replace(/\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?\]/g,""); if(!tags){ if(text.trim()) raw.push({t:null,text}); return; } tags.forEach(tag=>{ const m=tag.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/); if(m) raw.push({t:parseInt(m[1],10)*60+parseInt(m[2],10)+(m[3]?parseInt((m[3]+"00").slice(0,3),10)/1000:0), text}); }); }); raw.sort((a,b)=>(a.t==null?1e9:a.t)-(b.t==null?1e9:b.t)); }
  else String(item.plainLyrics||"").split(/\r?\n/).forEach(text=>raw.push({t:null,text}));
  const junk=t=>/^(written|produced|composed|lyrics|music|arranged|mixed|mastered|recorded|engineered)\s*(by|:)/i.test(t)||/\b(lrclib|musixmatch|genius|azlyrics|lyricfind|lyricstranslate)\b/i.test(t)||/^(lyrics|source)\s+(from|by|powered|provided)/i.test(t)||/^[\u266a\u266b\u266c\u2669\s\-\u2013\u2014~*.\u00b7\u2022_=#]+$/.test(t)||/^\(?\s*instrumental\s*\)?$/i.test(t)||/^\d+\s*contributors?/i.test(t)||/^you might also like/i.test(t)||/^\d*\s*embed$/i.test(t)||/^see .+ live$/i.test(t);
  const secOf=t=>{ let m=t.match(/^\[(.+)\]$/); if(m&&/[a-z]/i.test(m[1])&&!/^x\s*\d+$/i.test(m[1].trim())) return m[1]; m=t.match(new RegExp("^\\(\\s*(("+SEC_WORDS+")[^)]*)\\)$","i")); if(m) return m[1]; if(t.length<=48){ m=t.match(new RegExp("^(("+SEC_WORDS+")(\\s*\\d+)?)\\s*(?:[:\\-\\u2013\\u2014]\\s*(.+))?:?$","i")); if(m) return m[1]+(m[4]?": "+m[4]:""); } return null; };
  const tidy=t=>{ let x=t.replace(/[\u200b-\u200d\ufeff]/g,"").replace(/\s+/g," ").replace(/\s+([,.!?;:])/g,"$1").trim(); if(!/\.\.\.$|\u2026$/.test(x)) x=x.replace(/[,;.]+$/,""); x=x.replace(/^([^A-Za-z\u00C0-\u024F]*)([a-z\u00E0-\u00FF])/, (m0,p,c)=>p+c.toUpperCase()); return x; };
  const out=[]; let curSec=null, pendingSec=null, prev=null;
  raw.forEach(r=>{ const t0=String(r.text||"").replace(/\s+/g," ").trim(); if(!t0) return; if(junk(t0)){ stats.junk++; return; }
    const sec=secOf(t0); if(sec){ curSec=sec.replace(/\s*[-\u2013\u2014]\s*/," : ").replace(/\s*:\s*/,": ").replace(/\s{2,}/g," ").trim(); pendingSec=curSec; stats.sections++; return; }
    const tx=tidy(t0); if(!tx){ stats.junk++; return; } if(tx!==t0) stats.tidied++;
    if(prev && prev.text===tx && (r.t==null ? prev.t==null : (prev.t!=null && Math.abs(prev.t-r.t)<0.05))){ stats.dupes++; return; }
    const line={text:tx}; if(r.t!=null) line.t=Math.round(r.t*100)/100; if(curSec) line.sec=curSec; out.push(line); prev=line; pendingSec=null; });
  for(let i=1;i<out.length;i++){ if(out[i].t!=null && out[i-1].t!=null && out[i].t<=out[i-1].t) out[i].t=Math.round((out[i-1].t+0.01)*100)/100; }
  if(pendingSec && out.length) out.push({t:(out[out.length-1].t||0)+0.01, text:"", sec:pendingSec, secOnly:true});
  return {lines:out, stats, synced:!!item.syncedLyrics && out.some(l=>l.t!=null)};
}
function flSongDuration(s){ if(!s) return 0; if(s.duration) return +s.duration||0; const c=curSong(); if(c&&c.id===s.id&&state.duration) return state.duration; return 0; }
function flFmtT(t){ if(t==null) return ""; const m=Math.floor(t/60), sec=(t%60); return m+":"+(sec<10?"0":"")+sec.toFixed(1); }
function renderFindLyricsPreview(s){ const pv=state._flPreview; const off=+pv.offset||0;
  const st=pv.stats; const chip=(ic,txt)=>`<span class="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70"><i data-lucide="${ic}" style="width:12px;height:12px"></i>${txt}</span>`;
  const chips=[st.junk?chip("eraser",`Removed ${st.junk} credit/junk line${st.junk!==1?"s":""}`):"", st.sections?chip("list-tree",`Found ${st.sections} section${st.sections!==1?"s":""}`):"", st.tidied?chip("wand-sparkles",`Tidied ${st.tidied} line${st.tidied!==1?"s":""}`):"", st.dupes?chip("copy-minus",`Removed ${st.dupes} duplicate${st.dupes!==1?"s":""}`):""].filter(Boolean).join("")||chip("check","Already clean");
  let lastSec=null; const rows=pv.lines.map(l=>{ let h=""; if(l.sec && l.sec!==lastSec){ h+=`<p class="pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--treesh-purple)]">${esc(l.sec)}</p>`; lastSec=l.sec; } if(l.secOnly) return h; const tt=(pv.synced&&l.t!=null)?flFmtT(Math.max(0,l.t+off)):""; return h+`<div class="flex items-baseline gap-2.5 py-0.5">${pv.synced?`<span class="w-11 shrink-0 font-doto text-[10px] text-white/40">${tt}</span>`:""}<span class="min-w-0 text-sm text-white/85">${esc(l.text)}</span></div>`; }).join("");
  const n=pv.lines.filter(l=>!l.secOnly).length;
  return `<div class="space-y-3" data-testid="find-lyrics-preview">
    <div class="flex items-center gap-2"><button data-act="lyrics-find-back" data-testid="find-lyrics-back" class="press inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"><i data-lucide="arrow-left" style="width:13px;height:13px"></i>Results</button><p class="min-w-0 flex-1 truncate text-right text-[11px] text-white/45">${esc(pv.trackName||s.title)} \u00b7 ${n} lines \u00b7 ${pv.synced?"Synced":"Plain"}</p></div>
    <div class="flex flex-wrap gap-1.5" data-testid="find-lyrics-stats">${chips}</div>
    ${pv.synced?`<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3" data-testid="find-lyrics-offset"><div class="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-white/55"><span>Timing nudge</span><span id="fl-off-val" class="font-doto text-white/80">${off>0?"+":""}${off.toFixed(1)}s</span></div><input id="fl-offset" type="range" min="-5" max="5" step="0.1" value="${off}" data-testid="find-lyrics-offset-slider" class="w-full accent-[color:var(--treesh-purple)]"><div class="mt-1 flex items-center justify-between text-[10px] text-white/35"><span>Lyrics earlier</span><button data-act="lyrics-find-test" data-testid="find-lyrics-test" class="press inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/75 hover:bg-white/15"><i data-lucide="play" style="width:10px;height:10px"></i>Test from first line</button><span>Lyrics later</span></div></div>`:`<p class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] text-white/55">These lyrics aren\u2019t synced yet. Save them, then tap along in Sync mode to time each line.</p>`}
    <div class="max-h-60 overflow-y-auto no-scrollbar rounded-xl border border-white/10 bg-black/20 px-3 py-2" data-testid="find-lyrics-preview-lines">${rows||'<p class="py-4 text-center text-sm text-white/45">Nothing left after cleanup.</p>'}</div>
    <div class="flex gap-2">${pv.synced?"":`<button data-act="lyrics-find-save" data-sync="1" data-testid="find-lyrics-save-sync" class="press flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 py-3 text-sm font-semibold"><i data-lucide="timer" style="width:15px;height:15px"></i>Save &amp; sync now</button>`}<button data-act="lyrics-find-save" data-testid="find-lyrics-save" class="press flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--treesh-purple)] py-3 text-sm font-semibold text-white glow-purple ${n?"":"pointer-events-none opacity-40"}"><i data-lucide="check" style="width:15px;height:15px"></i>Save lyrics</button></div>
  </div>`; }
function renderFindLyrics(){ const id=state._flId; const s=SONG_BY_ID[id]; if(!s) return; const busy=state._flBusy, res=state._flResults;''')

rep('''  else if(Array.isArray(res)){ results=`<div class="space-y-2"><p class="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">${res.length} result${res.length!==1?'s':''}</p><div class="max-h-64 space-y-2 overflow-y-auto no-scrollbar">${res.map((it,i)=>{ const synced=!!it.syncedLyrics; const dur=it.duration?`${Math.floor(it.duration/60)}:${String(Math.round(it.duration%60)).padStart(2,'0')}`:''; return `<div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"><div class="min-w-0 flex-1"><p class="clamp-1 text-sm font-semibold">${esc(it.trackName||s.title)}</p><p class="clamp-1 text-[11px] text-white/45">${esc(it.artistName||"")}${it.albumName?" \\u00B7 "+esc(it.albumName):""}${dur?" \\u00B7 "+dur:""}</p></div>''',
    '''  else if(Array.isArray(res)){ const sd=flSongDuration(s); results=`<div class="space-y-2"><p class="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">${res.length} result${res.length!==1?'s':''}${sd?' \\u00B7 closest length first':''}</p><div class="max-h-64 space-y-2 overflow-y-auto no-scrollbar">${res.map((it,i)=>{ const synced=!!it.syncedLyrics; const dur=it.duration?`${Math.floor(it.duration/60)}:${String(Math.round(it.duration%60)).padStart(2,'0')}`:''; const dd=(sd&&it.duration)?Math.abs(it.duration-sd):null; const lenBadge=dd==null?'':(dd<=3?`<span class="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-400/15 px-1.5 py-0.5 align-middle text-[9px] font-bold text-emerald-300" data-testid="lyrics-length-match-${i}"><i data-lucide="check" style="width:9px;height:9px"></i>Length matches</span>`:`<span class="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 align-middle text-[9px] font-bold text-white/55">${it.duration>sd?'+':'\\u2212'}${Math.round(dd)}s</span>`); return `<div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5" data-testid="lyrics-result-${i}"><div class="min-w-0 flex-1"><p class="clamp-1 text-sm font-semibold">${esc(it.trackName||s.title)}</p><p class="clamp-1 text-[11px] text-white/45">${esc(it.artistName||"")}${it.albumName?" \\u00B7 "+esc(it.albumName):""}${dur?" \\u00B7 "+dur:""}${lenBadge}</p></div>''')
rep('''    ${results}
    <button data-act="ls-open" data-id="${id}" class="press w-full rounded-xl border border-white/12 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10">Write manually instead</button>
  </div>`;
  $("#modal").innerHTML=modalWrap(inner,"find-lyrics-modal"); icons();''',
    '''    ${results}
    <button data-act="ls-open" data-id="${id}" class="press w-full rounded-xl border border-white/12 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10">Write manually instead</button>
  </div>`;
  const body = state._flPreview ? `<div class="space-y-4"><div class="flex items-center gap-2"><span class="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="sparkles" style="width:18px;height:18px"></i></span><div><h3 class="font-display text-base font-bold">Review lyrics</h3><p class="text-xs text-white/45">Cleaned up and ready to save</p></div><button data-act="modal-close" aria-label="Close" data-testid="find-lyrics-close" class="press ml-auto grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10"><i data-lucide="x" style="width:18px;height:18px"></i></button></div>${renderFindLyricsPreview(s)}</div>` : inner;
  $("#modal").innerHTML=modalWrap(body,"find-lyrics-modal"); icons();
  const fo=$("#fl-offset"); if(fo) fo.addEventListener("input",()=>{ if(!state._flPreview) return; state._flPreview.offset=Math.round((+fo.value)*10)/10; const lv=$("#fl-off-val"); if(lv) lv.textContent=(state._flPreview.offset>0?"+":"")+state._flPreview.offset.toFixed(1)+"s"; const box=document.querySelector('[data-testid="find-lyrics-preview-lines"]'); if(box){ const off=state._flPreview.offset; let k=0; const ts=box.querySelectorAll(".font-doto"); state._flPreview.lines.forEach(l=>{ if(l.secOnly) return; const el=ts[k++]; if(el&&l.t!=null) el.textContent=flFmtT(Math.max(0,l.t+off)); }); } });''')
rep('''    // dedupe by track+artist, synced first
    const seen={}; results.sort((a,b)=>(b.syncedLyrics?1:0)-(a.syncedLyrics?1:0));''',
    '''    // dedupe by track+artist; sort by closest length to this song, then synced first
    const sd=flSongDuration(s); const seen={}; results.sort((a,b)=>{ if(sd){ const da=a.duration?Math.abs(a.duration-sd):999, db=b.duration?Math.abs(b.duration-sd):999; const ba=da<=3?0:1, bb=db<=3?0:1; if(ba!==bb) return ba-bb; const sa=a.syncedLyrics?0:1, sb=b.syncedLyrics?0:1; if(sa!==sb) return sa-sb; return da-db; } return (b.syncedLyrics?1:0)-(a.syncedLyrics?1:0); });''')
rep('function openFindLyrics(id){ const s=SONG_BY_ID[id]; if(!s) return; state._flId=id; state._flResults=null; state._flBusy=false;',
    'function openFindLyrics(id){ const s=SONG_BY_ID[id]; if(!s) return; state._flId=id; state._flResults=null; state._flBusy=false; state._flPreview=null;')
rep("function findLyricsApply(idx){ const res=state._flResults; if(!Array.isArray(res)) return; const item=res[idx]; if(!item) return; const id=state._flId; const lines = item.syncedLyrics ? parseLRC(item.syncedLyrics) : (item.plainLyrics ? item.plainLyrics.split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean).map(l=>({text:l})) : []); if(!lines.length){ toast(\"That result has no usable lyrics\"); return; }",
    "function findLyricsApply(idx){ const res=state._flResults; if(!Array.isArray(res)) return; const item=res[idx]; if(!item) return; const c=cleanFoundLyrics(item); if(!c.lines.filter(l=>!l.secOnly).length){ toast(\"That result has no usable lyrics\"); return; } state._flPreview={idx, lines:c.lines, stats:c.stats, synced:c.synced, offset:0, trackName:item.trackName||\"\"}; renderFindLyrics(); }\nfunction findLyricsSave(openSync){ const pv=state._flPreview; if(!pv) return; const id=state._flId; const off=+pv.offset||0; const lines=pv.lines.map(l=>{ const o=Object.assign({},l); if(o.t!=null && pv.synced) o.t=Math.max(0,Math.round((o.t+off)*100)/100); return o; }); const item={syncedLyrics:pv.synced?1:0}; state._flPreview=null; {")
rep('''toast(_ok?(item.syncedLyrics?"Synced lyrics added":"Lyrics added"):"Added, but storage is full", _ok?(s?s.title:""):"Free up space in Settings so lyrics persist"); refreshDynamic(); if(state.npOpen) renderNP(); if(state.lsOpen && state.ls && state.ls.songId===id){ state.ls.items=lsItemsFromSong(s); state.ls.idx=lsFirstUnstamped(); state.ls.mode = state.ls.items.some(it=>it.type==='line'&&it.t!=null)?'sync':'write'; state.ls.dirty=false; renderLS(); } }''',
    '''toast(_ok?(item.syncedLyrics?"Synced lyrics added":"Lyrics added"):"Added, but storage is full", _ok?(s?s.title:""):"Free up space in Settings so lyrics persist"); refreshDynamic(); if(state.npOpen) renderNP(); if(state.lsOpen && state.ls && state.ls.songId===id){ state.ls.items=lsItemsFromSong(s); state.ls.idx=lsFirstUnstamped(); state.ls.mode = state.ls.items.some(it=>it.type==='line'&&it.t!=null)?'sync':'write'; state.ls.dirty=false; renderLS(); } else if(openSync){ setTimeout(()=>{ try{ settingsRunAct('ls-open',{id}); }catch(e){} },120); } } }''')

# handlers
rep('case "lyrics-find-apply":', '''case "lyrics-find-back": { state._flPreview=null; renderFindLyrics(); break; }
    case "lyrics-find-save": { findLyricsSave(t.dataset.sync==="1"); break; }
    case "lyrics-find-test": { const pv=state._flPreview, s2=SONG_BY_ID[state._flId]; if(pv&&s2){ const first=pv.lines.find(l=>!l.secOnly&&l.t!=null); const c=curSong(); if(!c||c.id!==s2.id) playSong(s2,[s2]); const at=Math.max(0,(first?first.t:0)+(+pv.offset||0)-1.5); setTimeout(()=>{ try{ seekTo(at); if(audio.paused) audio.play().catch(()=>{}); }catch(e){} },c&&c.id===s2.id?0:600); toast("Playing from the first line","Adjust the nudge until lyrics line up"); } break; }
    case "lyrics-find-apply":''')

open(P, "w", encoding="utf-8").write(s)
print("OK")
