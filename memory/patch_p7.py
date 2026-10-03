import re, shutil, sys
P='/app/single_html/index.html'; M='/app/memory/'
s=open(P,encoding='utf-8').read()
shutil.copy(P, M+'index.before_p7.html')
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

# ---- old defs replaced by p7 versions
for fn in ['viewArtists','viewArtistDetail','renderProfile','profileInnerHtml','gameThingsHtml','thingsSectionHtml','mkReactLoop','manageUploadsHtml','pfSetBanner']:
    drop_fn(fn)

# ---- nav
rep("const active=state.view===v || (v==='studios' && state.view==='instrum');","const active=navIsActive(v);",1,'navItem')
rep('${mkNav(NAV).map(n=>navItem(n[0],n[1],n[2],true)).join("")}</div>','${navMobileHtml()}</div>',1,'mobnav')
# ---- views
rep('    case "artist": html=viewArtistDetail(); break;','    case "artist": html=viewArtistDetail(); break;\n    case "model": html=viewModelDetail(); break;',1,'route')
rep("const hero=settingsProfileHtml(editing);","const hero=settingsHeadHtml();",1,'hero')
rep("   ${glThemesHtml(tab)}\n","   ${glThemesHtml(tab)}\n   ${npSettingsHtml(tab)}\n",1,'npset')
# avatar input in renderView -> Image Studio
m=re.search(r'const ai=\$\("#set-avatar-input"\); if\(ai\)\{ ai\.addEventListener\("change",e=>\{ const f=e\.target\.files&&e\.target\.files\[0\]; if\(!f\) return;[^\n]*?r\.readAsDataURL\(f\); \}\); \}',s)
if m: s=s[:m.start()]+'const ai=$("#set-avatar-input"); if(ai&&!ai._pfw){ ai._pfw=1; ai.addEventListener("change",e=>{ const f=e.target.files[0]; if(!f) return; e.target.value=""; pfPickAvatar(f,d=>{ state._tmpAvatar=d; const av=$("#set-avatar"); if(av) av.innerHTML=img(d,"h-full w-full object-cover"); }); }); }'+s[m.end():]
else: errs.append('[avatar] regex miss')
# ---- profile handlers
m=re.search(r'    case "settings-edit-profile": \{[^\n]*\n',s)
if m:
    line=m.group(0)
    if 'renderView();' in line: s=s.replace(line,line.replace('renderView();','if(!state.profileOpen&&state.settingsEditProfile) openProfile(); else pfRerender();',1))
    else: errs.append('[sep] no renderView')
else: errs.append('[sep] miss')
rep('toast("Profile saved"); renderShell(); renderView(); renderSidebarLibrary();','toast("Profile saved"); renderShell(); renderView(); renderSidebarLibrary(); if(state.profileOpen) renderProfile();',1,'saveprof')
rep("go:()=>{ state.settingsEditProfile=true; goSettingSection('account','Edit profile'); } }","go:()=>{ closeSearch(); state.settingsEditProfile=true; setTimeout(()=>openProfile(),220); } }",1,'goprof')
rep("case 'mk-pf-banner-remove': pfStashDraft(); assetDel('profile_banner').catch(()=>{}); state.profileBanner=''; renderView(); toast('Banner removed'); break;","case 'mk-pf-banner-remove': pfStashDraft(); assetDel('profile_banner').catch(()=>{}); state.profileBanner=''; pfRerender(); toast('Banner removed'); break;",1,'banrm')

# ---- Now Playing
rep('<div data-np-root data-testid="now-playing" class="fixed inset-0 z-[60] overflow-hidden bg-[#08080a] ','<div data-np-root data-testid="now-playing" data-cover-bg="${npCoverBg()}" style="${npVars(pal)}" class="np-x fixed inset-0 z-[60] overflow-hidden bg-[#08080a] ${npCoverBg()?\'dark-surface\':\'\'} ',1,'nproot')
slice_rep('    <div class="np-bg absolute inset-0 overflow-hidden">',"rgba(0,0,0,0.28),rgba(0,0,0,0.4) 55%,rgba(0,0,0,0.6)'})\"></div></div>",'    ${npBgHtml(s,_lt)}','npbg')
m=re.search(r'\n    : `<div data-act="toggle-vinyl" data-testid="np-artwork-toggle"[^\n]*\n',s)
if m: s=s[:m.start()]+'\n    : npArtHtml(s,pal);\n'+s[m.end():]
else: errs.append('[npart] miss')
rep('${artwork}<div class="w-full max-w-[460px] px-3 text-center lg:px-0 lg:text-left">${titleBlock}</div></div>','${artwork}<div class="w-full max-w-[460px] px-3 text-center lg:px-0 lg:text-left">${titleBlock}${npPeekHtml(s)}</div></div>',1,'peek')
rep('<div class="flex items-center justify-between"><button data-act="np-close"','<div class="relative flex items-center justify-between"><button data-act="np-close"',1,'nphead')
SH='<button data-act="np-share" aria-label="Share" class="press grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/85 hover:bg-white/10"><i data-lucide="share-2" style="width:18px;height:18px"></i></button>'
rep('<p class="font-display text-xs uppercase tracking-[0.25em] text-white/70">Now Playing</p>'+SH+'</div>','<p class="pointer-events-none absolute left-1/2 -translate-x-1/2 font-display text-xs uppercase tracking-[0.25em] text-white/70">Now Playing</p><div class="flex items-center gap-2"><button data-act="np-coverbg" aria-label="Cover art background" aria-pressed="${npCoverBg()}" data-testid="np-coverbg-toggle" title="${npCoverBg()?\'Switch to moving aura\':\'Use cover art as background\'}" class="press grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/85 hover:bg-white/10"><i data-lucide="${npCoverBg()?\'sparkles\':\'image\'}" style="width:18px;height:18px"></i></button>'+SH+'</div></div>',1,'npshare')

# ---- song menu + metadata
rep("${it('m-add-pl','list-music','Add to playlist',{chev:true})}","${it('m-add-pl','list-music','Add to playlist',{chev:true})}${it('m-info','info','Song info',{chev:true})}",1,'minfo')
rep('<div class="mt-1 max-h-[68vh] overflow-y-auto no-scrollbar pr-1">','<div class="pm-meta-scroll mt-1 overflow-y-auto soft-scroll overscroll-contain pr-1">',1,'metascroll')
rep('$("#modal").innerHTML=modalWrap(inner,"now-playing-metadata-modal"); icons();','$("#modal").innerHTML=modalWrap(inner,"now-playing-metadata-modal"); icons(); { const pp=document.querySelector("#modal .pm-panel"); if(pp) pp.classList.add("pm-flex"); }',1,'metaflex')

# ---- Image Studio options
rep('function openCoverStudio(src, label, ownSrc){','function openCoverStudio(src, label, ownSrc, opts){ opts=opts||null; const _A=(opts&&opts.aspect)||1, _CW=_A>1.2?1200:720, _CH=Math.round(_CW/_A);',1,'cvsig')
rep("noun:'image' }; _lh=_cv;","noun:'image', opts }; _lh=_cv;",1,'cvopts')
rep('<div class="st-frame relative mx-auto aspect-square w-full max-w-[min(100%,36vh)] md:max-w-[460px]">','<div class="st-frame relative mx-auto w-full ${_A>1.2?\'max-w-[min(100%,680px)]\':\'max-w-[min(100%,36vh)] md:max-w-[460px]\'}${opts&&opts.round?\' overflow-hidden\':\'\'}" style="aspect-ratio:${_A}">',1,'cvframe')
m=re.search(r'(<canvas id="cv-canvas"[^>]*?)width="720" height="720"',s)
if m: s=s[:m.start()]+m.group(1)+'width="${_CW}" height="${_CH}"'+s[m.end():]
else: errs.append('[cvcanvas] miss')
rep('Apply image</button>','${esc((opts&&opts.applyLabel)||\'Apply image\')}</button>',1,'cvapplylbl')
m=re.search(r'function cvRender\(ctx,S\)\{.*?\n\}\n',s,re.S)
if m:
    s=s[:m.start()]+'''function cvRender(ctx,S,H){
  const img=_cvImg; if(!img) return; H=H||S;
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height; if(!iw||!ih) return;
  ctx.save(); ctx.clearRect(0,0,S,H); ctx.fillStyle='#0a0a0c'; ctx.fillRect(0,0,S,H);
  try{ ctx.filter=cvFilterString(); }catch(e){}
  const theta=_cv.rot*Math.PI/180; const rotFactor=Math.abs(Math.cos(theta))+Math.abs(Math.sin(theta));
  const eff=Math.max(S/iw,H/ih)*_cv.zoom*rotFactor;
  const maxX=Math.max(0,(eff*iw-S)/2), maxY=Math.max(0,(eff*ih-H)/2);
  const tx=Math.max(-maxX,Math.min(maxX,_cv.panX*S)), ty=Math.max(-maxY,Math.min(maxY,_cv.panY*H));
  ctx.translate(S/2+tx,H/2+ty); ctx.rotate(theta); ctx.scale(eff*(_cv.flip?-1:1),eff);
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(img,-iw/2,-ih/2,iw,ih); ctx.restore();
}
'''+s[m.end():]
else: errs.append('[cvrender] miss')
n=s.count("cvRender(cv.getContext('2d'), cv.width)")
if n>=1: s=s.replace("cvRender(cv.getContext('2d'), cv.width)","cvRender(cv.getContext('2d'), cv.width, cv.height)")
else: errs.append('[cvdraw] miss')
m=re.search(r'function cvApply\(\)\{\n?\s*',s)
if m: s=s[:m.end()]+"if(_cv&&_cv.opts&&_cv.opts.onApply&&_cvImg){ cvApplyOpts(); return; } "+s[m.end():]
else: errs.append('[cvapply] miss')

# ---- Edit track sheet
rep('  $("#modal").innerHTML=modalWrap(inner,"custom-studio","lg");','  $("#modal").innerHTML=ed?amEditorWrap(amEditorHtml(ed,{genOpts,hasCover,V,exOn})):modalWrap(inner,"custom-studio","lg");',1,'amwrap')

# ---- old grab-only swipe handler (replaced by p7d touch version)
m=re.search(r'/\* phones: drag a sheet down by its grab handle to close it \*/.*?\n(?=\nfunction mkFabPlace)',s,re.S)
if m: s=s[:m.start()]+s[m.end():]
else: errs.append('[oldswipe] miss')

# ---- Magic Markup: stickers + widgets
rep("function mkSrc(s){ const v=s.src||'';","function mkSrc(s){ if(s.pack) return mkPackSrc(s.pack); const v=s.src||'';",1,'mksrc')
rep("return `<div class=\"mk-st${s.react?' mk-react':''}","return `<div class=\"mk-st${mkMotion(s)!=='off'?' mk-react mk-m-'+mkMotion(s):''}",1,'mkstcls')
rep("s.react=!!state.mkReactNew;","if(s.motion==null){ const mn=state.mkMotionNew; s.motion=(mn&&mn!=='auto')?mn:'off'; } s.react=s.motion!=='off';",1,'mkaddst')
rep('    <button type="button" data-act="mk-st-upload" data-testid="mk-sticker-upload"','    ${mkPackHtml()}\n    <button type="button" data-act="mk-st-upload" data-testid="mk-sticker-upload"',1,'mkpack')
rep("${mkSwitch('mk-react-new','','mk-react-new',!!state.mkReactNew,'audio-lines','Dance to the music','New stickers pulse with the beat, like the visualizer')}","${mkMotionNewHtml()}",1,'mkmnew')
rep("<div class=\"mb-3\">${mkSwitch('mk-st-react','','mk-st-react',!!s.react,'audio-lines','Dance to the music','Pulse with the beat while a song plays')}</div>","<div class=\"mk-field mb-3\"><p class=\"mk-lbl\">Move to the beat</p>${mkSeg('mk-st-motion',mkMotion(s),MK_MOTIONS,'mk-st-motion')}<p class=\"mk-hint\">Reacts to the real beat of whatever is playing.</p></div>",1,'mkstm')
rep("    case 'mk-fab-reset':","    case 'mk-motion-new': state.mkMotionNew=val; mkRenderSheet(); break;\n    case 'mk-st-motion': mkStSet({motion:val,react:val!=='off'}); break;\n    case 'mk-add-pack': { const p=MK_PACK.find(x=>x.id===val); if(p){ const mn=state.mkMotionNew; mkAddSticker({id:mkUID('s'),kind:'img',pack:val,w:150,motion:(mn&&mn!=='auto')?mn:p.m}); } break; }\n    case 'mk-fab-reset':",1,'mkacts')
rep("case 'mk-fab-reset': delete mkS().fabPos; mkSave(); mkFabPlace(); mkRenderSheet(); toast('Wand moved back'); break;","case 'mk-fab-reset': delete mkS().fabPos; mkSave(); mkFabPlace(); mkRenderSheet(); if(state.view==='settings') renderView(); toast('Wand moved back'); break;",1,'fabreset')
rep("Keep the Magic Markup button on screen. Drag it anywhere')}</div>","Keep the Magic Markup button on screen. Drag it anywhere')}${m.fabPos?'<button data-act=\"mk-fab-reset\" data-testid=\"layout-fab-reset\" class=\"press mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10\"><i data-lucide=\"locate-fixed\" style=\"width:15px;height:15px\"></i>Put the wand back in the corner</button>':''}</div>",1,'setfabreset')
rep("const f={nowplaying:mkWNowPlaying,recent:mkWRecent,icons:mkWIcons,quick:mkWQuick,gamestats:mkWGame}[type];","const f={nowplaying:mkWNowPlaying,recent:mkWRecent,icons:mkWIcons,quick:mkWQuick,gamestats:mkWGame,clock:mkWClock,date:mkWDate,weather:mkWWeather}[type];",1,'mkwmap')
rep('body=`<p class="mk-lbl">Pull in from other pages</p><div class="space-y-1.5">${Object.entries(MK_WIDGETS).map(','body=`<p class="mk-lbl">Live widgets</p>${mkLiveAddHtml(have)}<p class="mk-lbl mt-4">Pull in from other pages</p><div class="space-y-1.5">${Object.entries(MK_WIDGETS).filter(([k])=>!MK_LIVE.includes(k)).map(',1,'mkaddsheet')
rep("toast(MK_WIDGETS[type].label+' added','Pulled in from '+MK_WIDGETS[type].from); }","toast(MK_WIDGETS[type].label+' added',MK_LIVE.includes(type)?'Live on this page':'Pulled in from '+MK_WIDGETS[type].from); if(type==='weather'&&!wxS().loc) setTimeout(wxLocate,450); }",1,'mkaddw')
rep("  mkRenderChrome(); }\n","  mkRenderChrome(); p7Init(); }\n",1,'init')

if errs:
    print('\n'.join(errs)); sys.exit(1)
# ---- inject code + css
js='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p7a.js','p7b.js','p7c.js','p7d.js'])
css='\n'.join(open(M+f,encoding='utf-8').read() for f in ['p7a.css','p7b.css'])
hook='/* ---------- boot hook (called from init) ---------- */'
if s.count(hook)!=1: print('hook count',s.count(hook)); sys.exit(1)
s=s.replace(hook,js+'\n'+hook)
if s.count('</style>\n</head>')!=1: print('style end count',s.count('</style>\n</head>')); sys.exit(1)
s=s.replace('</style>\n</head>','\n'+css+'\n</style>\n</head>')
open(P,'w',encoding='utf-8').write(s); print('ok', len(s))
