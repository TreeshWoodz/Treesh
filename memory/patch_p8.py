import re, shutil, sys
P='/app/single_html/index.html'; M='/app/memory/'
DRY='--dry' in sys.argv
s=open(P,encoding='utf-8').read()
if not DRY: shutil.copy(P, M+'index.before_p8.html')
errs=[]
def rep(old,new,cnt=1,tag=''):
    global s
    n=s.count(old)
    if n!=cnt: errs.append(f'[{tag}] expected {cnt} got {n}: {old[:90]!r}'); return
    s=s.replace(old,new)
TOP=re.compile(r'\n(?=function |async function |const |let |var |/\*)')
def drop_fn(name):
    global s
    key='\nfunction '+name+'('
    if s.count(key)!=1: errs.append(f'[drop] {name} count {s.count(key)}'); return
    a=s.index(key)+1; m=TOP.search(s,a+10); b=m.start()+1
    chunk=s[a:b]
    if not chunk.rstrip().endswith('}'): errs.append(f'[drop] {name} bad end {chunk[-80:]!r}'); return
    s=s[:a]+s[b:]
def slice_rep(start,end,new,tag):
    global s
    if s.count(start)!=1: errs.append(f'[{tag}] start count {s.count(start)}'); return
    a=s.index(start); b=s.find(end,a)
    if b<0: errs.append(f'[{tag}] end missing'); return
    s=s[:a]+new+s[b+len(end):]

# ---- Image Studio: old engine out (p8a replaces it)
slice_rep('const CV_FILTERS=[','];\n','','cvfilters')
for fn in ['cvFilterString','cvClampRot','cvFmt','cvRender','cvDraw','cvTeardown','cvSliderHtml','openCoverStudio','cvWire','cvReset','cvApply','cvApplyOpts',
           'mkRenderChrome','mkAfterRender','mkWidgetHtml','mkReactLoop','mkPackHtml','mkMotionNewHtml']:
    drop_fn(fn)
rep(r"""data-testid="${_lh.tid}-layer-${i}" style="pointer-events:auto;width:max-content;${cvLayerStyle(L,w)}"><span class="bd-ptext-inner">${esc((L.text||'').trim()?L.text:'\u00A0')}</span>""",
    r"""data-testid="${_lh.tid}-layer-${i}" style="pointer-events:auto;width:max-content;${cvLayerStyle(L,w)}">${L.kind==='img'?`<img src="${esc(L.src||'')}" alt="" draggable="false" style="display:block;width:2.4em;height:auto;pointer-events:none">`:`<span class="bd-ptext-inner">${esc((L.text||'').trim()?L.text:'\u00A0')}</span>`}""",1,'layerimg')

# ---- profile photo / banner -> Image Studio everywhere
rep('const file=$("#ob-file"); if(file) file.addEventListener("change",e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ onboard.avatar=r.result; renderOnboarding(); }; r.readAsDataURL(f); });',
    'const file=$("#ob-file"); if(file) file.addEventListener("change",e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=""; if(!f) return; pfPickAvatar(f,d=>{ onboard.avatar=d; renderOnboarding(); }); });',1,'obfile')
rep('<input type="file" accept="image/*" class="hidden" id="ob-file"></label></div>',
    '<input type="file" accept="image/*" class="hidden" id="ob-file"></label></div>${onboard.avatar?`<button type="button" data-act="ob-avatar-edit" data-testid="ob-avatar-edit" class="press inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"><i data-lucide="wand-sparkles" style="width:15px;height:15px"></i>Edit in Image Studio</button>`:""}',1,'obedit')
rep('Change photo<input type="file" accept="image/*" class="hidden" id="set-avatar-input" data-testid="settings-avatar-input"></label>',
    'Change photo<input type="file" accept="image/*" class="hidden" id="set-avatar-input" data-testid="settings-avatar-input"></label>${avSrc?`<button type="button" data-act="pf-avatar-edit" data-testid="profile-avatar-edit" class="press mb-1 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"><i data-lucide="wand-sparkles" style="width:13px;height:13px"></i>Edit photo</button>`:""}',1,'pfedit')
rep('${banner?`<button data-act="mk-pf-banner-remove"',
    '${banner?`<button type="button" data-act="pf-banner-edit" data-testid="profile-banner-studio" class="pf-bubble press inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold"><i data-lucide="wand-sparkles" style="width:15px;height:15px"></i>Edit</button>`:""}${banner?`<button data-act="mk-pf-banner-remove"',1,'banedit')

# ---- Music Manager
rep('    case "manage-uploads": openAddMusic(\'manage\'); break;','    case "manage-uploads": closeModal(); openMusicManager(); break;',1,'manage')
rep('    case "am-tab": amSwitchTab(t.dataset.val); break;','    case "am-tab": if(t.dataset.val===\'manage\'){ closeModal(); setTimeout(openMusicManager,120); } else amSwitchTab(t.dataset.val); break;',1,'amtab')
rep("function openAddMusic(tab, editId){\n","function openAddMusic(tab, editId){\n  if(tab==='manage'&&!editId){ closeModal(); openMusicManager(); return; }\n",1,'openam')
rep('state.profileOpen||state.searchOpen','state.profileOpen||state.umOpen||state.searchOpen',1,'overlays')

# ---- Edit track: full-screen polish
rep('  return `<div id="am-glow" class="te-glow"></div>\n  <header class="te-head"><button type="button" data-act="modal-close" aria-label="Close" data-testid="custom-studio-close" class="te-x press"><i data-lucide="x"></i></button><div class="min-w-0 flex-1"><p class="st-eyebrow">Edit track</p><h2 class="te-title clamp-1" data-testid="te-title">${esc(ed.title||\'Untitled\')}</h2></div>',
    '  return `<div id="am-glow" class="te-glow"></div><div class="te-hero-bg" aria-hidden="true">${o.hasCover?`<img src="${esc(ed.coverArt)}" alt="">`:\'\'}</div>\n  <header class="te-head"><button type="button" data-act="modal-close" aria-label="Close" data-testid="custom-studio-close" class="te-x press"><i data-lucide="x"></i></button><span class="te-thumb" data-testid="te-thumb">${o.hasCover?`<img src="${esc(ed.coverArt)}" alt="">`:\'<i data-lucide="music-2"></i>\'}</span><div class="min-w-0 flex-1"><p class="st-eyebrow">Edit track</p><h2 class="te-title clamp-1" data-testid="te-title">${esc(ed.title||\'Untitled\')}</h2><p class="te-meta" data-testid="te-meta">${esc(ed.artist||\'You\')}${dur?\' \\u00b7 \'+fmt(dur):\'\'}${lines.length?\' \\u00b7 \'+(pct===100?\'Synced lyrics\':lines.length+\' lyric lines\'):\' \\u00b7 No lyrics yet\'}</p></div>',1,'tehead')

# ---- swipe-down: Magic Markup sheet + Music Manager too
rep("const HEAD='.pm-grab,.pf-grab,.pm-head,.pm-song,.st-head,.te-head,.te-tabs,[data-sheet-drag]';","const HEAD='.pm-grab,.pf-grab,.pm-head,.pm-song,.st-head,.te-head,.te-tabs,.mk-sheet-head,.mk-sheet-grab,.um-head-top,[data-sheet-drag]';",1,'swhead')
rep("S=null; if(window.innerWidth>=640||e.touches.length!==1) return;","S=null; if(window.innerWidth>=1024||e.touches.length!==1) return;",1,'swwidth')
rep("const p=t.closest('.pm-panel,#profile-panel'); if(!p) return;","const p=t.closest('.pm-panel,#profile-panel,.mk-sheet,.um-panel'); if(!p) return;",1,'swpanel')
rep("function sheetClose(p){ if(p.id==='profile-panel'){ closeProfile(true); return; }","function sheetClose(p){ if(p.id==='profile-panel'){ closeProfile(true); return; } if(p.classList.contains('mk-sheet')){ state.mkSheet=null; mkRenderSheet(); return; } if(p.classList.contains('um-panel')){ closeMusicManager(true); return; }",1,'swclose')

# ---- Magic Markup hooks
rep("const w=cfg.w||b.w||'full', surf=cfg.surf||(isCv?'glass':'default'), h=cfg.h||(isCv?240:0);",
    "const w=cfg.w||b.w||'full', surf=cfg.surf||(isCv?'glass':((b.kind!=='widget'&&(mkPage(page).theme||{}).surf)||'default')), h=cfg.h||(isCv?240:0);",1,'mksurf')
rep('<div class="mk-inner${ist&&!isCv?\' soft-scroll\':\'\'}" style="${ist}">${inner}</div>','<div class="mk-inner${ist&&!isCv?\' soft-scroll\':\'\'}" style="${ist}">${inner}</div>${!isCv&&!hid?mkSecLayer(P,b.id):\'\'}',1,'mkseclayer')
rep('return `<div class="mk-page${edit?\' mk-editing\':\'\'}" data-mk-page="${page}"','return `<div class="mk-page${edit?\' mk-editing\':\'\'}${mkThemeCls(P)}" style="${mkThemeStyle(P)}" data-mk-page="${page}"',1,'mkpage')
rep("${edit&&state.mkStSel===s.id?' mk-st-sel':''}\" data-mk-st=","${edit&&state.mkStSel===s.id?' mk-st-sel':''}${s.locked?' mk-st-locked':''}\" data-mk-st=",1,'mklockcls')
rep("  const cv=(state.mkSel&&P.canvases.some(c=>c.id===state.mkSel))?state.mkSel:null; s.cv=cv;\n  if(cv){ s.x=0.5; s.y=0.5; } else { const pg=document.querySelector('#view [data-mk-page]'); const r=pg.getBoundingClientRect(); s.x=0.5; s.y=Math.max(40,Math.round(window.innerHeight*0.42-r.top)); }",
    "  const h0=mkStHost(P); const cv=h0.id; s.cv=cv; s.x=h0.x; s.y=h0.y;",1,'mkaddst')
rep("toast('Sticker added', cv?'Placed on your canvas':'Drag it anywhere on the page'); }","toast('Sticker added', cv?'Locked to this section. Drag it anywhere':'Drag it anywhere on the page'); }",1,'mkaddtoast')
rep('<p class="mk-lbl mt-4">Pull in from other pages</p><div class="space-y-1.5">${Object.entries(MK_WIDGETS).filter(([k])=>!MK_LIVE.includes(k)).map(',
    '<p class="mk-lbl mt-4">Make it yours</p>${mkFunAddHtml(have)}<p class="mk-lbl mt-4">Pull in from other pages</p><div class="space-y-1.5">${Object.entries(MK_WIDGETS).filter(([k])=>!MK_LIVE.includes(k)&&!MK_FUN.includes(k)).map(',1,'mkaddfun')
rep('body=`${wd?`<p class="mk-hint">Pulled in from ${MK_WIDGETS[wd.type].from}.</p>`:\'\'}','body=`${wd?mkWCfgHtml(wd):\'\'}',1,'mkwcfg')
rep("<div class=\"mk-field mb-3\"><p class=\"mk-lbl\">Move to the beat</p>${mkSeg('mk-st-motion',mkMotion(s),MK_MOTIONS,'mk-st-motion')}",
    "${mkStPinHtml(s)}<div class=\"mk-field mb-3\"><p class=\"mk-lbl\">Move to the beat</p>${mkSeg('mk-st-motion',mkMotion(s),MK_MOTIONS,'mk-st-motion').replace('class=\"mk-seg\"','class=\"mk-seg mk-seg-wrap mk-seg-motion\"')}",1,'mkstpin')
rep("if(P.widgets.some(w=>w.type===type)) return; const id=mkUID('w'); P.widgets.push({id,type});",
    "if(!MK_MULTI.includes(type)&&P.widgets.some(w=>w.type===type)) return; const id=mkUID('w'); P.widgets.push(mkWDefaults({id,type}));",1,'mkaddw')
rep("delete m.pages[page]; mkDropAssets(st);","delete m.pages[page]; mkDropAssets(st); assetDel('mk_bg_'+page).catch(()=>{}); delete _mkImgs['mk_bg_'+page];",1,'mkresetpg')
rep("m.pages={}; m.hidden=[]; m.home='library';","Object.keys(m.pages).forEach(k=>{ assetDel('mk_bg_'+k).catch(()=>{}); delete _mkImgs['mk_bg_'+k]; }); m.pages={}; m.hidden=[]; m.home='library';",1,'mkresetall')
rep("  const host=s.cv?el.closest('[data-mk-canvas]'):el.closest('[data-mk-page]');",
    "  if(s.locked){ state.mkSheet='sticker-edit'; mkRenderSheet(); return; }\n  const host=s.cv?el.closest('[data-mk-canvas],[data-mk-sec-layer]'):el.closest('[data-mk-page]');",1,'mkhost')
rep("if(mode==='move'){ s.x=Math.max(0,Math.min(1,x0+dx/hr.width)); s.y=s.cv?Math.max(0,Math.min(1,y0+dy/hr.height)):Math.max(0,Math.round(y0+dy)); el.style.left=(s.x*100)+'%'; el.style.top=s.cv?(s.y*100)+'%':s.y+'px'; if(!s.cv) mkAutoScroll(ev.clientY); }",
    "if(mode==='move'){ const inC=!!(s.cv&&host.matches('[data-mk-canvas]')); const lo=s.cv&&!inC?-3:0, hi=s.cv&&!inC?4:1; s.x=Math.max(lo,Math.min(hi,x0+dx/hr.width)); s.y=s.cv?Math.max(lo,Math.min(hi,y0+dy/hr.height)):Math.max(0,Math.round(y0+dy)); if(mkS().snap){ s.x=Math.round(s.x*40)/40; s.y=s.cv?Math.round(s.y*40)/40:Math.round(s.y/12)*12; } el.style.left=(s.x*100)+'%'; el.style.top=s.cv?(s.y*100)+'%':s.y+'px'; if(!inC) mkAutoScroll(ev.clientY); }",1,'mkmove')
rep("Math.round(w0*Math.hypot(ev.clientX-cx,ev.clientY-cy)/d0))); mkStApplySize(el,s); }","Math.round(w0*Math.hypot(ev.clientX-cx,ev.clientY-cy)/d0))); if(mkS().snap) s.w=Math.max(24,Math.round(s.w/8)*8); mkStApplySize(el,s); }",1,'mkrs')
rep("if(s.rot>180) s.rot-=360; if(s.rot<-180) s.rot+=360; el.style.setProperty('--rot',s.rot+'deg'); } },","if(mkS().snap) s.rot=Math.round(s.rot/15)*15; if(s.rot>180) s.rot-=360; if(s.rot<-180) s.rot+=360; el.style.setProperty('--rot',s.rot+'deg'); } },",1,'mkrot')
rep("  ()=>{ mkSave(); if(mode==='move'&&!moved){ state.mkSheet='sticker-edit'; }",
    "  ()=>{ if(mode==='move'&&moved&&mkStReparent(s,el)){ mkSave(); renderView(); if(state.mkSheet==='sticker-edit'||state.mkSheet==='layers') mkRenderSheet(); return; } mkSave(); if(mode==='move'&&!moved){ state.mkSheet='sticker-edit'; }",1,'mkend')
rep("  mkRenderChrome(); p7Init(); }\n","  mkRenderChrome(); p7Init(); p8Init(); }\n",1,'init')

if errs:
    print('\n'.join(errs)); sys.exit(1)
js='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p8a.js','p8b.js','p8c.js'])
css='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p8a.css','p8b.css','p8c.css'])
hook='/* ---------- boot hook (called from init) ---------- */'
if s.count(hook)!=1: print('hook count',s.count(hook)); sys.exit(1)
s=s.replace(hook,js+'\n'+hook)
if s.count('</style>\n</head>')!=1: print('style end count',s.count('</style>\n</head>')); sys.exit(1)
s=s.replace('</style>\n</head>','\n'+css+'\n</style>\n</head>')
out='/tmp/index.p8.html' if DRY else P
open(out,'w',encoding='utf-8').write(s); print('ok', out, len(s))
