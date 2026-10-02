import sys, re
P = "/app/single_html/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        print("MISMATCH", n, "for:", old[:160]); sys.exit(1)
    s = s.replace(old, new)

# ---------- 1) generalize layer engine to a "layer host" (_lh) ----------
a = s.index("/* ---- Image Studio layers: text + emoji stickers")
b = s.index("function cvReset(){")
seg = s[a:b]
seg = seg.replace("/* ---- Image Studio layers: text + emoji stickers (drag / pinch / rotate), baked into the export ---- */",
  "/* ---- Shared layer engine (Image Studio + Lyric Card Studio): text + emoji stickers, baked into the export.\n   _lh = active host {layers, sel, boxId, panelId, tid, noun}. ---- */\nlet _lh=null;\nfunction lhBox(){ return _lh?document.getElementById(_lh.boxId):null; }\nfunction lhPanel(){ return _lh?document.getElementById(_lh.panelId):null; }")
seg = seg.replace("(_cv&&_cv.layers)", "(_lh&&_lh.layers)")
seg = seg.replace("_cv&&_cv.layers", "_lh&&_lh.layers")
seg = seg.replace("_cv.layers", "_lh.layers").replace("_cv.sel", "_lh.sel")
seg = seg.replace("if(!_cv)", "if(!_lh)").replace("||!_cv)", "||!_lh)")
seg = seg.replace("document.getElementById('cv-layers')", "lhBox()").replace("document.getElementById('cv-layer-panel')", "lhPanel()")
seg = seg.replace('data-testid="image-studio-', 'data-testid="${_lh.tid}-')
seg = seg.replace("Layers are saved into the final image.", "Layers are saved into the final ${_lh.noun}.")
seg = seg.replace('toast("Limit reached","Up to 10 layers per image")', 'toast("Limit reached","Up to 10 layers per "+_lh.noun)')
assert "_cv" not in seg, [m.start() for m in re.finditer("_cv", seg)][:5]
assert "image-studio" not in seg
s = s[:a] + seg + s[b:]

rep("_cv={ zoom:1, rot:0, panX:0, panY:0, filter:'none', bright:1, contrast:1, sat:1, flip:false, src:src, ownSrc:!!ownSrc, layers:[], sel:null };",
    "_cv={ zoom:1, rot:0, panX:0, panY:0, filter:'none', bright:1, contrast:1, sat:1, flip:false, src:src, ownSrc:!!ownSrc, layers:[], sel:null, boxId:'cv-layers', panelId:'cv-layer-panel', tid:'image-studio', noun:'image' }; _lh=_cv;")
rep("  try{ const ctx=out.getContext('2d'); cvRender(ctx, S); cvBakeLayers(ctx, S)",
    "  try{ const ctx=out.getContext('2d'); cvRender(ctx, S); _lh=_cv; cvBakeLayers(ctx, S)")
rep("  const lp=document.getElementById('cv-layer-panel'); if(lp){ lp.addEventListener('click',cvLayerPanelClick); lp.addEventListener('input',cvLayerPanelInput); }\n  cvRenderLayerPanel();\n}",
    "  const lp=document.getElementById('cv-layer-panel'); if(lp){ lp.addEventListener('click',cvLayerPanelClick); lp.addEventListener('input',cvLayerPanelInput); }\n  _lh=_cv; cvRenderLayerPanel();\n}")

# ---------- 2) modal size ----------
rep('function modalWrap(inner, testid, size){ const mw=size==="lg"?"max-w-lg":size==="xl"?"max-w-xl":"max-w-md";',
    'function modalWrap(inner, testid, size){ const mw=size==="lg"?"max-w-lg":size==="xl"?"max-w-xl":size==="4xl"?"max-w-4xl":"max-w-md";')

# ---------- 3) Lyric Card Studio: host + layout ----------
rep("  CARD_FONTS.forEach(f=>{ if(f.g) loadGoogleFont(f.g); });\n  const selCount=(st.picked||[]).length;",
    "  CARD_FONTS.forEach(f=>{ if(f.g) loadGoogleFont(f.g); });\n  if(!st.lay) st.lay={layers:[], sel:null}; Object.assign(st.lay,{boxId:'lc-layers', panelId:'lc-layer-panel', tid:'lyric-card', noun:'card'}); _lh=st.lay;\n  if(st.lyricMove==null) st.lyricMove=false; if(st.lyricDX==null) st.lyricDX=0; if(st.lyricDY==null) st.lyricDY=0;\n  const selCount=(st.picked||[]).length;")

old_inner_start = '''    <div id="lyric-studio-scroll" class="max-h-[76vh] space-y-4 overflow-y-auto no-scrollbar pr-1">
      <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/40"><canvas id="lyric-canvas" width="1080" height="1080" class="block w-full"></canvas></div>
      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Background</p>'''
new_inner_start = '''    <div id="lyric-studio-scroll" class="max-h-[80vh] overflow-y-auto no-scrollbar pr-1 sm:grid sm:grid-cols-[minmax(0,380px)_minmax(0,1fr)] sm:items-start sm:gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div class="lc-sticky sticky top-0 z-20 pb-3 sm:pb-0" data-testid="lyric-card-preview">
        <div class="relative mx-auto w-full max-w-[min(100%,40vh)] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_18px_50px_rgba(0,0,0,0.45)] sm:max-w-none">
          <canvas id="lyric-canvas" width="1080" height="1080" class="block w-full"></canvas>
          <div id="lc-lyric-box" data-testid="lyric-card-lyric-box" class="lc-lyric-box ${st.lyricMove?'':'hidden'}"><span class="lc-lyric-tag"><i data-lucide="move" style="width:11px;height:11px"></i>Lyrics</span></div>
          <div id="lc-layers" data-testid="lyric-card-layers" class="pointer-events-none absolute inset-0"></div>
        </div>
        <p class="mt-2 hidden items-center justify-center gap-1.5 text-[11px] text-white/40 sm:flex"><i data-lucide="eye" style="width:12px;height:12px"></i>Live preview \\u00b7 drag layers to move them</p>
        <div class="mt-2.5 hidden gap-2 sm:flex">
          <button data-act="card-download" data-testid="card-download-side" class="press flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 py-2.5 text-sm font-bold ${cardN?'':'pointer-events-none opacity-40'}"><i data-lucide="download" style="width:16px;height:16px"></i>Download</button>
          <button data-act="card-share" data-testid="card-share-side" class="press flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--treesh-purple)] py-2.5 text-sm font-bold glow-purple ${cardN?'':'pointer-events-none opacity-40'}"><i data-lucide="share-2" style="width:16px;height:16px"></i>Share</button>
        </div>
      </div>
      <div class="min-w-0 space-y-4 pt-1 sm:pt-0">
      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Lyrics on card</p>${tabsUi}${over?`<p class="mb-2 rounded-lg border border-[color:var(--treesh-gold)]/25 bg-[color:var(--treesh-gold)]/10 px-2.5 py-1.5 text-[11px] text-[color:var(--treesh-gold)]">Cards show up to 6 lines, so only the first 6 are used.</p>`:''}<div class="space-y-1.5">${lineList}</div></div>
      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Lyric position</p><div class="flex flex-wrap items-center gap-2"><button data-act="card-lyric-move" data-testid="card-lyric-move" aria-pressed="${!!st.lyricMove}" class="press inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${st.lyricMove?'bg-[color:var(--treesh-purple)] text-white':'bg-white/5 text-white/60 hover:bg-white/10'}"><i data-lucide="${st.lyricMove?'move':'lock'}" style="width:14px;height:14px"></i>${st.lyricMove?'Movable':'Auto-placed'}</button>${(st.lyricDX||st.lyricDY)?`<button data-act="card-lyric-reset" data-testid="card-lyric-reset" class="press inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10"><i data-lucide="rotate-ccw" style="width:13px;height:13px"></i>Reset position</button>`:''}</div><p class="mt-1.5 text-[11px] text-white/40">${st.lyricMove?'Drag the outlined lyric block on the preview.':'Lyrics are centered automatically. Switch to Movable to drag them.'}</p></div>
      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Text &amp; stickers</p><div id="lc-layer-panel" data-testid="lyric-card-layer-panel"></div></div>
      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Background</p>'''
rep(old_inner_start, new_inner_start)
rep('''      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Cover art badge</p>${thumbCtl}<p class="mt-1.5 text-[11px] text-white/40">Small cover art beside the title. Shape applies to this badge only.</p></div>
      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Lyrics on card</p>${tabsUi}${over?`<p class="mb-2 rounded-lg border border-[color:var(--treesh-gold)]/25 bg-[color:var(--treesh-gold)]/10 px-2.5 py-1.5 text-[11px] text-[color:var(--treesh-gold)]">Cards show up to 6 lines, so only the first 6 are used.</p>`:''}<div class="space-y-1.5">${lineList}</div></div>
      <div class="flex gap-2 pt-1">''',
    '''      <div><p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Cover art badge</p>${thumbCtl}<p class="mt-1.5 text-[11px] text-white/40">Small cover art beside the title. Shape applies to this badge only.</p></div>
      <div class="flex gap-2 pt-1 sm:hidden">''')
rep('''<i data-lucide="share-2" style="width:16px;height:16px"></i>Share</button>
      </div>
    </div>
  </div>`;
  $("#modal").innerHTML=modalWrap(inner,"lyric-studio","lg"); icons();''',
    '''<i data-lucide="share-2" style="width:16px;height:16px"></i>Share</button>
      </div>
      </div>
    </div>
  </div>`;
  $("#modal").innerHTML=modalWrap(inner,"lyric-studio","4xl"); icons();
  const lcp=document.getElementById('lc-layer-panel'); if(lcp){ lcp.addEventListener('click',cvLayerPanelClick); lcp.addEventListener('input',cvLayerPanelInput); }
  cvRenderLayerPanel(); requestAnimationFrame(()=>{ if(_lh===st.lay) cvRenderLayers(); }); lcWireLyricBox();''')

# ---------- 4) drawLyricCard: movable lyric block ----------
rep('''    ctx.textBaseline='top'; let y=topY + Math.max(0,(availH-lay.h)/2);
    if(st.bgMode==='cover'){ ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=16; ctx.shadowOffsetY=2; }
    lay.out.forEach(it=>{''',
    '''    ctx.textBaseline='top'; let y=topY + Math.max(0,(availH-lay.h)/2);
    const ldx=+st.lyricDX||0, ldy=+st.lyricDY||0;
    let lbW=0; lay.out.forEach(it=>{ if(it.t==='gap') return; ctx.font=`${it.t==='label'?700:800} ${it.fs}px ${LF}, sans-serif`; lbW=Math.max(lbW, ctx.measureText(it.x).width); });
    st._lb={x:padX+ldx, y:y+ldy, w:Math.max(60,lbW), h:Math.max(40,lay.h)};
    ctx.save(); ctx.translate(ldx, ldy);
    if(st.bgMode==='cover'){ ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=16; ctx.shadowOffsetY=2; }
    lay.out.forEach(it=>{''')
rep('''    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.textBaseline='alphabetic';
    let txx=padX;''',
    '''    ctx.restore(); lcSyncLyricBox();
    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.textBaseline='alphabetic';
    let txx=padX;''')

# ---------- 5) export with baked layers ----------
rep('''function cardBlob(cb){ const cv=$("#lyric-canvas"); if(!cv){ cb(null); return; } try{ cv.toBlob(b=>cb(b), "image/png"); }catch(e){ cb(null); } }''',
    '''function cardBlob(cb){ const cv=$("#lyric-canvas"); if(!cv){ cb(null); return; }
  const host=state.studio&&state.studio.lay; const has=host&&(host.layers||[]).some(L=>(L.text||'').trim());
  if(!has){ try{ cv.toBlob(b=>cb(b), "image/png"); }catch(e){ cb(null); } return; }
  try{ const out=document.createElement('canvas'); out.width=cv.width; out.height=cv.height; const ctx=out.getContext('2d'); ctx.drawImage(cv,0,0); _lh=host;
    cvBakeLayers(ctx, cv.width).catch(()=>{}).then(()=>{ try{ out.toBlob(b=>cb(b), "image/png"); }catch(e){ cb(null); } }); }catch(e){ cb(null); } }
/* Lyric block outline (optional movable lyrics) */
function lcSyncLyricBox(){ const st=state.studio, el=document.getElementById('lc-lyric-box'); if(!st||!el||!st._lb) return; el.classList.toggle('hidden',!st.lyricMove); const W=1080, b=st._lb, pad=18;
  el.style.left=((b.x-pad)/W*100)+'%'; el.style.top=((b.y-pad)/W*100)+'%'; el.style.width=((b.w+pad*2)/W*100)+'%'; el.style.height=((b.h+pad*2)/W*100)+'%'; }
function lcWireLyricBox(){ const el=document.getElementById('lc-lyric-box'); if(!el) return; let on=false, sx=0, sy=0, bx=0, by=0, raf=0;
  el.addEventListener('pointerdown',e=>{ const st=state.studio; if(!st||!st.lyricMove) return; e.preventDefault(); on=true; sx=e.clientX; sy=e.clientY; bx=+st.lyricDX||0; by=+st.lyricDY||0; try{ el.setPointerCapture(e.pointerId); }catch(_){} el.classList.add('lc-dragging'); });
  el.addEventListener('pointermove',e=>{ const st=state.studio; if(!on||!st) return; const r=el.parentElement.getBoundingClientRect(); const k=1080/Math.max(1,r.width);
    st.lyricDX=Math.max(-90,Math.min(560,Math.round(bx+(e.clientX-sx)*k))); st.lyricDY=Math.max(-200,Math.min(260,Math.round(by+(e.clientY-sy)*k)));
    if(!raf) raf=requestAnimationFrame(()=>{ raf=0; drawLyricCard(); }); e.preventDefault(); });
  const end=()=>{ if(!on) return; on=false; el.classList.remove('lc-dragging'); };
  el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end); }''')

# ---------- 6) handlers ----------
rep('    case "card-download": downloadLyricCard(); break;',
    '''    case "card-lyric-move": { if(state.studio){ state.studio.lyricMove=!state.studio.lyricMove; openLyricStudio(state.studio.songId); } break; }
    case "card-lyric-reset": { if(state.studio){ state.studio.lyricDX=0; state.studio.lyricDY=0; openLyricStudio(state.studio.songId); } break; }
    case "card-download": downloadLyricCard(); break;''')

# ---------- 7) CSS ----------
rep('  /* ===== Karaoke fullscreen stage ===== */', '''  /* ===== Lyric Card Studio: sticky preview + movable lyric block ===== */
  .lc-sticky{ background:linear-gradient(180deg, rgba(16,13,24,0.96) 0%, rgba(16,13,24,0.92) 88%, rgba(16,13,24,0) 100%); }
  html.theme-light .lc-sticky{ background:linear-gradient(180deg, rgba(246,245,250,0.97) 0%, rgba(246,245,250,0.93) 88%, rgba(246,245,250,0) 100%); }
  @media (min-width:640px){ .lc-sticky, html.theme-light .lc-sticky{ background:none; } }
  .lc-lyric-box{ position:absolute; z-index:5; border:2px dashed rgba(255,255,255,0.7); border-radius:14px; cursor:grab; touch-action:none; box-shadow:0 0 0 9999px rgba(0,0,0,0.0); transition:border-color .2s ease, background-color .2s ease; }
  .lc-lyric-box:hover, .lc-lyric-box.lc-dragging{ border-color:var(--treesh-purple); background:rgba(255,255,255,0.04); }
  .lc-lyric-box.lc-dragging{ cursor:grabbing; }
  .lc-lyric-tag{ position:absolute; left:8px; top:-11px; display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; background:var(--treesh-purple); color:#fff; font-size:10px; font-weight:700; letter-spacing:.04em; pointer-events:none; }

  /* ===== Karaoke fullscreen stage ===== */''')

open(P, "w", encoding="utf-8").write(s)
print("OK")
